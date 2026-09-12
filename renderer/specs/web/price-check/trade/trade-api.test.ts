import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupTests } from "@specs/vitest.setup";
import { createTestCreateOptions, createTestItem } from "@specs/helper";
import { createFilters } from "@/web/price-check/filters/create-item-filters";
import { useTradeApi } from "@/web/price-check/trade/trade-api";
import {
  requestResults,
  requestTradeResultList,
  type PricingResult,
} from "@/web/price-check/trade/pathofexile-trade";

vi.mock("@/web/price-check/trade/pathofexile-trade", () => ({
  createTradeRequest: vi.fn(() => ({})),
  requestTradeResultList: vi.fn(),
  requestResults: vi.fn(),
}));

const fetchMock = vi.mocked(requestResults);
const searchMock = vi.mocked(requestTradeResultList);
const rows = (ids: string[]) =>
  ids.map(
    (id) =>
      ({
        id,
        accountName: id,
        priceAmount: 1,
        priceCurrency: "exalted",
      }) as PricingResult,
  );
function results(count: number, id = "query") {
  searchMock.mockResolvedValue({
    id,
    result: Array.from({ length: count }, (_, i) => `${id}-${i}`),
    total: count,
  });
}
function search(api: ReturnType<typeof useTradeApi>) {
  const item = createTestItem();
  return api.search(createFilters(item, createTestCreateOptions()), [], item);
}

beforeEach(() => {
  setupTests();
  vi.clearAllMocks();
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (_, ids) => rows(ids));
  results(45);
});

describe("manual listing pagination", () => {
  it("loads 20 initially, adds 20 per click, then hides at the final partial page", async () => {
    const api = useTradeApi();
    await search(api);
    expect(api.groupedResults.value).toHaveLength(20);
    expect(api.hasMore.value).toBe(true);
    await api.loadMore();
    expect(api.groupedResults.value).toHaveLength(40);
    await api.loadMore();
    expect(api.groupedResults.value).toHaveLength(45);
    expect(api.hasMore.value).toBe(false);
    await api.loadMore();
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls.every(([, ids]) => ids.length <= 10)).toBe(
      true,
    );
    expect(fetchMock.mock.calls.flatMap(([, ids]) => ids)).toEqual(
      api.groupedResults.value.map((row) => row.id),
    );
  });

  it.each([0, 8, 20])(
    "has no button when all %s IDs have been consumed",
    async (count) => {
      results(count);
      const api = useTradeApi();
      await search(api);
      expect(api.hasMore.value).toBe(false);
      await api.loadMore();
      expect(api.groupedResults.value).toHaveLength(count);
    },
  );

  it("keeps results and retries only the failed batch after a partial page failure", async () => {
    const api = useTradeApi();
    await search(api);
    fetchMock
      .mockResolvedValueOnce(
        rows(Array.from({ length: 10 }, (_, i) => `query-${20 + i}`)),
      )
      .mockRejectedValueOnce(new Error("Rate limited"));
    await api.loadMore();
    expect(api.groupedResults.value).toHaveLength(30);
    expect(api.error.value).toBeNull();
    expect(api.loadMoreError.value).toBe("Rate limited");
    expect(api.loadingMore.value).toBe(false);
    await api.loadMore();
    expect(api.groupedResults.value).toHaveLength(45);
    expect(new Set(api.groupedResults.value.map((row) => row.id)).size).toBe(
      45,
    );
    expect(api.loadMoreError.value).toBeNull();
    expect(fetchMock.mock.calls[4][1][0]).toBe("query-30");
  });

  it("ignores double clicks and discards old pages when another item is searched", async () => {
    const api = useTradeApi();
    await search(api);
    let resolve!: (rows: PricingResult[]) => void;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const loading = api.loadMore();
    expect(api.loadingMore.value).toBe(true);
    await api.loadMore();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    results(8, "new");
    await search(api);
    resolve(rows(["old-page"]));
    await loading;
    expect(api.groupedResults.value).toHaveLength(8);
    expect(
      api.groupedResults.value.every((row) => row.id.startsWith("new-")),
    ).toBe(true);
    expect(api.hasMore.value).toBe(false);
    expect(api.loadingMore.value).toBe(false);
  });

  it("does not let a stale search failure replace new results", async () => {
    const api = useTradeApi();
    let reject!: (error: Error) => void;
    searchMock.mockImplementationOnce(
      () =>
        new Promise((_, fail) => {
          reject = fail;
        }),
    );
    const old = search(api);
    results(8, "new");
    await search(api);
    reject(new Error("Old failure"));
    await old;
    expect(api.error.value).toBeNull();
    expect(api.searchResult.value?.id).toBe("new");
  });

  it("advances past vanished listings without repeating requests", async () => {
    results(25);
    const api = useTradeApi();
    await search(api);
    fetchMock.mockResolvedValueOnce([]);
    await api.loadMore();
    expect(api.hasMore.value).toBe(false);
    expect(api.groupedResults.value).toHaveLength(20);
  });

  it("preserves automatic grouping fetch cap and allows manual loading beyond 100", async () => {
    results(125);
    fetchMock.mockImplementation(async (_, ids) =>
      rows(ids).map((row) => ({ ...row, accountName: "same seller" })),
    );
    const api = useTradeApi();
    await search(api);
    expect(fetchMock).toHaveBeenCalledTimes(10);
    expect(api.groupedResults.value[0].listedTimes).toBe(100);
    expect(api.hasMore.value).toBe(true);
    await api.loadMore();
    expect(api.groupedResults.value[0].listedTimes).toBe(120);
    await api.loadMore();
    expect(api.groupedResults.value[0].listedTimes).toBe(125);
    expect(api.hasMore.value).toBe(false);
  });
});
