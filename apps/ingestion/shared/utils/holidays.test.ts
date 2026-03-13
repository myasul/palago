import { describe, expect, it } from "vitest";

import { PSE_HOLIDAYS_2025, isTrading } from "./holidays";

describe("isTrading", () => {
  it("returns false on a Saturday", () => {
    expect(isTrading(new Date("2025-01-04T00:00:00Z"))).toBe(false);
  });

  it("returns false on a Sunday", () => {
    expect(isTrading(new Date("2025-01-05T00:00:00Z"))).toBe(false);
  });

  it("returns false on a PSE holiday in PSE_HOLIDAYS_2025", () => {
    expect(PSE_HOLIDAYS_2025).toContain("2025-04-01");
    expect(isTrading(new Date("2025-04-01T00:00:00Z"))).toBe(false);
  });

  it("returns true on a regular weekday that is not a holiday", () => {
    expect(isTrading(new Date("2025-01-08T00:00:00Z"))).toBe(true);
  });

  it("returns true on a weekday that is adjacent to but not in the holiday list", () => {
    expect(isTrading(new Date("2025-04-02T00:00:00Z"))).toBe(true);
  });
});
