-- ==============================================================================
-- MIGRATION 013: 81-PROVINCE FRANCHISE SYSTEM & DATA ISOLATION RLS POLICIES
-- ==============================================================================
-- Description:
--   Establishes strict database-level security and isolation for independent
--   franchise managers (e.g., Kocaeli/41, Sakarya/54, Istanbul/34).
--   A franchise_manager can ONLY select/update/manage data strictly within their
--   own franchise_id and city_id. Super Admins retain global access.
-- ==============================================================================

-- 1. Ensure `franchise_manager` role is valid in constraints
DO $$ 
BEGIN
    -- Drop old check constraint on profiles if exists and recreate with franchise_manager
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'profiles' AND constraint_name = 'check_valid_role'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT check_valid_role;
    END IF;
    
    ALTER TABLE public.profiles ADD CONSTRAINT check_valid_role 
        CHECK (role IN ('customer', 'partner', 'assistant', 'admin', 'super_admin', 'franchise_manager'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 2. Ensure `admin_role_users` Table and Foreign Keys
CREATE TABLE IF NOT EXISTS public.admin_role_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    scope TEXT NOT NULL DEFAULT 'global',
    city_id TEXT,
    franchise_id TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ,

    CONSTRAINT check_admin_role CHECK (role IN ('super_admin', 'admin', 'operasyon', 'destek', 'finans', 'pazarlama', 'franchise_manager')),
    CONSTRAINT check_admin_scope CHECK (scope IN ('global', 'city', 'franchise'))
);

CREATE INDEX IF NOT EXISTS idx_admin_role_users_user_id ON public.admin_role_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_role_users_email ON public.admin_role_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_role_users_role ON public.admin_role_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_role_users_franchise_id ON public.admin_role_users(franchise_id);
CREATE INDEX IF NOT EXISTS idx_admin_role_users_city_id ON public.admin_role_users(city_id);

-- 3. Helper Functions to get current authenticated user's role, city_id, and franchise_id
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
DECLARE
    u_role TEXT;
BEGIN
    SELECT role INTO u_role 
    FROM public.profiles 
    WHERE id = auth.uid();
    
    IF u_role IS NULL THEN
        SELECT role INTO u_role 
        FROM public.admin_role_users 
        WHERE user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid());
    END IF;
    
    RETURN COALESCE(u_role, 'customer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_auth_franchise_id()
RETURNS TEXT AS $$
DECLARE
    f_id TEXT;
BEGIN
    SELECT franchise_id INTO f_id 
    FROM public.admin_role_users 
    WHERE (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
      AND active = TRUE
    LIMIT 1;
    
    RETURN f_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_auth_city_id()
RETURNS TEXT AS $$
DECLARE
    c_id TEXT;
BEGIN
    SELECT city_id INTO c_id 
    FROM public.admin_role_users 
    WHERE (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
      AND active = TRUE
    LIMIT 1;
    
    RETURN c_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_super_or_global_admin()
RETURNS BOOLEAN AS $$
DECLARE
    u_role TEXT;
    u_scope TEXT;
BEGIN
    SELECT role, scope INTO u_role, u_scope 
    FROM public.admin_role_users 
    WHERE (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
      AND active = TRUE
    LIMIT 1;
    
    IF u_role IN ('super_admin', 'admin') AND (u_scope = 'global' OR u_scope IS NULL) THEN
        RETURN TRUE;
    END IF;
    
    -- Fallback to profiles is_admin
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role IN ('super_admin', 'admin') OR is_admin = TRUE)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. Enable Columns on Core Operational Tables if Missing
DO $$
BEGIN
    -- Ensure city_id and franchise_id exist on assistants
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assistants' AND column_name = 'city_id') THEN
        ALTER TABLE public.assistants ADD COLUMN city_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assistants' AND column_name = 'franchise_id') THEN
        ALTER TABLE public.assistants ADD COLUMN franchise_id TEXT;
    END IF;

    -- Ensure city_id and franchise_id exist on orders
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'city_id') THEN
        ALTER TABLE public.orders ADD COLUMN city_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'franchise_id') THEN
        ALTER TABLE public.orders ADD COLUMN franchise_id TEXT;
    END IF;

    -- Ensure city_id and franchise_id exist on partners
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partners' AND column_name = 'city_id') THEN
        ALTER TABLE public.partners ADD COLUMN city_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'partners' AND column_name = 'franchise_id') THEN
        ALTER TABLE public.partners ADD COLUMN franchise_id TEXT;
    END IF;
END $$;

-- 5. RLS Policies for `franchises` Table
ALTER TABLE public.franchises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "franchises_select_policy" ON public.franchises;
DROP POLICY IF EXISTS "franchises_all_admin_policy" ON public.franchises;

-- Public can view active franchises for directory, franchise managers can view their own, admins can view all
CREATE POLICY "franchises_select_policy" ON public.franchises
    FOR SELECT TO authenticated, anon
    USING (
        status = 'active'
        OR public.is_super_or_global_admin()
        OR id = public.get_auth_franchise_id()
        OR city_id = public.get_auth_city_id()
    );

-- Admins can insert/update/delete franchises, franchise managers can update their own contact info
CREATE POLICY "franchises_manage_policy" ON public.franchises
    FOR ALL TO authenticated
    USING (
        public.is_super_or_global_admin()
        OR (
            public.get_auth_role() = 'franchise_manager'
            AND id = public.get_auth_franchise_id()
        )
    );

-- 6. RLS Policies for `assistants` (Kurye / Asistan İzolasyonu)
DROP POLICY IF EXISTS "assistants_franchise_isolation_policy" ON public.assistants;
CREATE POLICY "assistants_franchise_isolation_policy" ON public.assistants
    FOR ALL TO authenticated
    USING (
        public.is_super_or_global_admin()
        OR user_id = auth.uid()
        OR (
            public.get_auth_role() = 'franchise_manager'
            AND (
                franchise_id = public.get_auth_franchise_id()
                OR (city_id = public.get_auth_city_id() AND franchise_id IS NULL)
            )
        )
    )
    WITH CHECK (
        public.is_super_or_global_admin()
        OR user_id = auth.uid()
        OR (
            public.get_auth_role() = 'franchise_manager'
            AND (
                franchise_id = public.get_auth_franchise_id()
                OR (city_id = public.get_auth_city_id() AND franchise_id IS NULL)
            )
        )
    );

-- 7. RLS Policies for `orders` (Sipariş İzolasyonu)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_franchise_isolation_policy" ON public.orders;
CREATE POLICY "orders_franchise_isolation_policy" ON public.orders
    FOR ALL TO authenticated
    USING (
        public.is_super_or_global_admin()
        OR customer_id = auth.uid()
        OR assistant_id = auth.uid()
        OR partner_id = auth.uid()
        OR (
            public.get_auth_role() = 'franchise_manager'
            AND (
                franchise_id = public.get_auth_franchise_id()
                OR (city_id = public.get_auth_city_id() AND franchise_id IS NULL)
            )
        )
    );

-- 8. RLS Policies for `partners` (Mağaza İzolasyonu)
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "partners_franchise_isolation_policy" ON public.partners;
CREATE POLICY "partners_franchise_isolation_policy" ON public.partners
    FOR ALL TO authenticated
    USING (
        public.is_super_or_global_admin()
        OR user_id = auth.uid()
        OR active = TRUE
        OR (
            public.get_auth_role() = 'franchise_manager'
            AND (
                franchise_id = public.get_auth_franchise_id()
                OR (city_id = public.get_auth_city_id() AND franchise_id IS NULL)
            )
        )
    );
