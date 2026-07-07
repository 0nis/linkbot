import { Guild } from "discord.js";
import {
  addChannelLink,
  getChannelLinks,
  removeChannelLink,
  updateChannelLink,
} from "../database/guildStore";

import { LinkedChannel, ChannelLink } from "../database/types";

type ChannelLinkChoice = {
  name: string;
  value: string;
};

export class ChannelLinksManager {
  private cache = new Map<string, ChannelLink[]>();
  private displayCache = new Map<string, ChannelLinkChoice[]>();

  getLinks(guildId: string): ChannelLink[] {
    if (!this.cache.has(guildId))
      this.cache.set(guildId, getChannelLinks(guildId));

    return this.cache.get(guildId)!;
  }

  setLinksCache(guildId: string, links?: ChannelLink[]) {
    this.cache.set(guildId, links || getChannelLinks(guildId));
    this.displayCache.delete(guildId);
  }

  getLinksForChannel(guildId: string, channelId: string): ChannelLink[] {
    return this.getLinks(guildId).filter(
      (link) => link.source.id === channelId || link.target.id === channelId,
    );
  }

  getTarget(link: ChannelLink, channelId: string): LinkedChannel {
    if (link.source.id === channelId) return link.target;
    return link.source;
  }

  getSource(link: ChannelLink, channelId: string): LinkedChannel {
    if (link.source.id === channelId) return link.source;
    return link.target;
  }

  getSide(link: ChannelLink, channelId: string): "source" | "target" {
    return link.source.id === channelId ? "source" : "target";
  }

  addLink(
    guildId: string,
    source: LinkedChannel,
    target: LinkedChannel,
  ): ChannelLink {
    const link = addChannelLink({
      guildId,
      source,
      target,
    });

    this.setLinksCache(guildId);
    return link;
  }

  updateLinkSide(
    guildId: string,
    linkId: string,
    side: "source" | "target",
    update: Partial<LinkedChannel>,
  ): ChannelLink | null {
    const links = this.getLinks(guildId);

    const link = links.find((link) => link.id === linkId);
    if (!link) return null;

    link[side] = {
      ...link[side],
      ...update,
      webhook: {
        ...link[side].webhook,
        ...(update.webhook ?? {}),
        appearance: {
          ...link[side].webhook.appearance,
          ...(update.webhook?.appearance ?? {}),
        },
      },
    };

    updateChannelLink(guildId, linkId, link);

    this.setLinksCache(guildId, links);

    return link;
  }

  removeLink(guildId: string, linkId: string): boolean {
    const removed = removeChannelLink(guildId, linkId);
    this.setLinksCache(guildId);
    return removed;
  }

  getAutocompleteChoices(guild: Guild): ChannelLinkChoice[] {
    const cached = this.displayCache.get(guild.id);

    if (cached) return cached;

    const choices = this.getLinks(guild.id).map((link) => {
      return {
        name: this.formatChannelLinkName(link, guild),
        value: link.id,
      };
    });

    this.displayCache.set(guild.id, choices);

    return choices;
  }

  formatChannelLinkName(link: ChannelLink, guild: Guild | null): string {
    const source = guild?.channels.cache.get(link.source.id);
    const target = guild?.channels.cache.get(link.target.id);

    return `${source?.name ?? "unknown"} ↔ ${target?.name ?? "unknown"}`;
  }
}
