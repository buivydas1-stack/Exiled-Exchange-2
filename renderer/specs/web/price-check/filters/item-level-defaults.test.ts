import { describe, expect, it } from "vitest";
import { ItemCategory, ItemRarity, type ParsedItem } from "@/parser";
import { createTestCreateOptions, createTestItem } from "@specs/helper";
import { createFilters } from "@/web/price-check/filters/create-item-filters";
import { createPresets } from "@/web/price-check/filters/create-presets";
import { maxUsefulItemLevel } from "@/web/price-check/filters/common";
import { createTradeRequest } from "@/web/price-check/trade/pathofexile-trade";
import snapshot from "@/web/price-check/filters/normal-modifier-levels.json";
import { init, ITEM_BY_REF } from "@/assets/data";
import { setupTests } from "@specs/vitest.setup";

function base(category: ItemCategory, itemLevel = 86): ParsedItem {
  const item = createTestItem();
  return {
    ...item,
    category,
    itemLevel,
    rarity: ItemRarity.Rare,
    isUnidentified: true,
    info: {
      ...item.info,
      name: "Test Base",
      refName: "Test Base",
      craftable: { category },
    },
  };
}

describe("verified normal-modifier item-level limits", () => {
  it.each(Object.entries<{ level: number }>(snapshot.categories))(
    "uses the verified cap for %s, including the outgoing query",
    (name, data) => {
      expect(Object.values(ItemCategory)).toContain(name);
      const category = name as ItemCategory;
      expect(maxUsefulItemLevel(category)).toBe(data.level);
      for (const rarity of [ItemRarity.Magic, ItemRarity.Rare]) {
        for (const level of [1, 60, data.level, 86, 100]) {
          const item = { ...base(category, level), rarity };
          const filters = createFilters(item, createTestCreateOptions());
          expect(filters.unidentified).toEqual({
            value: true,
            disabled: false,
          });
          if (data.level === 1) {
            expect(filters.itemLevel).toBeUndefined();
          } else {
            expect(filters.itemLevel).toEqual({
              value: Math.min(level, data.level),
              disabled: false,
            });
            const request = createTradeRequest(filters, [], item);
            expect(request.query.filters.type_filters?.filters.ilvl).toEqual({
              min: Math.min(level, data.level),
            });
            expect(
              request.query.filters.misc_filters?.filters.identified,
            ).toEqual({ option: "false" });
          }
        }
      }
    },
  );

  it.each([
    ItemCategory.OneHandedMace,
    ItemCategory.Flask,
    ItemCategory.Charm,
    ItemCategory.Ring,
  ])(
    "selects useful level in the actual unidentified preset for %s",
    (category) => {
      const presets = createPresets(base(category), createTestCreateOptions());
      expect(presets.presets).toHaveLength(1);
      expect(presets.presets[0].filters.itemLevel?.disabled).toBe(false);
    },
  );

  it.each([2, 4, 5])(
    "selects both Unidentified and its tier %s in the outgoing query",
    (tier) => {
      const item = {
        ...base(ItemCategory.OneHandedMace),
        unidentifiedTier: tier,
      };
      const filters = createFilters(item, createTestCreateOptions());
      expect(filters.unidentifiedTier).toEqual({
        value: tier,
        disabled: false,
      });
      expect(
        createTradeRequest(filters, [], item).query.filters.misc_filters
          ?.filters.unidentified_tier,
      ).toEqual({ min: tier });
      expect(
        createTradeRequest(filters, [], item).query.filters.misc_filters
          ?.filters.identified,
      ).toEqual({ option: "false" });
    },
  );

  it("does not select item level for unidentified uniques", () => {
    const item = { ...base(ItemCategory.Ring), rarity: ItemRarity.Unique };
    const filters = createFilters(item, createTestCreateOptions());
    expect(filters.itemLevel).toBeUndefined();
    expect(filters.unidentified?.disabled).toBe(false);
  });

  it("also omits item level after the unidentified unique is resolved", async () => {
    setupTests();
    await init("en");
    const item = {
      ...base(ItemCategory.Amulet),
      rarity: ItemRarity.Unique,
      info: ITEM_BY_REF("UNIQUE", "Astramentis")![0],
    };
    const filters = createFilters(item, createTestCreateOptions());
    const request = createTradeRequest(filters, [], item);
    expect(filters.itemLevel).toBeUndefined();
    expect(request.query.filters.type_filters?.filters.ilvl).toBeUndefined();
    expect(request.query.filters.misc_filters?.filters.identified).toEqual({
      option: "false",
    });
  });

  it.each([ItemCategory.Flask, ItemCategory.Charm])(
    "keeps identified %s item level optional",
    (category) => {
      const filters = createFilters(
        { ...base(category), isUnidentified: false },
        { ...createTestCreateOptions(), exact: true },
      );
      expect(filters.itemLevel).toEqual({ value: 83, disabled: true });
      expect(filters.unidentified).toBeUndefined();
    },
  );

  it("preserves actual levels for unknown classes and does not auto-select non-equipment", () => {
    for (const category of [ItemCategory.Unknown, ItemCategory.Wombgift]) {
      expect(maxUsefulItemLevel(category)).toBe(Infinity);
      const filters = createFilters(
        base(category, 100),
        createTestCreateOptions(),
      );
      expect(filters.itemLevel).toEqual({ value: 100, disabled: true });
    }
    expect(maxUsefulItemLevel(undefined)).toBe(Infinity);
    expect(
      createFilters(base(ItemCategory.Map), createTestCreateOptions())
        .itemLevel,
    ).toBeUndefined();
  });
});
