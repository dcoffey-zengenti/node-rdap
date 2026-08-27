import { getConfig } from "../config.js";
import {
	RdapNetworkError,
	RdapRegistryError,
	RdapTimeoutError,
} from "../errors.js";
import type { RdapErrorResponse } from "../types.js";

const ACCEPT = "application/json,application/rdap+json";

/**
 * Fetches and parses a JSON document, turning every failure mode into a typed
 * error with the original failure kept on `cause`.
 *
 * Shared by the IANA bootstrap fetches and the registry lookups so that both
 * hops of a lookup fail the same way.
 * @param url - The url to fetch
 * @throws {@link RdapRegistryError} if the server answers with an error status
 * @throws {@link RdapTimeoutError} if the request exceeds the configured budget
 * @throws {@link RdapNetworkError} if the request fails or the body is not JSON
 */
export const requestJson = async <T>(url: string): Promise<T> => {
	const { timeoutMs } = getConfig();
	let response: Response;

	try {
		response = await fetch(url, {
			headers: { accept: ACCEPT },
			signal: AbortSignal.timeout(timeoutMs),
		});
	} catch (error) {
		// AbortSignal.timeout aborts with a DOMException named TimeoutError,
		// which is worth telling apart from an unreachable host.
		if ((error as Error)?.name === "TimeoutError") {
			throw new RdapTimeoutError(
				`${url} did not respond within ${timeoutMs}ms.`,
				url,
				timeoutMs,
				{ cause: error },
			);
		}
		throw new RdapNetworkError(`Could not reach ${url}.`, url, {
			cause: error,
		});
	}

	if (!response.ok) {
		// Servers are not obliged to send a body with an error, so a missing or
		// unparseable one is not itself a failure worth reporting.
		let body: RdapErrorResponse | undefined;
		try {
			body = (await response.json()) as RdapErrorResponse;
		} catch {
			body = undefined;
		}

		throw new RdapRegistryError(
			`RDAP server responded with status ${response.status}: ${response.statusText}`,
			response.status,
			response.statusText,
			body,
		);
	}

	try {
		return (await response.json()) as T;
	} catch (error) {
		throw new RdapNetworkError(
			`The response from ${url} was not valid JSON.`,
			url,
			{ cause: error },
		);
	}
};
