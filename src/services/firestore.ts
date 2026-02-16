/**
 * Firestore Service for Habit Tracker
 * 
 * Collection Structure (Security-First Design):
 * 
 * /users/{uid}/habits/{habitId}
 *   - All habit definitions for a user
 *   - Only accessible by the authenticated user
 * 
 * /users/{uid}/weekLogs/{weekId}_{habitId}
 *   - Weekly tracking logs for each habit
 *   - Document ID format: "2026-W08_habit-001"
 *   - Only accessible by the authenticated user
 * 
 * Security Rules (add to Firestore rules):
 * 
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     // Users can only access their own data
 *     match /users/{userId}/{document=**} {
 *       allow read, write: if request.auth != null && request.auth.uid == userId;
 *     }
 *   }
 * }
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Habit, WeekLog, DailyLog } from '../types';

// Helper to get user's habits collection reference
const getUserHabitsRef = (uid: string) => collection(db, 'users', uid, 'habits');

// Helper to get user's weekLogs collection reference
const getUserWeekLogsRef = (uid: string) => collection(db, 'users', uid, 'weekLogs');

// Helper to create weekLog document ID
const getWeekLogDocId = (weekId: string, habitId: string) => `${weekId}_${habitId}`;

// ============ HABIT OPERATIONS ============

/**
 * Get all habits for a user
 */
export async function getHabits(uid: string): Promise<Habit[]> {
  const habitsRef = getUserHabitsRef(uid);
  const q = query(habitsRef, orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Habit));
}

/**
 * Get a single habit by ID
 */
export async function getHabit(uid: string, habitId: string): Promise<Habit | null> {
  const habitRef = doc(db, 'users', uid, 'habits', habitId);
  const snapshot = await getDoc(habitRef);
  
  if (!snapshot.exists()) return null;
  
  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Habit;
}

/**
 * Create a new habit
 */
export async function createHabit(uid: string, habit: Omit<Habit, 'id' | 'createdAt'>): Promise<Habit> {
  const habitsRef = getUserHabitsRef(uid);
  const newHabitRef = doc(habitsRef);
  
  const newHabit: Habit = {
    ...habit,
    id: newHabitRef.id,
    createdAt: Date.now(),
  };
  
  await setDoc(newHabitRef, newHabit);
  return newHabit;
}

/**
 * Update an existing habit
 */
export async function updateHabit(
  uid: string,
  habitId: string,
  updates: Partial<Omit<Habit, 'id' | 'createdAt'>>
): Promise<void> {
  const habitRef = doc(db, 'users', uid, 'habits', habitId);
  await updateDoc(habitRef, updates);
}

/**
 * Delete a habit and all its week logs
 */
export async function deleteHabit(uid: string, habitId: string): Promise<void> {
  const batch = writeBatch(db);
  
  // Delete the habit
  const habitRef = doc(db, 'users', uid, 'habits', habitId);
  batch.delete(habitRef);
  
  // Delete all associated week logs
  const weekLogsRef = getUserWeekLogsRef(uid);
  const q = query(weekLogsRef, where('habitId', '==', habitId));
  const snapshot = await getDocs(q);
  
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
}

// ============ WEEK LOG OPERATIONS ============

/**
 * Get all week logs for a specific week
 */
export async function getWeekLogs(uid: string, weekId: string): Promise<WeekLog[]> {
  const weekLogsRef = getUserWeekLogsRef(uid);
  const q = query(weekLogsRef, where('weekId', '==', weekId));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => doc.data() as WeekLog);
}

/**
 * Get a specific week log for a habit
 */
export async function getWeekLog(
  uid: string,
  weekId: string,
  habitId: string
): Promise<WeekLog | null> {
  const docId = getWeekLogDocId(weekId, habitId);
  const weekLogRef = doc(db, 'users', uid, 'weekLogs', docId);
  const snapshot = await getDoc(weekLogRef);
  
  if (!snapshot.exists()) return null;
  
  return snapshot.data() as WeekLog;
}

/**
 * Create or update a week log
 */
export async function saveWeekLog(uid: string, weekLog: WeekLog): Promise<void> {
  const docId = getWeekLogDocId(weekLog.weekId, weekLog.habitId);
  const weekLogRef = doc(db, 'users', uid, 'weekLogs', docId);
  
  await setDoc(weekLogRef, {
    ...weekLog,
    updatedAt: Date.now(),
  });
}

