import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import { PSEEdgeProvider } from "../src/provider";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const searchFixturePath = path.resolve(__dirname, "../../pse-data/search.html");

const makeHtmlPage = (rows: string) => `
  <table class="list">
    <tbody>
      ${rows}
    </tbody>
  </table>
`;

const row = ({
  cmpyId,
  secId,
  name,
  symbol,
  sector = "Holding Firms",
  subsector = "Holding Firms",
  listingDate = "Mar 22, 1973",
}: {
  cmpyId: string;
  secId: string;
  name: string;
  symbol: string;
  sector?: string;
  subsector?: string;
  listingDate?: string;
}) => `
  <tr>
    <td><a href="#company" onclick="cmDetail('${cmpyId}','${secId}');return false;">${name}</a></td>
    <td class="alignC"><a href="#company" onclick="cmDetail('${cmpyId}','${secId}');return false;">${symbol}</a></td>
    <td>${sector}</td>
    <td>${subsector}</td>
    <td class="alignC">${listingDate}</td>
  </tr>
`;

describe("PSEEdgeProvider.getCompanyList", () => {
  it("aggregates paginated results and throttles between requests", async () => {
    const firstPageHtml = readFileSync(searchFixturePath, "utf8");
    const secondPageHtml = makeHtmlPage(
      row({
        cmpyId: "999",
        secId: "111",
        name: "Paginated Example Corporation",
        symbol: "PEG",
        sector: "Industrial",
        subsector: "Industrial",
        listingDate: "Jan 01, 2020",
      }),
    );
    const emptyPageHtml = makeHtmlPage("");

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(firstPageHtml, { status: 200 }))
      .mockResolvedValueOnce(new Response(secondPageHtml, { status: 200 }))
      .mockResolvedValueOnce(new Response(emptyPageHtml, { status: 200 }));
    const sleepMock = vi.fn().mockResolvedValue(undefined);

    const provider = new PSEEdgeProvider({
      fetchFn: fetchMock,
      sleepFn: sleepMock,
    });

    const companies = await provider.getCompanyList();

    expect(companies.length).toBeGreaterThan(30);
    expect(companies.at(-1)).toEqual({
      symbol: "PEG",
      name: "Paginated Example Corporation",
      sector: "Industrial",
      subsector: "Industrial",
      listingDate: new Date("2020-01-01T00:00:00.000Z"),
      edgeCmpyId: "999",
      edgeSecId: "111",
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://edge.pse.com.ph/companyDirectory/search.ax");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    expect(String(fetchMock.mock.calls[0]?.[1]?.body)).toContain("pageNo=1");
    expect(String(fetchMock.mock.calls[1]?.[1]?.body)).toContain("pageNo=2");
    expect(String(fetchMock.mock.calls[2]?.[1]?.body)).toContain("pageNo=3");
    expect(sleepMock).toHaveBeenCalledTimes(2);
    expect(sleepMock).toHaveBeenNthCalledWith(1, 500);
    expect(sleepMock).toHaveBeenNthCalledWith(2, 500);
  });

  it("fails the full operation when any page request fails", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(makeHtmlPage(row({
        cmpyId: "1",
        secId: "2",
        name: "First Page Company",
        symbol: "FPC",
      })), { status: 200 }))
      .mockResolvedValueOnce(new Response("server error", { status: 500 }));

    const provider = new PSEEdgeProvider({
      fetchFn: fetchMock,
      sleepFn: vi.fn().mockResolvedValue(undefined),
    });

    await expect(provider.getCompanyList()).rejects.toThrow(
      "PSE Edge company list request failed on page 2 with status 500",
    );
  });
});
