import { autnumCache, dnsCache, ipv4Cache, ipv6Cache } from "./cache/index.js";
import { RdapServerNotFoundError, RdapValidationError } from "./errors.js";
import type {
	RdapAutnumResponse,
	RdapDomainResponse,
	RdapIpResponse,
} from "./types.js";
import {
	getTopLevelDomain,
	isFullyQualifiedDomainName,
} from "./utils/domain.js";
import { getIpVersion } from "./utils/ip.js";
import { requestJson } from "./utils/request.js";

//Re-exported so they can be imported from the library directly.
export type {
	RdapAutnumResponse,
	RdapAutnumSuccessResponse,
	RdapAutonomousSystemNumberObjectClass,
	RdapDomainObjectClass,
	RdapDomainResponse,
	RdapDomainSuccessResponse,
	RdapEntityObjectClass,
	RdapErrorResponse,
	RdapEvent,
	RdapHelpResponse,
	RdapIPNetworkObjectClass,
	RdapIpResponse,
	RdapIpSuccessResponse,
	RdapLink,
	RdapNameserverObjectClass,
	RdapNotice,
	RdapObjectClass,
	RdapPublicID,
	RdapRemark,
	RdapSecureDNS,
	RdapStatus,
} from "./types.js";

export {
	RdapError,
	RdapNetworkError,
	RdapRegistryError,
	RdapServerNotFoundError,
	RdapValidationError,
} from "./errors.js";

/**
 * Looks up a domain over RDAP.
 * @param fqdn - The domain to look up. Trimmed and lowercased before use.
 * @throws {@link RdapValidationError} if the domain is not a valid FQDN
 * @throws {@link RdapServerNotFoundError} if no RDAP server serves the tld
 * @throws {@link RdapRegistryError} if the registry answers with an error
 * @throws {@link RdapNetworkError} if the registry cannot be reached
 */
export const domain = async (fqdn: string): Promise<RdapDomainResponse> => {
	const normalizedFqdn = fqdn.trim().toLowerCase();
	if (!isFullyQualifiedDomainName(normalizedFqdn)) {
		throw new RdapValidationError(
			`"${fqdn}" is not a valid fully qualified domain name.`,
			fqdn,
		);
	}

	// Safe to assert: isFullyQualifiedDomainName has already rejected anything
	// without a usable top level label.
	const topLevelDomain = getTopLevelDomain(normalizedFqdn) as string;

	const rdapServer = await dnsCache.get(topLevelDomain);
	if (!rdapServer) {
		throw new RdapServerNotFoundError(
			`No RDAP server is published for the top level domain "${topLevelDomain}".`,
			topLevelDomain,
		);
	}

	return requestJson<RdapDomainResponse>(
		`${rdapServer}/domain/${normalizedFqdn}`,
	);
};

/**
 * Looks up an IPv4 or IPv6 address over RDAP.
 * @param ip - The address to look up
 * @throws {@link RdapValidationError} if the value is not an IP address
 * @throws {@link RdapServerNotFoundError} if no RDAP server serves the address
 * @throws {@link RdapRegistryError} if the registry answers with an error
 * @throws {@link RdapNetworkError} if the registry cannot be reached
 */
export const ip = async (ip: string): Promise<RdapIpResponse> => {
	const version = getIpVersion(ip);
	if (!version) {
		throw new RdapValidationError(`"${ip}" is not a valid IP address.`, ip);
	}

	const cache = version === 6 ? ipv6Cache : ipv4Cache;

	const rdapServer = await cache.get(ip);
	if (!rdapServer) {
		throw new RdapServerNotFoundError(
			`No RDAP server is published for the IP address "${ip}".`,
			ip,
		);
	}

	return requestJson<RdapIpResponse>(`${rdapServer}/ip/${ip}`);
};

/**
 * Looks up an Autonomous System Number over RDAP.
 * @param autnum - The ASN to look up
 * @throws {@link RdapValidationError} if the value is not a whole number
 * @throws {@link RdapServerNotFoundError} if no RDAP server serves the number
 * @throws {@link RdapRegistryError} if the registry answers with an error
 * @throws {@link RdapNetworkError} if the registry cannot be reached
 */
export const autnum = async (autnum: number): Promise<RdapAutnumResponse> => {
	if (!Number.isInteger(autnum) || autnum < 0) {
		throw new RdapValidationError(
			`"${autnum}" is not a valid Autonomous System Number.`,
			String(autnum),
		);
	}

	const rdapServer = await autnumCache.get(autnum);
	if (!rdapServer) {
		throw new RdapServerNotFoundError(
			`No RDAP server is published for AS${autnum}.`,
			String(autnum),
		);
	}

	return requestJson<RdapAutnumResponse>(`${rdapServer}/autnum/${autnum}`);
};
