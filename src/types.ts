interface RdapLink {
  value: string;
  rel: string;
  href: string;
  hreflang?: string[];
  type?: string;
  media?: string;
  title?: string;
}

interface RdapEvent {
  eventAction: string;
  eventActor?: string;
  eventDate: string;
  links?: RdapLink[];
}

interface RdapPublicID {
  type: string;
  identifier: string;
}

type RdapStatus =
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

type RdapNoticeAndRemarkTypes =
  | "result set truncated due to authorization"
  | "result set truncated due to excessive load"
  | "result set truncated due to unexplainable reasons"
  | "object truncated due to authorization"
  | "object truncated due to excessive load"
  | "object truncated due to unexplainable reasons";

interface RdapRemark {
  title?: string;
  type?: RdapNoticeAndRemarkTypes;
  description: string[];
  links?: RdapLink[];
}

interface RdapDsData {
  keyTag?: number;
  algorithm?: number;
  digest?: string;
  digestType?: string;
  events?: RdapEvent[];
  links?: RdapLink[];
}

interface RdapKeyData {
  flags?: number;
  protocol?: number;
  publicKey?: string;
  algorithm?: number;
  events?: RdapEvent[];
  links?: RdapLink[];
}

interface RdapSecureDNS {
  zoneSigned?: boolean;
  delegationSigned?: boolean;
  maxSigLife?: number;
  dsData?: RdapDsData[];
  keyData?: RdapKeyData[];
}

type RdapNotice = RdapRemark;

export type RdapObjectClass =
  | RdapEntityObjectClass
  | RdapNameserverObjectClass
  | RdapDomainObjectClass;

interface RdapEntityObjectClass {
  objectClassName: "entity";
  handle?: string;
  vcardArray?: any[];
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

interface RdapNameserverObjectClass {
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

interface RdapDomainObjectClass {
  objectClassName: "domain";
  handle?: string;
  ldhName?: string;
  unicodeName?: string;
  variants: {
    relation: string[];
    idnTable: string;
    variantName: {
      ldhName: string;
      unicodeName: string;
    }[];
  }[];
  nameservers: RdapNameserverObjectClass[];
  secureDNS: RdapSecureDNS;
  entities?: RdapEntityObjectClass[];
  status?: RdapStatus[];
  publicIds?: RdapPublicID[];
  remarks: RdapRemark[];
  links?: RdapLink[];
  port43?: string;
  events?: RdapEvent[];
  network?: RdapIPNetworkObjectClass;
}

interface RdapIPNetworkObjectClass {
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
  remarks: RdapRemark[];
  links?: RdapLink[];
  port43?: string;
  events?: RdapEvent[];
}

interface RdapAutonomousSystemNumberObjectClass {
  objectClassName: "autnum";
  handle?: string;
  startAutnum?: string;
  endAutnum?: string;
  name?: string;
  type?: string;
  status?: RdapStatus[];
  country?: string;
  entities?: RdapEntityObjectClass[];
  remarks: RdapRemark[];
  links?: RdapLink[];
  port43?: string;
  events?: RdapEvent[];
}

interface RdapDomainSuccessResponse extends RdapDomainObjectClass {
  rdapConformance: string[];
}

interface RdapIpSuccessResponse extends RdapIPNetworkObjectClass {
  rdapConformance: string[];
}

interface RdapAutnumSuccessResponse
  extends RdapAutonomousSystemNumberObjectClass {
  rdapConformance: string[];
}

interface RdapHelpSuccessResponse {
  rdapConformance: string[];
  notices?: RdapNotice[];
}

interface RdapErrorResponse {
  errorCode: number;
  title?: string;
  description?: string[];
}

export type RdapDomainResponse = RdapErrorResponse & RdapDomainSuccessResponse;
export type RdapIpResponse = RdapErrorResponse & RdapIpSuccessResponse;
export type RdapAutnumResponse = RdapErrorResponse & RdapAutnumSuccessResponse;
export type RdapHelpResponse = RdapErrorResponse & RdapHelpSuccessResponse;
