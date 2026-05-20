import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, AlertTriangle, Globe, Users, Activity, Ban, TrendingUp,
  Eye, Zap, Clock, ChevronRight, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { ATTACK_TYPE_COLORS, SEVERITY_COLORS } from '../../utils/mockData';
import { AttackReport, Alert } from '../../types';
import { useAuth } from '../../context/AuthContext';

const PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#06b6d4', '#10b981', '#6366f1', '#ec4899', '#64748b'];

export function DashboardPage() {
  const { user } = useAuth();
  const [attacks, setAttacks] = useState<AttackReport[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [pieData, setPieData] = useState<{name: string, value: number}[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [counts, setCounts] = useState({
    total_requests: 0,
    total_attacks: 0,
    blocked_requests: 0,
    critical_alerts: 0,
    active_visitors: 0,
    total_websites: 0
  });
  const [severityCounts, setSeverityCounts] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost/Backend/api/dashboard.php?user_id=${user.id}`);
      const data = await response.json();
      
      setCounts({
        total_requests: data.total_requests || 0,
        total_attacks: data.total_attacks || 0,
        blocked_requests: data.blocked_requests || 0,
        critical_alerts: data.critical_alerts || 0,
        active_visitors: data.active_visitors || 0,
        total_websites: data.total_websites || 0
      });
      
      setPieData(data.pie_data || []);
      setSeverityCounts(data.severity_counts || {});
      
      // Format chart data for Recharts
      const formattedChart = (data.chart_data || []).map((s: any) => ({
        date: new Date(s.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        requests: parseInt(s.requests),
        attacks: parseInt(s.attacks),
        blocked: 0 // We can calculate this if we have it
      }));
      setChartData(formattedChart);
      
      setAttacks(data.recent_attacks || []);
      setAlerts(data.recent_alerts || []);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const totalAttacks = counts.total_attacks;
  const criticalCount = counts.critical_alerts;
  const blockedCount = counts.blocked_requests;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Security Overview</h2>
          <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1.5">
            <Clock size={12} />
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm transition-all border border-slate-700"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Threats"
          value={totalAttacks}
          change="+12% vs yesterday"
          changeType="up"
          icon={AlertTriangle}
          iconColor="text-red-400"
          iconBg="bg-red-500/20"
          pulse
        />
        <StatCard
          title="Websites Monitored"
          value={counts.total_websites}
          change="All systems nominal"
          changeType="neutral"
          icon={Globe}
          iconColor="text-cyan-400"
          iconBg="bg-cyan-500/20"
        />
        <StatCard
          title="IPs Blocked"
          value={blockedCount}
          change="+3 in last hour"
          changeType="up"
          icon={Ban}
          iconColor="text-orange-400"
          iconBg="bg-orange-500/20"
        />
        <StatCard
          title="Total Requests"
          value={counts.total_requests}
          change="Today"
          changeType="neutral"
          icon={Activity}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/20"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Critical Alerts"
          value={criticalCount}
          icon={Zap}
          iconColor="text-red-400"
          iconBg="bg-red-500/20"
          pulse={criticalCount > 0}
        />
        <StatCard
          title="Active Visitors"
          value={counts.active_visitors}
          icon={Users}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/20"
        />
        <StatCard
          title="Attacks Blocked"
          value={`${Math.round((blockedCount / Math.max(totalAttacks, 1)) * 100)}%`}
          change="Block rate"
          icon={Shield}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/20"
        />
        <StatCard
          title="Uptime"
          value="99.8%"
          change="30 days avg"
          icon={TrendingUp}
          iconColor="text-cyan-400"
          iconBg="bg-cyan-500/20"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Chart */}
        <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Traffic & Attack Trends</h3>
              <p className="text-xs text-slate-400">Last 14 days</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />Requests</span>
              <span className="flex items-center gap-1.5 text-slate-400"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Attacks</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="atkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area type="monotone" dataKey="requests" stroke="#06b6d4" strokeWidth={2} fill="url(#reqGrad)" />
              <Area type="monotone" dataKey="attacks" stroke="#ef4444" strokeWidth={2} fill="url(#atkGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Attack Types Pie */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">Attack Distribution</h3>
            <p className="text-xs text-slate-400">By attack type</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={entry.name} fill={ATTACK_TYPE_COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {pieData.slice(0, 4).map(({ name, value }) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ATTACK_TYPE_COLORS[name] || '#64748b' }} />
                  <span className="text-slate-300 truncate max-w-[110px]">{name}</span>
                </div>
                <span className="text-slate-400 font-mono">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attacks Feed */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-red-400" />
              <h3 className="text-sm font-semibold text-white">Live Attack Feed</h3>
              <span className="flex h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
            </div>
            <span className="text-xs text-slate-400">{attacks.length} events</span>
          </div>
          <div className="divide-y divide-slate-700/30 max-h-64 overflow-y-auto">
            {attacks.slice(0, 8).map((attack, i) => (
              <motion.div
                key={attack.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 hover:bg-slate-700/30 transition-colors"
              >
                <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${
                  attack.severity === 'critical' ? 'bg-red-500' :
                  attack.severity === 'high' ? 'bg-orange-500' :
                  attack.severity === 'medium' ? 'bg-yellow-500' : 'bg-emerald-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white">{attack.attack_type}</span>
                    <Badge variant={attack.severity}>{attack.severity}</Badge>
                  </div>
                  <p className="text-xs text-slate-400 font-mono truncate">{attack.ip_address} — {attack.url}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-slate-500">
                    {new Date(attack.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {attack.blocked && (
                    <span className="text-[10px] text-emerald-400">Blocked</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Severity Breakdown + Recent Alerts */}
        <div className="space-y-4">
          {/* Severity bar chart */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Alert Severity Distribution</h3>
            <div className="space-y-2.5">
              {(['critical', 'high', 'medium', 'low'] as const).map(sev => {
                const count = severityCounts[sev] || 0;
                const max = Math.max(...Object.values(severityCounts), 1);
                return (
                  <div key={sev} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-16 capitalize">{sev}</span>
                    <div className="flex-1 bg-slate-700/50 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / max) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="h-2 rounded-full"
                        style={{ background: SEVERITY_COLORS[sev] }}
                      />
                    </div>
                    <span className="text-xs font-mono text-slate-300 w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent alerts */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-white">Recent Alerts</h3>
              <ChevronRight size={14} className="text-slate-500" />
            </div>
            <div className="divide-y divide-slate-700/30">
              {alerts.slice(0, 4).map((alert) => (
                <div key={alert.id} className="flex items-center gap-3 p-3 hover:bg-slate-700/30 transition-colors cursor-pointer">
                  <div className={`p-1.5 rounded-lg ${
                    alert.severity === 'critical' ? 'bg-red-500/20' :
                    alert.severity === 'high' ? 'bg-orange-500/20' :
                    alert.severity === 'medium' ? 'bg-yellow-500/20' : 'bg-emerald-500/20'
                  }`}>
                    <AlertTriangle size={12} className={
                      alert.severity === 'critical' ? 'text-red-400' :
                      alert.severity === 'high' ? 'text-orange-400' :
                      alert.severity === 'medium' ? 'text-yellow-400' : 'text-emerald-400'
                    } />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{alert.title}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{alert.ip_address}</p>
                  </div>
                  <Badge variant={alert.severity}>{alert.severity}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Attack Bar Chart */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Attack Type Breakdown</h3>
            <p className="text-xs text-slate-400">Daily totals by category</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData.slice(-7)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
            <Bar dataKey="attacks" fill="#ef4444" radius={[4, 4, 0, 0]} name="Attacks" />
            <Bar dataKey="blocked" fill="#10b981" radius={[4, 4, 0, 0]} name="Blocked" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
