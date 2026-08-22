import React, { useState } from 'react';
import { 
  X, ShoppingBag, Bike, User, Phone, MapPin, 
  Calendar, Clock, DollarSign, ShieldCheck, AlertTriangle, 
  CheckCircle2, FileText, Send, AlertCircle
} from 'lucide-react';
import { Order, OrderStatus } from '@/lib/supabase';
import { FranchiseKPIs } from './types';

interface Props {
  order: Order | null;
  kpis: FranchiseKPIs;
  cityNameDisplay: string;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onOpenAssignModal: (order: Order) => void;
  onOpenCancelModal: (order: Order) => void;
  onSaveOperationNotes: (orderId: string, notes: string) => Promise<void>;
  actionLoading: boolean;
}

export const FranchiseRequestDetailModal: React.FC<Props> = ({
  order,
  kpis,
  cityNameDisplay,
  onClose,
  onUpdateStatus,
  onOpenAssignModal,
  onOpenCancelModal,
  onSaveOperationNotes,
  actionLoading
}) => {
  if (!order) return null;

  const [notesInput, setNotesInput] = useState(order.delivery_notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  const title = order.service_type || order.items?.[0]?.title || 'Asistanlık / Teslimat Talebi';
  const description = order.task_description || order.notes || (order.items && order.items.length > 0 ? order.items.map(i => `${i.quantity || 1}x ${i.title || i.name}`).join(', ') : 'Özel Asistanlık / Teslimat Talebi');

  const isCompleted = order.status === 'teslim_edildi' || order.status === 'delivered' || order.status === 'tamamlandi';
  const isCancelled = order.status === 'iptal_edildi' || order.status === 'cancelled' || order.status === 'iptal';

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await onSaveOperationNotes(order.id, notesInput.trim());
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 3000);
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[#131826] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 border border-white/10 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-amber-400 text-base">
                #TALEP-{order.id.slice(0, 8)}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isCompleted
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : isCancelled
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {order.status}
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              {cityNameDisplay} Bölgesi Talep & Operasyon Detayları
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Talep Başlığı & Açıklaması */}
        <div className="p-4 rounded-2xl bg-[#1A2133] border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Talep Başlığı & İçeriği</span>
            <span className="text-[10px] text-amber-400 font-bold">UĞRA Talep Sistemi</span>
          </div>
          <div className="text-sm font-black text-white">{title}</div>
          <div className="text-xs text-gray-300 bg-[#131826] p-3 rounded-xl border border-white/5 leading-relaxed">
            {description}
          </div>
        </div>

        {/* Section 2: Müşteri & Güzergah Bilgileri */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Müşteri Bilgisi */}
          <div className="p-4 rounded-2xl bg-[#1A2133] border border-white/5 space-y-2">
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              Müşteri Bilgileri
            </div>
            <div className="font-black text-white text-sm">{order.customer_name || 'Misafir Müşteri'}</div>
            {order.customer_phone ? (
              <div className="text-xs text-gray-300 font-mono flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-emerald-400" />
                {order.customer_phone}
              </div>
            ) : (
              <div className="text-[11px] text-gray-500">Telefon girilmedi</div>
            )}
            <div className="text-[10px] text-gray-500 pt-1 border-t border-white/5">
              * Müşteri bilgisi değiştirilemez.
            </div>
          </div>

          {/* Finansal Bilgiler */}
          <div className="p-4 rounded-2xl bg-[#1A2133] border border-white/5 space-y-2">
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              Teklif & Bayi Hak Edişi
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-gray-400 text-xs">Teklif Edilen Ücret:</span>
              <span className="font-mono font-black text-white text-base">₺{order.total_price}</span>
            </div>
            <div className="flex items-baseline justify-between pt-1 border-t border-white/5">
              <span className="text-amber-300 text-xs font-bold">Bayi Payı (%{kpis.revenueSharePct}):</span>
              <span className="font-mono font-black text-amber-400 text-base">
                ₺{((Number(order.total_price) || 0) * kpis.revenueSharePct / 100).toFixed(2)}
              </span>
            </div>
            <div className="text-[10px] text-gray-500">
              * Talep fiyatı müşteri teklifidir, bayi tarafından değiştirilemez.
            </div>
          </div>
        </div>

        {/* Section 3: Güzergah ve Adresler */}
        <div className="p-4 rounded-2xl bg-[#1A2133] border border-white/5 space-y-3">
          <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-red-400" />
            Adres & Lokasyon Güzergahı
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[#131826] rounded-xl border border-white/5 space-y-1">
              <div className="text-gray-500 font-bold text-[10px] uppercase">1. Başlangıç / Alım Noktası</div>
              <div className="text-gray-200">
                {order.pickup_address || order.address_detail || 'Başlangıç adresi girilmedi / serbest görev'}
              </div>
            </div>

            <div className="p-3 bg-[#131826] rounded-xl border border-white/5 space-y-1">
              <div className="text-gray-500 font-bold text-[10px] uppercase">2. Teslimat / Varış Noktası</div>
              <div className="text-gray-200">
                {order.delivery_address || order.customer_address || 'Teslimat adresi'}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Atanan Asistan Bilgisi */}
        <div className="p-4 rounded-2xl bg-[#1A2133] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
              <Bike className="w-3.5 h-3.5 text-amber-400" />
              Görevli Asistan / Kurye
            </div>
            <button
              onClick={() => {
                onOpenAssignModal(order);
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 text-[11px] font-bold cursor-pointer transition-all"
            >
              {order.assistant_name ? 'Asistanı Değiştir' : 'Asistan Ata'}
            </button>
          </div>

          {order.assistant_name ? (
            <div className="flex items-center justify-between p-3 bg-[#131826] rounded-xl border border-white/5">
              <div className="space-y-0.5">
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {order.assistant_name}
                </div>
                {order.assistant_phone && (
                  <div className="text-gray-400 text-[11px] font-mono">{order.assistant_phone}</div>
                )}
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-bold">
                Bölge Asistanı
              </span>
            </div>
          ) : (
            <div className="p-3 bg-[#131826] rounded-xl border border-amber-500/20 text-amber-400/90 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Bu talebe henüz bir asistan atanmamıştır. Bölgenizdeki aktif asistanlardan birini atayabilirsiniz.</span>
            </div>
          )}
        </div>

        {/* Section 5: Zaman Çizelgesi & İptal Gerekçesi (varsa) */}
        <div className="p-4 rounded-2xl bg-[#1A2133] border border-white/5 space-y-2">
          <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            Zaman Bilgileri & Kayıtlar
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-300">
            <div className="p-2.5 bg-[#131826] rounded-xl border border-white/5">
              <div className="text-gray-500 text-[10px]">Oluşturulma</div>
              <div className="font-bold text-white mt-0.5">
                {order.created_at ? new Date(order.created_at).toLocaleString('tr-TR') : '-'}
              </div>
            </div>
            <div className="p-2.5 bg-[#131826] rounded-xl border border-white/5">
              <div className="text-gray-500 text-[10px]">Son Güncelleme</div>
              <div className="font-bold text-white mt-0.5">
                {order.updated_at ? new Date(order.updated_at).toLocaleString('tr-TR') : '-'}
              </div>
            </div>
            <div className="p-2.5 bg-[#131826] rounded-xl border border-white/5">
              <div className="text-gray-500 text-[10px]">Tamamlanma</div>
              <div className="font-bold text-emerald-400 mt-0.5">
                {order.delivered_at ? new Date(order.delivered_at).toLocaleString('tr-TR') : '-'}
              </div>
            </div>
          </div>

          {order.cancel_reason && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs space-y-1">
              <div className="font-bold uppercase text-[10px] flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                İptal Gerekçesi
              </div>
              <div>{order.cancel_reason}</div>
            </div>
          )}
        </div>

        {/* Section 6: Operasyonel Notlar */}
        <div className="p-4 rounded-2xl bg-[#1A2133] border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              Operasyonel Notlar & Talimatlar
            </span>
            {notesSaved && (
              <span className="text-[10px] text-emerald-400 font-bold">Kaydedildi!</span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Saha veya operasyonla ilgili bayilik notu..."
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              className="flex-1 bg-[#131826] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 text-xs"
            />
            <button
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl cursor-pointer shrink-0"
            >
              {isSavingNotes ? 'Kaydediliyor...' : 'Notu Kaydet'}
            </button>
          </div>
        </div>

        {/* Section 7: Operasyonel Durum Değiştirme Aksiyonları */}
        <div className="p-4 rounded-2xl bg-[#1A2133] border border-white/5 space-y-2.5">
          <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
            Talep Durumunu Yönet
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { status: 'kurye_bekleniyor', label: 'Asistan Bekleniyor' },
              { status: 'kurye_atandi', label: 'Asistan Atandı' },
              { status: 'yolda', label: 'Görevde / Yolda' },
              { status: 'teslim_edildi', label: 'Tamamlandı' },
            ].map(({ status, label }) => (
              <button
                key={status}
                disabled={actionLoading}
                onClick={() => onUpdateStatus(order.id, status as OrderStatus)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                  order.status === status
                    ? 'bg-amber-400 text-black font-black shadow-md shadow-amber-400/20'
                    : 'bg-[#131826] hover:bg-white/10 text-gray-300 border border-white/5'
                }`}
              >
                {label}
              </button>
            ))}

            {!isCancelled && (
              <button
                onClick={() => {
                  onOpenCancelModal(order);
                }}
                className="px-3 py-1.5 rounded-xl font-bold text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 cursor-pointer transition-all ml-auto"
              >
                Talebi İptal Et
              </button>
            )}
          </div>
        </div>

        {/* Footer Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer transition-colors"
        >
          Kapat
        </button>
      </div>
    </div>
  );
};
