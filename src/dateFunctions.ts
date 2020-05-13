export const isSundayNow = () => {
  return new Date().getDay() === 0;
};

export const getPriceSlot = (): number | null => {
  const date = new Date();
  const day = date.getDay() - 1;
  const hour = date.getHours();
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
