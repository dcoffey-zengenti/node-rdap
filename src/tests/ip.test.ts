import { ip } from "../client.js";

describe("client querying an IP address", () => {
  test("should return json for valid IPv4 address", async () => {
    await expect(ip("8.8.8.8")).resolves.toBeDefined();
  });

  test("should return json for valid IPv6 address", async () => {
    await expect(ip("2001:4860:4860::8888")).resolves.toBeDefined();
  });

  test("should throw error for invalid IP address", async () => {
    await expect(ip("999.999.999.999")).rejects.toThrow(
      "Value has to be in the range of 0-255"
    );
    await expect(ip("not.an.ip")).rejects.toThrow(
      "The given value is not a valid IP"
    );
  });

  test('should throw error if an RDAP server cannot be found for an IP Address', async () => {
    await expect(ip('127.0.0.1')).rejects.toThrow('RDAP Server for the given IP Address could not be found.');
  });
});
