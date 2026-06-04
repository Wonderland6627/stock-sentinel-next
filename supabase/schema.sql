-- Stock Sentinel database schema
-- Safe to rerun: this migration creates missing objects and adds missing columns.
-- It does not drop existing tables or data.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_status') THEN
    CREATE TYPE public.stock_status AS ENUM ('holding', 'sold', 'stop_loss');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nickname TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON public.profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END $$;

INSERT INTO public.profiles (id, email)
SELECT id, email
FROM auth.users
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.user_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stock_code TEXT NOT NULL,
  stock_name TEXT,
  entry_date DATE NOT NULL,
  entry_price NUMERIC(12,4) NOT NULL,
  td9_low_price NUMERIC(12,4) NOT NULL,
  layer_count INT DEFAULT 1 CHECK (layer_count BETWEEN 1 AND 2),
  status public.stock_status DEFAULT 'holding',
  sell_records JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_stocks
  ADD COLUMN IF NOT EXISTS strategy_id TEXT,
  ADD COLUMN IF NOT EXISTS strategy_version TEXT,
  ADD COLUMN IF NOT EXISTS signal_date DATE,
  ADD COLUMN IF NOT EXISTS entry_signal_label TEXT;

ALTER TABLE public.user_stocks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_stocks'
      AND policyname = 'Users can manage own stocks'
  ) THEN
    CREATE POLICY "Users can manage own stocks"
      ON public.user_stocks FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_stocks_user_id
  ON public.user_stocks(user_id);

CREATE INDEX IF NOT EXISTS idx_user_stocks_status
  ON public.user_stocks(status);

CREATE TABLE IF NOT EXISTS public.strategy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id TEXT NOT NULL,
  strategy_version TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  description TEXT,
  released_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (strategy_id, strategy_version)
);

ALTER TABLE public.strategy_versions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_strategy_versions_lookup
  ON public.strategy_versions(strategy_id, strategy_version);

INSERT INTO public.strategy_versions (
  strategy_id,
  strategy_version,
  is_active,
  description
)
VALUES (
  'td9_boll_v1',
  '1.0.0',
  true,
  'TD setup 7-9 with Bollinger lower-band context'
)
ON CONFLICT (strategy_id, strategy_version) DO UPDATE
SET is_active = EXCLUDED.is_active,
    description = EXCLUDED.description;

CREATE TABLE IF NOT EXISTS public.strategy_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id TEXT NOT NULL,
  strategy_version TEXT NOT NULL,
  stock_pool_version TEXT NOT NULL,
  matched_count INT NOT NULL DEFAULT 0,
  sample_codes TEXT[] NOT NULL DEFAULT '{}',
  duration_ms INT NOT NULL DEFAULT 0,
  error_count INT NOT NULL DEFAULT 0,
  notes JSONB NOT NULL DEFAULT '{}'::jsonb,
  run_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.strategy_runs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_strategy_runs_strategy
  ON public.strategy_runs(strategy_id, strategy_version, run_at DESC);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
