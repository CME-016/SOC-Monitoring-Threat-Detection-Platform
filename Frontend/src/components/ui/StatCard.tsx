import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Video as LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  children?: ReactNode;
  pulse?: boolean;
}

export function StatCard({ title, value, change, changeType = 'neutral', icon: Icon, iconColor = 'text-cyan-400', iconBg = 'bg-cyan-500/20', children, pulse }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 overflow-hidden group hover:border-slate-600/50 transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-700/10 to-transparent pointer-events-none" />
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-lg ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {pulse && (
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-white tabular-nums">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        <p className="text-sm text-slate-400">{title}</p>
      </div>
      {change && (
        <p className={`text-xs mt-2 ${changeType === 'up' ? 'text-red-400' : changeType === 'down' ? 'text-emerald-400' : 'text-slate-400'}`}>
          {change}
        </p>
      )}
      {children}
    </motion.div>
  );
}
