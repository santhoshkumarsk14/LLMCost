-- Supabase Migration File
-- This file contains the complete database schema for the LLM API cost optimization platform

-- ========================================
-- Enums
-- ========================================

CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'pro', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due');
CREATE TYPE provider AS ENUM ('openai', 'anthropic', 'google');
CREATE TYPE status AS ENUM ('success', 'error', 'cached');
CREATE TYPE budget_type AS ENUM ('daily', 'weekly', 'monthly');
CREATE TYPE budget_status AS ENUM ('active', 'paused', 'exceeded');

-- ========================================
-- Tables
-- ========================================

CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  subscription_tier subscription_tier DEFAULT 'free',
  subscription_status subscription_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider provider NOT NULL,
  api_key TEXT NOT NULL,
  nickname TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE api_requests (
   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
   user_id UUID REFERENCES users(id) ON DELETE CASCADE,
   api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
   provider provider NOT NULL,
   model TEXT NOT NULL,
   tokens_used INTEGER,
   cost DECIMAL(10,4),
   savings DECIMAL(10,4) DEFAULT 0,
   latency INTEGER,
   status status DEFAULT 'success',
   created_at TIMESTAMPTZ DEFAULT NOW()
 );

CREATE TABLE cache_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  request_hash TEXT UNIQUE NOT NULL,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  limit DECIMAL(10,2) NOT NULL,
  current_spend DECIMAL(10,2) DEFAULT 0,
  alert_threshold DECIMAL(5,2) NOT NULL,
  status budget_status DEFAULT 'active',
  notification_channels TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE optimization_rules (
   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
   user_id UUID REFERENCES users(id) ON DELETE CASCADE,
   name TEXT NOT NULL,
   source_model TEXT NOT NULL,
   target_model TEXT NOT NULL,
   conditions JSONB,
   enabled BOOLEAN DEFAULT true,
   savings_usd DECIMAL(10,2) DEFAULT 0,
   created_at TIMESTAMPTZ DEFAULT NOW()
 );

-- ========================================
-- Row Level Security Policies
-- ========================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Enable RLS on api_keys table
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Users can view their own api_keys
CREATE POLICY "Users can view own api_keys" ON api_keys
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own api_keys
CREATE POLICY "Users can insert own api_keys" ON api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own api_keys
CREATE POLICY "Users can update own api_keys" ON api_keys
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own api_keys
CREATE POLICY "Users can delete own api_keys" ON api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on api_requests table
ALTER TABLE api_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own api_requests
CREATE POLICY "Users can view own api_requests" ON api_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own api_requests
CREATE POLICY "Users can insert own api_requests" ON api_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable RLS on cache_entries table
ALTER TABLE cache_entries ENABLE ROW LEVEL SECURITY;

-- Users can view their own cache_entries
CREATE POLICY "Users can view own cache_entries" ON cache_entries
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own cache_entries
CREATE POLICY "Users can insert own cache_entries" ON cache_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own cache_entries
CREATE POLICY "Users can update own cache_entries" ON cache_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own cache_entries
CREATE POLICY "Users can delete own cache_entries" ON cache_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on budgets table
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Users can view their own budgets
CREATE POLICY "Users can view own budgets" ON budgets
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own budgets
CREATE POLICY "Users can insert own budgets" ON budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own budgets
CREATE POLICY "Users can update own budgets" ON budgets
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own budgets
CREATE POLICY "Users can delete own budgets" ON budgets
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on optimization_rules table
ALTER TABLE optimization_rules ENABLE ROW LEVEL SECURITY;

-- Users can view their own optimization_rules
CREATE POLICY "Users can view own optimization_rules" ON optimization_rules
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own optimization_rules
CREATE POLICY "Users can insert own optimization_rules" ON optimization_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own optimization_rules
CREATE POLICY "Users can update own optimization_rules" ON optimization_rules
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own optimization_rules
CREATE POLICY "Users can delete own optimization_rules" ON optimization_rules
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- Indexes
-- ========================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_provider ON api_keys(provider);

CREATE INDEX idx_api_requests_user_id ON api_requests(user_id);
CREATE INDEX idx_api_requests_api_key_id ON api_requests(api_key_id);
CREATE INDEX idx_api_requests_created_at ON api_requests(created_at);

CREATE INDEX idx_cache_entries_user_id ON cache_entries(user_id);
CREATE INDEX idx_cache_entries_request_hash ON cache_entries(request_hash);
CREATE INDEX idx_cache_entries_expires_at ON cache_entries(expires_at);

CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_type ON budgets(type);
CREATE INDEX idx_budgets_status ON budgets(status);

CREATE INDEX idx_optimization_rules_user_id ON optimization_rules(user_id);

-- ========================================
-- Sample Data
-- ========================================

-- Insert sample users
INSERT INTO users (id, email, full_name, subscription_tier, subscription_status) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'user1@example.com', 'User One', 'starter', 'active'),
  ('550e8400-e29b-41d4-a716-446655440001', 'user2@example.com', 'User Two', 'pro', 'active');

-- Insert sample api_keys
INSERT INTO api_keys (user_id, provider, api_key) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'openai', 'sk-sample-key1'),
  ('550e8400-e29b-41d4-a716-446655440001', 'anthropic', 'sk-sample-key2');

-- Insert sample api_requests
INSERT INTO api_requests (user_id, api_key_id, provider, model, tokens_used, cost, latency, status) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', (SELECT id FROM api_keys WHERE user_id = '550e8400-e29b-41d4-a716-446655440000' LIMIT 1), 'openai', 'gpt-3.5-turbo', 100, 0.0020, 1500, 'success'),
  ('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM api_keys WHERE user_id = '550e8400-e29b-41d4-a716-446655440001' LIMIT 1), 'anthropic', 'claude-3', 200, 0.0040, 2000, 'success');

-- Insert sample cache_entries
INSERT INTO cache_entries (user_id, request_hash, response, expires_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'hash1', 'Cached response 1', NOW() + INTERVAL '1 day'),
  ('550e8400-e29b-41d4-a716-446655440001', 'hash2', 'Cached response 2', NOW() + INTERVAL '1 day');

-- Insert sample budgets
INSERT INTO budgets (user_id, type, limit, current_spend, alert_threshold, status, notification_channels) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Monthly API Budget', 100.00, 20.00, 80.00, 'active', ARRAY['email']),
  ('550e8400-e29b-41d4-a716-446655440001', 'Daily Budget', 10.00, 5.00, 75.00, 'active', ARRAY['email', 'slack']);

-- Insert sample optimization_rules
INSERT INTO optimization_rules (user_id, name, source_model, target_model, conditions, enabled, savings_usd) VALUES
   ('550e8400-e29b-41d4-a716-446655440000', 'Short Prompts to GPT-3.5', 'gpt-4', 'gpt-3.5-turbo', '{"promptLength": 100, "keywords": ["simple", "basic"]}', true, 45.20),
   ('550e8400-e29b-41d4-a716-446655440001', 'Long Responses to Claude', 'gpt-4', 'claude-3-haiku', '{"responseLength": 500, "timeOfDay": "off-peak"}', false, 23.50);

-- ========================================
-- Idempotent Updates
-- ========================================

DO $$
BEGIN
    -- Add savings column to api_requests if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_requests' AND column_name = 'savings') THEN
        ALTER TABLE api_requests ADD COLUMN savings DECIMAL(10,4) DEFAULT 0;
    END IF;

    -- Rename savings to savings_usd in optimization_rules if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'optimization_rules' AND column_name = 'savings') THEN
        ALTER TABLE optimization_rules RENAME COLUMN savings TO savings_usd;
    END IF;
END $$;