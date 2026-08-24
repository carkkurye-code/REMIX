import React, { useState, useEffect } from 'react';
import { 
  Bike, Check, X, Search, Phone, Mail, ShieldAlert, Trash2, AlertCircle, CheckCircle2, MapPin, Building, PackageCheck
} from 'lucide-react';
import { AssistantApplication, db, City, Franchise } from '@/lib/supabase';
import { ConfirmModal } from './ConfirmModal';

interface AdminAssistantAppsTabProps {
  applications: AssistantApplication[];
  onRefresh: () => void;
  setApplications: React.Dispatch<React.SetStateAction<AssistantApplication[]>>;
}

export const AdminAssistantAppsTab: React.FC<AdminAssistantAppsTabProps> = ({
  applications,
  onRefresh,
  setApplications
}) => {
  const pendingApps = applications.filter(a => a.status === 'pending');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [cList, fList] = await Promise.all([
          db.getCities(),
          db.getFranchises()
        ]);
        setCities(cList || []);
        setFranchises(fList || []);
      } catch (err) {
        console.warn('Error loading cities/franchises in assistant admin tab:', err);
      }
    };
    loadMetadata();
  }, []);

  const getCityName = (cityId?: string | null, fallbackCity?: string | null) => {
    if (cityId) {
      const match = cities.find(c => c.id === cityId);
      if (match) return match.name;
    }
    return fallbackCity || null;
  };

  const getFranchiseName = (franchiseId?: string | null) => {
    if (franchiseId) {
      const match = franchises.find(f => f.id === franchiseId);
      if (match) return match.name;
    }
    return null;
  };

  const getPackageInfo = (app: AssistantApplication) => {
    let pkgName = (app as any).subscription_package_name;
    let pkgPrice = (app as any).subscription_package_price;
    const pkgId = (app as any).subscription_package;

    if (!pkgName && pkgId) {
      if (pkgId === '3_aylik') { pkgName = '3 Aylık'; if (pkgPrice == null) pkgPrice = 2700; }
      else if (pkgId === '6_aylik') { pkgName = '6 Aylık'; if (pkgPrice == null) pkgPrice = 5100; }
      else if (pkgId === '9_aylik') { pkgName = '9 Aylık'; if (pkgPrice == null) pkgPrice = 7200; }
      else if (pkgId === '12_aylik') { pkgName = '12 Aylık'; if (pkgPrice == null) pkgPrice = 8400; }
    }

    if ((!pkgName || pkgPrice == null) && app.notes) {
      const match = app.notes.match(/\[Seçilen Paket:\s*([^\]]+)\]/);
      if (match && match[1]) {
        const fullText = match[1];
        const priceMatch = fullText.match(/\(([\d.,]+)\s*TL\)/i);
        if (priceMatch && priceMatch[1] && pkgPrice == null) {
          pkgPrice = priceMatch[1] + ' TL';
        }
        if (!pkgName) {
          pkgName = fullText.replace(/\([^)]+\)/, '').trim();
        }
      }
    }

    const formattedName = pkgName ? String(pkgName).replace(/ Paket$/i, '').trim() : '12 Aylık';
    
    let formattedPrice = '';
    if (typeof pkgPrice === 'number') {
      formattedPrice = `${pkgPrice.toLocaleString('tr-TR')} TL`;
    } else if (typeof pkgPrice === 'string' && pkgPrice.trim()) {
      formattedPrice = pkgPrice.includes('TL') ? pkgPrice : `${pkgPrice} TL`;
    } else {
      if (pkgId === '3_aylik' || formattedName.includes('3')) formattedPrice = '2.700 TL';
      else if (pkgId === '6_aylik' || formattedName.includes('6')) formattedPrice = '5.100 TL';
      else if (pkgId === '9_aylik' || formattedName.includes('9')) formattedPrice = '7.200 TL';
      else formattedPrice = '8.400 TL';
    }

    return {
      name: formattedName,
      price: formattedPrice
    };
  };

  // Reject Reason Modal
  const [rejectingApp, setRejectingApp] = useState<AssistantApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Confirm Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
    isDanger?: boolean;
  }>({ isOpen: false, title: '', description: '', action: async () => {} });

  const filteredApps = (pendingApps || []).filter(a => {
    if (!a) return false;
    const nameStr = String(a.full_name ?? '');
    const phoneStr = String(a.phone ?? '');
    const emailStr = String(a.email ?? '');
    const termStr = String(searchTerm ?? '').toLowerCase();

    return nameStr.toLowerCase().includes(termStr) ||
           phoneStr.includes(searchTerm) ||
           emailStr.toLowerCase().includes(termStr);
  });

  const toggleSelectAll = () => {
    if (selectedAppIds.length === filteredApps.length) {
      setSelectedAppIds([]);
    } else {
      setSelectedAppIds(filteredApps.map(a => a.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedAppIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Actions
  const handleApprove = async (app: AssistantApplication) => {
    if (!app || !app.id) {
      alert('Onaylama hatası: Başvuru ID bulunamadı.');
      return;
    }
    console.log("1 handleApprove", app.id, app.full_name);
    const res = await db.updateAssistantApplicationStatus(app.id, 'onaylandi');
    if (res && res.error) {
      alert(`Onaylama hatası: ${res.error}`);
    } else {
      setApplications(prev => prev.filter(a => a.id !== app.id));
      if (onRefresh) onRefresh();
    }
  };

  const handleOpenReject = (app: AssistantApplication) => {
    setRejectingApp(app);
    setRejectReason('');
    setRejectError(null);
  };

  const confirmReject = async () => {
    if (!rejectingApp) return;
    if (!rejectReason.trim()) {
      setRejectError('Lütfen reddetme nedenini giriniz.');
      return;
    }
    setApplications(prev => prev.filter(a => a.id !== rejectingApp.id));
    await db.updateAssistantApplicationStatus(rejectingApp.id, 'reddedildi');
    setRejectingApp(null);
    if (onRefresh) onRefresh();
  };

  const handleDelete = async (app: AssistantApplication) => {
    setConfirmModal({
      isOpen: true,
      title: 'Kurye Başvurusunu Sil',
      description: `${app.full_name} başvurusunu silmek istediğinize emin misiniz?`,
      isDanger: true,
      action: async () => {
        setApplications(prev => prev.filter(a => a.id !== app.id));
        await db.deleteAssistant(app.id);
        if (onRefresh) onRefresh();
      }
    });
  };

  // Bulk Actions
  const handleBulkApprove = async () => {
    for (const id of selectedAppIds) {
      await db.updateAssistantApplicationStatus(id, 'onaylandi');
    }
    setApplications(prev => prev.filter(a => !selectedAppIds.includes(a.id)));
    setSelectedAppIds([]);
    if (onRefresh) onRefresh();
  };

  const handleBulkDelete = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Toplu Başvuru Sil',
      description: `Seçilen ${selectedAppIds.length} kurye başvurusunu silmek üzeresiniz.`,
      isDanger: true,
      action: async () => {
        for (const id of selectedAppIds) {
          await db.deleteAssistant(id);
        }
        setApplications(prev => prev.filter(a => !selectedAppIds.includes(a.id)));
        setSelectedAppIds([]);
        if (onRefresh) onRefresh();
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-[1.65rem] sm:rounded-2xl border border-border shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)]">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Asistan (Kurye) Başvuruları</h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">Saha teslimat ekibine katılmak isteyen kuryelerin sürücü ve evrak başvuruları.</p>
        </div>
        <div className="px-3.5 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-700 dark:text-blue-400 font-bold text-xs flex items-center gap-2 shadow-sm">
          <Bike className="w-4 h-4 text-blue-600 dark:text-blue-400" /> {pendingApps.length} Onay Bekleyen Başvuru
        </div>
      </div>

      {/* SEARCH & BULK ACTIONS */}
      <div className="bg-card border border-border p-4 rounded-[1.65rem] sm:rounded-2xl space-y-3 shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)]">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Kurye adı, şehir veya telefon ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 bg-background border border-border rounded-xl pl-9 pr-3 text-xs font-medium text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm placeholder:text-muted-foreground/60"
          />
        </div>

        {selectedAppIds.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs shadow-sm">
            <span className="font-bold text-blue-700 dark:text-blue-400">{selectedAppIds.length} başvuru seçildi</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBulkApprove}
                className="px-3.5 py-1.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 cursor-pointer transition-all shadow-sm active:scale-95 border-0"
              >
                Toplu Onayla
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-3.5 py-1.5 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 font-bold rounded-xl hover:bg-red-500/20 cursor-pointer transition-all shadow-sm active:scale-95"
              >
                Toplu Sil
              </button>
            </div>
          </div>
        )}
      </div>

      {/* APPLICATIONS LIST */}
      <div className="space-y-3">
        {filteredApps.length === 0 ? (
          <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-semibold text-foreground">Onay bekleyen başvuru bulunmuyor.</p>
          </div>
        ) : (
          filteredApps.map((app) => {
            const isChecked = selectedAppIds.includes(app.id);
            const pkgInfo = getPackageInfo(app);
            const cityName = getCityName(app.city_id, (app as any).city);
            const franchiseName = getFranchiseName(app.franchise_id);

            return (
              <div key={app.id} className={`p-5 bg-card border rounded-[1.65rem] sm:rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)] hover:shadow-md ${isChecked ? 'border-primary/60 bg-primary/5' : 'border-border'}`}>
                <div className="flex items-start gap-3.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSelect(app.id)}
                    className="mt-1 rounded border-border text-primary focus:ring-0 cursor-pointer w-4 h-4"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 shadow-sm">
                    <Bike className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-foreground text-sm">
                        {app.full_name}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 capitalize">
                        {app.vehicle_type || 'Motosiklet'}
                      </span>
                      {cityName && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent/40 text-foreground border border-border flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          {cityName}
                        </span>
                      )}
                      {franchiseName && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <Building className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          {franchiseName}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-medium">
                      <span>Tel: <span className="font-mono text-foreground">{app.phone}</span></span>
                      {app.email && <span>• E-posta: <span className="text-foreground">{app.email}</span></span>}
                    </div>

                    {/* PAKET & ÖDENECEK TUTAR BİLGİSİ */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground font-medium">Paket:</span>
                        <span className="font-bold text-purple-700 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                          {pkgInfo.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground font-medium">Ödenecek Tutar:</span>
                        <span className="font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                          {pkgInfo.price}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0 border-t md:border-t-0 border-border pt-3 md:pt-0">
                  <button
                    type="button"
                    onClick={() => handleApprove(app)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 border-0 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" /> Onayla
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenReject(app)}
                    className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 font-bold text-xs hover:bg-red-500/20 cursor-pointer flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                  >
                    <X className="w-3.5 h-3.5" /> Reddet
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* REJECT MODAL */}
      {rejectingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-[1.65rem] sm:rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative text-xs text-foreground">
            <button
              type="button"
              onClick={() => setRejectingApp(null)}
              aria-label="Kapat"
              title="Kapat"
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-card hover:bg-accent/40 border border-border text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-foreground">Başvuruyu Reddet ({rejectingApp.full_name})</h3>
            <p className="text-muted-foreground">Kuryeye iletilecek red nedenini giriniz:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Örn: Sürücü belgesi süresi dolmuş veya okunamıyor."
              rows={3}
              className="w-full bg-background border border-border rounded-xl p-3 text-foreground focus:border-red-500 focus:outline-none"
            />
            {rejectError && <p className="text-red-600 font-bold text-[11px]">{rejectError}</p>}

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setRejectingApp(null)}
                className="px-4 py-2 rounded-xl border border-border text-foreground font-semibold hover:bg-accent/40 bg-card cursor-pointer shadow-sm"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={confirmReject}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 cursor-pointer shadow-sm border-0"
              >
                Reddet
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.action}
        title={confirmModal.title}
        description={confirmModal.description}
        isDanger={confirmModal.isDanger}
      />
    </div>
  );
};
