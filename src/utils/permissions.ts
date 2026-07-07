import { ChatInputCommandInteraction, PermissionResolvable } from "discord.js";

export async function requirePermission(
  interaction: ChatInputCommandInteraction,
  permission: PermissionResolvable,
): Promise<boolean> {
  if (!interaction.guild) {
    await interaction.reply({
      content: "This command can only be used in a server.",
      ephemeral: true,
    });
    return false;
  }

  if (interaction.memberPermissions?.has(permission)) return true;

  await interaction.reply({
    content: "You don't have permission to use this command.",
    ephemeral: true,
  });

  return false;
}
