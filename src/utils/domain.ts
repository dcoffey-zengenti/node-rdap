import { toASCII as punycode } from "punycode";

export const getTopLevelDomain = (domain: string) => {
  const parts = domain.split(".");
  if (parts.length && parts[parts.length - 1])
    return punycode(parts[parts.length - 1]);
  return null;
};

export const isFullyQualifiedDomainName = (str: string) => {
  const parts = str.split(".");
  const topLevelDomain = parts[parts.length - 1];

  if (parts.length < 2) return false;

  if (
    !/^([a-z\u00A1-\u00A8\u00AA-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]{2,}|xn[a-z0-9-]{2,})$/i.test(
      topLevelDomain
    )
  )
    return false;

  if (/\s/.test(topLevelDomain)) {
    return false;
  }

  if (/^\d+$/.test(topLevelDomain)) {
    return false;
  }

  return parts.every((part) => {
    if (part.length > 63) {
      return false;
    }

    if (!/^[a-z_\u00a1-\uffff0-9-]+$/i.test(part)) {
      return false;
    }

    if (/[\uff01-\uff5e]/.test(part)) {
      return false;
    }

    if (/^-|-$/.test(part)) {
      return false;
    }

    if (/_/.test(part)) {
      return false;
    }

    return true;
  });
};
