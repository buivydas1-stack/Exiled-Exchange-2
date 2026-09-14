import { describe, expect, it } from "vitest";
import { formatListingPrice } from "@/web/price-check/trade/listing-price";
import { DivCurrency, type CoreCurrency } from "@/web/background/Prices";

const divine = { priceAmount: 1, priceCurrency: "divine" };
describe("listing currency display", () => {
  it.each([
    [1, 349, "1 Div (349c)"],
    [2, 349, "2 Div (698c)"],
    [0.5, 100, "0.5 Div (50c)"],
    [1, 9.4, "1 Div (9\u200A.\u200A4c)"],
  ])(
    "converts %s Div using the supplied market rate %s",
    (amount, rate, expected) => {
      expect(
        formatListingPrice(
          { ...divine, priceAmount: Number(amount) },
          Number(rate),
        ),
      ).toBe(expected);
    },
  );
  it.each([undefined, NaN, Infinity, 0, -1])(
    "omits unavailable or invalid rate %s",
    (rate) => {
      expect(formatListingPrice(divine, rate)).toBe("1 Div");
    },
  );
  it("does not switch the chaos equivalent back to Divines or exalted", () => {
    const normalizedPriceCurrency: CoreCurrency = {
      id: "exalted",
      abbrev: "ex",
      ref: "Exalted Orb",
      text: "Exalted Orb",
      icon: "",
    };
    for (const currency of [normalizedPriceCurrency, DivCurrency]) {
      expect(
        formatListingPrice(
          {
            ...divine,
            normalizedPrice: "999",
            normalizedPriceCurrency: currency,
          },
          349,
        ),
      ).toBe("1 Div (349c)");
    }
  });
  it("preserves other currencies and their existing conversion", () => {
    expect(
      formatListingPrice(
        {
          priceAmount: 20,
          priceCurrency: "exalted",
          normalizedPrice: "1",
          normalizedPriceCurrency: DivCurrency,
        },
        349,
      ),
    ).toBe("20 exalted (1 div)");
    expect(
      formatListingPrice({ priceAmount: 5, priceCurrency: "chaos" }, 349),
    ).toBe("5 chaos");
  });
});
