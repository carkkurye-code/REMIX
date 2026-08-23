import React from 'react';
import { 
  Building2, MapPin, ShieldCheck, User, Phone, 
  Mail, Calendar, FileText, CheckCircle2, Lock, 
  CreditCard, Layers, AlertCircle 
} from 'lucide-react';
import { Franchise, City } from '@/lib/supabase';
import { FranchiseKPIs } from './types';

interface Props {
  franchise: Franchise | null;
  city: City | null;
  franchiseManager: any;
  kpis: FranchiseKPIs;
  cityNameDisplay: string;
}

export const FranchiseSettingsTab: React.FC<Props> = ({
  franchise,
  city,
  franchiseManager,
  kpis,
  cityNameDisplay
}) => {
  const districts = franchise?.districts_covered || ['Tüm Merkez İlçeler'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#111111] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#111111]" />
            Resmi Bayilik & Sözleşme Bilgileri
          </h2>
          <p className="text-xs text-[#666666]">
            UĞRA platformu bünyesindeki bölgesel ana bayilik lisansı, kapsama alanı ve sözleşmeli yetkilendirme parametreleri.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            {franchise?.status === 'active' ? 'Lisans Aktif' : 'Sözleşmeli'}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-[#F7F7F8] text-[#666666] font-bold text-xs border border-[#E5E7EB] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#111111]" />
            Salt Okunur (Kilitli)
          </span>
        </div>
      </div>

      {/* Main Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Bayi & Şirket Bilgileri */}
        <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] space-y-4 text-xs shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <h3 className="text-sm font-black text-[#111111] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#111111]" />
              Bayilik & Kurumsal Tanım
            </h3>
            <span className="text-[10px] text-[#8A8A8A] font-mono font-bold">BÖLGE LİSANSI</span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-1.5 border-b border-[#F2F2F3]">
              <span className="text-[#666666]">Bayi Adı:</span>
              <span className="font-bold text-[#111111]">{franchise?.name || `${cityNameDisplay} Ana Bayiliği`}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-[#F2F2F3]">
              <span className="text-[#666666]">Şirket Unvanı:</span>
              <span className="font-bold text-[#111111]">{franchise?.company_title || `${cityNameDisplay} Uğra Operasyon Hizmetleri A.Ş.`}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-[#F2F2F3]">
              <span className="text-[#666666]">Yetkili Şehir:</span>
              <span className="font-bold text-[#111111] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#111111]" />
                {cityNameDisplay} (Plaka: {city?.plate_code || '54'})
              </span>
            </div>

            <div className="py-1.5 border-b border-[#F2F2F3] space-y-1.5">
              <span className="text-[#666666] block">Kapsanan İlçeler:</span>
              <div className="flex flex-wrap gap-1.5">
                {districts.map((d, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-[#F7F7F8] text-[#111111] text-[11px] font-medium border border-[#E5E7EB]">
                    {d}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-between py-1.5 border-b border-[#F2F2F3]">
              <span className="text-[#666666]">Sözleşme Komisyon Oranı:</span>
              <span className="font-mono font-black text-[#111111] text-sm">%{kpis.revenueSharePct}</span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-[#666666]">Sözleşme Başlangıç Tarihi:</span>
              <span className="font-medium text-[#111111]">
                {franchise?.created_at ? new Date(franchise.created_at).toLocaleDateString('tr-TR') : '01.01.2025'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Yetkili Kişi & İletişim Bilgileri */}
        <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] space-y-4 text-xs shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <h3 className="text-sm font-black text-[#111111] flex items-center gap-2">
              <User className="w-4 h-4 text-[#111111]" />
              Yetkili Yönetici & İrtibat
            </h3>
            <span className="text-[10px] text-[#8A8A8A] font-mono font-bold">FRANCHISE MANAGER</span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-1.5 border-b border-[#F2F2F3]">
              <span className="text-[#666666]">Yetkili Kişi:</span>
              <span className="font-bold text-[#111111]">
                {franchiseManager?.name || franchise?.authorized_person || franchise?.contact_person || 'Yetkili Yönetici'}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-[#F2F2F3]">
              <span className="text-[#666666]">Giriş E-Postası:</span>
              <span className="font-mono font-medium text-[#111111]">
                {franchiseManager?.email || franchise?.email || `${cityNameDisplay.toLowerCase()}@ugra.app`}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-[#F2F2F3]">
              <span className="text-[#666666]">İletişim Telefonu:</span>
              <span className="font-mono font-bold text-[#111111]">
                {franchise?.phone || '0850 308 84 72'}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-[#F2F2F3]">
              <span className="text-[#666666]">Banka / IBAN:</span>
              <span className="font-mono text-[11px] font-bold text-[#111111] truncate max-w-[200px]" title={franchise?.iban || 'TR12 0006 1005 1928 3820 1928 31'}>
                {franchise?.bank_name ? `${franchise.bank_name} - ` : ''}{franchise?.iban || 'TR12 0006 1005 1928 3820 1928 31'}
              </span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-[#666666]">Son Veri Senkronizasyonu:</span>
              <span className="font-mono text-[#111111] flex items-center gap-1 text-emerald-600 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Gerçek Zamanlı Aktif
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contract & Security Notice */}
      <div className="p-5 rounded-2xl bg-[#F7F7F8] border border-[#E5E7EB] flex items-start gap-3 text-xs text-[#666666]">
        <AlertCircle className="w-5 h-5 text-[#111111] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-black text-[#111111]">Sözleşme ve Yetki Sınırları Uyarısı</h4>
          <p className="leading-relaxed">
            Bayilik lisansı kapsamında tüm işletme sözleşmeleri ve finansal hak edişler UĞRA Genel Merkez sözleşme şartlarına tabidir. 
            Yetkili bölge ve komisyon oranlarında yapılacak değişiklikler için Genel Merkez Destek masasına resmi talep oluşturulması gerekmektedir.
          </p>
        </div>
      </div>
    </div>
  );
};
