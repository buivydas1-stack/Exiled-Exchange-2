import { beforeAll, describe, expect, it } from "vitest";
import { setupTests } from "@specs/vitest.setup";
import { init } from "@/assets/data";
import { parseClipboard } from "@/parser";
import { createPresets } from "@/web/price-check/filters/create-presets";
import { createTradeRequest } from "@/web/price-check/trade/pathofexile-trade";
import { createTestCreateOptions } from "@specs/helper";

const tablet = `Item Class: Tablet
Rarity: Rare
Expedition Tablet
--------
Item Level: 82
--------
{ Implicit Modifier }
Adds a Kalguuran Expedition to a Map
10 uses remaining
--------
{ Prefix Modifier "Treasurer's" (Tier: 1) }
Map contains 3(2-3) additional Rare Chests
{ Prefix Modifier "Elevated" (Tier: 1) }
15(12-18)% increased Experience gain in Map
{ Suffix Modifier "of Remnants" (Tier: 1) }
Expeditions have +31(30-40)% Surpassing chance to contain an additional Verisium Remnant
{ Suffix Modifier "of Preservation" (Tier: 1) }
Expeditions contain 1 Additional Boss encased in ice in Map
--------
Can be used in a personal Map Device to add modifiers to a Map.`;

describe("Expedition Tablet Verisium Remnant modifier", () => {
  beforeAll(async () => {
    setupTests();
    await init("en");
  });

  it("parses the roll and searches using the matching trade stat", () => {
    const item = parseClipboard(tablet)._unsafeUnwrap();
    expect(item.unknownModifiers).toEqual([]);

    const { active, presets } = createPresets(item, {
      ...createTestCreateOptions(),
      defaultAllSelected: true,
    });
    expect(active).toBe("filters.preset_exact");
    const filter = presets[0].stats.find((stat) =>
      stat.tradeId.includes("explicit.stat_3653794255"),
    );
    expect(filter).toBeDefined();
    expect(filter?.roll?.value).toBe(31);
    expect(filter?.disabled).toBe(false);

    const request = createTradeRequest(presets[0].filters, presets[0].stats, item);
    expect(
      request.query.stats.flatMap((group) => group.filters),
    ).toContainEqual(
      expect.objectContaining({ id: "explicit.stat_3653794255" }),
    );
  });
});
