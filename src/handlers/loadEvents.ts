import path from "node:path";
import { Client } from "discord.js";

import { getFiles } from "../utils/getFiles";

export interface BotEvent {
  name: string;
  once?: boolean;
  execute: (...args: any[]) => Promise<void> | void;
}

export function loadEvents(client: Client): void {
  const eventsPath = path.join(__dirname, "..", "events");
  const eventFiles = getFiles(eventsPath);

  for (const filePath of eventFiles) {
    const imported = require(filePath);
    const event: BotEvent = imported.default ?? imported;

    if (!event?.name || !event?.execute) {
      console.warn(
        `[WARNING] Event at ${filePath} is missing a required "name" or "execute" property. Skipping.`,
      );
      continue;
    }

    if (event.once) {
      client.once(event.name, (...args) => {
        Promise.resolve()
          .then(() => event.execute(...args))
          .catch((error) => handleError(error, event, client, args));
      });
    } else {
      client.on(event.name, (...args) => {
        Promise.resolve()
          .then(() => event.execute(...args))
          .catch((error) => handleError(error, event, client, args));
      });
    }

    console.log(`[EVENT LOADED] ${event.name} (once: ${Boolean(event.once)})`);
  }
}

function handleError(
  error: Error,
  event: BotEvent,
  client: Client,
  args: any[],
) {
  client.emit(
    "eventError",
    error as Error,
    event.name,
    client,
    getGuildIdFromArgs(args),
  );
  console.error(`[EVENT ERROR] ${event.name}:`, error);
}

function getGuildIdFromArgs(args: any[]): string | undefined {
  const firstArg = args[0];
  return firstArg?.guildId ?? firstArg?.guild?.id;
}
