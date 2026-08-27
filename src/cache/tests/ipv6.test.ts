import { beforeEach, describe, expect, test, vi } from "vitest";

import { type DNSList, fetchIpv6List } from "../../utils/dns.js";
import { ipv6Cache } from "../ipv6.js";

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

const IPV6_LIST = list([
	[["2001:4860::/32"], ["https://rdap.example-a.net/"]],
	[["2606:4700::/32"], ["https://rdap.example-b.net"]],
]);

describe("ipv6Cache", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		ipv6Cache.flush();
		vi.mocked(fetchIpv6List).mockResolvedValue(IPV6_LIST);
	});

	test("fetches the list on a cold lookup and strips a trailing slash", async () => {
		await expect(ipv6Cache.get("2001:4860:4860::8888")).resolves.toBe(
			"https://rdap.example-a.net",
		);
		expect(fetchIpv6List).toHaveBeenCalledTimes(1);
	});

	test("leaves a server without a trailing slash alone", async () => {
		await expect(ipv6Cache.get("2606:4700:4700::1111")).resolves.toBe(
			"https://rdap.example-b.net",
		);
	});

	test("serves a repeat lookup of the same address from cache", async () => {
		await ipv6Cache.get("2001:4860:4860::8888");
		await expect(ipv6Cache.get("2001:4860:4860::8888")).resolves.toBe(
			"https://rdap.example-a.net",
		);
		expect(fetchIpv6List).toHaveBeenCalledTimes(1);
	});

	test("serves an unseen address in a known mask without refetching", async () => {
		await ipv6Cache.get("2001:4860:4860::8888");

		await expect(ipv6Cache.get("2001:4860:4860::8844")).resolves.toBe(
			"https://rdap.example-a.net",
		);
		expect(fetchIpv6List).toHaveBeenCalledTimes(1);
	});

	test("returns null when no mask matches the address", async () => {
		await expect(ipv6Cache.get("2400:cb00::1")).resolves.toBeNull();
	});

	test("returns null when a matching mask has no server recorded", async () => {
		vi.mocked(fetchIpv6List).mockResolvedValue(
			list([[["2001:4860::/32"], [""]]]),
		);

		await ipv6Cache.get("2001:4860:4860::8888");
		await expect(ipv6Cache.get("2001:4860:4860::8888")).resolves.toBeNull();
	});

	test("reset() refetches the mask list and drops cached addresses", async () => {
		await ipv6Cache.get("2001:4860:4860::8888");
		await ipv6Cache.reset();

		await expect(ipv6Cache.get("2001:4860:4860::8888")).resolves.toBe(
			"https://rdap.example-a.net",
		);
		expect(fetchIpv6List).toHaveBeenCalledTimes(2);
	});

	test("flush() empties both caches so the next lookup refetches", async () => {
		await ipv6Cache.get("2001:4860:4860::8888");
		ipv6Cache.flush();

		await expect(ipv6Cache.get("2001:4860:4860::8888")).resolves.toBe(
			"https://rdap.example-a.net",
		);
		expect(fetchIpv6List).toHaveBeenCalledTimes(2);
	});
});
