import NodeCache from "node-cache";
import { inRange } from "../utils/autnum";
import { fetchASNList } from "../utils/dns";

export class AutnumCache {
  autnumCache: NodeCache;
  rangeCache: NodeCache;
  constructor() {
    this.autnumCache = new NodeCache({
      stdTTL: 86400,
      checkperiod: 17280,
      useClones: false,
    });
    this.rangeCache = new NodeCache({
      useClones: false,
    });
  }

  async get(autonomousSystemNumber: number): Promise<string | null> {
    const registry = this.autnumCache.get<string>(autonomousSystemNumber);
    if (registry) return registry;
    const autnumRanges = this.rangeCache.keys();
    const rangeMatch = autnumRanges.find((autnumRange) =>
      inRange(autonomousSystemNumber, autnumRange)
    );
    if (rangeMatch) {
      const registry = this.rangeCache.get<string>(rangeMatch);
      return registry || null;
    } else {
      let registry: string | null = null;
      const asn = await fetchASNList();
      for (const service of asn.services) {
        for (const asnRange of service[0]) {
          const server = service[1][0];
          this.rangeCache.set<string>(
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

  async reset() {
    this.flush();
    const asn = await fetchASNList();
    for (const service of asn.services) {
      for (const asnRange of service[0]) {
        const server = service[1][0];
        this.rangeCache.set<string>(
          asnRange,
          server.endsWith("/") ? server.slice(0, -1) : server
        );
      }
    }
  }

  flush() {
    this.autnumCache.flushAll();
    this.rangeCache.flushAll();
  }
}
