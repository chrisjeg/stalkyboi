import jsonfile from "jsonfile";
import { getPriceSlot } from "./dateFunctions";
import moment from "moment";

export interface User {
  id: string;
  friendCode?: string;
  firstTime: boolean;
  buy: number;
  prices: number[];
  retentionDate?: number;
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

  public setFirstTime(userId: string) {
    this.getUserData(userId).firstTime = true;
  }

  public addPriceToModel(userId: string, price: number, slot?: PriceSlot) {
    let user = this.getUserData(userId);
    const currentRetentionDate = this.getRetentionDate();
    if (user.retentionDate !== currentRetentionDate) {
      console.log("Resetting data for ", userId);
      this.resetWeek(userId);
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
    return this.userData[userId];
  }

  public getUserDataWithoutDefault(userId: string) {
    return this.userData[userId];
  }

  public resetWeek(userId: string) {
    this.userData[userId] = {
      ...this.getUserData(userId),
      buy: NaN,
      prices: new Array(12).fill(NaN),
      retentionDate: this.getRetentionDate(),
    };
  }

  public getBestBuyPrice() {
    return Object.values(this.userData).reduce(
      (min, value) => (!isNaN(value.buy) && value.buy < min ? value.buy : min),
      1000
    );
  }

  public getRetentionDate() {
    return moment().isoWeekday(6).endOf("day").unix();
  }
}
