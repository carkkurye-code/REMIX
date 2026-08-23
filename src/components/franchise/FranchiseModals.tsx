import React, { useState } from 'react';
import { 
  X, ShieldCheck, Bike, AlertTriangle, 
  Headphones, Send, MessageSquare, Clock, CheckCircle2,
  Calendar, Phone, Mail, MapPin, Tag, FileText, User,
  Car, Footprints, AlertCircle, ShoppingBag, ArrowRight
} from 'lucide-react';
import { 
  Assistant, Order, OrderStatus,
  FranchiseSupportTicket 
} from '@/lib/supabase';

// ============================================================================
// MODAL: ADD ASSISTANT (YENİ ASİSTAN EKLE)
// ============================================================================
interface AddAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    fullName: string;
    phone: string;
    email: string;
    vehicleType: 'motosiklet' | 'bisiklet' | 'arac';
    plateNumber?: string;
  }) => Promise<void>;
  cityNameDisplay: string;
  franchiseId?: string;
  loading: boolean;
}

export const AddAssistantModal: React.FC<AddAssistantModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  cityNameDisplay,
  franchiseId,
  loading
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleType, setVehicleType] = useState<'motosiklet' | 'bisiklet' | 'arac'>('motosiklet');
  const [plateNumber, setPlateNumber] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      alert('Lütfen asistanın adı-soyadı ve telefon numarasını giriniz.');
      return;
    }
    await onSubmit({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      vehicleType,
      plateNumber: plateNumber.trim() || undefined
    });
    setFullName('');
    setPhone('');
    setEmail('');
    setPlateNumber('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-[#E5E7EB] shadow-2xl space-y-4 text-xs font-sans">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#111111] text-white flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#111111]">Yeni Asistan Ekle</h3>
              <p className="text-xs text-[#666666] font-medium">{cityNameDisplay} Bölgesi Asistan Kadrosu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#F7F7F8] hover:bg-[#F2F2F3] border border-[#E5E7EB] text-[#111111] flex items-center justify-center cursor-pointer transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[#666666] font-bold uppercase tracking-wider text-[10px]">Asistan Adı & Soyadı</label>
            <input
              type="text"
              required
              placeholder="Örn: Ahmet Yılmaz"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-[#F7F7F8] border border-[#E5E7EB] focus:border-[#111111] outline-none rounded-xl p-3 text-[#111111] font-bold transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[#666666] font-bold uppercase tracking-wider text-[10px]">Telefon Numarası</label>
              <input
                type="tel"
                required
                placeholder="0532 000 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#F7F7F8] border border-[#E5E7EB] focus:border-[#111111] outline-none rounded-xl p-3 text-[#111111] font-mono font-bold transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[#666666] font-bold uppercase tracking-wider text-[10px]">E-Posta (İsteğe Bağlı)</label>
              <input
                type="email"
                placeholder="asistan@ugra.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#F7F7F8] border border-[#E5E7EB] focus:border-[#111111] outline-none rounded-xl p-3 text-[#111111] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[#666666] font-bold uppercase tracking-wider text-[10px]">Ulaşım / Araç Tipi</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as any)}
                className="w-full bg-[#F7F7F8] border border-[#E5E7EB] focus:border-[#111111] outline-none rounded-xl p-3 text-[#111111] font-bold transition-all"
              >
                <option value="motosiklet">🛵 Motosiklet</option>
                <option value="arac">🚗 Otomobil / Araç</option>
                <option value="bisiklet">🚲 Bisiklet / Scooter</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[#666666] font-bold uppercase tracking-wider text-[10px]">Plaka (Varsa)</label>
              <input
                type="text"
                placeholder="34 ABC 123"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                className="w-full bg-[#F7F7F8] border border-[#E5E7EB] focus:border-[#111111] outline-none rounded-xl p-3 text-[#111111] font-mono transition-all uppercase"
              />
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Eklenen asistan otomatik olarak <strong>{cityNameDisplay}</strong> bayinize tanımlanır ve talepler atanabilir.</span>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-[#F7F7F8] hover:bg-[#F2F2F3] text-[#111111] font-bold border border-[#E5E7EB] cursor-pointer transition-all"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-[#111111] hover:bg-[#222222] text-white font-extrabold cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              {loading ? 'Ekleniyor...' : 'Asistanı Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL: EDIT ASSISTANT (ASİSTAN DÜZENLE)
// ============================================================================
interface EditAssistantModalProps {
  assistant: Assistant | null;
  onClose: () => void;
  onSubmit: (id: string, updates: Partial<Assistant>) => Promise<void>;
  loading: boolean;
}

export const EditAssistantModal: React.FC<EditAssistantModalProps> = ({
  assistant,
  onClose,
  onSubmit,
  loading
}) => {
  const [fullName, setFullName] = useState(assistant?.full_name || '');
  const [phone, setPhone] = useState(assistant?.phone || '');
  const [email, setEmail] = useState(assistant?.email || '');
  const [vehicleType, setVehicleType] = useState<'motosiklet' | 'bisiklet' | 'arac'>(
    (assistant?.vehicle_type as any) || 'motosiklet'
  );
  const [plateNumber, setPlateNumber] = useState(assistant?.plate_number || '');
  const [status, setStatus] = useState(assistant?.status || 'active');

  React.useEffect(() => {
    if (assistant) {
      setFullName(assistant.full_name || '');
      setPhone(assistant.phone || '');
      setEmail(assistant.email || '');
      setVehicleType((assistant.vehicle_type as any) || 'motosiklet');
      setPlateNumber(assistant.plate_number || '');
      setStatus(assistant.status || 'active');
    }
  }, [assistant]);

  if (!assistant) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(assistant.id, {
      full_name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      vehicle_type: vehicleType,
      plate_number: plateNumber.trim() || null,
      status: status,
      active: status === 'active' || status === 'aktif'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-[#E5E7EB] shadow-2xl space-y-4 text-xs font-sans">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div>
            <h3 className="text-base font-black text-[#111111]">Asistan Bilgilerini Düzenle</h3>
            <p className="text-[11px] text-[#666666] font-mono">ID: {assistant.id.slice(0, 8)}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#F7F7F8] hover:bg-[#F2F2F3] border border-[#E5E7EB] text-[#111111] flex items-center justify-center cursor-pointer transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[#666666] font-bold uppercase tracking-wider text-[10px]">Ad Soyad</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-[#F7F7F8] border border-[#E5E7EB] focus:border-[#111111] outline-none rounded-xl p-3 text-[#111111] font-bold transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[#666666] font-bold uppercase tracking-wider text-[10px]">Telefon</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#F7F7F8] border border-[#E5E7EB] focus:border-[#111111] outline-none rounded-xl p-3 text-[#111111] font-mono font-bold transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[#666666] font-bold uppercase tracking-wider text-[10px]">E-Posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#F7F7F8] border border-[#E5E7EB] focus:border-[#111111] outline-none rounded-xl p-3 text-[#111111] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[#666666] font-bold uppercase tracking-wider text-[10px]">Araç Tipi</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as any)}
                className="w-full bg-[#F7F7F8] border border-[#E5E7EB] focus:border-[#111111] outline-none rounded-xl p-3 text-[#111111] font-bold transition-all"
              >
                <option value="motosiklet">🛵 Motosiklet</option>
                <option value="arac">🚗 Araç / Otomobil</option>
                <option value="bisiklet">🚲 Bisiklet</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[#666666] font-bold uppercase tracking-wider text-[10px]">Durum</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-[#F7F7F8] border border-[#E5E7EB] focus:border-[#111111] outline-none rounded-xl p-3 text-[#111111] font-bold transition-all"
              >
                <option value="active">Aktif (Göreve Hazır)</option>
                <option value="passive">Pasif (Kapalı)</option>
                <option value="suspended">Askıya Alındı</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[#666666] font-bold uppercase tracking-wider text-[10px]">Araç Plakası</label>
            <input
              type="text"
              placeholder="34 ABC 123"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              className="w-full bg-[#F7F7F8] border border-[#E5E7EB] focus:border-[#111111] outline-none rounded-xl p-3 text-[#111111] font-mono uppercase transition-all"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-[#F7F7F8] hover:bg-[#F2F2F3] text-[#111111] font-bold border border-[#E5E7EB] cursor-pointer transition-all"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-[#111111] hover:bg-[#222222] text-white font-extrabold cursor-pointer transition-all active:scale-95 shadow-sm"
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
// MODAL: ASSISTANT DETAILS (ASİSTAN DETAY)
// ============================================================================
interface AssistantDetailModalProps {
  assistant: Assistant | null;
  cityNameDisplay: string;
  onClose: () => void;
  onOpenEdit: (assistant: Assistant) => void;
  onToggleStatus: (assistant: Assistant) => void;
}

export const AssistantDetailModal: React.FC<AssistantDetailModalProps> = ({
  assistant,
  cityNameDisplay,
  onClose,
  onOpenEdit,
  onToggleStatus
}) => {
  if (!assistant) return null;
  const isActive = assistant.status === 'active' || assistant.status === 'aktif' || assistant.active !== false;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-[#E5E7EB] shadow-2xl space-y-4 text-xs font-sans">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#111111] text-white flex items-center justify-center font-bold text-sm">
              {assistant.full_name?.charAt(0) || 'A'}
            </div>
            <div>
              <h3 className="text-sm font-black text-[#111111]">{assistant.full_name}</h3>
              <p className="text-[11px] text-[#666666] font-mono">ID: {assistant.id.slice(0, 8)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#F7F7F8] hover:bg-[#F2F2F3] border border-[#E5E7EB] text-[#111111] flex items-center justify-center cursor-pointer transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          <div className="flex justify-between py-2 border-b border-[#F2F2F3]">
            <span className="text-[#666666]">Çalışma Durumu:</span>
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {isActive ? 'Aktif (Göreve Hazır)' : 'Pasif'}
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-[#F2F2F3]">
            <span className="text-[#666666]">Telefon:</span>
            <span className="font-mono font-bold text-[#111111]">{assistant.phone || '-'}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-[#F2F2F3]">
            <span className="text-[#666666]">E-Posta:</span>
            <span className="font-mono text-[#111111]">{assistant.email || '-'}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-[#F2F2F3]">
            <span className="text-[#666666]">Araç & Plaka:</span>
            <span className="font-bold text-[#111111] flex items-center gap-1.5">
              {assistant.vehicle_type === 'arac' ? '🚗 Otomobil' : assistant.vehicle_type === 'bisiklet' ? '🚲 Bisiklet' : '🛵 Motosiklet'}
              {assistant.plate_number ? `(${assistant.plate_number})` : ''}
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-[#F2F2F3]">
            <span className="text-[#666666]">Tamamlanan Görev Sayısı:</span>
            <span className="font-mono font-bold text-[#111111]">{assistant.completed_orders || 0} Talep</span>
          </div>

          <div className="flex justify-between py-2 border-b border-[#F2F2F3]">
            <span className="text-[#666666]">Kayıt Tarihi:</span>
            <span className="font-medium text-[#111111]">
              {assistant.created_at ? new Date(assistant.created_at).toLocaleDateString('tr-TR') : '-'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={() => {
              onClose();
              onOpenEdit(assistant);
            }}
            className="flex-1 py-3 rounded-xl bg-[#F7F7F8] hover:bg-[#F2F2F3] text-[#111111] font-bold border border-[#E5E7EB] cursor-pointer transition-all"
          >
            Bilgileri Düzenle
          </button>
          <button
            onClick={() => {
              onToggleStatus(assistant);
              onClose();
            }}
            className={`flex-1 py-3 rounded-xl font-bold cursor-pointer transition-all ${
              isActive ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
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
// MODAL: ASSIGN ASSISTANT TO ORDER (TALEBE ASİSTAN ATA)
// ============================================================================
interface AssignAssistantModalProps {
  order: Order | null;
  assistants: Assistant[];
  onClose: () => void;
  onAssign: (orderId: string, assistantId: string, assistantName: string) => Promise<void>;
  loading: boolean;
}

export const AssignAssistantModal: React.FC<AssignAssistantModalProps> = ({
  order,
  assistants,
  onClose,
  onAssign,
  loading
}) => {
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>('');
  const [search, setSearch] = useState('');

  React.useEffect(() => {
    if (order?.assistant_id) {
      setSelectedAssistantId(order.assistant_id);
    } else {
      setSelectedAssistantId('');
    }
  }, [order]);

  if (!order) return null;

  const activeAssistants = assistants.filter(a => a.status === 'active' || a.status === 'aktif' || a.active !== false);

  const filtered = activeAssistants.filter(a => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (a.full_name || '').toLowerCase().includes(q) ||
      (a.phone || '').includes(q) ||
      (a.vehicle_type || '').toLowerCase().includes(q)
    );
  });

  const handleConfirm = async () => {
    if (!selectedAssistantId) {
      alert('Lütfen atanacak bir asistan seçiniz.');
      return;
    }
    const chosen = assistants.find(a => a.id === selectedAssistantId);
    await onAssign(order.id, selectedAssistantId, chosen?.full_name || 'Bölge Asistanı');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl p-6 border border-[#E5E7EB] shadow-2xl space-y-4 text-xs font-sans">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div>
            <h3 className="text-base font-black text-[#111111]">Talebe Asistan Ata</h3>
            <p className="text-xs text-[#666666] font-mono">Talep ID: #{order.id.slice(0, 8)}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#F7F7F8] hover:bg-[#F2F2F3] border border-[#E5E7EB] text-[#111111] flex items-center justify-center cursor-pointer transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Order Preview */}
        <div className="p-3 rounded-xl bg-[#F7F7F8] border border-[#E5E7EB] space-y-1">
          <div className="flex justify-between font-bold text-[#111111]">
            <span>Müşteri: {order.customer_name || 'Misafir Müşteri'}</span>
            <span className="font-mono">{order.total_price ? `₺${order.total_price}` : ''}</span>
          </div>
          <p className="text-[#666666] text-[11px] line-clamp-2">
            📍 {order.delivery_address || order.customer_address || 'Adres belirtilmedi'}
          </p>
          {order.task_description && (
            <p className="text-[#111111] text-[11px] font-medium pt-1">
              📝 {order.task_description}
            </p>
          )}
        </div>

        {/* Search Assistant */}
        <div className="space-y-2">
          <label className="text-[#666666] font-bold uppercase tracking-wider text-[10px]">
            Bölgedeki Müsait Asistanı Seçin ({activeAssistants.length} Aktif)
          </label>
          <input
            type="text"
            placeholder="Asistan adı, telefon veya araç ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F7F7F8] border border-[#E5E7EB] focus:border-[#111111] outline-none rounded-xl p-2.5 text-[#111111] transition-all"
          />

          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-[#8A8A8A]">Müsait asistan bulunamadı.</div>
            ) : (
              filtered.map(ast => {
                const isSelected = selectedAssistantId === ast.id;
                return (
                  <button
                    key={ast.id}
                    type="button"
                    onClick={() => setSelectedAssistantId(ast.id)}
                    className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-[#111111] text-white border-[#111111]' 
                        : 'bg-white text-[#111111] border-[#E5E7EB] hover:bg-[#F7F7F8]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isSelected ? 'bg-white text-[#111111]' : 'bg-[#F7F7F8] text-[#111111]'}`}>
                        {ast.vehicle_type === 'arac' ? '🚗' : ast.vehicle_type === 'bisiklet' ? '🚲' : '🛵'}
                      </div>
                      <div>
                        <div className="font-black text-xs">{ast.full_name}</div>
                        <div className={`text-[10px] font-mono ${isSelected ? 'text-gray-300' : 'text-[#666666]'}`}>
                          {ast.phone} {ast.plate_number ? `• ${ast.plate_number}` : ''}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-[#F7F7F8] hover:bg-[#F2F2F3] text-[#111111] font-bold border border-[#E5E7EB] cursor-pointer transition-all"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !selectedAssistantId}
            className="flex-1 py-3 rounded-xl bg-[#111111] hover:bg-[#222222] text-white font-extrabold cursor-pointer transition-all active:scale-95 shadow-sm disabled:opacity-50"
          >
            {loading ? 'Atanıyor...' : 'Asistanı Göreve Ata'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL: REQUEST DETAILS (TALEP DETAY & DURUM YÖNETİMİ)
// ============================================================================
interface RequestDetailModalProps {
  order: Order | null;
  cityNameDisplay: string;
  onClose: () => void;
  onOpenAssign: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  loading: boolean;
}

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  order,
  cityNameDisplay,
  onClose,
  onOpenAssign,
  onUpdateStatus,
  loading
}) => {
  if (!order) return null;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'kurye_bekleniyor':
      case 'pending':
      case 'bekliyor':
        return { label: 'Asistan Bekliyor', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'kurye_atandi':
      case 'accepted':
        return { label: 'Asistan Atandı', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'hazirlaniyor':
      case 'preparing':
        return { label: 'Hazırlanıyor', bg: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'yolda':
      case 'on_the_way':
        return { label: 'Asistan Yolda', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      case 'teslim_edildi':
      case 'delivered':
      case 'tamamlandi':
        return { label: 'Tamamlandı', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'iptal':
      case 'iptal_edildi':
      case 'cancelled':
        return { label: 'İptal Edildi', bg: 'bg-red-50 text-red-800 border-red-200' };
      default:
        return { label: status, bg: 'bg-gray-50 text-gray-800 border-gray-200' };
    }
  };

  const statusObj = getStatusLabel(order.status);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl p-6 border border-[#E5E7EB] shadow-2xl space-y-4 text-xs font-sans">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#666666] uppercase">TALEP #{order.id.slice(0, 8)}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusObj.bg}`}>
                {statusObj.label}
              </span>
            </div>
            <h3 className="text-base font-black text-[#111111] mt-0.5">
              {order.customer_name || 'Bölgesel Talep'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#F7F7F8] hover:bg-[#F2F2F3] border border-[#E5E7EB] text-[#111111] flex items-center justify-center cursor-pointer transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Assigned Assistant Banner */}
        <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-[#E5E7EB] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#8A8A8A] font-bold uppercase block">Görevli Asistan</span>
            <div className="font-black text-xs text-[#111111] flex items-center gap-1.5 mt-0.5">
              <Bike className="w-4 h-4 text-[#111111]" />
              {order.assistant_name || (order.assistant_id ? `Asistan #${order.assistant_id.slice(0, 6)}` : 'Asistan Atanmadı')}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAssign(order);
            }}
            className="px-3 py-1.5 rounded-xl bg-[#111111] hover:bg-[#222222] text-white font-bold text-[11px] cursor-pointer transition-all shadow-sm"
          >
            {order.assistant_id ? 'Asistanı Değiştir' : 'Asistan Ata'}
          </button>
        </div>

        {/* Details Grid */}
        <div className="space-y-2">
          <div className="flex justify-between py-2 border-b border-[#F2F2F3]">
            <span className="text-[#666666]">Müşteri Telefon:</span>
            <span className="font-mono font-bold text-[#111111]">{order.customer_phone || '-'}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-[#F2F2F3]">
            <span className="text-[#666666]">Tutar / Ödeme:</span>
            <span className="font-mono font-bold text-[#111111]">
              ₺{order.total_price || 0} ({order.payment_type === 'cash' ? 'Nakit' : 'Kredi Kartı'})
            </span>
          </div>

          <div className="flex justify-between py-2 border-b border-[#F2F2F3]">
            <span className="text-[#666666]">Tarih / Saat:</span>
            <span className="font-medium text-[#111111]">
              {order.created_at ? new Date(order.created_at).toLocaleString('tr-TR') : '-'}
            </span>
          </div>

          <div className="py-2 border-b border-[#F2F2F3] space-y-1">
            <span className="text-[#666666] block font-medium">Teslimat / Görev Adresi:</span>
            <p className="p-2.5 rounded-xl bg-[#F7F7F8] border border-[#E5E7EB] font-medium text-[#111111]">
              {order.delivery_address || order.customer_address || 'Adres belirtilmedi'}
            </p>
          </div>

          {order.task_description && (
            <div className="py-2 space-y-1">
              <span className="text-[#666666] block font-medium">Görev / Sipariş Detayı:</span>
              <p className="p-2.5 rounded-xl bg-[#F7F7F8] border border-[#E5E7EB] font-medium text-[#111111]">
                {order.task_description}
              </p>
            </div>
          )}
        </div>

        {/* Quick Status Buttons */}
        <div className="space-y-1.5 pt-2">
          <label className="text-[#666666] font-bold uppercase tracking-wider text-[10px]">Operasyon Durumunu Güncelle</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              disabled={loading}
              onClick={() => onUpdateStatus(order.id, 'yolda')}
              className="py-2 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 cursor-pointer transition-all text-center"
            >
              Yolda
            </button>
            <button
              disabled={loading}
              onClick={() => onUpdateStatus(order.id, 'teslim_edildi')}
              className="py-2 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 cursor-pointer transition-all text-center"
            >
              Tamamla
            </button>
            <button
              disabled={loading}
              onClick={() => onUpdateStatus(order.id, 'iptal_edildi')}
              className="py-2 px-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-200 cursor-pointer transition-all text-center"
            >
              İptal Et
            </button>
          </div>
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
    } catch (err: any) {
      alert('Destek bileti oluşturulamadı: ' + err?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl p-6 border border-[#E5E7EB] shadow-2xl space-y-4 text-xs font-sans">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#F7F7F8] border border-[#E5E7EB] flex items-center justify-center text-[#111111]">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#111111]">Genel Merkeze Destek Talebi</h3>
              <p className="text-xs text-[#666666] font-medium">{cityNameDisplay} Ana Bayiliği İletişim Formu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#F7F7F8] hover:bg-[#F2F2F3] border border-[#E5E7EB] text-[#111111] flex items-center justify-center cursor-pointer transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[#666666] font-bold uppercase tracking-wider text-[10px]">Talep Konusu / Başlık</label>
            <input
              type="text"
              required
              placeholder="Örn: Hak ediş mutabakatı veya sistem entegrasyonu..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-[#F7F7F8] border border-[#E5E7EB] focus:border-[#111111] outline-none rounded-xl p-3 text-[#111111] font-bold transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[#666666] font-bold uppercase tracking-wider text-[10px]">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#F7F7F8] border border-[#E5E7EB] focus:border-[#111111] outline-none rounded-xl p-3 text-[#111111] font-bold transition-all"
              >
                <option value="finans_hakedis">Finans & Hak Ediş</option>
                <option value="sozlesme_lisans">Sözleşme & Lisans</option>
                <option value="operasyon_destek">Bölgesel Operasyon & Asistanlık</option>
                <option value="teknik_sistem">Teknik / Sistem Talebi</option>
                <option value="diger">Diğer Konular</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[#666666] font-bold uppercase tracking-wider text-[10px]">Öncelik Derecesi</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-[#F7F7F8] border border-[#E5E7EB] focus:border-[#111111] outline-none rounded-xl p-3 text-[#111111] font-bold transition-all"
              >
                <option value="low">Düşük (Bilgilendirme)</option>
                <option value="normal">Normal</option>
                <option value="high">Yüksek (Önemli)</option>
                <option value="urgent">Acil (Operasyonu Etkiliyor)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[#666666] font-bold uppercase tracking-wider text-[10px]">Açıklama / Mesajınız</label>
            <textarea
              rows={4}
              required
              placeholder="Talebinizi detaylı olarak açıklayınız..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-[#F7F7F8] border border-[#E5E7EB] focus:border-[#111111] outline-none rounded-xl p-3 text-[#111111] transition-all leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-[#F7F7F8] hover:bg-[#F2F2F3] text-[#111111] font-bold border border-[#E5E7EB] cursor-pointer transition-all"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-[#111111] hover:bg-[#222222] text-white font-extrabold cursor-pointer transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Gönderiliyor...' : 'Talebi İlet'}</span>
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
  cityNameDisplay: string;
  onClose: () => void;
}

export const SupportTicketDetailModal: React.FC<SupportTicketDetailModalProps> = ({
  ticket,
  cityNameDisplay,
  onClose
}) => {
  if (!ticket) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl p-6 border border-[#E5E7EB] shadow-2xl space-y-4 text-xs font-sans">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#666666] uppercase">BİLET #{ticket.id.slice(0, 8)}</span>
              <span className="px-2 py-0.5 rounded-md bg-[#F7F7F8] text-[#111111] text-[10px] font-bold border border-[#E5E7EB]">
                {ticket.category}
              </span>
            </div>
            <h3 className="text-base font-black text-[#111111] mt-0.5">{ticket.subject}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#F7F7F8] hover:bg-[#F2F2F3] border border-[#E5E7EB] text-[#111111] flex items-center justify-center cursor-pointer transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ticket Info Details */}
        <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#F7F7F8] border border-[#E5E7EB] text-[11px]">
          <div>
            <span className="text-[#666666] block">Oluşturulma:</span>
            <span className="font-medium text-[#111111]">
              {ticket.created_at ? new Date(ticket.created_at).toLocaleString('tr-TR') : '-'}
            </span>
          </div>
          <div>
            <span className="text-[#666666] block">Öncelik:</span>
            <span className="font-bold text-[#111111] uppercase">{ticket.priority}</span>
          </div>
        </div>

        {/* Initial Ticket Message */}
        <div className="space-y-1">
          <label className="text-[#666666] font-bold uppercase tracking-wider text-[10px]">Bayi Talebi</label>
          <div className="p-3.5 rounded-xl bg-[#F7F7F8] border border-[#E5E7EB] text-[#111111] leading-relaxed whitespace-pre-wrap font-medium">
            {ticket.message}
          </div>
        </div>

        {/* Headquarters Response */}
        {ticket.admin_reply ? (
          <div className="space-y-1">
            <label className="text-emerald-700 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Genel Merkez Yanıtı
            </label>
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 leading-relaxed whitespace-pre-wrap font-medium">
              {ticket.admin_reply}
              {ticket.replied_at && (
                <div className="text-[10px] text-emerald-600 mt-2 font-mono">
                  İşlem Tarihi: {new Date(ticket.replied_at).toLocaleString('tr-TR')}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Genel Merkez operasyon ve destek ekibi talebinizi incelemektedir.</span>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#111111] hover:bg-[#222222] text-white font-extrabold cursor-pointer transition-all active:scale-95 shadow-sm"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
