import {
	autnumCache,
	dnsCache,
	entityCache,
	ipv4Cache,
	ipv6Cache,
} from "./cache/index.js";
import { RdapServerNotFoundError, RdapValidationError } from "./errors.js";
import type {
	RdapAutnumResponse,
	RdapDomainResponse,
	RdapEntityResponse,
	RdapIpResponse,
	RdapNameserverResponse,
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
	RdapEntityResponse,
	RdapEntitySuccessResponse,
	RdapErrorResponse,
	RdapEvent,
	RdapHelpResponse,
	RdapIPNetworkObjectClass,
	RdapIpResponse,
	RdapIpSuccessResponse,
	RdapLink,
	RdapNameserverObjectClass,
	RdapNameserverResponse,
	RdapNameserverSuccessResponse,
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
	RdapTimeoutError,
	RdapValidationError,
} from "./errors.js";

export { flushCaches, resetCaches } from "./cache/index.js";
export { configure, getConfig, type RdapConfig } from "./config.js";

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

/**
 * Looks up a nameserver over RDAP.
 *
 * Nameservers are served by the registry for their own top level domain, so
 * this routes through the same bootstrap list as {@link domain}.
 * @param nameserver - The nameserver host name to look up
 * @throws {@link RdapValidationError} if the name is not a valid host name
 * @throws {@link RdapServerNotFoundError} if no RDAP server serves the tld
 * @throws {@link RdapRegistryError} if the registry answers with an error
 * @throws {@link RdapTimeoutError} if the request exceeds the configured budget
 * @throws {@link RdapNetworkError} if the registry cannot be reached
 */
export const nameserver = async (
	nameserver: string,
): Promise<RdapNameserverResponse> => {
	const normalized = nameserver.trim().toLowerCase();
	if (!isFullyQualifiedDomainName(normalized)) {
		throw new RdapValidationError(
			`"${nameserver}" is not a valid nameserver name.`,
			nameserver,
		);
	}

	const topLevelDomain = getTopLevelDomain(normalized) as string;

	const rdapServer = await dnsCache.get(topLevelDomain);
	if (!rdapServer) {
		throw new RdapServerNotFoundError(
			`No RDAP server is published for the top level domain "${topLevelDomain}".`,
			topLevelDomain,
		);
	}

	return requestJson<RdapNameserverResponse>(
		`${rdapServer}/nameserver/${normalized}`,
	);
};

/**
 * Looks up an entity over RDAP.
 *
 * Entities are routed by the provider tag on the end of the handle, from the
 * RFC 8521 object tags registry — a different bootstrap list to the other
 * lookups. Only a handful of providers register a tag, so a handle without one
 * cannot be resolved at all.
 * @param handle - The entity handle to look up, such as "ABC123-ARIN"
 * @throws {@link RdapValidationError} if the handle is empty
 * @throws {@link RdapServerNotFoundError} if the handle carries no known tag
 * @throws {@link RdapRegistryError} if the registry answers with an error
 * @throws {@link RdapTimeoutError} if the request exceeds the configured budget
 * @throws {@link RdapNetworkError} if the registry cannot be reached
 */
export const entity = async (handle: string): Promise<RdapEntityResponse> => {
	const normalized = handle.trim();
	if (!normalized) {
		throw new RdapValidationError(
			"An entity handle is required.",
			handle,
		);
	}

	const rdapServer = await entityCache.get(normalized);
	if (!rdapServer) {
		throw new RdapServerNotFoundError(
			`No RDAP service provider is registered for the handle "${normalized}". ` +
				"Entity lookups only work for handles ending in a registered provider tag, such as \"ABC123-ARIN\".",
			normalized,
		);
	}

	return requestJson<RdapEntityResponse>(
		`${rdapServer}/entity/${normalized}`,
	);
};
