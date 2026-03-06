import { dailyPrices, dividends, intradaySnapshots, stocks } from "@palago/db/schema";

export type Stock = typeof stocks.$inferSelect;
export type NewStock = typeof stocks.$inferInsert;

export type DailyPrice = typeof dailyPrices.$inferSelect;
export type NewDailyPrice = typeof dailyPrices.$inferInsert;

export type IntradaySnapshot = typeof intradaySnapshots.$inferSelect;
export type NewIntradaySnapshot = typeof intradaySnapshots.$inferInsert;

export type Dividend = typeof dividends.$inferSelect;
export type NewDividend = typeof dividends.$inferInsert;
