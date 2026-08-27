import { beforeEach, describe, expect, test, vi } from "vitest";

import { type DNSList, fetchDNSList } from "../../utils/dns.js";
import { dnsCache } from "../dns.js";

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

const DNS_LIST = list([
	[["com", "net"], ["https://rdap.example-a.net/"]],
	[["uk"], ["https://rdap.example-b.net"]],
]);

describe("dnsCache", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		dnsCache.flush();
		vi.mocked(fetchDNSList).mockResolvedValue(DNS_LIST);
	});

	test("fetches the list on a cold lookup and strips a trailing slash", async () => {
		await expect(dnsCache.get("com")).resolves.toBe(
			"https://rdap.example-a.net",
		);
		expect(fetchDNSList).toHaveBeenCalledTimes(1);
	});

	test("leaves a server without a trailing slash alone", async () => {
		await expect(dnsCache.get("uk")).resolves.toBe("https://rdap.example-b.net");
	});

	test("serves a repeat lookup from cache", async () => {
		await dnsCache.get("com");
		await expect(dnsCache.get("com")).resolves.toBe(
			"https://rdap.example-a.net",
		);
		expect(fetchDNSList).toHaveBeenCalledTimes(1);
	});

	test("caches every tld in the list, not just the one asked for", async () => {
		await dnsCache.get("com");

		// "net" shares a service entry with "com" and was cached alongside it.
		await expect(dnsCache.get("net")).resolves.toBe(
			"https://rdap.example-a.net",
		);
		expect(fetchDNSList).toHaveBeenCalledTimes(1);
	});

	test("returns null for an unknown tld", async () => {
		await expect(dnsCache.get("badger")).resolves.toBeNull();
	});

	test("set() populates the cache without fetching", async () => {
		await dnsCache.set(DNS_LIST);

		await expect(dnsCache.get("com")).resolves.toBe(
			"https://rdap.example-a.net",
		);
		expect(fetchDNSList).not.toHaveBeenCalled();
	});

	test("set() does not overwrite a tld already cached", async () => {
		await dnsCache.set(DNS_LIST);
		await dnsCache.set(list([[["com"], ["https://rdap.replacement.net"]]]));

		await expect(dnsCache.get("com")).resolves.toBe(
			"https://rdap.example-a.net",
		);
	});

	test("flush() empties the cache so the next lookup refetches", async () => {
		await dnsCache.get("com");
		dnsCache.flush();

		await expect(dnsCache.get("com")).resolves.toBe(
			"https://rdap.example-a.net",
		);
		expect(fetchDNSList).toHaveBeenCalledTimes(2);
	});
});
