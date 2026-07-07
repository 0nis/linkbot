import { getLoggingConfig } from "../database/guildStore";
import { BotEvent } from "../handlers/loadEvents";
import { createLoggingEmbed } from "../utils/createLoggingEmbed";

const event: BotEvent = {
  name: "commandExecuted",
  execute(interaction, commandName, args) {
    const guildId = interaction.guildId;
    if (!guildId) return;

    const cfg = getLoggingConfig(interaction.guildId);
    if (!cfg?.commands?.enabled) return;

    const channelId = cfg?.commands?.channelId;
    if (!channelId) return;

    const channel = interaction.client.channels.cache.get(channelId);
    if (!channel?.isTextBased()) return;

    const embed = createLoggingEmbed({
      title: "Command Executed",
      description: `**/${commandName}** was executed`,
      color: 0x5865f2,
      user: interaction.user,
      fields: [
        {
          name: "Command",
          value: `/${commandName}`,
          inline: true,
        },
        {
          name: "User",
          value: `${interaction.user}`,
          inline: true,
        },
        {
          name: "Channel",
          value: `${interaction.channel ?? "Unknown"}`,
          inline: true,
        },
        args && {
          name: "Arguments",
          value: Object.entries(args)
            .map(
              ([key, value]) =>
                `- **${key}**: ${typeof value === "string" ? value : JSON.stringify(value)}`,
            )
            .join("\n")
            .slice(0, 1000),
        },
      ],
    });

    channel.send({
      embeds: [embed],
    });
  },
};

export default event;
