import { For } from "solid-js";
import type { latencySeries, responseMix, trafficSeries } from "~/lib/mock-data";

const chartTone = ["var(--chart-2)", "var(--chart-1)", "var(--chart-4)", "var(--chart-5)"];

export function TrafficChart(props: { data: typeof trafficSeries }) {
  const width = 400;
  const height = 200;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxValue = () => Math.max(...props.data.map((d) => Math.max(d.requests, d.cached)));
  const getX = (i: number) => padding + (i / (props.data.length - 1)) * chartWidth;
  const getY = (value: number) => padding + chartHeight - (value / maxValue()) * chartHeight;

  const areaPath = (key: "requests" | "cached") =>
    "M" +
    props.data.map((d, i) => `${getX(i)},${getY(d[key])}`).join(" L") +
    ` L${getX(props.data.length - 1)},${height - padding} L${padding},${height - padding} Z`;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--chart-1)" stop-opacity="0.45" />
          <stop offset="100%" stop-color="var(--chart-1)" stop-opacity="0" />
        </linearGradient>
        <linearGradient id="gCached" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--chart-2)" stop-opacity="0.4" />
          <stop offset="100%" stop-color="var(--chart-2)" stop-opacity="0" />
        </linearGradient>
      </defs>
      <g stroke="var(--border)" stroke-width="0.5">
        <For each={[0, 1, 2, 3, 4]}>
          {(i) => (
            <line
              x1={padding}
              y1={padding + i * (chartHeight / 4)}
              x2={width - padding}
              y2={padding + i * (chartHeight / 4)}
            />
          )}
        </For>
      </g>
      <path fill="url(#gTotal)" stroke="var(--chart-1)" stroke-width="2" d={areaPath("requests")} />
      <path fill="url(#gCached)" stroke="var(--chart-2)" stroke-width="2" d={areaPath("cached")} />
      <g font-size="10" fill="var(--muted-foreground)" text-anchor="middle">
        <For each={props.data}>
          {(d, i) => (
            <text x={getX(i())} y={height - padding + 16}>
              {d.t}
            </text>
          )}
        </For>
      </g>
      <g font-size="10" fill="var(--muted-foreground)" text-anchor="end">
        <For each={[0, 1, 2, 3, 4]}>
          {(i) => (
            <text x={padding - 6} y={padding + i * (chartHeight / 4)}>
              {Math.round((maxValue() * (4 - i)) / 4000)}k
            </text>
          )}
        </For>
      </g>
      <g transform={`translate(${width - 100}, ${padding})`} font-size="10">
        <text x="0" y="0" fill="var(--chart-1)">
          ■ Total
        </text>
        <text x="0" y="16" fill="var(--chart-2)">
          ■ Cached
        </text>
      </g>
    </svg>
  );
}

export function ResponseMixChart(props: { data: typeof responseMix }) {
  const radius = 60;
  const centerX = 150;
  const centerY = 120;
  const total = () => props.data.reduce((sum, r) => sum + r.value, 0);

  const slices = () => {
    let startAngle = -Math.PI / 2;
    return props.data.map((r, i) => {
      const sliceAngle = (r.value / total()) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;
      const largeArc = sliceAngle > Math.PI ? 1 : 0;

      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);

      const path = `M${centerX},${centerY} L${x1},${y1} A${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z`;
      startAngle = endAngle;

      return { path, color: chartTone[i], name: r.name, value: r.value, key: r.key };
    });
  };

  return (
    <svg width="100%" height="100%" viewBox="0 0 300 240">
      <For each={slices()}>{(s) => <path d={s.path} fill={s.color} stroke="none" />}</For>
      <circle cx={centerX} cy={centerY} r={40} fill="var(--card)" />
      <g font-size="10" fill="var(--muted-foreground)">
        <For each={props.data}>
          {(r, i) => (
            <text x={centerX + 80} y={centerY - 30 + i() * 20}>
              <tspan style={{ fill: chartTone[i()] }}>■ </tspan>
              {r.name} {r.value}%
            </text>
          )}
        </For>
      </g>
    </svg>
  );
}

export function LatencyChart(props: { data: typeof latencySeries }) {
  const width = 350;
  const height = 140;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxLatency = () => Math.max(...props.data.map((d) => d.ms));
  const minLatency = () => Math.min(...props.data.map((d) => d.ms));
  const getX = (i: number) => padding + (i / (props.data.length - 1)) * chartWidth;
  const getY = (ms: number) =>
    padding +
    chartHeight -
    ((ms - minLatency()) / (maxLatency() - minLatency() || 1)) * chartHeight;

  const points = () => props.data.map((d, i) => `${getX(i)},${getY(d.ms)}`).join(" ");

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
      <g stroke="var(--border)" stroke-width="0.5">
        <For each={[0, 1, 2, 3]}>
          {(i) => (
            <line
              x1={padding}
              y1={padding + i * (chartHeight / 3)}
              x2={width - padding}
              y2={padding + i * (chartHeight / 3)}
            />
          )}
        </For>
      </g>
      <polyline fill="none" stroke="var(--chart-3)" stroke-width="2.5" points={points()} />
      <For each={props.data}>
        {(d, i) => <circle cx={getX(i())} cy={getY(d.ms)} r={3} fill="var(--chart-3)" />}
      </For>
      <g font-size="10" fill="var(--muted-foreground)" text-anchor="middle">
        <For each={props.data}>
          {(d, i) => (
            <text x={getX(i())} y={height - padding + 16}>
              {d.t}
            </text>
          )}
        </For>
      </g>
      <g font-size="10" fill="var(--muted-foreground)" text-anchor="end">
        <text x={padding - 6} y={padding + chartHeight}>
          {minLatency()}ms
        </text>
        <text x={padding - 6} y={padding}>
          {maxLatency()}ms
        </text>
      </g>
    </svg>
  );
}
