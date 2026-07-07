import { Events, Message } from "discord.js";

import { BotEvent } from "../handlers/loadEvents";
import { messageBridgeManager } from "../managers";

const event: BotEvent = {
  name: Events.MessageUpdate,

  async execute(oldMessage: Message, newMessage: Message) {
    if (newMessage.author.bot) return;

    const bridges = messageBridgeManager.get(newMessage.id);

    for (const bridge of bridges) {
      try {
        const webhook = await newMessage.client.fetchWebhook(bridge.webhookId);

        await webhook.editMessage(bridge.mirroredMessageId, {
          content: newMessage.content,
          files: newMessage.attachments.map((attachment) => attachment.url),
        });
      } catch {
        // webhook/message no longer exists
      }
    }
  },
};

export default event;
