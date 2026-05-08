export type CurveVisualizerSize = 'sm' | 'md' | 'lg';
export type CurveVisualizerVariant = 'default' | 'interactive' | 'cartel' | 'static-svg';

export type CurvePoint = Readonly<{ month: number; collateral: number }>;

export type CurveVisualizerProps = Readonly<{
  size?: CurveVisualizerSize;
  variant?: CurveVisualizerVariant;
  ariaLabel?: string;
  data?: ReadonlyArray<CurvePoint>;
}>;

const SIZE_MAP: Record<CurveVisualizerSize, Readonly<{ width: number; height: number }>> = {
  sm: { width: 320, height: 120 },
  md: { width: 480, height: 180 },
  lg: { width: 720, height: 320 },
};

const DEFAULT_DATA: ReadonlyArray<CurvePoint> = [
  { month: 1, collateral: 180 },
  { month: 2, collateral: 150 },
  { month: 3, collateral: 120 },
  { month: 4, collateral: 92 },
  { month: 5, collateral: 68 },
  { month: 6, collateral: 50 },
  { month: 7, collateral: 35 },
  { month: 8, collateral: 20 },
];

const PALETTE: Record<CurveVisualizerVariant, Readonly<{ line: string; fill: string; dot: string }>> = {
  default: { line: '#2f7d68', fill: 'rgba(47, 125, 104, 0.12)', dot: '#2f7d68' },
  interactive: { line: '#2f7d68', fill: 'rgba(47, 125, 104, 0.16)', dot: '#44aa8d' },
  cartel: { line: '#965625', fill: 'rgba(150, 86, 37, 0.14)', dot: '#b26a33' },
  'static-svg': { line: '#2f7d68', fill: 'rgba(47, 125, 104, 0.12)', dot: '#2f7d68' },
};

function toPoints(data: ReadonlyArray<CurvePoint>, width: number, height: number): string {
  if (data.length === 0) {
    return '';
  }
  if (data.length === 1) {
    return `${width / 2},${height / 2}`;
  }
  const maxCollateral = Math.max(...data.map((point) => point.collateral));
  const minCollateral = Math.min(...data.map((point) => point.collateral));
  const span = Math.max(1, maxCollateral - minCollateral);

  return data
    .map((point, index) => {
      const x = (index / (data.length - 1)) * (width - 40) + 20;
      const normalized = (point.collateral - minCollateral) / span;
      const y = height - 20 - normalized * (height - 40);
      return `${x},${y}`;
    })
    .join(' ');
}

function toArea(points: string, height: number): string {
  const [first] = points.split(' ');
  const last = points.trim().split(' ').pop();
  if (!first || !last) {
    return '';
  }
  return `M ${first} L ${points.split(' ').slice(1).join(' L ')} L ${last.split(',')[0]},${height - 20} L ${first.split(',')[0]},${height - 20} Z`;
}

export function CurveVisualizer({ size = 'md', variant = 'default', ariaLabel, data = DEFAULT_DATA }: CurveVisualizerProps) {
  const { width, height } = SIZE_MAP[size];
  const points = toPoints(data, width, height);
  const areaPath = toArea(points, height);
  const palette = PALETTE[variant];
  const label = ariaLabel ?? 'Collateral curve over rotation months';
  const shouldAnimate = variant === 'static-svg';

  return (
    <figure style={{ margin: 0, position: 'relative' }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={label}
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>{label}</title>
        <style>
          {`.curve-line { stroke-dasharray: 1000; stroke-dashoffset: 1000; }
            @supports (animation-timeline: view()) {
              .curve-line.scroll-animate {
                animation: draw 1.2s ease-out both;
                animation-timeline: view();
                animation-range: entry 10% cover 35%;
              }
            }
            @keyframes draw { to { stroke-dashoffset: 0; } }
            @media (prefers-reduced-motion: reduce) {
              .curve-line { animation: none !important; stroke-dashoffset: 0 !important; }
            }`}
        </style>
        <rect x="0" y="0" width={width} height={height} rx="10" fill="#f8fbfa" />
        <path d={areaPath} fill={palette.fill} />
        <polyline
          className={`curve-line${shouldAnimate ? ' scroll-animate' : ''}`}
          points={points}
          fill="none"
          stroke={palette.line}
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.split(' ').map((point, index) => {
          const [cx, cy] = point.split(',');
          return <circle key={`${point}-${index}`} cx={cx} cy={cy} r="3" fill={palette.dot} />;
        })}
      </svg>
      <table
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
          border: 0,
          padding: 0,
          margin: -1,
        }}
      >
        <caption>Collateral requirements by month</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Collateral</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.month}>
              <td>{point.month}</td>
              <td>{point.collateral}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export default CurveVisualizer;
