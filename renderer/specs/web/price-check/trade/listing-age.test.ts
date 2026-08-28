import { describe, expect, it } from "vitest";
import { isListingAtLeastOneDayOld } from "@/web/price-check/trade/listing-age";

const NOW = Date.parse("2026-08-28T12:00:00.000Z");

describe("isListingAtLeastOneDayOld", () => {
  it("treats an exactly 24-hour-old listing as old", () => {
    expect(isListingAtLeastOneDayOld("2026-08-27T12:00:00.000Z", NOW)).toBe(
      true,
    );
  });

  it("does not treat a listing one millisecond under 24 hours as old", () => {
    expect(isListingAtLeastOneDayOld("2026-08-27T12:00:00.001Z", NOW)).toBe(
      false,
    );
  });

  it("does not treat an invalid timestamp as old", () => {
    expect(isListingAtLeastOneDayOld("invalid", NOW)).toBe(false);
  });
});
