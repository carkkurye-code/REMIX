import React, { useState } from 'react';
import { 
  Users, UserCheck, Bike, Car, Phone, 
  Search, ShieldCheck, Clock, CheckCircle2, AlertCircle, 
  Plus, Edit, Eye, Filter, UserX
} from 'lucide-react';
import { Assistant } from '@/lib/supabase';
import { FranchiseKPIs } from './types';

interface Props {
  assistants: Assistant[];
  kpis: FranchiseKPIs;
  cityNameDisplay: string;
  onOpenAddAssistant: () => void;
  onOpenEditAssistant: (assistant: Assistant) => void;
  onOpenDetailAssistant: (assistant: Assistant) => void;
  onToggleStatus: (assistant: Assistant) => void;
  onApproveApplication?: (assistant: Assistant) => void;
  onOpenRejectModal?: (assistant: Assistant) => void;
}

export const FranchiseAssistantsTab: React.FC<Props> = ({
  assistants,
  kpis,
  cityNameDisplay,
  onOpenAddAssistant,
  onOpenEditAssistant,
  onOpenDetailAssistant,
  onToggleStatus,
  onApproveApplication,
  onOpenRejectModal
}) => {
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredAssistants = assistants.filter(a => {
    if (vehicleFilter !== 'all' && a.vehicle_type !== vehicleFilter) return false;
    if (statusFilter === 'active' && !(a.status === 'active' || a.status === 'aktif' || a.active !== false)) return false;
    if (statusFilter === 'passive' && (a.status === 'active' || a.status === 'aktif' || a.active !== false)) return false;
    if (statusFilter === 'pending' && a.status !== 'pending' && a.status !== 'beklemede') return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (a.full_name || '').toLowerCase().includes(q) ||
      (a.phone || '').includes(q) ||
      (a.email || '').toLowerCase().includes(q) ||
      (a.plate_number || '').toLowerCase().includes(q)
    );
  });

  const activeCount = assistants.filter(a => a.status === 'active' || a.status === 'aktif' || a.active !== false).length;
  const pendingCount = assistants.filter(a => a.status === 'pending' || a.status === 'beklemede').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[1.65rem] sm:rounded-2xl bg-card border border-border shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Bölge Asistan Kadrosu ({assistants.length})
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
              {activeCount} Aktif
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {cityNameDisplay} bayiliğinize bağlı asistanları ekleyebilir, bilgilerini ve çalışma durumlarını düzenleyebilirsiniz.
          </p>
        </div>

        <button
          onClick={onOpenAddAssistant}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Asistan Ekle</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-[1.65rem] sm:rounded-2xl bg-card border border-border shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)] space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Asistan adı, telefon, plaka veya e-posta ile ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="bg-background border border-border text-foreground text-xs font-bold rounded-xl px-3 py-2.5 outline-none"
            >
              <option value="all">Tüm Araçlar</option>
              <option value="motosiklet">🛵 Motosiklet</option>
              <option value="arac">🚗 Otomobil</option>
              <option value="bisiklet">🚲 Bisiklet</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background border border-border text-foreground text-xs font-bold rounded-xl px-3 py-2.5 outline-none"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktifler</option>
              <option value="passive">Pasifler</option>
              {pendingCount > 0 && <option value="pending">Bekleyen Başvurular ({pendingCount})</option>}
            </select>
          </div>
        </div>
      </div>

      {/* Assistants Table */}
      <div className="p-6 rounded-[1.65rem] sm:rounded-2xl bg-card border border-border shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)]">
        {filteredAssistants.length === 0 ? (
          <div className="p-8 text-center bg-background rounded-xl border border-border space-y-2">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-xs font-bold text-foreground">Kriterlere uygun asistan bulunamadı.</p>
            <p className="text-[11px] text-muted-foreground">Yeni bir asistan eklemek için yukarıdaki "Yeni Asistan Ekle" butonunu kullanabilirsiniz.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-3">Asistan Bilgisi</th>
                  <th className="py-3 px-3">İletişim</th>
                  <th className="py-3 px-3">Ulaşım / Araç</th>
                  <th className="py-3 px-3">Çalışma Durumu</th>
                  <th className="py-3 px-3">Tamamlanan Görev</th>
                  <th className="py-3 px-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredAssistants.map((assistant) => {
                  const isActive = assistant.status === 'active' || assistant.status === 'aktif' || assistant.active !== false;
                  const isPending = assistant.status === 'pending' || assistant.status === 'beklemede';

                  return (
                    <tr key={assistant.id} className="hover:bg-background/80 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                            {assistant.full_name?.charAt(0) || 'A'}
                          </div>
                          <div>
                            <div className="font-bold text-foreground text-xs">{assistant.full_name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">ID: {assistant.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-mono font-bold text-foreground">{assistant.phone}</div>
                        {assistant.email && <div className="text-[10px] text-muted-foreground">{assistant.email}</div>}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                          {assistant.vehicle_type === 'arac' ? '🚗 Otomobil' : assistant.vehicle_type === 'bisiklet' ? '🚲 Bisiklet' : '🛵 Motosiklet'}
                        </div>
                        {assistant.plate_number && (
                          <div className="text-[10px] text-muted-foreground font-mono uppercase">{assistant.plate_number}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Başvuru Beklemede
                          </span>
                        ) : (
                          <button
                            onClick={() => onToggleStatus(assistant)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border cursor-pointer transition-all ${
                              isActive
                                ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20'
                                : 'bg-red-500/10 text-red-800 dark:text-red-300 border-red-500/20 hover:bg-red-500/20'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-red-600'}`} />
                            {isActive ? 'Aktif' : 'Pasif'}
                          </button>
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-foreground">
                        {assistant.completed_orders || 0} Görev
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && onApproveApplication && (
                            <button
                              onClick={() => onApproveApplication(assistant)}
                              title="Başvuruyu Onayla"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-all"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Onayla
                            </button>
                          )}
                          {isPending && onOpenRejectModal && (
                            <button
                              onClick={() => onOpenRejectModal(assistant)}
                              title="Başvuruyu Reddet"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/20 font-bold text-xs cursor-pointer transition-all"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              Reddet
                            </button>
                          )}
                          <button
                            onClick={() => onOpenDetailAssistant(assistant)}
                            title="Detayları Gör"
                            className="p-1.5 rounded-lg bg-card hover:bg-accent/40 border border-border text-foreground cursor-pointer transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenEditAssistant(assistant)}
                            title="Düzenle"
                            className="p-1.5 rounded-lg bg-card hover:bg-accent/40 border border-border text-foreground cursor-pointer transition-all"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
