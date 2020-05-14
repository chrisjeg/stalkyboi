import * as Discord from "discord.js";
import { replyAsJson } from "./messageFormatters";
import { isSundayNow, getPriceSlot } from "./dateFunctions";
import services from "./services";
import sendAnalysis from "./analysis/sendAnalysis";
import sendAnalysisForAll from "./analysis/sendAnalysisForAll";
import moment from "moment";
const client = new Discord.Client();

const AUTH_LOCATION = "../../config/stalkyboi.json";
const USER_ID_REGEX = /<\@!([0-9]*)>/;

const auth = require(AUTH_LOCATION);

let lastPinned: Discord.Message | null = null;

type SellDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

const updateModelForDay = (
  userId: string,
  day: SellDay,
  input: Array<string | undefined>
) => {
  const [timezone, price] = input;
  const lowerCaseTimezone = timezone?.toLowerCase();
  const parsedPrice = parseInt(price);
  if (!["am", "pm"].includes(lowerCaseTimezone) || isNaN(parsedPrice)) {
    return;
  } else {
    let dayValue: number = 0;
    switch (day) {
      case "monday":
        dayValue = 0;
        break;
      case "tuesday":
        dayValue = 1;
        break;
      case "wednesday":
        dayValue = 2;
        break;
      case "thursday":
        dayValue = 3;
        break;
      case "friday":
        dayValue = 4;
        break;
      case "saturday":
        dayValue = 5;
        break;
      default:
        return;
    }
    const slot = dayValue * 2 + (lowerCaseTimezone === "am" ? 0 : 1);
    services.userManager.addPriceToModel(userId, parsedPrice, slot);
  }
};

const messageIfBestSundayBuyPrice = (
  message: Discord.Message,
  price: number
) => {
  const min = services.userManager.getBestBuyPrice();
  if (min === price) {
    message.react("🔥");
    message.channel
      .send(
        `Looks like <@${message.author.id}> has our best buy price at ${price} bells`
      )
      .then((newMessage) => {
        lastPinned?.unpin();
        newMessage.pin();
        lastPinned = newMessage;
      });
    return true;
  } else {
    return false;
  }
};

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", (message) => {
  const { author, content } = message;
  if (content.toLowerCase().startsWith("stalk ")) {
    const [, command, ...input] = content.toLowerCase().split(" ");
    const potentialPrice = parseInt(command);
    console.log(
      `[${moment().format()}] ${message.author.id}:"${message.content}" in ${
        message.author.locale || "unknown"
      })`
    );
    if (!isNaN(potentialPrice)) {
      services.userManager.addPriceToModel(message.author.id, potentialPrice);
      if (!isSundayNow()) {
        sendAnalysis(
          input[0] != null
            ? input[0].match(USER_ID_REGEX)?.[1] ?? author.id
            : author.id,
          message
        );
      } else if (!messageIfBestSundayBuyPrice(message, potentialPrice)) {
        message.reply("Thanks, your data has been updated");
      }
      return;
    } else if (command == null) {
      message.channel.send(
        `STALK WHAT, <@${message.author.id}>!? STALK WHAT!?`
      );
      return;
    }
    const lowerCasedCommand = command?.toLowerCase();
    switch (lowerCasedCommand) {
      case "help":
        message.reply(
          "Stalkyboi is a bot to help you and your friends predict your turnip prices. To input your current price type `stalk {your_price}`, if you want to add prices retrospectively for the week you can type `stalk (sunday|buy) ${your_price}` for your buy price and `stalk (monday|tuesday|...) (am|pm) ${your_price}` for the week, for example *stalk monday am 105*. Stalky is a work in progress, if he's a bit shit then give him your feedback. He won't take it on board."
        );
      case "sunday":
      case "buy": {
        const price = parseInt(input[0]);
        if (!isNaN(price)) {
          services.userManager.addPriceToModel(author.id, price, null);
          if (getPriceSlot() === null) {
            messageIfBestSundayBuyPrice(message, price);
          } else {
            message.reply("Thanks, your data has been updated");
          }
        }
        break;
      }
      case "monday":
      case "tuesday":
      case "wednesday":
      case "thursday":
      case "friday": {
        updateModelForDay(author.id, lowerCasedCommand, input);
        message.react("✅");
        break;
      }

      case "analyse":
      case "analyze": {
        sendAnalysis(
          input[0] != null
            ? input[0].match(USER_ID_REGEX)?.[1] ?? author.id
            : author.id,
          message
        );
        break;
      }
      case "full":
        sendAnalysisForAll(message);
        break;
      case "reset": {
        services.userManager.resetWeek(
          input[0] != null
            ? input[0].match(USER_ID_REGEX)?.[1] ?? author.id
            : author.id
        );
        message.reply("Maybe get better with a computer, bitch ...ᵇᶦᵗᶜʰ");
        break;
      }
      case "view": {
        const userData = services.userManager.getUserData(author.id);
        if (userData) {
          replyAsJson(message, userData);
        } else {
          message.reply("You ain't got no data");
        }
        break;
      }
      case "noob":
        services.userManager.setFirstTime(
          input[0] != null
            ? input[0].match(USER_ID_REGEX)?.[1] ?? author.id
            : author.id
        );
        break;
      default: {
        message.reply(
          "I have no idea what you are talking about, bitch ...ᵇᶦᵗᶜʰ"
        );
        break;
      }
    }
  }
});
client.login(auth.token);
