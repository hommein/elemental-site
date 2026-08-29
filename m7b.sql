UPDATE classes SET pricing='donation', price=12 WHERE category IN ('flex','flow') OR id=22;
UPDATE classes SET pricing='external' WHERE id IN (8,35,36);
SELECT id,title,pricing,price FROM classes WHERE pricing IN ('donation','external') AND active=1;