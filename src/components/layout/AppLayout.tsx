import { useState, useEffect } from 'react';
import { XMarkIcon, BoltIcon } from '@heroicons/react/24/outline';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import Dashboard from '../dashboard/Dashboard';
import InsightsPanel from '../dashboard/InsightsPanel';
import OfflineIndicator from './OfflineIndicator';
import { useHabits } from '../../hooks/useHabits';
import type { HabitWithWeekLog } from '../../types';

// Mobile drawer for insights panel
const MobileInsightsDrawer = ({ 
  habitsWithLogs, 
  currentWeekId 
}: { 
  habitsWithLogs: HabitWithWeekLog[]; 
  currentWeekId: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle Button */}
      <div className="xl:hidden fixed bottom-4 right-4 z-30">
        <button 
          onClick={() => setIsOpen(true)}
          className="p-3 bg-neon-cyan/20 text-neon-cyan rounded-full border border-neon-cyan/30 
                    hover:bg-neon-cyan/30 transition-all shadow-neon-cyan"
        >
          <BoltIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="xl:hidden fixed inset-0 bg-black/50 z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={`xl:hidden fixed inset-y-0 right-0 z-50 w-80 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-1 text-trader-muted hover:text-trader-text z-10"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <InsightsPanel 
            habitsWithLogs={habitsWithLogs}
            currentWeekId={currentWeekId}
            compact
          />
        </div>
      </div>
    </>
  );
};

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const {
    habits,
    habitsWithLogs,
    loading,
    currentWeekId,
    setCurrentWeekId,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleDay,
    updateDayHours,
    ensureWeekLogsExist,
  } = useHabits();

  // Ensure week logs exist when switching weeks or when habits load
  useEffect(() => {
    if (!loading && habits.length > 0) {
      ensureWeekLogsExist();
    }
  }, [loading, habits.length, currentWeekId, ensureWeekLogsExist]);

  return (
    <div className="h-screen flex flex-col bg-trader-bg overflow-hidden">
      {/* Top Bar */}
      <TopBar />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          currentWeekId={currentWeekId}
          onWeekChange={setCurrentWeekId}
          habitsWithLogs={habitsWithLogs}
        />

        {/* Main Dashboard */}
        <Dashboard
          habitsWithLogs={habitsWithLogs}
          loading={loading}
          currentWeekId={currentWeekId}
          createHabit={createHabit}
          updateHabit={updateHabit}
          deleteHabit={deleteHabit}
          toggleDay={toggleDay}
          updateDayHours={updateDayHours}
        />

        {/* Right Insights Panel - Hidden on smaller screens */}
        <div className="hidden xl:flex">
          <InsightsPanel 
            habitsWithLogs={habitsWithLogs}
            currentWeekId={currentWeekId}
          />
        </div>
      </div>

      {/* Mobile Insights Toggle */}
      <MobileInsightsDrawer 
        habitsWithLogs={habitsWithLogs}
        currentWeekId={currentWeekId}
      />

      {/* Offline Status Indicator */}
      <OfflineIndicator />
    </div>
  );
};

export default AppLayout;
