DROP TABLE IF EXISTS signups; DROP TABLE IF EXISTS users; DROP TABLE IF EXISTS classes;
CREATE TABLE classes(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  instructor TEXT,
  day INTEGER NOT NULL,          -- 0=Sunday .. 6=Saturday
  time TEXT NOT NULL,            -- 'HH:MM' 24h
  duration_min INTEGER DEFAULT 60,
  category TEXT,                 -- aerial | flex | flow | dance | community | selah
  pricing TEXT,                  -- dropin | donation | external | free
  capacity INTEGER DEFAULT 6,
  active INTEGER DEFAULT 1,
  sort INTEGER DEFAULT 0
);
CREATE TABLE users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  google_sub TEXT UNIQUE,
  is_admin INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE signups(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL REFERENCES classes(id),
  date TEXT NOT NULL,            -- 'YYYY-MM-DD' of the specific session
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(class_id, date, email)
);
CREATE INDEX idx_signups_class_date ON signups(class_id, date);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Open Aerial Training',NULL,0,'10:00','aerial','dropin',4);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Partnering Workshop','Selah',0,'15:00','selah','external',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Active Flex','Hybrid',1,'09:00','flex','donation',4);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Int Ballet','Selah',1,'10:00','selah','external',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Rehearsal','Selah',1,'11:30','selah','external',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Jazz','Selah',1,'16:30','selah','external',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Silk',NULL,1,'17:30','aerial','dropin',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('House','Bethany',1,'18:30','dance','dropin',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Aerial L1','Abby',1,'18:30','aerial','dropin',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('L1 Contortion','Hybrid',2,'12:00','flex','donation',4);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Aerial','Jill',2,'16:30','aerial','dropin',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Flow',NULL,2,'16:30','flow','donation',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Lyra',NULL,2,'17:30','aerial','dropin',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Sling','Carlos',2,'17:30','aerial','dropin',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Heels',NULL,2,'18:30','dance','dropin',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Contemporary','Selah',2,'19:30','selah','external',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Int Ballet','Selah',3,'10:00','selah','external',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Rehearsal','Selah',3,'11:30','selah','external',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Silk',NULL,3,'16:30','aerial','dropin',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Aerial L1','Katya',3,'17:30','aerial','dropin',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Sling','Katya',3,'18:30','aerial','dropin',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Belly Dance',NULL,4,'11:00','dance','donation',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Handstands (All Levels)',NULL,4,'12:00','flex','donation',4);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Adv Lyra','Abby',4,'15:00','aerial','dropin',4);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Aerial L1',NULL,4,'16:30','aerial','dropin',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Aerial',NULL,4,'17:30','aerial','dropin',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Pole','Mel',4,'18:30','dance','dropin',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Acro','Selah',4,'19:30','selah','external',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Int Ballet','Selah',5,'10:00','selah','external',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Rehearsal','Selah',5,'11:30','selah','external',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Adv Straps','Abby',5,'14:30','aerial','dropin',4);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Aerial (Virtual)',NULL,5,'15:30','aerial','dropin',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Aerial Dance',NULL,5,'16:30','aerial','dropin',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Lyra','Catie',5,'17:30','aerial','dropin',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Hip Hop','Daniel',5,'18:30','dance','dropin',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Beg Ballet','Kelsey',6,'10:30','dance','dropin',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Straps','Eric',6,'12:00','aerial','dropin',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Silk','Eric',6,'13:00','aerial','dropin',6);
INSERT INTO classes(title,instructor,day,time,category,pricing,capacity) VALUES('Community Jam',NULL,6,'14:00','community','free',6);
