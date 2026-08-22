import React, { useState, useMemo } from 'react';
import { 
  Search, ShoppingBag, Bike, CheckCircle2, Clock, 
  AlertTriangle, Filter, ChevronRight, MapPin, 
  Phone, User, ArrowRight, X, Sparkles, Navigation
} from 'lucide-react';
import { Order, OrderStatus } from '@/lib/supabase';
import { FranchiseKPIs } from './types';

interface Props {
  orders: Order[];
  kpis: FranchiseKPIs;
  cityNameDisplay: string;
  onSelectOrder: (order: Order) => void;
  onOpenAssignModal: (order: Order) => void;
  onOpenCancelModal: (order: Order) => void;
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

  return (
    <div className="space-y-6">
      {/* Header & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            Canlı Talepler / Operasyon Yönetimi
          </h2>
          <p className="text-xs text-gray-400">
            {cityNameDisplay} bölgesindeki tüm asistanlık ve teslimat taleplerini anlık takip edin, asistan atayın ve operasyon durumunu yönetin.
          </p>
        </div>

        {/* Quick Mini Stats */}
        <div className="flex items-center gap-2 bg-[#131826] p-1.5 rounded-2xl border border-white/5 text-xs font-bold">
          <div className="px-3 py-1 bg-amber-400/10 text-amber-400 rounded-xl">
            {kpis.pendingOrders} Bekleyen
          </div>
          <div className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-xl">
            {kpis.inProgressOrders} Süreçte
          </div>
          <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-xl">
            {kpis.completedOrders} Tamamlanan
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Talep No, Müşteri, Adres, Görev Açıklaması veya Asistan Ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#131826] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-amber-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Refresh Info */}
          <div className="text-[11px] text-gray-400 shrink-0 font-medium">
            Toplam: <strong className="text-white">{filteredOrders.length}</strong> talep listeleniyor
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Tüm Talepler' },
            { id: 'pending', label: 'Asistan Bekleniyor' },
            { id: 'assigned', label: 'Asistan Atandı' },
            { id: 'in_progress', label: 'Görevde / Yolda' },
            { id: 'completed', label: 'Tamamlandı' },
            { id: 'cancelled', label: 'İptal Edildi' }
          ].map((tab) => {
            const count = countByFilter(tab.id);
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                    : 'bg-[#131826] hover:bg-[#1A2133] text-gray-300 border border-white/5'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  active ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Requests Table / Cards */}
      <div className="rounded-3xl bg-[#131826] border border-white/5 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-xs space-y-2">
            <ShoppingBag className="w-8 h-8 mx-auto text-gray-600" />
            <div className="font-bold text-gray-400">Kriterlere uygun talep bulunamadı</div>
            <div>Arama kriterlerini veya durum filtrelerini değiştirmeyi deneyebilirsiniz.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#182033] text-gray-400 text-[11px] uppercase border-b border-white/5">
                  <th className="py-3.5 px-4 font-bold">Talep No & Zaman</th>
                  <th className="py-3.5 px-4 font-bold">Talep Başlığı & Açıklama</th>
                  <th className="py-3.5 px-4 font-bold">Müşteri</th>
                  <th className="py-3.5 px-4 font-bold">Adres / Güzergah</th>
                  <th className="py-3.5 px-4 font-bold">Teklif Edilen Ücret</th>
                  <th className="py-3.5 px-4 font-bold">Atanan Asistan</th>
                  <th className="py-3.5 px-4 font-bold">Durum</th>
                  <th className="py-3.5 px-4 font-bold text-right">Operasyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.map((order) => {
                  const title = order.service_type || order.items?.[0]?.title || 'Özel Asistanlık / Kurye Görevi';
                  const description = order.task_description || order.delivery_notes || order.notes || (order.items && order.items.length > 0 ? order.items.map(i => `${i.quantity || 1}x ${i.title || i.name}`).join(', ') : 'Talep ayrıntısı girilmedi');
                  const isCompleted = order.status === 'teslim_edildi' || order.status === 'delivered' || order.status === 'tamamlandi';
                  const isCancelled = order.status === 'iptal_edildi' || order.status === 'cancelled' || order.status === 'iptal';
                  const isPending = ['kurye_bekleniyor', 'pending', 'beklemede', 'bekliyor'].includes(order.status);
                  const isAssigned = ['kurye_atandi', 'accepted'].includes(order.status);

                  return (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                      {/* Talep No & Created At */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-black text-amber-400 text-xs">
                          #TALEP-{order.id.slice(0, 8)}
                        </div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {order.created_at ? new Date(order.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </div>
                      </td>

                      {/* Talep Başlığı & Açıklama */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div className="font-bold text-white truncate">{title}</div>
                        <div className="text-[11px] text-gray-400 truncate mt-0.5">{description}</div>
                      </td>

                      {/* Müşteri */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-200">{order.customer_name || 'Misafir Müşteri'}</div>
                        {order.customer_phone && (
                          <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5" />
                            {order.customer_phone}
                          </div>
                        )}
                      </td>

                      {/* Güzergah */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="text-[11px] text-gray-300 truncate">
                          <span className="text-gray-500 font-bold">Varış: </span>
                          {order.delivery_address || order.customer_address || 'Belirtilmedi'}
                        </div>
                        {order.pickup_address && (
                          <div className="text-[10px] text-gray-400 truncate mt-0.5">
                            <span className="text-gray-500">Çıkış: </span>{order.pickup_address}
                          </div>
                        )}
                      </td>

                      {/* Teklif Edilen Ücret & Bayi Payı */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-black text-white text-sm">
                          ₺{order.total_price}
                        </div>
                        <div className="text-[10px] text-amber-400 font-mono font-bold mt-0.5">
                          Bayi: ₺{((Number(order.total_price) || 0) * kpis.revenueSharePct / 100).toFixed(2)}
                        </div>
                      </td>

                      {/* Atanan Asistan */}
                      <td className="py-3.5 px-4">
                        {order.assistant_name ? (
                          <div className="space-y-0.5">
                            <div className="text-white font-bold flex items-center gap-1">
                              <Bike className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="truncate">{order.assistant_name}</span>
                            </div>
                            {order.assistant_phone && (
                              <div className="text-[10px] text-gray-400 font-mono">
                                {order.assistant_phone}
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => onOpenAssignModal(order)}
                            className="px-2 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Bike className="w-3 h-3" />
                            Asistan Ata
                          </button>
                        )}
                      </td>

                      {/* Durum */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                          isCompleted
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : isCancelled
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : isPending
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                            : isAssigned
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {order.status}
                        </span>
                      </td>

                      {/* İşlem Butonları */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectOrder(order)}
                            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-[11px] cursor-pointer transition-all"
                          >
                            Detay
                          </button>

                          <button
                            onClick={() => onOpenAssignModal(order)}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-amber-400/10 text-gray-300 hover:text-amber-400 cursor-pointer"
                            title="Asistan Ata / Değiştir"
                          >
                            <Bike className="w-3.5 h-3.5" />
                          </button>

                          {!isCompleted && !isCancelled && (
                            <button
                              onClick={() => onOpenCancelModal(order)}
                              className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 cursor-pointer"
                              title="Talebi İptal Et"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
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
