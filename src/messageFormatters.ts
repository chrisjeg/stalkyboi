import { Message } from "discord.js";

export const replyAsJson = (message: Message, object: any) => {
  message.reply(`\`\`\`js\n${JSON.stringify(object, null, 2)}\`\`\``);
};
