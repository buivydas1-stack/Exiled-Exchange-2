import { describe, expect, it } from "vitest";
import { ItemCategory, ItemRarity } from "@/parser";
import { createTestCreateOptions, createTestItem } from "@specs/helper";
import { createPresets } from "@/web/price-check/filters/create-presets";
import { createTradeRequest } from "@/web/price-check/trade/pathofexile-trade";

function gloves(rarity: ItemRarity, itemLevel = 86) {
  const item = createTestItem();
  return {
    ...item,
    category: ItemCategory.Gloves,
    rarity,
    itemLevel,
    isUnidentified: false,
    info: {
      ...item.info,
      name: "Blacksteel Gauntlets",
      refName: "Blacksteel Gauntlets",
      craftable: { category: ItemCategory.Gloves },
    },
  };
}

describe("initial price-check preset", () => {
  it.each([ItemRarity.Normal, ItemRarity.Magic, ItemRarity.Rare])(
    "defaults %s waystones to Pseudo while preserving tier",
    (rarity) => {
      const item = {
        ...gloves(rarity),
        category: ItemCategory.Map,
        mapTier: 15,
      };
      const result = createPresets(item, createTestCreateOptions());
      expect(result.active).toBe("filters.preset_pseudo");
      const active = result.presets.find(
        (preset) => preset.id === result.active,
      )!;
      expect(active.filters.mapTier).toEqual({ value: 15, disabled: false });
      expect(active.filters.itemLevel).toBeUndefined();
    },
  );

  it.each([20, 65, 81, 82, 83, 86])(
    "starts magic gloves at ilvl %s in Base Item with capped level and magic rarity",
    (level) => {
      const item = gloves(ItemRarity.Magic, level);
      const result = createPresets(item, createTestCreateOptions());
      expect(result.active).toBe("filters.preset_base_item");
      expect(result.presets.map((preset) => preset.id)).toEqual([
        "filters.preset_pseudo",
        "filters.preset_base_item",
      ]);
      const preset = result.presets.find(
        (preset) => preset.id === result.active,
      )!;
      const request = createTradeRequest(preset.filters, preset.stats, item);
      expect(request.query.type).toBe("Blacksteel Gauntlets");
      expect(request.query.filters.type_filters?.filters.rarity).toEqual({
        option: "magic",
      });
      expect(request.query.filters.type_filters?.filters.ilvl).toEqual({
        min: Math.min(level, 82),
      });
    },
  );

  it("keeps Base Item available for magic items considered finished", () => {
    const item = { ...gloves(ItemRarity.Magic), quality: 20 };
    expect(createPresets(item, createTestCreateOptions()).active).toBe(
      "filters.preset_base_item",
    );
  });

  it("preserves the existing exact-base default for normal items", () => {
    const item = gloves(ItemRarity.Normal);
    const result = createPresets(item, createTestCreateOptions());
    expect(result.active).toBe("filters.preset_exact");
    expect(result.presets).toHaveLength(1);
    const preset = result.presets[0];
    const request = createTradeRequest(preset.filters, preset.stats, item);
    expect(request.query.type).toBe("Blacksteel Gauntlets");
    expect(request.query.filters.type_filters?.filters.rarity).toEqual({
      option: "normal",
    });
    expect(request.query.filters.type_filters?.filters.ilvl).toEqual({
      min: 82,
    });
  });

  it.each([ItemRarity.Rare, ItemRarity.Unique])(
    "preserves %s default",
    (rarity) => {
      expect(
        createPresets(gloves(rarity), createTestCreateOptions()).active,
      ).toBe("filters.preset_pseudo");
    },
  );

  it("preserves the exact unidentified preset", () => {
    const item = {
      ...gloves(ItemRarity.Magic),
      isUnidentified: true,
      unidentifiedTier: 2,
    };
    const result = createPresets(item, createTestCreateOptions());
    expect(result.active).toBe("filters.preset_exact");
    expect(result.presets[0].filters.unidentifiedTier).toEqual({
      value: 2,
      disabled: false,
    });
  });
});
