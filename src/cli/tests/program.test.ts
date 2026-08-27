import { readFileSync } from "node:fs";
import { InvalidArgumentError } from "commander";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { autnum, domain, entity, ip, nameserver } from "../../client.js";
import { getConfig, resetConfig } from "../../config.js";
import {
	createProgram,
	doCommand,
	parseArgInt,
	parsePositiveInt,
	VERSION,
} from "../program.js";

vi.mock("../../client.js", () => ({
	domain: vi.fn(),
	ip: vi.fn(),
	autnum: vi.fn(),
	nameserver: vi.fn(),
	entity: vi.fn(),
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
	let originalExitCode: typeof process.exitCode;

	const reject = async () => {
		throw new Error("No RDAP server is published for AS1.");
	};

	beforeEach(() => {
		log = vi.spyOn(console, "log").mockImplementation(() => {});
		error = vi.spyOn(console, "error").mockImplementation(() => {});
		// doCommand marks the process as failed, which would otherwise leak out
		// of the test run and fail vitest itself.
		originalExitCode = process.exitCode;
	});

	afterEach(() => {
		process.exitCode = originalExitCode;
		vi.restoreAllMocks();
	});

	test("logs whatever the function resolves with", async () => {
		await doCommand(async () => ({ objectClassName: "domain" }), "example.com");

		expect(log).toHaveBeenCalledWith({ objectClassName: "domain" });
		expect(error).not.toHaveBeenCalled();
	});

	test("logs the error instead of throwing when the function rejects", async () => {
		await expect(doCommand(reject, "example.com")).resolves.toBeUndefined();

		expect(error).toHaveBeenCalledWith("No RDAP server is published for AS1.");
		expect(log).not.toHaveBeenCalled();
	});

	test("marks the process as failed when the function rejects", async () => {
		await doCommand(reject, "example.com");

		expect(process.exitCode).toBe(1);
	});

	test("leaves the exit code alone on success", async () => {
		process.exitCode = 0;
		await doCommand(async () => ({}), "example.com");

		expect(process.exitCode).toBe(0);
	});

	test("does not fail the process when setExitCode is false", async () => {
		process.exitCode = 0;
		await doCommand(reject, "example.com", false);

		expect(error).toHaveBeenCalled();
		expect(process.exitCode).toBe(0);
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

	test("registers every lookup command", () => {
		const names = createProgram()
			.commands.map((command) => command.name())
			.sort();

		expect(names).toEqual(["autnum", "domain", "entity", "ip", "nameserver"]);
	});

	test("passes the nameserver argument through to the client", async () => {
		await createProgram().parseAsync(["nameserver", "ns1.example.com"], {
			from: "user",
		});

		expect(nameserver).toHaveBeenCalledWith("ns1.example.com");
	});

	test("passes the entity argument through to the client", async () => {
		await createProgram().parseAsync(["entity", "ABC123-ARIN"], {
			from: "user",
		});

		expect(entity).toHaveBeenCalledWith("ABC123-ARIN");
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

describe("parsePositiveInt", () => {
	test("parses a positive integer", () => {
		expect(parsePositiveInt("5000")).toBe(5000);
	});

	test("rejects zero and negatives", () => {
		expect(() => parsePositiveInt("0")).toThrow(InvalidArgumentError);
		expect(() => parsePositiveInt("-1")).toThrow("Must be greater than zero.");
	});

	test("rejects something that is not a number", () => {
		expect(() => parsePositiveInt("badger")).toThrow("Not a number.");
	});
});

describe("--timeout", () => {
	afterEach(() => {
		resetConfig();
	});

	test("applies the timeout before the lookup runs", async () => {
		await createProgram().parseAsync(
			["--timeout", "250", "domain", "example.com"],
			{ from: "user" },
		);

		expect(getConfig().timeoutMs).toBe(250);
		expect(domain).toHaveBeenCalledWith("example.com");
	});

	test("leaves the configured timeout alone when not given", async () => {
		await createProgram().parseAsync(["domain", "example.com"], {
			from: "user",
		});

		expect(getConfig().timeoutMs).toBe(10_000);
	});
});
