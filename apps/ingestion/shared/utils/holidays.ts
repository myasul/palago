import { format, getDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const MANILA_TIMEZONE = "Asia/Manila";

export const PSE_HOLIDAYS_2025: string[] = [
  "2025-01-01",
  "2025-01-29",
  "2025-04-01",
  "2025-04-09",
  "2025-04-17",
  "2025-04-18",
  "2025-04-19",
  "2025-05-01",
  "2025-06-06",
  "2025-06-12",
  "2025-08-21",
  "2025-08-25",
  "2025-10-31",
  "2025-11-01",
  "2025-11-30",
  "2025-12-08",
  "2025-12-24",
  "2025-12-25",
  "2025-12-30",
  "2025-12-31",
];

const HOLIDAY_SET = new Set(PSE_HOLIDAYS_2025);

export const isTrading = (date: Date): boolean => {
  const manilaDate = toZonedTime(date, MANILA_TIMEZONE);
  const dayOfWeek = getDay(manilaDate);
  const formattedDate = format(manilaDate, "yyyy-MM-dd");

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  return !HOLIDAY_SET.has(formattedDate);
};
