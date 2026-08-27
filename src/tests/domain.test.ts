import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { dnsCache } from "../cache/index.js";
import { domain } from "../client.js";
import {
	RdapRegistryError,
	RdapServerNotFoundError,
	RdapValidationError,
} from "../errors.js";
import type { RdapDomainResponse } from "../types.js";
import { installNetworkMock } from "./helpers/network.js";

describe("client querying a domain", () => {
	beforeEach(() => {
		installNetworkMock();
		dnsCache.flush();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	test("should return json for valid domain.", async () => {
		let result: RdapDomainResponse | null = null;
		result = await domain("example.com");
		expect(result).not.toBeNull();
		result = await domain("example.co.uk");
		expect(result).not.toBeNull();
		result = await domain("example.net");
		expect(result).not.toBeNull();
	});

	test("should return error for invalid TLD", async () => {
		await expect(domain("example.badger")).rejects.toThrow(
			RdapServerNotFoundError,
		);
		await expect(domain("example.eggs")).rejects.toThrow(
			RdapServerNotFoundError,
		);
		await expect(domain("example.invalid")).rejects.toThrow(
			'No RDAP server is published for the top level domain "invalid".',
		);
	});

	test("should return error for non-existant domain", async () => {
		// The tld resolves, so this reaches the registry and comes back 404.
		await expect(domain("nonexistent-domain.com")).rejects.toThrow(
			RdapRegistryError,
		);
		await expect(domain("nonexistent-domain.co.uk")).rejects.toThrow(
			"RDAP server responded with status 404: Not Found",
		);
	});

	test("should return error for invalid FQDN", async () => {
		await expect(domain("example")).rejects.toThrow(RdapValidationError);
	});
});
