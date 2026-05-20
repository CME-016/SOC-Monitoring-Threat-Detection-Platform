import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Bell, Search, ChevronDown, LogOut, User, Settings, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const notifications = [
    { id: 1, text: 'Critical SQL Injection detected on example.com', time: '2m ago', severity: 'critical' },
    { id: 2, text: 'Brute force attempt blocked — 192.168.1.1', time: '15m ago', severity: 'high' },
    { id: 3, text: 'New website added to monitoring', time: '1h ago', severity: 'low' },
  ];

  return (
    <header className="h-14 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm flex items-center px-4 gap-4 sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-slate-400 hover:text-white transition-colors p-1"
      >
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2">
        <Shield size={16} className="text-cyan-400" />
        <h1 className="text-sm font-semibold text-white">{title}</h1>
      </div>

      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search threats, IPs, logs..."
            className="w-full bg-slate-800 border border-slate-700/50 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-800/80 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 border border-slate-600 rounded px-1">⌘K</kbd>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Live indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">Live</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); }}
            className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          >
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-1 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-xl shadow-black/40 overflow-hidden"
              >
                <div className="p-3 border-b border-slate-700">
                  <p className="text-sm font-semibold text-white">Notifications</p>
                  <p className="text-xs text-slate-400">{notifications.length} unread alerts</p>
                </div>
                <div className="divide-y divide-slate-700/50">
                  {notifications.map(n => (
                    <div key={n.id} className="p-3 hover:bg-slate-700/50 transition-colors cursor-pointer">
                      <div className="flex items-start gap-2">
                        <span className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${
                          n.severity === 'critical' ? 'bg-red-500' :
                          n.severity === 'high' ? 'bg-orange-500' : 'bg-emerald-500'
                        }`} />
                        <div>
                          <p className="text-xs text-slate-300 leading-relaxed">{n.text}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-slate-700">
                  <button onClick={() => { navigate('/alerts'); setNotifOpen(false); }} className="w-full text-xs text-cyan-400 hover:text-cyan-300 py-1 transition-colors">
                    View all alerts
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-800 rounded-lg transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {(profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-slate-300 hidden sm:block">
              {profile?.full_name?.split(' ')[0] || 'Analyst'}
            </span>
            <ChevronDown size={14} className="text-slate-500 hidden sm:block" />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-1 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-xl shadow-black/40 overflow-hidden"
              >
                <div className="p-3 border-b border-slate-700">
                  <p className="text-sm font-semibold text-white">{profile?.full_name || 'Analyst'}</p>
                  <p className="text-xs text-slate-400">{profile?.email}</p>
                </div>
                <div className="p-1">
                  {[
                    { icon: User, label: 'Profile', to: '/profile' },
                    { icon: Settings, label: 'Settings', to: '/settings' },
                  ].map(({ icon: Icon, label, to }) => (
                    <button
                      key={to}
                      onClick={() => { navigate(to); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                    >
                      <Icon size={15} className="text-slate-500" />
                      {label}
                    </button>
                  ))}
                  <div className="border-t border-slate-700 mt-1 pt-1">
                    <button
                      onClick={async () => { await signOut(); navigate('/login'); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
