import NodeCache from "node-cache";
import { getConfig } from "../config.js";
import { type DNSList, fetchDNSList } from "../utils/dns.js";

class DNSCache {
	cache: NodeCache;
	constructor() {
		this.cache = new NodeCache({
			useClones: false,
		});
	}

	async get(topLevelDomain: string): Promise<string | null> {
		const { cacheTtlSeconds } = getConfig();
		const registry = this.cache.get<string>(topLevelDomain);
		if (registry) {
			return registry;
		} else {
			let registry: string | null = null;
			const dns = await fetchDNSList();
			for (const service of dns.services) {
				for (const tld of service[0]) {
					const server = service[1][0];
					this.cache.set<string>(
						tld,
						server.endsWith("/") ? server.slice(0, -1) : server,
						cacheTtlSeconds,
					);
					if (tld === topLevelDomain) {
						registry = server.endsWith("/") ? server.slice(0, -1) : server;
					}
				}
			}
			return registry;
		}
	}

	async set(dnsList: DNSList) {
		const { cacheTtlSeconds } = getConfig();
		for (const service of dnsList.services) {
			for (const tld of service[0]) {
				if (!this.cache.has(tld)) {
					const server = service[1][0];
					this.cache.set<string>(
						tld,
						server.endsWith("/") ? server.slice(0, -1) : server,
						cacheTtlSeconds,
					);
				}
			}
		}
	}

	/** Drops everything cached and refetches the list from IANA. */
	async reset() {
		this.flush();
		await this.set(await fetchDNSList());
	}

	flush() {
		this.cache.flushAll();
	}
}

export const dnsCache = new DNSCache();
