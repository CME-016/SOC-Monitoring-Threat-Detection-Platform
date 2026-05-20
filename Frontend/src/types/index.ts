export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'analyst' | 'viewer';
  avatar_url: string;
  phone: string;
  timezone: string;
  notifications_email: boolean;
  notifications_browser: boolean;
  notifications_telegram: boolean;
  telegram_chat_id: string;
  two_factor_enabled: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface Website {
  id: string;
  user_id: string;
  name: string;
  domain: string;
  url: string;
  status: 'active' | 'inactive' | 'error';
  monitoring_enabled: boolean;
  log_path: string;
  alert_threshold: 'low' | 'medium' | 'high' | 'critical';
  honeypot_enabled: boolean;
  fim_enabled: boolean;
  uptime_percentage: number;
  total_requests: number;
  total_attacks: number;
  last_checked: string;
  created_at: string;
  updated_at: string;
}

export interface Log {
  id: string;
  user_id: string;
  website_id: string | null;
  log_type: 'apache' | 'nginx' | 'php' | 'firewall' | 'auth' | 'custom';
  ip_address: string;
  method: string;
  url: string;
  status_code: number;
  response_size: number;
  user_agent: string;
  referer: string;
  country: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  is_attack: boolean;
  attack_type: string;
  threat_score: number;
  raw_log: string;
  created_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  website_id: string | null;
  log_id: string | null;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  attack_type: string;
  ip_address: string;
  url: string;
  payload: string;
  status: 'open' | 'acknowledged' | 'resolved' | 'false_positive';
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface AttackReport {
  id: string;
  user_id: string;
  website_id: string | null;
  attack_type: string;
  ip_address: string;
  country: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  url: string;
  payload: string;
  threat_score: number;
  blocked: boolean;
  created_at: string;
}

export interface BlockedIP {
  id: string;
  user_id: string;
  website_id: string | null;
  ip_address: string;
  reason: string;
  block_type: 'manual' | 'auto' | 'threat_intel';
  severity: string;
  attack_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisitorAnalytic {
  id: string;
  user_id: string;
  website_id: string | null;
  session_id: string;
  ip_address: string;
  country: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  browser: string;
  os: string;
  device_type: 'desktop' | 'mobile' | 'tablet' | 'bot';
  current_page: string;
  referrer: string;
  is_active: boolean;
  pages_viewed: number;
  duration_seconds: number;
  created_at: string;
  last_active: string;
}

export interface ThreatStatistic {
  id: string;
  user_id: string;
  website_id: string | null;
  date: string;
  total_requests: number;
  total_attacks: number;
  blocked_requests: number;
  unique_visitors: number;
  sql_injection_count: number;
  xss_count: number;
  brute_force_count: number;
  ddos_count: number;
  port_scan_count: number;
  directory_traversal_count: number;
  bot_traffic_count: number;
  other_attacks_count: number;
  created_at: string;
}

export interface DashboardStats {
  totalWebsites: number;
  activeWebsites: number;
  totalThreats: number;
  criticalAlerts: number;
  blockedIPs: number;
  totalRequests: number;
  attacksToday: number;
  activeVisitors: number;
}

export type AttackType =
  | 'SQL Injection'
  | 'XSS'
  | 'Brute Force'
  | 'DDoS'
  | 'Port Scan'
  | 'Directory Traversal'
  | 'Bot Traffic'
  | 'Admin Panel Scan'
  | 'Honeypot Trigger'
  | 'Other';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
