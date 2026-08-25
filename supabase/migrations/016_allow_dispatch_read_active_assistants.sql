-- ==============================================================================
-- MIGRATION 016: ALLOW DISPATCH ENGINE TO READ ACTIVE ASSISTANTS (RLS FIX)
-- ==============================================================================
-- Problem Solved:
--   In migration 013, `assistants_franchise_isolation_policy` on `public.assistants`
--   was defined as `FOR ALL TO authenticated USING (user_id = auth.uid() OR admin OR franchise_manager)`.
--   When a customer creates an order, the client-side `dispatchToNextCandidate` engine
--   queries `public.assistants` to find active field candidates.
--   Because the customer is not the assistant, the query returned 0 rows, leading to:
--   `[LiveDispatch] No candidates available...` and preventing `dispatch_offers` from being created.
--
-- Security Strategy:
--   1. Drop the monolithic `FOR ALL` policy.
--   2. Create `assistants_select_policy` for SELECT only:
--      - Super/Global Admins: Full read access.
--      - Assistants: Can view their own profile.
--      - Franchise Managers: Can view assistants within their assigned franchise/city.
--      - Dispatch / Authenticated: Can ONLY read active/online field assistants needed for dispatch candidate matching.
--   3. Create `assistants_write_policy` for INSERT/UPDATE/DELETE:
--      - Strictly restricted to Super/Global Admins, the Assistant themselves (own profile), and Franchise Managers.
--      - Customers and dispatch queries CANNOT insert, update, or delete assistant records.
-- ==============================================================================

ALTER TABLE public.assistants ENABLE ROW LEVEL SECURITY;

-- 1. Drop existing monolithic policy
DROP POLICY IF EXISTS "assistants_franchise_isolation_policy" ON public.assistants;
DROP POLICY IF EXISTS "assistants_select_policy" ON public.assistants;
DROP POLICY IF EXISTS "assistants_write_policy" ON public.assistants;

-- 2. SELECT Policy: Allows reading active field assistants for dispatch matching
CREATE POLICY "assistants_select_policy" ON public.assistants
    FOR SELECT TO authenticated
    USING (
        -- Admins have full read access
        public.is_super_or_global_admin()

        -- Assistants can always view their own profile
        OR user_id = auth.uid()

        -- Franchise Managers can view assistants in their franchise/city
        OR (
            public.get_auth_role() = 'franchise_manager'
            AND (
                franchise_id = public.get_auth_franchise_id()
                OR (city_id = public.get_auth_city_id() AND franchise_id IS NULL)
            )
        )

        -- Dispatch matching: Authenticated users can view active and online field assistants
        OR (
            (status IS NULL OR status IN ('aktif', 'active', 'musait', 'available'))
            AND is_online IS NOT FALSE
            AND active IS NOT FALSE
        )
    );

-- 3. WRITE Policy: Strictly restricts INSERT, UPDATE, DELETE (No dispatch write access)
CREATE POLICY "assistants_write_policy" ON public.assistants
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
