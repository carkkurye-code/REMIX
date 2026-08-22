import React, { useState } from 'react';
import { 
  FileText, Download, TrendingUp, Percent, 
  CheckCircle2, AlertTriangle, DollarSign, Printer,
  Store, Layers, Calendar, FileSpreadsheet, Eye
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Order, Partner, Franchise } from '@/lib/supabase';
import { FranchiseKPIs, TimePeriod } from './types';

type ReportType = 'volume' | 'completed' | 'earnings' | 'partners' | 'finance_summary';

interface Props {
  kpis: FranchiseKPIs;
  timePeriod: TimePeriod;
  setTimePeriod: (p: TimePeriod) => void;
  periodOrders: Order[];
  partners: Partner[];
  franchise: Franchise | null;
  cityNameDisplay: string;
}

export const FranchiseReportsTab: React.FC<Props> = ({
  kpis,
  timePeriod,
  setTimePeriod,
  periodOrders,
  partners,
  franchise,
  cityNameDisplay
}) => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('volume');

  const reportTitles: Record<ReportType, { title: string; desc: string }> = {
    volume: {
      title: '1. Dönemsel Hacim Raporu',
      desc: 'Bölgedeki tüm talep teklifleri, brüt işlem hacmi ve ortalama sepet büyüklüğü dökümü.'
    },
    completed: {
      title: '2. Tamamlanan İşlem Raporu',
      desc: 'Başarıyla sonuçlanan görevler, teslimat süreleri ve asistan atama detayları.'
    },
    earnings: {
      title: '3. Bayi Hak Ediş Raporu',
      desc: 'Sözleşmeye bağlı komisyon oranı üzerinden hesaplanan resmi bayi net kazanç ve hak ediş bordrosu.'
    },
    partners: {
      title: '4. İşletme / Partner Raporu',
      desc: 'Bölgedeki kayıtlı mağazalar, kategorileri, durumları ve iletişim bilgileri dökümü.'
    },
    finance_summary: {
      title: '5. Genel Finans Özeti',
      desc: 'Tüm ticari göstergelerin, tamamlanan ve süreçteki hacimlerin konsolide özeti.'
    }
  };

  // 1. Export CSV
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    const dateStr = new Date().toISOString().slice(0, 10);

    if (selectedReport === 'partners') {
      headers = ['İşletme Adı', 'Kategori', 'Telefon', 'İlçe', 'Açık Adres', 'Durum', 'Kayıt Tarihi'];
      rows = partners.map(p => [
        `"${(p.business_name || '').replace(/"/g, '""')}"`,
        `"${(p.category || 'Genel').replace(/"/g, '""')}"`,
        `"${(p.phone || '').replace(/"/g, '""')}"`,
        `"${(p.district || '').replace(/"/g, '""')}"`,
        `"${(p.address || '').replace(/"/g, '""')}"`,
        p.active !== false ? 'Aktif' : 'Pasif',
        p.created_at ? new Date(p.created_at).toLocaleDateString('tr-TR') : '-'
      ]);
    } else {
      headers = ['Talep No', 'Tarih', 'Talep Başlığı', 'Müşteri', 'Atanan Asistan', 'Teklif Tutarı (TL)', 'Bayi Komisyonu (TL)', 'Durum'];
      const targetOrders = selectedReport === 'completed'
        ? periodOrders.filter(o => o.status === 'teslim_edildi' || o.status === 'delivered')
        : periodOrders;

      rows = targetOrders.map(o => {
        const title = o.service_type || o.items?.[0]?.title || 'Talep';
        const fee = ((Number(o.total_price) || 0) * kpis.revenueSharePct / 100).toFixed(2);
        return [
          `#TALEP-${o.id.slice(0, 8)}`,
          o.created_at ? new Date(o.created_at).toLocaleString('tr-TR') : '-',
          `"${title.replace(/"/g, '""')}"`,
          `"${(o.customer_name || 'Misafir').replace(/"/g, '""')}"`,
          `"${(o.assistant_name || 'Atanmadı').replace(/"/g, '""')}"`,
          (Number(o.total_price) || 0).toString(),
          fee,
          o.status
        ];
      });
    }

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `UGRA_${cityNameDisplay}_${selectedReport}_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Export Excel (XLSX)
  const handleExportXLSX = () => {
    const wb = XLSX.utils.book_new();
    let data: any[] = [];
    const dateStr = new Date().toISOString().slice(0, 10);

    if (selectedReport === 'partners') {
      data = partners.map(p => ({
        'İşletme Adı': p.business_name || '',
        'Kategori': p.category || 'Genel',
        'Telefon': p.phone || '',
        'İlçe': p.district || '',
        'Açık Adres': p.address || '',
        'Durum': p.active !== false ? 'Aktif' : 'Pasif',
        'Kayıt Tarihi': p.created_at ? new Date(p.created_at).toLocaleDateString('tr-TR') : '-'
      }));
    } else if (selectedReport === 'earnings' || selectedReport === 'finance_summary') {
      data = periodOrders.map(o => ({
        'Talep No': `#TALEP-${o.id.slice(0, 8)}`,
        'Tarih': o.created_at ? new Date(o.created_at).toLocaleString('tr-TR') : '-',
        'Talep Başlığı': o.service_type || o.items?.[0]?.title || 'Talep',
        'Müşteri': o.customer_name || 'Misafir',
        'Atanan Asistan': o.assistant_name || 'Atanmadı',
        'Teklif Tutarı (TL)': Number(o.total_price) || 0,
        'Bayi Oranı': `%${kpis.revenueSharePct}`,
        'Bayi Net Hak Ediş (TL)': Number(((Number(o.total_price) || 0) * kpis.revenueSharePct / 100).toFixed(2)),
        'Durum': o.status
      }));
    } else {
      const targetOrders = selectedReport === 'completed'
        ? periodOrders.filter(o => o.status === 'teslim_edildi' || o.status === 'delivered')
        : periodOrders;

      data = targetOrders.map(o => ({
        'Talep No': `#TALEP-${o.id.slice(0, 8)}`,
        'Tarih': o.created_at ? new Date(o.created_at).toLocaleString('tr-TR') : '-',
        'Talep Başlığı': o.service_type || o.items?.[0]?.title || 'Talep',
        'Müşteri': o.customer_name || 'Misafir',
        'Atanan Asistan': o.assistant_name || 'Atanmadı',
        'Teklif Tutarı (TL)': Number(o.total_price) || 0,
        'Bayi Payı (TL)': Number(((Number(o.total_price) || 0) * kpis.revenueSharePct / 100).toFixed(2)),
        'Durum': o.status
      }));
    }

    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Rapor');
    XLSX.writeFile(wb, `UGRA_${cityNameDisplay}_${selectedReport}_${dateStr}.xlsx`);
  };

  // 3. Print / PDF
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            Resmi Bayilik Raporlama Merkezi
          </h2>
          <p className="text-xs text-gray-400">
            {cityNameDisplay} bayiliği muhasebe, operasyon ve işletme dökümlerini görüntüleyin ve dışa aktarın.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            CSV İndir
          </button>

          <button
            onClick={handleExportXLSX}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors border border-emerald-500/30"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            Excel (XLSX) İndir
          </button>

          <button
            onClick={handlePrintPDF}
            className="px-3.5 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors border border-blue-500/30"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            PDF / Yazdır
          </button>
        </div>
      </div>

      {/* 5 Supported Report Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-[#0F131E] p-1.5 rounded-2xl border border-white/5">
        {(Object.keys(reportTitles) as ReportType[]).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedReport(type)}
            className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all cursor-pointer ${
              selectedReport === type
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="font-black truncate">{reportTitles[type].title.split('. ')[1]}</div>
            <div className="text-[10px] opacity-75 truncate">{reportTitles[type].title.split('. ')[0]}</div>
          </button>
        ))}
      </div>

      {/* Active Report Header Box */}
      <div className="p-4 rounded-2xl bg-[#131826] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-white">{reportTitles[selectedReport].title}</h3>
          <p className="text-xs text-gray-400">{reportTitles[selectedReport].desc}</p>
        </div>

        {/* Period selection */}
        <div className="flex items-center gap-1 bg-[#1A2133] p-1 rounded-xl border border-white/5 shrink-0 self-start md:self-center">
          <span className="text-[11px] text-gray-400 font-bold px-2">Dönem:</span>
          {(['today', 'week', 'month', 'all'] as TimePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timePeriod === period
                  ? 'bg-amber-400 text-black font-extrabold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {period === 'today' ? 'Bugün' : period === 'week' ? 'Hafta' : period === 'month' ? 'Ay' : 'Tümü'}
            </button>
          ))}
        </div>
      </div>

      {/* Report Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#131826] border border-white/5">
          <div className="text-xs text-gray-400 font-bold">Toplam Talep Hacmi</div>
          <div className="text-xl font-black text-white font-mono mt-1">
            ₺{kpis.totalVolume.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#131826] border border-white/5">
          <div className="text-xs text-gray-400 font-bold">Tamamlanan Hacim</div>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1">
            ₺{kpis.completedVolume.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#131826] border border-white/5">
          <div className="text-xs text-amber-300 font-bold">Bayi Net Hak Ediş (%{kpis.revenueSharePct})</div>
          <div className="text-xl font-black text-amber-400 font-mono mt-1">
            ₺{kpis.franchiseEarnings.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#131826] border border-white/5">
          <div className="text-xs text-gray-400 font-bold">Kayıtlı Bölge İşletmeleri</div>
          <div className="text-xl font-black text-blue-400 font-mono mt-1">
            {partners.length} İşletme
          </div>
        </div>
      </div>

      {/* Report Data Table */}
      <div className="rounded-3xl bg-[#131826] border border-white/5 overflow-hidden">
        {selectedReport === 'partners' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#182033] text-gray-400 text-[11px] uppercase border-b border-white/5">
                  <th className="py-3 px-4 font-bold">İşletme Adı</th>
                  <th className="py-3 px-4 font-bold">Kategori</th>
                  <th className="py-3 px-4 font-bold">Telefon</th>
                  <th className="py-3 px-4 font-bold">İlçe / Adres</th>
                  <th className="py-3 px-4 font-bold">Durum</th>
                  <th className="py-3 px-4 font-bold text-right">Kayıt Tarihi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {partners.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">Kayıtlı işletme bulunmamaktadır.</td>
                  </tr>
                ) : (
                  partners.map(p => (
                    <tr key={p.id} className="hover:bg-white/5">
                      <td className="py-3 px-4 font-bold text-white">{p.business_name}</td>
                      <td className="py-3 px-4 text-gray-300">{p.category || 'Genel'}</td>
                      <td className="py-3 px-4 font-mono text-gray-300">{p.phone || '-'}</td>
                      <td className="py-3 px-4 text-gray-400">{p.address || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          p.active !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {p.active !== false ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-400 text-right">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString('tr-TR') : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#182033] text-gray-400 text-[11px] uppercase border-b border-white/5">
                  <th className="py-3 px-4 font-bold">Talep No</th>
                  <th className="py-3 px-4 font-bold">Tarih</th>
                  <th className="py-3 px-4 font-bold">Talep Başlığı</th>
                  <th className="py-3 px-4 font-bold">Müşteri</th>
                  <th className="py-3 px-4 font-bold">Atanan Asistan</th>
                  <th className="py-3 px-4 font-bold">Teklif Tutarı</th>
                  <th className="py-3 px-4 font-bold">Bayi Payı (%{kpis.revenueSharePct})</th>
                  <th className="py-3 px-4 font-bold text-right">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {periodOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500">Seçilen dönemde talep bulunmamaktadır.</td>
                  </tr>
                ) : (
                  (selectedReport === 'completed'
                    ? periodOrders.filter(o => o.status === 'teslim_edildi' || o.status === 'delivered')
                    : periodOrders
                  ).map(o => {
                    const fee = ((Number(o.total_price) || 0) * kpis.revenueSharePct / 100).toFixed(2);
                    return (
                      <tr key={o.id} className="hover:bg-white/5">
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">#TALEP-{o.id.slice(0, 8)}</td>
                        <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">
                          {o.created_at ? new Date(o.created_at).toLocaleDateString('tr-TR') : '-'}
                        </td>
                        <td className="py-3 px-4 text-white font-bold max-w-[200px] truncate">
                          {o.service_type || o.items?.[0]?.title || 'Talep'}
                        </td>
                        <td className="py-3 px-4 text-gray-300">{o.customer_name || 'Misafir'}</td>
                        <td className="py-3 px-4 text-gray-300">{o.assistant_name || '-'}</td>
                        <td className="py-3 px-4 font-mono font-black text-white">₺{o.total_price}</td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">₺{fee}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="px-2 py-0.5 rounded-md bg-white/5 text-gray-300 text-[10px] font-bold">
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
