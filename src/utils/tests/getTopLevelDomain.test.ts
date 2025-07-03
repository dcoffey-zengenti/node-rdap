import { getTopLevelDomain } from "../domain";

describe("getTopLevelDomain", () => {
  test("works on standard input", () => {
    const tld = getTopLevelDomain("insytful.com");
    expect(tld).toBe("com");
  });

  test("converts special characters to punycode", () => {
    const tld = getTopLevelDomain("insytful.集团");
    expect(tld).toBe("xn--3bst00m");
  });

  test("returns null for empty input", () => {
    const tld = getTopLevelDomain('');
    expect(tld).toBeNull();
  })

  test("works on input that is already a TLD", () => {
    const tld = getTopLevelDomain('com');
    expect(tld).toBe('com');
  })
});
