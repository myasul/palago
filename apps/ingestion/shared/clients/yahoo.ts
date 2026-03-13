import YahooFinance from "yahoo-finance2";
import { z } from "zod";

const QUOTE_BATCH_SIZE = 50;
const yahooFinance = new YahooFinance();

const toPseSymbol = (symbol: string) => `${symbol.toUpperCase()}.PS`;

export const YahooQuoteSchema = z.object({
  currency: z.string().optional(),
  fullExchangeName: z.string().optional(),
  longName: z.string().optional(),
  regularMarketDayHigh: z.number().optional(),
  regularMarketDayLow: z.number().optional(),
  regularMarketOpen: z.number().optional(),
  regularMarketPreviousClose: z.coerce.number().catch(0).default(0),
  regularMarketPrice: z.number(),
  regularMarketTime: z.coerce.date().optional(),
  regularMarketVolume: z.number().optional(),
  shortName: z.string().optional(),
  symbol: z.string(),
});

const YahooHistoricalRowSchema = z.object({
  adjClose: z.number().optional(),
  close: z.number().optional(),
  date: z.coerce.date(),
  high: z.number().optional(),
  low: z.number().optional(),
  open: z.number().optional(),
  volume: z.number().optional(),
});

const YahooHistoricalSchema = z.array(YahooHistoricalRowSchema);

export const fetchPSEQuote = async (symbol: string) => {
  const quote = await yahooFinance.quote(toPseSymbol(symbol));
  return YahooQuoteSchema.parse(quote);
};

export const fetchPSEHistorical = async (symbol: string, from: Date, to: Date) => {
  const query = new URLSearchParams({
    events: "history",
    includeAdjustedClose: "true",
    interval: "1d",
    period1: Math.floor(from.getTime() / 1000).toString(),
    period2: Math.floor(to.getTime() / 1000).toString(),
    symbol: toPseSymbol(symbol),
    useYfid: "true",
  });

  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${toPseSymbol(symbol)}?${query.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Yahoo historical request failed with status ${response.status}`);
  }

  const payload: any = await response.json();
  const result = payload?.chart?.result?.[0];

  if (!result) {
    return [];
  }

  const timestamps: number[] = result.timestamp ?? [];
  const quote = result.indicators?.quote?.[0] ?? {};
  const adjclose = result.indicators?.adjclose?.[0]?.adjclose ?? [];

  const history = timestamps.map((timestamp, index) => ({
    adjClose: adjclose[index],
    close: quote.close?.[index],
    date: new Date(timestamp * 1000),
    high: quote.high?.[index],
    low: quote.low?.[index],
    open: quote.open?.[index],
    volume: quote.volume?.[index],
  }));

  return YahooHistoricalSchema.parse(history);
};

export const fetchAllPSEQuotes = async (symbols: string[]) => {
  const quotes = [];

  for (let index = 0; index < symbols.length; index += QUOTE_BATCH_SIZE) {
    const batch = symbols.slice(index, index + QUOTE_BATCH_SIZE);
    const batchQuotes = await Promise.all(batch.map((symbol) => fetchPSEQuote(symbol)));
    quotes.push(...batchQuotes);
  }

  return quotes;
};
