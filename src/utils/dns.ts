import got from "got";

export interface DNSList {
  description: string;
  publication: string;
  services: [string[], string[]];
  version: string;
}

export const fetchDNSList = async () => {
  return await got("https://data.iana.org/rdap/dns.json").json<DNSList>();
};

export const fetchIpv4List = async () => {
  return await got("https://data.iana.org/rdap/ipv4.json").json<DNSList>();
};

export const fetchIpv6List = async () => {
  return await got("https://data.iana.org/rdap/ipv6.json").json<DNSList>();
};

export const fetchASNList = async () => {
  return await got("https://data.iana.org/rdap/asn.json").json<DNSList>();
};
