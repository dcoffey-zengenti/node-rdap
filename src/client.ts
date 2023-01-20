import got from "got";
import { AutnumCache } from "./cache/asn";
import { DNSCache } from "./cache/dns";
import { IPV4Cache } from "./cache/ipv4";
import { IPV6Cache } from "./cache/ipv6";
import {
  RdapAutnumResponse,
  RdapDomainResponse,
  RdapIpResponse,
} from "./types";
import { getTopLevelDomain, isFullyQualifiedDomainName } from "./utils/domain";

const dnsCache = new DNSCache();
const ipv4Cache = new IPV4Cache();
const ipv6Cache = new IPV6Cache();
const autnumCache = new AutnumCache();

const resolveRdapServerByDomain = async (domain: string) => {
  const topLevelDomain = getTopLevelDomain(domain);
  if (!topLevelDomain) {
    throw new Error("Could not parse the top level domain.");
  }

  const rdapServer = await dnsCache.get(topLevelDomain);
  if (!rdapServer) {
    throw new Error(
      "RDAP Server for the given top level domain could not be found."
    );
  }

  return rdapServer;
};

export const domain = async (fqdn: string) => {
  if (!isFullyQualifiedDomainName(fqdn)) {
    throw new Error("The given domain could not be validated.");
  }
  const rdapServer = await resolveRdapServerByDomain(fqdn);

  if (rdapServer) {
    const requestUrl = `${rdapServer}/domain/${fqdn}`;
    try {
      return await got(requestUrl, {
        headers: {
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        },
      }).json<RdapDomainResponse>();
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const ip = async (ip: string) => {
  //Todo: Validate IP String.

  const isIpv6 = ip.includes(":");
  const cache = isIpv6 ? ipv6Cache : ipv4Cache;

  const rdapServer = await cache.get(ip);
  if (!rdapServer) {
    throw new Error("RDAP Server for the given IP Address could not be found.");
  }

  if (rdapServer) {
    const requestUrl = `${rdapServer}/ip/${ip}`;
    return await got(requestUrl).json<RdapIpResponse>();
  }
  return null;
};

export const autnum = async (autnum: number) => {
  const rdapServer = await autnumCache.get(autnum);
  if (!rdapServer) {
    throw new Error(
      "RDAP Server for the given Autonomous System Number could not be found."
    );
  }

  if (rdapServer) {
    const requestUrl = `${rdapServer}/autnum/${autnum}`;
    return await got(requestUrl).json<RdapAutnumResponse>();
  }
  return null;
};
