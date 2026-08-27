#!/usr/bin/env node
/**
 * Packs the package, installs the tarball into a scratch project, and checks it
 * from a consumer's point of view.
 *
 * This is deliberately NOT part of `pnpm test`: it installs from the registry,
 * so it needs a network, while the unit suite is fully offline. Run it with
 * `pnpm test:pack`.
 *
 * It covers the things that only break once packed and installed:
 *   1. the `bin` runs through the symlink npm creates for it
 *   2. the package resolves by its bare specifier via `exports`
 *   3. internals are NOT reachable by a deep import
 *   4. the licence ships in the tarball
 */

import { execFileSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));

const run = (cmd, args, opts = {}) =>
	execFileSync(cmd, args, { encoding: "utf8", stdio: "pipe", ...opts });

const results = [];
const check = (name, fn) => {
	try {
		fn();
		results.push({ name, ok: true });
		console.log(`  ✓ ${name}`);
	} catch (error) {
		results.push({ name, ok: false, error });
		console.log(`  ✗ ${name}\n      ${error.message.split("\n")[0]}`);
	}
};

if (!existsSync(join(repoRoot, "dist", "tsc", "cli.js"))) {
	console.error("dist/ is missing — run `pnpm build` first.");
	process.exit(1);
}

const scratch = mkdtempSync(join(tmpdir(), "node-rdap-smoke-"));
let failed = false;

try {
	console.log(`Packing ${pkg.name}@${pkg.version}...`);
	run("pnpm", ["pack", "--pack-destination", scratch], { cwd: repoRoot });
	const tarball = join(scratch, `${pkg.name}-${pkg.version}.tgz`);

	check("tarball contains LICENSE", () => {
		const listing = run("tar", ["-tzf", tarball]);
		if (!listing.includes("package/LICENSE")) {
			throw new Error("LICENSE is not in the tarball");
		}
	});

	check("tarball contains no test files", () => {
		const listing = run("tar", ["-tzf", tarball]);
		const tests = listing.split("\n").filter((f) => /test|__mocks__/i.test(f));
		if (tests.length) {
			throw new Error(`tarball contains test files: ${tests.join(", ")}`);
		}
	});

	const consumer = join(scratch, "consumer");
	mkdirSync(consumer, { recursive: true });
	writeFileSync(
		join(consumer, "package.json"),
		JSON.stringify({ name: "consumer", version: "1.0.0", private: true, type: "module" }),
	);

	console.log("Installing the tarball into a scratch project...");
	run("npm", ["install", "--no-audit", "--no-fund", tarball], { cwd: consumer });

	check("bin runs through the symlink npm installs", () => {
		// node_modules/.bin/node-rdap is a symlink to the real cli.js. This is the
		// case that silently produced no output before the entry guard resolved
		// symlinks.
		const out = run(join(consumer, "node_modules", ".bin", "node-rdap"), ["--version"]).trim();
		if (out !== pkg.version) {
			throw new Error(`expected "${pkg.version}", got "${out || "(no output)"}"`);
		}
	});

	check("bin runs a real command", () => {
		const out = run(join(consumer, "node_modules", ".bin", "node-rdap"), ["--help"]);
		for (const command of ["domain", "ip", "autnum"]) {
			if (!out.includes(command)) throw new Error(`--help is missing "${command}"`);
		}
	});

	check("package resolves by bare specifier and exports its api", () => {
		const script = `
			import * as api from "node-rdap";
			const missing = ["domain", "ip", "autnum"].filter((k) => typeof api[k] !== "function");
			if (missing.length) { console.error("missing exports: " + missing.join(", ")); process.exit(1); }
		`;
		run("node", ["--input-type=module", "-e", script], { cwd: consumer });
	});

	check("deep imports into internals are blocked by exports", () => {
		const script = `
			import("node-rdap/dist/tsc/cache/asn.js")
				.then(() => { console.error("deep import resolved but should not have"); process.exit(1); })
				.catch((e) => {
					if (e.code !== "ERR_PACKAGE_PATH_NOT_EXPORTED") {
						console.error("failed for the wrong reason: " + e.code);
						process.exit(1);
					}
				});
		`;
		run("node", ["--input-type=module", "-e", script], { cwd: consumer });
	});
} finally {
	rmSync(scratch, { recursive: true, force: true });
}

failed = results.some((r) => !r.ok);
console.log(
	`\n${results.filter((r) => r.ok).length}/${results.length} checks passed`,
);
process.exit(failed ? 1 : 0);
