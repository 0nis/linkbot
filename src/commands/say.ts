import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  TextChannel,
} from "discord.js";
import { Command } from "../types";
import { requirePermission } from "../utils/permissions";
import { getSayAppearance } from "../database/guildStore";
import { WebhookMode } from "../database/types";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("Say something as the staff team in any channel.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to send the message in."),
    )
    .addStringOption((option) =>
      option.setName("message").setDescription("The message to send"),
    )
    .addAttachmentOption((option) =>
      option.setName("file").setDescription("Optional file to include."),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (
      !(await requirePermission(
        interaction,
        PermissionFlagsBits.ManageMessages,
      ))
    )
      return;

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild!;
    const channel =
      interaction.options.getChannel("channel") || interaction.channel;
    const message = interaction.options.getString("message");
    const attachment = interaction.options.getAttachment("file");

    if (!message && !attachment) {
      await interaction.editReply({
        content: "You need to provide either a message or a file.",
      });
      return;
    }

    interaction.client.emit("commandExecuted", interaction, "say", {
      channel: `<#${channel?.id}>`,
      message,
      attachment: attachment?.url,
    });

    if (!(channel instanceof TextChannel)) {
      await interaction.editReply({
        content: "That channel cannot receive messages.",
      });
      return;
    }

    let appearance = getSayAppearance(guild.id);
    if (!appearance)
      appearance = {
        mode: WebhookMode.SERVER,
        name: `${guild.name} Staff Team` || "",
        avatarUrl: guild.iconURL() || "",
      };
    if (appearance.mode === WebhookMode.ORIGINAL)
      appearance = {
        mode: WebhookMode.ORIGINAL,
        name: interaction.user.displayName,
        avatarUrl: interaction.user.displayAvatarURL(),
      };

    const webhook = await channel.createWebhook({
      name: appearance.name || "Staff Team",
      avatar: appearance.avatarUrl || "",
    });

    await webhook.send({
      content: message || "",
      username: appearance.name || "Staff Team",
      avatarURL: appearance.avatarUrl || guild.iconURL() || "",
      files: attachment ? [attachment.url] : [],
    });

    await webhook.delete();

    await interaction.editReply({
      content: `Message sent successfully! Check it out: <#${channel.id}>`,
    });
  },
};

export default command;
