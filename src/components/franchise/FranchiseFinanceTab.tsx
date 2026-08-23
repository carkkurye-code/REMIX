import React from 'react';
import { 
  DollarSign, CheckCircle2, 
  TrendingUp, Calendar, ShieldCheck, CreditCard,
  AlertCircle, FileText
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs">
        <div>
          <h2 className="text-lg font-black text-[#111111] flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#111111]" />
            Finans & Bayi Hak Ediş Yönetimi
          </h2>
          <p className="text-xs text-[#666666] mt-0.5">
            {cityNameDisplay} bölgesine ait tamamlanan taleplerin cirosu ve sözleşmeli bayi komisyon hak ediş hesaplamaları.
          </p>
        </div>

        {/* Period Filter */}
        <div className="flex flex-wrap items-center gap-1 bg-[#F7F7F8] p-1 rounded-xl border border-[#E5E7EB] shrink-0">
          {(['today', 'week', 'month', 'custom', 'all'] as TimePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timePeriod === period
                  ? 'bg-white text-[#111111] shadow-xs border border-[#E5E7EB]'
                  : 'text-[#666666] hover:text-[#111111]'
              }`}
            >
              {period === 'today' ? 'Bugün' : period === 'week' ? 'Bu Hafta' : period === 'month' ? 'Bu Ay' : period === 'custom' ? 'Özel Aralık' : 'Tümü'}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {timePeriod === 'custom' && (
        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] flex flex-wrap items-center gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2 text-[#111111] font-bold">
            <Calendar className="w-4 h-4" />
            Özel Tarih Aralığı:
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#666666]">Başlangıç:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-[#F7F7F8] border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-[#111111] outline-none font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#666666]">Bitiş:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-[#F7F7F8] border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-[#111111] outline-none font-mono"
            />
          </div>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Toplam Tamamlanan Ciro */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#666666] uppercase">Tamamlanan Talep Hacmi</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-mono font-bold text-xs">
              ₺
            </div>
          </div>
          <div className="text-2xl font-black text-[#111111]">
            ₺{kpis.completedVolume.toLocaleString('tr-TR')}
          </div>
          <p className="text-[11px] text-[#666666]">
            {kpis.completedOrders} başarılı tamamlanan talep
          </p>
        </div>

        {/* Sözleşme Komisyon Oranı */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#666666] uppercase">Bayi Komisyon Oranı</span>
            <div className="w-8 h-8 rounded-xl bg-[#F7F7F8] text-[#111111] border border-[#E5E7EB] flex items-center justify-center font-bold text-xs">
              %
            </div>
          </div>
          <div className="text-2xl font-black text-[#111111]">
            %{kpis.revenueSharePct}
          </div>
          <p className="text-[11px] text-[#666666]">
            Resmi Bayilik Sözleşmesi Payı
          </p>
        </div>

        {/* Net Bayi Hak Edişi */}
        <div className="p-5 rounded-2xl bg-[#111111] text-white space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-300 uppercase">Net Bayi Kazancı</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            ₺{kpis.completedEarnings.toLocaleString('tr-TR')}
          </div>
          <p className="text-[11px] text-gray-400">
            Dönemlik net hakediş tutarı
          </p>
        </div>

        {/* Banka & IBAN Tanımı */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#666666] uppercase">Ödeme Hesabı</span>
            <CreditCard className="w-5 h-5 text-[#666666]" />
          </div>
          <div className="text-xs font-bold text-[#111111]">
            {franchiseBankName || 'Ziraat Bankası'}
          </div>
          <p className="text-[10px] text-[#666666] font-mono break-all">
            {franchiseIban || 'TR00 0000 0000 0000 0000 0000 00'}
          </p>
        </div>
      </div>

      {/* Completed Orders Settlement List */}
      <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-black text-[#111111]">Dönemsel Hak Ediş Mutabakat Tablosu</h3>
          <p className="text-xs text-[#666666]">
            Dönem içinde tamamlanan ve bayinize hakediş yazılan işlemler listesi
          </p>
        </div>

        {periodOrders.filter(o => ['teslim_edildi', 'delivered', 'tamamlandi'].includes(o.status)).length === 0 ? (
          <div className="p-8 text-center bg-[#F7F7F8] rounded-xl border border-[#E5E7EB]">
            <p className="text-xs font-bold text-[#111111]">Seçili dönemde tamamlanmış talep bulunmamaktadır.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#666666] uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-3">Talep No</th>
                  <th className="py-3 px-3">Tarih</th>
                  <th className="py-3 px-3">Görevli Asistan</th>
                  <th className="py-3 px-3">Toplam Tutar</th>
                  <th className="py-3 px-3">Bayi Oranı</th>
                  <th className="py-3 px-3 text-right">Bayi Hak Edişi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2F3]">
                {periodOrders
                  .filter(o => ['teslim_edildi', 'delivered', 'tamamlandi'].includes(o.status))
                  .map(order => {
                    const price = order.total_price || 0;
                    const earning = (price * (kpis.revenueSharePct || 15)) / 100;
                    return (
                      <tr key={order.id} className="hover:bg-[#F7F7F8]">
                        <td className="py-3 px-3 font-mono font-bold text-[#111111]">#{order.id.slice(0, 8)}</td>
                        <td className="py-3 px-3 text-[#666666]">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString('tr-TR') : '-'}
                        </td>
                        <td className="py-3 px-3 font-medium text-[#111111]">
                          {order.assistant_name || (order.assistant_id ? `Asistan #${order.assistant_id.slice(0, 6)}` : '-')}
                        </td>
                        <td className="py-3 px-3 font-mono text-[#111111]">₺{price}</td>
                        <td className="py-3 px-3 font-bold text-[#111111]">%{kpis.revenueSharePct}</td>
                        <td className="py-3 px-3 text-right font-mono font-black text-emerald-700">
                          +₺{earning.toFixed(2)}
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
