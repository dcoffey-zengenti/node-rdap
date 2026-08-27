import { readFileSync } from "node:fs";
import { InvalidArgumentError } from "commander";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { autnum, domain, ip } from "../../client.js";
import {
	createProgram,
	doCommand,
	parseArgInt,
	VERSION,
} from "../program.js";

vi.mock("../../client.js", () => ({
	domain: vi.fn(),
	ip: vi.fn(),
	autnum: vi.fn(),
}));

describe("parseArgInt", () => {
	test("parses a plain integer", () => {
		expect(parseArgInt("42")).toBe(42);
		expect(parseArgInt("15169")).toBe(15169);
	});

	test("throws InvalidArgumentError for something that isn't a number", () => {
		expect(() => parseArgInt("badger")).toThrow(InvalidArgumentError);
		expect(() => parseArgInt("badger")).toThrow("Not a number.");
	});
});

describe("doCommand", () => {
	let log: ReturnType<typeof vi.spyOn>;
	let error: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		log = vi.spyOn(console, "log").mockImplementation(() => {});
		error = vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("logs whatever the function resolves with", async () => {
		await doCommand(async () => ({ objectClassName: "domain" }), "example.com");

		expect(log).toHaveBeenCalledWith({ objectClassName: "domain" });
		expect(error).not.toHaveBeenCalled();
	});

	test("logs the error instead of throwing when the function rejects", async () => {
		await expect(
			doCommand(async () => {
				throw new Error("RDAP Server could not be found.");
			}, "example.com"),
		).resolves.toBeUndefined();

		expect(error).toHaveBeenCalledWith("Error: RDAP Server could not be found.");
		expect(log).not.toHaveBeenCalled();
	});
});

describe("createProgram", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("reports a version matching package.json", () => {
		const pkg = JSON.parse(
			readFileSync(new URL("../../../package.json", import.meta.url), "utf8"),
		);

		// Guards against the CLI drifting out of step with the released version,
		// which is exactly what happened between 0.3.0 and 0.5.0.
		expect(VERSION).toBe(pkg.version);
		expect(createProgram().version()).toBe(pkg.version);
	});

	test("registers the domain, ip and autnum commands", () => {
		const names = createProgram()
			.commands.map((command) => command.name())
			.sort();

		expect(names).toEqual(["autnum", "domain", "ip"]);
	});

	test("returns an independent program each call", () => {
		expect(createProgram()).not.toBe(createProgram());
	});

	test("passes the domain argument through to the client", async () => {
		await createProgram().parseAsync(["domain", "example.com"], {
			from: "user",
		});

		expect(domain).toHaveBeenCalledWith("example.com");
	});

	test("passes the ip argument through to the client", async () => {
		await createProgram().parseAsync(["ip", "8.8.8.8"], { from: "user" });

		expect(ip).toHaveBeenCalledWith("8.8.8.8");
	});

	test("converts the autnum argument to a number before calling the client", async () => {
		await createProgram().parseAsync(["autnum", "15169"], { from: "user" });

		expect(autnum).toHaveBeenCalledWith(15169);
	});

	test("rejects a non-numeric autnum argument", async () => {
		const program = createProgram();
		// The argument is validated by the subcommand, so that is where the exit
		// has to be overridden.
		const command = program.commands.find((c) => c.name() === "autnum");
		command?.exitOverride().configureOutput({ writeErr: () => {} });

		await expect(
			program.parseAsync(["autnum", "badger"], { from: "user" }),
		).rejects.toThrow("Not a number.");
		expect(autnum).not.toHaveBeenCalled();
	});
});
