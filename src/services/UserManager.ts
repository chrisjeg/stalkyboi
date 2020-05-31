import jsonfile from "jsonfile";
import { getPriceSlot } from "../dateFunctions";
import moment from "moment";
import { Message } from "discord.js";
import { getDiscordUsersForMessage } from "../messageHelpers";

export interface User {
  id: string;
  friendCode?: string;
  firstTime: boolean;
  buy: number;
  prices: number[];
  retentionDate?: number;
  pattern?: {
    validForWeek: number;
    patternNumber: number;
  };
}

enum PriceSlot {
  MondayAM = 0,
  MondayPM = 1,
  TuesdayAM = 2,
  TuesdayPM = 3,
  WednesdayAM = 4,
  WednesdayPM = 5,
  ThursdayAM = 6,
  ThursdayPM = 7,
  FridayAM = 8,
  FridayPM = 9,
  SaturdayAM = 10,
  SaturdayPM = 11,
}

const DEFAULT_TIMEZONE = "Europe/London";

const isNumber = (value: any): value is number =>
  !isNaN(value) && typeof value === "number";

export class UserManager {
  private userData: {
    [user: string]: User;
  } = {};

  constructor(storageLocation: string) {
    this.userData = jsonfile.readFileSync(storageLocation);
    setInterval(() => {
      jsonfile.writeFileSync(storageLocation, this.userData);
    }, 10000);
  }

  public setFirstTime(userId: string, state: boolean) {
    this.getUserData(userId).firstTime = state;
  }

  public addPriceToModel(userId: string, price: number, slot?: PriceSlot) {
    let user = this.getUserData(userId);
    const currentTime = moment().unix();
    if (user.retentionDate < currentTime) {
      console.log("Resetting data for ", userId);
      this.resetWeek(userId, DEFAULT_TIMEZONE);
      user = this.getUserData(userId);
    }

    if (slot === undefined) {
      slot = getPriceSlot();
    }

    if (slot === null) {
      user.buy = price;
    } else {
      user.prices[slot] = price;
    }
  }

  public getUserData(userId: string) {
    if (this.userData[userId] == null) {
      this.userData[userId] = {
        id: userId,
        firstTime: false,
        buy: NaN,
        prices: new Array(12).fill(NaN),
      };
    }
    const currentTime = moment().unix();
    if (this.userData[userId].retentionDate < currentTime) {
      this.userData[userId] = {
        ...this.userData[userId],
        buy: NaN,
        prices: new Array(12).fill(NaN),
        retentionDate: this.getRetentionDate(DEFAULT_TIMEZONE),
      };
    }
    return this.userData[userId];
  }

  public resetWeek(userId: string, timezone: string) {
    this.userData[userId] = {
      ...this.getUserData(userId),
      buy: NaN,
      prices: new Array(12).fill(NaN),
      retentionDate: this.getRetentionDate(timezone),
    };
  }

  public getAllValidUsersForMessage(message: Message) {
    const discordUsers = getDiscordUsersForMessage(message);
    return Object.keys(discordUsers)
      .map((dUser) => this.getUserData(dUser))
      .filter((user) => user != null && user.retentionDate > moment().unix())
      .filter(
        (user) =>
          isNumber(user.buy) || user.prices.some((price) => isNumber(price))
      );
  }

  public getBestBuyPrice(message: Message) {
    return this.getAllValidUsersForMessage(message).reduce(
      (min, value) => (!isNaN(value.buy) && value.buy < min ? value.buy : min),
      1000
    );
  }

  public lockPattern(userId: string, patternNumber: number) {
    this.getUserData(userId).pattern = {
      validForWeek: moment().isoWeek(),
      patternNumber,
    };
  }

  public getRetentionDate(timezone: string) {
    const now = moment().tz(timezone);
    const currentIsoDay = now.isoWeekday();

    // If its Sunday, we jump to next week
    if (currentIsoDay === 7) {
      return now.add(1, "week").isoWeekday(6).endOf("day").unix();
    }

    return now.isoWeekday(6).endOf("day").unix();
  }
}
