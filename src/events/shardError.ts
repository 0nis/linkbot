import { Events } from "discord.js";
import { BotEvent } from "../handlers/loadEvents";

const event: BotEvent = {
  name: Events.ShardError,
  execute(error: Error) {
    console.error("[SHARD ERROR]", error);
  },
};

export default event;
