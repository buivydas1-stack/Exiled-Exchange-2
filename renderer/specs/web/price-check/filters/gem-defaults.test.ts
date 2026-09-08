import { describe, expect, it } from "vitest";
import { ItemCategory, ParsedItem } from "@/parser";
import { createFilters } from "@/web/price-check/filters/create-item-filters";

const options = {
  league: "test",
  currency: undefined,
  listingType: undefined,
  collapseListings: "app" as const,
  activateStockFilter: false,
  exact: false,
  useEn: true,
};

function gem(
  category: ItemCategory,
  level: number,
  sockets?: number,
): ParsedItem {
  return {
    category,
    info: { name: "Test Gem", refName: "Test Gem", gem: {} },
    gemLevel: level,
    gemSockets: sockets === undefined ? undefined : { number: sockets },
    quality: 10,
    isCorrupted: false,
  } as ParsedItem;
}

describe("skill gem default filters", () => {
  it.each([ItemCategory.Gem, ItemCategory.MetaGem])(
    "selects level and sockets for %s at every tested value",
    (category) => {
      for (const level of [1, 14, 18, 19, 20]) {
        for (const sockets of [2, 3, 4, 5]) {
          const filters = createFilters(gem(category, level, sockets), options);
          expect(filters.gemLevel).toEqual({ value: level, disabled: false });
          expect(filters.socketNumber).toEqual({
            value: sockets,
            disabled: false,
          });
          expect(filters.quality).toEqual({ value: 10, disabled: true });
        }
      }
    },
  );

  it("does not invent sockets when the copied gem has none", () => {
    const filters = createFilters(gem(ItemCategory.Gem, 1), options);
    expect(filters.gemLevel?.disabled).toBe(false);
    expect(filters.socketNumber).toBeUndefined();
  });

  it("preserves support gem defaults", () => {
    const filters = createFilters(gem(ItemCategory.SupportGem, 1), options);
    expect(filters.gemLevel?.disabled).toBe(true);
    expect(filters.socketNumber).toBeUndefined();
  });
});
