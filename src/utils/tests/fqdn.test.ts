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

  test('should return false for empty space input', () => {
    let isFQDN: boolean;
    isFQDN = isFullyQualifiedDomainName(' ');
    expect(isFQDN).toBe(false);
    isFQDN = isFullyQualifiedDomainName('    ');
    expect(isFQDN).toBe(false);
    isFQDN = isFullyQualifiedDomainName("\t");
    expect(isFQDN).toBe(false);
    isFQDN = isFullyQualifiedDomainName("\t\t\t\t");
    expect(isFQDN).toBe(false);
    isFQDN = isFullyQualifiedDomainName("\n");
    expect(isFQDN).toBe(false);
    isFQDN = isFullyQualifiedDomainName("\n\n\n\n");
    expect(isFQDN).toBe(false);
    isFQDN = isFullyQualifiedDomainName(" \t\n");
    expect(isFQDN).toBe(false);
  });

  test('should return false for numeric input', () => {
    let isFQDN: boolean;
    isFQDN = isFullyQualifiedDomainName('12345');
    expect(isFQDN).toBe(false);
    isFQDN = isFullyQualifiedDomainName('834925');
    expect(isFQDN).toBe(false);
  });

  test('should return false if one of the labels has more than 63 characters', () => {
    let isFQDN: boolean;
    isFQDN = isFullyQualifiedDomainName('www.myreallylongdomainwithmorethan63characterscontainedinsideofitself.co.uk');
    expect(isFQDN).toBe(false);
    isFQDN = isFullyQualifiedDomainName('wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.domain.co.uk');
    expect(isFQDN).toBe(false);
    isFQDN = isFullyQualifiedDomainName('wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww.domain.co.uk');
    expect(isFQDN).toBe(true);
  });

   test('should return false if the domain is too long', () => {
    let isFQDN: boolean;
    isFQDN = isFullyQualifiedDomainName('aaaaaaaaaaaaaaaaaaaa.bbbbbbbbbbbbbbbbbbbb.cccccccccccccccccccc.dddddddddddddddddddd.eeeeeeeeeeeeeeeeeeee.ffffffffffffffffffff.gggggggggggggggggggg.www.sub.domain.of.really.long.domain.that.is.over.the.two.hundred.and.fifty.five.character.limit.for.domains.com');
    expect(isFQDN).toBe(false);
    isFQDN = isFullyQualifiedDomainName('www.sub.domain.of.really.long.domain.that.is.not.over.the.two.hundred.and.fifty.five.character.limit.for.domains.com');
    expect(isFQDN).toBe(true);
  });

  test('should return false if the domain contains an invalid character', () => {
    let isFQDN: boolean;
    isFQDN = isFullyQualifiedDomainName('mydomain.co.uk');
    expect(isFQDN).toBe(true);
    isFQDN = isFullyQualifiedDomainName('mydomain！.co.uk');
    expect(isFQDN).toBe(false);
    isFQDN = isFullyQualifiedDomainName('mydomain～.co.uk');
    expect(isFQDN).toBe(false);
  });

  test('should return false if the domain starts or ends with a hyphen', () => {
    let isFQDN: boolean;
    isFQDN = isFullyQualifiedDomainName('my-hyphenated-domain.com');
    expect(isFQDN).toBe(true);
    isFQDN = isFullyQualifiedDomainName('-hyphenated-domain.com');
    expect(isFQDN).toBe(false);
    isFQDN = isFullyQualifiedDomainName('hyphenated-domain-.com');
    expect(isFQDN).toBe(false);
    isFQDN = isFullyQualifiedDomainName('sub-domain.my-domain.com');
    expect(isFQDN).toBe(true);
    isFQDN = isFullyQualifiedDomainName('sub-domain-.my-domain.com');
    expect(isFQDN).toBe(false);
    isFQDN = isFullyQualifiedDomainName('-sub-domain.my-domain.com');
    expect(isFQDN).toBe(false);
    isFQDN = isFullyQualifiedDomainName('sub-domain.-my-domain.com');
    expect(isFQDN).toBe(false);
    isFQDN = isFullyQualifiedDomainName('sub-domain.my-domain-.com');
    expect(isFQDN).toBe(false);
    isFQDN = isFullyQualifiedDomainName('deep-sub.sub-domain.my-domain.com');
    expect(isFQDN).toBe(true);
    isFQDN = isFullyQualifiedDomainName('-deep-sub.sub-domain.my-domain.com');
    expect(isFQDN).toBe(false);
    isFQDN = isFullyQualifiedDomainName('deep-sub-.sub-domain.my-domain.com');
    expect(isFQDN).toBe(false);
    isFQDN = isFullyQualifiedDomainName('deep-sub.-sub-domain.my-domain.com');
    expect(isFQDN).toBe(false);
    isFQDN = isFullyQualifiedDomainName('deep-sub.sub-domain-.my-domain.com');
    expect(isFQDN).toBe(false);
    isFQDN = isFullyQualifiedDomainName('deep-sub.sub-domain.-my-domain.com');
    expect(isFQDN).toBe(false);
    isFQDN = isFullyQualifiedDomainName('deep-sub.sub-domain.my-domain-.com');
    expect(isFQDN).toBe(false);
  });

  test('should return false if the domain contains an underscore', () => {
    let isFQDN: boolean;
    isFQDN = isFullyQualifiedDomainName('my_domain.com');
    expect(isFQDN).toBe(false);
    isFQDN = isFullyQualifiedDomainName('my_longer_domain.com');
    expect(isFQDN).toBe(false);
    isFQDN = isFullyQualifiedDomainName('my-even_longer-domain.com');
    expect(isFQDN).toBe(false);
  })
});
