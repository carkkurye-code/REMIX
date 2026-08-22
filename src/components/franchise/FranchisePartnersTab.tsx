import React, { useState, useMemo } from 'react';
import { 
  Building2, Plus, Search, Phone, MapPin, 
  Store, CheckCircle2, XCircle, Edit3, X, Eye 
} from 'lucide-react';
import { Partner, OFFICIAL_PARTNER_CATEGORIES } from '@/lib/supabase';
import { FranchiseKPIs } from './types';

interface Props {
  partners: Partner[];
  kpis: FranchiseKPIs;
  cityNameDisplay: string;
  onOpenAddPartner: () => void;
  onOpenEditPartner: (partner: Partner) => void;
  onSelectPartner: (partner: Partner) => void;
  onTogglePartnerStatus: (partner: Partner) => void;
}

export const FranchisePartnersTab: React.FC<Props> = ({
  partners,
  kpis,
  cityNameDisplay,
  onOpenAddPartner,
  onOpenEditPartner,
  onSelectPartner,
  onTogglePartnerStatus
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const nameMatch = (p.business_name || '').toLowerCase().includes(q);
        const phoneMatch = (p.phone || '').includes(q);
        const addressMatch = (p.address || '').toLowerCase().includes(q);
        if (!nameMatch && !phoneMatch && !addressMatch) return false;
      }
      if (categoryFilter !== 'all' && p.category !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [partners, search, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            Bölge İşletmeleri & Mağazalar
          </h2>
          <p className="text-xs text-gray-400">
            {cityNameDisplay} bölgesinde UĞRA ile çalışan anlaşmalı işletmeleri yönetin ve yeni partner kaydedin.
          </p>
        </div>

        <button
          onClick={onOpenAddPartner}
          className="px-4 py-2.5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-400/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Yeni İşletme / Mağaza Ekle
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="İşletme Adı, Telefon veya Adres ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#131826] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-amber-400"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-[#131826] border border-white/10 rounded-2xl px-3 py-2.5 text-xs text-white outline-none w-full md:w-auto"
        >
          <option value="all">Tüm Kategoriler</option>
          {OFFICIAL_PARTNER_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Partners List */}
      <div className="rounded-3xl bg-[#131826] border border-white/5 overflow-hidden">
        {filteredPartners.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-xs space-y-3">
            <Store className="w-8 h-8 mx-auto text-gray-600" />
            <div className="font-bold text-gray-400">Kayıtlı işletme bulunamadı</div>
            <button
              onClick={onOpenAddPartner}
              className="px-3 py-1.5 bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-400 font-bold rounded-xl text-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              İlk İşletmeyi Ekle
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#182033] text-gray-400 text-[11px] uppercase border-b border-white/5">
                  <th className="py-3.5 px-4 font-bold">İşletme / Mağaza</th>
                  <th className="py-3.5 px-4 font-bold">Kategori</th>
                  <th className="py-3.5 px-4 font-bold">İletişim & Adres</th>
                  <th className="py-3.5 px-4 font-bold">Durum</th>
                  <th className="py-3.5 px-4 font-bold text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPartners.map((partner) => {
                  const isActive = partner.active !== false;

                  return (
                    <tr key={partner.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-xs flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black">
                            <Store className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="hover:text-amber-400 cursor-pointer" onClick={() => onSelectPartner(partner)}>
                              {partner.business_name}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono">ID: {partner.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-gray-300 text-[11px] font-medium border border-white/5">
                          {partner.category || 'Genel Ticaret'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-[240px]">
                        {partner.phone && (
                          <div className="text-gray-300 font-mono text-[11px] flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-400" />
                            {partner.phone}
                          </div>
                        )}
                        <div className="text-[11px] text-gray-400 truncate mt-0.5">
                          {partner.address || 'Adres bilgisi yok'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {isActive ? '● Açık / Aktif' : '○ Kapalı / Pasif'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectPartner(partner)}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer"
                            title="Detayları Gör"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenEditPartner(partner)}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer"
                            title="Düzenle"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onTogglePartnerStatus(partner)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                              isActive
                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {isActive ? 'Pasif' : 'Aktif'}
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
