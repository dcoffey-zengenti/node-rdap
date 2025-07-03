import { autnumCache, dnsCache, ipv4Cache, ipv6Cache } from "./cache/index.js";
import type {
	RdapAutnumResponse,
	RdapDomainResponse,
	RdapIpResponse,
} from "./types.js";
import {
	getTopLevelDomain,
	isFullyQualifiedDomainName,
} from "./utils/domain.js";

//Re-exported so they can be imported from the library directly.
export {
	RdapAutnumResponse,
	RdapDomainResponse,
	RdapIpResponse,
} from "./types.js";

export const domain = async (fqdn: string): Promise<RdapDomainResponse> => {
	const normalizedFqdn = fqdn.trim().toLowerCase();
	if (!isFullyQualifiedDomainName(normalizedFqdn)) {
		throw new Error("The given domain could not be validated.");
	}

	try {
		// Since we already did isFullyQualifiedDomainName above, we don't need to check for null here.
		const topLevelDomain = getTopLevelDomain(normalizedFqdn)!;

		const rdapServer = await dnsCache.get(topLevelDomain);
		if (!rdapServer) {
			throw new Error(
				"RDAP Server for the given top level domain could not be found.",
			);
		}
		const requestUrl = `${rdapServer}/domain/${normalizedFqdn}`;
		const response = await fetch(requestUrl, {
			headers: {
				accept: "application/json,application/rdap+json",
			},
		});

		if (!response.ok) {
			throw new Error(
				`RDAP server responded with status ${response.status}: ${response.statusText}`,
			);
		}

		const data = (await response.json()) as RdapDomainResponse;
		return data;
	} catch (error) {
		throw new Error(
			`Failed to fetch RDAP domain data: ${(error as Error).message}`,
		);
	}
};

export const ip = async (ip: string) => {
	//Todo: Validate IP String.

	const isIpv6 = ip.includes(":");
	const cache = isIpv6 ? ipv6Cache : ipv4Cache;

	const rdapServer = await cache.get(ip);
	if (!rdapServer) {
		throw new Error("RDAP Server for the given IP Address could not be found.");
	}

	const requestUrl = `${rdapServer}/ip/${ip}`;
	return (await (
		await fetch(requestUrl, {
			headers: {
				accept: "application/json,application/rdap+json",
			},
		})
	).json()) as RdapIpResponse;
};

export const autnum = async (autnum: number) => {
	const rdapServer = await autnumCache.get(autnum);
	if (!rdapServer) {
		throw new Error(
			"RDAP Server for the given Autonomous System Number could not be found.",
		);
	}

	const requestUrl = `${rdapServer}/autnum/${autnum}`;
	return (await (
		await fetch(requestUrl, {
			headers: {
				accept: "application/json,application/rdap+json",
			},
		})
	).json()) as RdapAutnumResponse;
};
