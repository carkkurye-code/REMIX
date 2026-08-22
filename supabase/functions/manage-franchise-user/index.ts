import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[manage-franchise-user] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Sunucu yapılandırmasında SUPABASE_SERVICE_ROLE_KEY veya SUPABASE_URL eksik.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // --------------------------------------------------------------------------
    // STRICT SECURITY GATE: Verify JWT & Require Super Admin Authorization
    // --------------------------------------------------------------------------
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("[manage-franchise-user] Rejected request: Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Yetkilendirme başlığı (Authorization: Bearer <token>) eksik. Lütfen Super Admin olarak giriş yapın.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Geçersiz veya boş oturum token'ı.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Authenticate token with Supabase Auth
    const { data: callerAuth, error: callerAuthError } = await adminClient.auth.getUser(token);
    if (callerAuthError || !callerAuth?.user) {
      console.warn("[manage-franchise-user] Rejected request: Invalid JWT token:", callerAuthError?.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Geçersiz veya süresi dolmuş oturum token'ı.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const callerUser = callerAuth.user;
    const callerEmail = callerUser.email?.toLowerCase().trim();

    // Verify Super Admin permission
    let isSuperAdmin = false;

    // A. Fast-path known super admin emails
    if (callerEmail === "admin@ugra.app" || callerEmail === "goko@ugra.app") {
      isSuperAdmin = true;
    }

    // B. Check admin_role_users table for super_admin role & global scope
    if (!isSuperAdmin) {
      try {
        const { data: roleRecords, error: roleCheckErr } = await adminClient
          .from("admin_role_users")
          .select("role, scope, active")
          .or(`user_id.eq.${callerUser.id},email.ilike.${callerEmail}`)
          .eq("active", true)
          .limit(1);

        if (!roleCheckErr && roleRecords && roleRecords.length > 0) {
          const roleData = roleRecords[0];
          if (
            (roleData.role === "super_admin" || (roleData.role === "admin" && (roleData.scope === "global" || !roleData.scope))) &&
            roleData.role !== "franchise_manager"
          ) {
            isSuperAdmin = true;
          }
        }
      } catch (e) {
        console.warn("[manage-franchise-user] Role check error:", e);
      }
    }

    // C. Check profiles table for is_admin / super_admin claim
    if (!isSuperAdmin) {
      try {
        const { data: prof } = await adminClient
          .from("profiles")
          .select("role, is_admin")
          .eq("id", callerUser.id)
          .maybeSingle();

        if (prof && (prof.role === "super_admin" || (prof.is_admin === true && prof.role !== "franchise_manager"))) {
          isSuperAdmin = true;
        }
      } catch (e) {
        console.warn("[manage-franchise-user] Profile check error:", e);
      }
    }

    if (!isSuperAdmin) {
      console.warn(`[manage-franchise-user] FORBIDDEN: User ${callerEmail} (ID: ${callerUser.id}) attempted to create/update a franchise manager without super_admin privileges`);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Yetkisiz işlem (403 Forbidden). Bayi yöneticisi oluşturma ve güncelleme yetkisi yalnızca Merkez Super Admin'e aittir.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // Caller is fully verified as Super Admin. Proceed with request payload processing.
    const body = await req.json();
    const { 
      franchise_id, 
      city_id, 
      email, 
      password, 
      full_name, 
      phone,
      action = 'create_or_update'
    } = body;

    console.log(`[manage-franchise-user] Processing ${action} for franchise: ${franchise_id}, email: ${email}`);

    if (!email || !franchise_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "E-posta ve Bayi ID (franchise_id) gereklidir.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    let userId: string | null = null;

    // 1. Check if user already exists in auth.users
    const { data: userList, error: listError } = await adminClient.auth.admin.listUsers();
    if (!listError && userList?.users) {
      const existingUser = userList.users.find(u => u.email?.toLowerCase() === cleanEmail);
      if (existingUser) {
        userId = existingUser.id;
        console.log(`[manage-franchise-user] Found existing user ID: ${userId}`);

        // Update password if provided
        if (password && password.trim().length >= 6) {
          await adminClient.auth.admin.updateUserById(userId, {
            password: password.trim(),
            user_metadata: {
              full_name: full_name || existingUser.user_metadata?.full_name || "",
              phone: phone || existingUser.user_metadata?.phone || "",
              role: "franchise_manager",
              franchise_id,
              city_id
            }
          });
        }
      }
    }

    // 2. If user doesn't exist, create user
    if (!userId) {
      if (!password || password.trim().length < 6) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Yeni bayi kullanıcısı oluştururken en az 6 karakterli bir şifre gereklidir.",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: cleanEmail,
        password: password.trim(),
        email_confirm: true,
        user_metadata: {
          full_name: full_name || "",
          phone: phone || "",
          role: "franchise_manager",
          franchise_id,
          city_id
        },
      });

      if (authError || !authData?.user) {
        console.error("[manage-franchise-user] auth.admin.createUser failed:", authError);
        return new Response(
          JSON.stringify({
            success: false,
            error: authError?.message || "Bayi authentication kullanıcısı oluşturulamadı.",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      userId = authData.user.id;
      console.log(`[manage-franchise-user] Auth user created with ID: ${userId}`);
    }

    // 3. Upsert into public.profiles
    const { error: profileError } = await adminClient.from("profiles").upsert(
      {
        id: userId,
        email: cleanEmail,
        full_name: full_name || "",
        phone: phone || "",
        role: "franchise_manager",
        is_admin: true,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.warn("[manage-franchise-user] profiles upsert notice:", profileError.message);
    }

    // 4. Upsert into public.admin_role_users
    const { error: roleError } = await adminClient.from("admin_role_users").upsert(
      {
        user_id: userId,
        email: cleanEmail,
        name: full_name || "Bayi Yöneticisi",
        role: "franchise_manager",
        scope: "franchise",
        city_id: city_id || null,
        franchise_id: franchise_id,
        active: true,
        last_login: new Date().toISOString()
      },
      { onConflict: "email" }
    );

    if (roleError) {
      console.warn("[manage-franchise-user] admin_role_users upsert notice:", roleError.message);
    }

    // 5. Update franchises table with contact info
    await adminClient.from("franchises").update({
      email: cleanEmail,
      authorized_person: full_name || undefined,
      phone: phone || undefined,
      updated_at: new Date().toISOString()
    }).eq("id", franchise_id);

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        email: cleanEmail,
        franchise_id,
        city_id,
        message: "Bayi yöneticisi hesabı ve yetkilendirmesi başarıyla tamamlandı.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err: any) {
    console.error("[manage-franchise-user] Error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Bayi kullanıcısı oluşturulurken bir hata oluştu.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
