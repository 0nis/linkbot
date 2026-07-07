import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

import { Command } from "../types";
import { channelLinksManager } from "../managers";
import { requirePermission } from "../utils/permissions";
import { Webhook, WebhookMode } from "../database/types";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("links")
    .setDescription("List all linked channels in the current server.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction: ChatInputCommandInteraction) {
    if (
      !(await requirePermission(
        interaction,
        PermissionFlagsBits.ManageChannels,
      ))
    )
      return;

    await interaction.deferReply({ ephemeral: true });

    interaction.client.emit("commandExecuted", interaction, "links");

    const guildId = interaction.guildId!;

    const links = channelLinksManager.getLinks(guildId);

    if (links.length === 0) {
      await interaction.editReply(
        "There are no linked channels in this server.",
      );
      return;
    }

    const embed = new EmbedBuilder().setTitle("Channel Links").setColor("Blue");

    const formatAppearance = (webhook: Webhook) => {
      const appearance = webhook.appearance;

      if (appearance?.mode === WebhookMode.CUSTOM)
        return `Custom name: \`${appearance.name}\``;

      if (appearance?.mode === WebhookMode.ORIGINAL)
        return "The original sender";

      if (appearance?.mode === WebhookMode.SERVER)
        return "Server name and icon";

      return "Unknown";
    };

    const description = links
      .map((link, index) => {
        const source = `<#${link.source.id}>`;
        const target = `<#${link.target.id}>`;

        return [
          `**${index + 1}.** ${source} ↔ ${target}`,
          `${source}: ${formatAppearance(link.source.webhook)}`,
          `${target}: ${formatAppearance(link.target.webhook)}`,
        ].join("\n");
      })
      .join("\n\n");

    embed.setDescription(description);

    await interaction.editReply({
      embeds: [embed],
    });
  },
};

export default command;
