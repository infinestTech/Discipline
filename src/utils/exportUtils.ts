/**
 * Export Utilities — JSON, CSV, and shareable summary exports
 */

import type { HabitWithWeekLog } from '../types';
import type { WeeklyOverview } from './progressEngine';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface ExportData {
  weekId: string;
  exportedAt: string;
  summary: {
    totalHabits: number;
    weeklyCompletion: number;
    hoursCompleted: number;
    hoursTarget: number;
    grade: string;
  };
  habits: Array<{
    name: string;
    colorTag: string;
    targetPerDay: number;
    weeklyTarget: number;
    weeklyActual: number;
    weeklyPct: number;
    daily: Array<{
      day: string;
      checked: boolean;
      hours: number;
    }>;
  }>;
}

/**
 * Generate export data structure
 */
export function generateExportData(
  habitsWithLogs: HabitWithWeekLog[],
  weekId: string,
  progress: WeeklyOverview
): ExportData {
  const getGrade = (pct: number): string => {
    if (pct >= 95) return 'S';
    if (pct >= 85) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 30) return 'D';
    return 'F';
  };

  return {
    weekId,
    exportedAt: new Date().toISOString(),
    summary: {
      totalHabits: habitsWithLogs.length,
      weeklyCompletion: progress.overallWeeklyPct,
      hoursCompleted: Math.round(progress.hoursCompleted * 10) / 10,
      hoursTarget: Math.round(progress.totalTargetWeek * 10) / 10,
      grade: getGrade(progress.overallWeeklyPct),
    },
    habits: habitsWithLogs.map(({ habit, weekLog }) => {
      const weeklyActual = weekLog.daily.reduce((sum, d) => sum + d.actualHours, 0);
      const weeklyTarget = habit.targetHoursPerDay * 7;
      const weeklyPct = weeklyTarget > 0 
        ? Math.min(100, Math.round((weeklyActual / weeklyTarget) * 100))
        : 0;

      return {
        name: habit.name,
        colorTag: habit.colorTag,
        targetPerDay: habit.targetHoursPerDay,
        weeklyTarget,
        weeklyActual: Math.round(weeklyActual * 10) / 10,
        weeklyPct,
        daily: weekLog.daily.map((day, idx) => ({
          day: DAY_NAMES[idx],
          checked: day.checked,
          hours: day.actualHours,
        })),
      };
    }),
  };
}

/**
 * Export as JSON
 */
export function exportAsJSON(data: ExportData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `habit-tracker-${data.weekId}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert to CSV format
 */
function toCSV(data: ExportData): string {
  const lines: string[] = [];
  
  // Header info
  lines.push(`# Habit Tracker Export - ${data.weekId}`);
  lines.push(`# Exported: ${data.exportedAt}`);
  lines.push(`# Weekly Completion: ${data.summary.weeklyCompletion}%`);
  lines.push(`# Grade: ${data.summary.grade}`);
  lines.push('');
  
  // CSV header
  const headers = ['Habit', 'Color', 'Target/Day', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Total', '%'];
  lines.push(headers.join(','));
  
  // Data rows
  data.habits.forEach((habit) => {
    const row = [
      `"${habit.name}"`,
      habit.colorTag,
      habit.targetPerDay.toString(),
      ...habit.daily.map((d) => d.hours.toString()),
      habit.weeklyActual.toString(),
      `${habit.weeklyPct}%`,
    ];
    lines.push(row.join(','));
  });
  
  // Summary row
  lines.push('');
  lines.push(`# Summary: ${data.summary.hoursCompleted}h / ${data.summary.hoursTarget}h target`);
  
  return lines.join('\n');
}

/**
 * Export as CSV
 */
export function exportAsCSV(data: ExportData): void {
  const csv = toCSV(data);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `habit-tracker-${data.weekId}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate shareable text summary
 */
export function generateShareableSummary(data: ExportData): string {
  const lines: string[] = [
    `📊 Weekly Habit Report - ${data.weekId}`,
    '',
    `✅ Completion: ${data.summary.weeklyCompletion}% | Grade: ${data.summary.grade}`,
    `⏱️ Hours: ${data.summary.hoursCompleted}h / ${data.summary.hoursTarget}h`,
    '',
    '📈 Habits:',
  ];
  
  data.habits.forEach((habit) => {
    const emoji = habit.weeklyPct >= 80 ? '🟢' : habit.weeklyPct >= 50 ? '🟡' : '🔴';
    lines.push(`${emoji} ${habit.name}: ${habit.weeklyPct}%`);
  });
  
  lines.push('');
  lines.push('— Habit Tracker Dashboard');
  
  return lines.join('\n');
}

/**
 * Copy shareable summary to clipboard
 */
export async function copyShareableSummary(data: ExportData): Promise<boolean> {
  const text = generateShareableSummary(data);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }
}
