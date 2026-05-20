import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, LayoutDashboard, AlertTriangle, Globe, BarChart3,
  Bell, Search, Settings, User, ChevronRight,
  Zap, X, Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', group: 'main' },
  { to: '/threats', icon: AlertTriangle, label: 'Threat Dashboard', group: 'main' },
  { to: '/analytics', icon: BarChart3, label: 'Visitor Analytics', group: 'main' },
  { to: '/websites', icon: Globe, label: 'Websites', group: 'manage' },
  { to: '/alerts', icon: Bell, label: 'Alert Center', group: 'manage' },
  { to: '/logs', icon: Search, label: 'Log Explorer', group: 'manage' },
  { to: '/firewall', icon: Shield, label: 'Firewall', group: 'manage' },
  { to: '/settings', icon: Settings, label: 'Settings', group: 'account' },
  { to: '/profile', icon: User, label: 'Profile', group: 'account' },
];

const groups = [
  { id: 'main', label: 'Operations' },
  { id: 'manage', label: 'Management' },
  { id: 'account', label: 'Account' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { profile, user } = useAuth();
  const [openAlertsCount, setOpenAlertsCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    const fetchCount = async () => {
      try {
        const response = await fetch(`http://localhost/Backend/api/alerts.php?user_id=${user.id}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          // Count only the 'open' alerts
          const count = data.filter((a: any) => a.status === 'open').length;
          setOpenAlertsCount(count);
        }
      } catch (error) {
        console.error('Failed to fetch alerts count in sidebar:', error);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [user]);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-700/50 z-50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-4.5 h-4.5 text-white" size={18} />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            </div>
            <div>
              <span className="text-white font-bold text-sm leading-none">CyberSOC</span>
              <p className="text-[10px] text-cyan-400 font-medium tracking-widest uppercase mt-0.5">Platform</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Status bar */}
        <div className="mx-3 mt-3 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs text-emerald-400 font-medium">All Systems Active</span>
          <span className="ml-auto flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {groups.map(group => (
            <div key={group.id}>
              <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">{group.label}</p>
              <div className="space-y-0.5">
                {navItems.filter(i => i.group === group.id).map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                        isActive
                          ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={16} className={isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'} />
                        <span>{label}</span>
                        {isActive && <ChevronRight size={14} className="ml-auto text-cyan-500" />}
                        {label === 'Alert Center' && openAlertsCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {openAlertsCount}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User info */}
        <div className="p-3 border-t border-slate-700/50">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {(profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{profile?.full_name || 'Analyst'}</p>
              <div className="flex items-center gap-1">
                <Lock size={10} className="text-slate-500" />
                <p className="text-xs text-slate-500 capitalize">{profile?.role || 'analyst'}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
