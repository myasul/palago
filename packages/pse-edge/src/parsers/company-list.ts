import { load } from "cheerio";

import { ListedCompanyListSchema } from "../schemas";

const COMPANY_ID_PATTERN = /cmDetail\('([^']+)','([^']+)'\)/;

const extractIds = (onclickValue: string | undefined) => {
  const matched = onclickValue?.match(COMPANY_ID_PATTERN);

  if (!matched) {
    throw new Error(`Unable to extract company and security IDs from ${onclickValue ?? "missing onclick"}`);
  }

  return {
    edgeCmpyId: matched[1],
    edgeSecId: matched[2],
  };
};

export const parseCompanyList = (html: string) => {
  const $ = load(html);

  const entries = $("table.list tbody tr")
    .toArray()
    .map((row) => {
      const cells = $(row).find("td");
      const companyAnchor = cells.eq(0).find("a").first();
      const symbolAnchor = cells.eq(1).find("a").first();
      const { edgeCmpyId, edgeSecId } = extractIds(companyAnchor.attr("onclick") ?? symbolAnchor.attr("onclick"));

      return {
        symbol: symbolAnchor.text(),
        name: companyAnchor.text(),
        sector: cells.eq(2).text(),
        subsector: cells.eq(3).text(),
        listingDate: cells.eq(4).text(),
        edgeCmpyId,
        edgeSecId,
      };
    });

  return ListedCompanyListSchema.parse(entries);
};
