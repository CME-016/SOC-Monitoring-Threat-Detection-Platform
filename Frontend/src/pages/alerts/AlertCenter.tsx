import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, AlertTriangle, Filter, Search, RefreshCw, ChevronDown, Eye, Check, ShieldCheck, XCircle, Trash2 } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

import { Alert } from '../../types';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const ATTACK_TYPES = ['All', 'SQL Injection', 'XSS', 'Brute Force', 'DDoS', 'Port Scan', 'Directory Traversal', 'Bot Traffic'];
const SEVERITIES = ['All', 'critical', 'high', 'medium', 'low'];
const STATUSES = ['All', 'open', 'acknowledged', 'resolved', 'false_positive'];

export function AlertCenter() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    if (!user) return;
    try {
      const data = await api.alerts.getAll(user.id);
      
      if (Array.isArray(data)) {
        setAlerts(data);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const refresh = () => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 800);
  };

  const acknowledgeAlert = async (id: string) => {
    if (!user) return;
    try {
      await fetch(`http://localhost/Backend/api/alerts.php?user_id=${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'acknowledged' }),
      });
      loadData(); // Refresh list
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const resolveAlert = async (id: string) => {
    if (!user) return;
    try {
      await fetch(`http://localhost/Backend/api/alerts.php?user_id=${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'resolved' }),
      });
      loadData(); // Refresh list
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const markFalsePositive = async (id: string) => {
    if (!user) return;
    try {
      await fetch(`http://localhost/Backend/api/alerts.php?user_id=${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'false_positive' }),
      });
      loadData(); // Refresh list
    } catch (error) {
      console.error('Failed to mark false positive:', error);
    }
  };

  const deleteAlert = async (id: string) => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to delete this alert?')) return;
    try {
      await fetch(`http://localhost/Backend/api/alerts.php?user_id=${user.id}&id=${id}`, {
        method: 'DELETE',
      });
      loadData(); // Refresh list
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  const clearAllResolved = async () => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to delete ALL Resolved and False Positive alerts?')) return;
    try {
      await fetch(`http://localhost/Backend/api/alerts.php?user_id=${user.id}`, {
        method: 'DELETE',
      });
      loadData(); // Refresh list
    } catch (error) {
      console.error('Failed to clear alerts:', error);
    }
  };

  const filtered = alerts.filter(a => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.ip_address.includes(search)) return false;
    if (severityFilter !== 'All' && a.severity !== severityFilter) return false;
    if (typeFilter !== 'All' && a.attack_type !== typeFilter) return false;
    if (statusFilter !== 'All' && a.status !== statusFilter) return false;
    return true;
  });

  const openCount = alerts.filter(a => a.status === 'open').length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status === 'open').length;

  const statusLabel = (s: string) => s === 'open' ? 'Open' : s === 'acknowledged' ? 'Ack' : s === 'resolved' ? 'Resolved' : 'False +';
  const statusVariant = (s: string) => s === 'open' ? 'high' : s === 'acknowledged' ? 'medium' : s === 'resolved' ? 'success' : 'default';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Alert Center
            {criticalCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">{criticalCount} critical</span>
            )}
          </h2>
          <p className="text-sm text-slate-400">{openCount} open alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={clearAllResolved} 
            className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm border border-red-500/20 transition-all"
            title="Delete all Resolved and False Positive alerts"
          >
            <Trash2 size={14} />
            Clear Resolved
          </button>
          <button onClick={refresh} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm border border-slate-700 transition-all">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Open', count: alerts.filter(a => a.status === 'open').length, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
          { label: 'Acknowledged', count: alerts.filter(a => a.status === 'acknowledged').length, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
          { label: 'Resolved', count: alerts.filter(a => a.status === 'resolved').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'False Positive', count: alerts.filter(a => a.status === 'false_positive').length, color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`border rounded-xl p-4 ${bg}`}>
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
            <p className="text-xs text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or IP..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-slate-500" />
          {[
            { value: severityFilter, onChange: setSeverityFilter, options: SEVERITIES, label: 'Severity' },
            { value: typeFilter, onChange: setTypeFilter, options: ATTACK_TYPES, label: 'Type' },
            { value: statusFilter, onChange: setStatusFilter, options: STATUSES, label: 'Status' },
          ].map(({ value, onChange, options, label }) => (
            <div key={label} className="relative">
              <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="appearance-none bg-slate-800 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50 transition-all cursor-pointer"
              >
                {options.map(o => <option key={o} value={o}>{o === 'All' ? `All ${label}` : o}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          ))}
        </div>
        <span className="text-xs text-slate-500">{filtered.length} results</span>
      </div>

      {/* Alert List */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: i * 0.02 }}
              className={`bg-slate-800/50 backdrop-blur-sm border rounded-xl p-4 hover:border-slate-600/50 transition-all cursor-pointer ${alert.severity === 'critical' ? 'border-red-500/30' :
                  alert.severity === 'high' ? 'border-orange-500/20' :
                    'border-slate-700/50'
                }`}
              onClick={() => setSelectedAlert(alert)}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${alert.severity === 'critical' ? 'bg-red-500/20' :
                    alert.severity === 'high' ? 'bg-orange-500/20' :
                      alert.severity === 'medium' ? 'bg-yellow-500/20' : 'bg-emerald-500/20'
                  }`}>
                  <AlertTriangle size={14} className={
                    alert.severity === 'critical' ? 'text-red-400' :
                      alert.severity === 'high' ? 'text-orange-400' :
                        alert.severity === 'medium' ? 'text-yellow-400' : 'text-emerald-400'
                  } />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">{alert.title}</span>
                    <Badge variant={alert.severity}>{alert.severity}</Badge>
                    <Badge variant={statusVariant(alert.status) as 'low' | 'medium' | 'high' | 'critical' | 'default' | 'success' | 'info'}>{statusLabel(alert.status)}</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{alert.description}</p>
                  <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                    <span className="text-xs font-mono text-slate-500">IP: {alert.ip_address}</span>
                    <span className="text-xs text-slate-500 font-mono">{alert.url}</span>
                    <span className="text-xs text-slate-500">{new Date(alert.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {alert.status === 'open' && (
                    <>
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="p-1.5 text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all"
                        title="Acknowledge Alert"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                        title="Resolve Alert"
                      >
                        <ShieldCheck size={14} />
                      </button>
                      <button
                        onClick={() => markFalsePositive(alert.id)}
                        className="p-1.5 text-slate-400 hover:bg-slate-500/10 rounded-lg transition-all"
                        title="Mark as False Positive"
                      >
                        <XCircle size={14} />
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => setSelectedAlert(alert)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                    title="View Details"
                  >
                    <Eye size={14} />
                  </button>
                  <button 
                    onClick={() => deleteAlert(alert.id)}
                    className="p-1.5 text-slate-600 hover:text-red-500 rounded-lg transition-all"
                    title="Delete Alert"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Bell size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No alerts match your filters</p>
          </div>
        )}
      </div>

      {/* Alert Detail Modal */}
      <AnimatePresence>
        {selectedAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAlert(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedAlert.title}</h3>
                  <p className="text-sm text-slate-400">{new Date(selectedAlert.created_at).toLocaleString()}</p>
                </div>
                <button onClick={() => setSelectedAlert(null)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={selectedAlert.severity}>{selectedAlert.severity}</Badge>
                  <Badge variant="info">{selectedAlert.attack_type}</Badge>
                  <Badge variant={statusVariant(selectedAlert.status) as 'default'}>{statusLabel(selectedAlert.status)}</Badge>
                </div>
                {[
                  { label: 'Description', value: selectedAlert.description },
                  { label: 'Source IP', value: selectedAlert.ip_address, mono: true },
                  { label: 'Target URL', value: selectedAlert.url, mono: true },
                  { label: 'Payload', value: selectedAlert.payload, mono: true },
                ].map(({ label, value, mono }) => (
                  <div key={label}>
                    <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                    <p className={`text-sm text-slate-300 ${mono ? 'font-mono bg-slate-900/50 px-3 py-2 rounded-lg text-xs' : ''}`}>{value || 'N/A'}</p>
                  </div>
                ))}
              </div>
              {selectedAlert.status === 'open' && (
                <div className="flex gap-3 mt-5">
                  <button onClick={() => { acknowledgeAlert(selectedAlert.id); setSelectedAlert(null); }} className="flex-1 py-2.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                    <Check size={14} />Acknowledge
                  </button>
                  <button onClick={() => { resolveAlert(selectedAlert.id); setSelectedAlert(null); }} className="flex-1 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                    <ShieldCheck size={14} />Resolve
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
