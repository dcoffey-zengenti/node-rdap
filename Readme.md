# Node RDAP

Node RDAP client for Whois lookup in Node JS.

Looks up domains, IP addresses, Autonomous System Numbers, nameservers and
entities over [RDAP](https://datatracker.ietf.org/doc/html/rfc7480), the
protocol that replaces WHOIS. Ships as a library and a command line tool.

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
import { domain, ip, autnum, nameserver, entity } from "node-rdap";

await domain("github.com");
await ip("140.82.121.4");
await ip("2a00:1450:4009:818::200e");
await autnum(1);
await nameserver("ns1.github.com");
await entity("ZG39-ARIN");
await entity("https://rdap.nominet.uk/uk/entity/BBC");
```

### What each lookup covers

| Function | Takes | Routed by |
| --- | --- | --- |
| `domain(fqdn)` | A domain name | The IANA DNS bootstrap file |
| `ip(address)` | An IPv4 or IPv6 address | The IANA IPv4/IPv6 bootstrap files |
| `autnum(number)` | An Autonomous System Number | The IANA ASN bootstrap file |
| `nameserver(name)` | A nameserver host name | The DNS bootstrap file, by its own tld |
| `entity(handleOrUrl)` | An entity url, or a tagged handle | The url itself, or the RFC 8521 object tags registry |

### Entities

Entities are normally found inside another response, which carries a `self`
link to them. That url is the reliable way to fetch one:

```typescript
const result = await domain("bbc.co.uk");
const self = result.entities?.[0]?.links?.find((link) => link.rel === "self");
if (self) {
  const registrar = await entity(self.href);
}
```

`entity()` also accepts a bare handle, but only a handle ending in one of the
provider tags registered under [RFC 8521](https://datatracker.ietf.org/doc/html/rfc8521)
can be routed that way — there are eight, essentially the regional internet
registries. `entity("ZG39-ARIN")` resolves; `entity("BBC")` cannot, and raises
`RdapServerNotFoundError` telling you to use the self link instead.

Only `http` and `https` urls are accepted. A self link comes from a remote
response, so its scheme is not necessarily one you chose.

`help` and the search endpoints (`/domains?name=`, `/nameservers?ip=`) are not
implemented.

### Types

Response types are exported for TypeScript consumers, along with the object
classes they are built from:

```typescript
import type {
  RdapDomainResponse,
  RdapIpResponse,
  RdapAutnumResponse,
  RdapNameserverResponse,
  RdapEntityResponse,
} from "node-rdap";
```

Fields that registries commonly omit — `remarks`, `variants`, `nameservers`,
`secureDNS` — are optional, because they genuinely are absent from real
responses.

### Errors

A lookup rejects with a typed error. Catch `RdapError` to handle any failure, or
a subclass to tell them apart:

| Error | Thrown when |
| --- | --- |
| `RdapValidationError` | The value is not a well formed domain, IP, ASN or handle |
| `RdapServerNotFoundError` | Nothing publishes an RDAP server for it |
| `RdapRegistryError` | The server was reached and answered with an error status |
| `RdapTimeoutError` | The request exceeded the configured timeout |
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

### Configuration

```typescript
import { configure, getConfig } from "node-rdap";

configure({ timeoutMs: 5000, cacheTtlSeconds: 3600 });
```

| Setting | Default | Meaning |
| --- | --- | --- |
| `timeoutMs` | `10000` | How long any single request may take |
| `cacheTtlSeconds` | `86400` | How long a cached lookup stays valid |

Settings apply process wide, to requests made after the call. A cached entry
keeps the lifetime it was stored with.

### Caching

Lookups are backed by in-memory caches, so repeated queries do not re-fetch the
IANA bootstrap files. The first lookup of a kind fetches the relevant registry
list and caches every entry in it, so later lookups of other names of the same
kind are answered without another request.

```typescript
import { flushCaches, resetCaches } from "node-rdap";

flushCaches();        // empty everything; the next lookup refetches
await resetCaches();  // empty and refetch now, leaving the caches warm
```

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
    $ node-rdap nameserver ns1.github.com
    $ node-rdap entity ZG39-ARIN
    $ node-rdap entity https://rdap.nominet.uk/uk/entity/BBC

    $ node-rdap --timeout 5000 domain github.com
    $ node-rdap --help
    $ node-rdap --version

A failed lookup writes the reason to stderr and exits non-zero.

### Interactive mode

Run `node-rdap` with no arguments to enter interactive mode, where each line is
treated as a command:

    $ node-rdap
    domain github.com
    ip 140.82.121.4

An unrecognised command prints the help text and the session keeps running. A
failed lookup there does not end the session or fail the process.

## Licence

[MIT](./LICENSE)
