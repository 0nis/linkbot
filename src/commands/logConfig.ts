import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import { Command } from "../types";
import { requirePermission } from "../utils/permissions";
import { getLoggingConfig, updateLoggingConfig } from "../database/guildStore";
import { GuildLoggingConfig } from "../database/types";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("log-config")
    .setDescription("Configure logging behavior for this bot.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)

    .addSubcommand((subcommand) =>
      subcommand
        .setName("commands")
        .setDescription("Configure command logging.")
        .addBooleanOption((option) =>
          option
            .setName("enabled")
            .setDescription("Whether command usage should be logged.")
            .setRequired(true),
        )
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("The channel to send command logs to.")
            .addChannelTypes(ChannelType.GuildText),
        ),
    )

    .addSubcommand((subcommand) =>
      subcommand
        .setName("errors")
        .setDescription("Configure error logging.")
        .addBooleanOption((option) =>
          option
            .setName("enabled")
            .setDescription("Whether bot errors should be logged.")
            .setRequired(true),
        )
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("The channel to send error logs to.")
            .addChannelTypes(ChannelType.GuildText),
        ),
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

    const subcommand = interaction.options.getSubcommand();
    const enabled = interaction.options.getBoolean("enabled", true);
    const channel = interaction.options.getChannel("channel");

    interaction.client.emit("commandExecuted", interaction, "log-config", {
      subcommand,
      enabled,
      channel: `<#${channel?.id}>`,
    });

    const currentCfg: GuildLoggingConfig = getLoggingConfig(guildId) || {};

    let newCfg: GuildLoggingConfig = {
      ...currentCfg,
    };
    let successMsg = "";

    switch (subcommand) {
      case "commands":
        newCfg.commands = {
          enabled,
          channelId: channel?.id ?? currentCfg.commands?.channelId,
        };
        successMsg = `Commands will ${enabled ? "now" : "no longer"} be logged to <#${newCfg.commands?.channelId}>.`;
        break;
      case "errors":
        newCfg.errors = {
          enabled,
          channelId: channel?.id ?? currentCfg.errors?.channelId,
        };
        successMsg = `Errors will ${enabled ? "now" : "no longer"} be logged to <#${newCfg.errors?.channelId}>.`;
        break;
    }

    updateLoggingConfig(guildId, newCfg);

    await interaction.editReply({
      content: successMsg,
    });
  },
};

export default command;
