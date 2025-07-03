#!/usr/bin/env node

import * as readline from "node:readline";
import { InvalidArgumentError, program } from "commander";
import { autnum, domain, ip } from "./client.js";

/**
 * This is a helper to write the output or error of a function to the console
 * @param fn - The function to try to run
 * @param arg - Argument to pass to the function
 */
const doCommand = async <T, R>(fn: (arg: T) => Promise<R>, arg: T) => {
	try {
		console.log(await fn(arg));
	} catch (e) {
		console.error((e as Error).toString());
	}
};

/**
 * This is a helper to convert a string to an integer
 * @param value - The string to conver to integer
 * @returns The value as an integer
 * @throws {@link InvalidArgumentError} if value is NaN
 */
const parseArgInt = (value: string): number => {
	// We're using parseInt rather than "1*x", for readability
	const parsedValue = parseInt(value, 10);
	if (Number.isNaN(parsedValue)) {
		throw new InvalidArgumentError("Not a number.");
	}
	return parsedValue;
};

// Setup commander
program
	.name("node-rdap")
	.description("CLI for querying rdap via nodejs")
	.version("0.3.0");

// Register domain command with commander
program
	.command("domain")
	.description("Lookup a domains whois info via RDAP")
	.argument("<domain>", "The domain to lookup")
  .usage('mydomain.com')
	.action(async (arg: string) => doCommand(domain, arg));

// Register ip command with commander
program
	.command("ip")
	.description("Lookup a domains whois info via RDAP")
	.argument("<ip>", "The IP Address to lookup")
  .usage('1.1.1.1')
	.action(async (arg: string) => doCommand(ip, arg));

// Register autnum command with commander
program
	.command("autnum")
	.description("Lookup a domains whois info via RDAP")
	.argument("<autnum>", "The Autonomous System Number to lookup", parseArgInt)
  .usage('1')
	.action(async (arg: number) => doCommand(autnum, arg));

// If the CLI was called with a command, parse it and return.
if (process.argv.length > 2) {
	program.parse();
} else {
  // If the CLI was called without commands, open interactive mode.
	program.exitOverride();
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		terminal: true,
	});

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
}
