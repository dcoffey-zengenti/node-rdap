import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { autnumCache } from "../cache/index.js";
import { autnum } from "../client.js";
import {
	RdapServerNotFoundError,
	RdapValidationError,
} from "../errors.js";
import { installNetworkMock } from "./helpers/network.js";

describe("client querying an Autonomous System Number (ASN)", () => {
	beforeEach(() => {
		installNetworkMock();
		autnumCache.flush();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	test("should return json for valid ASN", async () => {
		await expect(autnum(15169)).resolves.toBeDefined();
	});

	test("should throw error for an ASN with no registry", async () => {
		await expect(autnum(999999999)).rejects.toThrow(RdapServerNotFoundError);
		await expect(autnum(999999999)).rejects.toThrow(
			"No RDAP server is published for AS999999999.",
		);
	});

	test("should throw a validation error for an impossible ASN", async () => {
		// A negative or fractional number is not an ASN at all, so it is
		// rejected before any lookup rather than reported as "no server".
		await expect(autnum(-1)).rejects.toThrow(RdapValidationError);
		await expect(autnum(1.5)).rejects.toThrow(RdapValidationError);
	});
});
