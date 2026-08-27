import { autnumCache } from "./asn.js";
import { dnsCache } from "./dns.js";
import { entityCache } from "./entity.js";
import { ipv4Cache } from "./ipv4.js";
import { ipv6Cache } from "./ipv6.js";

export { autnumCache } from "./asn.js";
export { dnsCache } from "./dns.js";
export { entityCache, getObjectTag } from "./entity.js";
export { ipv4Cache } from "./ipv4.js";
export { ipv6Cache } from "./ipv6.js";

const caches = [dnsCache, ipv4Cache, ipv6Cache, autnumCache, entityCache];

/**
 * Empties every cache.
 *
 * The next lookup of each kind fetches its bootstrap list from IANA again.
 */
export const flushCaches = (): void => {
	for (const cache of caches) cache.flush();
};

/**
 * Empties every cache and fetches all of the bootstrap lists again.
 *
 * Unlike {@link flushCaches} this leaves the caches warm, at the cost of five
 * requests to IANA.
 */
export const resetCaches = async (): Promise<void> => {
	await Promise.all(caches.map((cache) => cache.reset()));
};
