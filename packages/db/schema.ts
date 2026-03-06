import {
  bigint,
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const stocks = pgTable("stocks", {
  id: serial("id").primaryKey(),
  symbol: varchar("symbol", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  sector: varchar("sector", { length: 100 }),
  subsector: varchar("subsector", { length: 100 }),
  description: text("description"),
  totalShares: bigint("total_shares", { mode: "bigint" }),
  listingDate: date("listing_date", { mode: "date" }),
  isBlueChip: boolean("is_blue_chip").default(false),
  isActive: boolean("is_active").default(true),
  websiteUrl: varchar("website_url", { length: 255 }),
  logoUrl: varchar("logo_url", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow(),
});

export const dailyPrices = pgTable(
  "daily_prices",
  {
    id: serial("id").primaryKey(),
    stockId: integer("stock_id")
      .notNull()
      .references(() => stocks.id, { onDelete: "cascade" }),
    tradeDate: date("trade_date", { mode: "date" }).notNull(),
    openPrice: numeric("open_price", { precision: 12, scale: 4 }),
    highPrice: numeric("high_price", { precision: 12, scale: 4 }),
    lowPrice: numeric("low_price", { precision: 12, scale: 4 }),
    closePrice: numeric("close_price", { precision: 12, scale: 4 }),
    volume: bigint("volume", { mode: "bigint" }),
    value: numeric("value", { precision: 18, scale: 4 }),
    percentChange: numeric("percent_change", { precision: 8, scale: 4 }),
    netForeign: numeric("net_foreign", { precision: 18, scale: 4 }),
  },
  (table) => ({
    stockTradeDateUnique: uniqueIndex("daily_prices_stock_id_trade_date_unique").on(
      table.stockId,
      table.tradeDate,
    ),
    stockTradeDateIdx: index("daily_prices_stock_id_trade_date_idx").on(
      table.stockId,
      table.tradeDate.desc(),
    ),
    tradeDateIdx: index("daily_prices_trade_date_idx").on(table.tradeDate.desc()),
  }),
);

export const intradaySnapshots = pgTable(
  "intraday_snapshots",
  {
    id: serial("id").primaryKey(),
    stockId: integer("stock_id")
      .notNull()
      .references(() => stocks.id, { onDelete: "cascade" }),
    snapshotTime: timestamp("snapshot_time", { withTimezone: true, mode: "date" }).notNull(),
    currentPrice: numeric("current_price", { precision: 12, scale: 4 }).notNull(),
    volume: bigint("volume", { mode: "bigint" }),
    percentChange: numeric("percent_change", { precision: 8, scale: 4 }),
    bidPrice: numeric("bid_price", { precision: 12, scale: 4 }),
    askPrice: numeric("ask_price", { precision: 12, scale: 4 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
  },
  (table) => ({
    stockSnapshotUnique: uniqueIndex("intraday_snapshots_stock_id_snapshot_time_unique").on(
      table.stockId,
      table.snapshotTime,
    ),
    stockSnapshotIdx: index("intraday_snapshots_stock_id_snapshot_time_idx").on(
      table.stockId,
      table.snapshotTime.desc(),
    ),
  }),
);

export const dividends = pgTable("dividends", {
  id: serial("id").primaryKey(),
  stockId: integer("stock_id")
    .notNull()
    .references(() => stocks.id, { onDelete: "cascade" }),
  dividendType: varchar("dividend_type", { length: 20 }).notNull(),
  amountPerShare: numeric("amount_per_share", { precision: 10, scale: 6 }),
  declarationDate: date("declaration_date", { mode: "date" }),
  exDate: date("ex_date", { mode: "date" }),
  recordDate: date("record_date", { mode: "date" }),
  paymentDate: date("payment_date", { mode: "date" }),
  fiscalYear: integer("fiscal_year"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
});

export const marketIndices = pgTable(
  "market_indices",
  {
    id: serial("id").primaryKey(),
    indexName: varchar("index_name", { length: 50 }).notNull(),
    tradeDate: date("trade_date", { mode: "date" }).notNull(),
    openValue: numeric("open_value", { precision: 12, scale: 4 }),
    closeValue: numeric("close_value", { precision: 12, scale: 4 }),
    highValue: numeric("high_value", { precision: 12, scale: 4 }),
    lowValue: numeric("low_value", { precision: 12, scale: 4 }),
    percentChange: numeric("percent_change", { precision: 8, scale: 4 }),
    volume: bigint("volume", { mode: "bigint" }),
  },
  (table) => ({
    indexTradeDateUnique: uniqueIndex("market_indices_index_name_trade_date_unique").on(
      table.indexName,
      table.tradeDate,
    ),
  }),
);

export const ingestionLogs = pgTable("ingestion_logs", {
  id: serial("id").primaryKey(),
  jobName: varchar("job_name", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  recordsFetched: integer("records_fetched").default(0),
  recordsWritten: integer("records_written").default(0),
  errorMessage: text("error_message"),
  triggeredBy: varchar("triggered_by", { length: 20 }).default("scheduler"),
  startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
  durationMs: integer("duration_ms"),
});
