export interface DNSList {
  description: string;
  publication: string;
  services: [string[], string[]];
  version: string;
}

const fetchList = async (url: string): Promise<DNSList> => {
  const response = await fetch(url, {
    headers: {
      accept: "application/json,application/rdap+json",
    },
  });
  return response.json();
};

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
