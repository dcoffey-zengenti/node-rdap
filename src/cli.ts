import { autnum, domain, ip } from "./client";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

yargs(hideBin(process.argv))
  .command(
    "domain <domain>",
    "get the rdap response for a domain",
    {
      domain: {
        type: "string",
        demandOption: true,
      },
    },
    async (argv) => {
      console.log(await domain(argv.domain));
    }
  )
  .command(
    "ip <ip>",
    "get the rdap response for a ip",
    {
      ip: {
        type: "string",
        demandOption: true,
      },
    },
    async (argv) => {
      console.log(await ip(argv.ip));
    }
  )
  .command(
    "autnum <autnum>",
    "get the rdap response for a autnum",
    {
      autnum: {
        type: "number",
        demandOption: true,
      },
    },
    async (argv) => {
      console.log(await autnum(argv.autnum));
    }
  )
  .demandCommand(1)
  .parse();
