import { isFullyQualifiedDomainName } from "../domain";

describe("isFullyQualifieidDomainName", () => {
  test("should return true for valid FQDN", () => {
    let isFQDN: boolean;
    isFQDN = isFullyQualifiedDomainName("insytful.com");
    expect(isFQDN).toBe(true);
    isFQDN = isFullyQualifiedDomainName("insytful.co.uk");
    expect(isFQDN).toBe(true);
    isFQDN = isFullyQualifiedDomainName("insytful.badger");
    expect(isFQDN).toBe(true);
  });

  test("should return false for invalid FQDN", () => {
    let isFQDN: boolean;
    isFQDN = isFullyQualifiedDomainName("insytful");
    expect(isFQDN).toBe(false);
    isFQDN = isFullyQualifiedDomainName("https://www.insytful.com");
    expect(isFQDN).toBe(false);
    isFQDN = isFullyQualifiedDomainName("https://www.insytful.com/news");
    expect(isFQDN).toBe(false);
  });
});
