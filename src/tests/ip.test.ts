import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ipv4Cache, ipv6Cache } from "../cache/index.js";
import { ip } from "../client.js";
import {
	RdapServerNotFoundError,
	RdapValidationError,
} from "../errors.js";
import { installNetworkMock } from "./helpers/network.js";

describe("client querying an IP address", () => {
	beforeEach(() => {
		installNetworkMock();
		ipv4Cache.flush();
		ipv6Cache.flush();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	test("should return json for valid IPv4 address", async () => {
		await expect(ip("8.8.8.8")).resolves.toBeDefined();
	});

	test("should return json for valid IPv6 address", async () => {
		await expect(ip("2001:4860:4860::8888")).resolves.toBeDefined();
	});

	test("should throw error for invalid IP address", async () => {
		// Rejected up front by our own validation, rather than part way through
		// a mask scan with wording borrowed from ip-matching.
		await expect(ip("999.999.999.999")).rejects.toThrow(RdapValidationError);
		await expect(ip("999.999.999.999")).rejects.toThrow(
			'"999.999.999.999" is not a valid IP address.',
		);
		await expect(ip("not.an.ip")).rejects.toThrow(RdapValidationError);
		await expect(ip("not.an.ip")).rejects.toThrow(
			'"not.an.ip" is not a valid IP address.',
		);
	});

	test("should not reach the network for an invalid address", async () => {
		const fetchMock = installNetworkMock();
		await expect(ip("not.an.ip")).rejects.toThrow(RdapValidationError);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	test("should throw error if an RDAP server cannot be found for an IP Address", async () => {
		await expect(ip("127.0.0.1")).rejects.toThrow(RdapServerNotFoundError);
		await expect(ip("127.0.0.1")).rejects.toThrow(
			'No RDAP server is published for the IP address "127.0.0.1".',
		);
	});
});
