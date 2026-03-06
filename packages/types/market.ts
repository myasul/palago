import { ingestionLogs, marketIndices } from "@palago/db/schema";

export type MarketIndex = typeof marketIndices.$inferSelect;
export type NewMarketIndex = typeof marketIndices.$inferInsert;

export type IngestionLog = typeof ingestionLogs.$inferSelect;
export type NewIngestionLog = typeof ingestionLogs.$inferInsert;
