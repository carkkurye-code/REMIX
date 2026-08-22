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
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            Resmi Bayilik & Sözleşme Bilgileri
          </h2>
          <p className="text-xs text-gray-400">
            UĞRA platformu bünyesindeki bölgesel ana bayilik lisansı, kapsama alanı ve sözleşmeli yetkilendirme parametreleri.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 font-extrabold text-xs border border-emerald-500/20 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            {franchise?.status === 'active' ? 'Lisans Aktif' : 'Sözleşmeli'}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-white/5 text-gray-300 font-bold text-xs border border-white/10 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            Salt Okunur (Kilitli)
          </span>
        </div>
      </div>

      {/* Main Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Bayi & Şirket Bilgileri */}
        <div className="p-5 rounded-3xl bg-[#131826] border border-white/5 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              Bayilik & Kurumsal Tanım
            </h3>
            <span className="text-[10px] text-gray-400 font-mono">BÖLGE LİSANSI</span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-gray-400">Bayi Adı:</span>
              <span className="font-bold text-white">{franchise?.name || `${cityNameDisplay} Ana Bayiliği`}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-gray-400">Şirket Resmi Unvanı:</span>
              <span className="font-bold text-gray-200">{franchise?.company_title || `${cityNameDisplay} Uğra Operasyon Hizmetleri A.Ş.`}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-gray-400">Yetkili Şehir / İl:</span>
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {cityNameDisplay} (Plaka Kodu: {city?.plate_code || '54'})
              </span>
            </div>

            <div className="py-1.5 border-b border-white/5 space-y-1.5">
              <span className="text-gray-400 block">Kapsanan İlçeler:</span>
              <div className="flex flex-wrap gap-1.5">
                {districts.map((d, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-white/5 text-gray-300 text-[11px] font-medium border border-white/5">
                    {d}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-gray-400">Sözleşme Komisyon Oranı:</span>
              <span className="font-mono font-black text-amber-400 text-sm">%{kpis.revenueSharePct}</span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-gray-400">Bayilik Durumu:</span>
              <span className="font-bold text-emerald-400">Aktif & Yetkilendirilmiş</span>
            </div>
          </div>
        </div>

        {/* 2. Bayi Yöneticisi & Banka Hesabı */}
        <div className="space-y-4">
          {/* Yetkili Yönetici */}
          <div className="p-5 rounded-3xl bg-[#131826] border border-white/5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                Yetkili Bayi Yöneticisi
              </h3>
              <span className="text-gray-400 font-mono text-[10px]">franchise_manager</span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-400">Yetkili Kişi:</span>
                <span className="font-bold text-white">
                  {franchiseManager?.name || franchiseManager?.full_name || franchise?.authorized_person || franchise?.contact_person || `${cityNameDisplay} Bayi Müdürü`}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-400">İletişim Telefonu:</span>
                <span className="font-mono text-gray-200">{franchiseManager?.phone || franchise?.phone || '0850 000 00 00'}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-gray-400">Giriş E-postası:</span>
                <span className="font-mono text-gray-200">{franchiseManager?.email || franchise?.email || `${cityNameDisplay.toLowerCase()}@ugra.app`}</span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-gray-400">Sistem Rolü:</span>
                <span className="font-bold text-blue-400">franchise_manager (Bayi Yöneticisi)</span>
              </div>
            </div>
          </div>

          {/* Banka & Hak Ediş Hesabı */}
          <div className="p-5 rounded-3xl bg-[#131826] border border-white/5 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Hak Ediş Banka Bilgisi
              </h3>
              <span className="text-[10px] text-gray-400 font-mono">IBAN / HESAP</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Banka Adı:</span>
                <span className="font-bold text-white">{franchise?.bank_name || 'Ziraat Bankası'}</span>
              </div>

              <div className="space-y-1 py-1">
                <span className="text-gray-400">IBAN:</span>
                <div className="font-mono font-bold text-amber-300 bg-[#1A2133] p-2 rounded-xl text-center tracking-wider text-[11px]">
                  {franchise?.iban || 'TR00 0000 0000 0000 0000 0000 00'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Güvenlik, RLS ve İzolasyon Bilgilendirmesi */}
      <div className="p-5 rounded-3xl bg-[#131826] border border-white/5 space-y-4 text-xs">
        <div className="flex items-center gap-2 text-sm font-black text-white">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Veri İzolasyonu & Güvenlik Kuralı (PostgreSQL RLS)
        </div>

        <p className="text-gray-300 leading-relaxed">
          Bayi yöneticisi hesabı, platform genelinde <strong className="text-white">yalnızca kendi bayiliğine ({franchise?.id || 'franchise_id'})</strong> ve <strong className="text-white">kendi şehrine ({city?.id || 'city_id'})</strong> ait verileri görüntüleyebilir.
          Bayi yöneticisi; <code className="text-amber-400 bg-white/5 px-1.5 py-0.5 rounded">franchise_id</code>, <code className="text-amber-400 bg-white/5 px-1.5 py-0.5 rounded">city_id</code>, <code className="text-amber-400 bg-white/5 px-1.5 py-0.5 rounded">role</code>, <code className="text-amber-400 bg-white/5 px-1.5 py-0.5 rounded">scope</code> veya <code className="text-amber-400 bg-white/5 px-1.5 py-0.5 rounded">revenue_share_percentage</code> değerlerini değiştiremez.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-[#1A2133] rounded-2xl border border-white/5 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-gray-300">RLS Seviyesinde Bölgesel İzolasyon</span>
          </div>

          <div className="p-3 bg-[#1A2133] rounded-2xl border border-white/5 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-gray-300">Salt Okunur Komisyon Oranı</span>
          </div>

          <div className="p-3 bg-[#1A2133] rounded-2xl border border-white/5 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-gray-300">Otomatik Bölge Eşleştirmesi</span>
          </div>
        </div>
      </div>
    </div>
  );
};
