import { describe, expect, it } from "vitest";

import {
  get52WeekLabel,
  getCloseVsOpenSubtitle,
  getIntradaySecondaryText,
  getPriceChange,
  getRangeBarPosition,
} from "./stock-detail-utils";

describe("getRangeBarPosition", () => {
  it("returns a clamped percentage for the normal case", () => {
    expect(getRangeBarPosition("245.50", "200.00", "300.00")).toBe(45.5);
  });

  it("returns 50 when the bounds are equal", () => {
    expect(getRangeBarPosition("245.50", "245.50", "245.50")).toBe(50);
  });

  it("returns null when any input is null", () => {
    expect(getRangeBarPosition(null, "200.00", "300.00")).toBeNull();
    expect(getRangeBarPosition("245.50", null, "300.00")).toBeNull();
    expect(getRangeBarPosition("245.50", "200.00", null)).toBeNull();
  });
});

describe("getIntradaySecondaryText", () => {
  it("returns the low-boundary label", () => {
    expect(getIntradaySecondaryText("200.00", "200.00", "250.00")).toBe(
      "At today's low · ₱50.00 below today's high"
    );
  });

  it("returns the high-boundary label", () => {
    expect(getIntradaySecondaryText("250.00", "200.00", "250.00")).toBe(
      "At today's high · ₱50.00 above today's low"
    );
  });

  it("returns the between-range label", () => {
    expect(getIntradaySecondaryText("225.00", "200.00", "250.00")).toBe(
      "₱25.00 above today's low · ₱25.00 below today's high"
    );
  });

  it("returns null when any input is null", () => {
    expect(getIntradaySecondaryText(null, "200.00", "250.00")).toBeNull();
    expect(getIntradaySecondaryText("225.00", null, "250.00")).toBeNull();
    expect(getIntradaySecondaryText("225.00", "200.00", null)).toBeNull();
  });
});

describe("getCloseVsOpenSubtitle", () => {
  it("returns the positive state when last close is above open", () => {
    expect(getCloseVsOpenSubtitle("245.50", "243.00")).toEqual({
      text: "Closed up from open",
      tone: "positive",
    });
  });

  it("returns the negative state when last close is below open", () => {
    expect(getCloseVsOpenSubtitle("241.00", "243.00")).toEqual({
      text: "Closed down from open",
      tone: "negative",
    });
  });

  it("returns the neutral state when last close equals open", () => {
    expect(getCloseVsOpenSubtitle("243.00", "243.00")).toEqual({
      text: "Unchanged from open",
      tone: "neutral",
    });
  });

  it("returns null when either input is null", () => {
    expect(getCloseVsOpenSubtitle(null, "243.00")).toBeNull();
    expect(getCloseVsOpenSubtitle("243.00", null)).toBeNull();
  });
});

describe("getPriceChange", () => {
  it("returns the positive diff state", () => {
    expect(getPriceChange("695.00", "685.00")).toEqual({
      formatted: "+10.00",
      tone: "positive",
    });
  });

  it("returns the negative diff state", () => {
    expect(getPriceChange("190.00", "199.00")).toEqual({
      formatted: "−9.00",
      tone: "negative",
    });
  });

  it("returns the neutral diff state", () => {
    expect(getPriceChange("190.00", "190.00")).toEqual({
      formatted: "0.00",
      tone: "neutral",
    });
  });

  it("returns null when either input is null", () => {
    expect(getPriceChange(null, "190.00")).toBeNull();
    expect(getPriceChange("190.00", null)).toBeNull();
  });
});

describe("get52WeekLabel", () => {
  it("returns the low-band label", () => {
    expect(get52WeekLabel("190.00", "180.00", "300.00")).toBe(
      "Near the 52-week low · ₱10.00 above ₱180.00"
    );
  });

  it("returns the mid-band label", () => {
    expect(get52WeekLabel("240.00", "180.00", "300.00")).toBe(
      "Mid-range · ₱60.00 above ₱180.00"
    );
  });

  it("returns the high-band label", () => {
    expect(get52WeekLabel("290.00", "180.00", "300.00")).toBe(
      "Near the 52-week high · ₱10.00 below ₱300.00"
    );
  });

  it("returns the fallback label when the bounds are missing", () => {
    expect(get52WeekLabel("290.00", null, "300.00")).toBe(
      "52-week range not yet available — not enough trading history."
    );
  });
});
