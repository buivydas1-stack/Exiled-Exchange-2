import { beforeAll, describe, expect, it } from "vitest";
import { setupTests } from "@specs/vitest.setup";
import { init } from "@/assets/data";
import { parseClipboard } from "@/parser";
import { createPresets } from "@/web/price-check/filters/create-presets";
import { createTradeRequest } from "@/web/price-check/trade/pathofexile-trade";
import { createTestCreateOptions } from "@specs/helper";

const boots = `Item Class: Boots
Rarity: Unique
The Knight-errant
Mail Sabatons
--------
Armour: 33 (augmented)
Evasion Rating: 26 (augmented)
--------
Requires: Level 6
--------
Item Level: 78
--------
{ Unique Modifier — Armour, Evasion }
50(30-50)% increased Armour and Evasion
{ Unique Modifier }
+45(30-50) to Stun Threshold
{ Unique Modifier — Speed }
10% increased Movement Speed
{ Unique Modifier — Armour, Evasion }
Iron Reflexes — Unscalable Value
{ Unique Modifier }
+46(30-50) to Ailment Threshold
--------
Some search forever for their path.`;

describe("The Knight-errant trade query", () => {
  beforeAll(async () => {
    setupTests();
    await init("en");
  });

  it("searches the fixed Iron Reflexes stat, not its unrelated variant", () => {
    const item = parseClipboard(boots)._unsafeUnwrap();
    const { presets } = createPresets(item, {
      ...createTestCreateOptions(),
      league: "Forbidden Rites",
      defaultAllSelected: true,
    });
    expect(item.unknownModifiers).toEqual([]);
    const request = createTradeRequest(
      presets[0].filters,
      presets[0].stats,
      item,
    );
    const enabledStats = request.query.stats
      .flatMap((group) => group.filters)
      .filter((filter) => !filter.disabled);
    expect(enabledStats.map((filter) => filter.id)).toContain(
      "explicit.stat_326965591",
    );
    expect(enabledStats.map((filter) => filter.id)).not.toContain(
      "explicit.stat_3831171903|21",
    );
  });
});
