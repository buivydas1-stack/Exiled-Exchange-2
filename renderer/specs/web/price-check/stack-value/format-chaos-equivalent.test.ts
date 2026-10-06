import { describe, expect, it } from "vitest";
import { formatChaosEquivalent } from "@/web/price-check/stack-value/format-chaos-equivalent";

describe("stack value chaos equivalent", () => {
  it("uses the live exalt-to-chaos ratio for the whole stack", () => {
    expect(formatChaosEquivalent(195, 76.2 / 2312)).toBe("6.43");
  });

  it("shows two decimals for small nonzero currency values", () => {
    expect(formatChaosEquivalent(1, 76.2 / 2312)).toBe("0.03");
  });

  it.each([
    [0, "0.00"],
    [0.0001, "0.00"],
    [0.0099, "0.00"],
    [0.01, "0.01"],
    [0.0151, "0.02"],
    [1, "1.00"],
    [556.126, "556.13"],
  ])("formats %s Chaos as %s", (amount, expected) => {
    expect(formatChaosEquivalent(amount, 1)).toBe(expected);
  });

  it.each([undefined, NaN, Infinity, 0, -1])(
    "omits invalid rate %s",
    (rate) => {
      expect(formatChaosEquivalent(195, rate)).toBeUndefined();
    },
  );

  it.each([NaN, Infinity, -1])("omits invalid amounts %s", (amount) => {
    expect(formatChaosEquivalent(amount, 1)).toBeUndefined();
  });
});