/**
 * Update a specific day in a week log
 */
export async function updateDayLog(
  uid: string,
  weekId: string,
  habitId: string,
  dayIndex: number,
  updates: Partial<DailyLog>
): Promise<void> {
  const docId = getWeekLogDocId(weekId, habitId);
  const weekLogRef = doc(db, 'users', uid, 'weekLogs', docId);
  const snapshot = await getDoc(weekLogRef);
  
  if (!snapshot.exists()) {
    // Create new week log if it doesn't exist
    const newWeekLog: WeekLog = {
      weekId,
      habitId,
      daily: Array.from({ length: 7 }, (_, i) => ({
        dayIndex: i,
        checked: i === dayIndex ? (updates.checked ?? false) : false,
        actualHours: i === dayIndex ? (updates.actualHours ?? 0) : 0,
      })),
      updatedAt: Date.now(),
    };
    await setDoc(weekLogRef, newWeekLog);
  } else {
    // Update existing week log
    const weekLog = snapshot.data() as WeekLog;
    const updatedDaily = weekLog.daily.map((day, i) =>
      i === dayIndex ? { ...day, ...updates } : day
    );
    
    await updateDoc(weekLogRef, {
      daily: updatedDaily,
      updatedAt: Date.now(),
    });
  }
}

/**
 * Toggle a habit completion for a specific day
 */
export async function toggleHabitDay(
  uid: string,
  weekId: string,
  habitId: string,
  dayIndex: number,
  targetHours: number
): Promise<boolean> {
  const docId = getWeekLogDocId(weekId, habitId);
  const weekLogRef = doc(db, 'users', uid, 'weekLogs', docId);
  const snapshot = await getDoc(weekLogRef);
  
  let newChecked: boolean;
  
  if (!snapshot.exists()) {
    // Create new week log with this day checked
    newChecked = true;
    const newWeekLog: WeekLog = {
      weekId,
      habitId,
      daily: Array.from({ length: 7 }, (_, i) => ({
        dayIndex: i,
        checked: i === dayIndex,
        actualHours: i === dayIndex ? targetHours : 0,
      })),
      updatedAt: Date.now(),
    };
    await setDoc(weekLogRef, newWeekLog);
  } else {
    // Toggle the existing day
    const weekLog = snapshot.data() as WeekLog;
    const currentDay = weekLog.daily[dayIndex];
    newChecked = !currentDay.checked;
    
    const updatedDaily = weekLog.daily.map((day, i) =>
      i === dayIndex
        ? {
            ...day,
            checked: newChecked,
            actualHours: newChecked ? targetHours : 0,
          }
        : day
    );
    
    await updateDoc(weekLogRef, {
      daily: updatedDaily,
      updatedAt: Date.now(),
    });
  }
  
  return newChecked;
}

/**
 * Initialize week logs for all habits (useful when changing weeks)
 */
export async function initializeWeekLogs(
  uid: string,
  weekId: string,
  habitIds: string[]
): Promise<void> {
  const batch = writeBatch(db);
  
  for (const habitId of habitIds) {
    const docId = getWeekLogDocId(weekId, habitId);
    const weekLogRef = doc(db, 'users', uid, 'weekLogs', docId);
    const snapshot = await getDoc(weekLogRef);
    
    if (!snapshot.exists()) {
      const newWeekLog: WeekLog = {
        weekId,
        habitId,
        daily: Array.from({ length: 7 }, (_, i) => ({
          dayIndex: i,
          checked: false,
          actualHours: 0,
        })),
        updatedAt: Date.now(),
      };
      batch.set(weekLogRef, newWeekLog);
    }
  }
  
  await batch.commit();
}

/**
 * Get week logs for multiple weeks (for statistics/history)
 */
export async function getWeekLogsRange(
  uid: string,
  weekIds: string[]
): Promise<Map<string, WeekLog[]>> {
  const result = new Map<string, WeekLog[]>();
  
  for (const weekId of weekIds) {
    const logs = await getWeekLogs(uid, weekId);
    result.set(weekId, logs);
  }
  
  return result;
}
