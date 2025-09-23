CREATE TABLE IF NOT EXISTS call_flows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY
);

ALTER TABLE call_flows
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS flow_json JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS recording_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recording_disclaimer TEXT NOT NULL DEFAULT 'This call is being recorded for training purposes.',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS call_flows_user_phone_unique ON call_flows(user_id, phone_number);

CREATE OR REPLACE FUNCTION update_call_flows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_call_flows_updated_at ON call_flows;
CREATE TRIGGER update_call_flows_updated_at BEFORE UPDATE ON call_flows FOR EACH ROW EXECUTE FUNCTION update_call_flows_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE call_flows;