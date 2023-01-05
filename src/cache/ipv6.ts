import NodeCache from "node-cache";
import { DNSList, fetchIpv6List } from "../utils/dns";
import { matches } from "ip-matching";

export class IPV6Cache {
  cache: NodeCache;
  constructor() {
    this.cache = new NodeCache({
      useClones: false,
    });
  }

  async get(ipAddress: string): Promise<string | null> {
    const masks = this.cache.keys();
    const maskMatch = masks.find((mask) => matches(ipAddress, mask));
    if (maskMatch) {
      const registry = this.cache.get<string>(maskMatch);
      return registry || null;
    } else {
      let registry: string | null = null;
      const ipv6 = await fetchIpv6List();
      for (const service of ipv6.services) {
        for (const mask of service[0]) {
          const server = service[1][0];
          this.cache.set<string>(
            mask,
            server.endsWith("/") ? server.slice(0, -1) : server
          );
          if (matches(ipAddress, mask)) {
            registry = server.endsWith("/") ? server.slice(0, -1) : server;
          }
        }
      }
      return registry;
    }
  }

  async set(ipv6List: DNSList) {
    for (const service of ipv6List.services) {
      for (const mask of service[0]) {
        if (!this.cache.has(mask)) {
          const server = service[1][0];
          this.cache.set<string>(
            mask,
            server.endsWith("/") ? server.slice(0, -1) : server
          );
        }
      }
    }
  }

  flush() {
    this.cache.flushAll();
  }
}
