import NodeCache from "node-cache";
import { getConfig } from "../config.js";
import { fetchObjectTagList } from "../utils/dns.js";

/**
 * The provider tag on an entity handle, or null if it carries none.
 *
 * RFC 8521 handles end in a hyphen and the issuing provider's tag, as in
 * "ABC123-ARIN". Tags are compared case insensitively.
 * @param handle - The entity handle to read
 */
export const getObjectTag = (handle: string): string | null => {
	const separator = handle.lastIndexOf("-");
	if (separator < 1) return null;

	const tag = handle.slice(separator + 1).trim();
	return tag ? tag.toUpperCase() : null;
};

class EntityCache {
	handleCache: NodeCache;
	tagCache: NodeCache;

	constructor() {
		this.handleCache = new NodeCache({ useClones: false });
		this.tagCache = new NodeCache({ useClones: false });
	}

	async get(handle: string): Promise<string | null> {
		const registry = this.handleCache.get<string>(handle);
		if (registry) return registry;

		const tag = getObjectTag(handle);
		if (!tag) return null;

		const { cacheTtlSeconds } = getConfig();

		const known = this.tagCache.get<string>(tag);
		if (known) {
			this.handleCache.set<string>(handle, known, cacheTtlSeconds);
			return known;
		}

		let server: string | null = null;
		const tags = await fetchObjectTagList();
		for (const service of tags.services) {
			// [contact addresses, tags, urls] — the tags are the second list.
			const url = service[2][0];
			if (!url) continue;
			const normalized = url.endsWith("/") ? url.slice(0, -1) : url;

			for (const serviceTag of service[1]) {
				this.tagCache.set<string>(
					serviceTag.toUpperCase(),
					normalized,
					cacheTtlSeconds,
				);
				if (serviceTag.toUpperCase() === tag) {
					server = normalized;
					this.handleCache.set<string>(handle, normalized, cacheTtlSeconds);
				}
			}
		}

		return server;
	}

	async reset() {
		this.flush();
		const { cacheTtlSeconds } = getConfig();
		const tags = await fetchObjectTagList();
		for (const service of tags.services) {
			const url = service[2][0];
			if (!url) continue;
			const normalized = url.endsWith("/") ? url.slice(0, -1) : url;
			for (const serviceTag of service[1]) {
				this.tagCache.set<string>(
					serviceTag.toUpperCase(),
					normalized,
					cacheTtlSeconds,
				);
			}
		}
	}

	flush() {
		this.handleCache.flushAll();
		this.tagCache.flushAll();
	}
}

export const entityCache = new EntityCache();
