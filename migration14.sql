CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT,
  size INTEGER NOT NULL,
  part INTEGER NOT NULL DEFAULT 0,
  first_id INTEGER,
  created TEXT NOT NULL DEFAULT (datetime('now')),
  data BLOB NOT NULL
);
CREATE INDEX IF NOT EXISTS media_first ON media(first_id, part);
