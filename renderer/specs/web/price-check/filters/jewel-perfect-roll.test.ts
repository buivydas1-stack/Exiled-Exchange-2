import { beforeAll, expect, it } from "vitest";
import { init } from "@/assets/data";
import { ItemCategory, ItemRarity } from "@/parser";
import { ModifierType } from "@/parser/modifiers";
import { calculatedStatToFilter } from "@/web/price-check/filters/create-stat-filters";
import { createTestItem, makeCalcStat } from "@specs/helper";
import { setupTests } from "@specs/vitest.setup";

beforeAll(async () => {
  setupTests();
  await init("en");
});

it.each([ItemRarity.Rare, ItemRarity.Magic, ItemRarity.Unique])(
  "uses an exact minimum for a perfect jewel of rarity %s",
  (rarity) => {
    const item = { ...createTestItem(), category: ItemCategory.Jewel, rarity };
    const calc = makeCalcStat("#% increased Pack Size in Map", 20);
    Object.assign(calc.sources[0].contributes!, { min: 10, max: 20 });
    expect(calculatedStatToFilter(calc, 20, item).roll?.min).toBe(20);
    calc.sources[0].contributes!.value = 19;
    expect(calculatedStatToFilter(calc, 20, item).roll?.min).toBe(
      rarity === ItemRarity.Unique ? 17 : 15,
    );
  },
);

it("requires all contributions to be perfect and preserves the maximum", () => {
  const item = {
    ...createTestItem(),
    category: ItemCategory.Jewel,
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
  const filter = calculatedStatToFilter(calc, 20, item);
  expect(filter.roll?.min).toBe(20);
  expect(filter.roll?.max).toBeUndefined();
});

it("preserves existing defaults for unknown ranges and pseudo totals", () => {
  const item = {
    ...createTestItem(),
    category: ItemCategory.Jewel,
    rarity: ItemRarity.Rare,
  };
  const calc = makeCalcStat("#% increased Pack Size in Map", 20);
  expect(calculatedStatToFilter(calc, 20, item).roll?.min).toBe(20);
  Object.assign(calc.sources[0].contributes!, { min: 10, max: 20 });
  calc.type = ModifierType.Pseudo;
  expect(calculatedStatToFilter(calc, 20, item).roll?.min).toBe(16);
});
