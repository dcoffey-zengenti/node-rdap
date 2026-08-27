import { PassThrough } from "node:stream";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { main } from "../cli.js";
import { domain } from "../client.js";

vi.mock("../client.js", () => ({
	domain: vi.fn(),
	ip: vi.fn(),
	autnum: vi.fn(),
}));

const settle = () => new Promise((resolve) => setImmediate(resolve));

describe("main", () => {
	let input: PassThrough;
	let output: PassThrough;

	beforeEach(() => {
		vi.clearAllMocks();
		input = new PassThrough();
		output = new PassThrough();
		output.resume();
	});

	afterEach(() => {
		input.end();
		vi.restoreAllMocks();
	});

	test("does not run the CLI merely by being imported", () => {
		// main() is only invoked when cli.js is the process entry point, so
		// importing this module must not have parsed vitest's own argv.
		expect(domain).not.toHaveBeenCalled();
	});

	test("parses a command given on the command line", async () => {
		main(["node", "cli.js", "domain", "example.com"], input, output);
		await settle();

		expect(domain).toHaveBeenCalledWith("example.com");
	});

	test("drops into interactive mode when given no command", async () => {
		main(["node", "cli.js"], input, output);

		input.write("domain example.com\n");
		await settle();

		expect(domain).toHaveBeenCalledWith("example.com");
	});
});
