import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, Clock, RefreshCw, Save, Search, WifiOff } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

import { useAuth } from '../../context/AuthContext';

interface FirewallSettings {
  max_requests: number;
  window_seconds: number;
  cooldown_seconds: number;
}

interface TopIP {
  ip_address: string;
  total_requests: number;
  total_attacks: number;
}

interface BlockedIP {
  id: string;
  ip_address: string;
  blocked_at: string;
  unblock_at: string;
}

export function Firewall() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<FirewallSettings>({
    max_requests: 50,
    window_seconds: 60,
    cooldown_seconds: 300,
  });
  const [topIps, setTopIps] = useState<TopIP[]>([]);
  const [blockedIps, setBlockedIps] = useState<BlockedIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      // Hardcoding the user ID for testing to match the logs
      const testUserId = '9cc010bc-07c9-4576-98b0-c000815083ea';
      const response = await fetch(`http://localhost/Backend/api/firewall.php?user_id=${testUserId}`);
      const data = await response.json();
      
      console.log('Firewall Data fetched:', data); // Added log to help you debug in console
      
      if (data.settings) setSettings(data.settings);
      if (data.top_ips) setTopIps(data.top_ips);
      if (data.blocked_ips) setBlockedIps(data.blocked_ips);
    } catch (error) {
      console.error('Failed to fetch firewall data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const testUserId = '9cc010bc-07c9-4576-98b0-c000815083ea';
      await fetch(`http://localhost/Backend/api/firewall.php?user_id=${testUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const refresh = () => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleUnblock = async (ip: string) => {
    try {
      const testUserId = '9cc010bc-07c9-4576-98b0-c000815083ea';
      await fetch(`http://localhost/Backend/api/firewall.php?user_id=${testUserId}&ip=${ip}`, {
        method: 'DELETE',
      });
      // Instantly refresh the list
      loadData();
    } catch (error) {
      console.error('Failed to unblock IP:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <Shield className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Active Defense (WAF)</h1>
            <p className="text-sm text-slate-400">Configure automated IP blocking and rate limiting</p>
          </div>
        </div>
        
        <button 
          onClick={refresh}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-white">Blocking Rules</h3>
          </div>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 block mb-1.5">Max Requests Allowed</label>
              <input 
                type="number"
                value={settings.max_requests}
                onChange={e => setSettings({...settings, max_requests: parseInt(e.target.value)})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
              />
              <p className="text-xs text-slate-600 mt-1">If an IP exceeds this number of requests...</p>
            </div>

            <div>
              <label className="text-xs text-slate-500 block mb-1.5">Time Window (Seconds)</label>
              <input 
                type="number"
                value={settings.window_seconds}
                onChange={e => setSettings({...settings, window_seconds: parseInt(e.target.value)})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
              />
              <p className="text-xs text-slate-600 mt-1">...within this time frame.</p>
            </div>

            <div>
              <label className="text-xs text-slate-500 block mb-1.5">Cooldown Duration (Seconds)</label>
              <input 
                type="number"
                value={settings.cooldown_seconds}
                onChange={e => setSettings({...settings, cooldown_seconds: parseInt(e.target.value)})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
              />
              <p className="text-xs text-slate-600 mt-1">Block the IP for this long (300s = 5m).</p>
            </div>

            <button 
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>

        {/* Analytics & Active Blocks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top IPs */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-cyan-500" />
              <h3 className="text-sm font-semibold text-white">Top Active IP Addresses</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500">
                    <th className="py-2">IP Address</th>
                    <th className="py-2">Total Requests</th>
                    <th className="py-2">Attacks Detected</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300 divide-y divide-slate-800/50">
                  {topIps.map((ip, i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="py-3 font-mono">{ip.ip_address}</td>
                      <td className="py-3">{ip.total_requests}</td>
                      <td className="py-3 text-red-400 font-bold">{ip.total_attacks}</td>
                      <td className="py-3 text-right">
                        {ip.total_attacks > 0 ? (
                          <Badge variant="high">Suspicious</Badge>
                        ) : (
                          <Badge variant="success">Clean</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                  {topIps.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-600">No traffic logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Blocked IPs */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <WifiOff className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-semibold text-white">Currently Blocked IPs</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500">
                    <th className="py-2">IP Address</th>
                    <th className="py-2">Blocked At</th>
                    <th className="py-2">Unblock At</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300 divide-y divide-slate-800/50">
                  {blockedIps.map((ip, i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="py-3 font-mono text-red-400">{ip.ip_address}</td>
                      <td className="py-3">{new Date(ip.blocked_at.replace(' ', 'T')).toLocaleString()}</td>
                      <td className="py-3 flex items-center gap-1.5 text-orange-400">
                        <Clock className="w-3 h-3" />
                        {new Date(ip.unblock_at.replace(' ', 'T')).toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <button 
                          onClick={() => handleUnblock(ip.ip_address)}
                          className="text-cyan-500 hover:text-cyan-400 font-medium"
                        >
                          Unblock
                        </button>
                      </td>
                    </tr>
                  ))}
                  {blockedIps.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-600">No IPs are currently blocked.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
