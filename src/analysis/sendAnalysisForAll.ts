import { Message, MessageAttachment } from "discord.js";
import services from "../services";
import { createChart } from "./analysisChart";
import { getDiscordUsersForMessage } from "../messageHelpers";

export default async (message: Message) => {
  console.log("Creating full analysis");
  console.log("Discord users loaded");
  message.channel.send({
    attachments: [
      new MessageAttachment(
        await createChart(
          services.userManager.getAllValidUsersForMessage(message),
          getDiscordUsersForMessage(message)
        )
      ),
    ],
  });
};
