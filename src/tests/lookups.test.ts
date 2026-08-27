import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { dnsCache, entityCache } from "../cache/index.js";
import { entity, nameserver } from "../client.js";
import { RdapServerNotFoundError, RdapValidationError } from "../errors.js";
import { installNetworkMock } from "./helpers/network.js";

describe("client querying a nameserver", () => {
	beforeEach(() => {
		installNetworkMock();
		dnsCache.flush();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	test("should return json for a valid nameserver", async () => {
		await expect(nameserver("ns1.example.com")).resolves.toMatchObject({
			objectClassName: "nameserver",
		});
	});

	test("should route through the registry for its own tld", async () => {
		const fetchMock = installNetworkMock();

		await nameserver("ns1.example.co.uk");

		expect(fetchMock).toHaveBeenCalledWith(
			"https://rdap.nominet.uk/uk/nameserver/ns1.example.co.uk",
			expect.anything(),
		);
	});

	test("should trim and lowercase the name", async () => {
		const fetchMock = installNetworkMock();

		await nameserver("  NS1.Example.COM  ");

		expect(fetchMock).toHaveBeenCalledWith(
			"https://rdap.verisign.com/com/v1/nameserver/ns1.example.com",
			expect.anything(),
		);
	});

	test("should throw a validation error for a name that is not a host name", async () => {
		await expect(nameserver("ns1")).rejects.toThrow(RdapValidationError);
	});

	test("should throw when no RDAP server serves the tld", async () => {
		await expect(nameserver("ns1.example.badger")).rejects.toThrow(
			RdapServerNotFoundError,
		);
	});
});

describe("client querying an entity", () => {
	beforeEach(() => {
		installNetworkMock();
		entityCache.flush();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	test("should return json for a handle with a registered tag", async () => {
		await expect(entity("ABC123-EXAMPLE")).resolves.toMatchObject({
			objectClassName: "entity",
		});
	});

	test("should query the provider named by the tag", async () => {
		const fetchMock = installNetworkMock();

		await entity("ABC123-EXAMPLE");

		expect(fetchMock).toHaveBeenCalledWith(
			"https://rdap.arin.net/registry/entity/ABC123-EXAMPLE",
			expect.anything(),
		);
	});

	test("should fetch a self link url directly", async () => {
		const fetchMock = installNetworkMock();

		// The usual case: entities are found inside another response, which
		// carries a self link to them. Their handles are mostly not routable.
		await expect(
			entity("https://rdap.nominet.uk/uk/entity/BBC"),
		).resolves.toMatchObject({ objectClassName: "entity" });

		expect(fetchMock).toHaveBeenCalledWith(
			"https://rdap.nominet.uk/uk/entity/BBC",
			expect.anything(),
		);
	});

	test("should not consult the tag registry when given a url", async () => {
		const fetchMock = installNetworkMock();

		await entity("https://rdap.nominet.uk/uk/entity/TUCOWS-CA");

		// One request: straight to the url. No bootstrap lookup at all, even
		// though the handle ends in something that looks like a tag.
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock).not.toHaveBeenCalledWith(
			"https://data.iana.org/rdap/object-tags.json",
			expect.anything(),
		);
	});

	test("should accept an http url as well as https", async () => {
		await expect(
			entity("http://rdap.nominet.uk/uk/entity/BBC"),
		).resolves.toMatchObject({ objectClassName: "entity" });
	});

	test("should refuse a url that is not http or https", async () => {
		const fetchMock = installNetworkMock();

		// A self link comes from a remote response, so its scheme is not
		// necessarily one the caller chose.
		for (const url of ["file:///etc/passwd", "ftp://example.net/x"]) {
			await expect(entity(url)).rejects.toThrow(RdapValidationError);
			await expect(entity(url)).rejects.toThrow(
				"is not an http or https url",
			);
		}
		expect(fetchMock).not.toHaveBeenCalled();
	});

	test("should refuse a malformed url", async () => {
		await expect(entity("https://")).rejects.toThrow(RdapValidationError);
	});

	test("should throw a validation error for an empty handle", async () => {
		await expect(entity("   ")).rejects.toThrow(RdapValidationError);
		await expect(entity("")).rejects.toThrow(
			"An entity handle or url is required.",
		);
	});

	test("should explain itself when the handle carries no provider tag", async () => {
		// This is the documented limit of entity lookups rather than a fault:
		// only handles ending in a registered tag can be routed at all.
		const error = await entity("ABC123").catch((e) => e);

		expect(error).toBeInstanceOf(RdapServerNotFoundError);
		expect(error.message).toContain("No RDAP service provider is registered");
		expect(error.message).toContain("ABC123-ARIN");
		// The message has to point at the way that does work.
		expect(error.message).toContain("self link");
	});

	test("should throw when the tag is not a registered provider", async () => {
		await expect(entity("ABC123-BADGER")).rejects.toThrow(
			RdapServerNotFoundError,
		);
	});
});
