import { createServer, type Server } from "node:http";
import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import { configure, getConfig, resetConfig } from "../config.js";
import { RdapTimeoutError, RdapValidationError } from "../errors.js";
import { requestJson } from "../utils/request.js";

describe("configure", () => {
	afterEach(() => {
		resetConfig();
	});

	test("has sensible defaults", () => {
		expect(getConfig()).toEqual({ timeoutMs: 10_000, cacheTtlSeconds: 86_400 });
	});

	test("changes only the keys it is given", () => {
		configure({ timeoutMs: 500 });

		expect(getConfig().timeoutMs).toBe(500);
		expect(getConfig().cacheTtlSeconds).toBe(86_400);
	});

	test("returns the settings now in force", () => {
		expect(configure({ cacheTtlSeconds: 60 })).toEqual({
			timeoutMs: 10_000,
			cacheTtlSeconds: 60,
		});
	});

	test("rejects values that are not positive numbers", () => {
		for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
			expect(() => configure({ timeoutMs: bad })).toThrow(RdapValidationError);
			expect(() => configure({ cacheTtlSeconds: bad })).toThrow(
				RdapValidationError,
			);
		}
	});

	test("leaves the previous settings alone when a value is rejected", () => {
		configure({ timeoutMs: 1_234 });
		expect(() => configure({ timeoutMs: -1 })).toThrow();

		expect(getConfig().timeoutMs).toBe(1_234);
	});

	test("resetConfig restores the defaults", () => {
		configure({ timeoutMs: 1, cacheTtlSeconds: 1 });

		expect(resetConfig()).toEqual({ timeoutMs: 10_000, cacheTtlSeconds: 86_400 });
	});
});

describe("request timeouts", () => {
	// A real server that accepts the connection and then never answers. A mock
	// cannot prove the timeout actually fires against a live socket.
	let server: Server;
	let url: string;

	beforeAll(async () => {
		server = createServer(() => {
			/* deliberately never responds */
		});
		await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
		const address = server.address();
		const port = typeof address === "object" && address ? address.port : 0;
		url = `http://127.0.0.1:${port}/rdap.json`;
	});

	afterAll(() => {
		server.close();
	});

	afterEach(() => {
		resetConfig();
	});

	test("gives up on a server that never responds", async () => {
		configure({ timeoutMs: 150 });

		await expect(requestJson(url)).rejects.toThrow(RdapTimeoutError);
	});

	test("reports the url and the budget that was exceeded", async () => {
		configure({ timeoutMs: 150 });

		await expect(requestJson(url)).rejects.toMatchObject({
			url,
			timeoutMs: 150,
		});
	});

	test("honours a timeout changed after the module was loaded", async () => {
		configure({ timeoutMs: 100 });
		const startedAt = performance.now();

		await expect(requestJson(url)).rejects.toThrow(RdapTimeoutError);

		// Comfortably under the 10s default, so the new setting was really used.
		expect(performance.now() - startedAt).toBeLessThan(2_000);
	});
});
