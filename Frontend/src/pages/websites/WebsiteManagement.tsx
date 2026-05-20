import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Plus, Shield, Activity, AlertTriangle, CheckCircle,
  XCircle, Settings, Trash2, ToggleLeft, ToggleRight, X,
  Link, Bell, Eye
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

interface WebsiteEntry {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'inactive' | 'error';
  monitoring_enabled: boolean;
  honeypot_enabled: boolean;
  fim_enabled: boolean;
  uptime_percentage: number;
  total_requests: number;
  total_attacks: number;
  alert_threshold: 'low' | 'medium' | 'high' | 'critical';
}

export function WebsiteManagement() {
  const { user } = useAuth();
  const [websites, setWebsites] = useState<WebsiteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSite, setNewSite] = useState({ name: '', domain: '', url: '', alert_threshold: 'medium' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    async function loadWebsites() {
      if (!user) return;
      try {
        setLoading(true);
        const data = await api.websites.getAll(user.id);
        const mapped: WebsiteEntry[] = data.map((site: any) => ({
          id: site.id,
          name: site.name,
          domain: site.url,
          status: site.status || 'active',
          monitoring_enabled: true,
          honeypot_enabled: false,
          fim_enabled: false,
          uptime_percentage: 100,
          total_requests: site.requests_count || 0,
          total_attacks: site.alerts_count || 0,
          alert_threshold: 'medium'
        }));
        setWebsites(mapped);
      } catch (err: any) {
        setError(err.message || 'Failed to load websites');
      } finally {
        setLoading(false);
      }
    }
    loadWebsites();
  }, [user]);

  function toggleMonitoring(id: string) {
    setWebsites(prev => prev.map(w => w.id === id ? { ...w, monitoring_enabled: !w.monitoring_enabled } : w));
  }

  function toggleFeature(id: string, feature: 'honeypot_enabled' | 'fim_enabled') {
    setWebsites(prev => prev.map(w => w.id === id ? { ...w, [feature]: !w[feature] } : w));
  }

  async function removeWebsite(id: string) {
    if (!user) return;
    if (!confirm('Are you sure you want to remove this website from monitoring?')) return;
    try {
      await api.websites.delete(user.id, id);
      setWebsites(prev => prev.filter(w => w.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to remove website');
    }
  }

  async function addWebsite(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    try {
      setAdding(true);
      const data = await api.websites.create(user.id, {
        name: newSite.name,
        url: newSite.domain
      });
      const newEntry: WebsiteEntry = {
        id: data.id,
        name: data.name,
        domain: data.url,
        status: data.status || 'active',
        monitoring_enabled: true,
        honeypot_enabled: false,
        fim_enabled: false,
        uptime_percentage: 100,
        total_requests: 0,
        total_attacks: 0,
        alert_threshold: 'medium'
      };
      setWebsites(prev => [newEntry, ...prev]);
      setNewSite({ name: '', domain: '', url: '', alert_threshold: 'medium' });
      setShowAddModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to add website');
    } finally {
      setAdding(false);
    }
  }

  const statusColor = (s: string) => s === 'active' ? 'text-emerald-400' : s === 'inactive' ? 'text-slate-400' : 'text-red-400';
  const statusBg = (s: string) => s === 'active' ? 'bg-emerald-500/20' : s === 'inactive' ? 'bg-slate-500/20' : 'bg-red-500/20';
  const StatusIcon = ({ s }: { s: string }) => s === 'active' ? <CheckCircle size={14} /> : s === 'error' ? <XCircle size={14} /> : <AlertTriangle size={14} />;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Website Management</h2>
          <p className="text-sm text-slate-400">{websites.length} websites under monitoring</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-cyan-500/20"
        >
          <Plus size={16} />
          Add Website
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Sites', value: websites.length, color: 'text-cyan-400' },
          { label: 'Active', value: websites.filter(w => w.status === 'active').length, color: 'text-emerald-400' },
          { label: 'With Honeypot', value: websites.filter(w => w.honeypot_enabled).length, color: 'text-orange-400' },
          { label: 'FIM Enabled', value: websites.filter(w => w.fim_enabled).length, color: 'text-blue-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Website cards */}
      <div className="space-y-4">
        {websites.map((site, i) => (
          <motion.div
            key={site.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/50 transition-all"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="p-2.5 bg-slate-700/50 rounded-lg flex-shrink-0">
                <Globe size={20} className={statusColor(site.status)} />
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-sm font-semibold text-white">{site.name}</h3>
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusBg(site.status)} ${statusColor(site.status)}`}>
                    <StatusIcon s={site.status} />
                    <span className="capitalize">{site.status}</span>
                  </div>
                  <Badge variant={site.alert_threshold}>{site.alert_threshold} threshold</Badge>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Link size={12} className="text-slate-500" />
                  <span className="text-sm text-slate-400 font-mono">{site.domain}</span>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-6 mt-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Activity size={13} className="text-cyan-400" />
                    <span className="text-xs text-slate-300">{site.total_requests.toLocaleString()} requests</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-orange-400" />
                    <span className="text-xs text-slate-300">{site.total_attacks.toLocaleString()} attacks</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield size={13} className="text-emerald-400" />
                    <span className="text-xs text-slate-300">{site.uptime_percentage}% uptime</span>
                  </div>
                </div>

                {/* Feature toggles */}
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  <button
                    onClick={() => toggleMonitoring(site.id)}
                    className="flex items-center gap-1.5 text-xs transition-colors"
                  >
                    {site.monitoring_enabled
                      ? <ToggleRight size={16} className="text-emerald-400" />
                      : <ToggleLeft size={16} className="text-slate-500" />
                    }
                    <span className={site.monitoring_enabled ? 'text-emerald-400' : 'text-slate-500'}>Monitoring</span>
                  </button>
                  <button
                    onClick={() => toggleFeature(site.id, 'honeypot_enabled')}
                    className="flex items-center gap-1.5 text-xs transition-colors"
                  >
                    {site.honeypot_enabled
                      ? <ToggleRight size={16} className="text-orange-400" />
                      : <ToggleLeft size={16} className="text-slate-500" />
                    }
                    <span className={site.honeypot_enabled ? 'text-orange-400' : 'text-slate-500'}>Honeypot</span>
                  </button>
                  <button
                    onClick={() => toggleFeature(site.id, 'fim_enabled')}
                    className="flex items-center gap-1.5 text-xs transition-colors"
                  >
                    {site.fim_enabled
                      ? <ToggleRight size={16} className="text-blue-400" />
                      : <ToggleLeft size={16} className="text-slate-500" />
                    }
                    <span className={site.fim_enabled ? 'text-blue-400' : 'text-slate-500'}>File Integrity</span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all">
                  <Eye size={15} />
                </button>
                <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all">
                  <Bell size={15} />
                </button>
                <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all">
                  <Settings size={15} />
                </button>
                <button
                  onClick={() => removeWebsite(site.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Website Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-white">Add Website</h3>
                  <p className="text-sm text-slate-400">Start monitoring a new domain</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={addWebsite} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-1.5">Site Name</label>
                  <input
                    value={newSite.name}
                    onChange={e => setNewSite(p => ({ ...p, name: e.target.value }))}
                    required
                    placeholder="My Website"
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-1.5">Domain</label>
                  <input
                    value={newSite.domain}
                    onChange={e => setNewSite(p => ({ ...p, domain: e.target.value }))}
                    required
                    placeholder="example.com"
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-1.5">Alert Threshold</label>
                  <select
                    value={newSite.alert_threshold}
                    onChange={e => setNewSite(p => ({ ...p, alert_threshold: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-slate-600 text-slate-300 hover:text-white rounded-xl text-sm transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={adding} className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                    {adding ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={15} />Add Site</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
