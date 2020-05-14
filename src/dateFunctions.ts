import moment from "moment";

export const isSundayNow = () => {
  return new Date().getDay() === 0;
};

export const getPriceSlot = (
  locale: string = "Europe/London"
): number | null => {
  const now = moment().tz(locale);
  const day = now.day() - 1;
  const hour = now.hour();
  if (day > -1) {
    return day * 2 + (hour >= 12 ? 1 : 0);
  } else {
    return null;
  }
};

const days = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const slotToDayTime = (slot: number) => {
  const day = Math.floor(slot / 2);
  const time = slot % 2 === 0 ? "morning" : "afternoon";
  return days[day] + " " + time;
};
