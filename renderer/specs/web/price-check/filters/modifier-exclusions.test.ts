import { describe, expect, it } from "vitest";
import {
  compileModifierExclusions,
  applyModifierExclusions,
} from "@/web/price-check/filters/modifier-exclusions";
import { createTestStatFilter, createTestCreateOptions } from "@specs/helper";
import { setupTests } from "@specs/vitest.setup";
import { init } from "@/assets/data";
import { parseClipboard } from "@/parser";
import { createPresets } from "@/web/price-check/filters/create-presets";
import { createTradeRequest } from "@/web/price-check/trade/pathofexile-trade";

const stat = (text: string, disabled = false) => ({
  ...createTestStatFilter(),
  text,
  disabled,
});

describe("modifier exclusion regex", () => {
  it("accepts blank settings and ignores blank lines", () => {
    expect(compileModifierExclusions()).toEqual({
      patterns: [],
      invalidLines: [],
    });
    expect(compileModifierExclusions(" \r\n\n").patterns).toHaveLength(0);
  });

  it("uses case-insensitive regex, trimming lines and supporting CRLF", () => {
    const { patterns, invalidLines } = compileModifierExclusions(
      "  ^Adds .* cold damage$  \r\nstun|light radius",
    );
    expect(invalidLines).toEqual([]);
    expect(patterns[0].test("Adds 10 to 20 Cold Damage")).toBe(true);
    expect(patterns[0].test("Does not start with Adds Cold Damage")).toBe(
      false,
    );
    expect(patterns[1].test("20% increased Stun Threshold")).toBe(true);
  });

  it("reports invalid line numbers without breaking valid patterns", () => {
    const { patterns, invalidLines } = compileModifierExclusions(
      "life\n[\n\n(\nstrength",
    );
    expect(invalidLines).toEqual([2, 4]);
    expect(patterns).toHaveLength(2);
  });

  it("only disables matching visible stats across every preset", () => {
    const a = stat("+30 to Strength");
    const b = stat("+80 to maximum Life");
    const c = stat("+20 to Dexterity", true);
    const hidden = { ...stat("Strength"), hidden: "hidden" };
    const second = stat("+40 to Strength");
    applyModifierExclusions(
      [{ stats: [a, b, c, hidden] }, { stats: [second] }],
      "strength",
    );
    expect([
      a.disabled,
      b.disabled,
      c.disabled,
      hidden.disabled,
      second.disabled,
    ]).toEqual([true, false, true, false, true]);
    a.disabled = false;
    expect(a.disabled).toBe(false); // No watcher enforcing exclusions after manual selection.
  });

  it("empty or wholly invalid input leaves defaults unchanged", () => {
    for (const input of ["", "[", undefined]) {
      const stats = [stat("Strength"), stat("Life", true)];
      applyModifierExclusions([{ stats }], input);
      expect(stats.map((s) => s.disabled)).toEqual([false, true]);
    }
  });

  it("excludes parsed modifiers before the trade request, allowing manual re-selection", async () => {
    setupTests();
    await init("en");
    const item = parseClipboard(
      'Item Class: Gloves\nRarity: Rare\nDoom Grasp\nSteelmail Gauntlets\n--------\nArmour: 89\nEvasion Rating: 81\n--------\nItem Level: 65\n--------\n{ Suffix Modifier "of the Titan" (Tier: 1) — Attribute }\n+32(31-33) to Strength\n{ Prefix Modifier "Fecund" (Tier: 1) — Life }\n+161(150-174) to maximum Life',
    )._unsafeUnwrap();
    const { presets } = createPresets(item, {
      ...createTestCreateOptions(),
      defaultAllSelected: true,
    });
    const filtersBefore = JSON.stringify(presets.map((p) => p.filters));
    const matches = presets[0].stats.filter(
      (s) => !s.hidden && /strength/i.test(s.text),
    );
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.some((s) => !s.disabled)).toBe(true);
    applyModifierExclusions(presets, "strength");
    expect(matches.every((s) => s.disabled)).toBe(true);
    expect(JSON.stringify(presets.map((p) => p.filters))).toBe(filtersBefore);
    const request = createTradeRequest(
      presets[0].filters,
      presets[0].stats,
      item,
    );
    const ids = request.query.stats.flatMap((group) =>
      group.filters.filter((f) => !f.disabled).map((f) => f.id),
    );
    for (const match of matches) expect(ids).not.toContain(match.tradeId[0]);
    matches[0].disabled = false;
    const manual = createTradeRequest(
      presets[0].filters,
      presets[0].stats,
      item,
    );
    expect(
      manual.query.stats.flatMap((group) => group.filters.filter((f) => !f.disabled).map((f) => f.id)),
    ).toContain(matches[0].tradeId[0]);
  });
});
