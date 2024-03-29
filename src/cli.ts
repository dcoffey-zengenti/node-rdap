#!/usr/bin/env node

import { autnum, domain, ip } from "./client.js";
import { program, InvalidArgumentError } from "commander";
import * as readline from "readline";

const doCommand = async <T>(fn: (arg: T) => Promise<any>, arg: T) => {
  try {
    console.log(await fn(arg));
  } catch (e) {
    console.error((e as Error).toString());
  }
};

const parseArgInt = (value) => {
  // parseInt takes a string and a radix
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new InvalidArgumentError("Not a number.");
  }
  return parsedValue;
};

program
  .name("node-rdap")
  .description("CLI for querying rdap via nodejs")
  .version("0.3.0");

program
  .command("domain")
  .description("Lookup a domains whois info via RDAP")
  .argument("<domain>", "The domain to lookup")
  .action(async (arg: string) => doCommand(domain, arg));

program
  .command("ip")
  .description("Lookup a domains whois info via RDAP")
  .argument("<ip>", "The IP Address to lookup")
  .action(async (arg: string) => doCommand(ip, arg));

program
  .command("autnum")
  .description("Lookup a domains whois info via RDAP")
  .argument("<autnum>", "The Autonomous System Number to lookup", parseArgInt)
  .action(async (arg: number) => doCommand(autnum, arg));

if (process.argv.length > 2) {
  program.parse();
} else {
  program.exitOverride();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  rl.on("line", (line) => {
    const commands = line.split(" ");
    try {
      program.parse(commands, { from: "user" });
    } catch (e) {
      // Show the help info if command doesn't exist.
      console.log(program.helpInformation());
    }
  });
}
