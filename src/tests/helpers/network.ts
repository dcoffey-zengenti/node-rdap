import { vi } from "vitest";
import type { DNSList } from "../../utils/dns.js";

/**
 * Fake network for the RDAP lookups.
 *
 * These stand in for the two hops a lookup makes: the IANA bootstrap list that
 * says which registry serves a name, and the registry itself. Faking at the
 * `fetch` boundary rather than mocking the dns utils keeps the real cache and
 * client code in the test — only the wire is fake.
 */

const IANA = "https://data.iana.org/rdap";
const ARIN = "https://rdap.arin.net/registry";

const list = (services: [string[], string[]][]): DNSList => ({
	description: "test fixture",
	publication: "2026-01-01T00:00:00Z",
	version: "1.0",
	services,
});

/** Deliberately omits "badger"/"eggs" so an unknown tld resolves to nothing. */
export const DNS_LIST = list([
	[
		["com", "net"],
		["https://rdap.verisign.com/com/v1/"],
	],
	[["uk"], ["https://rdap.nominet.uk/uk/"]],
]);

/** Deliberately omits 127.0.0.0/8 so loopback has no registry. */
export const IPV4_LIST = list([[["8.0.0.0/8"], [`${ARIN}/`]]]);

export const IPV6_LIST = list([[["2001:4860::/32"], [`${ARIN}/`]]]);

/** Deliberately narrow so an out-of-range number has no registry. */
export const ASN_LIST = list([[["15169-15169"], [`${ARIN}/`]]]);

/** The RFC 8521 object tags registry, which uses three lists per entry. */
export const OBJECT_TAG_LIST = {
	description: "test fixture",
	publication: "2026-01-01T00:00:00Z",
	version: "1.0",
	services: [
		[["info@example.net"], ["EXAMPLE"], [`${ARIN}/`]],
	] as [string[], string[], string[]][],
};

/** Domains the fake registry will admit to knowing about. */
export const KNOWN_DOMAINS = new Set([
	"example.com",
	"example.co.uk",
	"example.net",
]);

const ok = (body: unknown) => ({
	ok: true,
	status: 200,
	statusText: "OK",
	json: async () => body,
});

const notFound = () => ({
	ok: false,
	status: 404,
	statusText: "Not Found",
	json: async () => ({ errorCode: 404, title: "Not Found" }),
});

const route = (url: string) => {
	if (url === `${IANA}/dns.json`) return ok(DNS_LIST);
	if (url === `${IANA}/ipv4.json`) return ok(IPV4_LIST);
	if (url === `${IANA}/ipv6.json`) return ok(IPV6_LIST);
	if (url === `${IANA}/asn.json`) return ok(ASN_LIST);
	if (url === `${IANA}/object-tags.json`) return ok(OBJECT_TAG_LIST);

	const domainMatch = url.match(/\/domain\/(.+)$/);
	if (domainMatch) {
		const fqdn = domainMatch[1];
		return KNOWN_DOMAINS.has(fqdn)
			? ok({
					objectClassName: "domain",
					ldhName: fqdn.toUpperCase(),
					rdapConformance: ["rdap_level_0"],
				})
			: notFound();
	}

	const ipMatch = url.match(/\/ip\/(.+)$/);
	if (ipMatch) {
		return ok({
			objectClassName: "ip network",
			handle: ipMatch[1],
			rdapConformance: ["rdap_level_0"],
		});
	}

	const nameserverMatch = url.match(/\/nameserver\/(.+)$/);
	if (nameserverMatch) {
		return ok({
			objectClassName: "nameserver",
			ldhName: nameserverMatch[1].toUpperCase(),
			rdapConformance: ["rdap_level_0"],
		});
	}

	const entityMatch = url.match(/\/entity\/(.+)$/);
	if (entityMatch) {
		return ok({
			objectClassName: "entity",
			handle: entityMatch[1],
			rdapConformance: ["rdap_level_0"],
		});
	}

	const autnumMatch = url.match(/\/autnum\/(.+)$/);
	if (autnumMatch) {
		return ok({
			objectClassName: "autnum",
			handle: `AS${autnumMatch[1]}`,
			rdapConformance: ["rdap_level_0"],
		});
	}

	throw new Error(`Unexpected request in test: ${url}`);
};

/**
 * Replaces global fetch with the fake network for the current test file.
 * @returns The mock, so a test can assert on what was requested.
 */
export const installNetworkMock = () => {
	const fetchMock = vi.fn(async (url: string | URL) => route(String(url)));
	vi.stubGlobal("fetch", fetchMock);
	return fetchMock;
};
