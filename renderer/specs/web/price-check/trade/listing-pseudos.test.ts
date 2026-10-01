import { beforeAll, describe, expect, it } from "vitest";
import { init } from "@/assets/data";
import { ItemRarity } from "@/parser";
import { setupTests } from "@specs/vitest.setup";
import { listingPseudos } from "@/web/price-check/trade/listing-pseudos";
import type { DisplayItem } from "@/web/price-check/trade/pathofexile-trade";

function item(explicit: string[], implicit: string[] = []): DisplayItem {
  const lines = (texts: string[]) => texts.map((text) => ({ text, color: 1 }));
  return {
    title: ["Test"],
    rarity: ItemRarity.Rare,
    sockets: [],
    explicitMods: lines(explicit),
    implicitMods: lines(implicit),
  };
}

describe("listing tooltip totals", () => {
  beforeAll(async () => {
    setupTests();
    await init("en");
  });

  it("includes ring implicits and preserves the listing", () => {
    const ring = item(
      [
        "+31% to Fire Resistance",
        "+44% to Lightning Resistance",
        "+177 to maximum Mana",
      ],
      ["+22% to Fire Resistance"],
    );
    const original = JSON.stringify(ring);
    expect(listingPseudos(ring).map((total) => total.text)).toEqual(
      expect.arrayContaining([
        "+97% total Elemental Resistance",
        "+97% total Resistance",
        "+177 total maximum Mana",
      ]),
    );
    expect(JSON.stringify(ring)).toBe(original);
    expect(listingPseudos(ring)).toEqual(listingPseudos(ring));
  });

  it("counts combined/all resistances correctly and keeps chaos out of elemental totals", () => {
    const totals = listingPseudos(
      item([
        "+10% to all Elemental Resistances",
        "+12% to Fire and Cold Resistances",
        "+20% to Chaos Resistance",
      ]),
    );
    expect(totals.map((total) => total.text)).toEqual(
      expect.arrayContaining([
        "+54% total Elemental Resistance",
        "+74% total Resistance",
      ]),
    );
    expect(
      listingPseudos(item(["+20% to Chaos Resistance"])).map(
        (total) => total.text,
      ),
    ).toEqual(["+20% total Resistance"]);
  });

  it("reuses attribute contributions and displays additional selected pseudos", () => {
    const listing = item([
      "+108 to maximum Life",
      "+130 to maximum Mana",
      "+10 to Strength",
      "+15 to Intelligence",
      "+31% to Cold Resistance",
      "+29% to Lightning Resistance",
    ]);
    expect(listingPseudos(listing).map((total) => total.text)).toEqual(
      expect.arrayContaining([
        "+128 total maximum Life",
        "+160 total maximum Mana",
        "+60% total Resistance",
        "+60% total Elemental Resistance",
      ]),
    );
    expect(
      listingPseudos(listing, ["+# total to Strength"]).map(
        (total) => total.text,
      ),
    ).toContain("+10 total to Strength");
  });

  it("does not duplicate server-supplied totals", () => {
    const listing = item(["+31% to Cold Resistance"]);
    listing.pseudoMods = [
      { text: "+31% total Elemental Resistance", color: 1 },
    ];
    expect(
      listingPseudos(listing).some(
        (total) => total.ref === "#% total Elemental Resistance",
      ),
    ).toBe(false);
  });
});
