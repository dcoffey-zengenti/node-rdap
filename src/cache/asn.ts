import NodeCache from "node-cache";
import { inRange } from "../utils/autnum";
import { DNSList, fetchASNList } from "../utils/dns";

export class AutnumCache {
  cache: NodeCache;
  constructor() {
    this.cache = new NodeCache({
      useClones: false,
    });
  }

  async get(autonomousSystemNumber: number): Promise<string | null> {
    const autnumRanges = this.cache.keys();
    const rangeMatch = autnumRanges.find((autnumRange) =>
      inRange(autonomousSystemNumber, autnumRange)
    );
    if (rangeMatch) {
      const registry = this.cache.get<string>(rangeMatch);
      return registry || null;
    } else {
      let registry: string | null = null;
      const asn = await fetchASNList();
      for (const service of asn.services) {
        for (const asnRange of service[0]) {
          const server = service[1][0];
          this.cache.set<string>(
            asnRange,
            server.endsWith("/") ? server.slice(0, -1) : server
          );
          if (inRange(autonomousSystemNumber, asnRange)) {
            registry = server.endsWith("/") ? server.slice(0, -1) : server;
          }
        }
      }
      return registry;
    }
  }

  async set(asnList: DNSList) {
    for (const service of asnList.services) {
      for (const asn of service[0]) {
        if (!this.cache.has(asn)) {
          const server = service[1][0];
          this.cache.set<string>(
            asn,
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
