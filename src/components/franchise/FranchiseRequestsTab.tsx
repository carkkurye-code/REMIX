import React, { useState, useMemo } from 'react';
import { 
  Search, Bike, CheckCircle2, Clock, 
  AlertTriangle, Filter, MapPin, 
  Phone, User, ArrowRight, X, AlertCircle, Eye, RefreshCw
} from 'lucide-react';
import { Order, OrderStatus } from '@/lib/supabase';
import { FranchiseKPIs } from './types';

interface Props {
  orders: Order[];
  kpis: FranchiseKPIs;
  cityNameDisplay: string;
  onSelectOrder: (order: Order) => void;
  onOpenAssignModal: (order: Order) => void;
  onOpenCancelModal?: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  actionLoading: boolean;
}

export const FranchiseRequestsTab: React.FC<Props> = ({
  orders,
  kpis,
  cityNameDisplay,
  onSelectOrder,
  onOpenAssignModal,
  onOpenCancelModal,
  onUpdateStatus,
  actionLoading
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Search filter
      const q = search.toLowerCase().trim();
      if (q) {
        const idMatch = o.id.toLowerCase().includes(q);
        const nameMatch = (o.customer_name || '').toLowerCase().includes(q);
        const phoneMatch = (o.customer_phone || '').includes(q);
        const addressMatch = (o.delivery_address || o.customer_address || '').toLowerCase().includes(q);
        const typeMatch = (o.service_type || '').toLowerCase().includes(q);
        const descMatch = (o.task_description || o.delivery_notes || o.notes || '').toLowerCase().includes(q);
        const assistantMatch = (o.assistant_name || '').toLowerCase().includes(q);
        if (!idMatch && !nameMatch && !phoneMatch && !addressMatch && !typeMatch && !descMatch && !assistantMatch) {
          return false;
        }
      }

      // Status filter
      if (statusFilter === 'all') return true;
      if (statusFilter === 'pending') {
        return ['kurye_bekleniyor', 'pending', 'beklemede', 'bekliyor'].includes(o.status);
      }
      if (statusFilter === 'assigned') {
        return ['kurye_atandi', 'accepted'].includes(o.status);
      }
      if (statusFilter === 'in_progress') {
        return ['hazirlaniyor', 'yolda', 'in_progress', 'on_the_way'].includes(o.status);
      }
      if (statusFilter === 'completed') {
        return ['teslim_edildi', 'delivered', 'tamamlandi'].includes(o.status);
      }
      if (statusFilter === 'cancelled') {
        return ['iptal', 'iptal_edildi', 'cancelled'].includes(o.status);
      }

      return o.status === statusFilter;
    });
  }, [orders, search, statusFilter]);

  const countByFilter = (filterKey: string) => {
    if (filterKey === 'all') return orders.length;
    if (filterKey === 'pending') {
      return orders.filter(o => ['kurye_bekleniyor', 'pending', 'beklemede', 'bekliyor'].includes(o.status)).length;
    }
    if (filterKey === 'assigned') {
      return orders.filter(o => ['kurye_atandi', 'accepted'].includes(o.status)).length;
    }
    if (filterKey === 'in_progress') {
      return orders.filter(o => ['hazirlaniyor', 'yolda', 'in_progress', 'on_the_way'].includes(o.status)).length;
    }
    if (filterKey === 'completed') {
      return orders.filter(o => ['teslim_edildi', 'delivered', 'tamamlandi'].includes(o.status)).length;
    }
    if (filterKey === 'cancelled') {
      return orders.filter(o => ['iptal', 'iptal_edildi', 'cancelled'].includes(o.status)).length;
    }
    return 0;
  };

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
        return { label: 'Yolda', bg: 'bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 border-indigo-500/20', icon: Bike };
      case 'hazirlaniyor':
      case 'preparing':
        return { label: 'Hazırlanıyor', bg: 'bg-purple-500/10 text-purple-800 dark:text-purple-300 border-purple-500/20', icon: RefreshCw };
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[1.65rem] sm:rounded-2xl bg-card border border-border shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <Bike className="w-5 h-5 text-primary" />
              Bölgesel Talep & Görev Yönetimi
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent/40 text-foreground border border-border">
              Toplam {orders.length} Talep
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {cityNameDisplay} bölgesine gelen tüm talepleri inceleyin, bölgenizdeki asistanlara atayın ve operasyonu takip edin.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Count Badges */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-[1.65rem] sm:rounded-2xl bg-card border border-border shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)]">
        {[
          { key: 'all', label: 'Tüm Talepler' },
          { key: 'pending', label: 'Asistan Bekleyen' },
          { key: 'assigned', label: 'Asistan Atandı' },
          { key: 'in_progress', label: 'Süreçte / Yolda' },
          { key: 'completed', label: 'Tamamlanan' },
          { key: 'cancelled', label: 'İptal Edilen' },
        ].map(tab => {
          const count = countByFilter(tab.key);
          const isSelected = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background border border-border text-foreground'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-[1.65rem] sm:rounded-2xl bg-card border border-border shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Talep no, müşteri adı, telefon, adres veya atanan asistan adı ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground transition-all"
          />
        </div>
      </div>

      {/* Orders List Table */}
      <div className="p-6 rounded-[1.65rem] sm:rounded-2xl bg-card border border-border shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)]">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center bg-background rounded-xl border border-border space-y-2">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-xs font-bold text-foreground">Filtreye uygun talep bulunamadı.</p>
            <p className="text-[11px] text-muted-foreground">Farklı bir arama terimi veya filtre seçmeyi deneyin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-3">Talep No / Tarih</th>
                  <th className="py-3 px-3">Müşteri & İletişim</th>
                  <th className="py-3 px-3">Adres / Görev Açıklaması</th>
                  <th className="py-3 px-3">Atanan Asistan</th>
                  <th className="py-3 px-3">Tutar</th>
                  <th className="py-3 px-3">Durum</th>
                  <th className="py-3 px-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredOrders.map(order => {
                  const statusObj = getStatusBadge(order.status);
                  const isAssigned = !!order.assistant_id || !!order.assistant_name;

                  return (
                    <tr key={order.id} className="hover:bg-background/80 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-mono font-bold text-foreground">#{order.id.slice(0, 8)}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {order.created_at ? new Date(order.created_at).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-bold text-foreground">{order.customer_name || 'Misafir Müşteri'}</div>
                        {order.customer_phone && (
                          <div className="text-[10px] text-muted-foreground font-mono">{order.customer_phone}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 max-w-xs">
                        <div className="text-[11px] font-medium text-foreground line-clamp-1">
                          📍 {order.delivery_address || order.customer_address || 'Adres belirtilmedi'}
                        </div>
                        {order.task_description && (
                          <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                            📝 {order.task_description}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        {isAssigned ? (
                          <div className="flex items-center gap-1.5">
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 font-bold text-xs">
                              <Bike className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{order.assistant_name || `Asistan #${order.assistant_id?.slice(0, 6)}`}</span>
                            </div>
                            <button
                              onClick={() => onOpenAssignModal(order)}
                              title="Asistanı Değiştir"
                              className="p-1 rounded-md bg-card hover:bg-accent/40 border border-border text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onOpenAssignModal(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 font-bold text-xs cursor-pointer transition-all"
                          >
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Asistan Ata</span>
                          </button>
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-foreground">
                        ₺{order.total_price || 0}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusObj.bg}`}>
                          <statusObj.icon className="w-3 h-3" />
                          {statusObj.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectOrder(order)}
                            title="Talebi İncele"
                            className="px-2.5 py-1.5 rounded-lg bg-card hover:bg-accent/40 border border-border text-foreground font-bold text-[11px] cursor-pointer transition-all inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detay</span>
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
