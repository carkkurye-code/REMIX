import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Building2, Users, ShoppingBag, DollarSign, MapPin, 
  Search, ShieldCheck, LogOut, CheckCircle2, 
  Clock, AlertCircle, RefreshCw, ChevronRight, Phone, Mail, 
  Bike, Car, Percent, ArrowUpRight, Check, X, Store, Eye, EyeOff,
  Lock, KeyRound, Sparkles, Navigation, Loader2, Bell, FileText,
  SlidersHorizontal, UserCheck, AlertTriangle, Headphones
} from 'lucide-react';
import { 
  db, 
  Assistant, 
  Order, 
  Partner, 
  Franchise, 
  City, 
  AssistantSubscription,
  OrderStatus,
  OFFICIAL_PARTNER_CATEGORIES,
  FranchiseSupportTicket
} from '@/lib/supabase';
import { useFranchiseAuth } from '@/context/FranchiseAuthContext';

import { TabType, TimePeriod, FranchiseKPIs } from '@/components/franchise/types';
import { FranchiseOverviewTab } from '@/components/franchise/FranchiseOverviewTab';
import { FranchiseRequestsTab } from '@/components/franchise/FranchiseRequestsTab';
import { FranchiseRequestDetailModal } from '@/components/franchise/FranchiseRequestDetailModal';
import { FranchiseAssistantsTab } from '@/components/franchise/FranchiseAssistantsTab';
import { FranchisePartnersTab } from '@/components/franchise/FranchisePartnersTab';
import { FranchiseFinanceTab } from '@/components/franchise/FranchiseFinanceTab';
import { FranchiseReportsTab } from '@/components/franchise/FranchiseReportsTab';
import { FranchiseSettingsTab } from '@/components/franchise/FranchiseSettingsTab';
import { FranchiseSupportTab } from '@/components/franchise/FranchiseSupportTab';
import { 
  AssignAssistantModal, 
  CancelRequestModal, 
  RejectAssistantModal, 
  AddPartnerModal, 
  EditPartnerModal,
  PartnerDetailModal,
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
  const [partners, setPartners] = useState<Partner[]>([]);
  const [subscriptions, setSubscriptions] = useState<AssistantSubscription[]>([]);
  const [supportTickets, setSupportTickets] = useState<FranchiseSupportTicket[]>([]);

  // Assistant Rejection Modal
  const [rejectingCourier, setRejectingCourier] = useState<Assistant | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionLoading, setRejectionLoading] = useState(false);

  // Selected Request Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Assign Assistant to Request Modal
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
  const [selectedCourierIdToAssign, setSelectedCourierIdToAssign] = useState<string>('');
  const [orderActionLoading, setOrderActionLoading] = useState(false);
  
  // Cancel Request Modal
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Add Partner Modal
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerCategory, setNewPartnerCategory] = useState(OFFICIAL_PARTNER_CATEGORIES[0] || 'Restoran & Cafe');
  const [newPartnerPhone, setNewPartnerPhone] = useState('');
  const [newPartnerEmail, setNewPartnerEmail] = useState('');
  const [newPartnerPassword, setNewPartnerPassword] = useState('12345678');
  const [newPartnerAddress, setNewPartnerAddress] = useState('');
  const [newPartnerDistrict, setNewPartnerDistrict] = useState('');
  const [partnerSubmitLoading, setPartnerSubmitLoading] = useState(false);

  // Edit Partner Modal
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [editPartnerName, setEditPartnerName] = useState('');
  const [editPartnerCategory, setEditPartnerCategory] = useState('');
  const [editPartnerPhone, setEditPartnerPhone] = useState('');
  const [editPartnerAddress, setEditPartnerAddress] = useState('');
  const [editPartnerLoading, setEditPartnerLoading] = useState(false);

  // Partner Details Modal
  const [selectedPartnerDetail, setSelectedPartnerDetail] = useState<Partner | null>(null);

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

      const [assistantsRes, ordersRes, partnersRes, subsRes, ticketsRes] = await Promise.all([
        db.getFranchiseAssistants(fId, cId),
        db.getFranchiseOrders(fId, cId),
        db.getFranchisePartners(fId, cId),
        db.getFranchiseSubscriptions(fId, cId),
        db.getFranchiseSupportTickets(fId)
      ]);

      setAssistants(assistantsRes);
      setOrders(ordersRes);
      setPartners(partnersRes);
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

  // Toggle Assistant Active Status
  const handleToggleAssistantStatus = async (assistant: Assistant) => {
    try {
      const newStatus = assistant.status === 'aktif' || assistant.status === 'active' ? 'pasif' : 'aktif';
      await db.updateAssistant(assistant.id, { status: newStatus as any, active: newStatus === 'aktif' });
      setAssistants(prev => prev.map(a => a.id === assistant.id ? { ...a, status: newStatus as any, active: newStatus === 'aktif' } : a));
      showNotification(`${assistant.full_name} asistan durumu güncellendi: ${newStatus === 'aktif' ? 'Aktif' : 'Pasif'}`);
    } catch (e: any) {
      alert('Asistan durumu güncellenemedi: ' + e?.message);
    }
  };

  // Approve Assistant Application
  const handleApproveApplication = async (assistant: Assistant) => {
    try {
      const res = await db.approveAssistantApplication(assistant.id);
      if (!res.success) {
        throw new Error(res.error || 'Onay işlemi başarısız oldu.');
      }
      setAssistants(prev => prev.map(a => a.id === assistant.id ? { ...a, status: 'aktif', active: true } : a));
      showNotification(`${assistant.full_name} başvurusu onaylandı ve kadroya dahil edildi.`);
    } catch (e: any) {
      alert('Başvuru onaylanamadı: ' + e?.message);
    }
  };

  // Reject Assistant Application
  const handleRejectApplication = async () => {
    if (!rejectingCourier) return;
    setRejectionLoading(true);
    try {
      const res = await db.rejectAssistantApplication(rejectingCourier.id, rejectionReason.trim());
      if (!res.success) {
        throw new Error(res.error || 'Red işlemi başarısız oldu.');
      }
      setAssistants(prev => prev.map(a => a.id === rejectingCourier.id ? { ...a, status: 'rejected' as any, active: false } : a));
      showNotification(`${rejectingCourier.full_name} başvurusu reddedildi.`);
      setRejectingCourier(null);
      setRejectionReason('');
    } catch (e: any) {
      alert('Başvuru reddedilemedi: ' + e?.message);
    } finally {
      setRejectionLoading(false);
    }
  };

  // Update Request (Order) Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setOrderActionLoading(true);
    try {
      const res = await db.updateFranchiseOrder(orderId, { status: newStatus });
      if (!res.success) {
        throw new Error(res.error || 'Talep durumu güncellenemedi.');
      }
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
      showNotification(`Talep durumu güncellendi: ${newStatus}`);
    } catch (e: any) {
      alert('Hata: ' + e?.message);
    } finally {
      setOrderActionLoading(false);
    }
  };

  // Assign / Reassign Assistant to Request
  const handleAssignCourier = async () => {
    if (!assigningOrder) return;
    setOrderActionLoading(true);
    try {
      const courier = assistants.find(a => a.id === selectedCourierIdToAssign);
      const updates: { assistant_id?: string | null; status?: OrderStatus } = {
        assistant_id: selectedCourierIdToAssign || null
      };
      if (selectedCourierIdToAssign && assigningOrder.status === 'kurye_bekleniyor') {
        updates.status = 'kurye_atandi';
      }
      const res = await db.updateFranchiseOrder(assigningOrder.id, updates);
      if (!res.success) {
        throw new Error(res.error || 'Asistan ataması yapılamadı.');
      }
      setOrders(prev => prev.map(o => o.id === assigningOrder.id ? { 
        ...o, 
        ...updates,
        assistant_name: courier?.full_name || o.assistant_name,
        assistant_phone: courier?.phone || o.assistant_phone
      } : o));
      if (selectedOrder && selectedOrder.id === assigningOrder.id) {
        setSelectedOrder(prev => prev ? { 
          ...prev, 
          ...updates,
          assistant_name: courier?.full_name || prev.assistant_name,
          assistant_phone: courier?.phone || prev.assistant_phone
        } : null);
      }
      showNotification(courier ? `Talep #TALEP-${assigningOrder.id.slice(0, 8)} asistan ${courier.full_name} personeline atandı.` : `Asistan ataması kaldırıldı.`);
      setAssigningOrder(null);
      setSelectedCourierIdToAssign('');
    } catch (e: any) {
      alert('Asistan atama hatası: ' + e?.message);
    } finally {
      setOrderActionLoading(false);
    }
  };

  // Cancel Request
  const handleCancelOrder = async () => {
    if (!cancellingOrder) return;
    setOrderActionLoading(true);
    try {
      const reasonText = cancelReason.trim() || 'Bayi tarafından iptal edildi';
      const res = await db.updateFranchiseOrder(cancellingOrder.id, { 
        status: 'iptal_edildi',
        cancel_reason: reasonText
      });
      if (!res.success) {
        throw new Error(res.error || 'Talep iptal edilemedi.');
      }
      setOrders(prev => prev.map(o => o.id === cancellingOrder.id ? { 
        ...o, 
        status: 'iptal_edildi',
        cancel_reason: reasonText
      } : o));
      if (selectedOrder && selectedOrder.id === cancellingOrder.id) {
        setSelectedOrder(prev => prev ? { 
          ...prev, 
          status: 'iptal_edildi',
          cancel_reason: reasonText
        } : null);
      }
      showNotification(`Talep #TALEP-${cancellingOrder.id.slice(0, 8)} iptal edildi.`);
      setCancellingOrder(null);
      setCancelReason('');
    } catch (e: any) {
      alert('İptal hatası: ' + e?.message);
    } finally {
      setOrderActionLoading(false);
    }
  };

  // Save Operation Notes on Request
  const handleSaveOperationNotes = async (orderId: string, notes: string) => {
    const res = await db.updateFranchiseOrder(orderId, { delivery_notes: notes });
    if (!res.success) {
      throw new Error(res.error || 'Not kaydedilemedi.');
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, delivery_notes: notes } : o));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, delivery_notes: notes } : null);
    }
    showNotification('Operasyon notu başarıyla güncellendi.');
  };

  // Toggle Partner Status
  const handleTogglePartner = async (partner: Partner) => {
    try {
      const newActive = partner.active === false ? true : false;
      await db.togglePartnerStatus(partner.id, newActive);
      setPartners(prev => prev.map(p => p.id === partner.id ? { ...p, active: newActive } : p));
      showNotification(`${partner.business_name} durumu ${newActive ? 'Açık / Aktif' : 'Kapalı / Pasif'} olarak güncellendi.`);
    } catch (e: any) {
      alert('İşletme durumu güncellenemedi: ' + e?.message);
    }
  };

  // Create Partner
  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName.trim()) {
      alert('Lütfen işletme adını giriniz.');
      return;
    }
    setPartnerSubmitLoading(true);
    try {
      const fId = franchise?.id || '';
      const cId = city?.id || franchise?.city_id || '';
      const fullAddress = [newPartnerAddress.trim(), newPartnerDistrict.trim(), city?.name || franchise?.city_name].filter(Boolean).join(', ');

      const res = await db.createPartner({
        businessName: newPartnerName.trim(),
        email: newPartnerEmail.trim() || `partner_${Date.now()}@ugra.app`,
        password: newPartnerPassword || '12345678',
        phone: newPartnerPhone.trim(),
        category: newPartnerCategory,
        address: fullAddress,
        franchise_id: fId || undefined,
        city_id: cId || undefined,
      } as any);

      if (res) {
        setPartners(prev => [res, ...prev]);
        showNotification(`${newPartnerName} işletmesi başarıyla bölgenize eklendi.`);
        setShowAddPartnerModal(false);
        setNewPartnerName('');
        setNewPartnerPhone('');
        setNewPartnerEmail('');
        setNewPartnerAddress('');
        setNewPartnerDistrict('');
      }
    } catch (e: any) {
      alert('İşletme eklenirken hata oluştu: ' + e?.message);
    } finally {
      setPartnerSubmitLoading(false);
    }
  };

  // Edit Partner Save
  const handleSavePartnerEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;
    setEditPartnerLoading(true);
    try {
      const updated = await db.updatePartner(editingPartner.id, {
        business_name: editPartnerName.trim(),
        category: editPartnerCategory,
        phone: editPartnerPhone.trim(),
        address: editPartnerAddress.trim()
      });
      if (updated) {
        setPartners(prev => prev.map(p => p.id === editingPartner.id ? { ...p, ...updated } : p));
        showNotification(`${editPartnerName} işletme bilgileri güncellendi.`);
        setEditingPartner(null);
      }
    } catch (e: any) {
      alert('İşletme güncellenemedi: ' + e?.message);
    } finally {
      setEditPartnerLoading(false);
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

    const activePartners = partners.filter(p => p.active !== false).length;
    const totalPartners = partners.length;

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
      activePartners,
      totalPartners,
      totalSubRevenue,
      openTicketsCount
    };
  }, [assistants, periodOrders, partners, franchise, subscriptions, supportTickets]);

  // Active available couriers for assignment dropdown
  const availableCouriers = useMemo(() => {
    return assistants.filter(a => a.status === 'aktif' || a.status === 'active' || a.active !== false);
  }, [assistants]);

  const cityNameDisplay = city?.name || franchise?.city_name || 'Bölge';

  // ---------------------------------------------------------------------------
  // AUTH LOADING STATE
  // ---------------------------------------------------------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          <p className="text-xs font-bold text-gray-400">Bayi oturumu doğrulanıyor...</p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // LOGIN SCREEN (If not authenticated as franchise_manager)
  // ---------------------------------------------------------------------------
  if (!isFranchiseManager) {
    return (
      <div className="min-h-screen bg-[#0D1117] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#131826] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-400/10">
              <Building2 className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black text-white">UĞRA Bayi Yöneticisi Girişi</h1>
            <p className="text-xs text-gray-400">
              Bölgesel ana bayilik operasyon paneline erişmek için yetkili bilgilerinizi giriniz.
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">Bayi E-Posta Adresi</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="istanbul@ugra.app"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-[#1A2133] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-gray-500 outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">Şifre</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-[#1A2133] border border-white/10 rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-gray-500 outline-none focus:border-amber-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-400/20 transition-all"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Giriş Yapılıyor...
                </>
              ) : (
                'Bayi Paneline Giriş Yap'
              )}
            </button>
          </form>

          <div className="p-3 bg-white/5 rounded-2xl text-[11px] text-gray-400 space-y-1 text-center">
            <div>💡 Giriş yapamıyorsanız genel merkez ile iletişime geçiniz.</div>
            <div className="text-[10px] text-gray-500 font-mono">Yetki Rolü: franchise_manager</div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN AUTHENTICATED FRANCHISE DASHBOARD
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0D1117] text-white flex flex-col">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="fixed top-4 right-4 z-50 p-3.5 rounded-2xl bg-emerald-500 text-black font-bold text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="bg-[#131826] border-b border-white/10 px-4 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Franchise Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 flex items-center justify-center text-black font-black text-base shadow-lg shadow-amber-400/20 shrink-0">
              U
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black text-white">
                  {franchise?.name || `${cityNameDisplay} Ana Bayiliği`}
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-400 text-[10px] font-black uppercase border border-amber-400/20">
                  {cityNameDisplay} • Plaka {city?.plate_code || '54'}
                </span>
              </div>
              <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Aktif Bayi Lisansı
                </span>
                <span>•</span>
                <span className="text-gray-300 font-medium">
                  {franchiseManager?.name || (franchiseManager as any)?.full_name || franchise?.authorized_person || franchise?.contact_person || 'Yetkili Yönetici'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <button
              onClick={() => {
                loadFranchiseData();
                refreshFranchiseData();
              }}
              disabled={dataLoading}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer transition-colors"
              title="Verileri Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            {/* Logout Button */}
            <button
              onClick={() => signOut()}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all border border-white/5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Çıkış</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab Navigation Bar */}
      <nav className="bg-[#182033] border-b border-white/5 px-4 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center gap-1">
          {[
            { id: 'overview', label: 'Genel Bakış', icon: Sparkles },
            { id: 'partners', label: 'İşletmeler & Partnerler', icon: Building2 },
            { id: 'finance', label: 'Finans & Hak Ediş', icon: DollarSign },
            { id: 'reports', label: 'Raporlar & Analiz', icon: FileText },
            { id: 'support', label: 'Destek & Merkez', icon: Headphones, badge: kpis.openTicketsCount > 0 ? kpis.openTicketsCount : undefined },
            { id: 'settings', label: 'Bayi Bilgileri', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-3 px-3.5 font-bold text-xs flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all border-b-2 ${
                  active
                    ? 'text-amber-400 border-amber-400 bg-white/5'
                    : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-black font-black">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full p-4 md:p-6 flex-1">
        {activeTab === 'overview' && (
          <FranchiseOverviewTab
            franchise={franchise}
            kpis={kpis}
            timePeriod={timePeriod}
            setTimePeriod={setTimePeriod}
            partners={partners}
            cityNameDisplay={cityNameDisplay}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenAddPartner={() => setShowAddPartnerModal(true)}
          />
        )}

        {activeTab === 'partners' && (
          <FranchisePartnersTab
            partners={partners}
            kpis={kpis}
            cityNameDisplay={cityNameDisplay}
            onOpenAddPartner={() => setShowAddPartnerModal(true)}
            onOpenEditPartner={(p) => {
              setEditingPartner(p);
              setEditPartnerName(p.business_name || '');
              setEditPartnerCategory(p.category || OFFICIAL_PARTNER_CATEGORIES[0]);
              setEditPartnerPhone(p.phone || '');
              setEditPartnerAddress(p.address || '');
            }}
            onSelectPartner={(p) => setSelectedPartnerDetail(p)}
            onTogglePartnerStatus={handleTogglePartner}
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

        {activeTab === 'reports' && (
          <FranchiseReportsTab
            kpis={kpis}
            timePeriod={timePeriod}
            setTimePeriod={setTimePeriod}
            periodOrders={periodOrders}
            partners={partners}
            franchise={franchise}
            cityNameDisplay={cityNameDisplay}
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

      {/* ------------------------------------------------------------------- */}
      {/* MODALS */}
      {/* ------------------------------------------------------------------- */}

      {/* 1. Talep Detay ve Operasyon Modalı */}
      <FranchiseRequestDetailModal
        order={selectedOrder}
        kpis={kpis}
        cityNameDisplay={cityNameDisplay}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateOrderStatus}
        onOpenAssignModal={(order) => {
          setAssigningOrder(order);
          setSelectedCourierIdToAssign(order.assistant_id || '');
        }}
        onOpenCancelModal={(order) => {
          setCancellingOrder(order);
          setCancelReason('');
          setSelectedOrder(null);
        }}
        onSaveOperationNotes={handleSaveOperationNotes}
        actionLoading={orderActionLoading}
      />

      {/* 2. Talebe Asistan Ata Modalı */}
      <AssignAssistantModal
        order={assigningOrder}
        availableCouriers={availableCouriers}
        selectedCourierId={selectedCourierIdToAssign}
        setSelectedCourierId={setSelectedCourierIdToAssign}
        onConfirm={handleAssignCourier}
        onClose={() => {
          setAssigningOrder(null);
          setSelectedCourierIdToAssign('');
        }}
        loading={orderActionLoading}
      />

      {/* 3. Talebi İptal Et Modalı */}
      <CancelRequestModal
        order={cancellingOrder}
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
        onConfirm={handleCancelOrder}
        onClose={() => {
          setCancellingOrder(null);
          setCancelReason('');
        }}
        loading={orderActionLoading}
      />

      {/* 4. Asistan Başvurusunu Reddet Modalı */}
      <RejectAssistantModal
        assistant={rejectingCourier}
        reason={rejectionReason}
        setReason={setRejectionReason}
        onConfirm={handleRejectApplication}
        onClose={() => {
          setRejectingCourier(null);
          setRejectionReason('');
        }}
        loading={rejectionLoading}
      />

      {/* 5. Yeni İşletme / Partner Ekle Modalı */}
      <AddPartnerModal
        isOpen={showAddPartnerModal}
        onClose={() => setShowAddPartnerModal(false)}
        onSubmit={handleCreatePartner}
        cityNameDisplay={cityNameDisplay}
        franchiseId={franchise?.id}
        name={newPartnerName}
        setName={setNewPartnerName}
        category={newPartnerCategory}
        setCategory={setNewPartnerCategory}
        phone={newPartnerPhone}
        setPhone={setNewPartnerPhone}
        email={newPartnerEmail}
        setEmail={setNewPartnerEmail}
        district={newPartnerDistrict}
        setDistrict={setNewPartnerDistrict}
        address={newPartnerAddress}
        setAddress={setNewPartnerAddress}
        loading={partnerSubmitLoading}
      />

      {/* 6. İşletme Düzenle Modalı */}
      <EditPartnerModal
        partner={editingPartner}
        onClose={() => setEditingPartner(null)}
        onSubmit={handleSavePartnerEdit}
        name={editPartnerName}
        setName={setEditPartnerName}
        category={editPartnerCategory}
        setCategory={setEditPartnerCategory}
        phone={editPartnerPhone}
        setPhone={setEditPartnerPhone}
        address={editPartnerAddress}
        setAddress={setEditPartnerAddress}
        loading={editPartnerLoading}
      />

      {/* 7. İşletme Detay Modalı */}
      <PartnerDetailModal
        partner={selectedPartnerDetail}
        cityNameDisplay={cityNameDisplay}
        onClose={() => setSelectedPartnerDetail(null)}
        onOpenEdit={(p) => {
          setSelectedPartnerDetail(null);
          setEditingPartner(p);
          setEditPartnerName(p.business_name || '');
          setEditPartnerCategory(p.category || OFFICIAL_PARTNER_CATEGORIES[0]);
          setEditPartnerPhone(p.phone || '');
          setEditPartnerAddress(p.address || '');
        }}
        onToggleStatus={handleTogglePartner}
      />

      {/* 8. Destek Talebi Oluştur Modalı */}
      <CreateSupportTicketModal
        isOpen={showCreateTicketModal}
        onClose={() => setShowCreateTicketModal(false)}
        onSubmit={handleCreateSupportTicket}
        cityNameDisplay={cityNameDisplay}
      />

      {/* 9. Destek Talebi Detay Modalı */}
      <SupportTicketDetailModal
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
}
