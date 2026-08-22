import React from 'react';
import { 
  X, ShieldCheck, Bike, AlertTriangle, Store, 
  Headphones, Send, MessageSquare, Clock, CheckCircle2,
  Calendar, Phone, Mail, MapPin, Tag, FileText
} from 'lucide-react';
import { 
  Assistant, Order, Partner, OFFICIAL_PARTNER_CATEGORIES,
  FranchiseSupportTicket 
} from '@/lib/supabase';

// ============================================================================
// MODAL: ASSIGN ASSISTANT TO REQUEST
// ============================================================================
interface AssignAssistantModalProps {
  order: Order | null;
  availableCouriers: Assistant[];
  selectedCourierId: string;
  setSelectedCourierId: (id: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}

export const AssignAssistantModal: React.FC<AssignAssistantModalProps> = ({
  order,
  availableCouriers,
  selectedCourierId,
  setSelectedCourierId,
  onConfirm,
  onClose,
  loading
}) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-[#131826] w-full max-w-md rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-black text-white">Talebe Asistan Ata / Değiştir</h3>
            <p className="text-[11px] text-gray-400">Talep #TALEP-{order.id.slice(0, 8)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="text-gray-400 font-bold block">Bölgenizdeki Aktif Asistanı Seçin</label>
          <select
            value={selectedCourierId}
            onChange={(e) => setSelectedCourierId(e.target.value)}
            className="w-full bg-[#1A2133] border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:border-amber-400"
          >
            <option value="">-- Asistan Seçilmedi / Atamayı Kaldır --</option>
            {availableCouriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} ({c.vehicle_type || 'Motosiklet'}) {c.is_online ? '● Online' : ''}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-gray-500">
            * Yalnızca aynı bayilik ve şehir yetki alanındaki asistanlar listelenir.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer"
          >
            Vazgeç
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold cursor-pointer transition-colors"
          >
            {loading ? 'Atanıyor...' : 'Atamayı Onayla'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL: CANCEL REQUEST
// ============================================================================
interface CancelRequestModalProps {
  order: Order | null;
  cancelReason: string;
  setCancelReason: (r: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}

export const CancelRequestModal: React.FC<CancelRequestModalProps> = ({
  order,
  cancelReason,
  setCancelReason,
  onConfirm,
  onClose,
  loading
}) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-[#131826] w-full max-w-md rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-sm font-black text-red-400">Talebi İptal Et</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-gray-300">
            <strong>#TALEP-{order.id.slice(0, 8)}</strong> numaralı talebi iptal etmek üzeresiniz.
          </p>
          <label className="text-gray-400 font-bold block">İptal Gerekçesi</label>
          <textarea
            rows={3}
            placeholder="Örn: Müşteri adreste bulunamadı veya müşteri iptal talep etti..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="w-full bg-[#1A2133] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-red-400"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer"
          >
            Vazgeç
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-extrabold cursor-pointer transition-colors"
          >
            {loading ? 'İptal Ediliyor...' : 'İptali Onayla'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL: REJECT ASSISTANT APPLICATION
// ============================================================================
interface RejectAssistantModalProps {
  assistant: Assistant | null;
  reason: string;
  setReason: (r: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}

export const RejectAssistantModal: React.FC<RejectAssistantModalProps> = ({
  assistant,
  reason,
  setReason,
  onConfirm,
  onClose,
  loading
}) => {
  if (!assistant) return null;

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-[#131826] w-full max-w-md rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-sm font-black text-red-400">Asistan Başvurusunu Reddet</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-gray-300">
            <strong>{assistant.full_name}</strong> adayının başvurusunu reddetmek üzeresiniz.
          </p>
          <label className="text-gray-400 font-bold block">Red Nedeni (Adaya bildirilecektir)</label>
          <textarea
            rows={3}
            placeholder="Örn: Belgeler eksik veya araç koşulları yetersiz..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-[#1A2133] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-red-400"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer"
          >
            Vazgeç
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-extrabold cursor-pointer transition-colors"
          >
            {loading ? 'Reddediliyor...' : 'Reddet'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL: ADD PARTNER
// ============================================================================
interface AddPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  cityNameDisplay: string;
  franchiseId?: string;
  name: string;
  setName: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  district: string;
  setDistrict: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  loading: boolean;
}

export const AddPartnerModal: React.FC<AddPartnerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  cityNameDisplay,
  franchiseId,
  name,
  setName,
  category,
  setCategory,
  phone,
  setPhone,
  email,
  setEmail,
  district,
  setDistrict,
  address,
  setAddress,
  loading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-[#131826] w-full max-w-lg rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-black text-white">Yeni İşletme / Mağaza Ekle</h3>
            <p className="text-[11px] text-gray-400">{cityNameDisplay} Bölgesine Yeni Partner</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-gray-400 font-bold uppercase text-[10px]">İşletme / Mağaza Adı</label>
            <input
              type="text"
              required
              placeholder="Örn: Lezzet Döner & Kebap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1A2133] border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-gray-400 font-bold uppercase text-[10px]">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#1A2133] border border-white/10 rounded-xl p-3 text-white font-bold outline-none"
              >
                {OFFICIAL_PARTNER_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-gray-400 font-bold uppercase text-[10px]">Telefon Numarası</label>
              <input
                type="tel"
                required
                placeholder="0532 000 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#1A2133] border border-white/10 rounded-xl p-3 text-white font-mono outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-gray-400 font-bold uppercase text-[10px]">Giriş E-postası</label>
              <input
                type="email"
                placeholder="partner@isletme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1A2133] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-gray-400 font-bold uppercase text-[10px]">İlçe</label>
              <input
                type="text"
                placeholder="Örn: Kadıköy, Adapazarı..."
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-[#1A2133] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-gray-400 font-bold uppercase text-[10px]">Açık Adres</label>
            <textarea
              rows={2}
              placeholder="Cadde, sokak, no ve mahalle bilgileri..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-[#1A2133] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-amber-400"
            />
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Bu işletme otomatik olarak <strong>{cityNameDisplay}</strong> bayinize ({franchiseId?.slice(0, 8) || 'Bölge'}) bağlanacaktır.</span>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold cursor-pointer transition-colors"
            >
              {loading ? 'Kaydediliyor...' : 'İşletmeyi Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL: EDIT PARTNER
// ============================================================================
interface EditPartnerModalProps {
  partner: Partner | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  name: string;
  setName: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  loading: boolean;
}

export const EditPartnerModal: React.FC<EditPartnerModalProps> = ({
  partner,
  onClose,
  onSubmit,
  name,
  setName,
  category,
  setCategory,
  phone,
  setPhone,
  address,
  setAddress,
  loading
}) => {
  if (!partner) return null;

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-[#131826] w-full max-w-md rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-sm font-black text-white">İşletmeyi Düzenle</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-gray-400 font-bold uppercase text-[10px]">İşletme Adı</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1A2133] border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-gray-400 font-bold uppercase text-[10px]">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#1A2133] border border-white/10 rounded-xl p-3 text-white font-bold outline-none"
            >
              {OFFICIAL_PARTNER_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-gray-400 font-bold uppercase text-[10px]">Telefon</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#1A2133] border border-white/10 rounded-xl p-3 text-white font-mono outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-gray-400 font-bold uppercase text-[10px]">Adres</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-[#1A2133] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold cursor-pointer transition-colors"
            >
              {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL: PARTNER DETAILS MODAL
// ============================================================================
interface PartnerDetailModalProps {
  partner: Partner | null;
  cityNameDisplay: string;
  onClose: () => void;
  onOpenEdit: (partner: Partner) => void;
  onToggleStatus: (partner: Partner) => void;
}

export const PartnerDetailModal: React.FC<PartnerDetailModalProps> = ({
  partner,
  cityNameDisplay,
  onClose,
  onOpenEdit,
  onToggleStatus
}) => {
  if (!partner) return null;
  const isActive = partner.active !== false;

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-[#131826] w-full max-w-md rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">{partner.business_name}</h3>
              <p className="text-[11px] text-gray-400 font-mono">ID: {partner.id.slice(0, 8)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          <div className="flex justify-between py-1.5 border-b border-white/5">
            <span className="text-gray-400">Durum:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {isActive ? 'Aktif / Açık' : 'Pasif / Kapalı'}
            </span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-white/5">
            <span className="text-gray-400">Kategori:</span>
            <span className="font-bold text-white">{partner.category || 'Genel'}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-white/5">
            <span className="text-gray-400">Telefon:</span>
            <span className="font-mono font-bold text-gray-200">{partner.phone || '-'}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-white/5">
            <span className="text-gray-400">E-posta:</span>
            <span className="font-mono text-gray-300">{partner.email || '-'}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-white/5">
            <span className="text-gray-400">Yetkili Şehir:</span>
            <span className="font-bold text-amber-400">{cityNameDisplay}</span>
          </div>

          <div className="py-1.5 border-b border-white/5 space-y-1">
            <span className="text-gray-400 block">Adres / İlçe:</span>
            <div className="text-gray-200 bg-[#1A2133] p-2.5 rounded-xl">{partner.address || 'Adres belirtilmedi'}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={() => {
              onClose();
              onOpenEdit(partner);
            }}
            className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer transition-colors"
          >
            Düzenle
          </button>
          <button
            onClick={() => {
              onToggleStatus(partner);
              onClose();
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold cursor-pointer transition-colors ${
              isActive ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
            }`}
          >
            {isActive ? 'Pasife Al' : 'Aktif Et'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL: CREATE SUPPORT TICKET
// ============================================================================
interface CreateSupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { subject: string; category: string; priority: string; message: string }) => Promise<void>;
  cityNameDisplay: string;
}

export const CreateSupportTicketModal: React.FC<CreateSupportTicketModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  cityNameDisplay
}) => {
  const [subject, setSubject] = React.useState('');
  const [category, setCategory] = React.useState('finans_hakedis');
  const [priority, setPriority] = React.useState('normal');
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      alert('Lütfen konu başlığı ve açıklama giriniz.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        subject: subject.trim(),
        category,
        priority,
        message: message.trim()
      });
      setSubject('');
      setMessage('');
      onClose();
    } catch (e: any) {
      alert('Talep oluşturulamadı: ' + e?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-[#131826] w-full max-w-lg rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Genel Merkeze Destek Talebi</h3>
              <p className="text-[11px] text-gray-400">{cityNameDisplay} Bayiliği Resmi İletişim</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-gray-400 font-bold uppercase text-[10px]">Talep Konusu / Başlık</label>
            <input
              type="text"
              required
              placeholder="Örn: Bu Ayki Hak Ediş Mutabakatı Hk."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-[#1A2133] border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:border-blue-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-gray-400 font-bold uppercase text-[10px]">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#1A2133] border border-white/10 rounded-xl p-3 text-white font-bold outline-none"
              >
                <option value="finans_hakedis">Finans & Hak Ediş</option>
                <option value="isletme_onay">İşletme Onayları</option>
                <option value="sozlesme_hukuk">Sözleşme & Hukuk</option>
                <option value="teknik_destek">Teknik Destek</option>
                <option value="bolgesel_talep">Bölgesel Talep</option>
                <option value="genel">Genel Konu</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-gray-400 font-bold uppercase text-[10px]">Öncelik Seviyesi</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-[#1A2133] border border-white/10 rounded-xl p-3 text-white font-bold outline-none"
              >
                <option value="low">Düşük</option>
                <option value="normal">Normal</option>
                <option value="high">Yüksek</option>
                <option value="urgent">Acil</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-gray-400 font-bold uppercase text-[10px]">Açıklama / Mesaj</label>
            <textarea
              rows={4}
              required
              placeholder="Talebinizi, ilgili işlem/işletme detaylarını ve merkezden beklentinizi detaylıca açıklayınız..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-[#1A2133] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-400"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-extrabold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {loading ? 'Gönderiliyor...' : 'Talebi Merkeze İlet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL: SUPPORT TICKET DETAILS
// ============================================================================
interface SupportTicketDetailModalProps {
  ticket: FranchiseSupportTicket | null;
  onClose: () => void;
}

export const SupportTicketDetailModal: React.FC<SupportTicketDetailModalProps> = ({
  ticket,
  onClose
}) => {
  if (!ticket) return null;

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-[#131826] w-full max-w-lg rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-black text-white">{ticket.subject}</h3>
            <p className="text-[11px] text-gray-400 font-mono">Talep #{ticket.id.slice(0, 8)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 text-[10px]">
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
              Durum: {ticket.status}
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-bold border border-purple-500/20">
              Kategori: {ticket.category}
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
              Öncelik: {ticket.priority}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-gray-400 font-bold block uppercase text-[10px]">Bayi Mesajı:</span>
            <div className="p-3 bg-[#1A2133] rounded-2xl text-gray-200 whitespace-pre-wrap leading-relaxed">
              {ticket.message}
            </div>
          </div>

          {ticket.admin_reply ? (
            <div className="space-y-1">
              <span className="text-purple-400 font-bold block uppercase text-[10px] flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                Genel Merkez Yanıtı:
              </span>
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-200 whitespace-pre-wrap leading-relaxed">
                {ticket.admin_reply}
                {ticket.replied_at && (
                  <div className="text-[10px] text-purple-400/80 mt-2 font-mono">
                    Yanıt Tarihi: {new Date(ticket.replied_at).toLocaleString('tr-TR')}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-300 flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0" />
              <span>Talebiniz Genel Merkez operasyon ekibi tarafından incelenmektedir.</span>
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
