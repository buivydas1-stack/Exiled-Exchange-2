import { beforeAll, describe, expect, it } from "vitest";
import { init } from "@/assets/data";
import { parseClipboard } from "@/parser";
import { ModifierType } from "@/parser/modifiers";
import { tryParseTranslation } from "@/parser/stat-translations";
import { createPresets } from "@/web/price-check/filters/create-presets";
import { setupTests } from "@specs/vitest.setup";
import { createTestCreateOptions } from "@specs/helper";

const CROSSBOW = `Item Class: Crossbows
Rarity: Rare
Torment Core
Trarthan Cannon
--------
Physical Damage: 58-134
Fire Damage: 53-61 (fire)
Critical Hit Chance: 5.00%
Attacks per Second: 1.40
--------
Requires: Level 65, 114 (unmet) Str, 63 Dex
--------
Item Level: 81
--------
{ Implicit Modifier }
Cannot load or fire Ammunition — Unscalable Value
--------
{ Prefix Modifier "Amazon's" (Tier: 2) — Attack }
+544(451-550) to Accuracy Rating
{ Prefix Modifier "Overpowering" (Tier: 2) — Damage, Elemental, Fire, Cold, Lightning }
109(100-119)% increased Elemental Damage with Attacks
{ Prefix Modifier "Scorching" (Tier: 5) — Damage, Elemental, Fire, Attack }
Adds 53(39-53) to 61(59-80) Fire Damage
{ Suffix Modifier "of Alacrity" (Tier: 1) }
36(33-40)% increased Cooldown Recovery Rate for Grenade Skills
{ Suffix Modifier "of Legend" (Tier: 1) — Life }
Gain 74(69-84) Life per enemy killed
{ Suffix Modifier "of Stockpiling" (Tier: 2) }
Grenade Skills have +1 Cooldown Use`;

describe("grenade cooldown uses", () => {
  beforeAll(async () => {
    setupTests();
    await init("en");
  });

  it("recognizes the supplied crossbow and produces a numeric trade filter", () => {
    const parsed = parseClipboard(CROSSBOW)._unsafeUnwrap();
    expect(parsed.unknownModifiers).toEqual([]);
    const { presets, active } = createPresets(
      parsed,
      createTestCreateOptions(),
    );
    const filter = presets
      .find((preset) => preset.id === active)!
      .stats.find(
        (stat) => stat.statRef === "Grenade Skills have +# Cooldown Use",
      );
    expect(filter?.tradeId).toEqual(["explicit.stat_2250681686"]);
    expect(filter?.roll?.value).toBe(1);
    expect(filter?.text).toBe("Grenade Skills have +# Cooldown Use");
  });

  it("also recognizes the plural wording", () => {
    const parsed = tryParseTranslation(
      { string: "Grenade Skills have +2 Cooldown Uses", unscalable: false },
      ModifierType.Explicit,
      undefined,
    );
    expect(parsed?.stat.trade.ids.explicit).toEqual([
      "explicit.stat_2250681686",
    ]);
    expect(parsed?.roll?.value).toBe(2);
  });
});
