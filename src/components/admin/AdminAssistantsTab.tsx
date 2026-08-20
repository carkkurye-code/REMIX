import React, { useState } from 'react';
import { 
  Bike, Search, Eye, MapPin, Check, ShieldAlert, 
  Plus, Navigation, PowerOff, CheckCircle2, XCircle
} from 'lucide-react';
import { Assistant, Order, db } from '@/lib/supabase';
import { ConfirmModal } from './ConfirmModal';
import { AdminOperationsService } from '@/services/adminOperations';

interface AdminAssistantsTabProps {
  assistants: Assistant[];
  orders: Order[];
  onRefresh: () => void;
  setAssistants: React.Dispatch<React.SetStateAction<Assistant[]>>;
}

export const AdminAssistantsTab: React.FC<AdminAssistantsTabProps> = ({
  assistants,
  orders,
  onRefresh,
  setAssistants
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'passive' | 'suspended'>('all');

  const [viewingAssistant, setViewingAssistant] = useState<Assistant | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New Assistant State
  const [newAssistant, setNewAssistant] = useState<Partial<Assistant>>({
    full_name: '',
    phone: '',
    email: '',
    vehicle_type: 'motosiklet',
    status: 'active',
    active: true,
    is_online: true
  });

  // Confirm Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
    isDanger?: boolean;
  }>({ isOpen: false, title: '', description: '', action: async () => {} });

  const activeCount = (assistants || []).filter(a => {
    const st = (a.status || '').toLowerCase();
    return (st === 'active' || st === 'aktif' || st === 'görevde') && a.active !== false;
  }).length;

  const passiveCount = (assistants || []).filter(a => {
    const st = (a.status || '').toLowerCase();
    return st === 'passive' || st === 'pasif' || a.active === false;
  }).length;

  const suspendedCount = (assistants || []).filter(a => {
    const st = (a.status || '').toLowerCase();
    return st === 'suspended';
  }).length;

  const filteredAssistants = (assistants || []).filter(a => {
    if (!a) return false;
    const nameStr = String(a.full_name ?? '');
    const phoneStr = String(a.phone ?? '');
    const emailStr = String(a.email ?? '');
    const termStr = String(searchTerm ?? '').toLowerCase();

    const matchesSearch = nameStr.toLowerCase().includes(termStr) ||
                          phoneStr.includes(searchTerm) ||
                          emailStr.toLowerCase().includes(termStr);
    const matchesVehicle = !selectedVehicle || a.vehicle_type === selectedVehicle;

    const st = (a.status || '').toLowerCase();
    const isPassive = st === 'passive' || st === 'pasif' || a.active === false;
    const isActive = (st === 'active' || st === 'aktif' || st === 'görevde') && a.active !== false;
    const isSuspended = st === 'suspended';

    let matchesStatus = true;
    if (selectedStatus === 'active') {
      matchesStatus = isActive;
    } else if (selectedStatus === 'passive') {
      matchesStatus = isPassive;
    } else if (selectedStatus === 'suspended') {
      matchesStatus = isSuspended;
    }

    return matchesSearch && matchesVehicle && matchesStatus;
  });

  // Actions
  const handleDeactivate = (asst: Assistant) => {
    setConfirmModal({
      isOpen: true,
      title: 'Asistanı Pasife Al',
      description: `${asst.full_name} isimli asistanı pasife almak istediğinize emin misiniz? Pasife alınan asistan yeni görev alamaz ve sisteme giriş yapamaz.`,
      isDanger: true,
      action: async () => {
        try {
          await db.setAssistantStatus(asst.id, 'passive');
          await AdminOperationsService.toggleAssistantStatus(asst.id, false);
          setAssistants(prev => prev.map(a => a.id === asst.id ? { ...a, status: 'passive', active: false, is_online: false, task_status: 'Pasif' } : a));
          if (onRefresh) onRefresh();
        } catch (err: any) {
          console.error('Pasife alma hatası:', err);
          alert('Asistan pasife alınırken bir hata oluştu: ' + (err?.message || 'Lütfen tekrar deneyin.'));
        }
      }
    });
  };

  const handleActivate = (asst: Assistant) => {
    setConfirmModal({
      isOpen: true,
      title: 'Asistanı Aktif Et',
      description: `${asst.full_name} isimli asistanı tekrar aktif etmek istediğinize emin misiniz?`,
      isDanger: false,
      action: async () => {
        try {
          await db.setAssistantStatus(asst.id, 'active');
          await AdminOperationsService.toggleAssistantStatus(asst.id, true);
          setAssistants(prev => prev.map(a => a.id === asst.id ? { ...a, status: 'active', active: true, is_online: true, task_status: 'Müsait' } : a));
          if (onRefresh) onRefresh();
        } catch (err: any) {
          console.error('Aktif etme hatası:', err);
          alert('Asistan aktif edilirken bir hata oluştu: ' + (err?.message || 'Lütfen tekrar deneyin.'));
        }
      }
    });
  };

  const handleSuspend = (asst: Assistant) => {
    const isSuspended = (asst.status || '').toLowerCase() === 'suspended';
    const newStatus = isSuspended ? ('active' as const) : ('suspended' as const);

    setConfirmModal({
      isOpen: true,
      title: isSuspended ? 'Asistanı Askıdan Çıkar & Aktif Et' : 'Asistanı Askıya Al',
      description: `${asst.full_name} isimli asistanı ${isSuspended ? 'askıdan çıkarıp tekrar aktif etmek' : 'askıya almak'} istediğinize emin misiniz?`,
      isDanger: !isSuspended,
      action: async () => {
        try {
          await db.setAssistantStatus(asst.id, newStatus);
          await AdminOperationsService.toggleAssistantStatus(asst.id, isSuspended);
          setAssistants(prev => prev.map(a => a.id === asst.id ? { 
            ...a, 
            status: newStatus, 
            active: isSuspended, 
            is_online: isSuspended,
            task_status: isSuspended ? 'Müsait' : 'Askıda'
          } : a));
          if (onRefresh) onRefresh();
        } catch (err: any) {
          console.error('Askıya alma hatası:', err);
          alert('İşlem yapılırken bir hata oluştu: ' + (err?.message || 'Lütfen tekrar deneyin.'));
        }
      }
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssistant.full_name || !newAssistant.phone) return;
    try {
      const created = await db.createAssistant(newAssistant);
      setAssistants(prev => [created, ...prev]);
      setIsCreateOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">Saha Asistanı (Kurye) Yönetimi</h1>
          <p className="text-xs sm:text-sm text-[#6B7280] font-medium mt-1">Saha kuryelerini, canlı konumlarını, araç tiplerini, aktif ve pasif durumlarını yönetin.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#1F2937] hover:bg-black text-white font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm text-xs active:scale-95 border-0"
        >
          <Plus className="w-4 h-4 text-white" /> Yeni Asistan Ekle
        </button>
      </div>

      {/* STATUS FILTER TABS */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedStatus('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
            selectedStatus === 'all'
              ? 'bg-[#1F2937] text-white border-[#1F2937] shadow-sm'
              : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-gray-50'
          }`}
        >
          Tüm Asistanlar ({assistants.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedStatus('active')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
            selectedStatus === 'active'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white text-emerald-700 border-[#E5E7EB] hover:bg-emerald-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Aktif Asistanlar ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setSelectedStatus('passive')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
            selectedStatus === 'passive'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white text-amber-700 border-[#E5E7EB] hover:bg-amber-50'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" /> Pasif Asistanlar ({passiveCount})
        </button>
        {suspendedCount > 0 && (
          <button
            type="button"
            onClick={() => setSelectedStatus('suspended')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
              selectedStatus === 'suspended'
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                : 'bg-white text-purple-700 border-[#E5E7EB] hover:bg-purple-50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Askıda ({suspendedCount})
          </button>
        )}
      </div>

      {/* SEARCH AND VEHICLE FILTERS */}
      <div className="bg-white border border-[#E5E7EB] p-4 rounded-2xl shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Asistan adı, telefon veya e-posta ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 bg-gray-50 border border-[#E5E7EB] rounded-xl pl-9 pr-3 text-xs font-medium text-[#1F2937] focus:outline-none focus:border-[#1F2937] focus:ring-1 focus:ring-[#1F2937] transition-all shadow-sm"
          />
        </div>

        <select
          value={selectedVehicle}
          onChange={(e) => setSelectedVehicle(e.target.value)}
          className="h-10 bg-gray-50 border border-[#E5E7EB] rounded-xl px-3 text-xs font-medium text-[#1F2937] focus:outline-none focus:border-[#1F2937] focus:ring-1 focus:ring-[#1F2937] transition-all shadow-sm"
        >
          <option value="">Tüm Araç Tipleri</option>
          <option value="motosiklet">Motosiklet</option>
          <option value="bisiklet">Bisiklet</option>
          <option value="arac">Otomobil / Araç</option>
        </select>
      </div>

      {/* ASSISTANTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssistants.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white border border-dashed border-[#E5E7EB] rounded-2xl text-[#6B7280] text-sm font-medium shadow-sm">
            Kriterlere uygun asistan bulunamadı.
          </div>
        ) : (
          filteredAssistants.map(asst => {
            const st = (asst.status || '').toLowerCase();
            const isPassive = st === 'passive' || st === 'pasif' || asst.active === false;
            const isSuspended = st === 'suspended';
            const isBusy = st === 'görevde';
            const isActive = !isPassive && !isSuspended;

            return (
              <div 
                key={asst.id} 
                className={`bg-white border rounded-2xl p-5 space-y-3.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                  isPassive ? 'border-amber-200 bg-amber-50/20' : isSuspended ? 'border-purple-200 bg-purple-50/20' : 'border-[#E5E7EB]'
                }`}
              >
                <div className="space-y-3">
                  {/* Header info */}
                  <div className="flex items-start justify-between gap-2 border-b border-[#E5E7EB] pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl border font-bold flex items-center justify-center shrink-0 shadow-sm ${
                        isPassive 
                          ? 'bg-amber-50 border-amber-200 text-amber-600'
                          : isSuspended 
                          ? 'bg-purple-50 border-purple-200 text-purple-600'
                          : 'bg-blue-50 border-blue-200 text-blue-600'
                      }`}>
                        <Bike className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#1F2937] text-sm flex items-center gap-1.5">
                          {asst.full_name}
                        </h3>
                        <p className="text-xs text-[#6B7280] font-mono mt-0.5">{asst.phone}</p>
                        <span className="inline-block text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md capitalize font-semibold mt-1">
                          {asst.vehicle_type || 'Motosiklet'}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                      isBusy ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      isSuspended ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {isBusy ? 'Görevde' : isActive ? 'Aktif' : isSuspended ? 'Askıda' : 'Pasif'}
                    </span>
                  </div>

                  {/* Location Box */}
                  <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-xs space-y-1">
                    <span className="text-[10px] font-semibold text-[#6B7280] uppercase block">Canlı Konum Bilgisi</span>
                    <div className="text-[#1F2937] font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#1F2937] shrink-0" />
                      <span className="truncate">{asst.latitude && asst.longitude ? `${asst.latitude.toFixed(4)}, ${asst.longitude.toFixed(4)}` : 'Konum Belirtilmedi'}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#E5E7EB] text-xs">
                  <button
                    type="button"
                    onClick={() => setViewingAssistant(asst)}
                    className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-[#1F2937] font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#1F2937]" /> Profil
                  </button>

                  <div className="flex items-center gap-1.5">
                    {isActive ? (
                      <button
                        type="button"
                        onClick={() => handleDeactivate(asst)}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                        title="Asistanı Pasife Al"
                      >
                        <PowerOff className="w-3.5 h-3.5 text-amber-700" /> Pasife Al
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleActivate(asst)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                        title="Asistanı Aktif Et"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-700" /> Aktif Et
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSuspend(asst)}
                      className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
                      title={isSuspended ? 'Askıdan Çıkar' : 'Askıya Al'}
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* VIEW ASSISTANT PROFILE MODAL */}
      {viewingAssistant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 relative text-xs">
            <button
              type="button"
              onClick={() => setViewingAssistant(null)}
              aria-label="Kapat"
              title="Kapat"
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 text-[#6B7280] hover:text-[#1F2937] flex items-center justify-center transition-colors cursor-pointer"
            >
              <PowerOff className="w-4 h-4 hidden" />
              <span className="text-sm font-bold">✕</span>
            </button>

            <div className="flex items-center gap-3 border-b border-[#E5E7EB] pb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 font-bold flex items-center justify-center">
                <Bike className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1F2937]">{viewingAssistant.full_name}</h2>
                <p className="text-[#6B7280] font-medium">{viewingAssistant.phone} {viewingAssistant.email ? `• ${viewingAssistant.email}` : ''}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl space-y-1">
                <span className="text-[10px] font-semibold text-[#6B7280] uppercase block">Asistan Bilgileri</span>
                <div><span className="text-[#6B7280]">Araç Tipi:</span> <span className="capitalize font-bold text-[#1F2937]">{viewingAssistant.vehicle_type}</span></div>
                <div>
                  <span className="text-[#6B7280]">Durum:</span>{' '}
                  <span className="capitalize font-bold text-[#1F2937]">
                    {(viewingAssistant.status === 'passive' || viewingAssistant.status === 'pasif' || viewingAssistant.active === false) 
                      ? 'Pasif' 
                      : (viewingAssistant.status === 'suspended')
                      ? 'Askıda'
                      : 'Aktif'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl space-y-1">
                <span className="text-[10px] font-semibold text-[#6B7280] uppercase block">Sistem Detayları</span>
                <div><span className="text-[#6B7280]">Kayıt Tarihi:</span> <span className="font-bold text-[#1F2937]">{new Date(viewingAssistant.created_at).toLocaleDateString('tr-TR')}</span></div>
                {viewingAssistant.city && <div><span className="text-[#6B7280]">Şehir:</span> <span className="font-bold text-[#1F2937]">{viewingAssistant.city}</span></div>}
              </div>
            </div>

            {/* Live Location Map Card */}
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2">
              <div className="font-bold text-blue-700 flex items-center gap-2">
                <Navigation className="w-4 h-4 animate-bounce text-blue-600" /> Canlı Saha Konum Takibi
              </div>
              <div className="w-full h-32 bg-white rounded-lg border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] font-mono text-xs shadow-inner">
                [GPS MAP - LAT: {viewingAssistant.latitude || 41.0082}, LNG: {viewingAssistant.longitude || 28.9784}]
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={() => setViewingAssistant(null)}
                className="px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] text-[#4B5563] hover:text-[#1F2937] font-semibold cursor-pointer shadow-sm hover:bg-gray-50 transition-all"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW ASSISTANT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative text-xs">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              aria-label="Kapat"
              title="Kapat"
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 text-[#6B7280] hover:text-[#1F2937] flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="text-sm font-bold">✕</span>
            </button>

            <h2 className="text-lg font-bold text-[#1F2937] flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#1F2937]" /> Yeni Saha Asistanı Kaydet
            </h2>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-[#4B5563] mb-1 font-semibold">Ad Soyad</label>
                <input
                  type="text"
                  required
                  value={newAssistant.full_name}
                  onChange={(e) => setNewAssistant({ ...newAssistant, full_name: e.target.value })}
                  className="w-full bg-gray-50 border border-[#E5E7EB] rounded-xl p-2.5 text-[#1F2937] focus:border-[#1F2937] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4B5563] mb-1 font-semibold">Telefon</label>
                  <input
                    type="text"
                    required
                    value={newAssistant.phone}
                    onChange={(e) => setNewAssistant({ ...newAssistant, phone: e.target.value })}
                    className="w-full bg-gray-50 border border-[#E5E7EB] rounded-xl p-2.5 text-[#1F2937] focus:border-[#1F2937] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#4B5563] mb-1 font-semibold">E-posta</label>
                  <input
                    type="email"
                    value={newAssistant.email || ''}
                    onChange={(e) => setNewAssistant({ ...newAssistant, email: e.target.value })}
                    className="w-full bg-gray-50 border border-[#E5E7EB] rounded-xl p-2.5 text-[#1F2937] focus:border-[#1F2937] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#4B5563] mb-1 font-semibold">Araç Tipi</label>
                <select
                  value={newAssistant.vehicle_type}
                  onChange={(e) => setNewAssistant({ ...newAssistant, vehicle_type: e.target.value as any })}
                  className="w-full bg-gray-50 border border-[#E5E7EB] rounded-xl p-2.5 text-[#1F2937] focus:border-[#1F2937] focus:outline-none"
                >
                  <option value="motosiklet">Motosiklet</option>
                  <option value="bisiklet">Bisiklet</option>
                  <option value="arac">Otomobil / Araç</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-[#4B5563] hover:text-[#1F2937] font-semibold cursor-pointer bg-white hover:bg-gray-50 shadow-sm"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1F2937] hover:bg-black text-white font-bold cursor-pointer transition-all shadow-sm border-0"
                >
                  Kaydet & Aktif Yap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.action}
        title={confirmModal.title}
        description={confirmModal.description}
        isDanger={confirmModal.isDanger}
      />
    </div>
  );
};

