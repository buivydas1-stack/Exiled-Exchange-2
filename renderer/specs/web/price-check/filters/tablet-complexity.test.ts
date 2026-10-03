import { beforeAll, describe, expect, it } from "vitest";
import { setupTests } from "@specs/vitest.setup";
import { init } from "@/assets/data";
import { ItemCategory, parseClipboard } from "@/parser";
import { createPresets } from "@/web/price-check/filters/create-presets";
import { createTradeRequest } from "@/web/price-check/trade/pathofexile-trade";
import { createTestCreateOptions } from "@specs/helper";

const tablet = `Item Class: Tablet
Rarity: Rare
Interdimensional Liturgy
Ritual Tablet
--------
Item Level: 78
--------
{ Implicit Modifier }
Adds Ritual Altars to a Map
10 uses remaining
--------
{ Prefix Modifier "Collector's" (Tier: 1) }
9(8-12)% increased Rarity of Items found in Map
{ Prefix Modifier "Elevated" (Tier: 1) }
13(12-18)% increased Experience gain in Map
{ Suffix Modifier "of the Antiquarian" (Tier: 1) }
Map contains an additional Strongbox
{ Suffix Modifier "of the Appeal" (Tier: 1) }
Favours Deferred at Ritual Altars in Map reappear 38(25-40)% sooner
--------
Can be used in a personal Map Device to add modifiers to a Map.`;

describe("rare Ritual Tablet trade query", () => {
  beforeAll(async () => {
    setupTests();
    await init("en");
  });

  it("keeps rarity and every selected stat without an unused sanctified filter", () => {
    const item = parseClipboard(tablet)._unsafeUnwrap();
    expect(item.unknownModifiers).toEqual([]);
    const { presets } = createPresets(item, {
      ...createTestCreateOptions(),
      league: "Forbidden Rites",
      defaultAllSelected: true,
    });
    const request = createTradeRequest(
      presets[0].filters,
      presets[0].stats,
      item,
    );
    expect(request.query.filters.type_filters?.filters.rarity).toEqual({
      option: "rare",
    });
    expect(
      request.query.filters.misc_filters?.filters.sanctified,
    ).toBeUndefined();
    expect(request.query.filters.misc_filters?.filters.corrupted).toEqual({
      option: "false",
    });
    expect(
      request.query.stats
        .flatMap((group) => group.filters)
        .filter((filter) => !filter.disabled),
    ).toHaveLength(8);
  });

  it.each([0, 10, 25])(
    "uses the separate %s%% range and preserves uses remaining",
    (mapStatRange) => {
      const item = parseClipboard(tablet)._unsafeUnwrap();
      const { presets } = createPresets(item, {
        ...createTestCreateOptions(),
        searchStatRange: 50,
        mapStatRange,
      });
      const stats = presets[0].stats;
      const experience = stats.find((stat) => stat.roll?.value === 13)!;
      expect(experience.roll?.min).toBe(
        Math.max(12, Math.floor(13 * (1 - mapStatRange / 100))),
      );
      expect(experience.roll?.max).toBeUndefined();
      expect(
        stats.find((stat) => stat.statRef === "# uses remaining")?.roll?.min,
      ).toBe(10);
      expect(
        stats.find((stat) => stat.text.includes("additional Strongbox"))?.roll
          ?.min,
      ).toBe(1);
    },
  );

  it("keeps the original range for equipment independently of the new setting", () => {
    const item = parseClipboard(tablet)._unsafeUnwrap();
    item.category = ItemCategory.Gloves;
    item.info.craftable = { category: ItemCategory.Gloves };
    const { active, presets } = createPresets(item, {
      ...createTestCreateOptions(),
      searchStatRange: 10,
      mapStatRange: 50,
    });
    expect(
      presets
        .find((preset) => preset.id === active)
        ?.stats.find((stat) => stat.roll?.value === 38)?.roll?.min,
    ).toBe(34);
  });

  it("uses the exact minimum for a perfect magic modifier roll", () => {
    const item = parseClipboard(
      tablet
        .replace("Rarity: Rare", "Rarity: Magic")
        .replace("13(12-18)", "18(12-18)"),
    )._unsafeUnwrap();
    const { presets } = createPresets(item, {
      ...createTestCreateOptions(),
      mapStatRange: 10,
    });
    expect(
      presets[0].stats.find((stat) => stat.roll?.value === 18)?.roll?.min,
    ).toBe(18);
  });
});
