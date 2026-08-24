import React, { useState } from 'react';
import { 
  Headphones, Plus, MessageSquare, 
  CheckCircle2, Clock, X, Eye, HelpCircle
} from 'lucide-react';
import { FranchiseSupportTicket, Franchise } from '@/lib/supabase';

interface Props {
  tickets: FranchiseSupportTicket[];
  franchise: Franchise | null;
  cityNameDisplay: string;
  onOpenCreateTicket: () => void;
  onSelectTicket: (ticket: FranchiseSupportTicket) => void;
}

export const FranchiseSupportTab: React.FC<Props> = ({
  tickets,
  franchise,
  cityNameDisplay,
  onOpenCreateTicket,
  onSelectTicket
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredTickets = tickets.filter(t => {
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  const getStatusBadge = (status: FranchiseSupportTicket['status']) => {
    switch (status) {
      case 'pending':
        return { label: 'Beklemede', bg: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20', icon: Clock };
      case 'in_review':
        return { label: 'İnceleniyor', bg: 'bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/20', icon: Clock };
      case 'answered':
        return { label: 'Cevaplandı', bg: 'bg-purple-500/10 text-purple-800 dark:text-purple-300 border-purple-500/20', icon: MessageSquare };
      case 'resolved':
        return { label: 'Çözüldü', bg: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20', icon: CheckCircle2 };
      case 'closed':
        return { label: 'Kapatıldı', bg: 'bg-muted text-muted-foreground border-border', icon: X };
      default:
        return { label: status, bg: 'bg-muted text-muted-foreground border-border', icon: Clock };
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'finans_hakedis': return 'Finans & Hak Ediş';
      case 'sozlesme_lisans': return 'Sözleşme & Lisans';
      case 'operasyon_destek': return 'Bölgesel Operasyon & Asistanlık';
      case 'teknik_sistem': return 'Teknik & Panel';
      default: return 'Genel Talep';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[1.65rem] sm:rounded-2xl bg-card border border-border shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)]">
        <div>
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <Headphones className="w-5 h-5 text-primary" />
            Genel Merkez İletişimi & Destek Talepleri
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {cityNameDisplay} bayiliği ile UĞRA Genel Merkezi arasındaki resmi iletişim, finans ve operasyonel destek kanalı.
          </p>
        </div>

        <button
          onClick={onOpenCreateTicket}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Destek Talebi Oluştur</span>
        </button>
      </div>

      {/* Tickets List */}
      <div className="p-6 rounded-[1.65rem] sm:rounded-2xl bg-card border border-border shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-foreground">Taleplerim ({tickets.length})</h3>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-background border border-border text-foreground text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:border-primary"
            >
              <option value="all">Tüm Kategoriler</option>
              <option value="finans_hakedis">Finans & Hak Ediş</option>
              <option value="sozlesme_lisans">Sözleşme & Lisans</option>
              <option value="operasyon_destek">Operasyon & Asistanlık</option>
              <option value="teknik_sistem">Teknik / Sistem</option>
            </select>
          </div>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="p-8 text-center bg-background rounded-xl border border-border space-y-2">
            <HelpCircle className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-xs font-bold text-foreground">Henüz destek talebiniz bulunmamaktadır.</p>
            <p className="text-[11px] text-muted-foreground">Genel Merkeze iletmek istediğiniz her türlü konuyu yukarıdaki butondan iletebilirsiniz.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-3">Bilet No / Tarih</th>
                  <th className="py-3 px-3">Konu & Kategori</th>
                  <th className="py-3 px-3">Öncelik</th>
                  <th className="py-3 px-3">Durum</th>
                  <th className="py-3 px-3">Merkez Yanıtı</th>
                  <th className="py-3 px-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredTickets.map(ticket => {
                  const statusObj = getStatusBadge(ticket.status);
                  return (
                    <tr key={ticket.id} className="hover:bg-background/80 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-mono font-bold text-foreground">#{ticket.id.slice(0, 8)}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('tr-TR') : '-'}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-bold text-foreground">{ticket.subject}</div>
                        <div className="text-[10px] text-muted-foreground">{getCategoryLabel(ticket.category)}</div>
                      </td>

                      <td className="py-3.5 px-3 uppercase text-[10px] font-bold text-foreground">
                        {ticket.priority}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusObj.bg}`}>
                          <statusObj.icon className="w-3 h-3" />
                          {statusObj.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        {ticket.admin_reply ? (
                          <span className="text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Yanıtlandı
                          </span>
                        ) : (
                          <span className="text-amber-700 dark:text-amber-300 text-[11px]">İnceleniyor...</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => onSelectTicket(ticket)}
                          className="px-2.5 py-1.5 rounded-lg bg-card hover:bg-accent/40 border border-border text-foreground font-bold text-[11px] cursor-pointer transition-all inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Görüntüle</span>
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
