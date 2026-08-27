# 1.0.0

The first stable release. The API described here is the one 1.x will keep.

Added `nameserver()`, for looking up a nameserver by name. It is routed by its own top level domain, through the same IANA bootstrap list as `domain()`.
Added `entity()`, for looking up an entity by url or by handle. Entities are normally found inside another response, which carries a `self` link to them, and passing that url is the reliable way to fetch one — only `http` and `https` urls are accepted, since a self link's scheme is not something the caller chose. A bare handle also works, but only when it ends in one of the eight provider tags registered under RFC 8521, so most registrar and registry handles are not routable that way and the error says so.
Added request timeouts, defaulting to 10 seconds and applied to every request a lookup makes. There was previously no limit at all, so a server that accepted a connection and then went quiet would hang the caller indefinitely. Exceeding the budget raises `RdapTimeoutError`.
Added `configure({ timeoutMs, cacheTtlSeconds })` and `getConfig()` for setting policy once per process.
Added `flushCaches()` and `resetCaches()`, so cache control is reachable now that the exports map has closed off the internals.
The CLI gains `nameserver` and `entity` commands and a `--timeout` flag, so everything the library can do is reachable from the command line.
`help` and the search endpoints are deliberately not implemented. The Readme says so rather than leaving it implied.

## Upgrading from 0.x

Almost all of the work is in the error handling. Previously every failure was a plain `Error` and the only way to tell them apart was to match on the message.

```js
// before
try {
  await domain("example.com");
} catch (error) {
  if (error.message.includes("could not be found")) { /* ... */ }
}

// after
import { RdapServerNotFoundError, RdapRegistryError } from "node-rdap";

try {
  await domain("example.com");
} catch (error) {
  if (error instanceof RdapServerNotFoundError) { /* ... */ }
  else if (error instanceof RdapRegistryError) { console.log(error.status); }
}
```

Every error message has changed, so any code matching on message text needs updating. The error type is now the thing to branch on.

`ip()` and `autnum()` now reject when the registry answers with an error status. They used to resolve with the RDAP error body typed as a success, so a lookup that appeared to succeed may now correctly throw.

`ip()` rejects a malformed address up front with `RdapValidationError` rather than surfacing `ip-matching`'s wording, such as "Value has to be in the range of 0-255".

`autnum()` rejects negative and fractional numbers as invalid rather than reporting that no registry serves them.

Response types no longer include the error response fields, so `result.errorCode` is gone. An error body is on `RdapRegistryError#body`.

`remarks`, `variants`, `nameservers` and `secureDNS` are now optional, because registries routinely omit them. Code that read them without checking was already at risk of a runtime error and will now be told so at compile time.

Deep imports such as `node-rdap/dist/tsc/cache/asn.js` no longer resolve. Everything public is exported from `node-rdap` itself.

The supported Node versions are now `^22.12.0 || >=24`. Older runtimes still install, with a warning.

# 1.0.0-rc.1

Breaking. This is the release that corrects the public API before it is frozen for 1.0.0.

Lookups now throw typed errors instead of plain `Error`s with assembled messages. `RdapValidationError`, `RdapServerNotFoundError`, `RdapRegistryError` and `RdapNetworkError` all extend `RdapError`, so you can catch the base class for any failure or a subclass to tell them apart. The underlying failure is kept on `cause` rather than flattened into the message, and `RdapRegistryError` carries the status and the parsed RDAP error body.
`domain()` no longer wraps everything it does in one try/catch. It used to report "no server for this tld", "the registry said 404" and "the network is down" with the same opaque string, and it re-wrapped errors it had raised itself.
`ip()` and `autnum()` now check the response status. Previously neither did, so an RDAP error body came back as if it were a successful lookup.
`ip()` validates the address before doing any work, using Node's own parser. It used to fail part way through a mask scan with wording borrowed from `ip-matching`, such as "Value has to be in the range of 0-255". It also no longer decides between IPv4 and IPv6 by looking for a colon.
`autnum()` rejects negative and fractional numbers as invalid rather than reporting them as having no registry.
Response types describe success only. They were intersections with the error response, which claimed every response carried a required `errorCode` alongside its own fields — true of neither a success nor an error.
Fields that registries routinely omit are now optional. `variants`, `nameservers`, `secureDNS` and `remarks` were all declared as required, so `result.remarks.map(...)` typechecked and then threw at runtime.
Every type reachable from the public API is now exported, so consumers can name the things they are given.
The CLI exits non-zero when a lookup fails. It always exited 0, so no script or CI step could detect a failure. Interactive mode is unchanged: a bad command is reported and the session carries on.
Both hops of a lookup, the IANA bootstrap fetch and the registry request, now go through the same code and fail the same way.

# 0.6.0

The CLI is now installable. `npm install -g node-rdap` puts a `node-rdap` command on your path, and `npx node-rdap` works. Previously the CLI was built and published but had no `bin` entry, so there was no way to run it short of naming the file inside `node_modules`.
Fixed the CLI doing nothing when run through the symlink npm installs a `bin` as. The entry point check compared the resolved module path against the unresolved `process.argv[1]`, so it never matched and the process exited silently.
Added an `exports` map. The public API is `node-rdap` itself; internals such as `node-rdap/dist/tsc/cache/asn.js` are no longer importable.
Added a LICENSE file, and `bugs` and `homepage` links. The repository url now uses `git+https` rather than the deprecated `git` protocol.
Corrected `engines` to `^22.12.0 || >=24`. The previous range, `>=20.19.0 || >=22.12.0`, was equivalent to `>=20.19.0` because the second clause could never exclude anything, and it allowed non-LTS releases. Node 20 reached end of life in April 2026. This is a statement of what is tested and supported: `engines` is advisory, so installs on older runtimes still succeed with a warning.
Added continuous integration running typecheck, lint, tests, build and a packaging smoke test against Node 22 and 24.
Added `pnpm test:pack`, which packs the tarball, installs it into a scratch project and checks it as a consumer sees it. It needs a network, so it is not part of `pnpm test`.
Readme now documents the CLI, interactive mode, caching, the supported Node versions and that the package is ESM only.
Moved to punynode 1.0. The only production dependency that was still on a `^0.x` range is now on a stable major, so a patch release of it can no longer introduce a breaking change here.

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
