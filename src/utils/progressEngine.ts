/**
 * Progress Engine — Trading-style performance calculations
 */

import type { HabitWithWeekLog } from '../types';

export interface HabitProgress {
  habitId: string;
  habitName: string;
  weeklyTarget: number;      // targetHoursPerDay * 7
  weeklyActual: number;      // sum of actualHours for 7 days
  weeklyPct: number;         // min(100, weeklyActual/weeklyTarget*100)
  todayTarget: number;       // targetHoursPerDay
  todayActual: number;       // actualHours for today
  todayPct: number;          // min(100, todayActual/todayTarget*100)
}

export interface DailyProgress {
  dayIndex: number;
  dayName: string;
  target: number;            // sum of all habits targetHoursPerDay
  actual: number;            // sum of all habits actualHours for that day
  pct: number;               // min(100, actual/target*100)
}

export interface WeeklyOverview {
  totalTargetWeek: number;   // sum of all habits weeklyTarget
  totalActualWeek: number;   // sum of all habits weeklyActual
  overallWeeklyPct: number;  // min(100, totalActualWeek/totalTargetWeek*100)
  todayTarget: number;       // sum of all habits targetHoursPerDay
  todayActual: number;       // sum of all habits actualHours for today
  todayPct: number;          // today's completion percentage
  hoursCompleted: number;    // total actual hours this week
  hoursRemaining: number;    // remaining hours to hit target
  plDelta: number;           // hours ahead (+) or behind (-)
  plDeltaPct: number;        // percentage ahead/behind expected pace
  isAhead: boolean;          // true if ahead of expected pace
  habitProgress: HabitProgress[];
  dailyProgress: DailyProgress[];
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Calculate comprehensive progress metrics for all habits
 */
export function calculateWeeklyProgress(
  habitsWithLogs: HabitWithWeekLog[],
  todayIndex: number,
  isCurrentWeek: boolean
): WeeklyOverview {
  const habitProgress: HabitProgress[] = [];
  const dailyProgress: DailyProgress[] = [];
  
  // Initialize daily totals
  const dailyTotals = Array(7).fill(null).map((_, i) => ({
    dayIndex: i,
    dayName: DAY_NAMES[i],
    target: 0,
    actual: 0,
  }));

  let totalTargetWeek = 0;
  let totalActualWeek = 0;
  let todayTarget = 0;
  let todayActual = 0;

  // Calculate per-habit progress
  habitsWithLogs.forEach(({ habit, weekLog }) => {
    const weeklyTarget = habit.targetHoursPerDay * 7;
    const weeklyActual = weekLog.daily.reduce((sum, day) => sum + day.actualHours, 0);
    const weeklyPct = weeklyTarget > 0 
      ? Math.min(100, Math.round((weeklyActual / weeklyTarget) * 100)) 
      : 0;

    const habitTodayActual = weekLog.daily[todayIndex]?.actualHours || 0;
    const habitTodayPct = habit.targetHoursPerDay > 0
      ? Math.min(100, Math.round((habitTodayActual / habit.targetHoursPerDay) * 100))
      : 0;

    habitProgress.push({
      habitId: habit.id,
      habitName: habit.name,
      weeklyTarget,
      weeklyActual,
      weeklyPct,
      todayTarget: habit.targetHoursPerDay,
      todayActual: habitTodayActual,
      todayPct: habitTodayPct,
    });

    // Accumulate daily totals
    weekLog.daily.forEach((day, i) => {
      dailyTotals[i].target += habit.targetHoursPerDay;
      dailyTotals[i].actual += day.actualHours;
    });

    // Accumulate weekly totals
    totalTargetWeek += weeklyTarget;
    totalActualWeek += weeklyActual;
    todayTarget += habit.targetHoursPerDay;
    todayActual += habitTodayActual;
  });

  // Calculate daily percentages
  dailyTotals.forEach((day) => {
    dailyProgress.push({
      ...day,
      pct: day.target > 0 
        ? Math.min(100, Math.round((day.actual / day.target) * 100)) 
        : 0,
    });
  });

  // Calculate overall metrics
  const overallWeeklyPct = totalTargetWeek > 0
    ? Math.min(100, Math.round((totalActualWeek / totalTargetWeek) * 100))
    : 0;

  const todayPct = todayTarget > 0
    ? Math.min(100, Math.round((todayActual / todayTarget) * 100))
    : 0;

  const hoursCompleted = totalActualWeek;
  const hoursRemaining = Math.max(0, totalTargetWeek - totalActualWeek);

  // Calculate P/L delta (how far ahead or behind expected pace)
  // Expected pace = totalTargetWeek * (daysElapsed / 7)
  const daysElapsed = isCurrentWeek ? todayIndex + 1 : 7;
  const expectedHours = (totalTargetWeek / 7) * daysElapsed;
  
  // Actual hours completed up to current day
  const actualHoursToDate = isCurrentWeek
    ? dailyProgress.slice(0, todayIndex + 1).reduce((sum, d) => sum + d.actual, 0)
    : totalActualWeek;

  const plDelta = actualHoursToDate - expectedHours;
  const plDeltaPct = expectedHours > 0
    ? Math.round((plDelta / expectedHours) * 100)
    : 0;
  const isAhead = plDelta >= 0;

  return {
    totalTargetWeek,
    totalActualWeek,
    overallWeeklyPct,
    todayTarget,
    todayActual,
    todayPct,
    hoursCompleted,
    hoursRemaining,
    plDelta,
    plDeltaPct,
    isAhead,
    habitProgress,
    dailyProgress,
  };
}

/**
 * Format hours for display (e.g., 10.5 -> "10.5h")
 */
export function formatHoursShort(hours: number): string {
  return `${hours.toFixed(1)}h`;
}

/**
 * Format P/L delta for display (e.g., +2.5h or -1.0h)
 */
export function formatPLDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}h`;
}

/**
 * Get grade based on percentage
 */
export function getGrade(pct: number): string {
  if (pct >= 95) return 'A+';
  if (pct >= 90) return 'A';
  if (pct >= 85) return 'A-';
  if (pct >= 80) return 'B+';
  if (pct >= 75) return 'B';
  if (pct >= 70) return 'B-';
  if (pct >= 65) return 'C+';
  if (pct >= 60) return 'C';
  if (pct >= 55) return 'C-';
  if (pct >= 50) return 'D';
  return 'F';
}
