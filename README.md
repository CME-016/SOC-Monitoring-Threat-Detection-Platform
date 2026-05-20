# CyberSOC Platform

A professional, full-stack Security Operations Center (SOC) dashboard and Intrusion Detection System (IDS) built to monitor, detect, analyze, and mitigate cyber threats across multiple client websites in real-time.

---

## 🚀 Key Features

* **Multi-Website Management**: Register and monitor multiple client websites from a single central dashboard. Displays dynamic stats (total requests, alerts, attacks, and status) for each registered URL.
* **Smart Intrusion Detection System (IDS)**: A robust, native PHP threat-detection engine that inspects incoming `GET`, `POST`, `User-Agent`, and `URI` payloads. It detects:
  * **SQL Injection (SQLi)**
  * **Cross-Site Scripting (XSS)**
  * **Directory Traversal**
  * **Automated Bot Scanners** (curl, python, nmap, sqlmap, etc.)
* **Dynamic Dashboards**: Interactive metrics visualization for threat statistics, attack vector distribution (SQLi vs XSS vs Bot Scanners), active visitor tracking, traffic trends, and raw logs explorer.
* **Automated & Manual Firewall**:
  * **Dynamic Rate Limiting**: Block IPs exceeding threshold request counts within a specified time window.
  * **1-Click Blocking**: Quickly block or unblock malicious IPs manually from the dashboard or through automated actions.
* **Interactive Email Alerts with 1-Click Actions**:
  * Automatically dispatches HTML email notifications to the administrator when a critical attack is detected.
  * Uses a native, socket-based SMTP client over SSL (no external dependencies required).
  * Includes a **1-Click Magic Link** to block the attacker's IP for 7 days directly from the email body.
  * Integrated **Email Throttling** (1-minute window) to prevent inbox spam.
* **Granular Settings Control**: Manage security thresholds, automatic IP block durations, timezone settings, and toggle email notifications ON or OFF directly from the Settings interface.

---

## 📂 Project Structure

```bash
SOC/
├── Backend/                    # Backend API layer
│   ├── api/                    # PHP RESTful endpoints
│   │   ├── config.php          # Database connectivity setup
│   │   ├── utils.php           # Permissive CORS headers & utility functions
│   │   ├── auth.php            # User authentication (Login / Signup)
│   │   ├── dashboard.php       # Central dashboard statistics endpoint
│   │   ├── threat_dashboard.php# Specific threat analytics & top attacking IPs
│   │   ├── visitor_analytics.php# Detailed client visitor metrics
│   │   ├── websites.php        # Register, fetch, and delete monitored websites
│   │   ├── profile.php         # Manage admin profiles & notification settings
│   │   ├── firewall.php        # Active IP blocklists & configuration controls
│   │   ├── logs.php            # Raw server request log explorer API
│   │   ├── smtp_mailer.php     # Custom socket-based SMTP email client
│   │   └── email_action.php    # Handles magic 1-click block links from emails
│   ├── database.sql            # Full MySQL Schema migration script
│   └── logger.php              # Global threat detector and logger logic
│
├── Frontend/                   # React dashboard dashboard
│   ├── src/
│   │   ├── components/         # Reusable UI elements (Badge, StatCard, Layouts)
│   │   ├── context/            # AuthContext (state management for sessions)
│   │   ├── lib/                # api.ts (backend API wrapper)
│   │   ├── pages/              # Pages: Dashboard, Threats, Websites, Settings, Logs
│   │   └── utils/              # Formatting utilities
│   ├── package.json            # Node project configuration
│   └── vite.config.ts          # Vite configuration with API Proxy setup
│
├── test_client/                # Local vulnerable sandbox client site
│   ├── .htaccess               # URL rewriting & request controls
│   ├── logger.php              # Embedded tracker copy (points to local DB)
│   └── index.php               # Vulnerable client store for testing XSS & SQLi
│
├── apply_firewall.php          # Helper script to sync local blocked IPs
└── setup_email_alerts.php      # Helper script to migrate email tokens schema
```

---

## 🗄️ Database Schema

The system runs on a MySQL database (`cybersoc_db`) composed of the following key tables:
1. `profiles`: Admin credentials, roles, profile info, and preference flags (`notifications_email`).
2. `websites`: Monitored client domains, URLs, threshold configurations, and uptime states.
3. `logs`: Captured HTTP request footprints, containing request parameters, IP addresses, threat flags, and attack vectors.
4. `alerts`: Security incidents flagged by the IDS linked to specific logs, indicating status (`open`/`resolved`) and severity.
5. `blocked_ips`: Active firewall records containing IP block windows and automated expiration dates.
6. `email_action_tokens`: Cryptographically secure tokens used to authorize quick block actions via email magic links.

---

## 🛠️ Installation & Setup

### Prerequisites
* **XAMPP** (or any environment supporting Apache, PHP 7.4+, and MySQL).
* **Node.js** (v16+ for compiling and running the Frontend).

### 1. Database Configuration
1. Start Apache and MySQL in XAMPP.
2. Open phpMyAdmin (`http://localhost/phpmyadmin`).
3. Create a database named `cybersoc_db`.
4. Import `Backend/database.sql` into the database.
5. Run `setup_email_alerts.php` once to add the email action tokens tables.

### 2. Backend Config
1. Configure database access parameters in `Backend/api/config.php` (default: `root` with no password).
2. Configure your SMTP login parameters inside `Backend/api/smtp_mailer.php`:
   ```php
   $smtpUser = 'your-email@gmail.com';
   $smtpPass = 'your-app-password';
   ```

### 3. Frontend Setup
1. Move to the Frontend folder:
   ```bash
   cd Frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
   *The client dashboard will run on `http://localhost:5173/`.*

### 4. Client Tracker Integration
To monitor any PHP website, copy the `test_client/logger.php` file into your site's directory and include it at the top of your index page:
```php
<?php
// Include at the very beginning of index.php
require_once 'logger.php';
?>
```
*Make sure to configure the correct `$user_id` and `$website_id` in your client `logger.php`.*

---

## 🔬 How to Test (Vulnerable Sandbox)

1. Register a website (e.g., `websiteA` pointing to `portfolio.local`) on the dashboard's **Websites** tab.
2. Copy the generated UUID of the website from the `websites` database table.
3. Paste the UUID into `test_client/logger.php` as `$website_id`.
4. Open the Vulnerable Client Shop in your browser:
   `http://localhost/test_client/index.php`
5. Test the IDS by triggering a Mock Cross-Site Scripting (XSS) attack:
   `http://localhost/test_client/index.php?search=<script>alert(1)</script>`
6. **Results**:
   * The request will be recorded as an attack on your SOC dashboard.
   * If **Email Alerts** are turned **ON** in your Settings panel, you will receive a critical alert email with a direct **BLOCK IP ADDRESS** link.
   * Clicking the block link will block the attacker's IP, denying them access to `test_client` for 7 days (yielding a `429 Too Many Requests` error page upon future visits).
