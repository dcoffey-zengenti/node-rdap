import { autnum } from "../client.js";

describe("client querying an Autonomous System Number (ASN)", () => {
  test("should return json for valid ASN", async () => {
    await expect(autnum(15169)).resolves.toBeDefined()
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
