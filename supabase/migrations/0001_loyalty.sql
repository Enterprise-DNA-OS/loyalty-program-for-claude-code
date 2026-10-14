CREATE FUNCTION touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
CREATE TABLE programs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE CHECK(length(trim(name))>0),
 terms_ref text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE tiers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), program_id uuid NOT NULL REFERENCES programs,
 name text NOT NULL, threshold integer NOT NULL CHECK(threshold>=0),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(program_id,name));
CREATE TABLE members (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), program_id uuid NOT NULL REFERENCES programs,
 source_id text UNIQUE, number text NOT NULL CHECK(length(trim(number))>0), name text NOT NULL CHECK(length(trim(name))>0),
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','merged')),
 enrolled_on date NOT NULL DEFAULT current_date, last_activity date, privacy_review_due date,
 retention_basis text NOT NULL DEFAULT '', promotions boolean NOT NULL DEFAULT false, consent_ref text NOT NULL DEFAULT '',
 source_data jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(program_id,number));
CREATE TABLE lots (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), member_id uuid NOT NULL REFERENCES members,
 reference text NOT NULL UNIQUE CHECK(length(trim(reference))>0), points integer NOT NULL CHECK(points>0),
 earned_on date NOT NULL DEFAULT current_date, expires_on date NOT NULL, actor text NOT NULL, evidence text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK(expires_on>=earned_on));
CREATE TABLE rewards (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), program_id uuid NOT NULL REFERENCES programs,
 name text NOT NULL, points integer NOT NULL CHECK(points>0), active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(program_id,name));
CREATE TABLE redemptions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), member_id uuid NOT NULL REFERENCES members, reward_id uuid NOT NULL REFERENCES rewards,
 reference text NOT NULL UNIQUE, points integer NOT NULL CHECK(points>0),
 status text NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','approved','completed','cancelled')),
 requested_by text NOT NULL, approved_by text, evidence text NOT NULL DEFAULT '', due_on date NOT NULL DEFAULT current_date,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE allocations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), lot_id uuid NOT NULL REFERENCES lots, redemption_id uuid NOT NULL REFERENCES redemptions,
 points integer NOT NULL CHECK(points>0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(lot_id,redemption_id));
CREATE TABLE notes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), member_id uuid NOT NULL REFERENCES members, note text NOT NULL, actor text NOT NULL,
 due_on date NOT NULL, resolved_on date, resolution text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), action text NOT NULL, actor text NOT NULL, detail jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['programs','tiers','members','lots','rewards','redemptions','allocations','notes','events'] LOOP
 EXECUTE format('CREATE TRIGGER touch BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION touch_updated_at()',t);
 EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t); EXECUTE format('REVOKE ALL ON %I FROM PUBLIC',t);
END LOOP; END $$;
CREATE VIEW lot_balances AS
SELECT l.*, l.points-COALESCE((SELECT sum(a.points) FROM allocations a JOIN redemptions r ON r.id=a.redemption_id WHERE a.lot_id=l.id AND r.status<>'cancelled'),0)::integer remaining
FROM lots l;
CREATE VIEW member_balances AS
SELECT m.id,p.name program,m.number,m.name,m.status,
 COALESCE((SELECT sum(remaining) FROM lot_balances WHERE member_id=m.id AND expires_on>=current_date),0)::integer available_points,
 COALESCE((SELECT sum(remaining) FROM lot_balances WHERE member_id=m.id AND expires_on<current_date),0)::integer expired_points,
 COALESCE((SELECT sum(points) FROM lots WHERE member_id=m.id AND earned_on>current_date-365),0)::integer qualifying_points,
 m.last_activity,m.privacy_review_due
FROM members m JOIN programs p ON p.id=m.program_id;
CREATE VIEW expiring_points AS
SELECT m.number,m.name,p.name program,l.reference,l.remaining points,l.expires_on
FROM lot_balances l JOIN members m ON m.id=l.member_id JOIN programs p ON p.id=m.program_id
WHERE l.remaining>0 AND l.expires_on BETWEEN current_date AND current_date+30;
CREATE VIEW tier_review AS
SELECT b.*,COALESCE((SELECT t.name FROM tiers t JOIN members m ON m.program_id=t.program_id WHERE m.id=b.id AND t.threshold<=b.qualifying_points ORDER BY t.threshold DESC,t.name LIMIT 1),'Unconfigured') suggested_tier FROM member_balances b;
CREATE VIEW reward_queue AS
SELECT r.id,r.reference,m.number,m.name,w.name reward,r.points,r.status,r.due_on,r.requested_by,r.approved_by
FROM redemptions r JOIN members m ON m.id=r.member_id JOIN rewards w ON w.id=r.reward_id;
CREATE VIEW compliance_checks AS
SELECT m.id,m.number,m.name,'retention_review' rule,'Record a retention basis and review date' finding
FROM members m WHERE m.retention_basis='' OR m.privacy_review_due IS NULL OR m.privacy_review_due<current_date
UNION ALL SELECT m.id,m.number,m.name,'promotion_evidence','Promotions enabled without evidence' FROM members m WHERE m.promotions AND m.consent_ref=''
UNION ALL SELECT m.id,m.number,m.name,'program_terms','Programme terms reference missing' FROM members m JOIN programs p ON p.id=m.program_id WHERE p.terms_ref='';
