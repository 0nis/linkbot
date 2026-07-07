interface MessageBridge {
  webhookId: string;
  channelId: string;
  mirroredMessageId: string;
  expiresAt: number;
}

const BRIDGE_EXPIRY = 1000 * 60 * 60 * 24 * 7; // 7 days

export class MessageBridgeManager {
  private bridges = new Map<string, MessageBridge[]>();

  add(originalMessageId: string, bridge: Omit<MessageBridge, "expiresAt">) {
    const existing = this.bridges.get(originalMessageId) ?? [];

    existing.push({
      ...bridge,
      expiresAt: Date.now() + BRIDGE_EXPIRY,
    });

    this.bridges.set(originalMessageId, existing);
  }

  get(messageId: string): MessageBridge[] {
    return this.bridges.get(messageId) ?? [];
  }

  findMirror(originalMessageId: string, channelId: string) {
    const now = Date.now();
    return this.get(originalMessageId).find(
      (bridge) => bridge.channelId === channelId && bridge.expiresAt > now,
    );
  }

  remove(messageId: string) {
    this.bridges.delete(messageId);
  }

  cleanup() {
    const now = Date.now();

    for (const [messageId, bridges] of this.bridges) {
      const active = bridges.filter((bridge) => bridge.expiresAt > now);

      if (active.length === 0) {
        this.bridges.delete(messageId);
        continue;
      }

      this.bridges.set(messageId, active);
    }
  }
}
