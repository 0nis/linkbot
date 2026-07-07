import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  TextChannel,
  PermissionFlagsBits,
} from "discord.js";
import { Command } from "../types";
import { WebhookMode } from "../database/types";
import { channelLinksManager } from "../managers";
import { requirePermission } from "../utils/permissions";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("link")
    .setDescription(
      "Link any two channels together to share messages between them.",
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((option) =>
      option
        .setName("source")
        .setDescription("The channel to link from.")
        .setRequired(true),
    )
    .addChannelOption((option) =>
      option
        .setName("target")
        .setDescription("The channel to link to.")
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

    const sourceChannel = interaction.options.getChannel("source");
    const targetChannel = interaction.options.getChannel("target");

    interaction.client.emit("commandExecuted", interaction, "link", {
      sourceChannel: `#${sourceChannel?.id}`,
      targetChannel: `#${targetChannel?.id}`,
    });

    if (!sourceChannel || !targetChannel) {
      await interaction.editReply(
        "Please provide both source and target channels.",
      );
      return;
    }

    if (
      !(sourceChannel instanceof TextChannel) ||
      !(targetChannel instanceof TextChannel)
    ) {
      await interaction.editReply(
        "Both source and target channels must be text channels.",
      );
      return;
    }

    const link = channelLinksManager.addLink(
      interaction.guildId!,
      {
        id: sourceChannel.id,
        webhook: {
          appearance: {
            mode: WebhookMode.ORIGINAL,
          },
        },
      },
      {
        id: targetChannel.id,
        webhook: {
          appearance: {
            mode: WebhookMode.ORIGINAL,
          },
        },
      },
    );

    await interaction.editReply(
      `Successfully linked <#${sourceChannel.id}> to <#${targetChannel.id}>. Link ID: ${link.id}`,
    );
  },
};

export default command;
