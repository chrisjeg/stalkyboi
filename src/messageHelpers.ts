import { Message, TextChannel } from "discord.js";
import { DiscordUsers, DiscordUser } from "./analysisTyping";

export const getDiscordUsersForMessage = (message: Message): DiscordUsers => {
  if (message.channel.type != "GUILD_TEXT") {
    return {};
  } else {
    const channel: TextChannel = message.channel;
    return channel.members.reduce(
      (images: { [id: string]: DiscordUser }, member) => {
        images[member.user.id] = {
          id: member.user.id,
          name: member.displayName,
          imageUrl: member.user.avatarURL({
            format: "png",
            size: 128,
          }),
        };
        return images;
      },
      {}
    );
  }
};
