import { describe, expect, it } from "vitest";
import { formatChaosEquivalent } from "@/web/price-check/stack-value/format-chaos-equivalent";

describe("stack value chaos equivalent", () => {
  it("uses the live exalt-to-chaos ratio for the whole stack", () => {
    expect(formatChaosEquivalent(195, 76.2 / 2312)).toBe("6 . 4");
  });

  it("keeps small nonzero currency values visible", () => {
    expect(formatChaosEquivalent(1, 76.2 / 2312)).toBe("0.033");
  });

  it.each([undefined, NaN, 0, -1])("omits invalid rate %s", (rate) => {
    expect(formatChaosEquivalent(195, rate)).toBeUndefined();
  });
});
