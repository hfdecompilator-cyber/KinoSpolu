import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'service';
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({ children, variant = 'default', className, style }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-white/10 text-white/80': variant === 'default',
          'bg-green-500/20 text-green-300': variant === 'success',
          'bg-yellow-500/20 text-yellow-300': variant === 'warning',
          'bg-red-500/20 text-red-300': variant === 'danger',
          'text-white': variant === 'service',
        },
        className
      )}
      style={style}
    >
      {children}
    </span>
  );
}
