import { Message, MessageAttachment } from "discord.js";
import services from "../services";
import { Analysis, patternToString } from "../analysisTyping";
import { slotToDayTime } from "../dateFunctions";
import { createChart } from "./analysisChart";
import { generateAnalysisForUser, calculateMaxIndex } from "./analysisHelpers";
import { getDiscordUsersForMessage } from "../messageHelpers";

export default async (id: string, message: Message) => {
  const user = services.userManager.getUserData(id);
  const analysis = generateAnalysisForUser(id);
  if (analysis.length === 2) {
    const guaranteed = analysis[1] as Analysis;
    const type = patternToString[guaranteed.pattern_description];

    services.userManager.lockPattern(id, guaranteed.pattern_number);
    const priceIndex = calculateMaxIndex(guaranteed);
    const price = guaranteed.prices[priceIndex].max;
    const maxPriceDay = slotToDayTime(priceIndex);
    message.channel.send({
      content: `Looks like <@${id}> is lined up for a ${type} with a max price of ${price} on ${maxPriceDay}`,
      attachments: [
        new MessageAttachment(
          await createChart([user], getDiscordUsersForMessage(message)),
          "analysis.jpg"
        ),
      ],
    });
  } else {
    const minMax = analysis[0];
    const mostLikely = analysis[1];
    if (mostLikely == null) {
      return;
    }

    const maxMostLikelyIndex = calculateMaxIndex(mostLikely);
    console.log(maxMostLikelyIndex);
    const recommendation =
      mostLikely.probability > 0.8
        ? `I'd recommend that they sell on ${slotToDayTime(
            maxMostLikelyIndex
          )} for a max gain of ${mostLikely.prices[maxMostLikelyIndex].max}.`
        : `I'd wait it out and see how things progress, but the likely peak is ${slotToDayTime(
            maxMostLikelyIndex
          )} for a max gain of ${mostLikely.prices[maxMostLikelyIndex].max}.`;

    message.channel.send({
      content: `
      Right now, <@${id}>'s potential maximum is ${
        minMax.weekMax
      } and guarenteed minimum is ${
        minMax.weekGuaranteedMinimum
      }. Their most likely situation is a ${
        patternToString[mostLikely.pattern_description]
      } with a probability of ${(mostLikely.probability * 100).toFixed(
        2
      )}%. ${recommendation}`,
      attachments: [
        new MessageAttachment(
          await createChart([user], getDiscordUsersForMessage(message)),
          "analysis.jpg"
        ),
      ],
    });
  }
};
