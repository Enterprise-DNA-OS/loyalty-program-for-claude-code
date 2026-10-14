CREATE TABLE source_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), member_id uuid NOT NULL REFERENCES members,
 object_name text NOT NULL, source_id text NOT NULL, data jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(object_name,source_id));
CREATE TRIGGER touch BEFORE UPDATE ON source_records FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
ALTER TABLE source_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON source_records FROM PUBLIC;
