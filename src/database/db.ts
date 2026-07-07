import fs from "node:fs";
import path from "node:path";
import { Database, GuildData } from "./types";

const DB_PATH = path.join(__dirname, "..", "..", "data", "db.json");
const DEFAULT_DB: Database = { guilds: {} };

let cache: Database | null = null;

function ensureDbFile(): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2));
  }
}

export function loadDb(): Database {
  if (cache) return cache;
  ensureDbFile();
  cache = JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as Database;
  return cache;
}

export function saveDb(): void {
  if (!cache) return;
  const tmpPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(cache, null, 2));
  fs.renameSync(tmpPath, DB_PATH);
}

export function getGuildData(guildId: string): GuildData {
  const db = loadDb();
  if (!db.guilds[guildId]) {
    db.guilds[guildId] = { channelLinks: [] };
  }
  return db.guilds[guildId];
}
