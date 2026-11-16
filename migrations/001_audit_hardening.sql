BEGIN;

CREATE TABLE IF NOT EXISTS login_attempts (
  key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started TIMESTAMPTZ NOT NULL DEFAULT now(),
  blocked_until TIMESTAMPTZ
);

INSERT INTO settings (key, value)
VALUES ('schedule_json', '')
ON CONFLICT (key) DO NOTHING;

COMMIT;
