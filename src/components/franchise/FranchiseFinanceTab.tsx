import React, { useState } from 'react';
import { 
  DollarSign, Percent, ArrowUpRight, CheckCircle2, 
  TrendingUp, Calendar, ShieldCheck, Building2, CreditCard,
  Lock, AlertCircle, FileText
} from 'lucide-react';
import { Order, AssistantSubscription, Franchise } from '@/lib/supabase';
import { FranchiseKPIs, TimePeriod } from './types';

interface Props {
  kpis: FranchiseKPIs;
  timePeriod: TimePeriod;
  setTimePeriod: (p: TimePeriod) => void;
  customStartDate: string;
  setCustomStartDate: (d: string) => void;
  customEndDate: string;
  setCustomEndDate: (d: string) => void;
  periodOrders: Order[];
  subscriptions: AssistantSubscription[];
  cityNameDisplay: string;
  franchiseIban?: string;
  franchiseBankName?: string;
  franchise?: Franchise | null;
}

export const FranchiseFinanceTab: React.FC<Props> = ({
  kpis,
  timePeriod,
  setTimePeriod,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  periodOrders,
  subscriptions,
  cityNameDisplay,
  franchiseIban,
  franchiseBankName,
  franchise
}) => {
  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            Finans & Bayi Hak Ediş Yönetimi
          </h2>
          <p className="text-xs text-gray-400">
            {cityNameDisplay} bölgesine ait ticari işlem hacimleri ve sözleşmeli bayi komisyon hak ediş hesaplamaları.
          </p>
        </div>

        {/* Period Filter */}
        <div className="flex flex-wrap items-center gap-1 bg-[#131826] p-1 rounded-2xl border border-white/5 shrink-0">
          {(['today', 'week', 'month', 'custom', 'all'] as TimePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timePeriod === period
                  ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20 font-extrabold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {period === 'today' ? 'Bugün' : period === 'week' ? 'Bu Hafta' : period === 'month' ? 'Bu Ay' : period === 'custom' ? 'Özel Aralık' : 'Tüm Zamanlar'}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {timePeriod === 'custom' && (
        <div className="p-4 rounded-2xl bg-[#1A2133] border border-amber-400/30 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-300 font-bold">
            <Calendar className="w-4 h-4" />
            Özel Tarih Aralığı:
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Başlangıç:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-[#131826] border border-white/10 rounded-xl px-3 py-1.5 text-white outline-none focus:border-amber-400 font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Bitiş:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-[#131826] border border-white/10 rounded-xl px-3 py-1.5 text-white outline-none focus:border-amber-400 font-mono"
            />
          </div>
        </div>
      )}

      {/* Main 4 Financial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Toplam Dönem Hacmi */}
        <div className="p-5 rounded-3xl bg-[#131826] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400 font-bold">
            <span>Toplam Dönem Hacmi</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ₺{kpis.totalVolume.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-gray-400">
            Dönem içindeki toplam {kpis.totalOrders} talep teklifi
          </div>
        </div>

        {/* Tamamlanan Hacim */}
        <div className="p-5 rounded-3xl bg-[#131826] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400 font-bold">
            <span>Tamamlanan Hacim</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            ₺{kpis.completedVolume.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-gray-400">
            {kpis.completedOrders} tamamlanmış operasyon
          </div>
        </div>

        {/* Bayi Komisyon Oranı */}
        <div className="p-5 rounded-3xl bg-[#131826] border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400 font-bold">
            <span>Bayi Komisyon Oranı</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Percent className="w-4 h-4" />
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
          <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
            <span>Bayi Net Hak Edişi</span>
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 flex items-center justify-center text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            ₺{kpis.franchiseEarnings.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-gray-300">
            Tamamlanan: <strong>₺{kpis.completedEarnings.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>
      </div>

      {/* Secondary Row: Payout & Bank Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Talep Finans Dağılımı */}
        <div className="p-5 rounded-3xl bg-[#131826] border border-white/5 space-y-4">
          <h3 className="text-sm font-black text-white">Talep Operasyon Finans Özeti</h3>
          
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#1A2133]">
              <span className="text-gray-300">Tamamlanan Talepler Hacmi</span>
              <span className="font-mono font-bold text-emerald-400">
                ₺{kpis.completedVolume.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#1A2133]">
              <span className="text-gray-300">İptal Edilen Talepler Hacmi</span>
              <span className="font-mono font-bold text-red-400">
                ₺{periodOrders
                  .filter(o => o.status === 'iptal_edildi' || o.status === 'cancelled')
                  .reduce((s, o) => s + (Number(o.total_price) || 0), 0)
                  .toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#1A2133]">
              <span className="text-gray-300">Süreçteki Talepler Hacmi</span>
              <span className="font-mono font-bold text-amber-400">
                ₺{periodOrders
                  .filter(o => ['hazirlaniyor', 'yolda', 'kurye_atandi'].includes(o.status))
                  .reduce((s, o) => s + (Number(o.total_price) || 0), 0)
                  .toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Banka & Hak Ediş Ödeme Hesabı */}
        <div className="p-5 rounded-3xl bg-[#131826] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              Hak Ediş Ödeme & IBAN Bilgisi
            </h3>
            <span className="text-[10px] text-gray-400 font-mono bg-white/5 px-2 py-0.5 rounded">
              Salt Okunur
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Resmi Bayi Hesabı</span>
              <span className="text-xs font-black text-white">{franchiseBankName || franchise?.bank_name || 'Ziraat Bankası'}</span>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] text-gray-400">IBAN Numarası</div>
              <div className="font-mono text-sm font-black text-amber-300 tracking-wider">
                {franchiseIban || franchise?.iban || 'TR00 0000 0000 0000 0000 0000 00'}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/10">
              <span className="text-gray-400">Hesap Sahibi / Unvan:</span>
              <span className="font-bold text-white">{franchise?.company_title || franchise?.name || `${cityNameDisplay} Bayiliği`}</span>
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 flex items-start gap-2">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Bayi komisyon oranları ve hak ediş tutarları UĞRA Genel Merkez sözleşmesi ile belirlenir. Bayi yöneticisi tarafından düzenlenemez.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
