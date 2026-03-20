import { describe, expect, it, vi } from "vitest";

import { PSEEdgeProvider } from "../src/provider";

const makeHtmlPage = (rows: string, currentPage: number, lastPage: number) => `
  <table class="list">
    <tbody>
      ${rows}
    </tbody>
  </table>
  <div class="paging">
    <a href="#" onclick="return false;"><img src="/images/common/icon_first.gif" alt="first page"/></a>
    <a href="#" onclick="return false;"><img src="/images/common/icon_prev.gif" alt="prev block"/></a>
    <span>${currentPage}</span>
    <span><a href="#" onclick="goPage(${lastPage});return false;" >${lastPage}</a></span>
    <a href="#" onclick="goPage(${lastPage});return false;"><img src="/images/common/icon_end.gif" alt="last page"/></a>
  </div>
`;

const makeSinglePageHtml = (rows: string) => `
  <table class="list">
    <tbody>
      ${rows}
    </tbody>
  </table>
  <div class="paging">
    <span>1</span>
  </div>
`;

const makeMalformedPagingHtml = (rows: string) => `
  <table class="list">
    <tbody>
      ${rows}
    </tbody>
  </table>
  <div class="paging">
    <a href="#" onclick="return false;"><img src="/images/common/icon_first.gif" alt="first page"/></a>
    <span>1</span>
    <span>two</span>
  </div>
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
  it("aggregates results until the last page link is reached and throttles between requests", async () => {
    const firstPageHtml = makeHtmlPage(
      row({
        cmpyId: "55",
        secId: "347",
        name: "Jollibee Foods Corporation",
        symbol: "JFC",
        sector: "Services",
        subsector: "Restaurants, Hotels and Leisure",
      }),
      1,
      2,
    );
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
      2,
      2,
    );

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(firstPageHtml, { status: 200 }))
      .mockResolvedValueOnce(new Response(secondPageHtml, { status: 200 }));
    const sleepMock = vi.fn().mockResolvedValue(undefined);

    const provider = new PSEEdgeProvider({
      fetchFn: fetchMock,
      sleepFn: sleepMock,
    });

    const companies = await provider.getCompanyList();

    expect(companies).toEqual([
      {
        symbol: "JFC",
        name: "Jollibee Foods Corporation",
        sector: "Services",
        subsector: "Restaurants, Hotels and Leisure",
        listingDate: new Date("1973-03-22T00:00:00.000Z"),
        edgeCmpyId: "55",
        edgeSecId: "347",
      },
      {
        symbol: "PEG",
        name: "Paginated Example Corporation",
        sector: "Industrial",
        subsector: "Industrial",
        listingDate: new Date("2020-01-01T00:00:00.000Z"),
        edgeCmpyId: "999",
        edgeSecId: "111",
      },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://edge.pse.com.ph/companyDirectory/search.ax");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    expect(String(fetchMock.mock.calls[0]?.[1]?.body)).toContain("pageNo=1");
    expect(String(fetchMock.mock.calls[1]?.[1]?.body)).toContain("pageNo=2");
    expect(sleepMock).toHaveBeenCalledTimes(1);
    expect(sleepMock).toHaveBeenNthCalledWith(1, 500);
  });

  it("fails the full operation when any page request fails", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(makeHtmlPage(row({
        cmpyId: "1",
        secId: "2",
        name: "First Page Company",
        symbol: "FPC",
      }), 1, 2), { status: 200 }))
      .mockResolvedValueOnce(new Response("server error", { status: 500 }));

    const provider = new PSEEdgeProvider({
      fetchFn: fetchMock,
      sleepFn: vi.fn().mockResolvedValue(undefined),
    });

    await expect(provider.getCompanyList()).rejects.toThrow(
      "PSE Edge company list request failed on page 2 with status 500",
    );
  });

  it("supports a clear single-page result without a last-page link", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        makeSinglePageHtml(
          row({
            cmpyId: "55",
            secId: "347",
            name: "Jollibee Foods Corporation",
            symbol: "JFC",
            sector: "Services",
            subsector: "Restaurants, Hotels and Leisure",
          }),
        ),
        { status: 200 },
      ),
    );

    const provider = new PSEEdgeProvider({
      fetchFn: fetchMock,
      sleepFn: vi.fn().mockResolvedValue(undefined),
    });

    await expect(provider.getCompanyList()).resolves.toEqual([
      {
        symbol: "JFC",
        name: "Jollibee Foods Corporation",
        sector: "Services",
        subsector: "Restaurants, Hotels and Leisure",
        listingDate: new Date("1973-03-22T00:00:00.000Z"),
        edgeCmpyId: "55",
        edgeSecId: "347",
      },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws when pagination exists but the last page cannot be determined", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        makeMalformedPagingHtml(
          row({
            cmpyId: "55",
            secId: "347",
            name: "Jollibee Foods Corporation",
            symbol: "JFC",
            sector: "Services",
            subsector: "Restaurants, Hotels and Leisure",
          }),
        ),
        { status: 200 },
      ),
    );

    const provider = new PSEEdgeProvider({
      fetchFn: fetchMock,
      sleepFn: vi.fn().mockResolvedValue(undefined),
    });

    await expect(provider.getCompanyList()).rejects.toThrow(
      "PSE Edge company list parsing failed on page 1: could not determine last page",
    );
  });
});
