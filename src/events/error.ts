import { Events } from "discord.js";
import { BotEvent } from "../handlers/loadEvents";

const event: BotEvent = {
  name: Events.Error,
  execute(error: Error) {
    console.error("[CLIENT ERROR]", error);
  },
};

export default event;
