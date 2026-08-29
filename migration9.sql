ALTER TABLE classes ADD COLUMN on_date TEXT;
CREATE TABLE IF NOT EXISTS overrides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  cancelled INTEGER NOT NULL DEFAULT 0,
  title TEXT, instructor TEXT, time TEXT, duration_min INTEGER,
  capacity INTEGER, room TEXT,
  UNIQUE(class_id, date)
);
