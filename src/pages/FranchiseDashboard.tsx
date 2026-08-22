import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Building2, Users, ShoppingBag, DollarSign, MapPin, 
  Search, ShieldCheck, LogOut, CheckCircle2, 
  Clock, AlertCircle, RefreshCw, ChevronRight, Phone, Mail, 
  Bike, Car, Percent, ArrowUpRight, Check, X, Store, Eye,
  Lock, KeyRound, Sparkles, Navigation
} from 'lucide-react';
import { 
  db, 
  Assistant, 
  Order, 
  Partner, 
  Franchise, 
  City, 
  AssistantSubscription,
  TURKEY_PROVINCES
} from '@/lib/supabase';
import { useFranchiseAuth } from '@/context/FranchiseAuthContext';

export default function FranchiseDashboard() {
  const { 
    franchiseUser, 
    franchiseManager, 
    franchise, 
    city, 
    isFranchiseManager, 
    loading: authLoading, 
    signIn, 
    signOut,
    refreshFranchiseData 
  } = useFranchiseAuth();

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Dashboard Data States
  const [activeTab, setActiveTab] = useState<'couriers' | 'orders' | 'partners' | 'finance' | 'settings'>('couriers');
  const [dataLoading, setDataLoading] = useState(false);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [subscriptions, setSubscriptions] = useState<AssistantSubscription[]>([]);
  
  // Courier sub-tab
  const [courierSubTab, setCourierSubTab] = useState<'active_couriers' | 'applications'>('active_couriers');
  const [courierSearch, setCourierSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [partnerSearch, setPartnerSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<Assistant | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // Load franchise scoped data
  const loadFranchiseData = useCallback(async () => {
    if (!franchise && !city) return;
    setDataLoading(true);
    try {
      const fId = franchise?.id || '';
      const cId = city?.id || franchise?.city_id || '';

      const [assistantsRes, ordersRes, partnersRes, subsRes] = await Promise.all([
        db.getFranchiseAssistants(fId, cId),
        db.getFranchiseOrders(fId, cId),
        db.getFranchisePartners(fId, cId),
        db.getFranchiseSubscriptions(fId, cId),
      ]);

      setAssistants(assistantsRes);
      setOrders(ordersRes);
      setPartners(partnersRes);
      setSubscriptions(subsRes);
    } catch (err) {
      console.error('Error loading franchise data:', err);
    } finally {
      setDataLoading(false);
    }
  }, [franchise, city]);

  useEffect(() => {
    if (isFranchiseManager) {
      loadFranchiseData();
    }
  }, [isFranchiseManager, loadFranchiseData]);

  // Handle Login Submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Lütfen e-posta ve şifrenizi giriniz.');
      return;
    }
    setLoginLoading(true);
    setLoginError(null);
    const res = await signIn(loginEmail.trim(), loginPassword.trim());
    if (!res.success) {
      setLoginError(res.error || 'Giriş yapılamadı.');
    }
    setLoginLoading(false);
  };

  // Quick Demo Login for testing
  const handleQuickDemoLogin = async (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
    setLoginLoading(true);
    setLoginError(null);
    const res = await signIn(email, pass);
    if (!res.success) {
      setLoginError(res.error || 'Giriş yapılamadı.');
    }
    setLoginLoading(false);
  };

  // Toggle Assistant Active Status
  const handleToggleAssistantStatus = async (assistant: Assistant) => {
    try {
      const newStatus = assistant.status === 'aktif' || assistant.status === 'active' ? 'pasif' : 'aktif';
      await db.updateAssistant(assistant.id, { status: newStatus as any });
      setAssistants(prev => prev.map(a => a.id === assistant.id ? { ...a, status: newStatus } : a));
      showNotification(`${assistant.full_name} kurye durumu güncellendi.`);
    } catch (e: any) {
      alert('Kurye durumu güncellenemedi: ' + e?.message);
    }
  };

  // Approve Assistant Application
  const handleApproveApplication = async (assistant: Assistant) => {
    try {
      await db.updateAssistant(assistant.id, { status: 'aktif' as any });
      setAssistants(prev => prev.map(a => a.id === assistant.id ? { ...a, status: 'aktif' } : a));
      showNotification(`${assistant.full_name} başvurusu onaylandı ve kurye aktif edildi.`);
    } catch (e: any) {
      alert('Başvuru onaylanamadı: ' + e?.message);
    }
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    const totalCouriers = assistants.length;
    const onlineCouriers = assistants.filter(a => a.is_online || a.status === 'aktif' || a.status === 'active').length;
    const pendingApplications = assistants.filter(a => a.status === 'pending' || (a.status as string) === 'beklemede').length;
    
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'teslim_edildi' || o.status === 'delivered').length;
    const activeOrders = orders.filter(o => ['hazirlaniyor', 'yolda', 'kurye_bekleniyor', 'kurye_atandi', 'preparing', 'on_way'].includes(o.status)).length;
    
    const totalVolume = orders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
    const revenueSharePct = franchise?.revenue_share_percentage || 15;
    const franchiseEarnings = (totalVolume * revenueSharePct) / 100;

    const activePartners = partners.filter(p => p.active !== false).length;

    return {
      totalCouriers,
      onlineCouriers,
      pendingApplications,
      totalOrders,
      completedOrders,
      activeOrders,
      totalVolume,
      revenueSharePct,
      franchiseEarnings,
      activePartners
    };
  }, [assistants, orders, partners, franchise]);

  // Filtered Couriers
  const filteredCouriers = useMemo(() => {
    return assistants.filter(a => {
      const isApp = a.status === 'pending' || (a.status as string) === 'beklemede';
      if (courierSubTab === 'applications' && !isApp) return false;
      if (courierSubTab === 'active_couriers' && isApp) return false;
      if (!courierSearch) return true;
      const q = courierSearch.toLowerCase();
      return (
        a.full_name.toLowerCase().includes(q) ||
        a.phone.toLowerCase().includes(q) ||
        (a.city && a.city.toLowerCase().includes(q))
      );
    });
  }, [assistants, courierSubTab, courierSearch]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (orderStatusFilter !== 'all') {
        if (orderStatusFilter === 'active' && !['hazirlaniyor', 'yolda', 'kurye_bekleniyor', 'kurye_atandi', 'preparing', 'on_way'].includes(o.status)) return false;
        if (orderStatusFilter === 'completed' && o.status !== 'teslim_edildi' && o.status !== 'delivered') return false;
        if (orderStatusFilter === 'cancelled' && o.status !== 'iptal_edildi' && o.status !== 'cancelled') return false;
      }
      if (!orderSearch) return true;
      const q = orderSearch.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
        (o.partner_name && o.partner_name.toLowerCase().includes(q)) ||
        (o.delivery_address && o.delivery_address.toLowerCase().includes(q))
      );
    });
  }, [orders, orderStatusFilter, orderSearch]);

  // Filtered Partners
  const filteredPartners = useMemo(() => {
    return partners.filter(p => {
      if (!partnerSearch) return true;
      const q = partnerSearch.toLowerCase();
      return (
        p.business_name.toLowerCase().includes(q) ||
        (p.address && p.address.toLowerCase().includes(q)) ||
        (p.phone && p.phone.toLowerCase().includes(q))
      );
    });
  }, [partners, partnerSearch]);

  // -------------------------------------------------------------
  // VIEW: AUTH / LOGIN SCREEN (IF NOT LOGGED IN AS FRANCHISE MANAGER)
  // -------------------------------------------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0E131F] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-white">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-sm font-bold tracking-wide">Bayi Portalı Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isFranchiseManager || !franchiseUser) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col justify-between selection:bg-amber-400 selection:text-black">
        {/* Top Header */}
        <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-black text-lg shadow-lg shadow-amber-500/20">
              U
            </div>
            <div>
              <div className="text-base font-black tracking-tight text-white flex items-center gap-2">
                UĞRA <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold uppercase tracking-wider">Bayi Portalı</span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium">81 İl Bağımsız Franchise & Operasyon Yönetimi</p>
            </div>
          </div>
          <a
            href="/"
            className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1 font-bold no-underline"
          >
            <span>Ana Sayfaya Dön</span>
            <ChevronRight className="w-4 h-4" />
          </a>
        </header>

        {/* Center Login Box */}
        <div className="flex-1 flex items-center justify-center p-4 my-8">
          <div className="w-full max-w-md bg-[#131826] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20 mb-1">
                <Building2 className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-black text-white tracking-tight">Bayi Yetkili Girişi</h1>
              <p className="text-xs text-gray-400">
                Şehrinize ait kurye, sipariş ve hak ediş yönetim paneline erişmek için oturum açınız.
              </p>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">Bayi E-posta Adresi</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="kocaeli@ugra.app"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    className="w-full bg-[#1A2133] border border-white/10 focus:border-amber-400 outline-none rounded-xl pl-10 pr-3 py-3 text-xs text-white placeholder:text-gray-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">Giriş Şifresi</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full bg-[#1A2133] border border-white/10 focus:border-amber-400 outline-none rounded-xl pl-10 pr-3 py-3 text-xs text-white placeholder:text-gray-600 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 border-0"
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Giriş Yapılıyor...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Bayi Paneline Giriş Yap</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Hızlı Demo / Test Girişi</span>
              </div>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('kocaeli@ugra.app', 'ugra4141')}
                className="w-full p-3 rounded-xl bg-[#1A2133] hover:bg-[#232C42] border border-white/10 text-left transition-all group flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Kocaeli Merkez Bayi (41)
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono mt-0.5">kocaeli@ugra.app / ugra4141</div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-amber-400 transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 px-6 py-4 text-center text-xs text-gray-500">
          UĞRA Platformu &copy; {new Date().getFullYear()} — Güvenli 81 İl Bayilik & RLS İzolasyon Mimarisi
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: AUTHENTICATED FRANCHISE MANAGER DASHBOARD
  // -------------------------------------------------------------
  const cityNameDisplay = city?.name || franchise?.city_name || 'Bölge Bayisi';
  const plateCodeDisplay = city?.plate_code ? String(city.plate_code).padStart(2, '0') : '81';
  const franchiseNameDisplay = franchise?.name || `${cityNameDisplay} Bayisi`;
  const managerNameDisplay = franchiseManager?.name || franchise?.authorized_person || franchiseUser?.email || 'Bayi Yöneticisi';

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col selection:bg-amber-400 selection:text-black">
      {/* SUCCESS NOTIFICATION TOAST */}
      {actionSuccessMsg && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-500 text-black px-4 py-3 rounded-2xl font-black text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="border-b border-white/10 bg-[#131826]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-black text-lg shadow-lg shadow-amber-500/20">
            U
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-400 border border-amber-400/30 text-xs font-mono font-black">
                {plateCodeDisplay}
              </span>
              <h1 className="text-base font-black text-white tracking-tight">{franchiseNameDisplay}</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Aktif Bayi
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium">
              Yetkili: <strong className="text-gray-200">{managerNameDisplay}</strong> &bull; İl: {cityNameDisplay}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadFranchiseData}
            disabled={dataLoading}
            className="p-2 rounded-xl bg-[#1A2133] hover:bg-[#232C42] text-gray-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="Verileri Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <a
            href="/"
            className="text-xs px-3 py-2 rounded-xl bg-[#1A2133] hover:bg-[#232C42] text-gray-300 hover:text-white border border-white/10 font-bold transition-colors no-underline hidden sm:inline-flex items-center gap-1"
          >
            <span>Platform</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={signOut}
            className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* KPI OVERVIEW (4 CARDS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* KPI 1: Kuryeler */}
          <div className="bg-[#131826] border border-white/10 rounded-3xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bölge Kuryeleri</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Bike className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{kpis.totalCouriers}</span>
              <span className="text-xs text-gray-400">toplam kurye</span>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-white/5 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {kpis.onlineCouriers} Online / Aktif
              </span>
              {kpis.pendingApplications > 0 && (
                <span className="text-amber-400 font-bold ml-auto">
                  {kpis.pendingApplications} Başvuru
                </span>
              )}
            </div>
          </div>

          {/* KPI 2: Canlı Operasyon */}
          <div className="bg-[#131826] border border-white/10 rounded-3xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bölge Siparişleri</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{kpis.totalOrders}</span>
              <span className="text-xs text-gray-400">toplam sipariş</span>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-white/5 text-[11px]">
              <span className="text-amber-400 font-bold">
                {kpis.activeOrders} Aktif / Yolda
              </span>
              <span className="text-gray-400 ml-auto">
                {kpis.completedOrders} Tamamlanan
              </span>
            </div>
          </div>

          {/* KPI 3: Mağazalar / Partnerler */}
          <div className="bg-[#131826] border border-white/10 rounded-3xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bölge Mağazaları</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Store className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{kpis.activePartners}</span>
              <span className="text-xs text-gray-400">aktif işletme</span>
            </div>
            <div className="pt-2 border-t border-white/5 text-[11px] text-gray-400 flex items-center justify-between">
              <span>{cityNameDisplay} Mağazaları</span>
              <span className="text-emerald-400 font-bold">Onaylı</span>
            </div>
          </div>

          {/* KPI 4: Finans & Bayi Hak Edişi */}
          <div className="bg-[#131826] border border-white/10 rounded-3xl p-5 space-y-3 relative overflow-hidden bg-gradient-to-br from-[#131826] to-[#1e2638]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Bayi Hak Edişi</span>
              <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">₺{kpis.franchiseEarnings.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
              <span className="text-xs text-amber-400 font-bold">(%{kpis.revenueSharePct} Pay)</span>
            </div>
            <div className="pt-2 border-t border-white/5 text-[11px] text-gray-400 flex items-center justify-between">
              <span>Hacim: ₺{kpis.totalVolume.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
              <span className="text-gray-300 font-mono">Net Kazanç</span>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
          <button
            onClick={() => setActiveTab('couriers')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'couriers'
                ? 'bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                : 'bg-[#131826] text-gray-300 hover:text-white border border-white/10'
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>Kurye & Asistan Yönetimi</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${activeTab === 'couriers' ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-300'}`}>
              {assistants.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                : 'bg-[#131826] text-gray-300 hover:text-white border border-white/10'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Canlı Operasyon & Siparişler</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${activeTab === 'orders' ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-300'}`}>
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('partners')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'partners'
                ? 'bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                : 'bg-[#131826] text-gray-300 hover:text-white border border-white/10'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Bölge Mağazaları</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${activeTab === 'partners' ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-300'}`}>
              {partners.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('finance')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'finance'
                ? 'bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                : 'bg-[#131826] text-gray-300 hover:text-white border border-white/10'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Finans & Hak Ediş</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                : 'bg-[#131826] text-gray-300 hover:text-white border border-white/10'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Bayi Bilgileri</span>
          </button>
        </div>

        {/* TAB 1: COURIERS / ASSISTANTS */}
        {activeTab === 'couriers' && (
          <div className="space-y-4">
            {/* Courier Sub-nav & Search */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#131826] p-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCourierSubTab('active_couriers')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    courierSubTab === 'active_couriers'
                      ? 'bg-white/20 text-white shadow-xs'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Aktif Kuryeler ({assistants.filter(a => a.status !== 'pending' && (a.status as string) !== 'beklemede').length})
                </button>
                <button
                  onClick={() => setCourierSubTab('applications')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    courierSubTab === 'applications'
                      ? 'bg-white/20 text-white shadow-xs'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Yeni Başvurular ({assistants.filter(a => a.status === 'pending' || (a.status as string) === 'beklemede').length})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Kurye adı, telefon ara..."
                  value={courierSearch}
                  onChange={e => setCourierSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#1A2133] border border-white/10 rounded-xl outline-none focus:border-amber-400 text-white"
                />
              </div>
            </div>

            {/* Courier Table */}
            <div className="bg-[#131826] rounded-3xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 uppercase text-[10px] tracking-wider bg-white/5">
                      <th className="py-3 px-4 font-bold">Kurye Adı</th>
                      <th className="py-3 px-4 font-bold">İletişim</th>
                      <th className="py-3 px-4 font-bold">Araç Tipi</th>
                      <th className="py-3 px-4 font-bold">Abonelik / Paket</th>
                      <th className="py-3 px-4 font-bold">Tamamlanan</th>
                      <th className="py-3 px-4 font-bold">Durum</th>
                      <th className="py-3 px-4 font-bold text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredCouriers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400 font-bold">
                          {courierSubTab === 'applications' 
                            ? `${cityNameDisplay} bölgesinde bekleyen yeni kurye başvurusu bulunmuyor.` 
                            : `${cityNameDisplay} bölgesine kayıtlı kurye bulunamadı.`}
                        </td>
                      </tr>
                    ) : (
                      filteredCouriers.map(courier => {
                        const isApp = courier.status === 'pending' || (courier.status as string) === 'beklemede';
                        return (
                          <tr key={courier.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-extrabold text-sm text-white flex items-center gap-2">
                                <span>{courier.full_name}</span>
                                {courier.is_online && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-400" title="Online"></span>
                                )}
                              </div>
                              <div className="text-[11px] text-gray-400">{courier.city || cityNameDisplay}</div>
                            </td>
                            <td className="py-3.5 px-4 space-y-0.5">
                              <div className="flex items-center gap-1.5 text-gray-300 font-mono">
                                <Phone className="w-3.5 h-3.5 text-gray-500" />
                                <span>{courier.phone}</span>
                              </div>
                              {courier.email && (
                                <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                                  <Mail className="w-3 h-3 text-gray-500" />
                                  <span>{courier.email}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 capitalize text-gray-300">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 font-bold">
                                {courier.vehicle_type === 'motosiklet' ? <Bike className="w-3 h-3 text-amber-400" /> : <Car className="w-3 h-3 text-blue-400" />}
                                {courier.vehicle_type || 'Motosiklet'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {courier.subscription_package_name ? (
                                <span className="px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold text-[11px]">
                                  {courier.subscription_package_name}
                                </span>
                              ) : (
                                <span className="text-gray-500 italic text-[11px]">Standart</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-white">
                              {courier.completed_orders || 0} Görev
                            </td>
                            <td className="py-3.5 px-4">
                              {isApp ? (
                                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-[10px] uppercase">
                                  Başvuru
                                </span>
                              ) : courier.status === 'aktif' || courier.status === 'active' ? (
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] uppercase">
                                  Aktif
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-lg bg-gray-500/20 text-gray-400 border border-gray-500/30 font-bold text-[10px] uppercase">
                                  Pasif
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {isApp ? (
                                <button
                                  onClick={() => handleApproveApplication(courier)}
                                  className="px-3 py-1 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-xs transition-all cursor-pointer flex items-center gap-1 ml-auto border-0"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Onayla</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleAssistantStatus(courier)}
                                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer border ${
                                    courier.status === 'aktif' || courier.status === 'active'
                                      ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                  }`}
                                >
                                  {courier.status === 'aktif' || courier.status === 'active' ? 'Pasife Al' : 'Aktif Et'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS / CANLI OPERASYON */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#131826] p-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">
                <select
                  value={orderStatusFilter}
                  onChange={e => setOrderStatusFilter(e.target.value)}
                  className="text-xs bg-[#1A2133] border border-white/10 rounded-xl px-3 py-1.5 outline-none text-white font-bold"
                >
                  <option value="all">Tüm Durumlar ({orders.length})</option>
                  <option value="active">Aktif & Yolda ({kpis.activeOrders})</option>
                  <option value="completed">Teslim Edildi ({kpis.completedOrders})</option>
                  <option value="cancelled">İptal Edildi</option>
                </select>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Sipariş no, müşteri veya adres ara..."
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#1A2133] border border-white/10 rounded-xl outline-none focus:border-amber-400 text-white"
                />
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-[#131826] rounded-3xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 uppercase text-[10px] tracking-wider bg-white/5">
                      <th className="py-3 px-4 font-bold">Sipariş ID</th>
                      <th className="py-3 px-4 font-bold">Müşteri & Adres</th>
                      <th className="py-3 px-4 font-bold">İşletme / Mağaza</th>
                      <th className="py-3 px-4 font-bold">Tutar</th>
                      <th className="py-3 px-4 font-bold">Bayi Payı</th>
                      <th className="py-3 px-4 font-bold">Durum</th>
                      <th className="py-3 px-4 font-bold">Tarih</th>
                      <th className="py-3 px-4 font-bold text-right">Detay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-gray-400 font-bold">
                          {cityNameDisplay} bölgesine ait sipariş bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map(order => {
                        const amount = Number(order.total_price) || 0;
                        const sharePct = franchise?.revenue_share_percentage || 15;
                        const franchiseCut = (amount * sharePct) / 100;

                        return (
                          <tr key={order.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-white">
                              #{order.id.slice(0, 8)}
                            </td>
                            <td className="py-3.5 px-4 max-w-xs">
                              <div className="font-extrabold text-white">{order.customer_name || 'Müşteri'}</div>
                              <div className="text-[11px] text-gray-400 truncate">{order.delivery_address || `${cityNameDisplay} İçi`}</div>
                            </td>
                            <td className="py-3.5 px-4 text-gray-300 font-medium">
                              {order.partner_name || 'Genel Sipariş'}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-black text-white">
                              ₺{amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                              ₺{franchiseCut.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3.5 px-4">
                              {order.status === 'teslim_edildi' || order.status === 'delivered' ? (
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] uppercase">
                                  Teslim Edildi
                                </span>
                              ) : order.status === 'iptal_edildi' || order.status === 'cancelled' ? (
                                <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-[10px] uppercase">
                                  İptal
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-[10px] uppercase">
                                  {order.status}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-gray-400 text-[11px]">
                              {order.created_at ? new Date(order.created_at).toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                                title="Detay Gör"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PARTNERS / BÖLGE MAĞAZALARI */}
        {activeTab === 'partners' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#131826] p-3 rounded-2xl border border-white/10">
              <div className="text-xs font-bold text-gray-300">
                {cityNameDisplay} Bölgesindeki Kayıtlı İşletmeler ({partners.length})
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Mağaza adı veya adres ara..."
                  value={partnerSearch}
                  onChange={e => setPartnerSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#1A2133] border border-white/10 rounded-xl outline-none focus:border-amber-400 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPartners.length === 0 ? (
                <div className="col-span-full py-12 text-center text-gray-400 font-bold bg-[#131826] rounded-3xl border border-white/10">
                  {cityNameDisplay} bölgesine kayıtlı mağaza bulunamadı.
                </div>
              ) : (
                filteredPartners.map(partner => (
                  <div key={partner.id} className="bg-[#131826] rounded-3xl border border-white/10 p-5 space-y-3 hover:border-white/20 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-extrabold text-white text-sm">{partner.business_name}</h3>
                        <p className="text-[11px] text-gray-400">{partner.category || 'Genel Kategori'}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        Aktif
                      </span>
                    </div>

                    <div className="text-xs text-gray-400 space-y-1.5 pt-2 border-t border-white/5">
                      {partner.address && (
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{partner.address}</span>
                        </div>
                      )}
                      {partner.phone && (
                        <div className="flex items-center gap-1.5 font-mono text-gray-300">
                          <Phone className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          <span>{partner.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: FINANCE & HAK EDİŞ */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="bg-[#131826] rounded-3xl border border-white/10 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-lg font-black text-white">Bayilik Finansal Hesap Özeti</h2>
                  <p className="text-xs text-gray-400">Şehrinizdeki sipariş komisyonu ve kurye paket gelir paylaşımı dökümü</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Bayi Gelir Payı Oranı</div>
                  <div className="text-xl font-black text-amber-400 font-mono">%{kpis.revenueSharePct}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#1A2133] p-4 rounded-2xl border border-white/5 space-y-1">
                  <div className="text-xs text-gray-400">Toplam Sipariş Hacmi</div>
                  <div className="text-xl font-black text-white font-mono">
                    ₺{kpis.totalVolume.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-[#1A2133] p-4 rounded-2xl border border-white/5 space-y-1">
                  <div className="text-xs text-amber-400 font-bold">Bayi Net Hakedişi</div>
                  <div className="text-xl font-black text-amber-400 font-mono">
                    ₺{kpis.franchiseEarnings.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-[#1A2133] p-4 rounded-2xl border border-white/5 space-y-1">
                  <div className="text-xs text-gray-400">Tamamlanan Teslimatlar</div>
                  <div className="text-xl font-black text-white font-mono">
                    {kpis.completedOrders} Adet
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Aktif Kurye Kiralama & Abonelik Payı</h3>
                {subscriptions.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">Bu bayiye bağlı aktif kurye aboneliği henüz kaydedilmemiş.</p>
                ) : (
                  <div className="space-y-2">
                    {subscriptions.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-[#1A2133] border border-white/5 text-xs">
                        <div>
                          <div className="font-bold text-white">Abonelik #{sub.id.slice(0, 8)}</div>
                          <div className="text-[11px] text-gray-400">{sub.start_date || '-'} — {sub.expires_at || '-'}</div>
                        </div>
                        <div className="font-mono font-bold text-amber-400">
                          ₺{sub.monthly_price || 0} / ay ({sub.status || 'aktif'})
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BAYI BILGILERI & AYARLAR */}
        {activeTab === 'settings' && (
          <div className="bg-[#131826] rounded-3xl border border-white/10 p-6 space-y-6 max-w-2xl">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-lg font-black text-white">Bayi Sözleşme & Bölge Bilgileri</h2>
              <p className="text-xs text-gray-400">UĞRA Franchise Sistemi Yetki ve Güvenlik Parametreleri</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#1A2133] p-3.5 rounded-xl border border-white/5">
                  <div className="text-gray-400 font-bold mb-1">Bayi Adı</div>
                  <div className="text-white font-black text-sm">{franchiseNameDisplay}</div>
                </div>

                <div className="bg-[#1A2133] p-3.5 rounded-xl border border-white/5">
                  <div className="text-gray-400 font-bold mb-1">Bağlı Şehir (İl)</div>
                  <div className="text-white font-black text-sm">
                    {plateCodeDisplay} - {cityNameDisplay}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#1A2133] p-3.5 rounded-xl border border-white/5">
                  <div className="text-gray-400 font-bold mb-1">Yetkili Kişi</div>
                  <div className="text-white font-bold">{managerNameDisplay}</div>
                </div>

                <div className="bg-[#1A2133] p-3.5 rounded-xl border border-white/5">
                  <div className="text-gray-400 font-bold mb-1">Bayi İletişim E-posta</div>
                  <div className="text-white font-mono">{franchise?.email || franchiseUser?.email}</div>
                </div>
              </div>

              <div className="bg-[#1A2133] p-4 rounded-xl border border-white/5 space-y-2">
                <div className="text-gray-400 font-bold">Kapsanan İlçeler / Faaliyet Bölgesi</div>
                <div className="flex flex-wrap gap-1.5">
                  {franchise?.districts_covered && franchise.districts_covered.length > 0 ? (
                    franchise.districts_covered.map((dist, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold text-[11px]">
                        {dist}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-300 font-bold">{cityNameDisplay} Genel İl Sınırları</span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>RLS Veri İzolasyonu Aktif</span>
                </div>
                <p className="text-[11px] text-gray-300">
                  Bu oturum PostgreSQL Row Level Security ve API seviyesinde strictly izole edilmiştir.
                  Yalnızca <strong>{cityNameDisplay}</strong> bayisine ait kuryeler, siparişler ve mağazalar görüntülenmektedir.
                </p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#131826] w-full max-w-lg rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">Sipariş #{selectedOrder.id.slice(0, 8)}</h3>
                <p className="text-[11px] text-gray-400">{cityNameDisplay} Bölgesi Teslimatı</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-gray-300">
              <div className="p-3 rounded-xl bg-[#1A2133] border border-white/5 space-y-1">
                <div className="text-gray-400 font-bold">Müşteri & Adres</div>
                <div className="font-bold text-white">{selectedOrder.customer_name}</div>
                <div className="text-[11px] text-gray-400">{selectedOrder.delivery_address}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-[#1A2133] border border-white/5">
                  <div className="text-gray-400 font-bold mb-0.5">Toplam Tutar</div>
                  <div className="text-base font-black text-white font-mono">₺{selectedOrder.total_price}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#1A2133] border border-white/5">
                  <div className="text-amber-400 font-bold mb-0.5">Bayi Payı (%{franchise?.revenue_share_percentage || 15})</div>
                  <div className="text-base font-black text-amber-400 font-mono">
                    ₺{((Number(selectedOrder.total_price) || 0) * (franchise?.revenue_share_percentage || 15) / 100).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#1A2133] border border-white/5">
                <div className="text-gray-400 font-bold mb-0.5">Durum</div>
                <div className="font-bold text-white capitalize">{selectedOrder.status}</div>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer border-0"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
