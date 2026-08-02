export const dnsRecordTypes = ["A", "AAAA", "CNAME", "MX", "TXT", "NS"] as const;

export type Zone = {
  id: string;
  name: string;
  status: "Active" | "Pending";
};

export type DnsRecord = {
  id: string;
  zoneId: string;
  type: (typeof dnsRecordTypes)[number];
  name: string;
  content: string;
  ttl: string;
  proxied: boolean;
};

export type DnsRecordInput = Omit<DnsRecord, "id" | "zoneId">;

export type Certificate = {
  id: string;
  zoneId: string;
  hosts: string;
  authority: string;
  type: string;
  status: "Active" | "Issuing";
  expires: string;
};

export const memberRoles = [
  "Super Administrator",
  "DNS Editor",
  "SSL Manager",
  "Read Only",
] as const;

export type Member = {
  id: string;
  name: string;
  email: string;
  role: (typeof memberRoles)[number];
  scope: string;
};

export type ApiToken = {
  id: string;
  name: string;
  permissions: string;
  lastUsed: string;
  expires: string;
};
