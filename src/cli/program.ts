import * as readline from "node:readline";
import { Command, InvalidArgumentError } from "commander";
import { autnum, domain, ip } from "../client.js";

/**
 * The version reported by `node-rdap --version`.
 *
 * Kept in step with package.json by a test rather than read at runtime: the
 * compiled entry point lives at dist/tsc/cli.js, so a relative import of
 * package.json would need a different path in source than in build output.
 */
export const VERSION = "1.0.0-rc.1";

/**
 * This is a helper to write the output or error of a function to the console
 * @param fn - The function to try to run
 * @param arg - Argument to pass to the function
 * @param setExitCode - Whether a failure should mark the process as failed.
 * False in interactive mode, where one bad command should not condemn the
 * whole session.
 */
export const doCommand = async <T, R>(
	fn: (arg: T) => Promise<R>,
	arg: T,
	setExitCode = true,
) => {
	try {
		console.log(await fn(arg));
	} catch (e) {
		console.error((e as Error).message);
		// process.exitCode rather than process.exit, so buffered stdout still
		// flushes before the process ends.
		if (setExitCode) process.exitCode = 1;
	}
};

/**
 * This is a helper to convert a string to an integer
 * @param value - The string to conver to integer
 * @returns The value as an integer
 * @throws {@link InvalidArgumentError} if value is NaN
 */
export const parseArgInt = (value: string): number => {
	// We're using parseInt rather than "1*x", for readability
	const parsedValue = Number.parseInt(value, 10);
	if (Number.isNaN(parsedValue)) {
		throw new InvalidArgumentError("Not a number.");
	}
	return parsedValue;
};

/**
 * Builds a fully configured commander program.
 *
 * A new instance is returned each call rather than commander's shared `program`
 * singleton, so that parsing in one test cannot leak into the next.
 */
export const createProgram = ({ setExitCode = true } = {}): Command => {
	const program = new Command();

	program
		.name("node-rdap")
		.description("CLI for querying rdap via nodejs")
		.version(VERSION);

	// Register domain command with commander
	program
		.command("domain")
		.description("Lookup a domains whois info via RDAP")
		.argument("<domain>", "The domain to lookup")
		.usage("mydomain.com")
		.action(async (arg: string) => doCommand(domain, arg, setExitCode));

	// Register ip command with commander
	program
		.command("ip")
		.description("Lookup a domains whois info via RDAP")
		.argument("<ip>", "The IP Address to lookup")
		.usage("1.1.1.1")
		.action(async (arg: string) => doCommand(ip, arg, setExitCode));

	// Register autnum command with commander
	program
		.command("autnum")
		.description("Lookup a domains whois info via RDAP")
		.argument("<autnum>", "The Autonomous System Number to lookup", parseArgInt)
		.usage("1")
		.action(async (arg: number) => doCommand(autnum, arg, setExitCode));

	return program;
};

/**
 * Opens interactive mode, treating each line of input as a command.
 *
 * The streams are parameters so a test can drive this without touching the real
 * stdin/stdout.
 */
export const startInteractive = (
	program: Command,
	input: NodeJS.ReadableStream = process.stdin,
	output: NodeJS.WritableStream = process.stdout,
): readline.Interface => {
	// Stop commander calling process.exit() out from under the repl. Subcommands
	// need this set on them individually — they inherit settings when they are
	// created, so overriding the parent afterwards does not reach them, and a bad
	// argument like `autnum badger` would take the whole session down with it.
	program.exitOverride();
	for (const command of program.commands) {
		command.exitOverride();
	}

	const rl = readline.createInterface({ input, output, terminal: true });

	// Treat each line as a command
	rl.on("line", (line) => {
		const commands = line.split(" ");
		try {
			// Run the command
			program.parse(commands, { from: "user" });
		} catch {
			// Show the help info if command doesn't exist
			console.log(program.helpInformation());
		}
	});

	return rl;
};
