'use client';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ClayButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const variantStyles = {
  primary: 'clay-btn clay-btn-primary text-white',
  outline: 'clay-btn clay-btn-outline',
  ghost: 'clay-btn bg-transparent hover:bg-clay-lavender text-clay-text border border-transparent hover:border-clay-lavender',
  danger: 'clay-btn bg-clay-rose text-red-600 hover:bg-red-100 border border-red-200',
  success: 'clay-btn bg-clay-mint text-green-700 hover:bg-green-100 border border-green-200',
};

const sizeStyles = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-8 py-3 text-base',
};

export default function ClayButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  icon,
  iconPosition = 'left',
  ...props
}: ClayButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-700 transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        icon && iconPosition === 'left' && icon
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  );
}
