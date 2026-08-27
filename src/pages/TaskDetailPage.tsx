import React, { useState, useEffect, useCallback } from 'react';
import { useRoute, useLocation } from 'wouter';
import { supabase, getActiveSupabaseClient, isSupabaseConfigured, db, Order, isUUID, filterTaskPayload, filterOrderPayload } from '@/lib/supabase';
import { resolveTaskFields } from '@/pages/AsistanPage';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  MapPin,
  Phone,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  Calendar,
  CreditCard,
  X
} from 'lucide-react';

export function TaskDetailPage() {
  const [, params] = useRoute('/assistant/task/:id');
  const [, paramsAlt] = useRoute('/asistan/task/:id');
  const taskId = params?.id || paramsAlt?.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Delivery code verification state
  const [inputCode, setInputCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);

  // Cancel/Unreachable modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Müşteriye ulaşılamadı');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const fetched = await db.getOrderById(taskId);
      if (fetched) {
        setOrder(fetched);
        setIsCodeVerified(Boolean(fetched.delivery_code_verified));
      } else {
        toast({
          title: 'Sipariş Bulunamadı',
          description: 'İstenen görev bilgisine ulaşılamadı.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error fetching order detail:', err);
    } finally {
      setLoading(false);
    }
  }, [taskId, toast]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const r = resolveTaskFields(order || {});

  // Code Verification Handler
  const handleVerifyCode = async () => {
    if (!order) return;
    const entered = inputCode.trim();
    const expected = String(order.delivery_code || '').trim();

    if (!entered || entered.length !== 6) {
      setCodeError('Teslim kodu 6 haneli olmalıdır.');
      return;
    }

    if (entered !== expected) {
      setCodeError('Teslim kodu hatalı.');
      return;
    }

    setVerifyingCode(true);
    setCodeError('');

    try {
      const nowIso = new Date().toISOString();
      if (isSupabaseConfigured && isUUID(order.id)) {
        const client = await getActiveSupabaseClient();
        const { data: tData } = await client.from('tasks').select('id, order_id').eq('id', order.id).maybeSingle();
        if (tData) {
          const taskPayload = filterTaskPayload({ updated_at: nowIso });
          if (Object.keys(taskPayload).length > 0) {
            await client.from('tasks').update(taskPayload).eq('id', order.id);
          }
          if (tData.order_id && isUUID(tData.order_id)) {
            const orderPayload = filterOrderPayload({ delivery_code_verified: true });
            await client.from('orders').update(orderPayload).eq('id', tData.order_id);
          }
        } else {
          const orderPayload = filterOrderPayload({ delivery_code_verified: true });
          await client.from('orders').update(orderPayload).eq('id', order.id);
        }
      }

      setIsCodeVerified(true);
      setOrder(prev => prev ? { ...prev, delivery_code_verified: true } : prev);
      toast({
        title: 'Kodu Doğrulandı',
        description: 'Teslimat doğrulama kodu başarıyla doğrulandı.',
      });
    } catch (err) {
      console.error('Error verifying code:', err);
      setCodeError('Kod doğrulanırken hata oluştu.');
    } finally {
      setVerifyingCode(false);
    }
  };

  // DOĞRULANDI (Complete Order)
  const handleCompleteOrder = async () => {
    if (!order) return;

    // Check delivery code requirement if not verified yet
    if (order.requires_delivery_code && !isCodeVerified) {
      const entered = inputCode.trim();
      const expected = String(order.delivery_code || '').trim();
      if (entered && entered === expected) {
        // Auto verify first
        await handleVerifyCode();
      } else {
        setCodeError('Teslim kodu hatalı.');
        toast({
          title: 'Teslim Kodu Gerekli',
          description: 'Teslimat tamamlanamıyor. Lütfen doğru 6 haneli teslimat kodunu girin.',
          variant: 'destructive',
        });
        return;
      }
    }

    setActionLoading(true);
    try {
      const nowIso = new Date().toISOString();
      if (isSupabaseConfigured && isUUID(order.id)) {
        const client = await getActiveSupabaseClient();
        const { data: tData } = await client.from('tasks').select('id, order_id').eq('id', order.id).maybeSingle();
        if (tData) {
          const taskPayload = filterTaskPayload({ status: 'teslim_edildi', completed_at: nowIso });
          await client.from('tasks').update(taskPayload).eq('id', order.id);
          if (tData.order_id && isUUID(tData.order_id)) {
            const orderPayload = filterOrderPayload({ status: 'teslim_edildi', delivered_at: nowIso });
            await client.from('orders').update(orderPayload).eq('id', tData.order_id);
          }
        } else {
          const orderPayload = filterOrderPayload({ status: 'teslim_edildi', delivered_at: nowIso });
          await client.from('orders').update(orderPayload).eq('id', order.id);
        }
      } else {
        await db.updateOrderStatus(order.id, 'teslim_edildi');
      }

      toast({
        title: 'GÖREV TAMAMLANDI',
        description: 'Teslimat başarıyla tamamlandı.',
      });

      // Görev tamamlandığında otomatik olarak Bekleyen Görev ekranına geri dön
      setLocation('/asistan');
    } catch (err: any) {
      console.error('Error completing order:', err);
      toast({
        title: 'Hata',
        description: err.message || 'Görev tamamlanırken hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ULAŞILAMADI (Mark Unreachable / Cancel)
  const handleMarkUnreachable = async () => {
    if (!order) return;
    setSubmittingCancel(true);
    try {
      const reasonText = cancelReason.trim() || 'Müşteriye ulaşılamadı';
      if (isSupabaseConfigured && isUUID(order.id)) {
        const client = await getActiveSupabaseClient();
        const { data: tData } = await client.from('tasks').select('id, order_id').eq('id', order.id).maybeSingle();
        const nowIso = new Date().toISOString();
        if (tData) {
          const taskPayload = filterTaskPayload({ status: 'cancelled', cancelled_at: nowIso });
          await client.from('tasks').update(taskPayload).eq('id', order.id);
          if (tData.order_id && isUUID(tData.order_id)) {
            const orderPayload = filterOrderPayload({ status: 'cancelled', cancel_reason: reasonText });
            await client.from('orders').update(orderPayload).eq('id', tData.order_id);
          }
        } else {
          const orderPayload = filterOrderPayload({ status: 'cancelled', cancel_reason: reasonText });
          const res1 = await client.from('orders').update(orderPayload).eq('id', order.id);

          if (res1.error) {
            console.error('Error cancelling order in TaskDetailPage:', res1.error);
            throw new Error(res1.error.message);
          }
        }
      }

      toast({
        title: 'Sipariş İptal Edildi',
        description: 'Müşteriye ulaşılamadı olarak kaydedildi.',
      });

      setShowCancelModal(false);
      setLocation('/asistan');
    } catch (err: any) {
      console.error('Error cancelling order:', err);
      toast({
        title: 'Hata',
        description: err.message || 'İşlem gerçekleştirilemedi.',
        variant: 'destructive',
      });
    } finally {
      setSubmittingCancel(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2E9DE] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
        <p className="text-xs font-semibold text-muted-foreground">Görev detayları yükleniyor...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F2E9DE] flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-10 h-10 text-destructive mb-2" />
        <h2 className="text-base font-bold text-foreground">Görev Bulunamadı</h2>
        <p className="text-xs text-muted-foreground mt-1 mb-4">Bu göreve ait bilgi veritabanında yer almıyor.</p>
        <button
          type="button"
          onClick={() => setLocation('/asistan')}
          className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs cursor-pointer"
        >
          Asistan Paneline Dön
        </button>
      </div>
    );
  }

  const requiresCode = Boolean(order.requires_delivery_code);
  const pickupAddr = r.pickup_address || (order as any).customer_address || '';
  const deliveryAddr = r.delivery_address || (order as any).address || '';

  return (
    <div className="min-h-screen bg-[#F2E9DE] text-foreground pb-32">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border/60 shadow-xs">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setLocation('/asistan')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-muted/60 hover:bg-muted border border-border text-xs font-bold text-foreground transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
            <span>Geri</span>
          </button>
          <div className="text-center">
            <h1 className="text-sm font-extrabold text-foreground">Görev Detayı</h1>
            <span className="text-[10px] font-mono text-muted-foreground font-bold">#{r.order_number}</span>
          </div>
          <div className="w-12" />
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto p-4 space-y-3">

        {/* 1. YAPILACAK İŞ */}
        <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-1.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            1. YAPILACAK İŞ
          </span>
          <p className="text-sm font-bold text-foreground leading-snug">
            {r.task_description || 'Teslimat görevi'}
          </p>
        </div>

        {/* 2. MÜŞTERİ TEKLİFİ */}
        <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              2. MÜŞTERİ TEKLİFİ
            </span>
            <span className="text-xs text-muted-foreground font-medium">Müşterinin Sunduğu Teklif Tutarı</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {r.customer_price || order.total_price || r.courier_net || 0} TL
          </div>
        </div>

        {/* 3. MÜŞTERİ BİLGİLERİ */}
        <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            3. MÜŞTERİ BİLGİLERİ
          </span>
          <div className="text-sm font-bold text-foreground">
            {r.customer_name || 'Müşteri'}
          </div>
          <div className="text-xs font-mono text-muted-foreground">
            {r.customer_phone || 'Telefon Yok'}
          </div>
        </div>

        {/* 4. MÜŞTERİYİ ARA */}
        {r.customer_phone && (
          <a
            href={`tel:${r.customer_phone.replace(/\s+/g, '')}`}
            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-2xl text-xs uppercase tracking-wider shadow-xs transition-all cursor-pointer no-underline"
          >
            <Phone className="w-4 h-4 text-black" />
            <span>4. MÜŞTERİYİ ARA</span>
          </a>
        )}

        {/* 5. MÜŞTERİ KONUMU */}
        <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              5. MÜŞTERİ KONUMU
            </span>
            <a
              href={(r.delivery_lat != null && r.delivery_lng != null) ? `https://www.google.com/maps/search/?api=1&query=${r.delivery_lat},${r.delivery_lng}` : (r.latitude != null && r.longitude != null ? `https://www.google.com/maps/search/?api=1&query=${r.latitude},${r.longitude}` : (r.pickup_lat != null && r.pickup_lng != null ? `https://www.google.com/maps/search/?api=1&query=${r.pickup_lat},${r.pickup_lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.customer_address || deliveryAddr || pickupAddr || 'Adapazarı, Sakarya')}`))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted/60 hover:bg-muted border border-border text-foreground font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs no-underline"
            >
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Haritada Aç</span>
            </a>
          </div>
          <p className="text-xs font-medium text-foreground leading-relaxed">
            {r.customer_address || deliveryAddr || pickupAddr || 'Adapazarı, Sakarya'}
          </p>
          {(r.delivery_address_detail || r.pickup_address_detail) && (
            <p className="text-muted-foreground text-[11px] pt-1 border-t border-border/60">
              Adres Detayı: {r.delivery_address_detail || r.pickup_address_detail}
            </p>
          )}
        </div>

        {/* 6. TESLİM DOĞRULAMA */}
        <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-2.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            6. TESLİM DOĞRULAMA
          </span>

          {requiresCode ? (
            isCodeVerified ? (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Teslimat Doğrulama Kodu Doğrulandı</span>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-foreground">
                  6 Haneli Kodu Girin
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="6 Haneli Kod"
                    value={inputCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setInputCode(val);
                      if (codeError) setCodeError('');
                    }}
                    className="flex-1 bg-background border border-input focus:border-amber-500 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-foreground outline-none text-center tracking-widest"
                  />
                  <button
                    type="button"
                    disabled={verifyingCode || inputCode.length !== 6}
                    onClick={handleVerifyCode}
                    className="py-2.5 px-4 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0"
                  >
                    {verifyingCode ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <span>Kodu Doğrula</span>
                    )}
                  </button>
                </div>
                {codeError && (
                  <p className="text-xs font-bold text-destructive mt-1">
                    {codeError}
                  </p>
                )}
              </div>
            )
          ) : (
            <p className="text-xs font-medium text-muted-foreground">
              Teslim doğrulama kodu gerekmiyor.
            </p>
          )}
        </div>

        {/* 10. DİĞER BİLGİLER */}
        <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            10. DİĞER BİLGİLER
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-muted/40 p-2.5 rounded-xl border border-border/40">
              <span className="text-[10px] text-muted-foreground block font-semibold">Hizmet Türü</span>
              <span className="font-bold text-foreground uppercase">
                {r.service_type === 'gecerken' ? 'Geçerken UĞRA' : 'Hemen UĞRA'}
              </span>
            </div>
            <div className="bg-muted/40 p-2.5 rounded-xl border border-border/40">
              <span className="text-[10px] text-muted-foreground block font-semibold">Ödeme Tipi</span>
              <span className="font-bold text-foreground">
                {order.payment_type || 'Nakit / Havale'}
              </span>
            </div>
          </div>

          {(order.service_type === 'gecerken' || r.service_type === 'gecerken') && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-xs text-foreground">
              <span className="text-[10px] font-bold uppercase block text-amber-800">GEÇERKEN UĞRA — ZAMAN TERCİHİ</span>
              <p className="font-semibold mt-0.5">
                {order.preferred_time || r.preferred_time || (order.notes?.match(/• Ne Zaman:\s*(.+)/)?.[1]?.trim()) || 'Gün içinde fark etmez'}
              </p>
            </div>
          )}

          {order.notes && (
            <div className="bg-muted/60 border border-border/60 p-2.5 rounded-xl text-xs text-foreground">
              <span className="text-[10px] font-bold uppercase block text-muted-foreground">Sipariş Notu</span>
              <p className="font-medium mt-0.5">{order.notes}</p>
            </div>
          )}
        </div>

      </main>

      {/* ALT SABİT ALAN: YALNIZCA DOĞRULANDI VE ULAŞILAMADI */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-card/90 backdrop-blur-md border-t border-border/80 z-50 shadow-2xl">
        <div className="max-w-md mx-auto flex items-center gap-3">
          {/* ULAŞILAMADI BUTTON */}
          <button
            type="button"
            disabled={actionLoading || submittingCancel}
            onClick={() => setShowCancelModal(true)}
            className="flex-1 py-3.5 px-3 bg-destructive hover:bg-destructive/90 active:scale-98 disabled:opacity-50 text-destructive-foreground font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-xs transition-all cursor-pointer flex items-center justify-center text-center"
          >
            <span>ULAŞILAMADI</span>
          </button>

          {/* DOĞRULANDI BUTTON */}
          <button
            type="button"
            disabled={actionLoading || submittingCancel}
            onClick={handleCompleteOrder}
            className="flex-1 py-3.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-xs transition-all cursor-pointer flex items-center justify-center text-center"
          >
            {actionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <span>DOĞRULANDI</span>
            )}
          </button>
        </div>
      </div>

      {/* ULAŞILAMADI CONFIRMATION MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-card rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-border">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">Müşteriye Ulaşılamadı</h3>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="w-7 h-7 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Bu görevi &quot;Müşteriye Ulaşılamadı&quot; olarak işaretleyip iptal etmek istediğinize emin misiniz?
            </p>

            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                İptal Sebebi
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="İptal sebebi girin..."
                className="w-full bg-background border border-input rounded-xl p-2.5 text-xs text-foreground focus:border-amber-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-bold text-xs rounded-xl cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={submittingCancel}
                onClick={handleMarkUnreachable}
                className="flex-1 py-2.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center"
              >
                {submittingCancel ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <span>İptal Et</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
