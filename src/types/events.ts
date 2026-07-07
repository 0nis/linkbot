import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
} from "discord.js";

export interface CustomEvents {
  commandExecuted: [
    interaction: ChatInputCommandInteraction,
    commandName: string,
    args?: Record<string, any>,
  ];
  commandError: [
    interaction: ChatInputCommandInteraction,
    error: Error,
    commandName: string,
  ];
  autoCompleteError: [
    interaction: AutocompleteInteraction,
    error: Error,
    commandName: string,
  ];
  eventError: [
    error: Error,
    eventName: string,
    client: any,
    guildId: string | undefined,
  ];
}
