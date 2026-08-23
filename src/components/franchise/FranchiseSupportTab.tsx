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
        return { label: 'Beklemede', bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock };
      case 'in_review':
        return { label: 'İnceleniyor', bg: 'bg-blue-50 text-blue-800 border-blue-200', icon: Clock };
      case 'answered':
        return { label: 'Cevaplandı', bg: 'bg-purple-50 text-purple-800 border-purple-200', icon: MessageSquare };
      case 'resolved':
        return { label: 'Çözüldü', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle2 };
      case 'closed':
        return { label: 'Kapatıldı', bg: 'bg-gray-50 text-gray-800 border-gray-200', icon: X };
      default:
        return { label: status, bg: 'bg-gray-50 text-gray-800 border-gray-200', icon: Clock };
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs">
        <div>
          <h2 className="text-lg font-black text-[#111111] flex items-center gap-2">
            <Headphones className="w-5 h-5 text-[#111111]" />
            Genel Merkez İletişimi & Destek Talepleri
          </h2>
          <p className="text-xs text-[#666666] mt-0.5">
            {cityNameDisplay} bayiliği ile UĞRA Genel Merkezi arasındaki resmi iletişim, finans ve operasyonel destek kanalı.
          </p>
        </div>

        <button
          onClick={onOpenCreateTicket}
          className="px-4 py-2.5 rounded-xl bg-[#111111] hover:bg-[#222222] text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Destek Talebi Oluştur</span>
        </button>
      </div>

      {/* Tickets List */}
      <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-[#111111]">Taleplerim ({tickets.length})</h3>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[#F7F7F8] border border-[#E5E7EB] text-[#111111] text-xs font-bold rounded-xl px-3 py-1.5 outline-none"
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
          <div className="p-8 text-center bg-[#F7F7F8] rounded-xl border border-[#E5E7EB] space-y-2">
            <HelpCircle className="w-8 h-8 text-[#8A8A8A] mx-auto" />
            <p className="text-xs font-bold text-[#111111]">Henüz destek talebiniz bulunmamaktadır.</p>
            <p className="text-[11px] text-[#666666]">Genel Merkeze iletmek istediğiniz her türlü konuyu yukarıdaki butondan iletebilirsiniz.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#666666] uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-3">Bilet No / Tarih</th>
                  <th className="py-3 px-3">Konu & Kategori</th>
                  <th className="py-3 px-3">Öncelik</th>
                  <th className="py-3 px-3">Durum</th>
                  <th className="py-3 px-3">Merkez Yanıtı</th>
                  <th className="py-3 px-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2F3]">
                {filteredTickets.map(ticket => {
                  const statusObj = getStatusBadge(ticket.status);
                  return (
                    <tr key={ticket.id} className="hover:bg-[#F7F7F8]">
                      <td className="py-3.5 px-3">
                        <div className="font-mono font-bold text-[#111111]">#{ticket.id.slice(0, 8)}</div>
                        <div className="text-[10px] text-[#666666]">
                          {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('tr-TR') : '-'}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-bold text-[#111111]">{ticket.subject}</div>
                        <div className="text-[10px] text-[#666666]">{getCategoryLabel(ticket.category)}</div>
                      </td>

                      <td className="py-3.5 px-3 uppercase text-[10px] font-bold text-[#111111]">
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
                          <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Yanıtlandı
                          </span>
                        ) : (
                          <span className="text-amber-700 text-[11px]">İnceleniyor...</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => onSelectTicket(ticket)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#F7F7F8] hover:bg-[#F2F2F3] border border-[#E5E7EB] text-[#111111] font-bold text-[11px] cursor-pointer transition-all inline-flex items-center gap-1"
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
