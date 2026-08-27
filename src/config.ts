import { RdapValidationError } from "./errors.js";

export interface RdapConfig {
	/** How long any single request may take, in milliseconds. */
	timeoutMs: number;
	/** How long a cached lookup stays valid, in seconds. */
	cacheTtlSeconds: number;
}

const DEFAULTS: Readonly<RdapConfig> = {
	// Registries are not always quick, so this is deliberately generous.
	timeoutMs: 10_000,
	cacheTtlSeconds: 86_400,
};

let current: RdapConfig = { ...DEFAULTS };

const assertPositive = (value: number, name: string) => {
	if (!Number.isFinite(value) || value <= 0) {
		throw new RdapValidationError(
			`${name} must be a positive number, got ${value}.`,
			String(value),
		);
	}
};

/**
 * Changes how lookups behave, for every caller in the process.
 *
 * Only the keys given are changed. Settings apply to requests made after the
 * call; a cached entry keeps the lifetime it was stored with.
 * @param options - The settings to change
 * @returns The settings now in force
 * @throws {@link RdapValidationError} if a value is not a positive number
 */
export const configure = (options: Partial<RdapConfig>): Readonly<RdapConfig> => {
	if (options.timeoutMs !== undefined) {
		assertPositive(options.timeoutMs, "timeoutMs");
	}
	if (options.cacheTtlSeconds !== undefined) {
		assertPositive(options.cacheTtlSeconds, "cacheTtlSeconds");
	}

	current = { ...current, ...options };
	return { ...current };
};

/** The settings currently in force. */
export const getConfig = (): Readonly<RdapConfig> => ({ ...current });

/** Restores the defaults. */
export const resetConfig = (): Readonly<RdapConfig> => {
	current = { ...DEFAULTS };
	return { ...current };
};
