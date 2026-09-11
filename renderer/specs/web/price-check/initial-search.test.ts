import { describe, expect, it } from "vitest";
import { ItemCategory, ItemRarity } from "@/parser";
import { createTestItem } from "@specs/helper";
import { shouldStartInitialSearch } from "@/web/price-check/initial-search";

const enabled = { smartInitialSearch: true, lockedInitialSearch: true };

describe("initial price search", () => {
  it.each(Object.values(ItemCategory))(
    "starts locked mode without mouse interaction for %s",
    (category) => {
      const item = { ...createTestItem(), category, rarity: ItemRarity.Rare };
      expect(shouldStartInitialSearch(item, true, enabled)).toBe(true);
      expect(
        shouldStartInitialSearch(item, true, {
          ...enabled,
          smartInitialSearch: false,
        }),
      ).toBe(true);
      expect(
        shouldStartInitialSearch(item, true, {
          ...enabled,
          lockedInitialSearch: false,
        }),
      ).toBe(false);
    },
  );

  it("preserves the separate quick-mode heuristic and opt-out", () => {
    const item = {
      ...createTestItem(),
      category: ItemCategory.OneHandedMace,
      rarity: ItemRarity.Rare,
    };
    expect(shouldStartInitialSearch(item, false, enabled)).toBe(false);
    item.isUnidentified = true;
    expect(shouldStartInitialSearch(item, false, enabled)).toBe(true);
    expect(
      shouldStartInitialSearch(item, false, {
        ...enabled,
        smartInitialSearch: false,
      }),
    ).toBe(false);
    expect(
      shouldStartInitialSearch(item, false, {
        ...enabled,
        lockedInitialSearch: false,
      }),
    ).toBe(true);
  });
});
