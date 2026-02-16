import type { DailyLog, WeekLog } from '../types';

// Days of the week (Monday first, as per ISO standard)
export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

// Full day names
export const DAYS_FULL = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

// Month names
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/**
 * Get ISO week number from a date
 * ISO weeks start on Monday and the first week contains Jan 4th
 */
export function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // Make Sunday = 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // Set to nearest Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

/**
 * Get the ISO week year (may differ from calendar year at year boundaries)
 */
export function getISOWeekYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

/**
 * Get current ISO week ID in format "YYYY-Www" (e.g., "2026-W07")
 */
export function getCurrentWeekId(date: Date = new Date()): string {
  const year = getISOWeekYear(date);
  const week = getISOWeekNumber(date);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

/**
 * Parse a week ID back to year and week number
 */
export function parseWeekId(weekId: string): { year: number; week: number } {
  const match = weekId.match(/^(\d{4})-W(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid week ID format: ${weekId}`);
  }
  return {
    year: parseInt(match[1], 10),
    week: parseInt(match[2], 10),
  };
}

/**
 * Get a week label like "Week 07 — Feb 2026"
 */
export function getWeekLabel(weekId: string): string {
  const { year, week } = parseWeekId(weekId);
  const firstDayOfWeek = getFirstDayOfWeek(year, week);
  const month = MONTHS[firstDayOfWeek.getMonth()];
  return `Week ${week.toString().padStart(2, '0')} — ${month} ${year}`;
}

/**
 * Get the first day (Monday) of a given ISO week
 */
export function getFirstDayOfWeek(year: number, week: number): Date {
  // January 4th is always in week 1
  const jan4 = new Date(year, 0, 4);
  const jan4DayOfWeek = jan4.getDay() || 7; // Make Sunday = 7
  
  // Get to Monday of week 1
  const mondayOfWeek1 = new Date(jan4);
  mondayOfWeek1.setDate(jan4.getDate() - (jan4DayOfWeek - 1));
  
  // Add weeks
  const result = new Date(mondayOfWeek1);
  result.setDate(mondayOfWeek1.getDate() + (week - 1) * 7);
  
  return result;
}

/**
 * Get all dates in a week as an array of Date objects
 */
export function getWeekDates(weekId: string): Date[] {
  const { year, week } = parseWeekId(weekId);
  const monday = getFirstDayOfWeek(year, week);
  
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }
  
  return dates;
}

/**
 * Get week dates as formatted strings (e.g., ["16", "17", ...])
 */
export function getWeekDateNumbers(weekId: string): string[] {
  return getWeekDates(weekId).map(d => d.getDate().toString());
}

/**
 * Get week date range label (e.g., "Feb 16 - Feb 22, 2026")
 */
export function getWeekRangeLabel(weekId: string): string {
  const dates = getWeekDates(weekId);
  const firstDay = dates[0];
  const lastDay = dates[6];
  
  const firstMonth = MONTHS[firstDay.getMonth()];
  const lastMonth = MONTHS[lastDay.getMonth()];
  const year = lastDay.getFullYear();
  
  if (firstMonth === lastMonth) {
    return `${firstMonth} ${firstDay.getDate()} - ${lastDay.getDate()}, ${year}`;
  }
  
  return `${firstMonth} ${firstDay.getDate()} - ${lastMonth} ${lastDay.getDate()}, ${year}`;
}

/**
 * List days of the week (Mon-Sun)
 */
export function listDays(): readonly string[] {
  return DAYS_OF_WEEK;
}

/**
 * Create a default empty WeekLog for a habit
 */
export function createEmptyWeekLog(habitId: string, weekId?: string): WeekLog {
  const id = weekId || getCurrentWeekId();
  
  const daily: DailyLog[] = [];
  for (let i = 0; i < 7; i++) {
    daily.push({
      dayIndex: i,
      checked: false,
      actualHours: 0,
    });
  }
  
  return {
    weekId: id,
    habitId,
    daily,
    updatedAt: Date.now(),
  };
}

/**
 * Get the day index (0-6, Mon-Sun) for a given date
 */
export function getDayIndex(date: Date = new Date()): number {
  const day = date.getDay();
  // Convert Sunday (0) to 6, and shift others down by 1
  return day === 0 ? 6 : day - 1;
}

/**
 * Get previous week ID
 */
export function getPreviousWeekId(weekId: string): string {
  const { year, week } = parseWeekId(weekId);
  
  if (week === 1) {
    // Get the last week of the previous year
    const lastDayOfPrevYear = new Date(year - 1, 11, 31);
    const lastWeek = getISOWeekNumber(lastDayOfPrevYear);
    const lastWeekYear = getISOWeekYear(lastDayOfPrevYear);
    return `${lastWeekYear}-W${lastWeek.toString().padStart(2, '0')}`;
  }
  
  return `${year}-W${(week - 1).toString().padStart(2, '0')}`;
}

/**
 * Get next week ID
 */
export function getNextWeekId(weekId: string): string {
  const { year, week } = parseWeekId(weekId);
  
  // Check if this is the last week of the year
  const lastDayOfYear = new Date(year, 11, 31);
  const lastWeek = getISOWeekNumber(lastDayOfYear);
  
  if (week >= lastWeek) {
    return `${year + 1}-W01`;
  }
  
  return `${year}-W${(week + 1).toString().padStart(2, '0')}`;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a day index is today within a given week
 */
export function isTodayInWeek(weekId: string, dayIndex: number): boolean {
  const weekDates = getWeekDates(weekId);
  return isToday(weekDates[dayIndex]);
}

/**
 * Format hours for display (e.g., 1.5 -> "1h 30m", 0.5 -> "30m")
 */
export function formatHours(hours: number): string {
  if (hours === 0) return '0m';
  
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Get a list of week IDs for navigation (last N weeks + current + next M weeks)
 */
export function getWeekIdList(pastWeeks: number = 12, futureWeeks: number = 4): string[] {
  const today = new Date();
  const currentWeek = getCurrentWeekId(today);
  const weeks: string[] = [];
  
  // Get past weeks
  let weekId = currentWeek;
  const pastList: string[] = [];
  for (let i = 0; i < pastWeeks; i++) {
    weekId = getPreviousWeekId(weekId);
    pastList.unshift(weekId);
  }
  weeks.push(...pastList);
  
  // Add current week
  weeks.push(currentWeek);
  
  // Get future weeks
  weekId = currentWeek;
  for (let i = 0; i < futureWeeks; i++) {
    weekId = getNextWeekId(weekId);
    weeks.push(weekId);
  }
  
  return weeks;
}

/**
 * Get a short week label for dropdown (e.g., "W07 2026")
 */
export function getShortWeekLabel(weekId: string): string {
  const { year, week } = parseWeekId(weekId);
  return `W${week.toString().padStart(2, '0')} ${year}`;
}

/**
 * Check if a week ID is the current week
 */
export function isCurrentWeek(weekId: string): boolean {
  return weekId === getCurrentWeekId();
}

/**
 * Get week header label (e.g., "W07 2026 | Market Discipline Log")
 */
export function getWeekHeaderLabel(weekId: string): string {
  const { year, week } = parseWeekId(weekId);
  return `W${week.toString().padStart(2, '0')} ${year} | Market Discipline Log`;
}
