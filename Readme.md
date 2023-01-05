# Node RDAP

Node RDAP client for Whois lookup in Node JS.

## Installation

Yarn:

    $ yarn add node-rdap

Npm:

    $ npm install node-rdap

Pnpm:

    $ pnpm install node-rdap

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
