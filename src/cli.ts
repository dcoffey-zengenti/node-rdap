#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { createProgram, startInteractive } from "./cli/program.js";

/**
 * CLI entry point.
 *
 * Exported so a test can drive it directly, and only invoked below when this
 * module is the process entry - importing it must not run the CLI.
 * @param argv - Full argv, as commander expects it (node, script, ...args)
 * @param input - Stream interactive mode reads commands from
 * @param output - Stream interactive mode writes its prompt to
 */
export const main = (
	argv: string[] = process.argv,
	input: NodeJS.ReadableStream = process.stdin,
	output: NodeJS.WritableStream = process.stdout,
) => {
	const program = createProgram();

	// If the CLI was called with a command, parse it and return.
	if (argv.length > 2) {
		program.parse(argv);
		return program;
	}

	// If the CLI was called without commands, open interactive mode.
	startInteractive(program, input, output);
	return program;
};

/* c8 ignore start -- entry guard, exercised by running the binary not by tests */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	main();
}
/* c8 ignore stop */
