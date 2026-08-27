# 0.6.0

The CLI is now installable. `npm install -g node-rdap` puts a `node-rdap` command on your path, and `npx node-rdap` works. Previously the CLI was built and published but had no `bin` entry, so there was no way to run it short of naming the file inside `node_modules`.
Fixed the CLI doing nothing when run through the symlink npm installs a `bin` as. The entry point check compared the resolved module path against the unresolved `process.argv[1]`, so it never matched and the process exited silently.
Added an `exports` map. The public API is `node-rdap` itself; internals such as `node-rdap/dist/tsc/cache/asn.js` are no longer importable.
Added a LICENSE file, and `bugs` and `homepage` links. The repository url now uses `git+https` rather than the deprecated `git` protocol.
Corrected `engines` to `^22.12.0 || >=24`. The previous range, `>=20.19.0 || >=22.12.0`, was equivalent to `>=20.19.0` because the second clause could never exclude anything, and it allowed non-LTS releases. Node 20 reached end of life in April 2026. This is a statement of what is tested and supported: `engines` is advisory, so installs on older runtimes still succeed with a warning.
Added continuous integration running typecheck, lint, tests, build and a packaging smoke test against Node 22 and 24.
Added `pnpm test:pack`, which packs the tarball, installs it into a scratch project and checks it as a consumer sees it. It needs a network, so it is not part of `pnpm test`.
Readme now documents the CLI, interactive mode, caching, the supported Node versions and that the package is ESM only.

# 0.5.2

Fixed the ASN cache never storing a lookup. The per-number cache was read and flushed but never written to, so every ASN lookup fell through to a scan of the whole range list instead of a direct hit.
Fixed interactive mode exiting when a command was given a bad argument, rather than reporting it and carrying on.
Fixed the `services` type on the IANA list responses, which described a single entry rather than an array of them.
CLI logic moved to `src/cli/program.ts` so it can be tested without running the CLI. `src/cli.ts` is unchanged as the entry point.
Tests are no longer compiled into `dist`, so they are no longer published to npm. `build` uses the new `tsconfig.build.json`; the new `typecheck` script still checks them.
Tests no longer make real requests to IANA or the RDAP registries, and no longer use real company domains. Test coverage is now at 100%.

# 0.5.1

Dependency updates - @biomejs/biome, @types/node, @vitest/coverage-v8, rimraf, typescript, vitest, commander.
Typescript 7 - `moduleResolution` is now `nodenext` and `rootDir` is set explicitly, both required by the new compiler. Relative imports in tests gained their missing `.js` extensions.
Vitest 4 and Commander 15.
Moved to pnpm 12. Build script approval (`allowBuilds`) and a release-age policy exemption are now recorded in `pnpm-workspace.yaml`.
Fixed the CLI reporting its version as 0.3.0.

# 0.5.0

Moved from yarn to pnpm
Moved from eslint to biome
Moved from jest to vitest
Changed where caches are instantiated to keep concerns seperate.
Dependency updates - @types/node, commander
Punycode replaced with an ES6/typescript version.
Node 20 or higher now required.

# 0.4.2

Dependency updates - @types/jest, @types/punycode, ts-node, ts-jest, typescript, commander, @typescript-eslint/eslint-plugin, @typescript-eslint/parser, eslint, rimraf

Exported types from entry file.

# 0.4.1

Dependency updates - Typescript, typescript-eslint and various typings packages.

# 0.4.0

Replace got with native fetch.
Node 18 or higher now required.

# 0.3.6

Fixed accept header being limited to just `application/json`. `application/rdap+json` is now also allowed.

# 0.3.5

Fixed an issue with imports not working without the `--es-module-specifier-resolution=node` flag.

# 0.2.0

Changed the caching strategy for faster lookups of same IP/Domain/Autnum.

# 0.1.0

Beta Release v1

Added repository info to package json.

# 0.0.3

Now only available as ESM package.

Added Readme and Changelog.

# 0.0.2

Fixed npm not publishing build files.

# 0.0.1

Initial Release
