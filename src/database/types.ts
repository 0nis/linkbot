export enum WebhookMode {
  ORIGINAL = "original",
  SERVER = "server",
  CUSTOM = "custom",
}

export enum ChannelType {
  SOURCE = "source",
  TARGET = "target",
}

export interface Webhook {
  id?: string;
  appearance?: WebhookAppearance;
}

export interface WebhookAppearance {
  mode?: WebhookMode;
  name?: string;
  avatarUrl?: string;
}

export interface LinkedChannel {
  id: string;
  webhook: Webhook;
}

export interface ChannelLink {
  id: string;
  source: LinkedChannel;
  target: LinkedChannel;
}

export interface LogConfig {
  enabled?: boolean;
  channelId?: string;
}

export interface GuildLoggingConfig {
  commands?: LogConfig;
  errors?: LogConfig;
}

export interface GuildData {
  channelLinks: ChannelLink[];
  dmChannelId?: string;
  logging?: GuildLoggingConfig;
  sayAppearance?: WebhookAppearance;
}

export interface Database {
  guilds: Record<string, GuildData>;
}
