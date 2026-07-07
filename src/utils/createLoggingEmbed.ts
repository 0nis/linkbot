import { EmbedBuilder, type User } from "discord.js";

interface LoggingEmbedOptions {
  title: string;
  description?: string;
  user?: User;
  color?: number;
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[];
}

export function createLoggingEmbed({
  title,
  description,
  user,
  color = 0x5865f2,
  fields = [],
}: LoggingEmbedOptions) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setTimestamp();

  if (description) {
    embed.setDescription(description);
  }

  if (fields.length > 0) {
    embed.addFields(fields);
  }

  if (user) {
    embed.setFooter({
      text: `User ID: ${user.id}`,
    });
  }

  return embed;
}
