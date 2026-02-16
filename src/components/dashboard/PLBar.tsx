import { formatPLDelta } from '../../utils/progressEngine';

interface PLBarProps {
  delta: number;
  deltaPct: number;
  isAhead: boolean;
  hoursCompleted: number;
  hoursTarget: number;
}

const PLBar = ({ delta, deltaPct, isAhead, hoursCompleted, hoursTarget }: PLBarProps) => {
  // Calculate bar width (capped at 100%)
  const progressPct = hoursTarget > 0 
    ? Math.min(100, (hoursCompleted / hoursTarget) * 100) 
    : 0;

  // P/L indicator position (50% = on target, <50% = behind, >50% = ahead)
  // Map -100% to 100% delta to 0-100 bar position
  const indicatorPosition = Math.max(5, Math.min(95, 50 + (deltaPct / 2)));

  return (
    <div className="trader-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-neon-cyan px-1.5 py-0.5 bg-neon-cyan/10 rounded font-mono">P/L</span>
          <h3 className="text-xs font-bold text-trader-text font-mono">WEEKLY EXECUTION</h3>
        </div>
        <div className={`flex items-center gap-2 text-sm font-bold font-mono ${
          isAhead ? 'text-neon-green' : 'text-neon-red'
        }`}>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
            isAhead ? 'bg-neon-green/20' : 'bg-neon-red/20'
          }`}>
            {isAhead ? '▲ PROFIT' : '▼ LOSS'}
          </span>
          <span>{formatPLDelta(delta)}</span>
        </div>
      </div>

      {/* Main Progress Bar */}
      <div className="relative h-8 bg-trader-bg rounded-lg overflow-hidden border border-trader-border mb-3">
        {/* Target Line at current expected position */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-trader-muted/50 z-10"
          style={{ left: `${indicatorPosition}%` }}
        />
        
        {/* Progress Fill */}
        <div
          className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ${
            isAhead 
              ? 'bg-gradient-to-r from-neon-green/30 to-neon-green/50' 
              : 'bg-gradient-to-r from-neon-red/30 to-neon-red/50'
          }`}
          style={{ width: `${progressPct}%` }}
        />

        {/* Center Labels */}
        <div className="absolute inset-0 flex items-center justify-between px-4">
          <span className="text-xs text-trader-muted font-mono">0h</span>
          <span className={`text-sm font-bold font-mono ${
            isAhead ? 'text-neon-green' : 'text-neon-red'
          }`}>
            {hoursCompleted.toFixed(1)}h / {hoursTarget.toFixed(1)}h
          </span>
          <span className="text-xs text-trader-muted font-mono">{hoursTarget.toFixed(0)}h</span>
        </div>
      </div>

      {/* P/L Scale Bar */}
      <div className="relative h-6 bg-trader-bg rounded overflow-hidden">
        {/* Gradient Background: Red -> Yellow -> Green */}
        <div className="absolute inset-0 flex">
          <div className="flex-1 bg-gradient-to-r from-neon-red/40 to-neon-red/20" />
          <div className="flex-1 bg-gradient-to-r from-neon-red/20 via-neon-yellow/20 to-neon-green/20" />
          <div className="flex-1 bg-gradient-to-r from-neon-green/20 to-neon-green/40" />
        </div>

        {/* Center Line (Target) */}
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-trader-text/30" />

        {/* Current Position Indicator */}
        <div
          className={`absolute top-1 bottom-1 w-1 rounded-full transition-all duration-500 ${
            isAhead ? 'bg-neon-green shadow-neon-green' : 'bg-neon-red shadow-neon-red'
          }`}
          style={{ 
            left: `calc(${indicatorPosition}% - 2px)`,
            boxShadow: isAhead 
              ? '0 0 8px rgba(0, 255, 136, 0.6)' 
              : '0 0 8px rgba(255, 71, 87, 0.6)'
          }}
        />

        {/* Labels */}
        <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-mono">
          <span className="text-neon-red">-100%</span>
          <span className="text-trader-muted">TARGET</span>
          <span className="text-neon-green">+100%</span>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between mt-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-trader-muted">vs Expected:</span>
          <span className={`font-bold font-mono ${isAhead ? 'text-neon-green' : 'text-neon-red'}`}>
            {deltaPct >= 0 ? '+' : ''}{deltaPct}%
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-neon-green" />
            <span className="text-trader-muted">Ahead</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-neon-red" />
            <span className="text-trader-muted">Behind</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PLBar;
