import { useState, useEffect, useRef } from "react";

interface Blip {
  id: number;
  angle: number;
  radius: number;
  size: number;
}

interface RadarProps {
  isActive?: boolean;
  size?: number;
  speed?: number;
  blips?: Blip[];
  className?: string;
}

interface SweepConeProps {
  cx: number;
  cy: number;
  maxR: number;
  sweep: number;
  isActive: boolean;
}

interface PowerIconProps {
  cx: number;
  cy: number;
  r: number;
  isActive: boolean;
}

function polarToXY(
  angleDeg: number,
  radiusFraction: number,
  cx: number,
  cy: number,
  maxR: number,
) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + Math.cos(rad) * radiusFraction * maxR,
    y: cy + Math.sin(rad) * radiusFraction * maxR,
  };
}

export default function Radar({
  isActive = true,
  size = 300,
  speed = 60,
  blips = [
    { id: 1, angle: 45, radius: 0.72, size: 10 },
    { id: 2, angle: 190, radius: 0.45, size: 7 },
    { id: 3, angle: 310, radius: 0.62, size: 6 },
  ],
  className = "",
}: RadarProps) {
  const [sweep, setSweep] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    lastRef.current = null;
    const tick = (ts: number) => {
      if (lastRef.current == null) lastRef.current = ts;
      const delta = ts - lastRef.current;
      lastRef.current = ts;
      setSweep((prev) => (prev + (speed * delta) / 1000) % 360);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [speed, isActive]);

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - size * 0.035;

  const isLit = (angle: number) => {
    if (!isActive) return false;
    const diff = (((sweep - angle) % 360) + 360) % 360;
    return diff < 38;
  };

  const blipOpacity = (angle: number) => {
    if (!isActive) return 0.15;
    const diff = (((sweep - angle) % 360) + 360) % 360;
    if (diff >= 38) return 0.12;
    return 0.25 + 0.75 * (1 - diff / 38);
  };

  const sweepEnd = polarToXY(sweep, 1, cx, cy, maxR);

  return (
    <div
      className={`relative flex items-center justify-center transition-opacity duration-300 ${
        isActive ? "opacity-100" : "opacity-75"
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={`transition-all duration-300 ${
          isActive
            ? "drop-shadow-[0_0_24px_rgba(16,185,129,0.08)]"
            : "drop-shadow-none"
        }`}
      >
        <defs>
          <radialGradient id="sweepGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
          <clipPath id="radarClip">
            <circle cx={cx} cy={cy} r={maxR} />
          </clipPath>
        </defs>

        {/* Background Circle */}
        <circle
          cx={cx}
          cy={cy}
          r={maxR}
          fill={isActive ? "#f8fafc" : "#f1f5f9"}
          className="transition-colors duration-300"
        />

        {/* Concentric Grid Rings */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <circle
            key={f}
            cx={cx}
            cy={cy}
            r={f * maxR}
            fill="none"
            stroke={isActive ? "#cbd5e1" : "#e2e8f0"}
            strokeWidth={f === 1 ? 2 : 1}
            strokeDasharray={f === 1 ? undefined : "3 3"}
            opacity={0.7}
            className="transition-colors duration-300"
          />
        ))}

        {/* Crosshairs */}
        {[0, 45, 90, 135].map((a) => {
          const r = ((a - 90) * Math.PI) / 180;
          return (
            <line
              key={a}
              x1={cx + Math.cos(r) * maxR}
              y1={cy + Math.sin(r) * maxR}
              x2={cx - Math.cos(r) * maxR}
              y2={cy - Math.sin(r) * maxR}
              stroke={isActive ? "#e2e8f0" : "#f1f5f9"}
              strokeWidth={1}
              opacity={0.8}
              className="transition-colors duration-300"
            />
          );
        })}

        {/* Sweep Cone */}
        {isActive && (
          <g clipPath="url(#radarClip)">
            <SweepCone cx={cx} cy={cy} maxR={maxR} sweep={sweep} isActive={isActive} />
          </g>
        )}

        {/* Sweep Line */}
        {isActive && (
          <line
            x1={cx}
            y1={cy}
            x2={sweepEnd.x}
            y2={sweepEnd.y}
            stroke="#10b981"
            strokeWidth={2}
            opacity={0.85}
            strokeLinecap="round"
          />
        )}

        {/* Power / Status Indicator in center */}
        <PowerIcon cx={cx} cy={cy} r={maxR * 0.25} isActive={isActive} />

        {/* Blips / Threat Targets */}
        {blips.map((b) => {
          const pos = polarToXY(b.angle, b.radius, cx, cy, maxR);
          const lit = isLit(b.angle);
          const op = blipOpacity(b.angle);
          return (
            <g key={b.id} className="transition-all duration-300">
              {lit && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={b.size * 1.5}
                  fill="#ef4444"
                  opacity={op * 0.3}
                />
              )}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={b.size * 0.55}
                fill={isActive ? (lit ? "#ef4444" : "#fca5a5") : "#cbd5e1"}
                opacity={op}
                className="transition-colors duration-300"
              />
            </g>
          );
        })}

        {/* Outer Ring Border */}
        <circle
          cx={cx}
          cy={cy}
          r={maxR}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={2}
        />
      </svg>
    </div>
  );
}

function SweepCone({ cx, cy, maxR, sweep, isActive }: SweepConeProps) {
  if (!isActive) return null;
  const CONE_DEG = 60;
  const toXY = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [cx + Math.cos(rad) * maxR, cy + Math.sin(rad) * maxR];
  };
  const [sx, sy] = toXY(sweep - CONE_DEG);
  const [ex, ey] = toXY(sweep);
  const d = `M ${cx} ${cy} L ${sx} ${sy} A ${maxR} ${maxR} 0 ${CONE_DEG > 180 ? 1 : 0} 1 ${ex} ${ey} Z`;
  return <path d={d} fill="url(#sweepGrad)" style={{ filter: "blur(0.5px)" }} />;
}

function PowerIcon({ cx, cy, r, isActive }: PowerIconProps) {
  const strokeW = r * 0.14;
  const gap = 40;
  const arcR = r * 0.8;
  const toXY = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [cx + Math.cos(rad) * arcR, cy + Math.sin(rad) * arcR];
  };
  const [sx, sy] = toXY(gap / 2);
  const [ex, ey] = toXY(360 - gap / 2);
  const arcPath = `M ${sx} ${sy} A ${arcR} ${arcR} 0 1 1 ${ex} ${ey}`;
  return (
    <g
      opacity={isActive ? 0.95 : 0.4}
      className="transition-opacity duration-300"
    >
      <path
        d={arcPath}
        fill="none"
        stroke={isActive ? "#10b981" : "#64748b"}
        strokeWidth={strokeW}
        strokeLinecap="round"
        className="transition-colors duration-300"
      />
      <line
        x1={cx}
        y1={cy - r * 0.5}
        x2={cx}
        y2={cy - r * 1.0}
        stroke={isActive ? "#10b981" : "#64748b"}
        strokeWidth={strokeW}
        strokeLinecap="round"
        className="transition-colors duration-300"
      />
    </g>
  );
}
