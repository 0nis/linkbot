import {
  Message,
  Events,
  TextChannel,
  ChannelType,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ComponentType,
  EmbedBuilder,
} from "discord.js";

import { BotEvent } from "../handlers/loadEvents";
import {
  channelLinksManager,
  messageBridgeManager,
  webhookManager,
} from "../managers";
import { getDmChannel } from "../database/guildStore";

const event: BotEvent = {
  name: Events.MessageCreate,

  async execute(message: Message) {
    if (message.author.bot) return;
    if (message.webhookId) return;

    if (message.channel.type === ChannelType.DM) {
      await handleDirectMessageCreate(message);
    }

    const guildId = message.guild?.id;
    if (!guildId) return;

    const dmChannelId = getDmChannel(guildId);
    if (message.channel.id === dmChannelId) {
      await handleDMChannelMessageCreate(message, dmChannelId, guildId);
    } else {
      await handleGuildMessageCreate(message, guildId);
    }
  },
};

async function handleGuildMessageCreate(message: Message, guildId: string) {
  const guild = await message.client.guilds.fetch(guildId);
  const links = channelLinksManager.getLinksForChannel(
    guildId,
    message.channel.id,
  );

  for (const link of links) {
    const sourceSide = channelLinksManager.getSide(link, message.channel.id);
    const targetSide = sourceSide === "source" ? "target" : "source";

    const targetChannelData = link[targetSide];
    const targetChannel = await message.client.channels.fetch(
      targetChannelData.id,
    );
    if (!(targetChannel instanceof TextChannel)) continue;

    const webhook = await webhookManager.getOrCreate({
      client: message.client,
      channel: targetChannel,
      guildId,
      link,
      side: targetSide,
    });

    const replyTo = message.reference?.messageId
      ? messageBridgeManager.findMirror(
          message.reference.messageId,
          targetChannel.id,
        )?.mirroredMessageId
      : undefined;

    const sentMessage = await webhookManager.sendMessage({
      webhook,
      message,
      config: targetChannelData.webhook,
      replyToMessage: replyTo
        ? await targetChannel.messages.fetch(replyTo)
        : undefined,
      fallbackAppearance: {
        name: `${guild.name} Staff Team`,
        avatarUrl: guild.iconURL() || "",
      },
    });

    messageBridgeManager.add(message.id, {
      webhookId: webhook.id,
      channelId: targetChannel.id,
      mirroredMessageId: sentMessage.id,
    });

    messageBridgeManager.add(sentMessage.id, {
      webhookId: webhook.id,
      channelId: message.channel.id,
      mirroredMessageId: message.id,
    });
  }
}

async function handleDMChannelMessageCreate(
  message: Message,
  dmChannelId: string,
  guildId: string,
) {
  const dmChannel = await message.client.channels.fetch(dmChannelId);
  if (!dmChannel || !(dmChannel instanceof TextChannel)) return;

  const guild = await message.client.guilds.fetch(guildId);
  if (!guild) return;

  if (message.reference && message.reference.messageId) {
    try {
      const userId = await getFooterValue(message, "User: ");
      if (!userId) return;
      const user =
        message.client.users.cache.get(userId) ??
        (await message.client.users.fetch(userId));
      if (!user) throw new Error("User not found.");

      await user.send({
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: `${guild.name} Staff Team`,
              iconURL: guild.iconURL() || undefined,
            })
            .setDescription(message.content)
            .setFooter({
              text: `Server: ${guild.id}`,
            })
            .setTimestamp(),
        ],
        files: message.attachments.map((a) => a.url),
      });

      response(message, { success: true });
    } catch (err) {
      response(message, { success: false, error: (err as Error)?.message });
    }
  }
}

async function handleDirectMessageCreate(message: Message) {
  const client = message.client;

  if (message.reference && message.reference.messageId) {
    try {
      const serverId = await getFooterValue(message, "Server: ");
      if (!serverId) return;

      const success = await forwardDmToGuild(message, serverId);
      if (!success) throw new Error();

      response(message, {
        success,
        errorMessage: "Failed to forward DM to guild.",
      });
    } catch (err) {
      response(message, {
        success: false,
        errorMessage: "Failed to forward DM to guild.",
        error: (err as Error)?.message,
      });
    }

    return;
  }

  const guilds = [];
  for (const guild of client.guilds.cache.values()) {
    const dmChannel = getDmChannel(guild.id!);
    if (!dmChannel) continue;

    try {
      await guild.members.fetch(message.author.id);
      guilds.push(guild);
    } catch {
      // User isn't in this guild.
    }
  }

  if (guilds.length === 0) {
    await message.reply(
      "You don't share any servers with me that have DM forwarding enabled.",
    );
    return;
  }

  if (guilds.length === 1) {
    const success = await forwardDmToGuild(message, guilds[0].id);

    response(message, {
      success,
      errorMessage: "Failed to forward DM to guild.",
    });

    return;
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId("dm-server")
    .setPlaceholder("Choose a server")
    .addOptions(
      guilds.map((guild) => ({
        label: guild.name,
        value: guild.id,
      })),
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    menu,
  );

  const reply = await message.reply({
    content: "Which server should receive this message?",
    components: [row],
  });

  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 60_000,
  });

  collector.on("collect", async (interaction) => {
    if (interaction.user.id !== message.author.id) {
      await interaction.reply({
        content: "This menu isn't for you.",
        ephemeral: true,
      });
      return;
    }

    collector.stop();

    const guildId = interaction.values[0];

    const success = await forwardDmToGuild(message, guildId);

    await interaction.reply({
      content: success
        ? "Your message has successfully been forwarded to the selected server."
        : "Either DM forwarding is not enabled on this server, or an error occurred. Please contact a server admin!",
      ephemeral: true,
    });
    response(message, { success });
  });

  collector.on("end", async (_, reason) => {
    if (reason === "time") {
      await reply.edit({
        content: "Selection timed out.",
        components: [],
      });
    }
  });
}

async function forwardDmToGuild(
  message: Message,
  guildId: string,
): Promise<boolean> {
  const dmChannel = await message.client.channels.fetch(getDmChannel(guildId)!);

  if (!dmChannel || !(dmChannel instanceof TextChannel)) return false;

  await dmChannel.send({
    embeds: [
      new EmbedBuilder()
        .setAuthor({
          name: message.author.tag,
          iconURL: message.author.displayAvatarURL(),
        })
        .setDescription(message.content)
        .setFooter({
          text: `User: ${message.author.id}`,
        })
        .setTimestamp(),
    ],
    files: message.attachments.map((a) => a.url),
  });

  return true;
}

async function getFooterValue(
  message: Message,
  prefix: string,
): Promise<string | null> {
  if (!message.reference || !message.reference.messageId) return null;

  const footer = await message.channel.messages
    .fetch(message.reference.messageId)
    .then((m) => {
      return m.embeds[0]?.footer?.text;
    })
    .catch(() => null);
  if (!footer) return null;
  if (!footer.startsWith(prefix)) return null;

  return footer.replace(prefix, "");
}

async function response(
  message: Message,
  {
    success,
    successMessage,
    errorMessage,
    error,
  }: {
    success: boolean;
    successMessage?: string;
    errorMessage?: string;
    error?: string;
  },
) {
  if (success) {
    await message.react("✅").catch(() => {});
    if (successMessage) await message.reply(successMessage);
  } else {
    await message.react("❌").catch(() => {});
    if (errorMessage) await message.reply(`${errorMessage}${error || ""}`);
  }
}

export default event;
