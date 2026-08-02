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
