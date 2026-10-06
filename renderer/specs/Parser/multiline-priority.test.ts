import { beforeAll, describe, expect, it } from "vitest";
import { init } from "@/assets/data";
import { parseClipboard } from "@/parser";
import { setupTests } from "@specs/vitest.setup";

describe("multiline modifier priority", () => {
  beforeAll(async () => {
    setupTests();
    await init("en");
  });

  it.each([
    ["Gravebind", "Rope Cuffs"],
    ["Loreweave", "Ornate Ringmail"],
  ])("keeps the complete rarity modifier on %s", (name, base) => {
    const item = parseClipboard(
      `Item Class: ${name === "Gravebind" ? "Gloves" : "Body Armours"}\nRarity: Unique\n${name}\n${base}\n--------\nItem Level: 83\n--------\n{ Unique Modifier }\n20(15-20)% increased Rarity of Items found\nYour other Modifiers to Rarity of Items found do not apply\n{ Unique Modifier }\n+11(10-20)% to Cold Resistance`,
    )._unsafeUnwrap();
    expect(item.unknownModifiers).toEqual([]);
    const rarity = item.statsByType.find((stat) =>
      stat.stat.ref.startsWith("#% increased Rarity"),
    );
    expect(rarity?.stat.trade.ids.explicit).toEqual([
      "explicit.stat_1602191394",
      "explicit.stat_2261942307",
    ]);
    expect(rarity?.sources[0].contributes?.value).toBe(20);
    expect(
      item.statsByType.some(
        (stat) => stat.stat.ref === "#% to Cold Resistance",
      ),
    ).toBe(true);
  });

  it("keeps unrelated modifiers separate and unknown text visible", () => {
    const item = parseClipboard(
      `Item Class: Gloves\nRarity: Unique\nGravebind\nRope Cuffs\n--------\nItem Level: 83\n--------\n{ Unique Modifier }\n20% increased Rarity of Items found\n{ Unique Modifier }\n+11% to Cold Resistance\n{ Unique Modifier }\nUnknown future modifier`,
    )._unsafeUnwrap();
    expect(item.unknownModifiers.map((mod) => mod.text)).toEqual([
      "Unknown future modifier",
    ]);
    expect(
      item.statsByType.find((stat) =>
        stat.stat.ref.startsWith("#% increased Rarity"),
      )?.stat.ref,
    ).toBe("#% increased Rarity of Items found");
  });
});
