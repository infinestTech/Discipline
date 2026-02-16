import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  accentColor?: 'green' | 'red' | 'cyan' | 'yellow' | 'purple';
  pulse?: boolean; // Enable pulsing for alerts
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'cyan',
  pulse = false,
}: StatCardProps) => {
  const accentClasses = {
    green: 'text-neon-green bg-neon-green/10 border-neon-green/20',
    red: 'text-neon-red bg-neon-red/10 border-neon-red/20',
    cyan: 'text-neon-cyan bg-neon-cyan/10 border-neon-cyan/20',
    yellow: 'text-neon-yellow bg-neon-yellow/10 border-neon-yellow/20',
    purple: 'text-neon-purple bg-neon-purple/10 border-neon-purple/20',
  };

  const glowClasses = {
    green: 'shadow-neon-green',
    red: 'shadow-neon-red',
    cyan: 'shadow-neon-cyan',
    yellow: '',
    purple: '',
  };

  // Pulse animation for risk alerts
  const pulseClass = pulse && accentColor === 'red' ? 'animate-pulse-glow' : '';

  return (
    <div
      className={`trader-card hover:${glowClasses[accentColor]} group cursor-pointer ${pulseClass}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`p-2 rounded-lg border ${accentClasses[accentColor]}`}
        >
          {icon}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              trend.isPositive ? 'text-neon-green' : 'text-neon-red'
            }`}
          >
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      <p className="text-trader-muted text-sm mb-1">{title}</p>
      <p
        className={`text-2xl font-bold ${
          accentColor === 'green'
            ? 'text-neon-green'
            : accentColor === 'red'
            ? 'text-neon-red'
            : 'text-trader-text'
        }`}
      >
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-trader-muted mt-1">{subtitle}</p>
      )}
    </div>
  );
};

export default StatCard;
