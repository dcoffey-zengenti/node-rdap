# Node RDAP

Node RDAP client for Whois lookup in Node JS.

Looks up domains, IP addresses and Autonomous System Numbers over
[RDAP](https://datatracker.ietf.org/doc/html/rfc7480), the protocol that replaces
WHOIS. Ships as a library and a command line tool.

## Requirements

- Node.js `^22.12.0 || >=24`
- **ESM only.** This package has no CommonJS build, so `require("node-rdap")`
  will not work. Use `import`.

## Installation

Npm:

    $ npm install node-rdap

Pnpm:

    $ pnpm add node-rdap

Yarn:

    $ yarn add node-rdap

## Usage

```typescript
import { domain, ip, autnum } from "node-rdap";

domain("github.com").then((result) => {
  console.log(result);
});

ip("140.82.121.4").then((result) => {
  console.log(result);
});

ip("2a00:1450:4009:818::200e").then((result) => {
  console.log(result);
});

autnum(1).then((result) => {
  console.log(result);
});
```

Response types are exported for TypeScript consumers:

```typescript
import type {
  RdapDomainResponse,
  RdapIpResponse,
  RdapAutnumResponse,
} from "node-rdap";
```

### Errors

A lookup rejects with a typed error. Catch `RdapError` to handle any failure, or
a subclass to tell them apart:

| Error | Thrown when |
| --- | --- |
| `RdapValidationError` | The value is not a well formed domain, IP address or ASN |
| `RdapServerNotFoundError` | IANA publishes no RDAP server for it |
| `RdapRegistryError` | The server was reached and answered with an error status |
| `RdapNetworkError` | The server could not be reached, or its response was not JSON |

```typescript
import { domain, RdapRegistryError, RdapServerNotFoundError } from "node-rdap";

try {
  await domain("example.com");
} catch (error) {
  if (error instanceof RdapServerNotFoundError) {
    // Nothing to look up: no registry serves this tld.
  } else if (error instanceof RdapRegistryError) {
    console.log(error.status, error.body?.errorCode);
  } else {
    throw error;
  }
}
```

The original failure is always kept on `cause` rather than folded into the
message, so a network failure can still be inspected.

## Command line

Installing globally puts a `node-rdap` command on your path:

    $ npm install -g node-rdap

Or run it without installing:

    $ npx node-rdap domain github.com

### Commands

    $ node-rdap domain github.com
    $ node-rdap ip 140.82.121.4
    $ node-rdap ip 2a00:1450:4009:818::200e
    $ node-rdap autnum 1

    $ node-rdap --help
    $ node-rdap --version

### Interactive mode

Run `node-rdap` with no arguments to enter interactive mode, where each line is
treated as a command:

    $ node-rdap
    domain github.com
    ip 140.82.121.4

An unrecognised command prints the help text; the session keeps running.

## Caching

Lookups are backed by in-memory caches so that repeated queries do not re-fetch
the IANA bootstrap files. The first lookup of a kind fetches the relevant
registry list from IANA and caches every entry in it, so subsequent lookups for
other names of the same kind are answered without another request.

Caches live for the lifetime of the process.

## Licence

[MIT](./LICENSE)
