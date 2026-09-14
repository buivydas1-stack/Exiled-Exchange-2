import { beforeAll, describe, expect, it } from "vitest";
import { init, STAT_BY_REF } from "@/assets/data";
import { ModifierType } from "@/parser/modifiers";
import { createTradeRequest } from "@/web/price-check/trade/pathofexile-trade";
import { parseClipboard } from "@/parser";
import { setupTests } from "@specs/vitest.setup";
import { createTestCreateOptions } from "@specs/helper";
import { createPresets } from "@/web/price-check/filters/create-presets";
import { ItemHasEmptyModifier } from "@/web/price-check/filters/interfaces";

const mods = {
  Prefix:
    '{ Prefix Modifier "Fecund" (Tier: 1) — Life }\n+161(150-174) to maximum Life',
  Suffix:
    '{ Suffix Modifier "of the Titan" (Tier: 1) — Attribute }\n+32(31-33) to Strength',
};
beforeAll(async () => {
  setupTests();
  await init("en");
});

describe("empty modifier defaults", () => {
  it.each(["Prefix", "Suffix"] as const)(
    "selects Any for magic gear with one %s, preserving manual options",
    (slot) => {
      const item = parseClipboard(
        `Item Class: Gloves\nRarity: Magic\nSteelmail Gauntlets\n--------\nArmour: 89\nEvasion Rating: 81\n--------\nItem Level: 81\n--------\n${mods[slot]}`,
      )._unsafeUnwrap();
      const result = createPresets(item, createTestCreateOptions());
      expect(result.presets).toHaveLength(2);
      for (const preset of result.presets) {
        const filter = preset.stats.find(
          (s) => s.tradeId[0] === "item.has_empty_modifier",
        )!;
        expect(filter).toBeDefined();
        expect(filter.option?.value).toBe(ItemHasEmptyModifier.Any);
        expect(filter.roll?.min).toBe(1);
        const request = createTradeRequest(preset.filters, preset.stats, item);
        const anyId =
          STAT_BY_REF("# Empty Modifiers")!.trade.ids[ModifierType.Pseudo][0];
        expect(
          request.query.stats.some((group) =>
            group.filters.some((stat) => stat.id === anyId),
          ),
        ).toBe(true);
        expect(filter.additionalInfo?.emptyModifierInfo).toEqual({
          [ItemHasEmptyModifier.Any]: 1,
          [ItemHasEmptyModifier.Prefix]: slot === "Prefix" ? 0 : 1,
          [ItemHasEmptyModifier.Suffix]: slot === "Suffix" ? 0 : 1,
        });
      }
    },
  );

  it.each(["Prefix", "Suffix"] as const)(
    "preserves rare-item defaults when %s slots are full",
    (slot) => {
      const item = parseClipboard(
        `Item Class: Gloves\nRarity: Rare\nTest Gloves\nSteelmail Gauntlets\n--------\nArmour: 89\nEvasion Rating: 81\n--------\nItem Level: 81\n--------\n${mods[slot]}`,
      )._unsafeUnwrap();
      item.newMods = Array.from({ length: 3 }, () => item.newMods[0]);
      const result = createPresets(item, createTestCreateOptions());
      for (const preset of result.presets) {
        const filter = preset.stats.find(
          (s) => s.tradeId[0] === "item.has_empty_modifier",
        )!;
        expect(filter.option?.value).toBe(
          slot === "Prefix"
            ? ItemHasEmptyModifier.Suffix
            : ItemHasEmptyModifier.Prefix,
        );
      }
    },
  );
});
