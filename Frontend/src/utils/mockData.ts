import { AttackReport, Alert, Log, ThreatStatistic, VisitorAnalytic } from '../types';

const ATTACK_TYPES = ['SQL Injection', 'XSS', 'Brute Force', 'DDoS', 'Port Scan', 'Directory Traversal', 'Bot Traffic', 'Admin Panel Scan'];
const COUNTRIES = ['United States', 'China', 'Russia', 'Germany', 'Brazil', 'India', 'Netherlands', 'United Kingdom', 'France', 'South Korea'];
const COUNTRY_CODES = ['US', 'CN', 'RU', 'DE', 'BR', 'IN', 'NL', 'GB', 'FR', 'KR'];
const SEVERITIES: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical'];
const BROWSERS = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'];
const OS_LIST = ['Windows', 'macOS', 'Linux', 'Android', 'iOS'];
const PAGES = ['/', '/login', '/admin', '/api/users', '/wp-admin', '/config.php', '/search', '/products', '/checkout'];
const LOG_TYPES: ('apache' | 'nginx' | 'php' | 'firewall' | 'auth')[] = ['apache', 'nginx', 'php', 'firewall', 'auth'];
const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];

function randomIP() {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hoursAgo(h: number) {
  const d = new Date();
  d.setHours(d.getHours() - h);
  return d.toISOString();
}

function daysAgo(d: number) {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  return dt.toISOString();
}

export function generateAttackReports(count = 20): AttackReport[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `ar-${i}`,
    user_id: 'mock',
    website_id: null,
    attack_type: randomFrom(ATTACK_TYPES),
    ip_address: randomIP(),
    country: randomFrom(COUNTRIES),
    severity: randomFrom(SEVERITIES),
    url: randomFrom(PAGES),
    payload: `payload_${Math.random().toString(36).slice(2)}`,
    threat_score: Math.floor(Math.random() * 100),
    blocked: Math.random() > 0.4,
    created_at: hoursAgo(Math.floor(Math.random() * 48)),
  }));
}

export function generateAlerts(count = 15): Alert[] {
  return Array.from({ length: count }, (_, i) => {
    const type = randomFrom(ATTACK_TYPES);
    const sev = randomFrom(SEVERITIES);
    return {
      id: `al-${i}`,
      user_id: 'mock',
      website_id: null,
      log_id: null,
      title: `${type} Detected`,
      description: `${type} attack detected from ${randomIP()} targeting ${randomFrom(PAGES)}`,
      severity: sev,
      attack_type: type,
      ip_address: randomIP(),
      url: randomFrom(PAGES),
      payload: `SELECT * FROM users WHERE id='1' OR '1'='1'`,
      status: randomFrom(['open', 'acknowledged', 'resolved', 'false_positive'] as const),
      acknowledged_at: null,
      resolved_at: null,
      created_at: hoursAgo(Math.floor(Math.random() * 72)),
    };
  });
}

export function generateLogs(count = 30): Log[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `lg-${i}`,
    user_id: 'mock',
    website_id: null,
    log_type: randomFrom(LOG_TYPES),
    ip_address: randomIP(),
    method: randomFrom(METHODS),
    url: randomFrom(PAGES),
    status_code: randomFrom([200, 200, 200, 301, 404, 403, 500]),
    response_size: Math.floor(Math.random() * 50000),
    user_agent: `Mozilla/5.0 (${randomFrom(OS_LIST)}) ${randomFrom(BROWSERS)}`,
    referer: '',
    country: randomFrom(COUNTRIES),
    city: 'Unknown',
    latitude: null,
    longitude: null,
    is_attack: Math.random() > 0.7,
    attack_type: Math.random() > 0.7 ? randomFrom(ATTACK_TYPES) : '',
    threat_score: Math.floor(Math.random() * 100),
    raw_log: `127.0.0.1 - - [${new Date().toISOString()}] "GET / HTTP/1.1" 200 1234`,
    created_at: hoursAgo(Math.floor(Math.random() * 24)),
  }));
}

export function generateThreatStats(days = 14): ThreatStatistic[] {
  return Array.from({ length: days }, (_, i) => {
    const total = Math.floor(Math.random() * 5000) + 1000;
    const attacks = Math.floor(Math.random() * 200) + 10;
    return {
      id: `ts-${i}`,
      user_id: 'mock',
      website_id: null,
      date: daysAgo(days - i).split('T')[0],
      total_requests: total,
      total_attacks: attacks,
      blocked_requests: Math.floor(attacks * 0.7),
      unique_visitors: Math.floor(total * 0.3),
      sql_injection_count: Math.floor(Math.random() * 30),
      xss_count: Math.floor(Math.random() * 25),
      brute_force_count: Math.floor(Math.random() * 20),
      ddos_count: Math.floor(Math.random() * 15),
      port_scan_count: Math.floor(Math.random() * 10),
      directory_traversal_count: Math.floor(Math.random() * 10),
      bot_traffic_count: Math.floor(Math.random() * 50),
      other_attacks_count: Math.floor(Math.random() * 20),
      created_at: daysAgo(days - i),
    };
  });
}

export function generateVisitors(count = 12): VisitorAnalytic[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `va-${i}`,
    user_id: 'mock',
    website_id: null,
    session_id: Math.random().toString(36).slice(2),
    ip_address: randomIP(),
    country: randomFrom(COUNTRIES),
    city: 'Unknown',
    latitude: null,
    longitude: null,
    browser: randomFrom(BROWSERS),
    os: randomFrom(OS_LIST),
    device_type: randomFrom(['desktop', 'mobile', 'tablet'] as const),
    current_page: randomFrom(PAGES),
    referrer: '',
    is_active: Math.random() > 0.5,
    pages_viewed: Math.floor(Math.random() * 10) + 1,
    duration_seconds: Math.floor(Math.random() * 600),
    created_at: hoursAgo(Math.floor(Math.random() * 2)),
    last_active: hoursAgo(Math.random()),
  }));
}

export function generateGeoAttacks(count = 30) {
  const lats = [37.7749, 55.7558, 39.9042, 51.5074, -23.5505, 28.7041, 52.5200, 35.6762, 48.8566, 37.5665];
  const lngs = [-122.4194, 37.6173, 116.4074, -0.1278, -46.6333, 77.1025, 13.4050, 139.6503, 2.3522, 126.9780];
  return Array.from({ length: count }, (_, i) => ({
    id: `geo-${i}`,
    lat: lats[i % lats.length] + (Math.random() - 0.5) * 5,
    lng: lngs[i % lngs.length] + (Math.random() - 0.5) * 5,
    country: COUNTRIES[i % COUNTRIES.length],
    attack_type: randomFrom(ATTACK_TYPES),
    severity: randomFrom(SEVERITIES),
    count: Math.floor(Math.random() * 100) + 1,
  }));
}

export const ATTACK_TYPE_COLORS: Record<string, string> = {
  'SQL Injection': '#ef4444',
  'XSS': '#f97316',
  'Brute Force': '#eab308',
  'DDoS': '#ec4899',
  'Port Scan': '#06b6d4',
  'Directory Traversal': '#8b5cf6',
  'Bot Traffic': '#6366f1',
  'Admin Panel Scan': '#10b981',
  'Other': '#64748b',
};

export const SEVERITY_COLORS: Record<string, string> = {
  low: '#10b981',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};
