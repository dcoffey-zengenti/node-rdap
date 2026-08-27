import { beforeEach, describe, expect, test, vi } from "vitest";
import type { ObjectTagList } from "../../utils/dns.js";
import { fetchObjectTagList } from "../../utils/dns.js";
import { entityCache, getObjectTag } from "../entity.js";

vi.mock("../../utils/dns.js", () => ({
	fetchDNSList: vi.fn(),
	fetchIpv4List: vi.fn(),
	fetchIpv6List: vi.fn(),
	fetchASNList: vi.fn(),
	fetchObjectTagList: vi.fn(),
}));

const list = (services: [string[], string[], string[]][]): ObjectTagList => ({
	description: "test fixture",
	publication: "2026-01-01T00:00:00Z",
	version: "1.0",
	services,
});

// Note the three lists: contact addresses, tags, urls. Every other bootstrap
// file uses two.
const TAG_LIST = list([
	[["info@arin.net"], ["ARIN"], ["https://rdap.arin.net/registry/"]],
	[["info@apnic.net"], ["AP"], ["https://rdap.apnic.net"]],
]);

describe("getObjectTag", () => {
	test("reads the tag after the final hyphen", () => {
		expect(getObjectTag("ABC123-ARIN")).toBe("ARIN");
		expect(getObjectTag("SOME-LONG-HANDLE-AP")).toBe("AP");
	});

	test("uppercases the tag so comparison is case insensitive", () => {
		expect(getObjectTag("abc123-arin")).toBe("ARIN");
	});

	test("returns null when the handle carries no tag", () => {
		expect(getObjectTag("ABC123")).toBeNull();
		expect(getObjectTag("")).toBeNull();
		expect(getObjectTag("ABC123-")).toBeNull();
		// A leading hyphen is not a tag separator, there is no handle before it.
		expect(getObjectTag("-ARIN")).toBeNull();
	});
});

describe("entityCache", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		entityCache.flush();
		vi.mocked(fetchObjectTagList).mockResolvedValue(TAG_LIST);
	});

	test("fetches the tag list on a cold lookup and strips a trailing slash", async () => {
		await expect(entityCache.get("ABC123-ARIN")).resolves.toBe(
			"https://rdap.arin.net/registry",
		);
		expect(fetchObjectTagList).toHaveBeenCalledTimes(1);
	});

	test("leaves a url without a trailing slash alone", async () => {
		await expect(entityCache.get("ABC123-AP")).resolves.toBe(
			"https://rdap.apnic.net",
		);
	});

	test("matches the tag case insensitively", async () => {
		await expect(entityCache.get("abc123-arin")).resolves.toBe(
			"https://rdap.arin.net/registry",
		);
	});

	test("serves a repeat lookup of the same handle from cache", async () => {
		await entityCache.get("ABC123-ARIN");
		await expect(entityCache.get("ABC123-ARIN")).resolves.toBe(
			"https://rdap.arin.net/registry",
		);
		expect(fetchObjectTagList).toHaveBeenCalledTimes(1);
	});

	test("serves an unseen handle with a known tag without refetching", async () => {
		await entityCache.get("ABC123-ARIN");

		await expect(entityCache.get("XYZ789-ARIN")).resolves.toBe(
			"https://rdap.arin.net/registry",
		);
		expect(fetchObjectTagList).toHaveBeenCalledTimes(1);
	});

	test("returns null for a handle with no tag, without fetching", async () => {
		await expect(entityCache.get("ABC123")).resolves.toBeNull();
		expect(fetchObjectTagList).not.toHaveBeenCalled();
	});

	test("returns null when the tag is not a registered provider", async () => {
		await expect(entityCache.get("ABC123-BADGER")).resolves.toBeNull();
	});

	test("skips a service entry that lists no url", async () => {
		vi.mocked(fetchObjectTagList).mockResolvedValue(
			list([[["info@example.net"], ["NOURL"], []]]),
		);

		await expect(entityCache.get("ABC123-NOURL")).resolves.toBeNull();
	});

	test("reset() refetches the tag list and drops cached handles", async () => {
		await entityCache.get("ABC123-ARIN");
		await entityCache.reset();

		// Tags survive the reset, so this resolves without a third fetch.
		await expect(entityCache.get("ABC123-ARIN")).resolves.toBe(
			"https://rdap.arin.net/registry",
		);
		expect(fetchObjectTagList).toHaveBeenCalledTimes(2);
	});

	test("reset() skips a service entry that lists no url", async () => {
		vi.mocked(fetchObjectTagList).mockResolvedValue(
			list([[["info@example.net"], ["NOURL"], []]]),
		);

		await entityCache.reset();

		await expect(entityCache.get("ABC123-NOURL")).resolves.toBeNull();
	});

	test("flush() empties both caches so the next lookup refetches", async () => {
		await entityCache.get("ABC123-ARIN");
		entityCache.flush();

		await expect(entityCache.get("ABC123-ARIN")).resolves.toBe(
			"https://rdap.arin.net/registry",
		);
		expect(fetchObjectTagList).toHaveBeenCalledTimes(2);
	});
});
