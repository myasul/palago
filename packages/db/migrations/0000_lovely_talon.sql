CREATE TABLE "daily_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"stock_id" integer NOT NULL,
	"trade_date" date NOT NULL,
	"open_price" numeric(12, 4),
	"high_price" numeric(12, 4),
	"low_price" numeric(12, 4),
	"close_price" numeric(12, 4),
	"volume" bigint,
	"value" numeric(18, 4),
	"percent_change" numeric(8, 4),
	"net_foreign" numeric(18, 4)
);
--> statement-breakpoint
CREATE TABLE "dividends" (
	"id" serial PRIMARY KEY NOT NULL,
	"stock_id" integer NOT NULL,
	"dividend_type" varchar(20) NOT NULL,
	"amount_per_share" numeric(10, 6),
	"declaration_date" date,
	"ex_date" date,
	"record_date" date,
	"payment_date" date,
	"fiscal_year" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ingestion_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_name" varchar(50) NOT NULL,
	"status" varchar(20) NOT NULL,
	"records_fetched" integer DEFAULT 0,
	"records_written" integer DEFAULT 0,
	"error_message" text,
	"triggered_by" varchar(20) DEFAULT 'scheduler',
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"duration_ms" integer
);
--> statement-breakpoint
CREATE TABLE "intraday_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"stock_id" integer NOT NULL,
	"snapshot_time" timestamp with time zone NOT NULL,
	"current_price" numeric(12, 4) NOT NULL,
	"volume" bigint,
	"percent_change" numeric(8, 4),
	"bid_price" numeric(12, 4),
	"ask_price" numeric(12, 4),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "market_indices" (
	"id" serial PRIMARY KEY NOT NULL,
	"index_name" varchar(50) NOT NULL,
	"trade_date" date NOT NULL,
	"open_value" numeric(12, 4),
	"close_value" numeric(12, 4),
	"high_value" numeric(12, 4),
	"low_value" numeric(12, 4),
	"percent_change" numeric(8, 4),
	"volume" bigint
);
--> statement-breakpoint
CREATE TABLE "stocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" varchar(10) NOT NULL,
	"name" varchar(255) NOT NULL,
	"sector" varchar(100),
	"subsector" varchar(100),
	"description" text,
	"total_shares" bigint,
	"listing_date" date,
	"is_blue_chip" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"website_url" varchar(255),
	"logo_url" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "stocks_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
ALTER TABLE "daily_prices" ADD CONSTRAINT "daily_prices_stock_id_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dividends" ADD CONSTRAINT "dividends_stock_id_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intraday_snapshots" ADD CONSTRAINT "intraday_snapshots_stock_id_stocks_id_fk" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_prices_stock_id_trade_date_unique" ON "daily_prices" USING btree ("stock_id","trade_date");--> statement-breakpoint
CREATE INDEX "daily_prices_stock_id_trade_date_idx" ON "daily_prices" USING btree ("stock_id","trade_date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "daily_prices_trade_date_idx" ON "daily_prices" USING btree ("trade_date" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "intraday_snapshots_stock_id_snapshot_time_unique" ON "intraday_snapshots" USING btree ("stock_id","snapshot_time");--> statement-breakpoint
CREATE INDEX "intraday_snapshots_stock_id_snapshot_time_idx" ON "intraday_snapshots" USING btree ("stock_id","snapshot_time" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "market_indices_index_name_trade_date_unique" ON "market_indices" USING btree ("index_name","trade_date");
