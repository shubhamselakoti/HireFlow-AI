'use client';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: string;
  tint?: 'lavender' | 'peach' | 'mint' | 'sky' | 'rose' | 'yellow';
  trend?: number;
  trendLabel?: string;
  loading?: boolean;
}

const tintStyles = {
  lavender: { bg: 'bg-clay-lavender', icon: 'bg-purple-100', text: 'text-clay-purple' },
  peach: { bg: 'bg-clay-peach', icon: 'bg-orange-100', text: 'text-orange-600' },
  mint: { bg: 'bg-clay-mint', icon: 'bg-green-100', text: 'text-green-600' },
  sky: { bg: 'bg-clay-sky', icon: 'bg-blue-100', text: 'text-blue-600' },
  rose: { bg: 'bg-clay-rose', icon: 'bg-pink-100', text: 'text-pink-600' },
  yellow: { bg: 'bg-clay-yellow', icon: 'bg-yellow-100', text: 'text-yellow-600' },
};

export default function StatCard({
  title, value, icon, tint = 'lavender', trend, trendLabel, loading = false,
}: StatCardProps) {
  const styles = tintStyles[tint];

  if (loading) {
    return (
      <div className="clay-card p-6">
        <div className="clay-skeleton h-8 w-8 rounded-xl mb-3" />
        <div className="clay-skeleton h-8 w-24 rounded-lg mb-2" />
        <div className="clay-skeleton h-4 w-32 rounded" />
      </div>
    );
  }

  return (
    <div className={cn('clay-card p-6 relative overflow-hidden', styles.bg)}>
      {/* Background blob */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 bg-white blur-xl" />

      {/* Icon */}
      {icon && (
        <div className="text-3xl mb-3 leading-none">{icon}</div>
      )}

      {/* Value */}
      <div className={cn('text-3xl font-900 font-black mb-1', styles.text)}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>

      {/* Title */}
      <div className="text-sm font-600 text-clay-muted">{title}</div>

      {/* Trend */}
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          {trend > 0 ? (
            <TrendingUp size={14} className="text-green-500" strokeWidth={2.5} />
          ) : trend < 0 ? (
            <TrendingDown size={14} className="text-red-500" strokeWidth={2.5} />
          ) : (
            <Minus size={14} className="text-clay-muted" strokeWidth={2.5} />
          )}
          <span className={cn(
            'text-xs font-700',
            trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-clay-muted'
          )}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
          {trendLabel && (
            <span className="text-xs text-clay-muted">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
