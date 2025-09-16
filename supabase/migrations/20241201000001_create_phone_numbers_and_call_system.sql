CREATE TABLE IF NOT EXISTS phone_numbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  twilio_sid TEXT UNIQUE,
  phone_number TEXT NOT NULL,
  friendly_name TEXT,
  country_code TEXT,
  area_code TEXT,
  capabilities JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  monthly_price DECIMAL(10,2),
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS available_numbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL UNIQUE,
  friendly_name TEXT,
  country_code TEXT,
  area_code TEXT,
  region TEXT,
  capabilities JSONB DEFAULT '{}',
  monthly_price DECIMAL(10,2),
  twilio_sid TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS call_flows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  flow_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS call_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE CASCADE,
  call_flow_id UUID REFERENCES call_flows(id) ON DELETE SET NULL,
  twilio_call_sid TEXT,
  from_number TEXT,
  to_number TEXT,
  direction TEXT,
  status TEXT,
  duration INTEGER,
  recording_url TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT DEFAULT 'free',
  billing_cycle_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  billing_cycle_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month'),
  number_releases_used INTEGER DEFAULT 0,
  max_number_releases INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  address TEXT,
  token_identifier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_phone_numbers_updated_at BEFORE UPDATE ON phone_numbers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_call_flows_updated_at BEFORE UPDATE ON call_flows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE phone_numbers;
ALTER PUBLICATION supabase_realtime ADD TABLE call_flows;
ALTER PUBLICATION supabase_realtime ADD TABLE call_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE user_subscriptions;