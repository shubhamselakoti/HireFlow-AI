'use client';
import { cn } from '@/lib/utils';
import { ChartSkeleton } from './SkeletonLoader';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  action?: React.ReactNode;
}

export default function ChartCard({
  title, subtitle, children, className, loading = false, action,
}: ChartCardProps) {
  if (loading) return <ChartSkeleton />;

  return (
    <div className={cn('clay-card p-6', className)}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-base font-800 text-clay-text">{title}</h3>
          {subtitle && <p className="text-xs text-clay-muted mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
