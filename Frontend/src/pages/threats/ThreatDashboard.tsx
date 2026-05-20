import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, MapPin, TrendingUp, Ban, Activity,
  RefreshCw, Shield, Target, Flame
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { generateGeoAttacks, SEVERITY_COLORS } from '../../utils/mockData';
import { AttackReport } from '../../types';
import { useAuth } from '../../context/AuthContext';

export function ThreatDashboard() {
  const { user } = useAuth();
  const [attacks, setAttacks] = useState<AttackReport[]>([]);
  const [radarData, setRadarData] = useState<{name: string, value: number}[]>([]);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [geoAttacks, setGeoAttacks] = useState<ReturnType<typeof generateGeoAttacks>>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [counts, setCounts] = useState({
    critical_count: 0,
    high_count: 0,
    blocked_count: 0
  });
  const [topIPList, setTopIPList] = useState<any[]>([]);

  const loadData = async () => {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost/Backend/api/threat_dashboard.php?user_id=${user.id}`);
      const data = await response.json();
      
      setCounts({
        critical_count: data.critical_count || 0,
        high_count: data.high_count || 0,
        blocked_count: data.blocked_count || 0
      });
      
      setRadarData(data.radar_data || []);
      setTimelineData(data.timeline_data || []);
      setTopIPList(data.top_ips || []);
      setAttacks(data.recent_attacks || []);
      
      // Keep geo attacks as mock for now or use top IPs to mock them
      setGeoAttacks(generateGeoAttacks(20));
      
    } catch (error) {
      console.error('Failed to fetch threat dashboard data:', error);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const refresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleBlockIP = async (ip: string) => {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost/Backend/api/firewall.php?user_id=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip_to_block: ip })
      });
      const data = await response.json();
      
      if (response.ok) {
        alert(`IP ${ip} blocked successfully for 1 hour!`);
        loadData(); // Refresh the list!
      } else {
        alert(`Failed to block IP: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to block IP:', error);
      alert('Failed to block IP due to network error.');
    }
  };

  const criticalCount = counts.critical_count;
  const highCount = counts.high_count;
  const blockedCount = counts.blocked_count;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Threat Intelligence</h2>
          <p className="text-sm text-slate-400">Real-time threat analysis and attack patterns</p>
        </div>
        <button onClick={refresh} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm border border-slate-700 transition-all">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Critical Threats" value={criticalCount} icon={Flame} iconColor="text-red-400" iconBg="bg-red-500/20" pulse={criticalCount > 0} />
        <StatCard title="High Severity" value={highCount} icon={AlertTriangle} iconColor="text-orange-400" iconBg="bg-orange-500/20" />
        <StatCard title="IPs Blocked" value={blockedCount} icon={Ban} iconColor="text-cyan-400" iconBg="bg-cyan-500/20" />
        <StatCard title="Threat Score" value="87/100" icon={Target} iconColor="text-red-400" iconBg="bg-red-500/20" pulse />
      </div>

      {/* Attack Timeline */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Attack Type Timeline</h3>
            <p className="text-xs text-slate-400">7-day breakdown by attack vector</p>
          </div>
          <div className="flex gap-3 flex-wrap text-xs">
            {[['SQL', '#ef4444'], ['XSS', '#f97316'], ['Brute', '#eab308'], ['DDoS', '#ec4899'], ['Bot', '#06b6d4']].map(([name, color]) => (
              <span key={name} className="flex items-center gap-1 text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ background: color as string }} />
                {name}
              </span>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
            <Line type="monotone" dataKey="sql" stroke="#ef4444" strokeWidth={2} dot={false} name="SQL Injection" />
            <Line type="monotone" dataKey="xss" stroke="#f97316" strokeWidth={2} dot={false} name="XSS" />
            <Line type="monotone" dataKey="brute" stroke="#eab308" strokeWidth={2} dot={false} name="Brute Force" />
            <Line type="monotone" dataKey="ddos" stroke="#ec4899" strokeWidth={2} dot={false} name="DDoS" />
            <Line type="monotone" dataKey="bot" stroke="#06b6d4" strokeWidth={2} dot={false} name="Bot Traffic" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Attacking IPs */}
        <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-slate-700/50">
            <Activity size={16} className="text-red-400" />
            <h3 className="text-sm font-semibold text-white">Top Attacking IPs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="px-4 py-2.5 text-xs font-medium text-slate-500 border-b border-slate-700/50">IP Address</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-slate-500 border-b border-slate-700/50">Country</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-slate-500 border-b border-slate-700/50">Attacks</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-slate-500 border-b border-slate-700/50">Risk</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-slate-500 border-b border-slate-700/50">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {topIPList.map(({ ip, country, count, severity }, i) => (
                  <motion.tr
                    key={ip}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-cyan-400">{ip}</td>
                    <td className="px-4 py-3 text-xs text-slate-300">{country}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-700 rounded-full h-1.5 w-16">
                          <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${Math.min((count / topIPList[0].count) * 100, 100)}%` }} />
                        </div>
                        <span className="text-xs font-mono text-slate-300">{count}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge variant={severity as 'low' | 'medium' | 'high' | 'critical'}>{severity}</Badge></td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => handleBlockIP(ip)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                      >
                        <Ban size={12} />Block
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Threat Radar</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
              <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 9 }} />
              <Radar name="Attacks" dataKey="value" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Geo Attack Map Placeholder */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={16} className="text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Global Attack Origins</h3>
        </div>
        <div className="relative bg-slate-900/50 rounded-lg overflow-hidden" style={{ height: '300px' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-full h-full absolute inset-0" style={{
                backgroundImage: `radial-gradient(ellipse 80% 50% at 50% 50%, rgba(6,182,212,0.03) 0%, transparent 100%)`
              }} />
              <p className="text-slate-500 text-sm">Interactive Globe Visualization</p>
              <p className="text-slate-600 text-xs mt-1">Attack origins plotted across {geoAttacks.length} geographic locations</p>
            </div>
          </div>
          {/* Simulated attack dots */}
          <div className="absolute inset-0 overflow-hidden">
            {geoAttacks.map((geo, i) => {
              const x = ((geo.lng + 180) / 360) * 100;
              const y = ((90 - geo.lat) / 180) * 100;
              return (
                <motion.div
                  key={geo.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.8 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    background: SEVERITY_COLORS[geo.severity],
                    boxShadow: `0 0 6px ${SEVERITY_COLORS[geo.severity]}`,
                  }}
                />
              );
            })}
          </div>
          {/* World map SVG background */}
          <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 1000 500">
            <rect width="1000" height="500" fill="none" stroke="#334155" strokeWidth="1" />
            {/* Simplified continents */}
            <path d="M150,150 Q200,100 300,120 Q350,110 380,140 Q400,160 370,200 Q340,230 280,220 Q200,210 160,180 Z" fill="#334155" />
            <path d="M400,120 Q450,100 520,110 Q570,115 590,140 Q600,160 580,190 Q550,210 500,205 Q440,200 410,170 Z" fill="#334155" />
            <path d="M560,150 Q620,130 680,150 Q720,165 730,200 Q720,240 680,250 Q630,255 590,230 Q560,210 560,180 Z" fill="#334155" />
            <path d="M200,250 Q280,240 330,270 Q350,290 340,340 Q320,380 270,390 Q220,385 200,350 Q180,310 200,280 Z" fill="#334155" />
            <path d="M760,160 Q810,150 850,170 Q880,190 875,230 Q860,260 820,265 Q780,260 760,230 Q745,200 760,170 Z" fill="#334155" />
          </svg>
        </div>
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          {(['critical', 'high', 'medium', 'low'] as const).map(sev => (
            <div key={sev} className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full" style={{ background: SEVERITY_COLORS[sev] }} />
              <span className="capitalize">{sev}</span>
              <span className="text-slate-500">({geoAttacks.filter(g => g.severity === sev).length})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Attack Details */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-orange-400" />
          <h3 className="text-sm font-semibold text-white">Recent Attack Details</h3>
        </div>
        <div className="space-y-3">
          {attacks.slice(0, 5).map((attack, i) => (
            <motion.div
              key={attack.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-all"
            >
              <div className={`p-2.5 rounded-lg flex-shrink-0 ${
                attack.severity === 'critical' ? 'bg-red-500/20' :
                attack.severity === 'high' ? 'bg-orange-500/20' :
                attack.severity === 'medium' ? 'bg-yellow-500/20' : 'bg-emerald-500/20'
              }`}>
                <AlertTriangle size={16} className={
                  attack.severity === 'critical' ? 'text-red-400' :
                  attack.severity === 'high' ? 'text-orange-400' :
                  attack.severity === 'medium' ? 'text-yellow-400' : 'text-emerald-400'
                } />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white">{attack.attack_type}</span>
                  <Badge variant={attack.severity}>{attack.severity}</Badge>
                  {attack.blocked && <Badge variant="success">Blocked</Badge>}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-xs text-slate-400 font-mono">IP: {attack.ip_address}</span>
                  <span className="text-xs text-slate-400">From: {attack.country}</span>
                  <span className="text-xs text-slate-400">Target: {attack.url}</span>
                </div>
                <div className="mt-1.5">
                  <span className="text-xs text-slate-500 font-mono bg-slate-800 px-2 py-0.5 rounded">
                    Score: {attack.threat_score}/100
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 flex-shrink-0">
                {new Date(attack.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
