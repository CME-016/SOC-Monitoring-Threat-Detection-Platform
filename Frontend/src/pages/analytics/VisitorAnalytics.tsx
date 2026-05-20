import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Monitor, Smartphone, Globe, Clock, TrendingUp, Activity, RefreshCw } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { StatCard } from '../../components/ui/StatCard';

import { VisitorAnalytic } from '../../types';
import { useAuth } from '../../context/AuthContext';

const BROWSER_COLORS = ['#06b6d4', '#3b82f6', '#f97316', '#10b981', '#6366f1'];

export function VisitorAnalytics() {
  const { user } = useAuth();
  const [visitors, setVisitors] = useState<VisitorAnalytic[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeNow, setActiveNow] = useState(0);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [topPages, setTopPages] = useState<{page: string, count: number}[]>([]);
  const [browserData, setBrowserData] = useState<{name: string, value: number}[]>([]);
  const [deviceCounts, setDeviceCounts] = useState<Record<string, number>>({});
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);

  const loadData = async () => {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost/Backend/api/visitor_analytics.php?user_id=${user.id}`);
      const data = await response.json();
      
      setVisitors(data.live_stream || []);
      setActiveNow(data.active_now || 0);
      setTotalVisitors(data.total_visitors || 0);
      setTopPages(data.top_pages || []);
      setBrowserData(data.browser_data || []);
      setDeviceCounts(data.device_data || {});
      setTrafficData(data.traffic_data || []);
      setHourlyData(data.hourly_data || []);
      
    } catch (error) {
      console.error('Failed to fetch visitor analytics data:', error);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const refresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const activeVisitors = activeNow;
  const topCountries: [string, number][] = [['Unknown', totalVisitors]]; // Fallback since we don't have countries

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Visitor Analytics</h2>
          <p className="text-sm text-slate-400">Real-time visitor monitoring and traffic analytics</p>
        </div>
        <button onClick={refresh} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm border border-slate-700 transition-all">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Now" value={activeVisitors} icon={Activity} iconColor="text-emerald-400" iconBg="bg-emerald-500/20" pulse />
        <StatCard title="Total Visitors" value={visitors.length} icon={Users} iconColor="text-cyan-400" iconBg="bg-cyan-500/20" />
        <StatCard title="Avg Duration" value="4m 32s" icon={Clock} iconColor="text-blue-400" iconBg="bg-blue-500/20" />
        <StatCard title="Bounce Rate" value="42.3%" icon={TrendingUp} iconColor="text-orange-400" iconBg="bg-orange-500/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic over time */}
        <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Traffic Trends</h3>
              <p className="text-xs text-slate-400">Visitors and pageviews over 14 days</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trafficData}>
              <defs>
                <linearGradient id="visGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
              <Area type="monotone" dataKey="visitors" stroke="#06b6d4" strokeWidth={2} fill="url(#visGrad)" name="Visitors" />
              <Area type="monotone" dataKey="pageviews" stroke="#10b981" strokeWidth={2} fill="url(#pvGrad)" name="Pageviews" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Browser breakdown */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Browser Distribution</h3>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={browserData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                {browserData.map((_, i) => <Cell key={i} fill={BROWSER_COLORS[i % BROWSER_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {browserData.map(({ name, value }, i) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: BROWSER_COLORS[i % BROWSER_COLORS.length] }} />
                  <span className="text-slate-300">{name}</span>
                </div>
                <span className="text-slate-400">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device types */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Device Types</h3>
          <div className="space-y-3">
            {Object.entries(deviceCounts).map(([type, count]) => {
              const total = Object.values(deviceCounts).reduce((a, b) => a + b, 0) || 1;
              const pct = Math.round((count / total) * 100);
              const Icon = type === 'desktop' ? Monitor : type === 'mobile' ? Smartphone : Globe;
              return (
                <div key={type} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Icon size={13} className="text-slate-400" />
                      <span className="text-slate-300 capitalize">{type}</span>
                    </div>
                    <span className="text-slate-400">{count} ({pct}%)</span>
                  </div>
                  <div className="bg-slate-700/50 rounded-full h-1.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-1.5 rounded-full bg-cyan-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top countries */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Top Countries</h3>
          <div className="space-y-2.5">
            {topCountries.map(([country, count], i) => {
              const max = topCountries[0][1];
              return (
                <div key={country} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-4 text-right">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">{country}</span>
                      <span className="text-slate-400">{count}</span>
                    </div>
                    <div className="bg-slate-700/50 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top pages */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Top Pages</h3>
          <div className="space-y-2.5">
            {topPages.map(({page, count}, i) => {
              const max = topPages[0]?.count || 1;
              return (
                <div key={page} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-4 text-right">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-mono truncate">{page}</span>
                      <span className="text-slate-400">{count}</span>
                    </div>
                    <div className="bg-slate-700/50 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hourly traffic */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Hourly Traffic Pattern (Today)</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
            <Bar dataKey="visitors" fill="#06b6d4" radius={[3, 3, 0, 0]} name="Visitors" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Live visitor stream */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-slate-700/50">
          <Users size={16} className="text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Live Visitor Stream</h3>
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
          <span className="text-xs text-slate-400 ml-auto">{activeVisitors} active</span>
        </div>
        <div className="divide-y divide-slate-700/30">
          {visitors.slice(0, 8).map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 p-3 hover:bg-slate-700/30 transition-colors"
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${v.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-300">{v.ip_address}</span>
                  <span className="text-xs text-slate-500">{v.country}</span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[11px] text-slate-400">{v.browser} / {v.os}</span>
                  <span className="text-[11px] text-slate-500 font-mono truncate">{v.current_page}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-slate-400 capitalize">{v.device_type}</p>
                <p className="text-[10px] text-slate-500">{v.pages_viewed} pages</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
