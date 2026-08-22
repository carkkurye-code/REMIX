-- ==============================================================================
-- MIGRATION 015: FRANCHISE MANAGER STRICT SCOPE, VERI İZOLASYONU & DESTEK SİSTEMİ
-- ==============================================================================
-- KAPSAM VE YETKİ TALİMATI GEREKSİNİMLERİ:
-- 1. franchise_manager yalnızca kendi franchise_id ve city_id kapsamındaki verileri görebilir.
-- 2. franchise_id, city_id, role, scope, revenue_share_percentage değerlerini ASLA değiştiremez.
-- 3. Bölge işletmesi oluştururken (INSERT) franchise_id ve city_id zorunlu olarak kullanıcının 
--    kendi franchise_id ve city_id değerlerine eşit olmak zorundadır (WITH CHECK).
-- 4. Genel Merkez ile iletişim için `franchise_support_tickets` tablosu ve RLS kuralları.
-- ==============================================================================

-- 1. Destek / Genel Merkez İletişimi Tablosu
CREATE TABLE IF NOT EXISTS public.franchise_support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    franchise_id TEXT NOT NULL,
    city_id TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT,
    user_email TEXT,
    subject TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'genel',
    priority TEXT NOT NULL DEFAULT 'normal',
    message TEXT NOT NULL,
    attachment_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_reply TEXT,
    replied_at TIMESTAMPTZ,
    replied_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT check_ticket_status CHECK (status IN ('pending', 'in_review', 'answered', 'resolved', 'closed')),
    CONSTRAINT check_ticket_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    CONSTRAINT check_ticket_category CHECK (category IN ('finans_hakedis', 'isletme_onay', 'sozlesme_hukuk', 'teknik_destek', 'bolgesel_talep', 'genel'))
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_franchise_id ON public.franchise_support_tickets(franchise_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_city_id ON public.franchise_support_tickets(city_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.franchise_support_tickets(status);

-- 2. RLS for `franchise_support_tickets`
ALTER TABLE public.franchise_support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_tickets_select_policy" ON public.franchise_support_tickets;
DROP POLICY IF EXISTS "support_tickets_insert_policy" ON public.franchise_support_tickets;
DROP POLICY IF EXISTS "support_tickets_update_policy" ON public.franchise_support_tickets;

-- Bayi yalnızca kendi bayiliğine ait destek biletlerini görebilir. Genel Merkez tümünü görebilir.
CREATE POLICY "support_tickets_select_policy" ON public.franchise_support_tickets
    FOR SELECT TO authenticated
    USING (
        public.is_super_or_global_admin()
        OR (
            public.get_auth_role() = 'franchise_manager'
            AND franchise_id = public.get_auth_franchise_id()
        )
    );

-- Bayi yalnızca kendi franchise_id'si ile destek bileti oluşturabilir.
CREATE POLICY "support_tickets_insert_policy" ON public.franchise_support_tickets
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_super_or_global_admin()
        OR (
            public.get_auth_role() = 'franchise_manager'
            AND franchise_id = public.get_auth_franchise_id()
        )
    );

-- Sadece Genel Merkez adminleri cevap yazabilir veya statü değiştirebilir (veya bayi kendi mesajını kapatabilir)
CREATE POLICY "support_tickets_update_policy" ON public.franchise_support_tickets
    FOR UPDATE TO authenticated
    USING (
        public.is_super_or_global_admin()
        OR (
            public.get_auth_role() = 'franchise_manager'
            AND franchise_id = public.get_auth_franchise_id()
        )
    )
    WITH CHECK (
        public.is_super_or_global_admin()
        OR (
            public.get_auth_role() = 'franchise_manager'
            AND franchise_id = public.get_auth_franchise_id()
        )
    );

-- 3. Strict RLS for `partners` (Bölge İşletmeleri İzolasyonu)
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partners_franchise_select_policy" ON public.partners;
DROP POLICY IF EXISTS "partners_franchise_insert_policy" ON public.partners;
DROP POLICY IF EXISTS "partners_franchise_update_policy" ON public.partners;

CREATE POLICY "partners_franchise_select_policy" ON public.partners
    FOR SELECT TO authenticated, anon
    USING (
        active = TRUE
        OR public.is_super_or_global_admin()
        OR user_id = auth.uid()
        OR (
            public.get_auth_role() = 'franchise_manager'
            AND (
                franchise_id = public.get_auth_franchise_id()
                OR (city_id = public.get_auth_city_id() AND franchise_id IS NULL)
            )
        )
    );

CREATE POLICY "partners_franchise_insert_policy" ON public.partners
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_super_or_global_admin()
        OR (
            public.get_auth_role() = 'franchise_manager'
            AND franchise_id = public.get_auth_franchise_id()
            AND (city_id = public.get_auth_city_id() OR city_id IS NULL)
        )
    );

CREATE POLICY "partners_franchise_update_policy" ON public.partners
    FOR UPDATE TO authenticated
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
            AND franchise_id = public.get_auth_franchise_id()
        )
    );

-- 4. Strict RLS for `franchises` (Bayi Bilgileri Salt Okunur Güvenlik Kuralı)
-- Bayi yöneticisi komisyon oranını (revenue_share_percentage), franchise_id'yi veya status'ü DEĞİŞTİREMEZ.
DROP POLICY IF EXISTS "franchises_manage_policy" ON public.franchises;
DROP POLICY IF EXISTS "franchises_readonly_for_manager_policy" ON public.franchises;

CREATE POLICY "franchises_manage_policy" ON public.franchises
    FOR ALL TO authenticated
    USING (
        public.is_super_or_global_admin()
    )
    WITH CHECK (
        public.is_super_or_global_admin()
    );

-- Tamamlandı: Bayi yöneticisi yalnızca yetkili verilerini görebilir, işletme eklerken otomatik franchise_id denetlenir.
