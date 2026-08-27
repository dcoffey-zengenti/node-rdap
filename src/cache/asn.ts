import NodeCache from "node-cache";
import { getConfig } from "../config.js";
import { inRange } from "../utils/autnum.js";
import { fetchASNList } from "../utils/dns.js";

class AutnumCache {
  autnumCache: NodeCache;
  rangeCache: NodeCache;
  constructor() {
    this.autnumCache = new NodeCache({
      checkperiod: 17280,
      useClones: false,
    });
    this.rangeCache = new NodeCache({
      useClones: false,
    });
  }

  async get(autonomousSystemNumber: number): Promise<string | null> {
    const { cacheTtlSeconds } = getConfig();
    const registry = this.autnumCache.get<string>(autonomousSystemNumber);
    if (registry) return registry;
    const autnumRanges = this.rangeCache.keys();
    const rangeMatch = autnumRanges.find((autnumRange) =>
      inRange(autonomousSystemNumber, autnumRange)
    );
    if (rangeMatch) {
      const registry = this.rangeCache.get<string>(rangeMatch);
      if (registry) {
        this.autnumCache.set<string>(
          autonomousSystemNumber,
          registry,
          cacheTtlSeconds,
        );
        return registry;
      }
      return null;
    } else {
      let registry: string | null = null;
      const asn = await fetchASNList();
      for (const service of asn.services) {
        for (const asnRange of service[0]) {
          const server = service[1][0];
          this.rangeCache.set<string>(
            asnRange,
            server.endsWith("/") ? server.slice(0, -1) : server,
            cacheTtlSeconds
          );
          if (inRange(autonomousSystemNumber, asnRange)) {
            registry = server.endsWith("/") ? server.slice(0, -1) : server;
            this.autnumCache.set<string>(
          autonomousSystemNumber,
          registry,
          cacheTtlSeconds,
        );
          }
        }
      }
      return registry;
    }
  }

  async reset() {
    this.flush();
    const { cacheTtlSeconds } = getConfig();
    const asn = await fetchASNList();
    for (const service of asn.services) {
      for (const asnRange of service[0]) {
        const server = service[1][0];
        this.rangeCache.set<string>(
          asnRange,
          server.endsWith("/") ? server.slice(0, -1) : server,
          cacheTtlSeconds
        );
      }
    }
  }

  flush() {
    this.autnumCache.flushAll();
    this.rangeCache.flushAll();
  }
}

export const autnumCache = new AutnumCache();