import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { 
  Lock, Mail, AlertCircle, Eye, EyeOff, Loader2, 
  Building2, ShieldCheck, ChevronRight
} from 'lucide-react';
import { db, isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase';

export function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error('Lütfen e-posta adresinizi ve şifrenizi giriniz.');
      }

      const cleanEmail = email.trim().toLowerCase();
      let user: any = null;

      // Real auth attempt
      if (isSupabaseConfigured && supabaseAdmin) {
        const { data, error: authErr } = await supabaseAdmin.auth.signInWithPassword({
          email: cleanEmail,
          password: password.trim(),
        });
        if (authErr) throw new Error(authErr.message || 'Giriş yapılamadı.');
        user = data?.user;
      } else {
        const res = await db.signIn(cleanEmail, password.trim());
        user = res?.user;
      }

      if (user) {
        // 1. Check user role and scope from admin_role_users
        const roleScope = await db.getUserRoleAndScope(user.id, user.email || cleanEmail);

        if (roleScope) {
          if (roleScope.role === 'franchise_manager' || roleScope.scope === 'franchise') {
            setLocation('/bayi');
            return;
          }
          if (['super_admin', 'admin', 'operasyon', 'destek', 'finans', 'pazarlama'].includes(roleScope.role)) {
            setLocation('/admin');
            return;
          }
        }

        // 2. Check Admin
        const isSuper = await db.isUserSuperAdmin(user.id, user.email || cleanEmail);
        const isAdmin = await db.isUserAdmin(user.id, user.email || cleanEmail);
        if (isSuper || isAdmin) {
          setLocation('/admin');
          return;
        }

        // 3. Check Assistant or Partner via user_metadata
        const metaRole = user.user_metadata?.role;
        if (metaRole === 'assistant' || metaRole === 'asistan') {
          setLocation('/asistan');
          return;
        } else if (metaRole === 'partner') {
          setLocation('/partner');
          return;
        }

        // 4. Default to Home
        setLocation('/');
        return;
      } else {
        throw new Error('Giriş başarısız. Lütfen bilgilerinizi kontrol ediniz.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Giriş yapılırken bir hata oluştu. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col justify-between selection:bg-amber-400 selection:text-black">
      {/* Top Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 no-underline cursor-pointer group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-black text-lg shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            U
          </div>
          <div>
            <div className="text-base font-black tracking-tight text-white flex items-center gap-2">
              UĞRA <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold uppercase tracking-wider">Portalı</span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium">Güvenli Giriş ve Yetkilendirme</p>
          </div>
        </Link>
        <Link
          href="/"
          className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1 font-bold no-underline"
        >
          <span>Ana Sayfaya Dön</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </header>

      {/* Center Login Box */}
      <div className="flex-1 flex items-center justify-center p-4 my-8">
        <div className="w-full max-w-md bg-[#131826] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3.5 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20 mb-1 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Yetkili Girişi</h1>
            <p className="text-xs text-gray-400 leading-relaxed">
              Yönetici, Bayi veya Operasyon hesabınıza erişmek için oturum açınız.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-300">
                E-posta Adresi
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@ugra.app"
                  className="w-full bg-[#1A2133] border border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none rounded-xl pl-10 pr-3 py-3 text-xs sm:text-sm text-white placeholder:text-gray-600 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-300">
                Şifre
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#1A2133] border border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none rounded-xl pl-10 pr-10 py-3 text-xs sm:text-sm text-white placeholder:text-gray-600 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1 border-0 bg-transparent cursor-pointer"
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-black font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 border-0 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Giriş Yapılıyor...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-black" />
                  <span>Giriş Yap</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-4 text-center text-xs text-gray-500">
        UĞRA Platformu &copy; {new Date().getFullYear()} — Tüm Hakları Saklıdır
      </footer>
    </div>
  );
}
export default LoginPage;
