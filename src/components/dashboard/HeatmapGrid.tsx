import { useMemo } from 'react';
import type { HabitWithWeekLog } from '../../types';
import { DAYS_OF_WEEK, isCurrentWeek as checkIsCurrentWeek, getDayIndex } from '../../utils/dateUtils';

interface HeatmapGridProps {
  habitsWithLogs: HabitWithWeekLog[];
  currentWeekId: string;
  onCellClick?: (habitId: string, dayIndex: number) => void;
}

interface HeatmapCell {
  habitId: string;
  habitName: string;
  dayIndex: number;
  ratio: number;        // actualHours / targetHours
  actualHours: number;
  targetHours: number;
  checked: boolean;
  isToday: boolean;
  isFuture: boolean;
}

const HeatmapGrid = ({ habitsWithLogs, currentWeekId, onCellClick }: HeatmapGridProps) => {
  const isCurrentWeek = checkIsCurrentWeek(currentWeekId);
  const todayIndex = getDayIndex();

  // Transform data into heatmap cells
  const { cells, habits } = useMemo(() => {
    const allCells: HeatmapCell[][] = [];
    const habitList: { id: string; name: string; colorTag: string }[] = [];

    habitsWithLogs.forEach(({ habit, weekLog }) => {
      habitList.push({ id: habit.id, name: habit.name, colorTag: habit.colorTag });
      
      const habitCells: HeatmapCell[] = weekLog.daily.map((day, dayIndex) => {
        const ratio = habit.targetHoursPerDay > 0 
          ? day.actualHours / habit.targetHoursPerDay 
          : 0;
        
        return {
          habitId: habit.id,
          habitName: habit.name,
          dayIndex,
          ratio: Math.min(1.5, ratio), // Cap at 150% for color intensity
          actualHours: day.actualHours,
          targetHours: habit.targetHoursPerDay,
          checked: day.checked,
          isToday: isCurrentWeek && dayIndex === todayIndex,
          isFuture: isCurrentWeek && dayIndex > todayIndex,
        };
      });
      
      allCells.push(habitCells);
    });

    return { cells: allCells, habits: habitList };
  }, [habitsWithLogs, isCurrentWeek, todayIndex]);

  // Get cell background color based on ratio
  const getCellColor = (cell: HeatmapCell): string => {
    if (cell.isFuture) return 'rgba(30, 42, 58, 0.3)';
    if (!cell.checked && cell.actualHours === 0) {
      if (cell.isToday) return 'rgba(0, 255, 255, 0.1)';
      return 'rgba(255, 71, 87, 0.15)';
    }

    const ratio = cell.ratio;
    if (ratio >= 1.0) {
      // Green gradient for >= 100%
      const intensity = Math.min(1, 0.3 + ratio * 0.4);
      return `rgba(0, 255, 136, ${intensity})`;
    }
    if (ratio >= 0.5) {
      // Yellow gradient for 50-99%
      const intensity = 0.2 + (ratio - 0.5) * 0.6;
      return `rgba(255, 204, 0, ${intensity})`;
    }
    if (ratio > 0) {
      // Red gradient for < 50%
      const intensity = 0.15 + ratio * 0.5;
      return `rgba(255, 71, 87, ${intensity})`;
    }
    
    return 'rgba(30, 42, 58, 0.5)';
  };

  // Get text color based on background
  const getTextColor = (cell: HeatmapCell): string => {
    if (cell.isFuture) return '#4a5568';
    if (cell.ratio >= 0.8) return '#0b0f14';
    if (cell.isToday) return '#00ffff';
    return '#e0e6ed';
  };

  if (habitsWithLogs.length === 0) {
    return (
      <div className="trader-card text-center py-8">
        <p className="text-trader-muted text-sm">No habits to display</p>
      </div>
    );
  }

  return (
    <div className="trader-card">
      <div className="flex items-center gap-2 mb-4">
        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-trader-purple text-white rounded">HEAT</span>
        <h3 className="text-sm font-mono font-semibold text-trader-text tracking-wide">PERFORMANCE GRID</h3>
      </div>
      
      <div className="overflow-x-auto scrollbar-trader">
        <div className="min-w-[600px]">
          {/* Header Row - Days */}
          <div className="grid grid-cols-8 gap-1 mb-2">
            <div className="text-xs text-trader-muted px-2">Habit</div>
            {DAYS_OF_WEEK.map((day, index) => {
              const isToday = isCurrentWeek && index === todayIndex;
              return (
                <div
                  key={day}
                  className={`text-center text-xs font-bold py-1 rounded ${
                    isToday 
                      ? 'text-neon-cyan bg-neon-cyan/10' 
                      : 'text-trader-muted'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Habit Rows */}
          {cells.map((habitCells, habitIndex) => (
            <div
              key={habits[habitIndex].id}
              className="grid grid-cols-8 gap-1 mb-1 group"
            >
              {/* Habit Name */}
              <div className="flex items-center px-2 py-2 text-xs text-trader-text truncate">
                <span 
                  className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                  style={{
                    backgroundColor: 
                      habits[habitIndex].colorTag === 'green' ? '#00ff88' :
                      habits[habitIndex].colorTag === 'cyan' ? '#00ffff' :
                      habits[habitIndex].colorTag === 'red' ? '#ff4757' :
                      habits[habitIndex].colorTag === 'yellow' ? '#ffcc00' :
                      '#a855f7'
                  }}
                />
                <span className="truncate" title={habits[habitIndex].name}>
                  {habits[habitIndex].name}
                </span>
              </div>

              {/* Day Cells */}
              {habitCells.map((cell) => (
                <div
                  key={`${cell.habitId}-${cell.dayIndex}`}
                  onClick={() => !cell.isFuture && onCellClick?.(cell.habitId, cell.dayIndex)}
                  className={`relative flex items-center justify-center py-3 rounded transition-all duration-300 ${
                    cell.isToday ? 'ring-1 ring-neon-cyan ring-inset' : ''
                  } ${!cell.isFuture ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
                  style={{ backgroundColor: getCellColor(cell) }}
                  title={`${cell.actualHours.toFixed(1)}h / ${cell.targetHours}h`}
                >
                  <span
                    className="text-xs font-bold font-mono"
                    style={{ color: getTextColor(cell) }}
                  >
                    {cell.isFuture ? '-' : cell.actualHours > 0 ? cell.actualHours.toFixed(1) : '0'}
                  </span>
                  
                  {/* Checkmark for completed */}
                  {cell.checked && cell.ratio >= 1 && (
                    <span className="absolute top-0.5 right-0.5 text-[8px]">✓</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-trader-border">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(255, 71, 87, 0.4)' }} />
          <span className="text-[10px] text-trader-muted">&lt;50%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(255, 204, 0, 0.5)' }} />
          <span className="text-[10px] text-trader-muted">50-79%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(0, 255, 136, 0.6)' }} />
          <span className="text-[10px] text-trader-muted">≥80%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded ring-1 ring-neon-cyan" style={{ backgroundColor: 'rgba(0, 255, 255, 0.1)' }} />
          <span className="text-[10px] text-trader-muted">Today</span>
        </div>
      </div>
    </div>
  );
};

export default HeatmapGrid;
