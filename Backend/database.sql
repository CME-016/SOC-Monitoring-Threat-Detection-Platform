-- CyberSOC Platform MySQL Schema
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Database Creation
CREATE DATABASE IF NOT EXISTS cybersoc_db;
USE cybersoc_db;

-- --------------------------------------------------------

-- Profiles table
CREATE TABLE IF NOT EXISTS `profiles` (
  `id` VARCHAR(36) PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255) DEFAULT '',
  `role` ENUM('admin', 'analyst', 'viewer') DEFAULT 'analyst',
  `avatar_url` VARCHAR(255) DEFAULT '',
  `phone` VARCHAR(20) DEFAULT '',
  `timezone` VARCHAR(50) DEFAULT 'UTC',
  `notifications_email` TINYINT(1) DEFAULT 1,
  `notifications_browser` TINYINT(1) DEFAULT 1,
  `notifications_telegram` TINYINT(1) DEFAULT 0,
  `telegram_chat_id` VARCHAR(100) DEFAULT '',
  `two_factor_enabled` TINYINT(1) DEFAULT 0,
  `last_login` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Websites table
CREATE TABLE IF NOT EXISTS `websites` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `domain` VARCHAR(255) NOT NULL,
  `url` VARCHAR(255) NOT NULL,
  `status` ENUM('active', 'inactive', 'error') DEFAULT 'active',
  `monitoring_enabled` TINYINT(1) DEFAULT 1,
  `log_path` VARCHAR(255) DEFAULT '',
  `alert_threshold` ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  `honeypot_enabled` TINYINT(1) DEFAULT 0,
  `fim_enabled` TINYINT(1) DEFAULT 0,
  `uptime_percentage` DECIMAL(5,2) DEFAULT 100.00,
  `total_requests` BIGINT DEFAULT 0,
  `total_attacks` BIGINT DEFAULT 0,
  `last_checked` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Logs table
CREATE TABLE IF NOT EXISTS `logs` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `website_id` VARCHAR(36) DEFAULT NULL,
  `log_type` ENUM('apache', 'nginx', 'php', 'firewall', 'auth', 'custom') DEFAULT 'apache',
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `method` VARCHAR(10) DEFAULT 'GET',
  `url` TEXT DEFAULT NULL,
  `status_code` INT DEFAULT 200,
  `response_size` INT DEFAULT 0,
  `user_agent` TEXT DEFAULT NULL,
  `referer` TEXT DEFAULT NULL,
  `country` VARCHAR(100) DEFAULT '',
  `city` VARCHAR(100) DEFAULT '',
  `latitude` DECIMAL(10,6) DEFAULT NULL,
  `longitude` DECIMAL(10,6) DEFAULT NULL,
  `is_attack` TINYINT(1) DEFAULT 0,
  `attack_type` VARCHAR(100) DEFAULT '',
  `threat_score` INT DEFAULT 0,
  `raw_log` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`website_id`) REFERENCES `websites`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Alerts table
CREATE TABLE IF NOT EXISTS `alerts` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `website_id` VARCHAR(36) DEFAULT NULL,
  `log_id` VARCHAR(36) DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `severity` ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  `attack_type` VARCHAR(100) DEFAULT '',
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `url` TEXT DEFAULT NULL,
  `payload` TEXT DEFAULT NULL,
  `status` ENUM('open', 'acknowledged', 'resolved', 'false_positive') DEFAULT 'open',
  `acknowledged_at` TIMESTAMP NULL DEFAULT NULL,
  `resolved_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`website_id`) REFERENCES `websites`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`log_id`) REFERENCES `logs`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Threat statistics table
CREATE TABLE IF NOT EXISTS `threat_statistics` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `website_id` VARCHAR(36) DEFAULT NULL,
  `date` DATE NOT NULL,
  `total_requests` BIGINT DEFAULT 0,
  `total_attacks` BIGINT DEFAULT 0,
  `blocked_requests` BIGINT DEFAULT 0,
  `unique_visitors` BIGINT DEFAULT 0,
  `sql_injection_count` INT DEFAULT 0,
  `xss_count` INT DEFAULT 0,
  `brute_force_count` INT DEFAULT 0,
  `ddos_count` INT DEFAULT 0,
  `port_scan_count` INT DEFAULT 0,
  `directory_traversal_count` INT DEFAULT 0,
  `bot_traffic_count` INT DEFAULT 0,
  `other_attacks_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`website_id`) REFERENCES `websites`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Indexes
CREATE INDEX `idx_logs_user` ON `logs`(`user_id`);
CREATE INDEX `idx_logs_created` ON `logs`(`created_at`);
CREATE INDEX `idx_alerts_user` ON `alerts`(`user_id`);
CREATE INDEX `idx_alerts_status` ON `alerts`(`status`);

COMMIT;
