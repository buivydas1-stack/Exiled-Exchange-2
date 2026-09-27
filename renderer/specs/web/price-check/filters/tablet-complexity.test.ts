import { beforeAll, describe, expect, it } from "vitest";
import { setupTests } from "@specs/vitest.setup";
import { init } from "@/assets/data";
import { parseClipboard } from "@/parser";
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
});
