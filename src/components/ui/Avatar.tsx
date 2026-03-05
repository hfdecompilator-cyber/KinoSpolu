import { cn } from '@/lib/utils';
import { getAvatarColor } from '@/lib/constants';

interface AvatarProps {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ userId, displayName, avatarUrl, size = 'md', className }: AvatarProps) {
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        className={cn('rounded-full object-cover', sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-br',
        getAvatarColor(userId),
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
