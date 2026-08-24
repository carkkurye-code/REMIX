import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'wouter';
import { 
  Building2, Users, ShoppingBag, DollarSign, MapPin, 
  Search, ShieldCheck, LogOut, CheckCircle2, 
  Clock, AlertCircle, RefreshCw, ChevronRight, Phone, Mail, 
  Bike, Car, Percent, ArrowUpRight, Check, X, Eye, EyeOff,
  Lock, KeyRound, Sparkles, Navigation, Loader2, Bell, FileText,
  UserCheck, AlertTriangle, Headphones, Layers, TrendingUp, Plus
} from 'lucide-react';
import { 
  db, 
  Assistant, 
  Order, 
  Franchise, 
  City, 
  AssistantSubscription,
  OrderStatus,
  FranchiseSupportTicket
} from '@/lib/supabase';
import { useFranchiseAuth } from '@/context/FranchiseAuthContext';

import { TabType, TimePeriod, FranchiseKPIs } from '@/components/franchise/types';
import { FranchiseOverviewTab } from '@/components/franchise/FranchiseOverviewTab';
import { FranchiseAssistantsTab } from '@/components/franchise/FranchiseAssistantsTab';
import { FranchiseRequestsTab } from '@/components/franchise/FranchiseRequestsTab';
import { FranchiseFinanceTab } from '@/components/franchise/FranchiseFinanceTab';
import { FranchiseSettingsTab } from '@/components/franchise/FranchiseSettingsTab';
import { FranchiseSupportTab } from '@/components/franchise/FranchiseSupportTab';
import { 
  AddAssistantModal,
  EditAssistantModal,
  AssistantDetailModal,
  AssignAssistantModal,
  RequestDetailModal,
  CreateSupportTicketModal,
  SupportTicketDetailModal
} from '@/components/franchise/FranchiseModals';

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
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Dashboard Data States
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [dataLoading, setDataLoading] = useState(false);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<AssistantSubscription[]>([]);
  const [supportTickets, setSupportTickets] = useState<FranchiseSupportTicket[]>([]);

  // Assistant Modals States
  const [showAddAssistantModal, setShowAddAssistantModal] = useState(false);
  const [assistantSubmitLoading, setAssistantSubmitLoading] = useState(false);

  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);
  const [editAssistantLoading, setEditAssistantLoading] = useState(false);

  const [selectedAssistantDetail, setSelectedAssistantDetail] = useState<Assistant | null>(null);

  // Order Assignment & Detail Modal States
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
  const [assignAssistantLoading, setAssignAssistantLoading] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);

  // Support Tickets Modals
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<FranchiseSupportTicket | null>(null);

  // Toast notification
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
      const cName = city?.name || franchise?.city_name || '';

      const [assistantsRes, ordersRes, subsRes, ticketsRes] = await Promise.all([
        db.getFranchiseAssistants(fId, cId, cName),
        db.getFranchiseOrders(fId, cId, cName),
        db.getFranchiseSubscriptions(fId, cId),
        db.getFranchiseSupportTickets(fId)
      ]);

      setAssistants(assistantsRes);
      setOrders(ordersRes);
      setSubscriptions(subsRes);
      setSupportTickets(ticketsRes);
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

  // Add Assistant Submit
  const handleAddAssistantSubmit = async (data: {
    fullName: string;
    phone: string;
    email: string;
    vehicleType: 'motosiklet' | 'bisiklet' | 'arac';
    plateNumber?: string;
  }) => {
    setAssistantSubmitLoading(true);
    try {
      const fId = franchise?.id || '';
      const cId = city?.id || franchise?.city_id || '';

      const newAst = await db.createAssistant({
        full_name: data.fullName.trim(),
        phone: data.phone.trim(),
        email: data.email.trim() || undefined,
        vehicle_type: data.vehicleType,
        plate_number: data.plateNumber?.trim() || undefined,
        city_id: cId || undefined,
        franchise_id: fId || undefined,
        city: city?.name || franchise?.city_name || 'Bölge',
        status: 'active',
        active: true,
        is_online: true,
        task_status: 'Müsait'
      });

      if (newAst) {
        setAssistants(prev => [newAst, ...prev]);
        showNotification(`${data.fullName} bölgenize asistan olarak eklendi.`);
        setShowAddAssistantModal(false);
      }
    } catch (e: any) {
      alert('Asistan eklenirken hata oluştu: ' + e?.message);
    } finally {
      setAssistantSubmitLoading(false);
    }
  };

  // Edit Assistant Submit
  const handleEditAssistantSubmit = async (id: string, updates: Partial<Assistant>) => {
    setEditAssistantLoading(true);
    try {
      const updated = await db.updateAssistant(id, updates);
      if (updated) {
        setAssistants(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
        showNotification(`${updated.full_name || 'Asistan'} bilgileri güncellendi.`);
        setEditingAssistant(null);
      }
    } catch (e: any) {
      alert('Asistan güncellenemedi: ' + e?.message);
    } finally {
      setEditAssistantLoading(false);
    }
  };

  // Toggle Assistant Active Status
  const handleToggleAssistantStatus = async (assistant: Assistant) => {
    try {
      const isActive = assistant.status === 'active' || assistant.status === 'aktif' || assistant.active !== false;
      const targetStatus = isActive ? 'passive' : 'active';
      const res = await db.setAssistantStatus(assistant.id, targetStatus);
      if (res) {
        setAssistants(prev => prev.map(a => a.id === assistant.id ? { ...a, status: targetStatus, active: !isActive } : a));
        showNotification(`${assistant.full_name} durumu güncellendi: ${!isActive ? 'Aktif' : 'Pasif'}`);
      }
    } catch (e: any) {
      alert('Durum güncellenemedi: ' + e?.message);
    }
  };

  // Approve Assistant Application
  const handleApproveApplication = async (assistant: Assistant) => {
    try {
      const res = await db.approveAssistantApplication(assistant.id);
      if (res.success) {
        setAssistants(prev => prev.map(a => a.id === assistant.id ? { ...a, status: 'active', active: true, is_online: true, task_status: 'Müsait' } : a));
        showNotification(`${assistant.full_name} başvurusu onaylandı ve kadroya eklendi.`);
      } else {
        alert('Başvuru onaylanamadı: ' + res.error);
      }
    } catch (e: any) {
      alert('Hata: ' + e?.message);
    }
  };

  // Reject Assistant Application
  const handleRejectApplication = async (assistant: Assistant, reason?: string) => {
    try {
      const res = await db.rejectAssistantApplication(assistant.id, reason);
      if (res.success) {
        setAssistants(prev => prev.filter(a => a.id !== assistant.id));
        showNotification(`${assistant.full_name} başvurusu reddedildi.`);
      } else {
        alert('Başvuru reddedilemedi: ' + res.error);
      }
    } catch (e: any) {
      alert('Hata: ' + e?.message);
    }
  };

  // Assign Assistant to Order
  const handleAssignAssistantSubmit = async (orderId: string, assistantId: string, assistantName: string) => {
    setAssignAssistantLoading(true);
    try {
      const res = await db.updateFranchiseOrder(orderId, {
        assistant_id: assistantId,
        status: 'kurye_atandi'
      });

      if (res.success) {
        setOrders(prev => prev.map(o => {
          if (o.id === orderId) {
            return {
              ...o,
              assistant_id: assistantId,
              assistant_name: assistantName,
              status: 'kurye_atandi'
            };
          }
          return o;
        }));
        showNotification(`Talep #${orderId.slice(0, 8)} başarıyla ${assistantName} asistanına atandı.`);
        setAssigningOrder(null);
        if (selectedOrderDetail && selectedOrderDetail.id === orderId) {
          setSelectedOrderDetail(prev => prev ? {
            ...prev,
            assistant_id: assistantId,
            assistant_name: assistantName,
            status: 'kurye_atandi'
          } : null);
        }
      } else {
        alert('Asistan atanamadı: ' + res.error);
      }
    } catch (e: any) {
      alert('Asistan atama hatası: ' + e?.message);
    } finally {
      setAssignAssistantLoading(false);
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await db.updateFranchiseOrder(orderId, { status });
      if (res.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
        showNotification(`Talep durumu güncellendi: ${status}`);
        if (selectedOrderDetail && selectedOrderDetail.id === orderId) {
          setSelectedOrderDetail(prev => prev ? { ...prev, status } : null);
        }
      } else {
        alert('Durum güncellenemedi: ' + res.error);
      }
    } catch (e: any) {
      alert('Hata: ' + e?.message);
    }
  };

  // Create Support Ticket
  const handleCreateSupportTicket = async (data: { subject: string; category: string; priority: string; message: string }) => {
    if (!franchise) throw new Error('Bayi bilgisi bulunamadı.');
    const newTicket = await db.createFranchiseSupportTicket({
      franchise_id: franchise.id,
      city_id: city?.id || franchise.city_id,
      subject: data.subject,
      category: data.category as any,
      priority: data.priority as any,
      message: data.message
    });
    if (newTicket) {
      setSupportTickets(prev => [newTicket, ...prev]);
      showNotification('Destek talebiniz başarıyla Genel Merkeze iletildi.');
    }
  };

  // Period Filtered Orders
  const periodOrders = useMemo(() => {
    if (timePeriod === 'all') return orders;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = startOfToday - (now.getDay() === 0 ? 6 : now.getDay() - 1) * 24 * 60 * 60 * 1000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return orders.filter(o => {
      if (!o.created_at) return true;
      const orderTime = new Date(o.created_at).getTime();
      if (timePeriod === 'today') return orderTime >= startOfToday;
      if (timePeriod === 'week') return orderTime >= startOfWeek;
      if (timePeriod === 'month') return orderTime >= startOfMonth;
      if (timePeriod === 'custom') {
        const start = customStartDate ? new Date(customStartDate).getTime() : 0;
        const end = customEndDate ? new Date(customEndDate).getTime() + 86400000 : Infinity;
        return orderTime >= start && orderTime <= end;
      }
      return true;
    });
  }, [orders, timePeriod, customStartDate, customEndDate]);

  // Comprehensive KPI Calculations
  const kpis: FranchiseKPIs = useMemo(() => {
    const totalCouriers = assistants.length;
    const activeCouriers = assistants.filter(a => a.status === 'aktif' || a.status === 'active' || a.active !== false);
    const onlineCouriers = assistants.filter(a => a.is_online).length;
    const pendingApplications = assistants.filter(a => a.status === 'pending' || (a.status as string) === 'beklemede').length;
    
    const totalOrders = periodOrders.length;
    const pendingOrders = periodOrders.filter(o => ['kurye_bekleniyor', 'pending', 'beklemede', 'bekliyor'].includes(o.status)).length;
    const inProgressOrders = periodOrders.filter(o => ['hazirlaniyor', 'yolda', 'kurye_atandi', 'preparing', 'on_way'].includes(o.status)).length;
    const completedOrders = periodOrders.filter(o => o.status === 'teslim_edildi' || o.status === 'delivered' || o.status === 'tamamlandi').length;
    const cancelledOrders = periodOrders.filter(o => o.status === 'iptal_edildi' || o.status === 'cancelled' || o.status === 'iptal').length;
    
    const totalVolume = periodOrders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
    const completedVolume = periodOrders
      .filter(o => o.status === 'teslim_edildi' || o.status === 'delivered' || o.status === 'tamamlandi')
      .reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
      
    const revenueSharePct = franchise?.revenue_share_percentage || 15;
    const franchiseEarnings = (totalVolume * revenueSharePct) / 100;
    const completedEarnings = (completedVolume * revenueSharePct) / 100;

    const totalSubRevenue = subscriptions.reduce((sum, s) => sum + (Number(s.monthly_price) || 0), 0);
    const openTicketsCount = supportTickets.filter(t => t.status === 'pending' || t.status === 'in_review' || t.status === 'answered').length;

    return {
      totalCouriers,
      activeCouriersCount: activeCouriers.length,
      onlineCouriers,
      pendingApplications,
      totalOrders,
      pendingOrders,
      inProgressOrders,
      completedOrders,
      cancelledOrders,
      totalVolume,
      completedVolume,
      revenueSharePct,
      franchiseEarnings,
      completedEarnings,
      totalSubRevenue,
      openTicketsCount
    };
  }, [assistants, periodOrders, franchise, subscriptions, supportTickets]);

  const cityNameDisplay = city?.name || franchise?.city_name || 'Bölge';

  // AUTH LOADING STATE
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 font-sans">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-bold text-muted-foreground animate-pulse">
            Bayi oturumu doğrulanıyor...
          </p>
        </div>
      </div>
    );
  }

  // LOGIN SCREEN (If not authenticated as franchise_manager)
  if (!isFranchiseManager) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-card border border-border rounded-[1.65rem] sm:rounded-2xl p-6 sm:p-8 space-y-6 shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)] relative overflow-hidden">
          <Link href="/" className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20">
            <button
              type="button"
              aria-label="Kapat"
              title="Kapat"
              className="w-9 h-9 rounded-xl bg-card hover:bg-accent/40 border border-border text-foreground flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </Link>

          <div className="text-center space-y-2 pt-2">
            <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground font-black text-xl flex items-center justify-center mx-auto shadow-sm">
              U
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Bayi Yönetim Paneli</h1>
            <p className="text-xs text-muted-foreground font-medium">Bölgesel Bayilik Operasyon Girişi</p>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Bayi E-Posta Adresi</label>
              <input
                type="email"
                required
                placeholder="istanbul@ugra.app"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-xl p-3 text-foreground font-medium transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Şifre</label>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-xl p-3 text-foreground font-medium pr-10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground border-0 bg-transparent cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-primary hover:bg-primary/90 active:scale-95 text-primary-foreground font-extrabold py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border-0 shadow-sm"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" />
                  <span>Giriş Yapılıyor...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-primary-foreground" />
                  <span>Bayi Paneline Giriş Yap</span>
                </>
              )}
            </button>
          </form>

          <div className="p-3 bg-background border border-border rounded-xl text-[11px] text-muted-foreground space-y-1 text-center">
            <div>💡 Yetkili bayilik hesabınız ile oturum açınız.</div>
            <div className="text-[10px] text-muted-foreground/70 font-mono">Yetki Rolü: franchise_manager</div>
          </div>
        </div>
      </div>
    );
  }

  interface FranchiseNavItem {
    id: TabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }

  interface FranchiseNavGroup {
    group: string;
    items: FranchiseNavItem[];
  }

  // NAVIGATION GROUPS (Strictly focused on Assistants & Requests)
  const franchiseNavGroups: FranchiseNavGroup[] = [
    {
      group: 'BAYİLİK & OPERASYON',
      items: [
        { id: 'overview', label: 'Genel Bakış', icon: Sparkles },
        { id: 'assistants', label: 'Bölge Asistanları', icon: Users, badge: assistants.length },
        { id: 'requests', label: 'Talepler & Görevler', icon: Bike, badge: orders.length },
      ]
    },
    {
      group: 'FİNANS & SÖZLEŞME',
      items: [
        { id: 'finance', label: 'Finans & Hak Ediş', icon: DollarSign },
        { id: 'settings', label: 'Bayi Bilgileri & Sözleşme', icon: ShieldCheck },
      ]
    },
    {
      group: 'MERKEZ İLETİŞİMİ',
      items: [
        { id: 'support', label: 'Destek & Biletler', icon: Headphones, badge: kpis.openTicketsCount > 0 ? kpis.openTicketsCount : undefined },
      ]
    }
  ];

  const allNavItems = franchiseNavGroups.flatMap(g => g.items);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans">
      
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="fixed top-4 right-4 z-50 p-3.5 rounded-xl bg-card border border-border text-foreground font-bold text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* MOBILE TOP BAR (Screens < md) */}
      <div className="md:hidden sticky top-0 z-40 bg-card border-b border-border p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground font-black text-sm flex items-center justify-center shadow-sm">
              U
            </div>
            <div>
              <div className="font-extrabold text-sm text-foreground flex items-center gap-1">
                {cityNameDisplay} <span className="text-muted-foreground text-[11px] font-medium">Bayi</span>
              </div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Aktif Lisans
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadFranchiseData();
                refreshFranchiseData();
              }}
              disabled={dataLoading}
              className="p-2 rounded-xl bg-card hover:bg-accent/40 text-foreground border border-border cursor-pointer"
              title="Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin text-primary' : ''}`} />
            </button>
            <button
              onClick={() => signOut()}
              className="px-3 py-1.5 bg-card hover:bg-red-500/10 hover:text-red-600 text-foreground text-xs font-bold rounded-xl transition-all border border-border cursor-pointer"
            >
              Çıkış
            </button>
            <Link href="/" aria-label="Kapat" title="Kapat">
              <button
                type="button"
                aria-label="Kapat"
                title="Kapat"
                className="w-8 h-8 rounded-xl bg-card hover:bg-accent/40 border border-border text-foreground flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>

        {/* Horizontal Scrollable Tabs on Mobile */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
          {allNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'bg-card text-muted-foreground hover:text-foreground hover:bg-accent/40 border border-border'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isActive ? 'bg-primary-foreground text-primary' : 'bg-accent text-foreground'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* DESKTOP SIDEBAR NAVIGATION */}
      <aside className="hidden md:flex w-64 bg-card border-r border-border flex-col shrink-0 min-h-screen shadow-sm">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground font-black text-lg flex items-center justify-center shadow-sm">
              U
            </div>
            <div>
              <div className="font-extrabold text-sm text-foreground flex items-center gap-1">
                {cityNameDisplay} <span className="text-muted-foreground text-xs font-normal">Bayi</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Plaka: {city?.plate_code || '54'} • Lisans Aktif
              </div>
            </div>
          </div>
          <Link href="/" aria-label="Kapat" title="Kapat">
            <button
              type="button"
              aria-label="Kapat"
              title="Kapat"
              className="w-9 h-9 rounded-xl bg-card hover:bg-accent/40 border border-border text-foreground flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </Link>
        </div>

        {/* NAV LIST BY GROUP */}
        <nav className="p-3 space-y-4 overflow-y-auto flex-1">
          {franchiseNavGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <div className="px-3 text-[10px] font-extrabold tracking-wider text-muted-foreground/70 uppercase">
                {group.group}
              </div>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/40 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isActive ? 'bg-primary-foreground text-primary' : 'bg-accent text-foreground'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* FOOTER INFO & LOGOUT */}
        <div className="p-4 border-t border-border bg-card space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                loadFranchiseData();
                refreshFranchiseData();
              }}
              disabled={dataLoading}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${dataLoading ? 'animate-spin text-primary' : ''}`} />
              <span>Yenile</span>
            </button>

            <button
              onClick={() => signOut()}
              className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Çıkış Yap</span>
            </button>
          </div>

          <div className="text-[10px] text-muted-foreground/70 text-center font-mono">
            {franchiseManager?.name || 'Bayi Yöneticisi'} • %{kpis.revenueSharePct} Pay
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl">
        {activeTab === 'overview' && (
          <FranchiseOverviewTab
            franchise={franchise}
            kpis={kpis}
            timePeriod={timePeriod}
            setTimePeriod={setTimePeriod}
            assistants={assistants}
            orders={periodOrders}
            cityNameDisplay={cityNameDisplay}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenAddAssistant={() => setShowAddAssistantModal(true)}
            onOpenAssignAssistant={(order) => setAssigningOrder(order)}
            onSelectOrder={(order) => setSelectedOrderDetail(order)}
          />
        )}

        {activeTab === 'assistants' && (
          <FranchiseAssistantsTab
            assistants={assistants}
            kpis={kpis}
            cityNameDisplay={cityNameDisplay}
            onOpenAddAssistant={() => setShowAddAssistantModal(true)}
            onOpenEditAssistant={(a) => setEditingAssistant(a)}
            onOpenDetailAssistant={(a) => setSelectedAssistantDetail(a)}
            onToggleStatus={handleToggleAssistantStatus}
            onApproveApplication={handleApproveApplication}
            onOpenRejectModal={(a) => handleRejectApplication(a)}
          />
        )}

        {activeTab === 'requests' && (
          <FranchiseRequestsTab
            orders={periodOrders}
            kpis={kpis}
            cityNameDisplay={cityNameDisplay}
            onSelectOrder={(order) => setSelectedOrderDetail(order)}
            onOpenAssignModal={(order) => setAssigningOrder(order)}
            onUpdateStatus={handleUpdateOrderStatus}
            actionLoading={assignAssistantLoading}
          />
        )}

        {activeTab === 'finance' && (
          <FranchiseFinanceTab
            kpis={kpis}
            timePeriod={timePeriod}
            setTimePeriod={setTimePeriod}
            customStartDate={customStartDate}
            setCustomStartDate={setCustomStartDate}
            customEndDate={customEndDate}
            setCustomEndDate={setCustomEndDate}
            periodOrders={periodOrders}
            subscriptions={subscriptions}
            cityNameDisplay={cityNameDisplay}
            franchiseIban={franchise?.iban || undefined}
            franchiseBankName={franchise?.bank_name || undefined}
            franchise={franchise}
          />
        )}

        {activeTab === 'support' && (
          <FranchiseSupportTab
            tickets={supportTickets}
            franchise={franchise}
            cityNameDisplay={cityNameDisplay}
            onOpenCreateTicket={() => setShowCreateTicketModal(true)}
            onSelectTicket={(t) => setSelectedTicket(t)}
          />
        )}

        {activeTab === 'settings' && (
          <FranchiseSettingsTab
            franchise={franchise}
            city={city}
            franchiseManager={franchiseManager}
            kpis={kpis}
            cityNameDisplay={cityNameDisplay}
          />
        )}
      </main>

      {/* MODALS */}
      {/* 1. Add Assistant Modal */}
      <AddAssistantModal
        isOpen={showAddAssistantModal}
        onClose={() => setShowAddAssistantModal(false)}
        onSubmit={handleAddAssistantSubmit}
        cityNameDisplay={cityNameDisplay}
        franchiseId={franchise?.id}
        loading={assistantSubmitLoading}
      />

      {/* 2. Edit Assistant Modal */}
      <EditAssistantModal
        assistant={editingAssistant}
        onClose={() => setEditingAssistant(null)}
        onSubmit={handleEditAssistantSubmit}
        loading={editAssistantLoading}
      />

      {/* 3. Assistant Detail Modal */}
      <AssistantDetailModal
        assistant={selectedAssistantDetail}
        cityNameDisplay={cityNameDisplay}
        onClose={() => setSelectedAssistantDetail(null)}
        onOpenEdit={(a) => {
          setSelectedAssistantDetail(null);
          setEditingAssistant(a);
        }}
        onToggleStatus={handleToggleAssistantStatus}
      />

      {/* 4. Assign Assistant to Order Modal */}
      <AssignAssistantModal
        order={assigningOrder}
        assistants={assistants}
        onClose={() => setAssigningOrder(null)}
        onAssign={handleAssignAssistantSubmit}
        loading={assignAssistantLoading}
      />

      {/* 5. Request Detail & Status Management Modal */}
      <RequestDetailModal
        order={selectedOrderDetail}
        cityNameDisplay={cityNameDisplay}
        onClose={() => setSelectedOrderDetail(null)}
        onOpenAssign={(o) => {
          setSelectedOrderDetail(null);
          setAssigningOrder(o);
        }}
        onUpdateStatus={handleUpdateOrderStatus}
        loading={assignAssistantLoading}
      />

      {/* 6. Create Support Ticket Modal */}
      <CreateSupportTicketModal
        isOpen={showCreateTicketModal}
        onClose={() => setShowCreateTicketModal(false)}
        onSubmit={handleCreateSupportTicket}
        cityNameDisplay={cityNameDisplay}
      />

      {/* 7. Support Ticket Detail Modal */}
      <SupportTicketDetailModal
        ticket={selectedTicket}
        cityNameDisplay={cityNameDisplay}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
}
