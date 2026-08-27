import { beforeEach, describe, expect, test, vi } from "vitest";

import { type DNSList, fetchIpv4List } from "../../utils/dns.js";
import { ipv4Cache } from "../ipv4.js";

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

const IPV4_LIST = list([
	[["8.0.0.0/8"], ["https://rdap.example-a.net/"]],
	[["9.0.0.0/8"], ["https://rdap.example-b.net"]],
]);

describe("ipv4Cache", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		ipv4Cache.flush();
		vi.mocked(fetchIpv4List).mockResolvedValue(IPV4_LIST);
	});

	test("fetches the list on a cold lookup and strips a trailing slash", async () => {
		await expect(ipv4Cache.get("8.8.8.8")).resolves.toBe(
			"https://rdap.example-a.net",
		);
		expect(fetchIpv4List).toHaveBeenCalledTimes(1);
	});

	test("leaves a server without a trailing slash alone", async () => {
		await expect(ipv4Cache.get("9.9.9.9")).resolves.toBe(
			"https://rdap.example-b.net",
		);
	});

	test("serves a repeat lookup of the same address from cache", async () => {
		await ipv4Cache.get("8.8.8.8");
		await expect(ipv4Cache.get("8.8.8.8")).resolves.toBe(
			"https://rdap.example-a.net",
		);
		expect(fetchIpv4List).toHaveBeenCalledTimes(1);
	});

	test("serves an unseen address in a known mask without refetching", async () => {
		await ipv4Cache.get("8.8.8.8");

		// Different address, same mask. The list was already fetched for the
		// first lookup, so this must be answered from the mask cache.
		await expect(ipv4Cache.get("8.8.4.4")).resolves.toBe(
			"https://rdap.example-a.net",
		);
		expect(fetchIpv4List).toHaveBeenCalledTimes(1);
	});

	test("returns null when no mask matches the address", async () => {
		await expect(ipv4Cache.get("10.0.0.1")).resolves.toBeNull();
	});

	test("returns null when a matching mask has no server recorded", async () => {
		vi.mocked(fetchIpv4List).mockResolvedValue(
			list([[["8.0.0.0/8"], [""]]]),
		);

		// The cold lookup records the empty server, the second finds the mask
		// but nothing usable behind it.
		await ipv4Cache.get("8.8.8.8");
		await expect(ipv4Cache.get("8.8.8.8")).resolves.toBeNull();
	});

	test("reset() refetches the mask list and drops cached addresses", async () => {
		await ipv4Cache.get("8.8.8.8");
		await ipv4Cache.reset();

		// Masks survive the reset, so this resolves without a third fetch.
		await expect(ipv4Cache.get("8.8.8.8")).resolves.toBe(
			"https://rdap.example-a.net",
		);
		expect(fetchIpv4List).toHaveBeenCalledTimes(2);
	});

	test("flush() empties both caches so the next lookup refetches", async () => {
		await ipv4Cache.get("8.8.8.8");
		ipv4Cache.flush();

		await expect(ipv4Cache.get("8.8.8.8")).resolves.toBe(
			"https://rdap.example-a.net",
		);
		expect(fetchIpv4List).toHaveBeenCalledTimes(2);
	});
});
