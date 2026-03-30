import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'neutral', size = 'sm' }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center rounded-full font-medium',
      size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      {
        'bg-green-100 text-green-800': variant === 'success',
        'bg-red-100 text-red-800': variant === 'error',
        'bg-yellow-100 text-yellow-800': variant === 'warning',
        'bg-blue-100 text-blue-800': variant === 'info',
        'bg-gray-100 text-gray-700': variant === 'neutral',
      }
    )}>
      {children}
    </span>
  );
}
