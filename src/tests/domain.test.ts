import { domain } from "../client.js";
import type { RdapDomainResponse } from "../types.js";

describe("client querying a domain", () => {
	test("should return json for valid domain.", async () => {
		let result: RdapDomainResponse | null = null;
		result = await domain("insytful.com");
		expect(result).not.toBeNull();
		result = await domain("insytful.co.uk");
		expect(result).not.toBeNull();
		result = await domain("contensis.com");
		expect(result).not.toBeNull();
	});

	test("should return error for invalid TLD", async () => {
		await expect(domain("insytful.badger")).rejects.toThrow(
			"Failed to fetch RDAP domain data",
		);
		await expect(domain("insytful.eggs")).rejects.toThrow(
			"Failed to fetch RDAP domain data",
		);
		await expect(domain("contensis.contensis")).rejects.toThrow(
			"Failed to fetch RDAP domain data",
		);
	});

	test("should return null for non-existant domain", async () => {
		await expect(domain("insytful-contensis-party-time.com")).rejects.toThrow(
			"Failed to fetch RDAP domain data",
		);
		await expect(domain("insytful-contensis-party-time.co.uk")).rejects.toThrow(
			"Failed to fetch RDAP domain data",
		);
	});
});
