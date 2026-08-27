export interface RdapLink {
  value: string;
  rel: string;
  href: string;
  hreflang?: string[];
  type?: string;
  media?: string;
  title?: string;
}

export interface RdapEvent {
  eventAction: string;
  eventActor?: string;
  eventDate: string;
  links?: RdapLink[];
}

export interface RdapPublicID {
  type: string;
  identifier: string;
}

export type RdapStatus =
  | "validated"
  | "renew prohibited"
  | "update prohibited"
  | "transfer prohibited"
  | "delete prohibited"
  | "proxy"
  | "private"
  | "removed"
  | "obscured"
  | "associated"
  | "active"
  | "inactive"
  | "locked"
  | "pending create"
  | "pending renew"
  | "pending transfer"
  | "pending update"
  | "pending delete";

export type RdapNoticeAndRemarkTypes =
  | "result set truncated due to authorization"
  | "result set truncated due to excessive load"
  | "result set truncated due to unexplainable reasons"
  | "object truncated due to authorization"
  | "object truncated due to excessive load"
  | "object truncated due to unexplainable reasons";

export interface RdapRemark {
  title?: string;
  type?: RdapNoticeAndRemarkTypes;
  description: string[];
  links?: RdapLink[];
}

export interface RdapDsData {
  keyTag?: number;
  algorithm?: number;
  digest?: string;
  digestType?: string;
  events?: RdapEvent[];
  links?: RdapLink[];
}

export interface RdapKeyData {
  flags?: number;
  protocol?: number;
  publicKey?: string;
  algorithm?: number;
  events?: RdapEvent[];
  links?: RdapLink[];
}

export interface RdapSecureDNS {
  zoneSigned?: boolean;
  delegationSigned?: boolean;
  maxSigLife?: number;
  dsData?: RdapDsData[];
  keyData?: RdapKeyData[];
}

export type RdapNotice = RdapRemark;

export type RdapObjectClass =
  | RdapEntityObjectClass
  | RdapNameserverObjectClass
  | RdapDomainObjectClass;

export type VCardNestedValue = string[] | VCardNestedValue[];
export type VCardValue = string | number | boolean | VCardNestedValue[];
export type VCardProperty = [
  string,
  { [key: string]: string },
  string,
  VCardValue 
];

export interface RdapEntityObjectClass {
  objectClassName: "entity";
  handle?: string;
  vcardArray?: ['vcard', VCardProperty[]];
  roles?: string[];
  publicIds?: RdapPublicID[];
  entities?: RdapEntityObjectClass[];
  remarks?: RdapRemark[];
  links?: RdapLink[];
  events?: RdapEvent[];
  asEventActor?: Omit<RdapEvent, "eventActor">[];
  status?: RdapStatus[];
  port43?: string;
  networks?: RdapIPNetworkObjectClass[];
  autnums?: RdapAutonomousSystemNumberObjectClass[];
}

export interface RdapNameserverObjectClass {
  objectClassName: "nameserver";
  handle?: string;
  ldhName?: string;
  unicodeName?: string;
  ipAddresses?: {
    v6: string[];
    v4: string[];
  };
  entities?: RdapEntityObjectClass[];
  status?: RdapStatus[];
  remarks?: RdapRemark[];
  links?: RdapLink[];
  port43?: string;
  events?: RdapEvent[];
}

export interface RdapDomainObjectClass {
  objectClassName: "domain";
  handle?: string;
  ldhName?: string;
  unicodeName?: string;
  variants?: {
    relation: string[];
    idnTable: string;
    variantName: {
      ldhName: string;
      unicodeName: string;
    }[];
  }[];
  nameservers?: RdapNameserverObjectClass[];
  secureDNS?: RdapSecureDNS;
  entities?: RdapEntityObjectClass[];
  status?: RdapStatus[];
  publicIds?: RdapPublicID[];
  remarks?: RdapRemark[];
  links?: RdapLink[];
  port43?: string;
  events?: RdapEvent[];
  network?: RdapIPNetworkObjectClass;
}

export interface RdapIPNetworkObjectClass {
  objectClassName: "ip network";
  handle?: string;
  startAddress?: string;
  endAddress?: string;
  ipVersion?: "v4" | "v6";
  name?: string;
  type?: string;
  country?: string;
  parentHandle?: string;
  status?: RdapStatus[];
  entities?: RdapEntityObjectClass[];
  remarks?: RdapRemark[];
  links?: RdapLink[];
  port43?: string;
  events?: RdapEvent[];
}

export interface RdapAutonomousSystemNumberObjectClass {
  objectClassName: "autnum";
  handle?: string;
  startAutnum?: string;
  endAutnum?: string;
  name?: string;
  type?: string;
  status?: RdapStatus[];
  country?: string;
  entities?: RdapEntityObjectClass[];
  remarks?: RdapRemark[];
  links?: RdapLink[];
  port43?: string;
  events?: RdapEvent[];
}

export interface RdapDomainSuccessResponse extends RdapDomainObjectClass {
  rdapConformance: string[];
}

export interface RdapIpSuccessResponse extends RdapIPNetworkObjectClass {
  rdapConformance: string[];
}

export interface RdapAutnumSuccessResponse
  extends RdapAutonomousSystemNumberObjectClass {
  rdapConformance: string[];
}

export interface RdapHelpSuccessResponse {
  rdapConformance: string[];
  notices?: RdapNotice[];
}

export interface RdapErrorResponse {
  errorCode: number;
  title?: string;
  description?: string[];
}

/*
 * A lookup resolves with a success response or throws, so these describe
 * success only. They used to be intersections with RdapErrorResponse, which
 * claimed every response carried a required `errorCode` as well as its own
 * fields — true of neither a success nor an error.
 *
 * An error body from a registry is on RdapRegistryError#body instead.
 */
export type RdapDomainResponse = RdapDomainSuccessResponse;
export type RdapIpResponse = RdapIpSuccessResponse;
export type RdapAutnumResponse = RdapAutnumSuccessResponse;
export type RdapHelpResponse = RdapHelpSuccessResponse;
