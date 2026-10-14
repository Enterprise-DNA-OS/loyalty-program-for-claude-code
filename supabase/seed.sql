INSERT INTO programs(id,name,terms_ref) VALUES ('10000000-0000-4000-8000-000000000001','Harbour Rewards','Fictional terms v1: dated points and non-cash rewards') ON CONFLICT DO NOTHING;
INSERT INTO tiers(program_id,name,threshold) VALUES ('10000000-0000-4000-8000-000000000001','Member',0),('10000000-0000-4000-8000-000000000001','Silver',1000),('10000000-0000-4000-8000-000000000001','Gold',3000) ON CONFLICT DO NOTHING;
INSERT INTO members(id,program_id,number,name,enrolled_on,last_activity,privacy_review_due,retention_basis,promotions,consent_ref) VALUES
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','HR001','Aroha Taylor',current_date-400,current_date-110,current_date-10,'Membership administration',true,'Fictional enrolment form 001'),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','HR002','Ben Morgan',current_date-200,current_date-10,current_date+90,'Membership administration',false,''),
('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','HR003','Casey Lee',current_date-180,NULL,NULL,'',true,'') ON CONFLICT DO NOTHING;
INSERT INTO lots(id,member_id,reference,points,earned_on,expires_on,actor,evidence) VALUES
('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','DEMO-001',1200,current_date-110,current_date+10,'Demo','Fictional purchase'),
('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','DEMO-002',300,current_date-400,current_date-5,'Demo','Fictional expired lot'),
('30000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000002','DEMO-003',3500,current_date-10,current_date+180,'Demo','Fictional purchase') ON CONFLICT DO NOTHING;
INSERT INTO rewards(id,program_id,name,points) VALUES
('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Workshop place',500),
('40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Tasting evening',1000) ON CONFLICT DO NOTHING;
INSERT INTO redemptions(id,member_id,reward_id,reference,points,requested_by,due_on) VALUES
('50000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000001','DEMO-REWARD',500,'Demo operator',current_date-3) ON CONFLICT DO NOTHING;
INSERT INTO allocations(lot_id,redemption_id,points) VALUES ('30000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000001',500) ON CONFLICT DO NOTHING;
INSERT INTO notes(id,member_id,note,actor,due_on) VALUES ('60000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Review expiring points before drafting the statement','Demo',current_date-2) ON CONFLICT DO NOTHING;
