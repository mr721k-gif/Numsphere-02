-- This migration is unsafe and should be replaced with a safer one
-- It's a placeholder to demonstrate the structure
-- In a real scenario, you would use a safer migration approach

CREATE TABLE IF NOT EXISTS call_flows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  flow_json JSONB NOT NULL DEFAULT '{}',
  recording_enabled BOOLEAN NOT NULL DEFAULT false,
  recording_disclaimer TEXT NOT NULL DEFAULT 'This call is being recorded for training purposes.',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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