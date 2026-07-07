import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

import { Command } from "../types";
import { requirePermission } from "../utils/permissions";
import { WebhookMode } from "../database/types";
import { channelLinksManager } from "../managers";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("link-config")
    .setDescription("Configure a channel link.")
    .addStringOption((option) =>
      option
        .setName("id")
        .setDescription("The link to configure.")
        .setAutocomplete(true)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("channel")
        .setDescription("Which channel to configure.")
        .setAutocomplete(true)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("How messages should appear.")
        .addChoices(
          {
            name: "original user",
            value: "original",
          },
          {
            name: "server name and icon",
            value: "server",
          },
          {
            name: "custom",
            value: "custom",
          },
        )
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("name").setDescription("Custom webhook name."),
    )
    .addStringOption((option) =>
      option.setName("avatar").setDescription("Custom webhook avatar URL."),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (
      !(await requirePermission(
        interaction,
        PermissionFlagsBits.ManageChannels,
      ))
    )
      return;

    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.guildId!;

    const id = interaction.options.getString("id", true);
    const channelId = interaction.options.getString("channel", true);
    const mode = interaction.options.getString("mode", true) as WebhookMode;
    const name = interaction.options.getString("name");
    const avatar = interaction.options.getString("avatar");

    interaction.client.emit("commandExecuted", interaction, "link-config", {
      id,
      channel: `<#${channelId}>`,
      mode,
      name,
      avatar,
    });

    const link = channelLinksManager
      .getLinks(guildId)
      .find((link) => link.id === id);

    if (!link) {
      await interaction.editReply({
        content: "Could not find that channel link.",
      });
      return;
    }

    const side = channelLinksManager.getSide(link, channelId);

    const appearance = {
      mode,
      ...(mode === WebhookMode.CUSTOM && {
        ...(name && { name }),
        ...(avatar && { avatarUrl: avatar }),
      }),
      ...(mode === WebhookMode.SERVER && {
        name: interaction.guild?.name || "Server",
        avatarUrl: interaction.guild?.iconURL() || "",
      }),
    };

    const channel = interaction.guild?.channels.cache.get(channelId);

    const preview = new EmbedBuilder()
      .setTitle("Confirm webhook appearance change")
      .setDescription(
        [
          `**Link:** ${channelLinksManager.formatChannelLinkName(link, interaction.guild)}`,
          `**Channel:** ${channel ? `<#${channel.id}>` : "unknown"}`,
        ].join("\n"),
      )
      .setColor("Blue")
      .setAuthor({
        name:
          appearance.mode === WebhookMode.ORIGINAL
            ? interaction.user.username
            : (appearance.name ?? "Custom webhook"),
        iconURL:
          appearance.mode === WebhookMode.ORIGINAL
            ? interaction.user.displayAvatarURL()
            : appearance.avatarUrl,
      });

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`link-config-confirm:${id}`)
        .setLabel("Confirm")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`link-config-cancel:${id}`)
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Danger),
    );

    await interaction.editReply({
      embeds: [preview],
      components: [buttons],
    });

    const response = await interaction.channel?.awaitMessageComponent({
      filter: (component) =>
        component.user.id === interaction.user.id &&
        (component.customId === `link-config-confirm:${id}` ||
          component.customId === `link-config-cancel:${id}`),
      time: 60_000,
    });

    if (!response) {
      await interaction.editReply({
        content: "Confirmation timed out.",
        embeds: [],
        components: [],
      });
      return;
    }

    if (response.customId === `link-config-cancel:${id}`) {
      await response.update({
        content: "Cancelled.",
        embeds: [],
        components: [],
      });
      return;
    }

    const updated = channelLinksManager.updateLinkSide(guildId, id, side, {
      webhook: {
        appearance,
      },
    });

    if (!updated) {
      await response.update({
        content: "Could not update that channel link.",
        embeds: [],
        components: [],
      });
      return;
    }

    await response.update({
      content: "Webhook appearance updated.",
      embeds: [],
      components: [],
    });
  },

  async autocomplete(interaction) {
    const guildId = interaction.guildId;
    if (!guildId) return;

    const focused = interaction.options.getFocused(true);
    const guild = interaction.guild;

    if (focused.name === "id") {
      const query = focused.value.toLowerCase();

      const choices = channelLinksManager
        .getAutocompleteChoices(guild!)
        .filter((choice) => choice.name.toLowerCase().includes(query))
        .slice(0, 25);

      await interaction.respond(choices);
      return;
    }

    if (focused.name === "channel") {
      const id = interaction.options.getString("id");

      if (!id) {
        await interaction.respond([]);
        return;
      }

      const link = channelLinksManager
        .getLinks(guildId)
        .find((link) => link.id === id);

      if (!link) {
        await interaction.respond([]);
        return;
      }

      const choices = [link.source, link.target]
        .map((channel) => {
          const discordChannel = guild?.channels.cache.get(channel.id);

          return {
            name: discordChannel?.name ?? "unknown",
            value: channel.id,
          };
        })
        .filter((choice) =>
          choice.name.toLowerCase().includes(focused.value.toLowerCase()),
        );

      await interaction.respond(choices);
    }
  },
};

export default command;
