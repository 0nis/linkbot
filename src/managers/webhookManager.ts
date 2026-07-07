import {
  Client,
  TextChannel,
  Webhook,
  Message,
  WebhookClient,
  EmbedBuilder,
} from "discord.js";

import { updateChannelLink } from "../database/guildStore";
import {
  ChannelLink,
  Webhook as StoredWebhook,
  WebhookAppearance,
  WebhookMode,
} from "../database/types";

interface GetWebhookOptions {
  client: Client;
  channel: TextChannel;
  guildId: string;
  link: ChannelLink;
  side: "source" | "target";
}

export class WebhookManager {
  async getOrCreate({
    client,
    channel,
    guildId,
    link,
    side,
  }: GetWebhookOptions): Promise<WebhookClient> {
    const config = link[side].webhook;

    if (config.id) {
      try {
        const webhook = await client.fetchWebhook(config.id);
        await this.updateWebhookAppearance(webhook, config);
        return new WebhookClient({
          id: webhook.id,
          token: webhook.token!,
        });
      } catch {
        delete config.id;
        updateChannelLink(guildId, link.id, link);
      }
    }

    let appearance = {
      name: "Anonymous",
      avatarUrl: "",
    };

    switch (config.appearance?.mode) {
      case WebhookMode.CUSTOM:
        appearance = {
          name: config.appearance?.name ?? "Anonymous",
          avatarUrl: config.appearance?.avatarUrl ?? "",
        };
        break;
      case WebhookMode.SERVER:
        appearance = {
          name: channel.guild.name,
          avatarUrl: channel.guild.iconURL() || "",
        };
        break;
    }

    const webhook = await channel.createWebhook(appearance);

    config.id = webhook.id;

    updateChannelLink(guildId, link.id, link);

    return new WebhookClient({
      id: webhook.id,
      token: webhook.token!,
    });
  }

  getAppearance(
    message: Message,
    config: StoredWebhook,
    fallback: WebhookAppearance,
  ) {
    const appearance = config.appearance;

    const response = (
      name: string | null | undefined,
      avatarUrl: string | null | undefined,
    ) => ({
      username: name ?? fallback.name ?? "Anonymous",
      avatarURL: avatarUrl ?? fallback.avatarUrl ?? "",
    });

    switch (appearance?.mode) {
      case WebhookMode.CUSTOM:
        return response(appearance?.name, appearance?.avatarUrl);
      case WebhookMode.ORIGINAL:
        return response(
          message.member?.displayName,
          message.author.displayAvatarURL(),
        );
      case WebhookMode.SERVER:
        return response(message.guild?.name, message.guild?.iconURL());
    }
  }

  async sendMessage({
    webhook,
    message,
    config,
    replyToMessage,
    fallbackAppearance,
  }: {
    webhook: WebhookClient;
    message: Message;
    config: StoredWebhook;
    replyToMessage?: Message;
    fallbackAppearance?: WebhookAppearance;
  }) {
    const content = replyToMessage
      ? `> **↩ Replying to ${replyToMessage.author.displayName}**\n> ${
          replyToMessage.content || "*[no text content]*"
        }\n${message.content}`
      : message.content;

    return webhook.send({
      content,
      ...this.getAppearance(message, config, fallbackAppearance || {}),
      files: message.attachments.map((attachment) => attachment.url),
    });
  }

  private async updateWebhookAppearance(
    webhook: Webhook,
    config: StoredWebhook,
  ) {
    const appearance = config.appearance;

    await webhook.edit({
      name: appearance?.name ?? "Anonymous",
      avatar: appearance?.avatarUrl ?? "",
    });
  }
}
