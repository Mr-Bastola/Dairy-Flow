import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  return (
    <div className={clsx(
      'bg-white rounded-xl shadow-sm border border-gray-100',
      {
        '': padding === 'none',
        'p-4': padding === 'sm',
        'p-6': padding === 'md',
        'p-8': padding === 'lg',
      },
      className
    )}>
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'green' | 'blue' | 'orange' | 'purple' | 'red';
  trend?: { value: string; up: boolean };
}

export function StatCard({ title, value, subtitle, icon, color = 'green', trend }: StatCardProps) {
  const colors = {
    green: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-100' },
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-100' },
  };
  const c = colors[color];

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${c.border} p-5 flex items-start gap-4`}>
      <div className={`${c.bg} rounded-lg p-3 ${c.icon} flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        {trend && (
          <p className={`text-xs font-medium mt-1 ${trend.up ? 'text-green-600' : 'text-red-500'}`}>
            {trend.up ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </div>
    </div>
  );
}
