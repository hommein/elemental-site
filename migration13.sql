CREATE TABLE IF NOT EXISTS contact_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  size INTEGER NOT NULL,
  part INTEGER NOT NULL DEFAULT 0,
  data BLOB NOT NULL
);
CREATE INDEX IF NOT EXISTS contact_files_msg ON contact_files(message_id, name, part);
