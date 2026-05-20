import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, Shield, Key, Globe, Save, CheckCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export function SettingsPage() {
  const { profile, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    { id: 'email', label: 'Email Alerts', description: 'Receive security alerts via email', enabled: profile?.notifications_email ?? true },
    { id: 'browser', label: 'Browser Notifications', description: 'Push notifications in the browser', enabled: profile?.notifications_browser ?? true },
    { id: 'telegram', label: 'Telegram Alerts', description: 'Send alerts to Telegram bot', enabled: profile?.notifications_telegram ?? false },
  ]);

  const [secSettings, setSecSettings] = useState({
    two_factor: profile?.two_factor_enabled ?? false,
    session_timeout: '30',
    alert_threshold: 'medium',
    auto_block: true,
    block_duration: '24',
    threat_intel: true,
    honeypot: true,
  });

  const [general, setGeneral] = useState({
    timezone: profile?.timezone ?? 'UTC',
    language: 'en',
    date_format: 'MM/DD/YYYY',
  });

  function toggleNotification(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n));
  }

  async function save() {
    setSaving(true);
    const emailNotif = notifications.find(n => n.id === 'email')?.enabled ?? true;
    const browserNotif = notifications.find(n => n.id === 'browser')?.enabled ?? true;
    const telegramNotif = notifications.find(n => n.id === 'telegram')?.enabled ?? false;
    await updateProfile({
      notifications_email: emailNotif,
      notifications_browser: browserNotif,
      notifications_telegram: telegramNotif,
      two_factor_enabled: secSettings.two_factor,
      timezone: general.timezone,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const sections = [
    { id: 'notifications', icon: Bell, label: 'Notifications', color: 'text-cyan-400' },
    { id: 'security', icon: Shield, label: 'Security', color: 'text-emerald-400' },
    { id: 'general', icon: Settings, label: 'General', color: 'text-slate-400' },
    { id: 'api', icon: Key, label: 'API Keys', color: 'text-orange-400' },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <p className="text-sm text-slate-400">Configure platform preferences</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-60"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            <CheckCircle size={15} />
          ) : (
            <Save size={15} />
          )}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Notifications */}
      <Section title="Notifications" icon={Bell} iconColor="text-cyan-400">
        <div className="space-y-4">
          {notifications.map(notif => (
            <div key={notif.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{notif.label}</p>
                <p className="text-xs text-slate-400">{notif.description}</p>
              </div>
              <button onClick={() => toggleNotification(notif.id)}>
                {notif.enabled
                  ? <ToggleRight size={28} className="text-cyan-400" />
                  : <ToggleLeft size={28} className="text-slate-600" />
                }
              </button>
            </div>
          ))}
          {notifications.find(n => n.id === 'telegram')?.enabled && (
            <div>
              <label className="text-sm text-slate-400 block mb-1.5">Telegram Chat ID</label>
              <input
                placeholder="-1001234567890"
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>
          )}
        </div>
      </Section>

      {/* Security */}
      <Section title="Security" icon={Shield} iconColor="text-emerald-400">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Two-Factor Authentication</p>
              <p className="text-xs text-slate-400">Add extra security to your account</p>
            </div>
            <button onClick={() => setSecSettings(p => ({ ...p, two_factor: !p.two_factor }))}>
              {secSettings.two_factor
                ? <ToggleRight size={28} className="text-emerald-400" />
                : <ToggleLeft size={28} className="text-slate-600" />
              }
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Auto IP Blocking</p>
              <p className="text-xs text-slate-400">Automatically block IPs after attacks</p>
            </div>
            <button onClick={() => setSecSettings(p => ({ ...p, auto_block: !p.auto_block }))}>
              {secSettings.auto_block
                ? <ToggleRight size={28} className="text-emerald-400" />
                : <ToggleLeft size={28} className="text-slate-600" />
              }
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Threat Intelligence Feed</p>
              <p className="text-xs text-slate-400">Use external threat intelligence data</p>
            </div>
            <button onClick={() => setSecSettings(p => ({ ...p, threat_intel: !p.threat_intel }))}>
              {secSettings.threat_intel
                ? <ToggleRight size={28} className="text-cyan-400" />
                : <ToggleLeft size={28} className="text-slate-600" />
              }
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400 block mb-1.5">Session Timeout (min)</label>
              <select
                value={secSettings.session_timeout}
                onChange={e => setSecSettings(p => ({ ...p, session_timeout: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              >
                {['15', '30', '60', '120', '240'].map(v => <option key={v} value={v}>{v} minutes</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-1.5">Alert Threshold</label>
              <select
                value={secSettings.alert_threshold}
                onChange={e => setSecSettings(p => ({ ...p, alert_threshold: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              >
                {['low', 'medium', 'high', 'critical'].map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1.5">Auto-Block Duration (hours)</label>
            <select
              value={secSettings.block_duration}
              onChange={e => setSecSettings(p => ({ ...p, block_duration: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
            >
              {['1', '6', '12', '24', '48', '168'].map(v => <option key={v} value={v}>{v === '168' ? '7 days' : `${v} hour${v !== '1' ? 's' : ''}`}</option>)}
            </select>
          </div>
        </div>
      </Section>

      {/* General */}
      <Section title="General" icon={Globe} iconColor="text-slate-400">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-400 block mb-1.5">Timezone</label>
            <select
              value={general.timezone}
              onChange={e => setGeneral(p => ({ ...p, timezone: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
            >
              {['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Shanghai'].map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1.5">Language</label>
            <select
              value={general.language}
              onChange={e => setGeneral(p => ({ ...p, language: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
            >
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </div>
      </Section>

      {/* API Keys */}
      <Section title="API Keys" icon={Key} iconColor="text-orange-400">
        <div className="space-y-3">
          <p className="text-sm text-slate-400">Manage API keys for external integrations.</p>
          {[
            { label: 'Platform API Key', value: 'sk-soc-••••••••••••••••••••••••••••••••', color: 'text-cyan-400' },
            { label: 'Webhook Secret', value: 'whsec-••••••••••••••••••••••••••••••••', color: 'text-orange-400' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <label className="text-xs text-slate-500 block mb-1">{label}</label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={value}
                  className={`flex-1 bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-sm font-mono ${color} focus:outline-none`}
                />
                <button className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs transition-all">
                  Copy
                </button>
                <button className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs transition-all">
                  Rotate
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, icon: Icon, iconColor, children }: { title: string; icon: React.ElementType; iconColor: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden"
    >
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-700/50">
        <Icon size={16} className={iconColor} />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  );
}
