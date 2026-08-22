import React, { useState } from 'react';
import { 
  Users, UserCheck, UserX, Bike, Car, Phone, 
  Search, ShieldCheck, Clock, CheckCircle2, AlertCircle, X 
} from 'lucide-react';
import { Assistant } from '@/lib/supabase';
import { FranchiseKPIs } from './types';

interface Props {
  assistants: Assistant[];
  kpis: FranchiseKPIs;
  cityNameDisplay: string;
  onToggleStatus: (assistant: Assistant) => void;
  onApproveApplication: (assistant: Assistant) => void;
  onOpenRejectModal: (assistant: Assistant) => void;
}

export const FranchiseAssistantsTab: React.FC<Props> = ({
  assistants,
  kpis,
  cityNameDisplay,
  onToggleStatus,
  onApproveApplication,
  onOpenRejectModal
}) => {
  const [subTab, setSubTab] = useState<'active' | 'pending'>('active');
  const [search, setSearch] = useState('');

  const pendingList = assistants.filter(a => a.status === 'pending' || (a.status as string) === 'beklemede');
  const activeList = assistants.filter(a => a.status !== 'pending' && (a.status as string) !== 'beklemede' && a.status !== 'rejected');

  const displayedList = (subTab === 'active' ? activeList : pendingList).filter(a => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (a.full_name || '').toLowerCase().includes(q) ||
      (a.phone || '').includes(q) ||
      (a.vehicle_type || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Bölge Asistanları & Kurye Kadrosu
          </h2>
          <p className="text-xs text-gray-400">
            {cityNameDisplay} bölgesine bağlı asistanların görev durumunu yönetin ve yeni başvuruları değerlendirin.
          </p>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex items-center bg-[#131826] p-1 rounded-2xl border border-white/5">
          <button
            onClick={() => setSubTab('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              subTab === 'active'
                ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Kayıtlı Asistanlar</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/20 text-current font-black">
              {activeList.length}
            </span>
          </button>

          <button
            onClick={() => setSubTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              subTab === 'pending'
                ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Bekleyen Başvurular</span>
            {pendingList.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-black animate-pulse">
                {pendingList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search & List */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Asistan Adı, Telefon veya Araç Tipi ile filtrele..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#131826] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-amber-400"
          />
        </div>

        <div className="rounded-3xl bg-[#131826] border border-white/5 overflow-hidden">
          {displayedList.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-xs space-y-2">
              <Users className="w-8 h-8 mx-auto text-gray-600" />
              <div className="font-bold text-gray-400">
                {subTab === 'active' ? 'Kayıtlı asistan bulunamadı' : 'Bekleyen asistan başvurusu bulunmuyor'}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#182033] text-gray-400 text-[11px] uppercase border-b border-white/5">
                    <th className="py-3.5 px-4 font-bold">Asistan Bilgisi</th>
                    <th className="py-3.5 px-4 font-bold">İletişim</th>
                    <th className="py-3.5 px-4 font-bold">Ulaşım / Araç</th>
                    <th className="py-3.5 px-4 font-bold">Durum</th>
                    <th className="py-3.5 px-4 font-bold text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {displayedList.map((assistant) => {
                    const isActive = assistant.status === 'aktif' || assistant.status === 'active' || assistant.active !== false;
                    const isPending = assistant.status === 'pending' || (assistant.status as string) === 'beklemede';

                    return (
                      <tr key={assistant.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-xs flex items-center gap-2">
                            <div className="w-7 h-7 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-400 font-black text-xs">
                              {assistant.full_name?.charAt(0) || 'A'}
                            </div>
                            <div>
                              <div>{assistant.full_name}</div>
                              <div className="text-[10px] text-gray-400 font-mono">ID: {assistant.id.slice(0, 8)}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-gray-300 font-mono flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-emerald-400" />
                            {assistant.phone || 'Telefon yok'}
                          </div>
                          {assistant.email && (
                            <div className="text-[10px] text-gray-500">{assistant.email}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-gray-300 flex items-center gap-1.5 font-medium">
                            <Bike className="w-3.5 h-3.5 text-blue-400" />
                            {assistant.vehicle_type || 'Motosiklet'}
                          </div>
                          {assistant.plate_number && (
                            <div className="text-[10px] text-gray-400 font-mono uppercase">{assistant.plate_number}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {isPending ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                              Onay Bekliyor
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                            }`}>
                              {isActive ? '● Aktif Görevde' : '○ Pasif'}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => onApproveApplication(assistant)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-xs cursor-pointer transition-all"
                              >
                                Onayla
                              </button>
                              <button
                                onClick={() => onOpenRejectModal(assistant)}
                                className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs cursor-pointer transition-all"
                              >
                                Reddet
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => onToggleStatus(assistant)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                                isActive
                                  ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                              }`}
                            >
                              {isActive ? 'Pasife Al' : 'Aktif Et'}
                            </button>
                          )}
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
    </div>
  );
};
