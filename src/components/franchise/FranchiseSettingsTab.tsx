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
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Resmi Bayilik & Sözleşme Bilgileri
          </h2>
          <p className="text-xs text-muted-foreground">
            UĞRA platformu bünyesindeki bölgesel ana bayilik lisansı, kapsama alanı ve sözleşmeli yetkilendirme parametreleri.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs border border-emerald-500/20 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            {franchise?.status === 'active' ? 'Lisans Aktif' : 'Sözleşmeli'}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-card text-muted-foreground font-bold text-xs border border-border flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-foreground" />
            Salt Okunur (Kilitli)
          </span>
        </div>
      </div>

      {/* Main Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Bayi & Şirket Bilgileri */}
        <div className="p-6 rounded-[1.65rem] sm:rounded-2xl bg-card border border-border space-y-4 text-xs shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)]">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Bayilik & Kurumsal Tanım
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono font-bold">BÖLGE LİSANSI</span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Bayi Adı:</span>
              <span className="font-bold text-foreground">{franchise?.name || `${cityNameDisplay} Ana Bayiliği`}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Şirket Unvanı:</span>
              <span className="font-bold text-foreground">{franchise?.company_title || `${cityNameDisplay} Uğra Operasyon Hizmetleri A.Ş.`}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Yetkili Şehir:</span>
              <span className="font-bold text-foreground flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                {cityNameDisplay} (Plaka: {city?.plate_code || '54'})
              </span>
            </div>

            <div className="py-1.5 border-b border-border/40 space-y-1.5">
              <span className="text-muted-foreground block">Kapsanan İlçeler:</span>
              <div className="flex flex-wrap gap-1.5">
                {districts.map((d, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-background text-foreground text-[11px] font-medium border border-border">
                    {d}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Sözleşme Komisyon Oranı:</span>
              <span className="font-mono font-black text-foreground text-sm">%{kpis.revenueSharePct}</span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Sözleşme Başlangıç Tarihi:</span>
              <span className="font-medium text-foreground">
                {franchise?.created_at ? new Date(franchise.created_at).toLocaleDateString('tr-TR') : '01.01.2025'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Yetkili Kişi & İletişim Bilgileri */}
        <div className="p-6 rounded-[1.65rem] sm:rounded-2xl bg-card border border-border space-y-4 text-xs shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)]">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Yetkili Yönetici & İrtibat
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono font-bold">FRANCHISE MANAGER</span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Yetkili Kişi:</span>
              <span className="font-bold text-foreground">
                {franchiseManager?.name || franchise?.authorized_person || franchise?.contact_person || 'Yetkili Yönetici'}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Giriş E-Postası:</span>
              <span className="font-mono font-medium text-foreground">
                {franchiseManager?.email || franchise?.email || `${cityNameDisplay.toLowerCase()}@ugra.app`}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">İletişim Telefonu:</span>
              <span className="font-mono font-bold text-foreground">
                {franchise?.phone || '0850 308 84 72'}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-border/40">
              <span className="text-muted-foreground">Banka / IBAN:</span>
              <span className="font-mono text-[11px] font-bold text-foreground truncate max-w-[200px]" title={franchise?.iban || 'TR12 0006 1005 1928 3820 1928 31'}>
                {franchise?.bank_name ? `${franchise.bank_name} - ` : ''}{franchise?.iban || 'TR12 0006 1005 1928 3820 1928 31'}
              </span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Son Veri Senkronizasyonu:</span>
              <span className="font-mono text-foreground flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Gerçek Zamanlı Aktif
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contract & Security Notice */}
      <div className="p-5 rounded-[1.65rem] sm:rounded-2xl bg-card border border-border flex items-start gap-3 text-xs text-muted-foreground shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)]">
        <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-black text-foreground">Sözleşme ve Yetki Sınırları Uyarısı</h4>
          <p className="leading-relaxed">
            Bayilik lisansı kapsamında tüm işletme sözleşmeleri ve finansal hak edişler UĞRA Genel Merkez sözleşme şartlarına tabidir. 
            Yetkili bölge ve komisyon oranlarında yapılacak değişiklikler için Genel Merkez Destek masasına resmi talep oluşturulması gerekmektedir.
          </p>
        </div>
      </div>
    </div>
  );
};
