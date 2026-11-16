CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(100) NOT NULL PRIMARY KEY,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','editor','viewer') NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash BINARY(32) NOT NULL PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS login_attempts (
  attempt_key BINARY(32) NOT NULL PRIMARY KEY,
  failures INT UNSIGNED NOT NULL DEFAULT 0,
  window_started DATETIME NOT NULL,
  locked_until DATETIME NULL,
  INDEX idx_attempts_locked (locked_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS municipalities (
  id CHAR(7) NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  region VARCHAR(120) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS city_records (
  municipality_id CHAR(7) NOT NULL PRIMARY KEY,
  status ENUM('none','planned','prep','recording','done','cancelled') NOT NULL DEFAULT 'none',
  planned_date DATE NULL,
  recorded_date DATE NULL,
  description TEXT NULL,
  notes TEXT NULL,
  video_url VARCHAR(2048) NULL,
  instagram_url VARCHAR(2048) NULL,
  tiktok_url VARCHAR(2048) NULL,
  restaurants TEXT NULL,
  hotels TEXT NULL,
  locations TEXT NULL,
  attractions TEXT NULL,
  contacts TEXT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_city_status (status),
  CONSTRAINT fk_city_municipality FOREIGN KEY (municipality_id) REFERENCES municipalities(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS city_checklist (
  municipality_id CHAR(7) NOT NULL,
  item_id VARCHAR(36) NOT NULL,
  label VARCHAR(255) NOT NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  position INT UNSIGNED NOT NULL,
  PRIMARY KEY (municipality_id,item_id),
  INDEX idx_checklist_order (municipality_id,position),
  CONSTRAINT fk_checklist_city FOREIGN KEY (municipality_id) REFERENCES city_records(municipality_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS city_history (
  id CHAR(36) NOT NULL PRIMARY KEY,
  municipality_id CHAR(7) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  text VARCHAR(500) NOT NULL,
  actor_user_id BIGINT UNSIGNED NULL,
  INDEX idx_history_city_date (municipality_id,created_at),
  CONSTRAINT fk_history_city FOREIGN KEY (municipality_id) REFERENCES city_records(municipality_id) ON DELETE CASCADE,
  CONSTRAINT fk_history_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS routes (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS route_cities (
  route_id CHAR(36) NOT NULL,
  municipality_id CHAR(7) NOT NULL,
  position INT UNSIGNED NOT NULL,
  PRIMARY KEY (route_id,position),
  UNIQUE KEY uq_route_city (route_id,municipality_id),
  INDEX idx_route_city (municipality_id),
  CONSTRAINT fk_route_parent FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  CONSTRAINT fk_route_municipality FOREIGN KEY (municipality_id) REFERENCES municipalities(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS project_meta (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  start_date DATE NOT NULL,
  manual_km DECIMAL(12,2) NOT NULL DEFAULT 0,
  next_recording DATE NULL,
  CONSTRAINT chk_project_meta_singleton CHECK (id=1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
