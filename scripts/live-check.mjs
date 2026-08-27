#!/usr/bin/env node
/**
 * Runs every lookup against the real IANA bootstrap files and the real
 * registries.
 *
 * The test suite is entirely mocked, which is what makes it fast and
 * deterministic — but it means nothing notices if IANA changes the shape of a
 * bootstrap file, or a registry changes what it returns. This does.
 *
 * Not part of `pnpm test`. Run it with `pnpm test:live`, or let the scheduled
 * workflow run it.
 */

import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const dist = new URL("../dist/tsc/client.js", import.meta.url);
if (!existsSync(fileURLToPath(dist))) {
	console.error("dist/ is missing — run `pnpm build` first.");
	process.exit(1);
}

const { autnum, domain, entity, ip, nameserver, configure } = await import(
	dist.href
);

// Registries can be slow; a scheduled job can afford to wait.
configure({ timeoutMs: 30_000 });

const checks = [
	["domain", () => domain("google.com"), "domain"],
	["domain (ccTLD)", () => domain("bbc.co.uk"), "domain"],
	["ipv4", () => ip("8.8.8.8"), "ip network"],
	["ipv6", () => ip("2001:4860:4860::8888"), "ip network"],
	["autnum", () => autnum(15169), "autnum"],
	["nameserver", () => nameserver("ns1.google.com"), "nameserver"],
	["entity", () => entity("ZG39-ARIN"), "entity"],
];

let failed = 0;

for (const [name, run, expectedClass] of checks) {
	try {
		const result = await run();
		const actual = result?.objectClassName;
		if (actual !== expectedClass) {
			throw new Error(
				`expected objectClassName "${expectedClass}", got "${actual}"`,
			);
		}
		console.log(`  ✓ ${name}`);
	} catch (error) {
		failed++;
		console.log(`  ✗ ${name}\n      ${error.name}: ${error.message}`);
	}
}

console.log(`\n${checks.length - failed}/${checks.length} live lookups passed`);
process.exit(failed ? 1 : 0);
