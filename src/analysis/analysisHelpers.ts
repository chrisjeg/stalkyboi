import { Analysis, DiscordUsers, DiscordUser } from "../analysisTyping";
import services from "../services";
import { getPriceSlot } from "../dateFunctions";
import { Message, TextChannel } from "discord.js";
import moment from "moment";
const analyze_possibilities = require("./predictions");

const SUNDAY_OFFSET = 2;

export const generateAnalysisForUser = (userId: string): Analysis[] => {
  const user = services.userManager.getUserData(userId);
  const sellPrices = [user.buy, user.buy, ...user.prices].map((x) =>
    typeof x === "number" ? x : NaN
  );
  let patternNumber = -1;
  if (user.pattern?.validForWeek === moment().subtract(1, "weeks").isoWeek()) {
    patternNumber = user.pattern.patternNumber;
  }
  return analyze_possibilities(sellPrices, user.firstTime, patternNumber);
};

export const calculateMaxIndex = (analysis: Analysis) => {
  const currentPriceSlot = getPriceSlot() + SUNDAY_OFFSET;
  const offsetPrices = analysis.prices.slice(currentPriceSlot);
  const maxPrice = Math.max(...offsetPrices.map((x) => x.max));
  return currentPriceSlot + offsetPrices.findIndex((v) => v.max === maxPrice);
};

export const getDiscordUsersForMessage = (message: Message): DiscordUsers => {
  if (message.channel.type != "text") {
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
