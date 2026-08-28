
CREATE TABLE IF NOT EXISTS classpacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  size INTEGER NOT NULL,
  remaining INTEGER NOT NULL,
  purchased_at TEXT DEFAULT (date('now')),
  note TEXT
);
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT DEFAULT (date('now')),
  amount REAL NOT NULL,
  method TEXT DEFAULT 'venmo',
  note TEXT
);
