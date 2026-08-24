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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[1.65rem] sm:rounded-2xl bg-card border border-border shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)]">
        <div>
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Finans & Bayi Hak Ediş Yönetimi
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {cityNameDisplay} bölgesine ait tamamlanan taleplerin cirosu ve sözleşmeli bayi komisyon hak ediş hesaplamaları.
          </p>
        </div>

        {/* Period Filter */}
        <div className="flex flex-wrap items-center gap-1 bg-background p-1 rounded-xl border border-border shrink-0">
          {(['today', 'week', 'month', 'custom', 'all'] as TimePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timePeriod === period
                  ? 'bg-card text-foreground shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {period === 'today' ? 'Bugün' : period === 'week' ? 'Bu Hafta' : period === 'month' ? 'Bu Ay' : period === 'custom' ? 'Özel Aralık' : 'Tümü'}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {timePeriod === 'custom' && (
        <div className="p-4 rounded-[1.65rem] sm:rounded-2xl bg-card border border-border flex flex-wrap items-center gap-3 text-xs shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)]">
          <div className="flex items-center gap-2 text-foreground font-bold">
            <Calendar className="w-4 h-4 text-primary" />
            Özel Tarih Aralığı:
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Başlangıç:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-background border border-border rounded-xl px-3 py-1.5 text-foreground outline-none font-mono focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Bitiş:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-background border border-border rounded-xl px-3 py-1.5 text-foreground outline-none font-mono focus:border-primary"
            />
          </div>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Toplam Tamamlanan Ciro */}
        <div className="p-5 rounded-[1.65rem] sm:rounded-2xl bg-card border border-border space-y-1.5 shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Tamamlanan Talep Hacmi</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-mono font-bold text-xs">
              ₺
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            ₺{kpis.completedVolume.toLocaleString('tr-TR')}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {kpis.completedOrders} başarılı tamamlanan talep
          </p>
        </div>

        {/* Sözleşme Komisyon Oranı */}
        <div className="p-5 rounded-[1.65rem] sm:rounded-2xl bg-card border border-border space-y-1.5 shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Bayi Komisyon Oranı</span>
            <div className="w-8 h-8 rounded-xl bg-background text-foreground border border-border flex items-center justify-center font-bold text-xs">
              %
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            %{kpis.revenueSharePct}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Resmi Bayilik Sözleşmesi Payı
          </p>
        </div>

        {/* Net Bayi Hak Edişi */}
        <div className="p-5 rounded-[1.65rem] sm:rounded-2xl bg-primary text-primary-foreground space-y-1.5 shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-primary-foreground/80 uppercase">Net Bayi Kazancı</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-primary-foreground">
            ₺{kpis.completedEarnings.toLocaleString('tr-TR')}
          </div>
          <p className="text-[11px] text-primary-foreground/70">
            Dönemlik net hakediş tutarı
          </p>
        </div>

        {/* Banka & IBAN Tanımı */}
        <div className="p-5 rounded-[1.65rem] sm:rounded-2xl bg-card border border-border space-y-1.5 shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Ödeme Hesabı</span>
            <CreditCard className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="text-xs font-bold text-foreground">
            {franchiseBankName || 'Ziraat Bankası'}
          </div>
          <p className="text-[10px] text-muted-foreground font-mono break-all">
            {franchiseIban || 'TR00 0000 0000 0000 0000 00'}
          </p>
        </div>
      </div>

      {/* Completed Orders Settlement List */}
      <div className="p-6 rounded-[1.65rem] sm:rounded-2xl bg-card border border-border shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)] space-y-4">
        <div>
          <h3 className="text-base font-black text-foreground">Dönemsel Hak Ediş Mutabakat Tablosu</h3>
          <p className="text-xs text-muted-foreground">
            Dönem içinde tamamlanan ve bayinize hakediş yazılan işlemler listesi
          </p>
        </div>

        {periodOrders.filter(o => ['teslim_edildi', 'delivered', 'tamamlandi'].includes(o.status)).length === 0 ? (
          <div className="p-8 text-center bg-background rounded-xl border border-border">
            <p className="text-xs font-bold text-foreground">Seçili dönemde tamamlanmış talep bulunmamaktadır.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-3">Talep No</th>
                  <th className="py-3 px-3">Tarih</th>
                  <th className="py-3 px-3">Görevli Asistan</th>
                  <th className="py-3 px-3">Toplam Tutar</th>
                  <th className="py-3 px-3">Bayi Oranı</th>
                  <th className="py-3 px-3 text-right">Bayi Hak Edişi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {periodOrders
                  .filter(o => ['teslim_edildi', 'delivered', 'tamamlandi'].includes(o.status))
                  .map(order => {
                    const price = order.total_price || 0;
                    const earning = (price * (kpis.revenueSharePct || 15)) / 100;
                    return (
                      <tr key={order.id} className="hover:bg-background/80">
                        <td className="py-3 px-3 font-mono font-bold text-foreground">#{order.id.slice(0, 8)}</td>
                        <td className="py-3 px-3 text-muted-foreground">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString('tr-TR') : '-'}
                        </td>
                        <td className="py-3 px-3 font-medium text-foreground">
                          {order.assistant_name || (order.assistant_id ? `Asistan #${order.assistant_id.slice(0, 6)}` : '-')}
                        </td>
                        <td className="py-3 px-3 font-mono text-foreground">₺{price}</td>
                        <td className="py-3 px-3 font-bold text-foreground">%{kpis.revenueSharePct}</td>
                        <td className="py-3 px-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-300">
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
