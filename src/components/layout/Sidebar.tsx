import { useState, useMemo } from 'react';
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  ChartBarIcon,
  TrophyIcon,
  ClockIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../../contexts/ToastContext';
import type { HabitWithWeekLog } from '../../types';
import {
  getWeekIdList,
  getShortWeekLabel,
  getWeekRangeLabel,
  getPreviousWeekId,
  getNextWeekId,
  isCurrentWeek,
  getCurrentWeekId,
  getDayIndex,
  getWeekDates,
  isToday,
  DAYS_OF_WEEK,
} from '../../utils/dateUtils';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentWeekId: string;
  onWeekChange: (weekId: string) => void;
  habitsWithLogs: HabitWithWeekLog[];
}

const Sidebar = ({ 
  isOpen, 
  onToggle, 
  currentWeekId, 
  onWeekChange,
  habitsWithLogs,
}: SidebarProps) => {
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false);
  const { showToast } = useToast();

  // Generate week list (12 past + current + 4 future)
  const weekList = useMemo(() => getWeekIdList(12, 4), []);
  
  // Get current week dates for day selector
  const weekDates = useMemo(() => getWeekDates(currentWeekId), [currentWeekId]);
  
  // Get today's day index (only relevant for current week)
  const todayDayIndex = getDayIndex();
  const isViewingCurrentWeek = isCurrentWeek(currentWeekId);

  // Calculate week completion rate
  const weekCompletion = useMemo(() => {
    if (habitsWithLogs.length === 0) return 0;
    
    let completed = 0;
    let total = 0;
    const maxDay = isViewingCurrentWeek ? todayDayIndex + 1 : 7;
    
    habitsWithLogs.forEach(({ weekLog }) => {
      for (let i = 0; i < maxDay; i++) {
        total++;
        if (weekLog.daily[i]?.checked) {
          completed++;
        }
      }
    });
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [habitsWithLogs, isViewingCurrentWeek, todayDayIndex]);

  const navItems = [
    { icon: HomeIcon, label: 'Dashboard', active: true },
    { icon: ChartBarIcon, label: 'Analytics', active: false },
    { icon: TrophyIcon, label: 'Achievements', active: false },
    { icon: ClockIcon, label: 'History', active: false },
  ];

  const handlePreviousWeek = () => {
    onWeekChange(getPreviousWeekId(currentWeekId));
  };

  const handleNextWeek = () => {
    onWeekChange(getNextWeekId(currentWeekId));
  };

  const handleWeekSelect = (weekId: string) => {
    onWeekChange(weekId);
    setIsWeekDropdownOpen(false);
  };

  const handleGoToCurrentWeek = () => {
    onWeekChange(getCurrentWeekId());
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-trader-card rounded-lg border border-trader-border"
      >
        {isOpen ? (
          <XMarkIcon className="w-5 h-5 text-trader-text" />
        ) : (
          <Bars3Icon className="w-5 h-5 text-trader-text" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-trader-card border-r border-trader-border 
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col h-full pt-20 lg:pt-4">
          {/* Navigation */}
          <nav className="px-3 mb-6">
            {navItems.map((item, index) => (
              <button
                key={index}
                onClick={() => !item.active && showToast('info', `${item.label} coming soon`)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                  item.active
                    ? 'bg-neon-cyan/10 text-neon-cyan'
                    : 'text-trader-muted hover:text-trader-text hover:bg-trader-hover'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Week Navigator */}
          <div className="px-3 mb-4">
            {/* Week Header with Dropdown */}
            <div className="relative mb-3">
              <button
                onClick={() => setIsWeekDropdownOpen(!isWeekDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 bg-trader-bg rounded-lg border border-trader-border hover:border-neon-cyan/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="w-4 h-4 text-neon-cyan" />
                  <span className="text-sm font-bold text-trader-text font-mono">
                    {getShortWeekLabel(currentWeekId)}
                  </span>
                  {isViewingCurrentWeek && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-neon-green/20 text-neon-green font-bold">
                      NOW
                    </span>
                  )}
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-trader-muted transition-transform ${isWeekDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Week Dropdown */}
              {isWeekDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsWeekDropdownOpen(false)} 
                  />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-trader-card border border-trader-border rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto scrollbar-trader">
                    {weekList.map((weekId) => {
                      const isCurrent = isCurrentWeek(weekId);
                      const isSelected = weekId === currentWeekId;
                      
                      return (
                        <button
                          key={weekId}
                          onClick={() => handleWeekSelect(weekId)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                            isSelected 
                              ? 'bg-neon-cyan/20 text-neon-cyan' 
                              : 'text-trader-text hover:bg-trader-hover'
                          }`}
                        >
                          <span className="font-mono">{getShortWeekLabel(weekId)}</span>
                          {isCurrent && (
                            <span className="text-[8px] px-1 py-0.5 rounded bg-neon-green/20 text-neon-green font-bold">
                              CURRENT
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Prev / Next Buttons */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={handlePreviousWeek}
                className="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-trader-hover transition-colors text-trader-muted hover:text-trader-text"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                <span className="text-xs">Prev</span>
              </button>
              
              {!isViewingCurrentWeek && (
                <button
                  onClick={handleGoToCurrentWeek}
                  className="px-2 py-1 rounded bg-neon-cyan/20 text-neon-cyan text-[10px] font-bold hover:bg-neon-cyan/30 transition-colors"
                >
                  TODAY
                </button>
              )}
              
              <button
                onClick={handleNextWeek}
                className="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-trader-hover transition-colors text-trader-muted hover:text-trader-text"
              >
                <span className="text-xs">Next</span>
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Week Date Range */}
            <p className="text-xs text-trader-muted text-center mb-3">
              {getWeekRangeLabel(currentWeekId)}
            </p>

            {/* Day Selector */}
            <div className="grid grid-cols-7 gap-1">
              {DAYS_OF_WEEK.map((day, index) => {
                const date = weekDates[index];
                const isTodayDate = isToday(date);
                const isPast = isViewingCurrentWeek ? index < todayDayIndex : true;
                const isFuture = isViewingCurrentWeek ? index > todayDayIndex : false;
                
                return (
                  <div
                    key={day}
                    className={`flex flex-col items-center py-2 rounded-lg transition-all ${
                      isTodayDate
                        ? 'bg-neon-cyan/20 text-neon-cyan ring-1 ring-neon-cyan/50'
                        : isPast
                          ? 'text-trader-text'
                          : 'text-trader-muted/50'
                    }`}
                  >
                    <span className="text-[10px] font-medium mb-1">{day}</span>
                    <span
                      className={`text-xs font-semibold ${
                        isTodayDate ? 'text-neon-cyan' : isFuture ? 'text-trader-muted/50' : 'text-trader-text'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="px-3 mt-auto mb-4">
            <div className="bg-trader-bg rounded-lg p-3">
              <p className="text-[10px] text-trader-muted mb-2 font-mono tracking-wider">
                {isViewingCurrentWeek ? 'SESSION' : getShortWeekLabel(currentWeekId)}
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-lg font-bold font-mono ${
                    weekCompletion >= 80 
                      ? 'text-neon-green' 
                      : weekCompletion >= 50 
                        ? 'text-neon-yellow' 
                        : 'text-neon-red'
                  }`}>
                    {weekCompletion}%
                  </p>
                  <p className="text-[10px] text-trader-muted font-mono">EXEC RATE</p>
                </div>
                <div className="w-12 h-12 relative">
                  <svg className="w-12 h-12 -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke="#1e2a3a"
                      strokeWidth="4"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke={weekCompletion >= 80 ? '#00ff88' : weekCompletion >= 50 ? '#ffcc00' : '#ff4757'}
                      strokeWidth="4"
                      strokeDasharray={`${weekCompletion * 1.256} 125.6`}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
