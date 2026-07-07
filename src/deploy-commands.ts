import fs from "node:fs";
import path from "node:path";
import { REST, Routes } from "discord.js";

import { config } from "./config";
import { Command } from "./types";

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, TEST_GUILD_ID } = config;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  throw new Error(
    "Missing DISCORD_TOKEN or CLIENT_ID in your .env file. See .env.example.",
  );
}

function getFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...getFiles(fullPath));
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

async function deploy() {
  const commandsPath = path.join(__dirname, "commands");
  const commandFiles = getFiles(commandsPath);
  const commandData = [];

  for (const filePath of commandFiles) {
    const imported = require(filePath);
    const command: Command = imported.default ?? imported;

    if (!command?.data || !command?.execute) {
      console.warn(
        `[WARNING] Skipping ${filePath}: missing "data" or "execute".`,
      );
      continue;
    }

    commandData.push(command.data.toJSON());
  }

  const rest = new REST().setToken(DISCORD_TOKEN as string);

  try {
    console.log(
      `Deploying ${commandData.length} application (/) command(s)...`,
    );

    const route = TEST_GUILD_ID
      ? Routes.applicationGuildCommands(
          DISCORD_CLIENT_ID as string,
          TEST_GUILD_ID,
        )
      : Routes.applicationCommands(DISCORD_CLIENT_ID as string);

    const data = (await rest.put(route, { body: commandData })) as unknown[];

    console.log(
      `✅ Successfully deployed ${data.length} command(s) ${
        TEST_GUILD_ID ? `to guild ${TEST_GUILD_ID}` : "globally"
      }.`,
    );
  } catch (error) {
    console.error("Failed to deploy commands:", error);
  }
}

deploy();
