import { beforeAll, describe, expect, it } from "vitest";
import { init } from "@/assets/data";
import { ModifierType } from "@/parser/modifiers";
import { ItemCategory, ItemRarity } from "@/parser";
import {
  createExactStatFilters,
  calculatedStatToFilter,
} from "@/web/price-check/filters/create-stat-filters";
import {
  createTestItem,
  makeCalcStat,
  createTestCreateOptions,
} from "@specs/helper";
import { createPresets } from "@/web/price-check/filters/create-presets";
import { setupTests } from "@specs/vitest.setup";

beforeAll(async () => {
  setupTests();
  await init("en");
});

describe("Waystone and Tablet minimums", () => {
  it.each([ItemCategory.Map, ItemCategory.Tablet])(
    "uses independent tolerances for %s in every preset",
    (category) => {
      const item = {
        ...createTestItem(),
        category,
        rarity: ItemRarity.Rare,
        mapTier: 99,
      };
      const calc = makeCalcStat(
        "#% increased Pack Size in Map",
        100,
        ModifierType.Implicit,
      );
      item.statsByType = [calc];
      const opts = {
        ...createTestCreateOptions(),
        mapStatRange: 20,
        tabletStatRange: 40,
      };
      const expected = category === ItemCategory.Map ? 80 : 60;
      expect(
        createExactStatFilters(item, [calc], opts).find(
          (f) => f.statRef === calc.stat.ref,
        )?.roll?.min,
      ).toBe(expected);
      const { presets } = createPresets(item, opts);
      for (const preset of presets) {
        expect(
          preset.stats.find((f) => f.statRef === calc.stat.ref)?.roll?.min,
        ).toBe(expected);
      }
      opts.tabletStatRange = 0;
      const exact = category === ItemCategory.Map ? 80 : 100;
      expect(
        createExactStatFilters(item, [calc], opts).find(
          (f) => f.statRef === calc.stat.ref,
        )?.roll?.min,
      ).toBe(exact);
    },
  );
  it.each([
    [5, 9],
    [6, 14],
    [10, 14],
    [11, 19],
    [15, 19],
    [16, 24],
  ])(
    "matches the applicable range for tier %s instead of the global maximum",
    (mapTier, max) => {
      const item = {
        ...createTestItem(),
        category: ItemCategory.Map,
        rarity: ItemRarity.Rare,
        mapTier,
      };
      const calc = makeCalcStat(
        "Monsters deal #% of Damage as Extra Fire",
        max,
      );
      expect(calculatedStatToFilter(calc, 20, item).roll?.min).toBe(max);
      expect(calculatedStatToFilter(calc, 20, item).roll?.max).toBeUndefined();
      calc.sources[0].contributes!.value = max - 1;
      expect(calculatedStatToFilter(calc, 20, item).roll?.min).toBe(
        Math.floor((max - 1) * 0.8),
      );
    },
  );
  it("uses the exact tablet maximum even without copied ranges", () => {
    const item = {
      ...createTestItem(),
      category: ItemCategory.Tablet,
      rarity: ItemRarity.Magic,
    };
    item.info = { ...item.info, refName: "Breach Tablet" };
    const calc = makeCalcStat("#% increased Pack Size in Map", 7);
    expect(calculatedStatToFilter(calc, 20, item).roll?.min).toBe(7);
    calc.sources[0].contributes!.value = 6;
    expect(calculatedStatToFilter(calc, 20, item).roll?.min).toBe(4);
  });
  it("uses copied unique ranges and preserves the non-perfect unique tolerance", () => {
    const item = {
      ...createTestItem(),
      category: ItemCategory.Tablet,
      rarity: ItemRarity.Unique,
    };
    const calc = makeCalcStat("#% increased Pack Size in Map", 20);
    Object.assign(calc.sources[0].contributes!, { min: 10, max: 20 });
    expect(calculatedStatToFilter(calc, 20, item).roll?.min).toBe(20);
    calc.sources[0].contributes!.value = 19;
    expect(calculatedStatToFilter(calc, 20, item).roll?.min).toBe(17);
  });
  it("requires every contributing roll to be perfect", () => {
    const item = {
      ...createTestItem(),
      category: ItemCategory.Tablet,
      rarity: ItemRarity.Rare,
    };
    const calc = makeCalcStat("#% increased Pack Size in Map", 10);
    Object.assign(calc.sources[0].contributes!, { min: 5, max: 10 });
    calc.sources.push({
      ...calc.sources[0],
      contributes: { value: 9, min: 5, max: 10 },
    });
    expect(calculatedStatToFilter(calc, 20, item).roll?.min).toBe(15);
    calc.sources[1].contributes!.value = 10;
    expect(calculatedStatToFilter(calc, 20, item).roll?.min).toBe(20);
  });
  it("keeps unknown ranges at the selected percentage", () => {
    const item = {
      ...createTestItem(),
      category: ItemCategory.Tablet,
      rarity: ItemRarity.Rare,
    };
    expect(
      calculatedStatToFilter(
        makeCalcStat("#% increased Pack Size in Map", 7),
        20,
        item,
      ).roll?.min,
    ).toBe(5);
    item.category = ItemCategory.Map;
    item.mapTier = 99;
    expect(
      calculatedStatToFilter(
        makeCalcStat("Monsters deal #% of Damage as Extra Fire", 24),
        20,
        item,
      ).roll?.min,
    ).toBe(19);
  });
  it("leaves equipment minimums unchanged", () => {
    const item = {
      ...createTestItem(),
      category: ItemCategory.Gloves,
      rarity: ItemRarity.Rare,
    };
    const calc = makeCalcStat("#% increased Pack Size in Map", 7);
    expect(calculatedStatToFilter(calc, 20, item).roll?.min).toBe(7);
  });
});
