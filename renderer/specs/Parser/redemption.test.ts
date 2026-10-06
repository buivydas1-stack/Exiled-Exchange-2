import { beforeAll, describe, expect, it } from "vitest";
import { init, StatBetter } from "@/assets/data";
import { parseClipboard } from "@/parser";
import { createPresets } from "@/web/price-check/filters/create-presets";
import { createTestCreateOptions } from "@specs/helper";
import { setupTests } from "@specs/vitest.setup";

const REDEMPTION = `Item Class: Crossbows
Rarity: Unique
Redemption
Trarthan Cannon
--------
Physical Damage: 266-614 (augmented)
Critical Hit Chance: 5.00%
Attacks per Second: 1.40
--------
Requires: Level 65, 114 Str, 63 Dex
--------
Item Level: 83
--------
{ Implicit Modifier }
Cannot load or fire Ammunition — Unscalable Value
--------
{ Unique Modifier — Damage, Physical, Attack }
358(300-400)% increased Physical Damage
{ Unique Modifier — Damage, Critical }
Hits with this Weapon have no Critical Damage Bonus — Unscalable Value
{ Unique Modifier }
39(40-20)% reduced Cooldown Recovery Rate
{ Unique Modifier }
Gain 1 Explosive Rhythm every 2(2-3) times you use a Grenade Skill
Remove all Explosive Rhythm on reaching 10 to gain Explosive Fervour for 10 Seconds
--------
"The time has passed for diplomacy!
If they will not respect House Azadi,
then let them die gloriously... and loudly.
We are the masters of the Death Trades!"
- Ratha Azadi`;

describe("Redemption", () => {
  beforeAll(async () => {
    setupTests();
    await init("en");
  });

  it.each(["", " ", "\t"])(
    "recognizes the whole modifier with %j indentation",
    (indent) => {
      const item = parseClipboard(
        REDEMPTION.replace("\nRemove all", `\n${indent}Remove all`),
      )._unsafeUnwrap();
      expect(item.unknownModifiers).toEqual([]);
      const rhythm = item.statsByType.find((stat) =>
        stat.stat.trade.ids.explicit?.includes("explicit.stat_4128965096"),
      );
      expect(rhythm?.stat.better).toBe(StatBetter.NegativeRoll);
      const { presets, active } = createPresets(
        item,
        createTestCreateOptions(),
      );
      const filter = presets
        .find((preset) => preset.id === active)!
        .stats.find((stat) =>
          stat.tradeId.includes("explicit.stat_4128965096"),
        );
      expect(filter?.roll?.value).toBe(2);
      expect(filter?.roll?.min).toBeUndefined();
      expect(filter?.roll?.max).toBe(2);
      expect(filter?.sources).toHaveLength(1);
    },
  );
});
