import { beforeAll, describe, expect, it } from "vitest";
import { init } from "@/assets/data";
import { parseClipboard } from "@/parser";
import { setupTests } from "@specs/vitest.setup";

describe("recently renamed unique items", () => {
  beforeAll(async () => {
    setupTests();
    await init("en");
  });

  it.each([
    ["Eshtera's Path", "Ring", "Rings"],
    ["Safrin's Resolve", "Ring", "Rings"],
    ["Zaida's Longevity", "Ring", "Rings"],
    ["Reverie", "Shaman Mantle", "Body Armours"],
    ["Reverie", "Runemastered Shaman Mantle", "Body Armours"],
  ])(
    "recognizes %s on %s without downloaded fallback data",
    (name, base, itemClass) => {
      const item = parseClipboard(
        `Item Class: ${itemClass}\nRarity: Unique\n${name}\n${base}\n--------\nItem Level: 83\n--------\n+20 to maximum Life`,
      )._unsafeUnwrap();
      expect(item.info.refName).toBe(name);
      expect(item.info.unique?.base).toBe(base);
      expect(item.unknownModifiers).toEqual([]);
    },
  );
});
