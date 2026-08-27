import { PassThrough } from "node:stream";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { autnum, domain } from "../../client.js";
import { createProgram, startInteractive } from "../program.js";

vi.mock("../../client.js", () => ({
	domain: vi.fn(),
	ip: vi.fn(),
	autnum: vi.fn(),
}));

/** Lets the readline "line" handler and any action it kicks off settle. */
const settle = () => new Promise((resolve) => setImmediate(resolve));

describe("startInteractive", () => {
	let log: ReturnType<typeof vi.spyOn>;
	let input: PassThrough;
	let output: PassThrough;

	beforeEach(() => {
		vi.clearAllMocks();
		log = vi.spyOn(console, "log").mockImplementation(() => {});
		input = new PassThrough();
		output = new PassThrough();
		// Nothing reads the echoed prompt, so drain it to keep the stream flowing.
		output.resume();
	});

	afterEach(() => {
		input.end();
		vi.restoreAllMocks();
	});

	test("runs a command typed on a line", async () => {
		const rl = startInteractive(createProgram(), input, output);

		input.write("domain example.com\n");
		await settle();

		expect(domain).toHaveBeenCalledWith("example.com");
		rl.close();
	});

	test("prints help for an unknown command instead of exiting", async () => {
		const program = createProgram();
		program.configureOutput({ writeErr: () => {} });
		const rl = startInteractive(program, input, output);

		input.write("badger\n");
		await settle();

		expect(log).toHaveBeenCalledWith(
			expect.stringContaining("Usage: node-rdap"),
		);
		rl.close();
	});

	test("survives a bad subcommand argument and keeps accepting commands", async () => {
		const program = createProgram();
		program.configureOutput({ writeErr: () => {} });
		for (const command of program.commands) {
			command.configureOutput({ writeErr: () => {} });
		}
		const rl = startInteractive(program, input, output);

		// Regression: commander's exitOverride is inherited at creation time, so
		// this used to call process.exit and take the whole session with it.
		input.write("autnum badger\n");
		await settle();
		expect(autnum).not.toHaveBeenCalled();

		input.write("domain example.com\n");
		await settle();
		expect(domain).toHaveBeenCalledWith("example.com");

		rl.close();
	});
});
