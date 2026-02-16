import { useMemo } from 'react';
import type { DailyProgress } from '../../utils/progressEngine';

interface CandleChartProps {
  dailyProgress: DailyProgress[];
  todayIndex: number;
  isCurrentWeek: boolean;
}

interface CandleData {
  dayIndex: number;
  dayName: string;
  open: number;    // Previous day's closing %
  close: number;   // This day's %
  high: number;    // Max of open/close
  low: number;     // Min of open/close
  pct: number;     // Actual percentage
  isBullish: boolean; // Green candle
  isFuture: boolean;
  isToday: boolean;
}

const CandleChart = ({ dailyProgress, todayIndex, isCurrentWeek }: CandleChartProps) => {
  // Transform daily progress into candle data
  const candles: CandleData[] = useMemo(() => {
    return dailyProgress.map((day, index) => {
      const prevPct = index > 0 ? dailyProgress[index - 1].pct : 0;
      const currentPct = day.pct;
      const isFuture = isCurrentWeek && index > todayIndex;
      const isToday = isCurrentWeek && index === todayIndex;

      return {
        dayIndex: day.dayIndex,
        dayName: day.dayName,
        open: prevPct,
        close: currentPct,
        high: Math.max(prevPct, currentPct),
        low: Math.min(prevPct, currentPct),
        pct: currentPct,
        isBullish: currentPct >= prevPct,
        isFuture,
        isToday,
      };
    });
  }, [dailyProgress, todayIndex, isCurrentWeek]);

  // Chart dimensions
  const width = 100;
  const height = 120;
  const padding = { top: 15, right: 5, bottom: 25, left: 5 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const candleWidth = chartWidth / 7 - 2;
  const candleGap = 2;

  // Scale percentage (0-100) to chart Y coordinate
  const scaleY = (pct: number) => {
    const clampedPct = Math.max(0, Math.min(100, pct));
    return padding.top + chartHeight - (clampedPct / 100) * chartHeight;
  };

  // Get candle color based on percentage and direction
  const getCandleColor = (candle: CandleData) => {
    if (candle.isFuture) return { fill: '#1e2a3a', stroke: '#2d3e50' };
    if (candle.pct >= 80) return { fill: '#00ff88', stroke: '#00cc6a' };
    if (candle.pct >= 50) return { fill: '#ffcc00', stroke: '#cc9900' };
    if (candle.pct > 0) return { fill: '#ff4757', stroke: '#cc3a47' };
    return { fill: '#1e2a3a', stroke: '#2d3e50' };
  };

  // Grid lines at 25%, 50%, 75%, 100%
  const gridLines = [0, 25, 50, 75, 100];

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        style={{ maxHeight: '160px' }}
      >
        {/* Background */}
        <rect
          x={padding.left}
          y={padding.top}
          width={chartWidth}
          height={chartHeight}
          fill="#0b0f14"
          rx="2"
        />

        {/* Grid Lines */}
        {gridLines.map((pct) => (
          <g key={pct}>
            <line
              x1={padding.left}
              y1={scaleY(pct)}
              x2={padding.left + chartWidth}
              y2={scaleY(pct)}
              stroke="#1e2a3a"
              strokeWidth="0.5"
              strokeDasharray={pct === 50 ? "none" : "2,2"}
            />
            <text
              x={padding.left - 1}
              y={scaleY(pct)}
              fontSize="3"
              fill="#8892a0"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {pct}%
            </text>
          </g>
        ))}

        {/* Candles */}
        {candles.map((candle, index) => {
          const x = padding.left + index * (candleWidth + candleGap) + candleGap / 2;
          const colors = getCandleColor(candle);
          const bodyTop = scaleY(candle.high);
          const bodyBottom = scaleY(candle.low);
          const bodyHeight = Math.max(2, bodyBottom - bodyTop);
          const centerX = x + candleWidth / 2;

          return (
            <g key={candle.dayIndex} className="transition-all duration-300">
              {/* Wick (thin line showing open-close range) */}
              <line
                x1={centerX}
                y1={bodyTop}
                x2={centerX}
                y2={bodyBottom}
                stroke={colors.stroke}
                strokeWidth="0.8"
                opacity={candle.isFuture ? 0.3 : 1}
              />

              {/* Candle Body */}
              <rect
                x={x}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                fill={colors.fill}
                stroke={colors.stroke}
                strokeWidth="0.5"
                rx="1"
                opacity={candle.isFuture ? 0.3 : 0.9}
                className={candle.isToday ? 'animate-pulse' : ''}
              >
                {/* Glow effect for today */}
                {candle.isToday && (
                  <animate
                    attributeName="opacity"
                    values="0.9;1;0.9"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                )}
              </rect>

              {/* Today indicator */}
              {candle.isToday && (
                <circle
                  cx={centerX}
                  cy={padding.top + chartHeight + 8}
                  r="1.5"
                  fill="#00ffff"
                  className="animate-pulse"
                />
              )}

              {/* Day label */}
              <text
                x={centerX}
                y={padding.top + chartHeight + 12}
                fontSize="4"
                fill={candle.isToday ? '#00ffff' : candle.isFuture ? '#4a5568' : '#8892a0'}
                textAnchor="middle"
                fontWeight={candle.isToday ? 'bold' : 'normal'}
              >
                {candle.dayName}
              </text>

              {/* Percentage label on hover area */}
              {!candle.isFuture && candle.pct > 0 && (
                <text
                  x={centerX}
                  y={bodyTop - 2}
                  fontSize="3"
                  fill={colors.fill}
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {candle.pct}%
                </text>
              )}
            </g>
          );
        })}

        {/* Target line at 100% */}
        <line
          x1={padding.left}
          y1={scaleY(100)}
          x2={padding.left + chartWidth}
          y2={scaleY(100)}
          stroke="#00ff88"
          strokeWidth="0.5"
          strokeDasharray="3,1"
          opacity="0.5"
        />
      </svg>
    </div>
  );
};

export default CandleChart;
