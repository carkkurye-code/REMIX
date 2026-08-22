import React from 'react';
import { 
  Building2, DollarSign, 
  CheckCircle2, ArrowRight, ShieldCheck, MapPin,
  TrendingUp, Headphones, FileSpreadsheet, Store,
  Calendar, Layers
} from 'lucide-react';
import { Franchise, Partner } from '@/lib/supabase';
import { FranchiseKPIs, TimePeriod, TabType } from './types';

interface Props {
  franchise: Franchise | null;
  kpis: FranchiseKPIs;
  timePeriod: TimePeriod;
  setTimePeriod: (p: TimePeriod) => void;
  partners: Partner[];
  cityNameDisplay: string;
  onNavigateTab: (tab: TabType) => void;
  onOpenAddPartner: () => void;
}

export const FranchiseOverviewTab: React.FC<Props> = ({
  franchise,
  kpis,
  timePeriod,
  setTimePeriod,
  partners,
  cityNameDisplay,
  onNavigateTab,
  onOpenAddPartner
}) => {
  const recentPartners = partners.slice(0, 5);
  const districts = franchise?.districts_covered || ['Tüm Merkez İlçeler'];

  return (
    <div className="space-y-6">
      {/* 1. Bayi & Bölge Kimlik Kartı */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#1A2133] via-[#131826] to-[#131826] border border-white/10 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-400/10 text-amber-400 font-extrabold text-[10px] uppercase tracking-wider border border-amber-400/20">
                Yetkili Bayilik Bölgesi
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                {franchise?.status === 'active' ? 'Aktif Bayi' : 'Sözleşmeli'}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white">
              {franchise?.name || `${cityNameDisplay} Bayiliği`}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 pt-1">
              <span className="flex items-center gap-1 text-gray-300">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <strong>Şehir:</strong> {cityNameDisplay}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-gray-300">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <strong>Kapsanan İlçeler:</strong> {districts.slice(0, 4).join(', ')}{districts.length > 4 ? ` +${districts.length - 4}` : ''}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <strong>Sözleşme Komisyon Oranı:</strong> %{kpis.revenueSharePct}
              </span>
            </div>
          </div>

          {/* Dönem Seçimi */}
          <div className="flex items-center gap-1 bg-[#0F131E] p-1.5 rounded-2xl border border-white/5 shrink-0 self-start md:self-center">
            <span className="text-[11px] font-bold text-gray-400 px-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Dönem:
            </span>
            {(['today', 'week', 'month', 'all'] as TimePeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timePeriod === period
                    ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20 font-extrabold'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {period === 'today' ? 'Bugün' : period === 'week' ? 'Bu Hafta' : period === 'month' ? 'Bu Ay' : 'Tümü'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Temel Finans ve Hacim Metrikleri */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Dönemsel Toplam Hacim */}
        <div className="p-5 rounded-3xl bg-[#131826] border border-white/5 hover:border-white/10 transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dönemsel Toplam Hacim</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ₺{kpis.totalVolume.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-gray-400">
            Bölgenizdeki tüm ticari işlem hacmi
          </div>
        </div>

        {/* Tamamlanan Hacim */}
        <div className="p-5 rounded-3xl bg-[#131826] border border-white/5 hover:border-white/10 transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tamamlanan Hacim</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            ₺{kpis.completedVolume.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-gray-400">
            {kpis.completedOrders} başarılı tamamlanan işlem
          </div>
        </div>

        {/* Bayi Komisyon Oranı */}
        <div className="p-5 rounded-3xl bg-[#131826] border border-white/5 hover:border-white/10 transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bayi Komisyon Oranı</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono">
            %{kpis.revenueSharePct}
          </div>
          <div className="text-[11px] text-gray-400">
            Sözleşmeye bağlı resmi bayi payı
          </div>
        </div>

        {/* Bayi Net Hak Edişi */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/20 via-[#131826] to-[#131826] border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Bayi Net Hak Edişi</span>
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 flex items-center justify-center text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            ₺{kpis.franchiseEarnings.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-amber-200/80">
            Tamamlanan: ₺{kpis.completedEarnings.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* 3. Bölgesel İşletme & Destek Özet Satırı */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* İşletme Özeti */}
        <div className="p-5 rounded-3xl bg-[#131826] border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Bölge İşletmeleri</div>
              <div className="text-xl font-black text-white mt-0.5">
                {kpis.activePartners} Aktif <span className="text-xs text-gray-400 font-normal">/ {kpis.totalPartners} Kayıtlı</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                {cityNameDisplay} sınırları içerisindeki üye işyerleri
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('partners')}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs cursor-pointer flex items-center gap-1 transition-colors"
          >
            İşletmeleri Gör
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Genel Merkez Destek & İletişim */}
        <div className="p-5 rounded-3xl bg-[#131826] border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Genel Merkez İletişimi</div>
              <div className="text-xl font-black text-white mt-0.5">
                {kpis.openTicketsCount > 0 ? (
                  <span className="text-amber-400">{kpis.openTicketsCount} Açık Talep</span>
                ) : (
                  <span className="text-emerald-400">Tüm Talepler Yanıtlandı</span>
                )}
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                Finans, onay, sözleşme ve operasyonel destek
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('support')}
            className="px-3.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold text-xs cursor-pointer flex items-center gap-1 transition-colors"
          >
            Destek Modülü
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Modül Kısayolları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigateTab('partners')}
          className="p-4 rounded-2xl bg-[#1A2133] hover:bg-[#20283E] border border-white/5 text-left flex items-center justify-between cursor-pointer group transition-all"
        >
          <div>
            <div className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors">Bölge İşletmeleri</div>
            <div className="text-[11px] text-gray-400">İşletme listesi & yeni kayıt</div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
        </button>

        <button
          onClick={() => onNavigateTab('finance')}
          className="p-4 rounded-2xl bg-[#1A2133] hover:bg-[#20283E] border border-white/5 text-left flex items-center justify-between cursor-pointer group transition-all"
        >
          <div>
            <div className="text-xs font-black text-white group-hover:text-amber-400 transition-colors">Finans & Hak Ediş</div>
            <div className="text-[11px] text-gray-400">Detaylı hakediş hesapları</div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
        </button>

        <button
          onClick={() => onNavigateTab('reports')}
          className="p-4 rounded-2xl bg-[#1A2133] hover:bg-[#20283E] border border-white/5 text-left flex items-center justify-between cursor-pointer group transition-all"
        >
          <div>
            <div className="text-xs font-black text-white group-hover:text-purple-400 transition-colors">Raporlar & Çıktılar</div>
            <div className="text-[11px] text-gray-400">CSV, XLSX ve PDF raporlar</div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
        </button>

        <button
          onClick={() => onNavigateTab('settings')}
          className="p-4 rounded-2xl bg-[#1A2133] hover:bg-[#20283E] border border-white/5 text-left flex items-center justify-between cursor-pointer group transition-all"
        >
          <div>
            <div className="text-xs font-black text-white group-hover:text-blue-400 transition-colors">Bayi Bilgileri</div>
            <div className="text-[11px] text-gray-400">Resmi bayi profili & IBAN</div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

      {/* 5. Bölgedeki Son Eklenen İşletmeler Listesi */}
      <div className="rounded-3xl bg-[#131826] border border-white/5 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-white">Bölgedeki Son İşletmeler</h3>
            <p className="text-xs text-gray-400">{cityNameDisplay} bölgesinde kayıtlı mağaza ve partnerler</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddPartner}
              className="px-3 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-xs cursor-pointer transition-colors"
            >
              + Yeni İşletme Ekle
            </button>
            <button
              onClick={() => onNavigateTab('partners')}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold text-xs cursor-pointer transition-colors"
            >
              Tümünü Gör ({partners.length})
            </button>
          </div>
        </div>

        {recentPartners.length === 0 ? (
          <div className="py-10 text-center text-gray-500 text-xs">
            Bölgenizde henüz kayıtlı işletme bulunmamaktadır.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-gray-400 text-[11px] uppercase">
                  <th className="pb-3 font-bold">İşletme Adı</th>
                  <th className="pb-3 font-bold">Kategori</th>
                  <th className="pb-3 font-bold">Telefon</th>
                  <th className="pb-3 font-bold">İlçe / Adres</th>
                  <th className="pb-3 font-bold">Durum</th>
                  <th className="pb-3 font-bold text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentPartners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 font-bold text-white">
                      {partner.business_name}
                    </td>
                    <td className="py-3 text-gray-300">
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-gray-300 text-[11px]">
                        {partner.category || 'Genel'}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-gray-300">
                      {partner.phone || '-'}
                    </td>
                    <td className="py-3 text-gray-400 max-w-[220px] truncate">
                      {partner.address || '-'}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        partner.active !== false
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {partner.active !== false ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onNavigateTab('partners')}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold text-[11px] cursor-pointer"
                      >
                        Yönet
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
