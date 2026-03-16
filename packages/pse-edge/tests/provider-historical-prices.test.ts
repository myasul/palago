import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { PSEEdgeProvider } from "../src/provider";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const historicalFixturePath = path.resolve(__dirname, "../../pse-data/disclosure-cht.json");

describe("PSEEdgeProvider.getHistoricalPrices", () => {
  it("posts the expected JSON payload and normalizes historical rows", async () => {
    const payload = readFileSync(historicalFixturePath, "utf8");
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(payload, { status: 200 }));
    const provider = new PSEEdgeProvider({
      fetchFn: fetchMock,
      sleepFn: vi.fn().mockResolvedValue(undefined),
    });

    const rows = await provider.getHistoricalPrices(
      "86",
      "158",
      new Date("2026-03-11T00:00:00.000Z"),
      new Date("2026-03-13T00:00:00.000Z"),
    );

    expect(fetchMock).toHaveBeenCalledWith("https://edge.pse.com.ph/common/DisclosureCht.ax", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cmpy_id: "86",
        security_id: "158",
        startDate: "03-11-2026",
        endDate: "03-13-2026",
      }),
    });
    expect(rows).toHaveLength(5);
    expect(rows[0]).toEqual({
      edgeCmpyId: "86",
      edgeSecId: "158",
      tradeDate: new Date("2026-03-11T00:00:00.000Z"),
      openPrice: 195.7,
      highPrice: 202.6,
      lowPrice: 195.7,
      closePrice: 200,
      value: 132369927,
      volume: null,
    });
    expect(rows.every((row) => row.volume === null)).toBe(true);
  });

  it("returns an empty array when chartData is empty", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ chartData: [], tableData: [] }), { status: 200 }));
    const provider = new PSEEdgeProvider({
      fetchFn: fetchMock,
      sleepFn: vi.fn().mockResolvedValue(undefined),
    });

    await expect(
      provider.getHistoricalPrices(
        "86",
        "158",
        new Date("2026-03-11T00:00:00.000Z"),
        new Date("2026-03-13T00:00:00.000Z"),
      ),
    ).resolves.toEqual([]);
  });

  it("throws an explicit error when the historical request fails", async () => {
    const provider = new PSEEdgeProvider({
      fetchFn: vi.fn<typeof fetch>().mockResolvedValue(new Response("nope", { status: 500 })),
      sleepFn: vi.fn().mockResolvedValue(undefined),
    });

    await expect(
      provider.getHistoricalPrices(
        "86",
        "158",
        new Date("2026-03-11T00:00:00.000Z"),
        new Date("2026-03-13T00:00:00.000Z"),
      ),
    ).rejects.toThrow(
      "PSE Edge historical prices request failed for cmpy_id 86 and security_id 158 with status 500",
    );
  });

  it("throws an explicit error when the response contains an invalid chart date", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          chartData: [
            {
              OPEN: 1,
              HIGH: 2,
              LOW: 0.5,
              CLOSE: 1.5,
              VALUE: 1000,
              CHART_DATE: "bad date",
            },
          ],
        }),
        { status: 200 },
      ),
    );
    const provider = new PSEEdgeProvider({
      fetchFn: fetchMock,
      sleepFn: vi.fn().mockResolvedValue(undefined),
    });

    await expect(
      provider.getHistoricalPrices(
        "86",
        "158",
        new Date("2026-03-11T00:00:00.000Z"),
        new Date("2026-03-13T00:00:00.000Z"),
      ),
    ).rejects.toThrow(
      /PSE Edge historical prices parsing failed for cmpy_id 86 and security_id 158: Invalid chart date/,
    );
  });
});
