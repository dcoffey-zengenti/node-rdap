import { beforeEach, describe, expect, test, vi } from "vitest";

import { type DNSList, fetchASNList } from "../../utils/dns.js";
import { autnumCache } from "../asn.js";

vi.mock("../../utils/dns.js", () => ({
	fetchDNSList: vi.fn(),
	fetchIpv4List: vi.fn(),
	fetchIpv6List: vi.fn(),
	fetchASNList: vi.fn(),
}));

const list = (services: [string[], string[]][]): DNSList => ({
	description: "test fixture",
	publication: "2026-01-01T00:00:00Z",
	version: "1.0",
	services,
});

const ASN_LIST = list([
	[["1-100"], ["https://rdap.example-a.net/"]],
	[["200-300"], ["https://rdap.example-b.net"]],
]);

describe("autnumCache", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		autnumCache.flush();
		vi.mocked(fetchASNList).mockResolvedValue(ASN_LIST);
	});

	test("fetches the list on a cold lookup and strips a trailing slash", async () => {
		await expect(autnumCache.get(50)).resolves.toBe(
			"https://rdap.example-a.net",
		);
		expect(fetchASNList).toHaveBeenCalledTimes(1);
	});

	test("leaves a server without a trailing slash alone", async () => {
		await expect(autnumCache.get(250)).resolves.toBe(
			"https://rdap.example-b.net",
		);
	});

	test("matches the range boundaries inclusively", async () => {
		await expect(autnumCache.get(1)).resolves.toBe("https://rdap.example-a.net");
		autnumCache.flush();
		await expect(autnumCache.get(100)).resolves.toBe(
			"https://rdap.example-a.net",
		);
	});

	test("serves a repeat lookup of the same number from the number cache", async () => {
		await autnumCache.get(50);

		// Drop the ranges so the per-number cache is the only thing that can
		// answer. Before it was populated, this fell through to a refetch.
		autnumCache.rangeCache.flushAll();

		await expect(autnumCache.get(50)).resolves.toBe(
			"https://rdap.example-a.net",
		);
		expect(fetchASNList).toHaveBeenCalledTimes(1);
	});

	test("serves an unseen number in a known range without refetching", async () => {
		await autnumCache.get(50);

		// Different number, same range. Answered from the range cache.
		await expect(autnumCache.get(60)).resolves.toBe(
			"https://rdap.example-a.net",
		);
		expect(fetchASNList).toHaveBeenCalledTimes(1);
	});

	test("returns null when no range contains the number", async () => {
		await expect(autnumCache.get(999999)).resolves.toBeNull();
	});

	test("returns null when a matching range has no server recorded", async () => {
		vi.mocked(fetchASNList).mockResolvedValue(list([[["1-100"], [""]]]));

		await autnumCache.get(50);
		await expect(autnumCache.get(60)).resolves.toBeNull();
	});

	test("reset() refetches the range list and drops cached numbers", async () => {
		await autnumCache.get(50);
		await autnumCache.reset();

		// Ranges survive the reset, so this resolves without a third fetch.
		await expect(autnumCache.get(50)).resolves.toBe(
			"https://rdap.example-a.net",
		);
		expect(fetchASNList).toHaveBeenCalledTimes(2);
	});

	test("flush() empties both caches so the next lookup refetches", async () => {
		await autnumCache.get(50);
		autnumCache.flush();

		await expect(autnumCache.get(50)).resolves.toBe(
			"https://rdap.example-a.net",
		);
		expect(fetchASNList).toHaveBeenCalledTimes(2);
	});
});
