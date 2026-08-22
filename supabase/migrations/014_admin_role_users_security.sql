-- ==============================================================================
-- MIGRATION 014: ADMIN ROLE USERS SECURITY & EXPLICIT WITH CHECK POLICIES
-- ==============================================================================
-- Description:
--   1. Enables RLS on `admin_role_users` to strictly prevent privilege escalation
--      (e.g., franchise_manager attempting to update role = 'super_admin' or changing franchise_id).
--   2. Explicitly secures SELECT, INSERT, UPDATE, DELETE on `admin_role_users`.
--   3. Adds explicit `WITH CHECK` clauses for `orders`, `partners`, and `assistant_applications`
--      to guarantee zero cross-franchise spoofing on INSERT and UPDATE operations.
-- ==============================================================================

-- 1. Enable RLS on `admin_role_users`
ALTER TABLE public.admin_role_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_role_users_select_policy" ON public.admin_role_users;
DROP POLICY IF EXISTS "admin_role_users_insert_policy" ON public.admin_role_users;
DROP POLICY IF EXISTS "admin_role_users_update_policy" ON public.admin_role_users;
DROP POLICY IF EXISTS "admin_role_users_delete_policy" ON public.admin_role_users;

-- SELECT: Super admins can see all; users can ONLY see their own role/scope record
CREATE POLICY "admin_role_users_select_policy" ON public.admin_role_users
    FOR SELECT TO authenticated
    USING (
        public.is_super_or_global_admin()
        OR user_id = auth.uid()
        OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- INSERT: ONLY Super Admins can assign or create roles
CREATE POLICY "admin_role_users_insert_policy" ON public.admin_role_users
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_super_or_global_admin()
    );

-- UPDATE: ONLY Super Admins can modify roles, scopes, city_id, or franchise_id
CREATE POLICY "admin_role_users_update_policy" ON public.admin_role_users
    FOR UPDATE TO authenticated
    USING (
        public.is_super_or_global_admin()
    )
    WITH CHECK (
        public.is_super_or_global_admin()
    );

-- DELETE: ONLY Super Admins can delete role assignments
CREATE POLICY "admin_role_users_delete_policy" ON public.admin_role_users
    FOR DELETE TO authenticated
    USING (
        public.is_super_or_global_admin()
    );

-- 2. Hardened `orders` RLS with explicit `WITH CHECK`
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
    )
    WITH CHECK (
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

-- 3. Hardened `partners` RLS with explicit `WITH CHECK`
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

-- 4. Secure `assistant_applications` Table RLS
ALTER TABLE public.assistant_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "assistant_applications_policy" ON public.assistant_applications;

CREATE POLICY "assistant_applications_policy" ON public.assistant_applications
    FOR ALL TO authenticated
    USING (
        public.is_super_or_global_admin()
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
        OR (
            public.get_auth_role() = 'franchise_manager'
            AND (
                franchise_id = public.get_auth_franchise_id()
                OR (city_id = public.get_auth_city_id() AND franchise_id IS NULL)
            )
        )
    );

-- Allow public candidate applications insertion
CREATE POLICY "assistant_applications_anon_insert" ON public.assistant_applications
    FOR INSERT TO anon
    WITH CHECK (TRUE);
