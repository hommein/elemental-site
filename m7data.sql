UPDATE classes SET price=20, pay_note='Venmo @SYNRGYdanceco $20 to reserve your spot · werk.dance/synrgydanceco · questions: (805) 252-7169' WHERE id=8;
UPDATE classes SET price=20, pay_note='$20 drop-in · questions: Daniel Rojo (805) 695-6695' WHERE id=35;
UPDATE classes SET price=15, pay_note='$15 drop-in or $60 for 5 classes · text (805) 836-1497 to register', duration_min=70 WHERE id=36;
UPDATE payments SET pack_credits=4 WHERE id=17;
-- guest pricing corrections (lezerd 2026)
UPDATE classes SET pricing='donation', price=15 WHERE id=22;             -- Belly Dance: studio pipeline, $15
UPDATE classes SET pricing='dropin', price=30 WHERE id=27;               -- Mel Pole: pack-eligible
UPDATE classes SET price=30 WHERE pricing='dropin' AND category='aerial';
UPDATE classes SET price=10 WHERE id=39;                                 -- Community Jam $10
