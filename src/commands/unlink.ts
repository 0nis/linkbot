import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

import { Command } from "../types";
import { channelLinksManager } from "../managers";
import { requirePermission } from "../utils/permissions";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("unlink")
    .setDescription("Remove a channel link.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption((option) =>
      option
        .setName("id")
        .setDescription("The link to remove.")
        .setRequired(true)
        .setAutocomplete(true),
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

    interaction.client.emit("commandExecuted", interaction, "unlink", { id });

    const removed = channelLinksManager.removeLink(guildId, id);

    await interaction.editReply(
      removed ? "Channel link removed." : "Link not found.",
    );
  },

  async autocomplete(interaction) {
    const guildId = interaction.guildId;
    if (!guildId) return;

    const focused = interaction.options.getFocused(true);
    const guild = interaction.guild;

    const query = focused.value.toLowerCase();

    const choices = channelLinksManager
      .getAutocompleteChoices(guild!)
      .filter((choice) => choice.name.toLowerCase().includes(query))
      .slice(0, 25);

    await interaction.respond(choices);
  },
};

export default command;
