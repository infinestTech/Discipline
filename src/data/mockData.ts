import type { Habit, WeekLog, HabitWithWeekLog, WeekStats } from '../types';
import { createEmptyWeekLog } from '../utils/dateUtils';

// Current week ID for February 16, 2026
const CURRENT_WEEK_ID = '2026-W08'; // Feb 16, 2026 is in Week 8

// Mock Habits
export const mockHabits: Habit[] = [
  {
    id: 'habit-001',
    name: 'Morning Meditation',
    targetHoursPerDay: 0.5, // 30 minutes
    createdAt: Date.parse('2026-01-01T00:00:00Z'),
    colorTag: 'purple',
  },
  {
    id: 'habit-002',
    name: 'Read 30 mins',
    targetHoursPerDay: 0.5, // 30 minutes
    createdAt: Date.parse('2026-01-01T00:00:00Z'),
    colorTag: 'cyan',
  },
  {
    id: 'habit-003',
    name: 'Exercise',
    targetHoursPerDay: 1.0, // 1 hour
    createdAt: Date.parse('2026-01-15T00:00:00Z'),
    colorTag: 'green',
  },
];

// Mock WeekLogs for current week (2026-W08)
// Note: Feb 16, 2026 is Sunday (dayIndex 6 in Mon-Sun format)
export const mockWeekLogs: WeekLog[] = [
  {
    weekId: CURRENT_WEEK_ID,
    habitId: 'habit-001',
    daily: [
      { dayIndex: 0, checked: true, actualHours: 0.5 },  // Mon
      { dayIndex: 1, checked: true, actualHours: 0.5 },  // Tue
      { dayIndex: 2, checked: true, actualHours: 0.75 }, // Wed
      { dayIndex: 3, checked: true, actualHours: 0.5 },  // Thu
      { dayIndex: 4, checked: true, actualHours: 0.5 },  // Fri
      { dayIndex: 5, checked: false, actualHours: 0 },   // Sat
      { dayIndex: 6, checked: false, actualHours: 0 },   // Sun (today - pending)
    ],
    updatedAt: Date.now(),
  },
  {
    weekId: CURRENT_WEEK_ID,
    habitId: 'habit-002',
    daily: [
      { dayIndex: 0, checked: true, actualHours: 0.5 },  // Mon
      { dayIndex: 1, checked: true, actualHours: 0.5 },  // Tue
      { dayIndex: 2, checked: false, actualHours: 0 },   // Wed
      { dayIndex: 3, checked: true, actualHours: 1.0 },  // Thu
      { dayIndex: 4, checked: true, actualHours: 0.5 },  // Fri
      { dayIndex: 5, checked: true, actualHours: 0.5 },  // Sat
      { dayIndex: 6, checked: false, actualHours: 0 },   // Sun (today - pending)
    ],
    updatedAt: Date.now(),
  },
  {
    weekId: CURRENT_WEEK_ID,
    habitId: 'habit-003',
    daily: [
      { dayIndex: 0, checked: true, actualHours: 1.0 },  // Mon
      { dayIndex: 1, checked: false, actualHours: 0 },   // Tue
      { dayIndex: 2, checked: true, actualHours: 1.5 },  // Wed
      { dayIndex: 3, checked: true, actualHours: 1.0 },  // Thu
      { dayIndex: 4, checked: false, actualHours: 0 },   // Fri
      { dayIndex: 5, checked: true, actualHours: 1.0 },  // Sat
      { dayIndex: 6, checked: false, actualHours: 0 },   // Sun (today - pending)
    ],
    updatedAt: Date.now(),
  },
];

// Previous week logs (2026-W07) for streak calculation
export const mockPreviousWeekLogs: WeekLog[] = [
  {
    weekId: '2026-W07',
    habitId: 'habit-001',
    daily: [
      { dayIndex: 0, checked: true, actualHours: 0.5 },
      { dayIndex: 1, checked: true, actualHours: 0.5 },
      { dayIndex: 2, checked: true, actualHours: 0.5 },
      { dayIndex: 3, checked: true, actualHours: 0.5 },
      { dayIndex: 4, checked: true, actualHours: 0.5 },
      { dayIndex: 5, checked: true, actualHours: 0.5 },
      { dayIndex: 6, checked: true, actualHours: 0.5 },
    ],
    updatedAt: Date.parse('2026-02-15T23:59:59Z'),
  },
  {
    weekId: '2026-W07',
    habitId: 'habit-002',
    daily: [
      { dayIndex: 0, checked: true, actualHours: 0.5 },
      { dayIndex: 1, checked: true, actualHours: 0.5 },
      { dayIndex: 2, checked: true, actualHours: 0.5 },
      { dayIndex: 3, checked: true, actualHours: 0.5 },
      { dayIndex: 4, checked: false, actualHours: 0 },
      { dayIndex: 5, checked: true, actualHours: 0.5 },
      { dayIndex: 6, checked: true, actualHours: 0.5 },
    ],
    updatedAt: Date.parse('2026-02-15T23:59:59Z'),
  },
  {
    weekId: '2026-W07',
    habitId: 'habit-003',
    daily: [
      { dayIndex: 0, checked: true, actualHours: 1.0 },
      { dayIndex: 1, checked: true, actualHours: 1.0 },
      { dayIndex: 2, checked: false, actualHours: 0 },
      { dayIndex: 3, checked: true, actualHours: 1.0 },
      { dayIndex: 4, checked: true, actualHours: 1.0 },
      { dayIndex: 5, checked: true, actualHours: 1.5 },
      { dayIndex: 6, checked: true, actualHours: 1.0 },
    ],
    updatedAt: Date.parse('2026-02-15T23:59:59Z'),
  },
];

// Combined data for easy UI access
export function getMockHabitsWithWeekLogs(weekId: string = CURRENT_WEEK_ID): HabitWithWeekLog[] {
  return mockHabits.map(habit => {
    const weekLogs = weekId === CURRENT_WEEK_ID ? mockWeekLogs : mockPreviousWeekLogs;
    const weekLog = weekLogs.find(log => log.habitId === habit.id && log.weekId === weekId);
    
    return {
      habit,
      weekLog: weekLog || createEmptyWeekLog(habit.id, weekId),
    };
  });
}

// Calculate mock statistics
export function getMockWeekStats(): WeekStats {
  const todayIndex = 6; // Sunday (Feb 16, 2026)
  
  let totalChecks = 0;
  let possibleChecks = 0;
  let completedToday = 0;
  
  mockWeekLogs.forEach(log => {
    log.daily.forEach((day, idx) => {
      if (idx < todayIndex) {
        possibleChecks++;
        if (day.checked) totalChecks++;
      } else if (idx === todayIndex) {
        if (day.checked) completedToday++;
      }
    });
  });
  
  return {
    totalHabits: mockHabits.length,
    completedToday,
    weeklyCompletion: possibleChecks > 0 ? Math.round((totalChecks / possibleChecks) * 100) : 0,
    currentStreak: 12, // Mock streak
    bestStreak: 21,
  };
}

// Get habit by ID
export function getHabitById(id: string): Habit | undefined {
  return mockHabits.find(h => h.id === id);
}

// Get week log for a specific habit and week
export function getWeekLogForHabit(habitId: string, weekId: string): WeekLog | undefined {
  const logs = weekId === CURRENT_WEEK_ID ? mockWeekLogs : mockPreviousWeekLogs;
  return logs.find(log => log.habitId === habitId && log.weekId === weekId);
}

// Export current week ID
export { CURRENT_WEEK_ID };
