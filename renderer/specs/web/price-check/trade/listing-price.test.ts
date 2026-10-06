import { describe, expect, it } from "vitest";
import { formatListingPrice } from "@/web/price-check/trade/listing-price";

const divine = { priceAmount: 1, priceCurrency: "divine" };
describe("listing currency display", () => {
  it.each([
    [1, 349, "1 Div (349.00c)"],
    [2, 349, "2 Div (698.00c)"],
    [0.5, 100, "0.5 Div (50.00c)"],
    [1, 9.4, "1 Div (9.40c)"],
  ])(
    "converts %s Div using the supplied Chaos rate %s",
    (amount, rate, expected) => {
      expect(formatListingPrice({ ...divine, priceAmount: amount }, rate)).toBe(
        expected,
      );
    },
  );

  it.each([undefined, NaN, Infinity, 0, -1])(
    "omits an unavailable or invalid rate %s",
    (rate) => {
      expect(formatListingPrice(divine, rate)).toBe("1 Div");
      expect(
        formatListingPrice(
          { priceAmount: 20, priceCurrency: "exalted" },
          349,
          rate,
        ),
      ).toBe("20 exalted");
    },
  );

  it.each([0.5, 20, 100000])(
    "keeps the Chaos unit for %s Exalted Orbs",
    (amount) => {
      expect(
        formatListingPrice(
          { priceAmount: amount, priceCurrency: "exalted" },
          100,
          0.05,
        ),
      ).toBe(`${amount} exalted (${(amount * 0.05).toFixed(2)}c)`);
    },
  );

  it.each([
    [59, 0.85, "59 vaal (85.00c)"],
    [67, 0.99, "67 vaal (99.00c)"],
    [100, 1.51, "100 vaal (151.00c)"],
  ])(
    "converts %s Vaal Orbs before unit switching or rounding",
    (amount, priceInDivines, expected) => {
      expect(
        formatListingPrice(
          { priceAmount: amount, priceCurrency: "vaal", priceInDivines },
          100,
        ),
      ).toBe(expected);
    },
  );

  it("does not repeat Chaos prices or invent unavailable equivalents", () => {
    expect(
      formatListingPrice(
        { priceAmount: 5, priceCurrency: "chaos", priceInDivines: 0.05 },
        100,
      ),
    ).toBe("5 chaos");
    expect(
      formatListingPrice({ priceAmount: 5, priceCurrency: "vaal" }, 100),
    ).toBe("5 vaal");
  });

  it("shows zero with two decimals for equivalents below 0.01 Chaos", () => {
    expect(
      formatListingPrice(
        { priceAmount: 0.01, priceCurrency: "exalted" },
        100,
        0.05,
      ),
    ).toBe("0.01 exalted (0.00c)");
    expect(
      formatListingPrice(
        { priceAmount: 1, priceCurrency: "vaal", priceInDivines: 0.000099 },
        100,
      ),
    ).toBe("1 vaal (0.00c)");
  });
});
