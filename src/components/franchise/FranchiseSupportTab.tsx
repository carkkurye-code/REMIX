import React, { useState } from 'react';
import { 
  Headphones, Plus, MessageSquare, AlertCircle, 
  CheckCircle2, Clock, Send, Paperclip, ChevronRight, 
  ShieldCheck, Info, X, HelpCircle, FileText
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
        return { label: 'Beklemede', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock };
      case 'in_review':
        return { label: 'İnceleniyor', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Info };
      case 'answered':
        return { label: 'Cevaplandı', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: MessageSquare };
      case 'resolved':
        return { label: 'Çözüldü', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 };
      case 'closed':
        return { label: 'Kapatıldı', bg: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: X };
      default:
        return { label: status, bg: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: Clock };
    }
  };

  const getPriorityBadge = (priority: FranchiseSupportTicket['priority']) => {
    switch (priority) {
      case 'urgent':
        return { label: 'Acil', bg: 'bg-red-500/10 text-red-400 border-red-500/20' };
      case 'high':
        return { label: 'Yüksek', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
      case 'normal':
        return { label: 'Normal', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
      case 'low':
        return { label: 'Düşük', bg: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
      default:
        return { label: priority, bg: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'finans_hakedis': return 'Finans & Hak Ediş';
      case 'isletme_onay': return 'İşletme / Mağaza Onayı';
      case 'sozlesme_hukuk': return 'Sözleşme & Hukuk';
      case 'teknik_destek': return 'Teknik & Panel Desteği';
      case 'bolgesel_talep': return 'Bölgesel Talep / Genişleme';
      default: return 'Genel Konu';
    }
  };

  const pendingCount = tickets.filter(t => t.status === 'pending' || t.status === 'in_review').length;
  const answeredCount = tickets.filter(t => t.status === 'answered').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Headphones className="w-5 h-5 text-blue-400" />
            Genel Merkez İletişimi & Destek Talepleri
          </h2>
          <p className="text-xs text-gray-400">
            {cityNameDisplay} bayiliği ile UĞRA Genel Merkezi arasındaki resmi iletişim, finans ve operasyonel talep kanalı.
          </p>
        </div>

        <button
          onClick={onOpenCreateTicket}
          className="px-4 py-2.5 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Yeni Destek Talebi Oluştur
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#131826] border border-white/5 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 font-bold">İncelenen / Bekleyen</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{pendingCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#131826] border border-white/5 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 font-bold">Merkezden Cevaplanan</div>
            <div className="text-2xl font-black text-purple-400 mt-1">{answeredCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#131826] border border-white/5 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 font-bold">Çözüme Ulaşan</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{resolvedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Kategori:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-[#131826] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
          >
            <option value="all">Tüm Kategoriler</option>
            <option value="finans_hakedis">Finans & Hak Ediş</option>
            <option value="isletme_onay">İşletme Onayları</option>
            <option value="sozlesme_hukuk">Sözleşme & Hukuk</option>
            <option value="teknik_destek">Teknik Destek</option>
            <option value="bolgesel_talep">Bölgesel Talep</option>
            <option value="genel">Genel</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Durum:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#131826] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="pending">Beklemede</option>
            <option value="in_review">İnceleniyor</option>
            <option value="answered">Cevaplandı</option>
            <option value="resolved">Çözüldü</option>
            <option value="closed">Kapatıldı</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="rounded-3xl bg-[#131826] border border-white/5 overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-xs space-y-3">
            <HelpCircle className="w-8 h-8 mx-auto text-gray-600" />
            <div className="font-bold text-gray-400">Kayıtlı destek talebi bulunamadı</div>
            <p className="text-gray-500 max-w-sm mx-auto">
              Genel Merkez ile finansal mutabakat, işletme sözleşmeleri veya operasyonel konularda talep oluşturabilirsiniz.
            </p>
            <button
              onClick={onOpenCreateTicket}
              className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold rounded-xl text-xs cursor-pointer inline-flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Destek Talebi Oluştur
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredTickets.map((ticket) => {
              const statusBadge = getStatusBadge(ticket.status);
              const priorityBadge = getPriorityBadge(ticket.priority);
              const StatusIcon = statusBadge.icon;

              return (
                <div
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket)}
                  className="p-4 hover:bg-white/5 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${statusBadge.bg}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusBadge.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${priorityBadge.bg}`}>
                        {priorityBadge.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-gray-300 text-[10px] font-medium border border-white/5">
                        {getCategoryLabel(ticket.category)}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        #{ticket.id.slice(0, 8)}
                      </span>
                    </div>

                    <div className="font-bold text-white text-sm truncate">
                      {ticket.subject}
                    </div>

                    <div className="text-gray-400 line-clamp-1 text-[11px]">
                      {ticket.message}
                    </div>

                    {ticket.admin_reply && (
                      <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] flex items-start gap-2 mt-2">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 text-purple-400" />
                        <div>
                          <strong>Merkez Yanıtı:</strong> {ticket.admin_reply}
                          {ticket.replied_at && (
                            <div className="text-[10px] text-purple-400/70 mt-0.5">
                              {new Date(ticket.replied_at).toLocaleString('tr-TR')}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-gray-400 shrink-0 self-end md:self-center">
                    <span className="text-[10px] font-mono">
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('tr-TR') : '-'}
                    </span>
                    <button className="p-1.5 rounded-lg bg-white/5 text-gray-300 hover:text-white">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Merkez Bilgi Kartı */}
      <div className="p-4 rounded-2xl bg-[#0F131E] border border-white/5 text-xs text-gray-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>Genel Merkez Destek Hattı: <strong>0850 000 00 00</strong> | E-posta: <strong>destek@ugra.app</strong></span>
        </div>
        <span className="text-[10px] text-gray-500">Ortalama Yanıt Süresi: &lt; 2 Saat</span>
      </div>
    </div>
  );
};
