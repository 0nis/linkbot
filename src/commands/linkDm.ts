import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import { Command } from "../types";
import { requirePermission } from "../utils/permissions";
import { updateDmChannel } from "../database/guildStore";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("link-dm")
    .setDescription(
      "Where to forward received DMs to. If this is not set, DMs will be ignored.",
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to forward DMs to.")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true),
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
    const channel = interaction.options.getChannel("channel", true);

    interaction.client.emit("commandExecuted", interaction, "link-dm", {
      channel: `<#${channel.id}>`,
    });

    updateDmChannel(guildId, channel.id);

    await interaction.editReply({
      content: `DMs will be forwarded to <#${channel.id}>.`,
    });
  },
};

export default command;
