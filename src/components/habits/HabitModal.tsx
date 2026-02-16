import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import type { Habit, ColorTag } from '../../types';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: Omit<Habit, 'id' | 'createdAt'>) => Promise<void>;
  editHabit?: Habit | null;
}

const COLOR_OPTIONS: { value: ColorTag; label: string; className: string }[] = [
  { value: 'green', label: 'Green', className: 'bg-neon-green text-trader-bg' },
  { value: 'cyan', label: 'Cyan', className: 'bg-neon-cyan text-trader-bg' },
  { value: 'red', label: 'Red', className: 'bg-neon-red text-trader-bg' },
  { value: 'yellow', label: 'Yellow', className: 'bg-neon-yellow text-trader-bg' },
  { value: 'purple', label: 'Purple', className: 'bg-neon-purple text-trader-bg' },
];

const HabitModal = ({ isOpen, onClose, onSave, editHabit }: HabitModalProps) => {
  const [name, setName] = useState('');
  const [targetHours, setTargetHours] = useState('0.5');
  const [colorTag, setColorTag] = useState<ColorTag>('cyan');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const colorDropdownRef = useRef<HTMLDivElement>(null);

  // Reset form when modal opens or edit habit changes
  useEffect(() => {
    if (isOpen) {
      if (editHabit) {
        setName(editHabit.name);
        setTargetHours(editHabit.targetHoursPerDay.toString());
        setColorTag(editHabit.colorTag);
      } else {
        setName('');
        setTargetHours('0.5');
        setColorTag('cyan');
      }
      setError(null);
    }
  }, [isOpen, editHabit]);

  // Close color dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target as Node)) {
        setShowColorDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Please enter a habit name');
      return;
    }

    const hours = parseFloat(targetHours);
    if (isNaN(hours) || hours < 0 || hours > 24) {
      setError('Please enter valid hours (0-24)');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave({
        name: name.trim(),
        targetHoursPerDay: hours,
        colorTag,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save habit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedColor = COLOR_OPTIONS.find((c) => c.value === colorTag);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-trader-card border border-trader-border rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Header - Trading Terminal Style */}
        <div className="bg-trader-bg border-b border-trader-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-trader-text">
                {editHabit ? 'Modify Rule' : 'New Discipline Rule'}
              </h2>
              <p className="text-xs text-trader-muted mt-0.5">
                {editHabit ? 'Update your trading discipline' : 'Define your trading discipline'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-trader-hover transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-trader-muted" />
            </button>
          </div>
        </div>

        {/* Order Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-neon-red/10 border border-neon-red/30">
              <p className="text-sm text-neon-red">{error}</p>
            </div>
          )}

          {/* Habit Name */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-trader-muted mb-2">
              Rule Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g., "Backtest 1 Strategy"'
              className="w-full px-4 py-3 bg-trader-bg border border-trader-border rounded-lg 
                       text-trader-text placeholder-trader-muted/50
                       focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan
                       transition-colors"
              autoFocus
            />
          </div>

          {/* Target Hours */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-trader-muted mb-2">
              Target Hours/Day
            </label>
            <div className="relative">
              <input
                type="number"
                value={targetHours}
                onChange={(e) => setTargetHours(e.target.value)}
                step="0.25"
                min="0"
                max="24"
                className="w-full px-4 py-3 bg-trader-bg border border-trader-border rounded-lg 
                         text-trader-text text-lg font-mono
                         focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan
                         transition-colors"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-trader-muted">
                hours
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              {[0.25, 0.5, 1, 2].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTargetHours(preset.toString())}
                  className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                    parseFloat(targetHours) === preset
                      ? 'bg-neon-cyan/20 border-neon-cyan/30 text-neon-cyan'
                      : 'border-trader-border text-trader-muted hover:border-trader-hover'
                  }`}
                >
                  {preset < 1 ? `${preset * 60}m` : `${preset}h`}
                </button>
              ))}
            </div>
          </div>

          {/* Color Tag */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-trader-muted mb-2">
              Signal Color
            </label>
            <div className="relative" ref={colorDropdownRef}>
              <button
                type="button"
                onClick={() => setShowColorDropdown(!showColorDropdown)}
                className="w-full px-4 py-3 bg-trader-bg border border-trader-border rounded-lg 
                         flex items-center justify-between
                         focus:outline-none focus:border-neon-cyan transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-5 h-5 rounded-full ${selectedColor?.className}`}
                  />
                  <span className="text-trader-text">{selectedColor?.label}</span>
                </div>
                <svg
                  className={`w-5 h-5 text-trader-muted transition-transform ${
                    showColorDropdown ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showColorDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-trader-card border border-trader-border rounded-lg shadow-xl z-10 overflow-hidden">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => {
                        setColorTag(color.value);
                        setShowColorDropdown(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-trader-hover transition-colors"
                    >
                      <span
                        className={`w-5 h-5 rounded-full ${color.className}`}
                      />
                      <span className="text-trader-text">{color.label}</span>
                      {colorTag === color.value && (
                        <CheckIcon className="w-4 h-4 text-neon-cyan ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons - Trading Style */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-lg border border-trader-border 
                       text-trader-muted hover:text-trader-text hover:bg-trader-hover
                       transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-lg bg-neon-cyan/20 border border-neon-cyan/30
                       text-neon-cyan font-medium
                       hover:bg-neon-cyan/30 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckIcon className="w-5 h-5" />
                  {editHabit ? 'Update Rule' : 'Place Rule'}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer - Status Bar */}
        <div className="bg-trader-bg border-t border-trader-border px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            <span className="text-xs text-trader-muted">System Ready</span>
          </div>
          <span className="text-xs text-trader-muted font-mono">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HabitModal;
