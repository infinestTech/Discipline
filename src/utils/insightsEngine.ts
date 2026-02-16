/**
 * Insights Engine — Trader Coach automated suggestions
 */

import type { HabitWithWeekLog } from '../types';
import type { HabitProgress, DailyProgress } from './progressEngine';

export type InsightTag = 'RISK' | 'ALPHA' | 'DISCIPLINE' | 'RECOVERY';

export interface Insight {
  id: string;
  tag: InsightTag;
  title: string;
  message: string;
  priority: number; // 1-5, higher is more urgent
  habitId?: string;
  timestamp: number;
}

const DAY_NAMES_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_NAMES_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Generate all insights based on current data
 */
export function generateInsights(
  habitsWithLogs: HabitWithWeekLog[],
  habitProgress: HabitProgress[],
  dailyProgress: DailyProgress[],
  todayIndex: number,
  isCurrentWeek: boolean
): Insight[] {
  const insights: Insight[] = [];
  const now = Date.now();
  let idCounter = 0;

  const createInsight = (
    tag: InsightTag,
    title: string,
    message: string,
    priority: number,
    habitId?: string
  ): Insight => ({
    id: `insight-${++idCounter}`,
    tag,
    title,
    message,
    priority,
    habitId,
    timestamp: now,
  });

  // ═══════════════════════════════════════════════════════════════
  // PER-HABIT INSIGHTS
  // ═══════════════════════════════════════════════════════════════

  habitProgress.forEach((hp) => {
    const hwl = habitsWithLogs.find((h) => h.habit.id === hp.habitId);
    if (!hwl) return;

    const { habit, weekLog } = hwl;

    // 1. Discipline leak: habit < 60% weekly
    if (hp.weeklyPct < 60) {
      const missedDays: string[] = [];
      const maxDayToCheck = isCurrentWeek ? todayIndex : 6;
      
      weekLog.daily.forEach((day, idx) => {
        if (idx <= maxDayToCheck && day.actualHours < habit.targetHoursPerDay * 0.5) {
          missedDays.push(DAY_NAMES_SHORT[idx]);
        }
      });

      if (missedDays.length > 0) {
        insights.push(
          createInsight(
            'DISCIPLINE',
            `${habit.name} Underperforming`,
            `Discipline leak: ${habit.name} missed ${missedDays.length} day${missedDays.length > 1 ? 's' : ''} (${missedDays.join(', ')}).`,
            4,
            hp.habitId
          )
        );
      }
    }

    // 2. Under-executed: checked but low hours
    const checkedDays = weekLog.daily.filter((d, idx) => 
      d.checked && (isCurrentWeek ? idx <= todayIndex : true)
    );
    
    if (checkedDays.length >= 2) {
      const avgActual = checkedDays.reduce((sum, d) => sum + d.actualHours, 0) / checkedDays.length;
      const executionRatio = habit.targetHoursPerDay > 0 
        ? avgActual / habit.targetHoursPerDay 
        : 0;

      if (executionRatio < 0.7 && executionRatio > 0) {
        insights.push(
          createInsight(
            'RISK',
            `${habit.name} Under-Executed`,
            `Under-executed: avg ${avgActual.toFixed(1)}/${habit.targetHoursPerDay}h target. Marking complete without full execution.`,
            3,
            hp.habitId
          )
        );
      }
    }

    // 3. Recovery plan for habits below 80%
    if (isCurrentWeek && hp.weeklyPct < 80) {
      const daysRemaining = 6 - todayIndex; // Days left including today
      if (daysRemaining > 0) {
        const targetWeekly = hp.weeklyTarget * 0.8; // 80% target
        const remaining = Math.max(0, targetWeekly - hp.weeklyActual);
        const perDay = remaining / daysRemaining;

        if (remaining > 0) {
          insights.push(
            createInsight(
              'RECOVERY',
              `${habit.name} Recovery Plan`,
              `To reach 80% by Sunday, you need ${remaining.toFixed(1)}h (~${perDay.toFixed(1)}h/day for ${daysRemaining} remaining days).`,
              2,
              hp.habitId
            )
          );
        }
      }
    }

    // 4. Alpha: habit exceeding targets
    if (hp.weeklyPct >= 100) {
      insights.push(
        createInsight(
          'ALPHA',
          `${habit.name} Target Hit!`,
          `Strong execution: ${habit.name} at ${hp.weeklyPct}% of weekly target. Keep the momentum!`,
          1,
          hp.habitId
        )
      );
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // OVERALL INSIGHTS
  // ═══════════════════════════════════════════════════════════════

  if (habitProgress.length >= 2) {
    // 5. Best performing habit
    const sorted = [...habitProgress].sort((a, b) => b.weeklyPct - a.weeklyPct);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    if (best.weeklyPct > worst.weeklyPct) {
      insights.push(
        createInsight(
          'ALPHA',
          'Top Performer',
          `Best habit: "${best.habitName}" at ${best.weeklyPct}%. This is your strength — leverage it.`,
          1
        )
      );

      if (worst.weeklyPct < 50) {
        insights.push(
          createInsight(
            'RISK',
            'Weakest Position',
            `Worst habit: "${worst.habitName}" at ${worst.weeklyPct}%. Consider reducing scope or re-prioritizing.`,
            4
          )
        );
      }
    }
  }

  // 6. Most missed day
  const maxDayToAnalyze = isCurrentWeek ? todayIndex : 6;
  const analyzableDays = dailyProgress.slice(0, maxDayToAnalyze + 1);
  
  if (analyzableDays.length >= 2) {
    const worstDay = analyzableDays.reduce((worst, day) => 
      day.pct < worst.pct ? day : worst
    );

    if (worstDay.pct < 50) {
      insights.push(
        createInsight(
          'DISCIPLINE',
          'Weak Day Identified',
          `Most missed day: ${DAY_NAMES_FULL[worstDay.dayIndex]} at ${worstDay.pct}%. Schedule lighter or block focus time.`,
          3
        )
      );
    }
  }

  // 7. Streak alert - inconsistency detection
  const inconsistentDays: string[] = [];
  analyzableDays.forEach((day, idx) => {
    const prevDay = idx > 0 ? analyzableDays[idx - 1] : null;
    // If previous day was good (>70%) and this day crashed (<40%)
    if (prevDay && prevDay.pct >= 70 && day.pct < 40) {
      inconsistentDays.push(DAY_NAMES_SHORT[day.dayIndex]);
    }
  });

  if (inconsistentDays.length > 0) {
    insights.push(
      createInsight(
        'DISCIPLINE',
        'Streak Broken',
        `Consistency alert: You broke momentum on ${inconsistentDays.join(', ')}. Address root cause to prevent pattern.`,
        4
      )
    );
  }

  // 8. Monthly projection estimate
  const totalActual = dailyProgress.reduce((sum, d) => sum + d.actual, 0);
  const totalTarget = dailyProgress.reduce((sum, d) => sum + d.target, 0);
  const daysAnalyzed = maxDayToAnalyze + 1;

  if (daysAnalyzed >= 3 && totalTarget > 0) {
    const avgDailyPct = (totalActual / totalTarget) * 100;
    const projectedMonthlyPct = Math.min(100, Math.round(avgDailyPct));

    if (projectedMonthlyPct < 70) {
      insights.push(
        createInsight(
          'RISK',
          'Monthly Projection',
          `If you repeat this pattern, monthly consistency will be ~${projectedMonthlyPct}%. Course correct now.`,
          5
        )
      );
    } else if (projectedMonthlyPct >= 90) {
      insights.push(
        createInsight(
          'ALPHA',
          'Strong Trajectory',
          `Projected monthly consistency: ~${projectedMonthlyPct}%. Elite-level discipline — maintain this edge.`,
          1
        )
      );
    }
  }

  // 9. Perfect day celebration
  const perfectDays = analyzableDays.filter((d) => d.pct >= 100);
  if (perfectDays.length >= 3) {
    insights.push(
      createInsight(
        'ALPHA',
        'Winning Streak',
        `${perfectDays.length} perfect days this week! You're operating at peak performance.`,
        1
      )
    );
  }

  // 10. Today-specific insight
  if (isCurrentWeek) {
    const todayData = dailyProgress[todayIndex];
    if (todayData) {
      if (todayData.pct === 0 && todayData.target > 0) {
        insights.push(
          createInsight(
            'DISCIPLINE',
            'Day Not Started',
            `Today's target: ${todayData.target.toFixed(1)}h. Market is open — start executing!`,
            5
          )
        );
      } else if (todayData.pct >= 50 && todayData.pct < 100) {
        const remaining = todayData.target - todayData.actual;
        insights.push(
          createInsight(
            'RECOVERY',
            'Close the Day Strong',
            `${remaining.toFixed(1)}h remaining today. You're ${todayData.pct}% done — push to 100%.`,
            3
          )
        );
      } else if (todayData.pct >= 100) {
        insights.push(
          createInsight(
            'ALPHA',
            'Today Complete!',
            `Daily target achieved! ${todayData.actual.toFixed(1)}/${todayData.target.toFixed(1)}h executed. Book the profit.`,
            1
          )
        );
      }
    }
  }

  // Sort by priority (highest first)
  insights.sort((a, b) => b.priority - a.priority);

  return insights;
}

/**
 * Get CSS classes for insight tag badge
 */
export function getTagStyles(tag: InsightTag): { bg: string; text: string; border: string } {
  switch (tag) {
    case 'RISK':
      return { 
        bg: 'bg-neon-red/20', 
        text: 'text-neon-red', 
        border: 'border-neon-red/30' 
      };
    case 'ALPHA':
      return { 
        bg: 'bg-neon-green/20', 
        text: 'text-neon-green', 
        border: 'border-neon-green/30' 
      };
    case 'DISCIPLINE':
      return { 
        bg: 'bg-neon-yellow/20', 
        text: 'text-neon-yellow', 
        border: 'border-neon-yellow/30' 
      };
    case 'RECOVERY':
      return { 
        bg: 'bg-neon-cyan/20', 
        text: 'text-neon-cyan', 
        border: 'border-neon-cyan/30' 
      };
  }
}

/**
 * Get icon for insight tag
 */
export function getTagIcon(tag: InsightTag): string {
  switch (tag) {
    case 'RISK': return '⚠️';
    case 'ALPHA': return '📈';
    case 'DISCIPLINE': return '🎯';
    case 'RECOVERY': return '🔄';
  }
}
