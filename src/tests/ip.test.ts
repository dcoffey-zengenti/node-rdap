import { ip } from "../client.js";
import type { RdapIpResponse } from "../types.js";

describe("client querying an IP address", () => {
  test("should return json for valid IPv4 address", async () => {
    let result: RdapIpResponse | null = null;
    result = await ip("8.8.8.8");
    expect(result).not.toBeNull();
  });

  test("should return json for valid IPv6 address", async () => {
    let result: RdapIpResponse | null = null;
    result = await ip("2001:4860:4860::8888");
    expect(result).not.toBeNull();
  });

  test("should throw error for invalid IP address", async () => {
    await expect(ip("999.999.999.999")).rejects.toThrow(
      "Value has to be in the range of 0-255"
    );
    await expect(ip("not.an.ip")).rejects.toThrow(
      "The given value is not a valid IP"
    );
  });
});
