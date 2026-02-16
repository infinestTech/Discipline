import { useMemo } from 'react';
import { 
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  FlagIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import type { HabitWithWeekLog } from '../../types';
import { getDayIndex, isCurrentWeek as checkIsCurrentWeek } from '../../utils/dateUtils';
import { calculateWeeklyProgress } from '../../utils/progressEngine';
import { 
  generateInsights, 
  getTagStyles, 
  type Insight, 
  type InsightTag 
} from '../../utils/insightsEngine';

interface InsightsPanelProps {
  habitsWithLogs: HabitWithWeekLog[];
  currentWeekId: string;
  compact?: boolean;
}

const TagIcon = ({ tag }: { tag: InsightTag }) => {
  const iconClass = "w-3.5 h-3.5";
  switch (tag) {
    case 'RISK':
      return <ExclamationTriangleIcon className={iconClass} />;
    case 'ALPHA':
      return <ArrowTrendingUpIcon className={iconClass} />;
    case 'DISCIPLINE':
      return <FlagIcon className={iconClass} />;
    case 'RECOVERY':
      return <ArrowPathIcon className={iconClass} />;
  }
};

const InsightCard = ({ insight, compact }: { insight: Insight; compact?: boolean }) => {
  const styles = getTagStyles(insight.tag);
  
  return (
    <div 
      className={`group border-l-2 pl-3 py-2 transition-all duration-200 hover:bg-trader-bg/50 ${
        insight.priority >= 4 ? 'animate-pulse-glow' : ''
      }`}
      style={{
        borderLeftColor: 
          insight.tag === 'RISK' ? '#ff4757' :
          insight.tag === 'ALPHA' ? '#00ff88' :
          insight.tag === 'DISCIPLINE' ? '#ffcc00' :
          '#00ffff'
      }}
    >
      {/* Tag Badge */}
      <div className="flex items-center gap-2 mb-1">
        <span 
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${styles.bg} ${styles.text} ${styles.border}`}
        >
          <TagIcon tag={insight.tag} />
          {insight.tag}
        </span>
        {insight.priority >= 4 && (
          <span className="text-[9px] text-neon-red font-bold">HIGH PRIORITY</span>
        )}
      </div>
      
      {/* Title */}
      {!compact && (
        <h4 className="text-xs font-semibold text-trader-text mb-0.5">
          {insight.title}
        </h4>
      )}
      
      {/* Message */}
      <p className={`text-trader-muted leading-tight ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
        {insight.message}
      </p>
    </div>
  );
};

const InsightsPanel = ({ habitsWithLogs, currentWeekId, compact = false }: InsightsPanelProps) => {
  const isCurrentWeek = checkIsCurrentWeek(currentWeekId);
  const todayIndex = getDayIndex();

  // Calculate progress and generate insights
  const insights = useMemo(() => {
    if (habitsWithLogs.length === 0) return [];
    
    const progress = calculateWeeklyProgress(habitsWithLogs, todayIndex, isCurrentWeek);
    return generateInsights(
      habitsWithLogs,
      progress.habitProgress,
      progress.dailyProgress,
      todayIndex,
      isCurrentWeek
    );
  }, [habitsWithLogs, todayIndex, isCurrentWeek]);

  // Group insights by tag for summary
  const summary = useMemo(() => {
    const counts: Record<InsightTag, number> = {
      RISK: 0,
      ALPHA: 0,
      DISCIPLINE: 0,
      RECOVERY: 0,
    };
    insights.forEach((i) => counts[i.tag]++);
    return counts;
  }, [insights]);

  if (habitsWithLogs.length === 0) {
    return (
      <aside className="w-full xl:w-80 bg-trader-card border-l border-trader-border p-4 overflow-y-auto scrollbar-trader">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-trader-border">
          <span className="text-[9px] font-bold text-neon-red px-1.5 py-0.5 bg-neon-red/10 rounded">LIVE</span>
          <h3 className="text-xs font-bold text-trader-text font-mono">MARKET FEED</h3>
        </div>
        <p className="text-[10px] text-trader-muted text-center py-8 font-mono">
          NO SIGNALS<br />Add positions to receive alerts
        </p>
      </aside>
    );
  }

  return (
    <aside className="w-full xl:w-80 bg-trader-card border-l border-trader-border p-4 flex flex-col overflow-hidden">
      {/* Market News Feed Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-trader-border">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-neon-red px-1.5 py-0.5 bg-neon-red/10 rounded animate-pulse">LIVE</span>
          <h3 className="text-xs font-bold text-trader-text font-mono">MARKET FEED</h3>
        </div>
        <span className="text-[9px] text-trader-muted font-mono">
          {insights.length} SIGNALS
        </span>
      </div>

      {/* Summary Pills */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {summary.RISK > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-neon-red/10 text-neon-red border border-neon-red/20">
            <ExclamationTriangleIcon className="w-3 h-3" />
            {summary.RISK} Risk
          </span>
        )}
        {summary.DISCIPLINE > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-neon-yellow/10 text-neon-yellow border border-neon-yellow/20">
            <FlagIcon className="w-3 h-3" />
            {summary.DISCIPLINE} Discipline
          </span>
        )}
        {summary.RECOVERY > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
            <ArrowPathIcon className="w-3 h-3" />
            {summary.RECOVERY} Recovery
          </span>
        )}
        {summary.ALPHA > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-neon-green/10 text-neon-green border border-neon-green/20">
            <ArrowTrendingUpIcon className="w-3 h-3" />
            {summary.ALPHA} Alpha
          </span>
        )}
      </div>

      {/* Insights List */}
      <div className="flex-1 overflow-y-auto scrollbar-trader -mr-2 pr-2">
        <div className="space-y-3">
          {insights.slice(0, compact ? 5 : 10).map((insight) => (
            <InsightCard 
              key={insight.id} 
              insight={insight} 
              compact={compact}
            />
          ))}
        </div>

        {insights.length > (compact ? 5 : 10) && (
          <p className="text-[10px] text-trader-muted text-center mt-4 py-2 border-t border-trader-border">
            +{insights.length - (compact ? 5 : 10)} more insights
          </p>
        )}
      </div>

      {/* Footer - Time stamp */}
      <div className="mt-3 pt-3 border-t border-trader-border">
        <p className="text-[9px] text-trader-muted text-center font-mono">
          Auto-refreshed • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </aside>
  );
};

export default InsightsPanel;
