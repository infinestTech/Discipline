import { useState, useMemo, useEffect, useRef } from 'react';
import {
  ChartBarIcon,
  ClockIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import StatCard from './StatCard';
import HabitTable from './HabitTable';
import HabitModal from '../habits/HabitModal';
import PLBar from './PLBar';
import CandleChart from './CandleChart';
import HeatmapGrid from './HeatmapGrid';
import ExportMenu from './ExportMenu';
import type { Habit, HabitWithWeekLog } from '../../types';
import { getDayIndex, getWeekHeaderLabel, isCurrentWeek } from '../../utils/dateUtils';
import { calculateWeeklyProgress, formatHoursShort, getGrade } from '../../utils/progressEngine';

interface DashboardProps {
  habitsWithLogs: HabitWithWeekLog[];
  loading: boolean;
  currentWeekId: string;
  createHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => Promise<void>;
  updateHabit: (habitId: string, updates: Partial<Omit<Habit, 'id' | 'createdAt'>>) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  toggleDay: (habitId: string, dayIndex: number) => Promise<void>;
  updateDayHours: (habitId: string, dayIndex: number, hours: number) => Promise<void>;
}

const Dashboard = ({
  habitsWithLogs,
  loading,
  currentWeekId,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleDay,
  updateDayHours,
}: DashboardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);
  const prevWeekIdRef = useRef(currentWeekId);

  const isViewingCurrentWeek = isCurrentWeek(currentWeekId);
  const todayIndex = getDayIndex();

  // Track week changes for animation
  useEffect(() => {
    if (prevWeekIdRef.current !== currentWeekId) {
      // Determine direction: newer week = slide right, older week = slide left
      setAnimationDirection(currentWeekId > prevWeekIdRef.current ? 'right' : 'left');
      prevWeekIdRef.current = currentWeekId;
      
      // Clear animation after it completes
      const timer = setTimeout(() => setAnimationDirection(null), 350);
      return () => clearTimeout(timer);
    }
  }, [currentWeekId]);

  // Calculate comprehensive progress stats using progress engine
  const progress = useMemo(() => {
    return calculateWeeklyProgress(habitsWithLogs, todayIndex, isViewingCurrentWeek);
  }, [habitsWithLogs, todayIndex, isViewingCurrentWeek]);

  // Animation class based on week change direction
  const getAnimationClass = () => {
    if (animationDirection === 'left') return 'animate-slide-left';
    if (animationDirection === 'right') return 'animate-slide-right';
    return '';
  };

  const handleOpenModal = (habit?: Habit) => {
    setEditingHabit(habit || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHabit(null);
  };

  const handleSaveHabit = async (habitData: Omit<Habit, 'id' | 'createdAt'>) => {
    if (editingHabit) {
      await updateHabit(editingHabit.id, habitData);
    } else {
      await createHabit(habitData);
    }
  };

  return (
    <main className="flex-1 p-4 lg:p-6 overflow-y-auto scrollbar-trader">
      {/* Header with Week Label and Add Button */}
      <div className={`flex items-center justify-between mb-6 ${getAnimationClass()}`}>
        <div>
          <h1 className="text-xl font-bold text-trader-text font-mono">
            {getWeekHeaderLabel(currentWeekId)}
          </h1>
          <p className="text-sm text-trader-muted">
            {isViewingCurrentWeek 
              ? 'Track your trading discipline' 
              : 'Historical week view'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu 
            habitsWithLogs={habitsWithLogs}
            currentWeekId={currentWeekId}
          />
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg 
                     bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan
                     hover:bg-neon-cyan/30 transition-colors font-medium text-sm"
          >
            <PlusIcon className="w-5 h-5" />
            <span className="hidden sm:inline">New Rule</span>
          </button>
        </div>
      </div>

      {/* KPI Dashboard - Broker Style */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 ${getAnimationClass()}`}>
        <StatCard
          title="DISCIPLINE SCORE"
          value={`${progress.overallWeeklyPct}%`}
          subtitle={`${formatHoursShort(progress.hoursCompleted)} / ${formatHoursShort(progress.totalTargetWeek)} executed`}
          icon={<ChartBarIcon className="w-5 h-5" />}
          trend={progress.overallWeeklyPct > 75 ? { value: progress.overallWeeklyPct - 75, isPositive: true } : undefined}
          accentColor={progress.overallWeeklyPct >= 80 ? "green" : progress.overallWeeklyPct >= 50 ? "yellow" : "red"}
          pulse={progress.overallWeeklyPct < 50}
        />
        <StatCard
          title="TODAY EXECUTION"
          value={isViewingCurrentWeek ? `${progress.todayPct}%` : '—'}
          subtitle={isViewingCurrentWeek 
            ? `${formatHoursShort(progress.todayActual)} / ${formatHoursShort(progress.todayTarget)} filled`
            : 'Historical data'
          }
          icon={<CalendarDaysIcon className="w-5 h-5" />}
          accentColor={progress.todayPct >= 100 ? "green" : progress.todayPct >= 50 ? "yellow" : "cyan"}
        />
        <StatCard
          title="WEEKLY P/L"
          value={formatHoursShort(progress.hoursCompleted)}
          subtitle={`Position: ${getGrade(progress.overallWeeklyPct)}`}
          icon={<ClockIcon className="w-5 h-5" />}
          accentColor="cyan"
        />
        <StatCard
          title="RISK METER"
          value={formatHoursShort(progress.hoursRemaining)}
          subtitle={progress.hoursRemaining === 0 ? "TARGET HIT ✓" : "exposure remaining"}
          icon={<BanknotesIcon className="w-5 h-5" />}
          accentColor={progress.hoursRemaining === 0 ? "green" : progress.hoursRemaining > progress.totalTargetWeek * 0.5 ? "red" : "purple"}
          pulse={progress.hoursRemaining > progress.totalTargetWeek * 0.5}
        />
      </div>

      {/* P/L Progress Bar */}
      <div className={`mb-6 ${getAnimationClass()}`}>
        <PLBar
          delta={progress.plDelta}
          deltaPct={progress.plDeltaPct}
          isAhead={progress.isAhead}
          hoursCompleted={progress.hoursCompleted}
          hoursTarget={progress.totalTargetWeek}
        />
      </div>

      {/* Candle Chart - Trader Visualization */}
      <div className={`mb-6 ${getAnimationClass()}`}>
        <div className="trader-card">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-neon-green text-trader-bg rounded">CANDLE</span>
            <h3 className="text-sm font-mono font-semibold text-trader-text tracking-wide">WEEKLY MOMENTUM</h3>
          </div>
          <CandleChart
            dailyProgress={progress.dailyProgress}
            todayIndex={todayIndex}
            isCurrentWeek={isViewingCurrentWeek}
          />
        </div>
      </div>

      {/* Habit Table */}
      <div className={getAnimationClass()}>
        <HabitTable
          habitsWithLogs={habitsWithLogs}
          currentWeekId={currentWeekId}
          loading={loading}
          onToggleDay={toggleDay}
          onUpdateDayHours={updateDayHours}
          onEditHabit={handleOpenModal}
          onDeleteHabit={deleteHabit}
        />
      </div>

      {/* Heatmap Grid + Quick Stats */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 ${getAnimationClass()}`}>
        {/* Heatmap Grid */}
        <div className="col-span-1 md:col-span-2">
          <HeatmapGrid
            habitsWithLogs={habitsWithLogs}
            currentWeekId={currentWeekId}
          />
        </div>

        {/* Mini Stats */}
        <div className="trader-card">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-neon-yellow text-trader-bg rounded">STATS</span>
            <h3 className="text-sm font-mono font-semibold text-trader-text tracking-wide">POSITION SUMMARY</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-trader-muted">Active Positions</span>
              <span className="text-sm font-bold text-trader-text font-mono">{habitsWithLogs.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-trader-muted">Weekly Target</span>
              <span className="text-sm font-bold text-neon-cyan font-mono">{formatHoursShort(progress.totalTargetWeek)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-trader-muted">Realized</span>
              <span className="text-sm font-bold text-neon-green font-mono">{formatHoursShort(progress.hoursCompleted)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-trader-muted">Unrealized</span>
              <span className="text-sm font-bold text-neon-yellow font-mono">{formatHoursShort(progress.hoursRemaining)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-trader-muted">P/L Delta</span>
              <span className={`text-sm font-bold font-mono ${progress.isAhead ? 'text-neon-green' : 'text-neon-red'}`}>
                {progress.plDelta >= 0 ? '+' : ''}{progress.plDelta.toFixed(1)}h
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-trader-muted">Grade</span>
              <span className="text-sm font-bold text-neon-purple">{getGrade(progress.overallWeeklyPct)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Habit Modal */}
      <HabitModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveHabit}
        editHabit={editingHabit}
      />
    </main>
  );
};

export default Dashboard;
