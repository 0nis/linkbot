import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import { Command } from "../types";
import { requirePermission } from "../utils/permissions";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("dm")
    .setDescription("DM a user as the server's staff team.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to DM").setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The message to send")
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (
      !(await requirePermission(
        interaction,
        PermissionFlagsBits.ManageMessages,
      ))
    )
      return;

    await interaction.deferReply();

    const guild = interaction.guild!;
    const user = interaction.options.getUser("user", true);
    const message = interaction.options.getString("message", true);

    interaction.client.emit("commandExecuted", interaction, "dm", {
      user: user.username,
      message,
    });

    const embed = new EmbedBuilder()
      .setAuthor({
        name: guild.name,
        iconURL: guild.iconURL() || undefined,
      })
      .setDescription(message)
      .setFooter({
        text: `Server: ${guild.id}`,
      })
      .setTimestamp();

    await user.send({
      embeds: [embed],
    });

    await interaction.editReply({
      content: `Sent DM to ${user.displayName} (${user.username}):`,
      embeds: [embed],
    });
  },
};

export default command;
