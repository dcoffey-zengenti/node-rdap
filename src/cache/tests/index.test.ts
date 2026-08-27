import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { installNetworkMock } from "../../tests/helpers/network.js";
import {
	autnumCache,
	dnsCache,
	entityCache,
	flushCaches,
	ipv4Cache,
	ipv6Cache,
	resetCaches,
} from "../index.js";

describe("public cache api", () => {
	beforeEach(() => {
		installNetworkMock();
		flushCaches();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	test("flushCaches empties every cache", async () => {
		const fetchMock = installNetworkMock();
		await dnsCache.get("com");
		await ipv4Cache.get("8.8.8.8");
		await autnumCache.get(15169);
		await entityCache.get("ABC123-EXAMPLE");
		const before = fetchMock.mock.calls.length;

		flushCaches();

		// Everything must be refetched, so each cache really was emptied.
		await dnsCache.get("com");
		await ipv4Cache.get("8.8.8.8");
		await autnumCache.get(15169);
		await entityCache.get("ABC123-EXAMPLE");

		expect(fetchMock.mock.calls.length).toBe(before * 2);
	});

	test("resetCaches leaves the caches warm", async () => {
		const fetchMock = installNetworkMock();

		await resetCaches();
		const afterReset = fetchMock.mock.calls.length;

		// One bootstrap request per cache, and lookups now need no more.
		expect(afterReset).toBe(5);

		await dnsCache.get("com");
		await ipv4Cache.get("8.8.8.8");
		await ipv6Cache.get("2001:4860:4860::8888");
		await autnumCache.get(15169);
		await entityCache.get("ABC123-EXAMPLE");

		expect(fetchMock.mock.calls.length).toBe(afterReset);
	});

	test("resetCaches drops previously cached entries", async () => {
		await dnsCache.get("com");
		const fetchMock = installNetworkMock();

		await resetCaches();

		// The tld list was refetched rather than served from the old cache.
		expect(fetchMock).toHaveBeenCalledWith(
			"https://data.iana.org/rdap/dns.json",
			expect.anything(),
		);
	});
});
