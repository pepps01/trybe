import Svg, { Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

type Variant = 'pink' | 'violet';

const PALETTE: Record<Variant, { from: string; to: string; dot: string; outline: string }> = {
  pink: { from: '#D98BCB', to: '#9A3A8E', dot: '#C65FB6', outline: '#3B1F4C' },
  violet: { from: '#7F6EE3', to: '#3E2F9E', dot: '#6A58D8', outline: '#231B4F' },
};

/** 4-point sparkle centred on (cx, cy). */
function sparkle(cx: number, cy: number, r: number) {
  const k = r * 0.28;
  return `M${cx} ${cy - r} Q${cx + k} ${cy - k} ${cx + r} ${cy} Q${cx + k} ${cy + k} ${cx} ${cy + r} Q${cx - k} ${cy + k} ${cx - r} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - r}Z`;
}

/** Today hero thumbnail: calendar on a gradient tile with sparkles (per the Today design). */
export function CalendarArt({ width = 70, variant = 'pink' }: { width?: number; variant?: Variant }) {
  const c = PALETTE[variant];
  const dots = [
    [36, 49],
    [50, 49],
    [64, 49],
    [36, 62],
    [50, 62],
  ];
  return (
    <Svg width={width} height={width * 1.24} viewBox="0 0 100 124">
      <Defs>
        <LinearGradient id={`tile-${variant}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={c.from} />
          <Stop offset="1" stopColor={c.to} />
        </LinearGradient>
      </Defs>
      <Rect width="100" height="124" rx="16" fill={`url(#tile-${variant})`} />
      <G transform="translate(0 12)">

      {/* soft drop shadow for depth */}
      <Rect x="25" y="29" width="56" height="52" rx="9" fill="#000" opacity="0.14" />

      <G>
        {/* calendar body */}
        <Rect x="21" y="25" width="56" height="52" rx="9" fill="#FFFFFF" stroke={c.outline} strokeWidth="4" />
        {/* header rule */}
        <Path d="M23 38 H75" stroke={c.outline} strokeWidth="3" />
        {/* binder rings */}
        <Path d="M36 18 V31 M62 18 V31" stroke={c.outline} strokeWidth="4.5" strokeLinecap="round" />
        {/* date dots */}
        {dots.map(([x, y]) => (
          <Rect key={`${x}-${y}`} x={x - 4} y={y - 4} width="8" height="8" rx="2.4" fill={c.dot} />
        ))}
      </G>

      {/* sparkles */}
      <Path d={sparkle(84, 20, 6.5)} fill="#F6C945" />
      <Path d={sparkle(13, 43, 3.6)} fill="#F6C945" />
      </G>
    </Svg>
  );
}
