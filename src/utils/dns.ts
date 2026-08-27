import { requestJson } from "./request.js";

export interface DNSList {
  description: string;
  publication: string;
  services: [string[], string[]][];
  version: string;
}

/**
 * The RFC 8521 object tags registry, which routes entity handles to the
 * provider that issued them.
 *
 * Its entries carry three lists rather than the two every other bootstrap file
 * uses: the provider's contact addresses, its tags, and its RDAP urls.
 */
export interface ObjectTagList {
  description: string;
  publication: string;
  services: [string[], string[], string[]][];
  version: string;
}

const fetchList = async (url: string): Promise<DNSList> =>
  requestJson<DNSList>(url);

export const fetchDNSList = async () => {
  return fetchList("https://data.iana.org/rdap/dns.json");
};

export const fetchIpv4List = async () => {
  return fetchList("https://data.iana.org/rdap/ipv4.json");
};

export const fetchIpv6List = async () => {
  return fetchList("https://data.iana.org/rdap/ipv6.json");
};

export const fetchASNList = async () => {
  return fetchList("https://data.iana.org/rdap/asn.json");
};

export const fetchObjectTagList = async () => {
  return requestJson<ObjectTagList>(
    "https://data.iana.org/rdap/object-tags.json",
  );
};
