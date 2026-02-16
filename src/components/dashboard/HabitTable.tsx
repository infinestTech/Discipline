import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  CheckIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import type { HabitWithWeekLog, Habit, ColorTag } from '../../types';
import {
  DAYS_OF_WEEK,
  getWeekDateNumbers,
  getWeekLabel,
  getDayIndex,
  isCurrentWeek,
} from '../../utils/dateUtils';

interface HabitTableProps {
  habitsWithLogs: HabitWithWeekLog[];
  currentWeekId: string;
  loading: boolean;
  onToggleDay: (habitId: string, dayIndex: number) => Promise<void>;
  onUpdateDayHours: (habitId: string, dayIndex: number, hours: number) => Promise<void>;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => Promise<void>;
}

// Debounce delay for auto-save
const DEBOUNCE_MS = 400;

const HabitTable = ({
  habitsWithLogs,
  currentWeekId,
  loading,
  onToggleDay,
  onUpdateDayHours,
  onEditHabit,
  onDeleteHabit,
}: HabitTableProps) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [localHours, setLocalHours] = useState<Record<string, number>>({});
  
  // Ref to store debounce timeouts
  const debounceTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const days = DAYS_OF_WEEK;
  const dates = getWeekDateNumbers(currentWeekId);
  const todayIndex = getDayIndex();
  const isViewingCurrentWeek = isCurrentWeek(currentWeekId);

  // Cleanup debounce timeouts on unmount
  useEffect(() => {
    const timeouts = debounceTimeouts.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  const colorClasses: Record<ColorTag, { text: string; bg: string; border: string }> = {
    green: { text: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/30' },
    cyan: { text: 'text-neon-cyan', bg: 'bg-neon-cyan/10', border: 'border-neon-cyan/30' },
    red: { text: 'text-neon-red', bg: 'bg-neon-red/10', border: 'border-neon-red/30' },
    yellow: { text: 'text-neon-yellow', bg: 'bg-neon-yellow/10', border: 'border-neon-yellow/30' },
    purple: { text: 'text-neon-purple', bg: 'bg-neon-purple/10', border: 'border-neon-purple/30' },
  };

  // Handle checkbox toggle
  const handleCheckToggle = useCallback(async (
    habitId: string, 
    dayIndex: number, 
    currentChecked: boolean,
    targetHours: number
  ) => {
    const cellKey = `${habitId}_${dayIndex}`;
    
    if (currentChecked) {
      // Unchecking - set hours to 0
      setLocalHours(prev => ({ ...prev, [cellKey]: 0 }));
    } else {
      // Checking - auto-fill with target hours
      setLocalHours(prev => ({ ...prev, [cellKey]: targetHours }));
    }
    
    try {
      await onToggleDay(habitId, dayIndex);
    } catch (err) {
      console.error('Failed to toggle day:', err);
    }
  }, [onToggleDay]);

  // Handle hours input change with debounce
  const handleHoursChange = useCallback((
    habitId: string,
    dayIndex: number,
    value: string
  ) => {
    const cellKey = `${habitId}_${dayIndex}`;
    const numValue = parseFloat(value) || 0;
    const clampedValue = Math.max(0, Math.min(24, numValue));
    
    // Update local state immediately for UI responsiveness
    setLocalHours(prev => ({ ...prev, [cellKey]: clampedValue }));
    
    // Clear existing timeout for this cell
    const existingTimeout = debounceTimeouts.current.get(cellKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Set new debounced save
    const timeout = setTimeout(async () => {
      try {
        await onUpdateDayHours(habitId, dayIndex, clampedValue);
        debounceTimeouts.current.delete(cellKey);
      } catch (err) {
        console.error('Failed to update hours:', err);
      }
    }, DEBOUNCE_MS);
    
    debounceTimeouts.current.set(cellKey, timeout);
  }, [onUpdateDayHours]);

  // Get display hours (local state takes precedence for responsive UI)
  const getDisplayHours = useCallback((habitId: string, dayIndex: number, actualHours: number): number => {
    const cellKey = `${habitId}_${dayIndex}`;
    return localHours[cellKey] ?? actualHours;
  }, [localHours]);

  const handleDelete = async (habitId: string) => {
    if (deletingId) return;
    
    setDeletingId(habitId);
    try {
      await onDeleteHabit(habitId);
    } catch (err) {
      console.error('Failed to delete habit:', err);
    } finally {
      setDeletingId(null);
      setActiveMenu(null);
    }
  };

  // Calculate weekly completion percentage (full week target)
  // weeklyTarget = targetHoursPerDay * 7
  // weeklyActual = sum(actualHours for 7 days)
  // habitWeeklyPct = min(100, weeklyActual/weeklyTarget*100)
  const calculateWeeklyPercentage = useCallback((weekLog: HabitWithWeekLog['weekLog'], targetHours: number): number => {
    const weeklyTarget = targetHours * 7;
    const weeklyActual = weekLog.daily.reduce((sum, day) => sum + day.actualHours, 0);
    
    if (weeklyTarget === 0) return 0;
    return Math.min(100, Math.round((weeklyActual / weeklyTarget) * 100));
  }, []);

  // Stats calculations
  const getTodayStats = useMemo(() => {
    if (!isViewingCurrentWeek) {
      // For historical weeks, show full week completion
      let completed = 0;
      const total = habitsWithLogs.length;
      habitsWithLogs.forEach(({ weekLog }) => {
        const allChecked = weekLog.daily.every(d => d.checked);
        if (allChecked) completed++;
      });
      return { completed, total };
    }

    let completed = 0;
    const total = habitsWithLogs.length;
    
    habitsWithLogs.forEach(({ weekLog }) => {
      if (weekLog.daily[todayIndex]?.checked) {
        completed++;
      }
    });
    
    return { completed, total };
  }, [habitsWithLogs, todayIndex, isViewingCurrentWeek]);

  if (loading) {
    return (
      <div className="trader-card">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-trader-muted font-mono">LOADING WATCHLIST...</p>
          </div>
        </div>
      </div>
    );
  }

  if (habitsWithLogs.length === 0) {
    return (
      <div className="trader-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-trader-border">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-neon-cyan px-2 py-0.5 bg-neon-cyan/10 rounded">WATCHLIST</span>
            <h2 className="text-sm font-bold text-trader-text font-mono">EXECUTION JOURNAL</h2>
          </div>
          <span className="text-[10px] text-trader-muted font-mono">{getWeekLabel(currentWeekId)}</span>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 mb-4 rounded-lg bg-trader-bg border border-trader-border/50 flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-sm font-bold text-trader-text mb-2 font-mono">NO POSITIONS</h3>
          <p className="text-xs text-trader-muted max-w-xs">
            Add discipline rules to start tracking your daily execution.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="trader-card overflow-hidden">
      {/* Watchlist Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-trader-border">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-neon-cyan px-2 py-0.5 bg-neon-cyan/10 rounded">WATCHLIST</span>
          <h2 className="text-sm font-bold text-trader-text font-mono">EXECUTION JOURNAL</h2>
          <span className="text-[10px] text-trader-muted">•</span>
          <span className={`text-[10px] font-mono ${getTodayStats.completed === getTodayStats.total ? 'text-neon-green' : 'text-trader-muted'}`}>
            {getTodayStats.completed}/{getTodayStats.total} {isViewingCurrentWeek ? 'TODAY' : 'WEEK'}
          </span>
        </div>
        <span className="text-[10px] text-trader-muted font-mono">{getWeekLabel(currentWeekId)}</span>
      </div>

      <div className="overflow-x-auto scrollbar-trader">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-b border-trader-border bg-trader-bg/80">
              <th className="text-left py-2.5 px-3 text-[10px] font-bold text-trader-muted uppercase tracking-wider w-48 border-r border-trader-border/30">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse"></span>
                  SYMBOL
                </span>
              </th>
              {days.map((day, index) => {
                const isColumnToday = isViewingCurrentWeek && index === todayIndex;
                return (
                <th
                  key={day}
                  className={`text-center py-2 px-1 text-xs font-bold w-24 border-r border-trader-border/50 ${
                    isColumnToday 
                      ? 'text-neon-cyan bg-neon-cyan/5' 
                      : 'text-trader-muted'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className={isColumnToday ? 'text-neon-cyan' : ''}>{day}</span>
                    <span className={`text-[10px] mt-0.5 ${
                      isColumnToday ? 'text-neon-cyan/70' : 'text-trader-muted/70'
                    }`}>
                      {dates[index]}
                    </span>
                  </div>
                </th>
              );
              })}
              <th className="text-center py-3 px-2 text-xs font-bold text-neon-yellow uppercase tracking-wider w-20 border-r border-trader-border/50">
                Weekly%
              </th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {habitsWithLogs.map(({ habit, weekLog }) => {
              const weeklyPercentage = calculateWeeklyPercentage(weekLog, habit.targetHoursPerDay);
              const colors = colorClasses[habit.colorTag];
              
              return (
                <tr
                  key={habit.id}
                  className="border-b border-trader-border/30 hover:bg-trader-hover/30 transition-colors group"
                >
                  {/* Habit Name Cell */}
                  <td className="py-3 px-3 border-r border-trader-border/30">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-sm uppercase font-bold ${colors.text} ${colors.bg} ${colors.border} border`}>
                        {habit.colorTag}
                      </span>
                      <span className="text-[10px] text-trader-muted font-mono">
                        {habit.targetHoursPerDay}h/day
                      </span>
                    </div>
                    <p className="text-sm text-trader-text font-medium truncate max-w-[180px]" title={habit.name}>
                      {habit.name}
                    </p>
                  </td>

                  {/* Day Cells */}
                  {weekLog.daily.map((day, dayIndex) => {
                    const cellKey = `${habit.id}_${dayIndex}`;
                    const isToday = isViewingCurrentWeek && dayIndex === todayIndex;
                    const isFuture = isViewingCurrentWeek && dayIndex > todayIndex;
                    const displayHours = getDisplayHours(habit.id, dayIndex, day.actualHours);
                    const isActive = activeCell === cellKey;
                    
                    // Determine cell status colors
                    const getStatusColors = () => {
                      if (isFuture) return 'bg-trader-bg/30';
                      if (day.checked) {
                        const ratio = displayHours / habit.targetHoursPerDay;
                        if (ratio >= 1) return 'bg-neon-green/10';
                        if (ratio >= 0.5) return 'bg-neon-yellow/10';
                        return 'bg-neon-red/10';
                      }
                      if (!isToday && !isFuture) return 'bg-neon-red/5';
                      return '';
                    };

                    return (
                      <td 
                        key={dayIndex} 
                        className={`text-center py-2 px-1 border-r border-trader-border/30 transition-all ${
                          isToday ? 'bg-neon-cyan/5' : ''
                        } ${getStatusColors()} ${
                          isActive ? 'ring-1 ring-inset ring-neon-cyan shadow-[0_0_8px_rgba(0,255,255,0.15)]' : ''
                        }`}
                        onClick={() => !isFuture && setActiveCell(cellKey)}
                      >
                        <div className="flex flex-col items-center gap-1.5">
                          {/* Checkbox */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isFuture) {
                                handleCheckToggle(habit.id, dayIndex, day.checked, habit.targetHoursPerDay);
                              }
                            }}
                            disabled={isFuture}
                            className={`w-5 h-5 rounded transition-all flex items-center justify-center ${
                              isFuture
                                ? 'border border-trader-border/30 bg-trader-bg/50 cursor-not-allowed'
                                : day.checked
                                  ? 'bg-neon-green/20 border border-neon-green/50 hover:bg-neon-green/30'
                                  : isToday
                                    ? 'border-2 border-dashed border-neon-cyan/50 hover:border-neon-cyan hover:bg-neon-cyan/10'
                                    : 'border border-neon-red/30 bg-neon-red/10 hover:bg-neon-red/20'
                            }`}
                          >
                            {day.checked && <CheckIcon className="w-3 h-3 text-neon-green" />}
                          </button>

                          {/* Hours Input */}
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            max="24"
                            value={displayHours || ''}
                            placeholder="0"
                            disabled={!day.checked || isFuture}
                            onChange={(e) => handleHoursChange(habit.id, dayIndex, e.target.value)}
                            onFocus={() => setActiveCell(cellKey)}
                            onBlur={() => setActiveCell(null)}
                            className={`w-14 h-6 text-center text-xs rounded border transition-all font-mono ${
                              !day.checked || isFuture
                                ? 'bg-trader-bg/30 border-trader-border/20 text-trader-muted/50 cursor-not-allowed'
                                : `bg-trader-bg border-trader-border/50 text-trader-text 
                                   focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/30 
                                   focus:shadow-[0_0_10px_rgba(0,255,255,0.2)]
                                   hover:border-trader-border`
                            } [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                          />
                        </div>
                      </td>
                    );
                  })}

                  {/* Weekly Percentage Cell */}
                  <td className="text-center py-3 px-2 border-r border-trader-border/30">
                    <div className={`text-sm font-bold font-mono ${
                      weeklyPercentage >= 100 
                        ? 'text-neon-green' 
                        : weeklyPercentage >= 70 
                          ? 'text-neon-yellow' 
                          : 'text-neon-red'
                    }`}>
                      {weeklyPercentage}%
                    </div>
                    <div className="w-full h-1 mt-1 rounded-full bg-trader-border/30 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          weeklyPercentage >= 100 
                            ? 'bg-neon-green' 
                            : weeklyPercentage >= 70 
                              ? 'bg-neon-yellow' 
                              : 'bg-neon-red'
                        }`}
                        style={{ width: `${Math.min(100, weeklyPercentage)}%` }}
                      />
                    </div>
                  </td>

                  {/* Actions Menu */}
                  <td className="py-3 px-1 relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === habit.id ? null : habit.id)}
                      className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-trader-hover transition-all"
                    >
                      <EllipsisVerticalIcon className="w-4 h-4 text-trader-muted" />
                    </button>

                    {activeMenu === habit.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setActiveMenu(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-32 bg-trader-card border border-trader-border rounded shadow-xl z-20 overflow-hidden">
                          <button
                            onClick={() => {
                              setActiveMenu(null);
                              onEditHabit(habit);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-trader-text hover:bg-trader-hover transition-colors"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(habit.id)}
                            disabled={deletingId === habit.id}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-neon-red hover:bg-neon-red/10 transition-colors disabled:opacity-50"
                          >
                            {deletingId === habit.id ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-neon-red/30 border-t-neon-red rounded-full animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <TrashIcon className="w-3.5 h-3.5" />
                                Delete
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend Footer */}
      <div className="mt-4 pt-4 border-t border-trader-border flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-neon-green/20 border border-neon-green/50 flex items-center justify-center">
              <CheckIcon className="w-2.5 h-2.5 text-neon-green" />
            </div>
            <span className="text-[10px] text-trader-muted">Executed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-neon-red/10 border border-neon-red/30"></div>
            <span className="text-[10px] text-trader-muted">Missed</span>
          </div>
          {isViewingCurrentWeek && (
            <>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded border-2 border-dashed border-neon-cyan/50"></div>
                <span className="text-[10px] text-trader-muted">Today</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-trader-bg/30 border border-trader-border/30"></div>
                <span className="text-[10px] text-trader-muted">Future</span>
              </div>
            </>
          )}
        </div>
        <div className="text-xs">
          <span className="text-trader-muted">{isViewingCurrentWeek ? 'Today: ' : 'Full Week: '}</span>
          <span className={`font-bold font-mono ${
            getTodayStats.completed === getTodayStats.total && getTodayStats.total > 0 
              ? 'text-neon-green' 
              : 'text-neon-cyan'
          }`}>
            {getTodayStats.completed}/{getTodayStats.total}
          </span>
          <span className="text-trader-muted"> executed</span>
        </div>
      </div>
    </div>
  );
};

export default HabitTable;
