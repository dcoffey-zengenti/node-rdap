import { isIP } from "node:net";

export type IpVersion = 4 | 6;

/**
 * The IP version of an address, or null if it is not an IP address at all.
 *
 * Uses Node's own parser rather than guessing from the presence of a colon,
 * so that a malformed address is rejected up front with our own message
 * instead of failing part way through a mask scan with wording borrowed from
 * a dependency.
 * @param address - The address to inspect
 */
export const getIpVersion = (address: string): IpVersion | null => {
	const version = isIP(address);
	return version === 4 || version === 6 ? version : null;
};
