import { useState, useRef, useEffect } from 'react';
import {
  ChevronDownIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const TopBar = () => {
  const { user, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setShowDropdown(false);
    await signOut();
  };

  return (
    <header className="h-14 bg-trader-card border-b border-trader-border flex items-center justify-between px-4 lg:px-6">
      {/* Left side - Logo and Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-neon-cyan to-neon-green flex items-center justify-center">
          <span className="text-trader-bg font-bold text-sm font-mono">DT</span>
        </div>
        <div className="hidden sm:block">
          <h1 className="text-sm font-bold text-trader-text font-mono tracking-wide">DISCIPLINE TERMINAL</h1>
          <p className="text-[10px] text-trader-muted -mt-0.5 font-mono">HABIT EXECUTION SYSTEM v1.0</p>
        </div>
      </div>

      {/* Center - Market Status Ticker */}
      <div className="hidden md:flex items-center gap-4 bg-trader-bg/50 rounded px-4 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse"></span>
          <span className="text-[10px] font-mono text-neon-green">MARKET OPEN</span>
        </div>
        <span className="text-trader-border">|</span>
        <span className="text-[10px] font-mono text-trader-muted">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Right side - Account and Settings */}
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-trader-hover transition-colors relative">
          <BellIcon className="w-5 h-5 text-trader-muted" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-neon-red rounded-full"></span>
        </button>

        {/* Settings */}
        <button className="p-2 rounded-lg hover:bg-trader-hover transition-colors hidden sm:block">
          <Cog6ToothIcon className="w-5 h-5 text-trader-muted" />
        </button>

        {/* Account Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-trader-hover transition-colors"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-7 h-7 rounded-full border-2 border-neon-cyan/50"
              />
            ) : (
              <UserCircleIcon className="w-6 h-6 text-neon-cyan" />
            )}
            <span className="text-sm font-medium text-trader-text hidden lg:block max-w-[120px] truncate">
              {user?.displayName || user?.email?.split('@')[0] || 'Account'}
            </span>
            <ChevronDownIcon
              className={`w-4 h-4 text-trader-muted hidden lg:block transition-transform ${
                showDropdown ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-trader-card border border-trader-border rounded-lg shadow-xl z-50 overflow-hidden">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-trader-border">
                <p className="text-sm font-medium text-trader-text truncate">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-xs text-trader-muted truncate">
                  {user?.email}
                </p>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neon-red hover:bg-neon-red/10 transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
