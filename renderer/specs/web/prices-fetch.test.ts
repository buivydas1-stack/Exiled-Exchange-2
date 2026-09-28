import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/web/Config", () => ({
  AppConfig: () => ({ coreCurrency: "exalted" }),
}));
vi.mock("@/assets/data", () => ({
  ITEM_BY_REF: () => [{ name: "Core currency" }],
}));
vi.mock("@/web/background/IPC", () => ({
  Host: { proxy: vi.fn() },
}));
vi.mock("@/web/background/Leagues", async () => {
  const { computed, shallowRef } = await import("vue");
  const selectedId = shallowRef("Forbidden Rites");
  return {
    useLeagues: () => ({
      selectedId,
      selected: computed(() => ({
        id: selectedId.value,
        isPopular: true,
        realm: "pc-ggg",
      })),
    }),
  };
});

const response = (body: string) => ({ text: async () => body }) as Response;
const overview =
  '{"core":{"rates":{"exalted":500,"chaos":8},"primary":"divine","secondary":"chaos"},"itemOverviews":[]}';

describe("currency market-data refresh", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("shares one unfinished download across repeated price checks", async () => {
    const { Host } = await import("@/web/background/IPC");
    const { usePoeninja } = await import("@/web/background/Prices");
    let finishFirst!: (value: ReturnType<typeof response>) => void;
    vi.mocked(Host.proxy).mockImplementation(async (url) => {
      if (String(url).endsWith("item-drop.json")) {
        return await new Promise((resolve) => {
          finishFirst = resolve;
        });
      }
      return response(
        String(url).endsWith("namespaceMap.json")
          ? '{"schemaVersion":1,"map":[]}'
          : overview,
      );
    });

    const prices = usePoeninja();
    prices.queuePricesFetch();
    prices.queuePricesFetch();
    prices.queuePricesFetch();
    expect(Host.proxy).toHaveBeenCalledTimes(1);
    expect(vi.mocked(Host.proxy).mock.calls[0][1]?.signal?.aborted).toBe(false);

    finishFirst(response("[]"));
    for (let i = 0; i < 30; i += 1) await Promise.resolve();
    expect(Host.proxy).toHaveBeenCalledTimes(3);
    expect(prices.exaltedChaosRate.value).toBeCloseTo(8 / 500);
    prices.queuePricesFetch();
    expect(Host.proxy).toHaveBeenCalledTimes(3);
  });

  it("times out a stuck download and shows a retryable warning", async () => {
    const { Host } = await import("@/web/background/IPC");
    const { usePoeninja } = await import("@/web/background/Prices");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(Host.proxy).mockImplementation((_url, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new Error("aborted")),
        );
      });
    });

    const prices = usePoeninja();
    prices.queuePricesFetch();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(prices.priceDataError.value).toBe("timeout");
    expect(Host.proxy).toHaveBeenCalledTimes(1);
    prices.retryPricesFetch();
    expect(Host.proxy).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it("shows a warning after a network failure and clears it after retry", async () => {
    const { Host } = await import("@/web/background/IPC");
    const { usePoeninja } = await import("@/web/background/Prices");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(Host.proxy)
      .mockRejectedValueOnce(new Error("network failed"))
      .mockImplementation(async (url) =>
        response(
          String(url).endsWith("item-drop.json")
            ? "[]"
            : String(url).endsWith("namespaceMap.json")
              ? '{"schemaVersion":1,"map":[]}'
              : overview,
        ),
      );

    const prices = usePoeninja();
    prices.queuePricesFetch();
    for (let i = 0; i < 10; i += 1) await Promise.resolve();
    expect(prices.priceDataError.value).toBe("failed");
    prices.retryPricesFetch();
    for (let i = 0; i < 30; i += 1) await Promise.resolve();
    expect(prices.priceDataError.value).toBeUndefined();
    expect(prices.exaltedChaosRate.value).toBeCloseTo(8 / 500);
  });
});
