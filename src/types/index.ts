// Color tags for trader UI theme
export type ColorTag = 'green' | 'cyan' | 'red' | 'yellow' | 'purple';

// Habit definition
export interface Habit {
  id: string;
  name: string;
  targetHoursPerDay: number; // decimal allowed (e.g., 0.5 for 30 mins)
  createdAt: number; // Unix timestamp
  colorTag: ColorTag;
}

// Daily log entry for a single day
export interface DailyLog {
  dayIndex: number; // 0-6 (Mon-Sun)
  checked: boolean;
  actualHours: number;
}

// Weekly log for a habit
export interface WeekLog {
  weekId: string; // ISO week format: "2026-W07"
  habitId: string;
  daily: DailyLog[]; // Array of 7 daily entries
  updatedAt: number; // Unix timestamp
}

// Combined view for UI rendering
export interface HabitWithWeekLog {
  habit: Habit;
  weekLog: WeekLog;
}

// Category for habit grouping (optional)
export type HabitCategory = 
  | 'Health' 
  | 'Learning' 
  | 'Productivity' 
  | 'Mindfulness' 
  | 'Finance' 
  | 'Social';

// Extended habit with category
export interface CategorizedHabit extends Habit {
  category?: HabitCategory;
}

// Statistics types
export interface WeekStats {
  totalHabits: number;
  completedToday: number;
  weeklyCompletion: number; // percentage
  currentStreak: number;
  bestStreak: number;
}

export interface HabitStats {
  habitId: string;
  currentStreak: number;
  totalCompletions: number;
  averageHoursPerDay: number;
  completionRate: number; // percentage
}
