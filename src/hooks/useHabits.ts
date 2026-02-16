import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  where,
  writeBatch,
  getDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Habit, WeekLog, HabitWithWeekLog } from '../types';
import { getCurrentWeekId, createEmptyWeekLog } from '../utils/dateUtils';

// localStorage key for persisting selected week
const SELECTED_WEEK_KEY = 'habit-tracker-selected-week';

interface UseHabitsReturn {
  habits: Habit[];
  weekLogs: WeekLog[];
  habitsWithLogs: HabitWithWeekLog[];
  loading: boolean;
  error: string | null;
  currentWeekId: string;
  setCurrentWeekId: (weekId: string) => void;
  createHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => Promise<void>;
  updateHabit: (habitId: string, updates: Partial<Omit<Habit, 'id' | 'createdAt'>>) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  toggleDay: (habitId: string, dayIndex: number) => Promise<void>;
  updateDayHours: (habitId: string, dayIndex: number, hours: number) => Promise<void>;
  ensureWeekLogsExist: () => Promise<void>;
}

// Helper to get initial week from localStorage or current week
function getInitialWeekId(): string {
  try {
    const stored = localStorage.getItem(SELECTED_WEEK_KEY);
    if (stored) {
      // Validate format
      if (/^\d{4}-W\d{2}$/.test(stored)) {
        return stored;
      }
    }
  } catch {
    // localStorage might not be available
  }
  return getCurrentWeekId();
}

