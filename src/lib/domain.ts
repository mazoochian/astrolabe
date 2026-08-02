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
