import { useState, useMemo } from 'react';
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  TableCellsIcon,
  ShareIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import type { HabitWithWeekLog } from '../../types';
import { calculateWeeklyProgress } from '../../utils/progressEngine';
import { getDayIndex, isCurrentWeek } from '../../utils/dateUtils';
import {
  generateExportData,
  exportAsJSON,
  exportAsCSV,
  copyShareableSummary,
} from '../../utils/exportUtils';
import { useToast } from '../../contexts/ToastContext';

interface ExportMenuProps {
  habitsWithLogs: HabitWithWeekLog[];
  currentWeekId: string;
}

const ExportMenu = ({ habitsWithLogs, currentWeekId }: ExportMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { showToast } = useToast();

  const todayIndex = getDayIndex();
  const isViewingCurrentWeek = isCurrentWeek(currentWeekId);

  const progress = useMemo(() => {
    return calculateWeeklyProgress(habitsWithLogs, todayIndex, isViewingCurrentWeek);
  }, [habitsWithLogs, todayIndex, isViewingCurrentWeek]);

  const exportData = useMemo(() => {
    return generateExportData(habitsWithLogs, currentWeekId, progress);
  }, [habitsWithLogs, currentWeekId, progress]);

  const handleExportJSON = () => {
    try {
      exportAsJSON(exportData);
      showToast('success', 'Exported as JSON');
      setIsOpen(false);
    } catch {
      showToast('error', 'Export failed');
    }
  };

  const handleExportCSV = () => {
    try {
      exportAsCSV(exportData);
      showToast('success', 'Exported as CSV');
      setIsOpen(false);
    } catch {
      showToast('error', 'Export failed');
    }
  };

  const handleCopyShareable = async () => {
    const success = await copyShareableSummary(exportData);
    if (success) {
      showToast('success', 'Summary copied to clipboard!');
    } else {
      showToast('error', 'Failed to copy');
    }
    setIsOpen(false);
  };

  if (habitsWithLogs.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                   bg-trader-bg border border-trader-border text-trader-muted
                   hover:border-neon-cyan/30 hover:text-neon-cyan transition-colors"
      >
        <ArrowDownTrayIcon className="w-4 h-4" />
        <span>Export</span>
        <ChevronDownIcon className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg overflow-hidden
                         bg-trader-card border border-trader-border shadow-lg animate-fade-up">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm
                         text-trader-text hover:bg-trader-bg transition-colors"
            >
              <DocumentTextIcon className="w-4 h-4 text-neon-cyan" />
              <div>
                <p className="font-medium">Export JSON</p>
                <p className="text-[10px] text-trader-muted">Full data backup</p>
              </div>
            </button>
            
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm
                         text-trader-text hover:bg-trader-bg transition-colors border-t border-trader-border/50"
            >
              <TableCellsIcon className="w-4 h-4 text-neon-green" />
              <div>
                <p className="font-medium">Export CSV</p>
                <p className="text-[10px] text-trader-muted">Spreadsheet format</p>
              </div>
            </button>
            
            <button
              onClick={handleCopyShareable}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm
                         text-trader-text hover:bg-trader-bg transition-colors border-t border-trader-border/50"
            >
              <ShareIcon className="w-4 h-4 text-neon-purple" />
              <div>
                <p className="font-medium">Copy Summary</p>
                <p className="text-[10px] text-trader-muted">Shareable text</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportMenu;
