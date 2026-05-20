import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Shield, Clock, Save, CheckCircle, Activity, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/Badge';

export function ProfilePage() {
  const { profile, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    timezone: profile?.timezone ?? 'UTC',
  });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await updateProfile(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const recentActivity = [
    { action: 'Logged in', time: '2 minutes ago', ip: '192.168.1.1', icon: LogIn, color: 'text-emerald-400' },
    { action: 'Acknowledged alert', time: '15 minutes ago', ip: '192.168.1.1', icon: Activity, color: 'text-yellow-400' },
    { action: 'Added website monitoring', time: '1 hour ago', ip: '192.168.1.1', icon: Shield, color: 'text-cyan-400' },
    { action: 'Changed settings', time: '3 hours ago', ip: '192.168.1.1', icon: Lock, color: 'text-slate-400' },
    { action: 'Resolved 3 alerts', time: '1 day ago', ip: '192.168.1.1', icon: CheckCircle, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-white">User Profile</h2>
        <p className="text-sm text-slate-400">Manage your account information</p>
      </div>

      {/* Profile card */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-cyan-500/25">
              {(profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-800" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{profile?.full_name || 'Unknown User'}</h3>
            <p className="text-sm text-slate-400">{profile?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="info">{profile?.role || 'analyst'}</Badge>
              {profile?.two_factor_enabled && <Badge variant="success">2FA Enabled</Badge>}
            </div>
          </div>
          <div className="ml-auto text-right hidden sm:block">
            <p className="text-xs text-slate-500">Member since</p>
            <p className="text-sm text-slate-300">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-700/50">
          <User size={16} className="text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Personal Information</h3>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400 block mb-1.5">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={form.full_name}
                  onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="John Analyst"
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={profile?.email || ''}
                  readOnly
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-400 focus:outline-none cursor-not-allowed"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1.5">Phone</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+1 234 567 8900"
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1.5">Timezone</label>
              <div className="relative">
                <Clock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <select
                  value={form.timezone}
                  onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                >
                  {['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo'].map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-60"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : saved ? <CheckCircle size={15} /> : <Save size={15} />}
              {saved ? 'Saved!' : 'Save Profile'}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-700/50">
          <Activity size={16} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
        </div>
        <div className="divide-y divide-slate-700/30">
          {recentActivity.map(({ action, time, ip, icon: Icon, color }, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-700/30 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                <Icon size={14} className={color} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">{action}</p>
                <p className="text-xs text-slate-500 font-mono">From: {ip}</p>
              </div>
              <p className="text-xs text-slate-500 flex-shrink-0">{time}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Security info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <Shield size={16} className="text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Security Status</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Account Status', value: 'Active', color: 'text-emerald-400' },
            { label: 'Role', value: profile?.role || 'analyst', color: 'text-cyan-400' },
            { label: 'Last Login', value: profile?.last_login ? new Date(profile.last_login).toLocaleDateString() : 'Now', color: 'text-slate-300' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-900/50 rounded-xl p-3">
              <p className="text-xs text-slate-500">{label}</p>
              <p className={`text-sm font-medium mt-0.5 capitalize ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
