import { beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import { init, STAT_BY_MATCH_STR } from "@/assets/data";
import { normalizeStatText } from "@/assets/normalize-stat-text.mjs";
import { tryParseTranslation } from "@/parser/stat-translations";
import { ModifierType } from "@/parser/modifiers";
import { setupTests } from "@specs/vitest.setup";

describe("stat text normalization", () => {
  beforeAll(() => setupTests());

  it.each(["en", "ru", "cmn-Hant", "ko", "ja", "de", "es", "pt", "fr"])(
    "recognizes normalized multiline matchers in %s",
    async (language) => {
      await init(language);
      const stats = fs
        .readFileSync(`public/data/${language}/stats.ndjson`, "utf8")
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line));
      for (const stat of stats) {
        for (const matcher of stat.matchers) {
          for (const text of [matcher.string, matcher.advanced].filter(
            (value): value is string =>
              value !== undefined && value.includes("\n"),
          )) {
            const normalized = normalizeStatText(text);
            const found = STAT_BY_MATCH_STR(normalized);
            expect(found, `${language}: ${text}`).toBeDefined();
            expect([
              normalizeStatText(found!.matcher.string),
              found!.matcher.advanced &&
                normalizeStatText(found!.matcher.advanced),
            ]).toContain(normalized);
          }
        }
      }
    },
  );

  it.each([
    ["Projectiles from Spells Chain +1 times", "explicit.stat_1517628125"],
    [
      "Right ring slot: Projectiles from Spells Chain +2 times",
      "explicit.stat_1555918911",
    ],
  ])("recognizes signed spell-chain wording: %s", async (text, id) => {
    await init("en");
    const parsed = tryParseTranslation(
      { string: text, unscalable: false },
      ModifierType.Explicit,
      undefined,
    );
    expect(parsed?.stat.trade.ids.explicit).toEqual([id]);
  });

  it("recognizes Facebreaker's copied constant, including its plus sign", async () => {
    await init("en");
    expect(
      tryParseTranslation(
        { string: "+1 to Armour per Strength", unscalable: false },
        ModifierType.Explicit,
        undefined,
      )?.stat.trade.ids.explicit,
    ).toEqual(["explicit.stat_1291132817"]);
  });
});
