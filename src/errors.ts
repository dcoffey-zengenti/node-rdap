import type { RdapErrorResponse } from "./types.js";

/**
 * Base class for every error this library throws.
 *
 * Catch this to handle any RDAP failure, or one of the subclasses below to
 * tell the kinds of failure apart. The underlying failure, where there is one,
 * is always available on `cause` rather than flattened into the message.
 */
export class RdapError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = new.target.name;
	}
}

/** The value given to a lookup was not a well formed domain, IP or ASN. */
export class RdapValidationError extends RdapError {
	/** The value that failed validation. */
	readonly input: string;

	constructor(message: string, input: string, options?: ErrorOptions) {
		super(message, options);
		this.input = input;
	}
}

/**
 * IANA publishes no RDAP server for this name, address or number.
 *
 * This is a normal outcome rather than a fault: plenty of the address space
 * and plenty of top level domains have no RDAP service at all.
 */
export class RdapServerNotFoundError extends RdapError {
	/** The value that could not be routed to a server. */
	readonly query: string;

	constructor(message: string, query: string, options?: ErrorOptions) {
		super(message, options);
		this.query = query;
	}
}

/** The RDAP server was reached but answered with an error status. */
export class RdapRegistryError extends RdapError {
	readonly status: number;
	readonly statusText: string;
	/** The parsed RDAP error body, when the server sent one. */
	readonly body?: RdapErrorResponse;

	constructor(
		message: string,
		status: number,
		statusText: string,
		body?: RdapErrorResponse,
		options?: ErrorOptions,
	) {
		super(message, options);
		this.status = status;
		this.statusText = statusText;
		this.body = body;
	}
}

/**
 * A request could not be completed: the host was unreachable, the connection
 * failed, or the response was not the JSON it claimed to be.
 */
export class RdapNetworkError extends RdapError {
	/** The url that could not be fetched or parsed. */
	readonly url: string;

	constructor(message: string, url: string, options?: ErrorOptions) {
		super(message, options);
		this.url = url;
	}
}
