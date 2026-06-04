'use client';
import { cn } from '../../lib/utils';

interface ClayCardProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  tint?: 'lavender' | 'peach' | 'mint' | 'sky' | 'rose' | 'yellow' | 'none';
  onClick?: () => void;
  hover?: boolean;
}

const tintMap = {
  lavender: 'bg-clay-lavender',
  peach: 'bg-clay-peach',
  mint: 'bg-clay-mint',
  sky: 'bg-clay-sky',
  rose: 'bg-clay-rose',
  yellow: 'bg-clay-yellow',
  none: 'bg-white',
};

const sizeMap = {
  sm: 'clay-card-sm',
  md: 'clay-card',
  lg: 'clay-card-lg',
};

export default function ClayCard({
  children,
  className,
  size = 'md',
  tint = 'none',
  onClick,
  hover = false,
}: ClayCardProps) {
  return (
    <div
      className={cn(
        sizeMap[size],
        tintMap[tint],
        hover && 'cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-clay-lg',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
