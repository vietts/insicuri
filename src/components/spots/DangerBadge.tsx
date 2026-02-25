import { getDangerBg, getDangerLabel } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface DangerBadgeProps {
  score: number;
  size?: 'sm' | 'md';
}

export function DangerBadge({ score, size = 'md' }: DangerBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-white font-bold rounded-full',
        getDangerBg(score),
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-3 py-1 text-sm'
      )}
    >
      {score.toFixed(1)}
      <span className="font-normal text-white/90">
        {getDangerLabel(score)}
      </span>
    </span>
  );
}
