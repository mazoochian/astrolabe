export const trafficSeries = [
  { t: "00:00", requests: 41200, cached: 30100 },
  { t: "03:00", requests: 32800, cached: 24600 },
  { t: "06:00", requests: 38400, cached: 29200 },
  { t: "09:00", requests: 71600, cached: 55800 },
  { t: "12:00", requests: 92400, cached: 74100 },
  { t: "15:00", requests: 88100, cached: 70300 },
  { t: "18:00", requests: 103500, cached: 84900 },
  { t: "21:00", requests: 76200, cached: 61400 },
] as const;

export const responseMix = [
  { name: "2xx", value: 82, key: "ok" },
  { name: "3xx", value: 9, key: "redirect" },
  { name: "4xx", value: 6, key: "client" },
  { name: "5xx", value: 3, key: "server" },
] as const;

export type ResponseMix = (typeof responseMix)[number];

export const latencySeries = [
  { t: "Mon", ms: 42 },
  { t: "Tue", ms: 38 },
  { t: "Wed", ms: 46 },
  { t: "Thu", ms: 35 },
  { t: "Fri", ms: 31 },
  { t: "Sat", ms: 28 },
  { t: "Sun", ms: 33 },
] as const;

export type Certificate = {
  id: string;
  hosts: string;
  authority: string;
  type: string;
  status: "Active" | "Issuing";
  expires: string;
};

export const certificates: Certificate[] = [
  {
    id: "c1",
    hosts: "astrolabe.io, *.astrolabe.io",
    authority: "Let's Encrypt",
    type: "Universal",
    status: "Active",
    expires: "12 Oct 2026",
  },
  {
    id: "c2",
    hosts: "api.astrolabe.io",
    authority: "Google Trust",
    type: "Advanced",
    status: "Active",
    expires: "03 Sep 2026",
  },
  {
    id: "c3",
    hosts: "beta.astrolabe.io",
    authority: "Let's Encrypt",
    type: "Universal",
    status: "Issuing",
    expires: "—",
  },
];

export type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  scope: string;
};

export const members: Member[] = [
  {
    id: "m1",
    name: "Nadia Farrell",
    email: "nadia@astrolabe.io",
    role: "Super Administrator",
    scope: "All zones",
  },
  {
    id: "m2",
    name: "Ito Mbeki",
    email: "ito@astrolabe.io",
    role: "DNS Editor",
    scope: "astrolabe.io",
  },
  {
    id: "m3",
    name: "Priya Raman",
    email: "priya@astrolabe.io",
    role: "SSL Manager",
    scope: "astrolabe.io",
  },
  {
    id: "m4",
    name: "Casper Lund",
    email: "casper@partner.dev",
    role: "Read Only",
    scope: "orbit-labs.dev",
  },
];

export type Token = {
  id: string;
  name: string;
  permissions: string;
  lastUsed: string;
  expires: string;
};

export const tokens: Token[] = [
  {
    id: "t1",
    name: "ci-deploy-bot",
    permissions: "DNS:Edit",
    lastUsed: "12 minutes ago",
    expires: "30 Nov 2026",
  },
  {
    id: "t2",
    name: "terraform-prod",
    permissions: "Zone:Read, DNS:Edit",
    lastUsed: "4 hours ago",
    expires: "Never",
  },
  {
    id: "t3",
    name: "audit-readonly",
    permissions: "Zone:Read",
    lastUsed: "6 days ago",
    expires: "01 Aug 2026",
  },
];
