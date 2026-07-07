import { Events, Message } from "discord.js";

import { BotEvent } from "../handlers/loadEvents";
import { messageBridgeManager } from "../managers";

const event: BotEvent = {
  name: Events.MessageDelete,

  async execute(message: Message) {
    if (!message.guild) return;

    const bridges = messageBridgeManager.get(message.id);

    for (const bridge of bridges) {
      try {
        const webhook = await message.client.fetchWebhook(bridge.webhookId);

        await webhook.deleteMessage(bridge.mirroredMessageId);
      } catch {
        // webhook/message no longer exists
      }
    }

    messageBridgeManager.remove(message.id);
  },
};

export default event;
