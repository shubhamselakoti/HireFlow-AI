'use client';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('clay-skeleton', className)} />;
}

export function StatCardSkeleton() {
  return (
    <div className="clay-card p-6">
      <Skeleton className="h-8 w-8 rounded-xl mb-3" />
      <Skeleton className="h-9 w-28 rounded-lg mb-2" />
      <Skeleton className="h-4 w-36 rounded" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full rounded" />
        </td>
      ))}
    </tr>
  );
}

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="clay-card p-6">
      <Skeleton className="h-5 w-40 rounded mb-6" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="clay-card p-6 flex gap-4 items-start">
      <Skeleton className="h-20 w-20 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-6 w-48 rounded" />
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-4 w-40 rounded" />
      </div>
    </div>
  );
}

export default Skeleton;
