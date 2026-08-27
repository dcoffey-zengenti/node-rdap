#!/usr/bin/env node

import { realpathSync } from "node:fs";
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
	// If the CLI was called with a command, parse it and return. A failed
	// lookup marks the process as failed so scripts can detect it.
	if (argv.length > 2) {
		const program = createProgram();
		program.parse(argv);
		return program;
	}

	// If the CLI was called without commands, open interactive mode. A failed
	// lookup there is reported but does not fail the session.
	const program = createProgram({ setExitCode: false });
	startInteractive(program, input, output);
	return program;
};

/* c8 ignore start -- entry guard, covered by the packed-tarball smoke test (pnpm test:pack) */
/**
 * Whether this module is the process entry point.
 *
 * npm installs a package's bin as a symlink, so `process.argv[1]` is the
 * symlink path while `import.meta.url` is always the resolved real path.
 * Comparing them without resolving first makes a globally installed
 * `node-rdap` exit silently without running anything.
 */
const isEntryPoint = (): boolean => {
	const invokedAs = process.argv[1];
	if (!invokedAs) return false;
	try {
		return import.meta.url === pathToFileURL(realpathSync(invokedAs)).href;
	} catch {
		// realpathSync throws if argv[1] is not a real path (an eval, say).
		return false;
	}
};

if (isEntryPoint()) {
	main();
}
/* c8 ignore stop */
