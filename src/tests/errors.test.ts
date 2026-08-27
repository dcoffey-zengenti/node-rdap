import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { dnsCache } from "../cache/index.js";
import { domain } from "../client.js";
import {
	RdapError,
	RdapNetworkError,
	RdapRegistryError,
	RdapServerNotFoundError,
	RdapValidationError,
} from "../errors.js";
import { requestJson } from "../utils/request.js";

describe("error hierarchy", () => {
	test("every error is an RdapError and an Error", () => {
		const errors = [
			new RdapValidationError("bad", "input"),
			new RdapServerNotFoundError("none", "com"),
			new RdapRegistryError("boom", 500, "Server Error"),
			new RdapNetworkError("unreachable", "https://rdap.test"),
		];

		for (const error of errors) {
			expect(error).toBeInstanceOf(RdapError);
			expect(error).toBeInstanceOf(Error);
		}
	});

	test("each subclass is distinguishable from the others", () => {
		expect(new RdapValidationError("bad", "x")).not.toBeInstanceOf(
			RdapRegistryError,
		);
		expect(new RdapRegistryError("boom", 500, "Server Error")).not.toBeInstanceOf(
			RdapValidationError,
		);
	});

	test("reports its own class as the name", () => {
		expect(new RdapValidationError("bad", "x").name).toBe("RdapValidationError");
		expect(new RdapNetworkError("no", "url").name).toBe("RdapNetworkError");
	});

	test("carries the detail a caller needs to act on", () => {
		expect(new RdapValidationError("bad", "not.an.ip").input).toBe("not.an.ip");
		expect(new RdapServerNotFoundError("none", "badger").query).toBe("badger");

		const registry = new RdapRegistryError("boom", 404, "Not Found", {
			errorCode: 404,
			title: "Not Found",
		});
		expect(registry.status).toBe(404);
		expect(registry.statusText).toBe("Not Found");
		expect(registry.body?.errorCode).toBe(404);
	});
});

describe("requestJson", () => {
	const fetchMock = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	test("preserves the underlying failure on cause", async () => {
		const underlying = new TypeError("fetch failed");
		fetchMock.mockRejectedValue(underlying);

		// The point of the hierarchy: the original failure is still reachable
		// rather than flattened into a string.
		await expect(requestJson("https://rdap.test/x")).rejects.toThrow(
			RdapNetworkError,
		);
		await expect(requestJson("https://rdap.test/x")).rejects.toMatchObject({
			cause: underlying,
			url: "https://rdap.test/x",
		});
	});

	test("throws a registry error carrying the parsed error body", async () => {
		fetchMock.mockResolvedValue({
			ok: false,
			status: 404,
			statusText: "Not Found",
			json: async () => ({ errorCode: 404, title: "Not Found" }),
		});

		await expect(requestJson("https://rdap.test/x")).rejects.toMatchObject({
			status: 404,
			statusText: "Not Found",
			body: { errorCode: 404, title: "Not Found" },
		});
	});

	test("still throws a registry error when the server sends no body", async () => {
		fetchMock.mockResolvedValue({
			ok: false,
			status: 503,
			statusText: "Service Unavailable",
			json: async () => {
				throw new SyntaxError("Unexpected end of JSON input");
			},
		});

		const error = (await requestJson("https://rdap.test/x").catch(
			(e) => e,
		)) as RdapRegistryError;
		expect(error).toBeInstanceOf(RdapRegistryError);
		expect(error.status).toBe(503);
		expect(error.body).toBeUndefined();
	});

	test("treats a malformed success body as a network error", async () => {
		const underlying = new SyntaxError("Unexpected token <");
		fetchMock.mockResolvedValue({
			ok: true,
			status: 200,
			statusText: "OK",
			json: async () => {
				throw underlying;
			},
		});

		await expect(requestJson("https://rdap.test/x")).rejects.toThrow(
			RdapNetworkError,
		);
		await expect(requestJson("https://rdap.test/x")).rejects.toMatchObject({
			cause: underlying,
		});
	});
});

describe("client error propagation", () => {
	const fetchMock = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal("fetch", fetchMock);
		dnsCache.flush();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	test("does not re-wrap an error it raised itself", async () => {
		// domain() used to catch its own thrown error and wrap it again, which
		// produced doubled messages like "Failed to fetch ...: Failed to ...".
		fetchMock.mockResolvedValue({
			ok: true,
			status: 200,
			statusText: "OK",
			json: async () => ({
				description: "test",
				publication: "2026-01-01T00:00:00Z",
				version: "1.0",
				services: [],
			}),
		});

		const error = (await domain("example.com").catch(
			(e) => e,
		)) as RdapServerNotFoundError;

		expect(error).toBeInstanceOf(RdapServerNotFoundError);
		expect(error.message).toBe(
			'No RDAP server is published for the top level domain "com".',
		);
		expect(error.message).not.toContain("Failed to fetch");
	});
});
