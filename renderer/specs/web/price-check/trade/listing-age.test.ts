import { describe, expect, it } from "vitest";
import { isListingAtLeastTwelveHoursOld } from "@/web/price-check/trade/listing-age";

const NOW = Date.parse("2026-08-28T12:00:00.000Z");

describe("isListingAtLeastTwelveHoursOld", () => {
  it.each([
    ["exactly 12 hours", "2026-08-28T00:00:00.000Z", true],
    ["one millisecond under 12 hours", "2026-08-28T00:00:00.001Z", false],
    ["18 hours", "2026-08-27T18:00:00.000Z", true],
    ["24 hours", "2026-08-27T12:00:00.000Z", true],
    ["a future timestamp", "2026-08-28T13:00:00.000Z", false],
    ["an invalid timestamp", "invalid", false],
  ])("handles %s", (_label, timestamp, expected) => {
    expect(isListingAtLeastTwelveHoursOld(timestamp, NOW)).toBe(expected);
  });
});
