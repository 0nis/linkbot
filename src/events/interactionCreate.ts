import {
  Events,
  Interaction,
  InteractionReplyOptions,
  MessageFlags,
} from "discord.js";

import { BotEvent } from "../handlers/loadEvents";

const event: BotEvent = {
  name: Events.InteractionCreate,

  async execute(interaction: Interaction) {
    if (interaction.isAutocomplete()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command?.autocomplete) return;

      try {
        await command.autocomplete(interaction);
      } catch (error) {
        console.error(
          `Error handling autocomplete for "${interaction.commandName}":`,
          error,
        );
        interaction.client.emit(
          "autoCompleteError",
          interaction,
          error as Error,
          interaction.commandName,
        );
      }

      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(
        `No command matching "${interaction.commandName}" was found.`,
      );
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(
        `Error executing command "${interaction.commandName}":`,
        error,
      );
      interaction.client.emit(
        "commandError",
        interaction,
        error as Error,
        interaction.commandName,
      );

      const errorResponse: InteractionReplyOptions = {
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorResponse);
      } else {
        await interaction.reply(errorResponse);
      }
    }
  },
};

export default event;
