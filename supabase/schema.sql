-- Stock Sentinel Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- 第一部分：清理旧数据（如果需要重新开始）
-- ============================================

-- 删除旧表（按依赖顺序）
DROP TABLE IF EXISTS user_stocks CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 删除旧类型
DROP TYPE IF EXISTS stock_status CASCADE;

-- 删除旧触发器和函数
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ============================================
-- 第二部分：创建新表和类型
-- ============================================

-- 1. Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nickname TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 启用行级安全
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. 创建枚举类型
CREATE TYPE stock_status AS ENUM ('holding', 'sold', 'stop_loss');

-- 3. User stocks table
CREATE TABLE user_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stock_code TEXT NOT NULL,
  stock_name TEXT,
  entry_date DATE NOT NULL,
  entry_price NUMERIC(12,4) NOT NULL,
  td9_low_price NUMERIC(12,4) NOT NULL,
  layer_count INT DEFAULT 1 CHECK (layer_count BETWEEN 1 AND 2),
  status stock_status DEFAULT 'holding',
  sell_records JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 启用行级安全
ALTER TABLE user_stocks ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Users can manage own stocks"
  ON user_stocks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 创建索引
CREATE INDEX idx_user_stocks_user_id ON user_stocks(user_id);
CREATE INDEX idx_user_stocks_status ON user_stocks(status);

-- ============================================
-- 第三部分：创建触发器（自动创建 profile）
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
