import { domain } from "../client";
import { RdapDomainResponse } from "../types";

describe("client querying a domain", () => {
  test("should return json for valid domain.", async () => {
    let result: RdapDomainResponse | null = null;
    result = await domain("insytful.com");
    expect(result).not.toBe(null);
    result = await domain("insytful.co.uk");
    expect(result).not.toBe(null);
    result = await domain("contensis.com");
    expect(result).not.toBe(null);
  });

  test("should return error for invalid TLD", async () => {
    let error;
    try {
      await domain("insytful.badger");
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();

    error = undefined;
    try {
      await domain("insytful.eggs");
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();

    error = undefined;
    try {
      await domain("contensis.contensis");
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
  });

  test("should return null for non-existant domain", async () => {
    let result: RdapDomainResponse | null = null;
    result = await domain("insytful-contensis-party-time.com");
    expect(result).toBe(null);
    result = await domain("insytful-contensis-party-time.co.uk");
    expect(result).toBe(null);
  });
});
