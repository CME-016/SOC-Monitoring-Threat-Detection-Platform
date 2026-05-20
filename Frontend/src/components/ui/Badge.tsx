import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'low' | 'medium' | 'high' | 'critical' | 'default' | 'success' | 'info';
  size?: 'sm' | 'md';
}

const variantStyles = {
  low: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  high: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  critical: 'bg-red-500/20 text-red-400 border border-red-500/30',
  default: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  info: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
};

export function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} ${variantStyles[variant]}`}>
      {children}
    </span>
  );
}
