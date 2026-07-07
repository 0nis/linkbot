import { Client, Events } from "discord.js";
import { BotEvent } from "../handlers/loadEvents";

const event: BotEvent = {
  name: Events.ClientReady,
  once: true,
  execute(client: Client) {
    console.log(`✅ Test event fired: logged in as ${client.user?.tag}!`);
  },
};

export default event;
