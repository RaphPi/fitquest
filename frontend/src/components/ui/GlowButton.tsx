import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variantClasses = {
  primary: 'bg-primary text-white hover:bg-[#4f46e5] hover:shadow-glow border-primary/40',
  danger: 'bg-danger text-white hover:bg-[#dc2626] hover:shadow-[0_0_20px_-2px_var(--danger)] border-danger/40',
  success: 'bg-success text-white hover:bg-[#16a34a] hover:shadow-[0_0_20px_-2px_var(--success)] border-success/40',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

export default function GlowButton({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: GlowButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        'rounded-lg border font-display font-bold uppercase tracking-widest transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </button>
  );
}
