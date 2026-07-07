import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../types";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription(
      "Test command that replies with Pong! And the current latency.",
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sent = await interaction.reply({
      content: "Pinging...",
      withResponse: true,
    });

    const roundTrip =
      sent.resource!.message!.createdTimestamp - interaction.createdTimestamp;

    await interaction.editReply(
      `🏓 Pong! Roundtrip latency: ${roundTrip}ms. WebSocket heartbeat: ${interaction.client.ws.ping}ms.`,
    );
  },
};

export default command;