export function useHabits(): UseHabitsReturn {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [weekLogs, setWeekLogs] = useState<WeekLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWeekId, setCurrentWeekIdState] = useState(() => getInitialWeekId());

  // Wrapper to persist week to localStorage
  const setCurrentWeekId = useCallback((weekId: string) => {
    setCurrentWeekIdState(weekId);
    try {
      localStorage.setItem(SELECTED_WEEK_KEY, weekId);
    } catch {
      // localStorage might not be available
    }
  }, []);

  // Subscribe to habits collection
  useEffect(() => {
    if (!user) {
      setHabits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const habitsRef = collection(db, 'users', user.uid, 'habits');
    const q = query(habitsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const habitsData: Habit[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Habit));
        setHabits(habitsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching habits:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Subscribe to week logs for current week
  useEffect(() => {
    if (!user) {
      setWeekLogs([]);
      return;
    }

    const weekLogsRef = collection(db, 'users', user.uid, 'weekLogs');
    const q = query(weekLogsRef, where('weekId', '==', currentWeekId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const logsData: WeekLog[] = snapshot.docs.map((doc) => doc.data() as WeekLog);
        setWeekLogs(logsData);
      },
      (err) => {
        console.error('Error fetching week logs:', err);
        setError(err.message);
      }
    );

    return () => unsubscribe();
  }, [user, currentWeekId]);

  // Combine habits with their week logs
  const habitsWithLogs: HabitWithWeekLog[] = habits.map((habit) => {
    const weekLog = weekLogs.find((log) => log.habitId === habit.id);
    return {
      habit,
      weekLog: weekLog || createEmptyWeekLog(habit.id, currentWeekId),
    };
  });

  // Create a new habit
  const createHabit = useCallback(
    async (habitData: Omit<Habit, 'id' | 'createdAt'>) => {
      if (!user) throw new Error('Not authenticated');

      const habitsRef = collection(db, 'users', user.uid, 'habits');
      const newHabitRef = doc(habitsRef);

      const newHabit: Habit = {
        ...habitData,
        id: newHabitRef.id,
        createdAt: Date.now(),
      };

      // Create habit and initial week log in a batch
      const batch = writeBatch(db);
      
      // Create the habit
      batch.set(newHabitRef, newHabit);

      // Create an empty week log for current week
      const weekLogRef = doc(
        db,
        'users',
        user.uid,
        'weekLogs',
        `${currentWeekId}_${newHabitRef.id}`
      );
      const emptyWeekLog = createEmptyWeekLog(newHabitRef.id, currentWeekId);
      batch.set(weekLogRef, emptyWeekLog);

      await batch.commit();
    },
    [user, currentWeekId]
  );

  // Update an existing habit
  const updateHabit = useCallback(
    async (habitId: string, updates: Partial<Omit<Habit, 'id' | 'createdAt'>>) => {
      if (!user) throw new Error('Not authenticated');

      const habitRef = doc(db, 'users', user.uid, 'habits', habitId);
      await updateDoc(habitRef, updates);
    },
    [user]
  );

  // Delete a habit and its week logs
  const deleteHabit = useCallback(
    async (habitId: string) => {
      if (!user) throw new Error('Not authenticated');

      const batch = writeBatch(db);

      // Delete the habit
      const habitRef = doc(db, 'users', user.uid, 'habits', habitId);
      batch.delete(habitRef);

      // Delete all week logs for this habit
      const weekLogsRef = collection(db, 'users', user.uid, 'weekLogs');
      const q = query(weekLogsRef, where('habitId', '==', habitId));
      const snapshot = await getDocs(q);

      snapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      await batch.commit();
    },
    [user]
  );

  // Toggle a day's completion status
  const toggleDay = useCallback(
    async (habitId: string, dayIndex: number) => {
      if (!user) throw new Error('Not authenticated');

      const habit = habits.find((h) => h.id === habitId);
      if (!habit) throw new Error('Habit not found');

      const weekLogId = `${currentWeekId}_${habitId}`;
      const weekLogRef = doc(db, 'users', user.uid, 'weekLogs', weekLogId);

      // Find existing week log or create new one
      const existingLog = weekLogs.find((log) => log.habitId === habitId);
      
      if (existingLog) {
        // Toggle existing day
        const newChecked = !existingLog.daily[dayIndex].checked;
        const updatedDaily = existingLog.daily.map((day, i) =>
          i === dayIndex
            ? {
                ...day,
                checked: newChecked,
                actualHours: newChecked ? habit.targetHoursPerDay : 0,
              }
            : day
        );

        await updateDoc(weekLogRef, {
          daily: updatedDaily,
          updatedAt: Date.now(),
        });
      } else {
        // Create new week log with this day checked
        const newWeekLog = createEmptyWeekLog(habitId, currentWeekId);
        newWeekLog.daily[dayIndex] = {
          dayIndex,
          checked: true,
          actualHours: habit.targetHoursPerDay,
        };
        newWeekLog.updatedAt = Date.now();

        await setDoc(weekLogRef, newWeekLog);
      }
    },
    [user, habits, weekLogs, currentWeekId]
  );

  // Update hours for a specific day
  const updateDayHours = useCallback(
    async (habitId: string, dayIndex: number, hours: number) => {
      if (!user) throw new Error('Not authenticated');

      const weekLogId = `${currentWeekId}_${habitId}`;
      const weekLogRef = doc(db, 'users', user.uid, 'weekLogs', weekLogId);

      const existingLog = weekLogs.find((log) => log.habitId === habitId);

      if (existingLog) {
        const updatedDaily = existingLog.daily.map((day, i) =>
          i === dayIndex
            ? {
                ...day,
                actualHours: hours,
                checked: hours > 0,
              }
            : day
        );

        await updateDoc(weekLogRef, {
          daily: updatedDaily,
          updatedAt: Date.now(),
        });
      } else {
        const newWeekLog = createEmptyWeekLog(habitId, currentWeekId);
        newWeekLog.daily[dayIndex] = {
          dayIndex,
          checked: hours > 0,
          actualHours: hours,
        };
        newWeekLog.updatedAt = Date.now();

        await setDoc(weekLogRef, newWeekLog);
      }
    },
    [user, weekLogs, currentWeekId]
  );

  // Ensure week logs exist for all habits (lazy creation)
  const ensureWeekLogsExist = useCallback(async () => {
    if (!user || habits.length === 0) return;

    const batch = writeBatch(db);
    let hasNewLogs = false;

    for (const habit of habits) {
      const weekLogId = `${currentWeekId}_${habit.id}`;
      const weekLogRef = doc(db, 'users', user.uid, 'weekLogs', weekLogId);
      
      // Check if log already exists
      const existingLog = weekLogs.find((log) => log.habitId === habit.id);
      if (!existingLog) {
        // Check Firestore as well (in case onSnapshot hasn't caught up)
        const docSnap = await getDoc(weekLogRef);
        if (!docSnap.exists()) {
          const emptyWeekLog = createEmptyWeekLog(habit.id, currentWeekId);
          batch.set(weekLogRef, emptyWeekLog);
          hasNewLogs = true;
        }
      }
    }

    if (hasNewLogs) {
      await batch.commit();
    }
  }, [user, habits, weekLogs, currentWeekId]);

  return {
    habits,
    weekLogs,
    habitsWithLogs,
    loading,
    error,
    currentWeekId,
    setCurrentWeekId,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleDay,
    updateDayHours,
    ensureWeekLogsExist,
  };
}

export default useHabits;
