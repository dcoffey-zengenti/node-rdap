import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { autnumCache, dnsCache, ipv4Cache, ipv6Cache } from "../cache/index.js";
import { autnum, domain, ip } from "../client.js";

vi.mock("../cache/index.js", () => ({
	dnsCache: { get: vi.fn() },
	ipv4Cache: { get: vi.fn() },
	ipv6Cache: { get: vi.fn() },
	autnumCache: { get: vi.fn() },
}));

const fetchMock = vi.fn();

/** A minimal stand-in for the parts of Response the client actually touches. */
const response = (
	body: unknown,
	init: { ok?: boolean; status?: number; statusText?: string } = {},
) => ({
	ok: init.ok ?? true,
	status: init.status ?? 200,
	statusText: init.statusText ?? "OK",
	json: async () => body,
});

const ACCEPT = { headers: { accept: "application/json,application/rdap+json" } };

describe("client", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	describe("domain", () => {
		test("rejects an invalid FQDN without touching the network", async () => {
			await expect(domain("example")).rejects.toThrow(
				"The given domain could not be validated.",
			);
			expect(fetchMock).not.toHaveBeenCalled();
		});

		test("rejects when no RDAP server is known for the tld", async () => {
			vi.mocked(dnsCache.get).mockResolvedValue(null);

			await expect(domain("example.com")).rejects.toThrow(
				"Failed to fetch RDAP domain data: RDAP Server for the given top level domain could not be found.",
			);
		});

		test("rejects when the RDAP server responds with an error status", async () => {
			vi.mocked(dnsCache.get).mockResolvedValue("https://rdap.test");
			fetchMock.mockResolvedValue(
				response({}, { ok: false, status: 404, statusText: "Not Found" }),
			);

			await expect(domain("example.com")).rejects.toThrow(
				"RDAP server responded with status 404: Not Found",
			);
		});

		test("requests the expected url and returns the parsed body", async () => {
			vi.mocked(dnsCache.get).mockResolvedValue("https://rdap.test");
			fetchMock.mockResolvedValue(response({ objectClassName: "domain" }));

			await expect(domain("example.com")).resolves.toEqual({
				objectClassName: "domain",
			});
			expect(fetchMock).toHaveBeenCalledWith(
				"https://rdap.test/domain/example.com",
				ACCEPT,
			);
		});

		test("trims and lowercases the domain before looking it up", async () => {
			vi.mocked(dnsCache.get).mockResolvedValue("https://rdap.test");
			fetchMock.mockResolvedValue(response({}));

			await domain("  ExAmPle.COM  ");

			expect(dnsCache.get).toHaveBeenCalledWith("com");
			expect(fetchMock).toHaveBeenCalledWith(
				"https://rdap.test/domain/example.com",
				ACCEPT,
			);
		});
	});

	describe("ip", () => {
		test("routes an IPv4 address to the IPv4 cache", async () => {
			vi.mocked(ipv4Cache.get).mockResolvedValue("https://rdap.test");
			fetchMock.mockResolvedValue(response({}));

			await ip("8.8.8.8");

			expect(ipv4Cache.get).toHaveBeenCalledWith("8.8.8.8");
			expect(ipv6Cache.get).not.toHaveBeenCalled();
			expect(fetchMock).toHaveBeenCalledWith(
				"https://rdap.test/ip/8.8.8.8",
				ACCEPT,
			);
		});

		test("routes an IPv6 address to the IPv6 cache", async () => {
			vi.mocked(ipv6Cache.get).mockResolvedValue("https://rdap.test");
			fetchMock.mockResolvedValue(response({}));

			await ip("2001:db8::1");

			expect(ipv6Cache.get).toHaveBeenCalledWith("2001:db8::1");
			expect(ipv4Cache.get).not.toHaveBeenCalled();
		});

		test("throws when no RDAP server is known for the address", async () => {
			vi.mocked(ipv4Cache.get).mockResolvedValue(null);

			await expect(ip("8.8.8.8")).rejects.toThrow(
				"RDAP Server for the given IP Address could not be found.",
			);
			expect(fetchMock).not.toHaveBeenCalled();
		});
	});

	describe("autnum", () => {
		test("requests the expected url and returns the parsed body", async () => {
			vi.mocked(autnumCache.get).mockResolvedValue("https://rdap.test");
			fetchMock.mockResolvedValue(response({ objectClassName: "autnum" }));

			await expect(autnum(15169)).resolves.toEqual({
				objectClassName: "autnum",
			});
			expect(fetchMock).toHaveBeenCalledWith(
				"https://rdap.test/autnum/15169",
				ACCEPT,
			);
		});

		test("throws when no RDAP server is known for the number", async () => {
			vi.mocked(autnumCache.get).mockResolvedValue(null);

			await expect(autnum(999999999)).rejects.toThrow(
				"RDAP Server for the given Autonomous System Number could not be found.",
			);
			expect(fetchMock).not.toHaveBeenCalled();
		});
	});
});
