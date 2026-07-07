import { getLoggingConfig } from "../database/guildStore";
import { BotEvent } from "../handlers/loadEvents";
import { createLoggingEmbed } from "../utils/createLoggingEmbed";

const event: BotEvent = {
  name: "autoCompleteError",
  execute(interaction, error, commandName) {
    const guildId = interaction.guildId;
    if (!guildId) return;

    const cfg = getLoggingConfig(interaction.guildId);
    if (!cfg?.errors?.enabled) return;

    const channelId = cfg?.errors?.channelId;
    if (!channelId) return;

    const channel = interaction.client.channels.cache.get(channelId);
    if (!channel?.isTextBased()) return;

    const embed = createLoggingEmbed({
      title: "Autocomplete Error Occurred",
      description: error.message,
      color: 0xed4245,
      fields: [
        {
          name: "Command",
          value: `/${commandName}`,
          inline: true,
        },
        {
          name: "Stack",
          value: `\`\`\`${error.stack?.slice(0, 1000) ?? "No stack trace"}\`\`\``,
        },
      ],
    });

    channel.send({
      embeds: [embed],
    });
  },
};

export default event;
