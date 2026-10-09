CREATE TABLE IF NOT EXISTS news(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  img TEXT,
  body TEXT NOT NULL DEFAULT '[]',
  links TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO news (title,date,img,body,links) VALUES ('Welcome to Studio News','2026-10-08',NULL,'["This is where we post casual updates from the studio: schedule changes, new classes, what we have been working on, and little wins from our community.", "Check back often, or sign up for the newsletter from the Contact page so you never miss a thing."]',NULL);
