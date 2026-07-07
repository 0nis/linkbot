import { ChannelLinksManager } from "./channelLinksManager";
import { MessageBridgeManager } from "./messageBridgeManager";
import { WebhookManager } from "./webhookManager";

export const messageBridgeManager = new MessageBridgeManager();
export const webhookManager = new WebhookManager();
export const channelLinksManager = new ChannelLinksManager();

setInterval(() => messageBridgeManager.cleanup(), 1000 * 60 * 60);
