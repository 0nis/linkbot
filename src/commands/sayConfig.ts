import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { Command } from "../types";
import { requirePermission } from "../utils/permissions";
import { WebhookMode } from "../database/types";
import { updateSayAppearance } from "../database/guildStore";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("say-config")
    .setDescription("Configure the name and icon for the say command.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
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
    const mode = interaction.options.getString("mode", true);
    const name = interaction.options.getString("name");
    const avatar = interaction.options.getString("avatar");

    interaction.client.emit("commandExecuted", interaction, "say-config", {
      mode,
      name,
      avatar,
    });

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
      ...(mode === WebhookMode.ORIGINAL && {
        name: "Anonymous",
        avatarUrl: interaction.guild?.iconURL() || "",
      }),
    };

    const preview = new EmbedBuilder()
      .setTitle("Confirm 'say' command appearance change")
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

    const id = `${interaction.user.id}-${Date.now()}`;
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

    updateSayAppearance(guildId, {
      mode: (appearance.mode as WebhookMode) || WebhookMode.CUSTOM,
      name: appearance.name,
      avatarUrl: appearance.avatarUrl,
    });

    await response.update({
      content: "Updated.",
      embeds: [],
      components: [],
    });
  },
};

export default command;
