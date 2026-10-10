-- 2026-10-10 batch schedule update from Katelyn's Google Sheet (weeks 10/11 onward)
-- ended classes (last shown 2026-10-10)
UPDATE classes SET end_date='2026-10-10' WHERE id IN (2,21,35);
-- moves / edits
UPDATE classes SET title='Aerial Flow', active=1, instructor=NULL WHERE id=1;            -- Sun 10:00
UPDATE classes SET day=0, time='17:00', title='Handstands' WHERE id=23;                 -- Handstands Thu 12 -> Sun 5pm
UPDATE classes SET day=3, time='08:00' WHERE id=3;                                      -- Active Flex Mon 9 -> Wed 8am
UPDATE classes SET time='19:00' WHERE id=9;                                             -- Aerial L1 Abby Mon 6:30 -> 7pm Foyer
UPDATE classes SET day=5, time='08:00' WHERE id=10;                                     -- L1 Contortion Tue 12 -> Fri 8am
UPDATE classes SET title='Silk', time='13:00' WHERE id=11;                              -- Jill: Tue 1pm Silk
UPDATE classes SET room='Sun Room' WHERE id=12;                                         -- Flow Tue 4:30 Sun Room
UPDATE classes SET day=2, time='12:00' WHERE id=22;                                     -- Belly Dance Thu 11 -> Tue 12
UPDATE classes SET time='15:00' WHERE id=31;                                            -- Adv Straps Fri 3pm
UPDATE classes SET time='09:00' WHERE id=32;                                            -- Aerial (Virtual) Fri 9am
UPDATE classes SET instructor='Jill' WHERE id=34;                                       -- Lyra Fri 5:30 Jill
UPDATE classes SET instructor='Lia' WHERE id=36;                                        -- Beg Ballet (Selah, Lia)
UPDATE classes SET on_date='2026-11-07', end_date=NULL WHERE id=39;                     -- Community Jam first Sat (Nov 7)
-- new
INSERT INTO classes(title,instructor,day,time,duration_min,room,category,pricing,price,capacity,active) VALUES
 ('FlexPerform',NULL,1,'16:30',60,'Foyer','flex','donation',12,6,1),
 ('Partner Acro',NULL,1,'19:30',60,'Sun Room','flex','donation',12,6,1),
 ('FlexPerform',NULL,3,'17:30',60,'Foyer','flex','donation',12,6,1),
 ('Vertical Aerial Skill Share (Rope & Silk Open Gym)',NULL,3,'18:30',60,'Sun Room','community','standard',15,6,1),
 ('Jazz','Synergy',3,'19:30',60,'Sun Room','dance','external',NULL,6,1);
INSERT INTO classes(title,instructor,day,time,duration_min,room,category,pricing,price,capacity,active,on_date) VALUES
 ('Aerial After Dark','Carlos',5,'19:00',60,'Sun Room','aerial','dropin',30,6,1,'2026-10-23'),
 ('Aerial After Dark','Carlos',5,'19:00',60,'Sun Room','aerial','dropin',30,6,1,'2026-10-30');
