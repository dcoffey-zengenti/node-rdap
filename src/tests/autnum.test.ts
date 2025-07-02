import { autnum } from "../client.js";
import type { RdapAutnumResponse } from "../types.js";

describe("client querying an Autonomous System Number (ASN)", () => {
  test("should return json for valid ASN", async () => {
    let result: RdapAutnumResponse | null = null;
    result = await autnum(15169); // Google ASN
    expect(result).not.toBeNull();
  });

  test("should throw error for invalid ASN", async () => {
    await expect(autnum(999999999)).rejects.toThrow(
      "RDAP Server for the given Autonomous System Number could not be found."
    );
    await expect(autnum(-1)).rejects.toThrow(
      "RDAP Server for the given Autonomous System Number could not be found."
    );
  });
});
