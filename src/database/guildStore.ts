import { randomUUID } from "node:crypto";
import { getGuildData, saveDb } from "./db";
import {
  LinkedChannel,
  ChannelLink,
  WebhookAppearance,
  GuildLoggingConfig,
} from "./types";

export function addChannelLink({
  guildId,
  source,
  target,
}: {
  guildId: string;
  source: LinkedChannel;
  target: LinkedChannel;
}): ChannelLink {
  const link: ChannelLink = {
    id: randomUUID(),
    source,
    target,
  };

  getGuildData(guildId).channelLinks.push(link);
  saveDb();

  return link;
}

export function removeChannelLink(guildId: string, linkId: string): boolean {
  const links = getGuildData(guildId).channelLinks;
  const index = links.findIndex((link) => link.id === linkId);

  if (index === -1) return false;

  links.splice(index, 1);
  saveDb();

  return true;
}

export function getChannelLinks(guildId: string): ChannelLink[] {
  return getGuildData(guildId).channelLinks;
}

export function updateChannelLink(
  guildId: string,
  linkId: string,
  update: Partial<ChannelLink>,
): ChannelLink | null {
  const link = getChannelLinks(guildId).find((link) => link.id === linkId);
  if (!link) return null;

  Object.assign(link, update);
  saveDb();

  return link;
}

export function getDmChannel(guildId: string): string | undefined {
  return getGuildData(guildId).dmChannelId;
}

export function updateDmChannel(
  guildId: string,
  channelId: string | undefined,
): void {
  const guild = getGuildData(guildId);
  guild.dmChannelId = channelId;
  saveDb();
}

export function getSayAppearance(
  guildId: string,
): WebhookAppearance | undefined {
  return getGuildData(guildId).sayAppearance;
}

export function updateSayAppearance(
  guildId: string,
  appearance: WebhookAppearance | undefined,
): void {
  const guild = getGuildData(guildId);
  guild.sayAppearance = appearance;
  saveDb();
}

export function getLoggingConfig(
  guildId: string,
): GuildLoggingConfig | undefined {
  return getGuildData(guildId).logging;
}

export function updateLoggingConfig(
  guildId: string,
  config: Partial<GuildLoggingConfig>,
) {
  const guild = getGuildData(guildId);

  guild.logging = {
    ...guild.logging,
    ...config,
  };

  saveDb();
}
