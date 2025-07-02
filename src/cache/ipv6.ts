import { matches } from "ip-matching";
import NodeCache from "node-cache";
import { fetchIpv6List } from "../utils/dns.js";

class IPV6Cache {
	ipCache: NodeCache;
	maskCache: NodeCache;

	constructor() {
		this.ipCache = new NodeCache({
			stdTTL: 86400,
			checkperiod: 17280,
			useClones: false,
		});
		this.maskCache = new NodeCache({
			useClones: false,
		});
	}

	async get(ipAddress: string): Promise<string | null> {
		const registry = this.ipCache.get<string>(ipAddress);
		if (registry) return registry;
		const masks = this.maskCache.keys();
		const maskMatch = masks.find((mask) => matches(ipAddress, mask));
		if (maskMatch) {
			const registry = this.maskCache.get<string>(maskMatch);
			if (registry) {
				this.ipCache.set<string>(ipAddress, registry);
				return registry;
			}
			return null;
		} else {
			let registry: string | null = null;
			const ipv6 = await fetchIpv6List();
			for (const service of ipv6.services) {
				for (const mask of service[0]) {
					const server = service[1][0];
					this.maskCache.set<string>(
						mask,
						server.endsWith("/") ? server.slice(0, -1) : server,
					);
					if (matches(ipAddress, mask)) {
						registry = server.endsWith("/") ? server.slice(0, -1) : server;
						this.ipCache.set<string>(ipAddress, registry);
					}
				}
			}
			return registry;
		}
	}

	async reset() {
		this.flush();
		const ipv6 = await fetchIpv6List();
		for (const service of ipv6.services) {
			for (const mask of service[0]) {
				const server = service[1][0];
				this.maskCache.set<string>(
					mask,
					server.endsWith("/") ? server.slice(0, -1) : server,
				);
			}
		}
	}

	flush() {
		this.ipCache.flushAll();
		this.maskCache.flushAll();
	}
}

export const ipv6Cache = new IPV6Cache();
