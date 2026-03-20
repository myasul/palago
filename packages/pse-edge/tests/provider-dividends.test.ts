import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { PSEEdgeProvider } from "../src/provider";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dividendsFixturePath = path.resolve(__dirname, "../../pse-data/dividends.html");

describe("PSEEdgeProvider.getDividends", () => {
  it("returns dividends from the form page when rows are present", async () => {
    const html = readFileSync(dividendsFixturePath, "utf8");
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(html, { status: 200 }));
    const provider = new PSEEdgeProvider({
      fetchFn: fetchMock,
      sleepFn: vi.fn().mockResolvedValue(undefined),
    });

    const dividends = await provider.getDividends("86");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://edge.pse.com.ph/companyPage/dividends_and_rights_form.do?cmpy_id=86",
    );
    expect(dividends).toHaveLength(7);
    expect(dividends.some((entry) => entry.securityType === "COMMON")).toBe(true);
  });

  it("falls back to the dividends list endpoint when the form page has no rows", async () => {
    const html = readFileSync(dividendsFixturePath, "utf8");
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          `
            <form id="listForm">
              <input type="hidden" name="cmpy_id" value="86" />
            </form>
          `,
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(html, { status: 200 }));
    const provider = new PSEEdgeProvider({
      fetchFn: fetchMock,
      sleepFn: vi.fn().mockResolvedValue(undefined),
    });

    const dividends = await provider.getDividends("86");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://edge.pse.com.ph/companyPage/dividends_and_rights_form.do?cmpy_id=86",
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://edge.pse.com.ph/companyPage/dividends_and_rights_list.ax?DividendsOrRights=Dividends",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          cmpy_id: "86",
        }),
      },
    );
    expect(dividends).toHaveLength(7);
  });

  it("throws an explicit error when the dividends request fails", async () => {
    const provider = new PSEEdgeProvider({
      fetchFn: vi.fn<typeof fetch>().mockResolvedValue(new Response("nope", { status: 500 })),
      sleepFn: vi.fn().mockResolvedValue(undefined),
    });

    await expect(provider.getDividends("86")).rejects.toThrow(
      "PSE Edge dividends request failed for cmpy_id 86 with status 500",
    );
  });
});
