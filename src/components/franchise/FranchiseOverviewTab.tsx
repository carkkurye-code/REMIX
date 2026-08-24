import React from 'react';
import { 
  UserCheck, ShieldCheck, MapPin,
  TrendingUp, Headphones, Layers,
  Calendar, Bike, CheckCircle2,
  Clock, AlertCircle, ArrowRight, Plus, Eye
} from 'lucide-react';
import { Franchise, Assistant, Order } from '@/lib/supabase';
import { FranchiseKPIs, TimePeriod, TabType } from './types';

interface Props {
  franchise: Franchise | null;
  kpis: FranchiseKPIs;
  timePeriod: TimePeriod;
  setTimePeriod: (p: TimePeriod) => void;
  assistants: Assistant[];
  orders: Order[];
  cityNameDisplay: string;
  onNavigateTab: (tab: TabType) => void;
  onOpenAddAssistant: () => void;
  onOpenAssignAssistant: (order: Order) => void;
  onSelectOrder: (order: Order) => void;
}

export const FranchiseOverviewTab: React.FC<Props> = ({
  franchise,
  kpis,
  timePeriod,
  setTimePeriod,
  assistants,
  orders,
  cityNameDisplay,
  onNavigateTab,
  onOpenAddAssistant,
  onOpenAssignAssistant,
  onSelectOrder
}) => {
  const districts = franchise?.districts_covered || ['Tüm Merkez İlçeler'];
  const recentOrders = orders.slice(0, 8);
  const activeAssistants = assistants.filter(a => a.status === 'active' || a.status === 'aktif' || a.active !== false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'kurye_bekleniyor':
      case 'pending':
      case 'bekliyor':
        return { label: 'Asistan Bekliyor', bg: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20', icon: Clock };
      case 'kurye_atandi':
      case 'accepted':
        return { label: 'Asistan Atandı', bg: 'bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/20', icon: Bike };
      case 'yolda':
      case 'on_the_way':
        return { label: 'Yolda', bg: 'bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 border-indigo-500/20', icon: TrendingUp };
      case 'teslim_edildi':
      case 'tamamlandi':
      case 'delivered':
        return { label: 'Tamamlandı', bg: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20', icon: CheckCircle2 };
      case 'iptal':
      case 'iptal_edildi':
      case 'cancelled':
        return { label: 'İptal', bg: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertCircle };
      default:
        return { label: status, bg: 'bg-muted text-muted-foreground border-border', icon: Clock };
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Bayi & Bölge Kimlik Kartı */}
      <div className="p-6 rounded-[1.65rem] sm:rounded-2xl bg-card border border-border shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-accent/40 text-foreground font-bold text-[10px] uppercase tracking-wider border border-border">
                Yetkili Bayilik Bölgesi
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                {franchise?.status === 'active' ? 'Aktif Lisans' : 'Sözleşmeli'}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-foreground">
              {franchise?.name || `${cityNameDisplay} Bayiliği`}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-0.5">
              <span className="flex items-center gap-1 text-foreground font-medium">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <strong>Şehir:</strong> {cityNameDisplay}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                <strong>Kapsanan İlçeler:</strong> {districts.slice(0, 4).join(', ')}{districts.length > 4 ? ` +${districts.length - 4}` : ''}
              </span>
              <span>•</span>
              <span className="font-bold text-foreground">
                <strong>Sözleşme Komisyon Oranı:</strong> %{kpis.revenueSharePct || 15}
              </span>
            </div>
          </div>

          {/* Quick Action & Period Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenAddAssistant}
              className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Asistan Ekle</span>
            </button>

            <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border">
              {(['today', 'week', 'month', 'all'] as TimePeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timePeriod === period
                      ? 'bg-card text-foreground shadow-xs border border-border'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {period === 'today' ? 'Bugün' : period === 'week' ? 'Bu Hafta' : period === 'month' ? 'Bu Ay' : 'Tümü'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Temel Operasyonel Metrikler (KPI Kartları) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Toplam Bölge Talepleri */}
        <div 
          onClick={() => onNavigateTab('requests')}
          className="p-5 rounded-[1.65rem] sm:rounded-2xl bg-card border border-border hover:border-primary/60 transition-all cursor-pointer space-y-2 shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Toplam Talep Sayısı</span>
            <div className="w-8 h-8 rounded-xl bg-background border border-border flex items-center justify-center text-foreground">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {kpis.totalOrders} <span className="text-xs text-muted-foreground font-medium">Talep</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
            <span className="text-amber-700 dark:text-amber-300 font-bold">{kpis.pendingOrders} Bekleyen</span>
            <span className="text-emerald-700 dark:text-emerald-300 font-bold">{kpis.completedOrders} Tamamlanan</span>
          </div>
        </div>

        {/* Bölge Asistan Kadrosu */}
        <div 
          onClick={() => onNavigateTab('assistants')}
          className="p-5 rounded-[1.65rem] sm:rounded-2xl bg-card border border-border hover:border-primary/60 transition-all cursor-pointer space-y-2 shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Bölge Asistanları</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {activeAssistants.length} <span className="text-xs text-muted-foreground font-medium">/ {assistants.length} Aktif</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
            <span className="text-emerald-700 dark:text-emerald-300 font-bold">Sahada Göreve Hazır</span>
            <span className="text-xs text-muted-foreground">Yönet & Düzenle &rarr;</span>
          </div>
        </div>

        {/* Süreçteki / Atanan Talepler */}
        <div 
          onClick={() => onNavigateTab('requests')}
          className="p-5 rounded-[1.65rem] sm:rounded-2xl bg-card border border-border hover:border-primary/60 transition-all cursor-pointer space-y-2 shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Asistan Üzerindeki Görevler</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-700 dark:text-blue-300">
              <Bike className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700 dark:text-blue-300">
            {kpis.inProgressOrders} <span className="text-xs text-muted-foreground font-medium">Aktif Süreçte</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
            <span className="text-muted-foreground">Canlı takip</span>
            <span className="text-blue-700 dark:text-blue-300 font-bold">Detay &rarr;</span>
          </div>
        </div>

        {/* Bayi Net Hak Ediş */}
        <div 
          onClick={() => onNavigateTab('finance')}
          className="p-5 rounded-[1.65rem] sm:rounded-2xl bg-card border border-border hover:border-primary/60 transition-all cursor-pointer space-y-2 shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Bayi Hak Ediş Kazancı</span>
            <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-mono font-bold text-xs">
              ₺
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            ₺{kpis.completedEarnings.toLocaleString('tr-TR')}
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
            <span className="text-muted-foreground">Toplam Hacim: ₺{kpis.completedVolume.toLocaleString('tr-TR')}</span>
            <span className="text-emerald-700 dark:text-emerald-300 font-bold">%{kpis.revenueSharePct} Pay</span>
          </div>
        </div>
      </div>

      {/* 3. Canlı Son Talepler ve Asistan Atamaları */}
      <div className="p-6 rounded-[1.65rem] sm:rounded-2xl bg-card border border-border shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h2 className="text-base font-black text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Bölgedeki Son Talepler & Asistan Durumu
            </h2>
            <p className="text-xs text-muted-foreground">
              {cityNameDisplay} bölgesine düşen anlık müşteri talepleri ve atanan asistanlar ({orders.length} toplam talep)
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('requests')}
            className="text-xs font-bold text-foreground hover:text-primary flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            Tüm Talepleri Gör ({orders.length})
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center bg-background rounded-xl border border-border space-y-2">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-xs font-bold text-foreground">Henüz bölgenizde kayıtlı talep bulunmamaktadır.</p>
            <p className="text-[11px] text-muted-foreground">Yeni müşteri talepleri geldiğinde bu ekranda anlık olarak listelenecektir.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-2.5 px-3">Talep No / Tarih</th>
                  <th className="py-2.5 px-3">Müşteri & Adres</th>
                  <th className="py-2.5 px-3">Atanan Asistan</th>
                  <th className="py-2.5 px-3">Tutar</th>
                  <th className="py-2.5 px-3">Durum</th>
                  <th className="py-2.5 px-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {recentOrders.map(order => {
                  const statusObj = getStatusBadge(order.status);
                  const isAssigned = !!order.assistant_id || !!order.assistant_name;

                  return (
                    <tr key={order.id} className="hover:bg-background/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-foreground">#{order.id.slice(0, 8)}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {order.created_at ? new Date(order.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-foreground">{order.customer_name || 'Misafir Müşteri'}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1 max-w-xs">
                          {order.delivery_address || order.customer_address || '-'}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {isAssigned ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 font-bold text-xs">
                            <Bike className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{order.assistant_name || `Asistan #${order.assistant_id?.slice(0, 6)}`}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => onOpenAssignAssistant(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 font-bold text-xs cursor-pointer transition-all"
                          >
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Asistan Ata</span>
                          </button>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-foreground">
                        ₺{order.total_price || 0}
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusObj.bg}`}>
                          <statusObj.icon className="w-3 h-3" />
                          {statusObj.label}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onSelectOrder(order)}
                          className="px-2.5 py-1.5 rounded-lg bg-card hover:bg-accent/40 border border-border text-foreground font-bold text-[11px] cursor-pointer transition-all inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>İncele</span>
                        </button>
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
