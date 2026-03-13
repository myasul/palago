import { z } from "zod";

const EodhdTickerSchema = z.object({
  Code: z.string(),
  Country: z.string().optional(),
  Currency: z.string().optional(),
  Exchange: z.string().optional(),
  Isin: z.string().optional(),
  Name: z.string(),
  Type: z.string().optional(),
});

const EodhdDividendSchema = z.object({
  adjusted_amount: z.coerce.number().optional(),
  declarationDate: z.string().optional(),
  exDate: z.string().optional(),
  paymentDate: z.string().optional(),
  period: z.string().optional(),
  recordDate: z.string().optional(),
  unadjustedValue: z.coerce.number().optional(),
});

const EodhdDividendsResponseSchema = z.record(z.string(), EodhdDividendSchema);
const EodhdTickersResponseSchema = z.array(EodhdTickerSchema);

const getApiKey = () => {
  const apiKey = process.env.EODHD_API_KEY;

  if (!apiKey) {
    throw new Error("EODHD_API_KEY is not set");
  }

  return apiKey;
};

const fetchJson = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`EODHD request failed with status ${response.status}`);
  }

  return response.json();
};

export const fetchEodhdTickers = async (exchange: string) => {
  const apiKey = getApiKey();
  const payload = await fetchJson(
    `https://eodhd.com/api/exchange-symbol-list/${exchange}?fmt=json&api_token=${apiKey}`,
  );

  return EodhdTickersResponseSchema.parse(payload);
};

export const fetchEodhdDividends = async (symbol: string) => {
  const apiKey = getApiKey();
  const payload = await fetchJson(
    `https://eodhd.com/api/div/${symbol.toUpperCase()}.PS?fmt=json&api_token=${apiKey}`,
  );

  return EodhdDividendsResponseSchema.parse(payload);
};
