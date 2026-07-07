import path from "node:path";
import { Client, Collection } from "discord.js";

import { Command } from "../types";
import { getFiles } from "../utils/getFiles";

export function loadCommands(client: Client): void {
  client.commands = new Collection<string, Command>();

  const commandsPath = path.join(__dirname, "..", "commands");
  const commandFiles = getFiles(commandsPath);

  for (const filePath of commandFiles) {
    const imported = require(filePath);
    const command: Command = imported.default ?? imported;

    if (!command?.data || !command?.execute) {
      console.warn(
        `[WARNING] Command at ${filePath} is missing a required "data" or "execute" property. Skipping.`,
      );
      continue;
    }

    client.commands.set(command.data.name, command);
    console.log(`[COMMAND LOADED] /${command.data.name}`);
  }
}
