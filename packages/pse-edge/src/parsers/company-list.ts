import { load } from "cheerio";

import { ListedCompanyListSchema } from "../schemas";

const COMPANY_ID_PATTERN =
  /cmDetail\(\s*'?([^,'\s)]+)'?\s*,\s*'?([^,'\s)]+)'?\s*\)/;

const formatHtmlSnippet = (html: string) => html.replace(/\s+/g, " ").trim().slice(0, 240);

const extractIds = (onclickValue: string | undefined, rowHtml?: string, rowIndex?: number) => {
  const matched = onclickValue?.match(COMPANY_ID_PATTERN);

  if (!matched) {
    const rowContext =
      rowHtml && rowIndex !== undefined
        ? ` in row ${rowIndex + 1}: ${formatHtmlSnippet(rowHtml)}`
        : "";
    throw new Error(
      `Unable to extract company and security IDs from ${onclickValue ?? "missing onclick"}${rowContext}`,
    );
  }

  return {
    edgeCmpyId: matched[1],
    edgeSecId: matched[2],
  };
};

export const extractLastCompanyListPage = (html: string): number => {
  const $ = load(html);
  const paging = $(".paging");

  if (paging.length === 0) {
    return 1;
  }

  const lastPageLink = $('.paging a img[alt="last page"]').parent("a");
  const lastPageOnclick = lastPageLink.attr("onclick");
  const lastPageMatch = lastPageOnclick?.match(/goPage\((\d+)\)/);

  if (lastPageMatch) {
    return Number.parseInt(lastPageMatch[1] ?? "", 10);
  }

  const pageNumbers = $('.paging a[onclick*="goPage("]')
    .map((_, element) => {
      const onclick = $(element).attr("onclick");
      const match = onclick?.match(/goPage\((\d+)\)/);
      return match ? Number.parseInt(match[1] ?? "", 10) : Number.NaN;
    })
    .get()
    .filter(Number.isFinite);

  if (pageNumbers.length > 0) {
    return Math.max(...pageNumbers);
  }

  const pageSpans = $(".paging span")
    .map((_, element) => $(element).text().trim())
    .get()
    .filter(Boolean);

  if (pageSpans.length === 1 && /^\d+$/.test(pageSpans[0] ?? "")) {
    return Number.parseInt(pageSpans[0] ?? "", 10);
  }

  throw new Error("could not determine last page");
};

export const parseCompanyList = (html: string) => {
  const $ = load(html);

  const entries = $("table.list tbody tr")
    .toArray()
    .flatMap((row, rowIndex) => {
      const cells = $(row).find("td");
      const companyAnchor = cells.eq(0).find("a").first();
      const symbolAnchor = cells.eq(1).find("a").first();

      if (companyAnchor.length === 0 && symbolAnchor.length === 0) {
        return [];
      }

      const { edgeCmpyId, edgeSecId } = extractIds(
        companyAnchor.attr("onclick") ?? symbolAnchor.attr("onclick"),
        $.html(row),
        rowIndex,
      );

      return [
        {
          symbol: symbolAnchor.text(),
          name: companyAnchor.text(),
          sector: cells.eq(2).text(),
          subsector: cells.eq(3).text(),
          listingDate: cells.eq(4).text(),
          edgeCmpyId,
          edgeSecId,
        },
      ];
    });

  return ListedCompanyListSchema.parse(entries);
};
