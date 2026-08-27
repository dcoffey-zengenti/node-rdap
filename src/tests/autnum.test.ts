import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { autnumCache } from "../cache/index.js";
import { autnum } from "../client.js";
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

	test("should throw error for invalid ASN", async () => {
		await expect(autnum(999999999)).rejects.toThrow(
			"RDAP Server for the given Autonomous System Number could not be found.",
		);
		await expect(autnum(-1)).rejects.toThrow(
			"RDAP Server for the given Autonomous System Number could not be found.",
		);
	});
});
