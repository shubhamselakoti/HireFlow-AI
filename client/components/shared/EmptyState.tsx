'use client';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export default function EmptyState({ icon = '📭', title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-8 text-center', className)}>
      {/* SVG blob background */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-clay-lavender rounded-full blur-2xl opacity-60 scale-150" />
        <div className="relative text-6xl leading-none">{icon}</div>
      </div>

      <h3 className="text-xl font-800 text-clay-text mb-2">{title}</h3>

      {description && (
        <p className="text-clay-muted text-sm max-w-sm leading-relaxed mb-6">{description}</p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="clay-btn clay-btn-primary px-6 py-2.5 text-sm font-700"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
