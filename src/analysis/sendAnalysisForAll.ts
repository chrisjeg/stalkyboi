import { Message, MessageAttachment } from "discord.js";
import services from "../services";
import { createChart } from "./analysisChart";
import { getDiscordUsersForMessage } from "./analysisHelpers";
import moment from "moment";

export default async (message: Message) => {
  console.log("Creating full analysis");
  const discordUsers = getDiscordUsersForMessage(message);
  console.log("Discord users loaded");
  message.channel.send(
    new MessageAttachment(
      await createChart(
        Object.keys(discordUsers)
          .map((dUser) => services.userManager.getUserData(dUser))
          .filter(
            (user) => user != null && user.retentionDate > moment().unix()
          ),
        discordUsers
      )
    )
  );
};
