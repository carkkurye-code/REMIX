import React, { useState } from 'react';
import { 
  Building, MapPin, Plus, Search, Edit2, Check, X, Shield, 
  Phone, Mail, Percent, Layers, AlertCircle, RefreshCw, ChevronRight, CheckCircle2, XCircle
} from 'lucide-react';
import { City, Franchise, db } from '@/lib/supabase';

interface AdminFranchisesTabProps {
  cities: City[];
  franchises: Franchise[];
  onRefresh: () => void;
  setCities: React.Dispatch<React.SetStateAction<City[]>>;
  setFranchises: React.Dispatch<React.SetStateAction<Franchise[]>>;
}

export function AdminFranchisesTab({
  cities,
  franchises,
  onRefresh,
  setCities,
  setFranchises
}: AdminFranchisesTabProps) {
  const [subTab, setSubTab] = useState<'franchises' | 'cities'>('franchises');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal States
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [cityName, setCityName] = useState('');
  const [cityPlate, setCityPlate] = useState<number | ''>('');
  const [cityLat, setCityLat] = useState<number | ''>('');
  const [cityLng, setCityLng] = useState<number | ''>('');
  const [cityActive, setCityActive] = useState(true);

  const [isFranchiseModalOpen, setIsFranchiseModalOpen] = useState(false);
  const [editingFranchise, setEditingFranchise] = useState<Franchise | null>(null);
  const [fCityId, setFCityId] = useState('');
  const [fName, setFName] = useState('');
  const [fCompanyTitle, setFCompanyTitle] = useState('');
  const [fAuthorizedPerson, setFAuthorizedPerson] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPassword, setFPassword] = useState('');
  const [fStatus, setFStatus] = useState<'active' | 'suspended' | 'passive'>('active');
  const [fRevenueShare, setFRevenueShare] = useState<number>(0);
  const [fDistrictsText, setFDistrictsText] = useState('');

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Open City Modal
  const handleOpenCityModal = (city?: City) => {
    if (city) {
      setEditingCity(city);
      setCityName(city.name);
      setCityPlate(city.plate_code);
      setCityLat(city.center_lat ?? '');
      setCityLng(city.center_lng ?? '');
      setCityActive(city.is_active);
    } else {
      setEditingCity(null);
      setCityName('');
      setCityPlate('');
      setCityLat('');
      setCityLng('');
      setCityActive(true);
    }
    setIsCityModalOpen(true);
  };

  // Save City
  const handleSaveCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityName.trim() || cityPlate === '') {
      showFeedback('Lütfen şehir adı ve plaka kodunu eksiksiz doldurunuz.', 'error');
      return;
    }

    try {
      setActionLoading(true);
      if (editingCity) {
        const updated = await db.updateCity(editingCity.id, {
          name: cityName.trim(),
          plate_code: Number(cityPlate),
          center_lat: cityLat !== '' ? Number(cityLat) : null,
          center_lng: cityLng !== '' ? Number(cityLng) : null,
          is_active: cityActive
        });
        setCities(prev => prev.map(c => c.id === updated.id ? updated : c));
        showFeedback(`${updated.name} şehri başarıyla güncellendi.`);
      } else {
        const created = await db.createCity({
          name: cityName.trim(),
          plate_code: Number(cityPlate),
          center_lat: cityLat !== '' ? Number(cityLat) : null,
          center_lng: cityLng !== '' ? Number(cityLng) : null,
          is_active: cityActive
        });
        setCities(prev => [...prev, created].sort((a, b) => a.plate_code - b.plate_code));
        showFeedback(`${created.name} şehri sisteme eklendi.`);
      }
      setIsCityModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showFeedback(err?.message || 'Şehir kaydedilirken bir hata oluştu.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle City Active
  const handleToggleCityActive = async (city: City) => {
    try {
      setActionLoading(true);
      const updated = await db.toggleCityActive(city.id, !city.is_active);
      setCities(prev => prev.map(c => c.id === updated.id ? updated : c));
      showFeedback(`${city.name} ${!city.is_active ? 'aktif edildi' : 'pasife alındı'}.`);
    } catch (err: any) {
      showFeedback(err?.message || 'Durum değiştirilemedi.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Franchise Modal
  const handleOpenFranchiseModal = (franchise?: Franchise) => {
    if (franchise) {
      setEditingFranchise(franchise);
      setFCityId(franchise.city_id);
      setFName(franchise.name);
      setFCompanyTitle(franchise.company_title || '');
      setFAuthorizedPerson(franchise.authorized_person || '');
      setFPhone(franchise.phone || '');
      setFEmail(franchise.email || '');
      setFPassword('');
      setFStatus(franchise.status || 'active');
      setFRevenueShare(franchise.revenue_share_percentage || 0);
      setFDistrictsText(franchise.districts_covered?.join(', ') || '');
    } else {
      setEditingFranchise(null);
      setFCityId(cities[0]?.id || '');
      setFName('');
      setFCompanyTitle('');
      setFAuthorizedPerson('');
      setFPhone('');
      setFEmail('');
      setFPassword('');
      setFStatus('active');
      setFRevenueShare(0);
      setFDistrictsText('');
    }
    setIsFranchiseModalOpen(true);
  };

  // Save Franchise
  const handleSaveFranchise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim() || !fCityId) {
      showFeedback('Lütfen bayi adı ve bağlı olduğu şehri seçiniz.', 'error');
      return;
    }

    const districts = fDistrictsText
      .split(',')
      .map(d => d.trim())
      .filter(Boolean);

    try {
      setActionLoading(true);
      let franchiseId: string;

      if (editingFranchise) {
        const updated = await db.updateFranchise(editingFranchise.id, {
          city_id: fCityId,
          name: fName.trim(),
          company_title: fCompanyTitle.trim() || null,
          authorized_person: fAuthorizedPerson.trim() || null,
          phone: fPhone.trim() || null,
          email: fEmail.trim() || null,
          status: fStatus,
          revenue_share_percentage: Number(fRevenueShare),
          districts_covered: districts
        });
        franchiseId = updated.id;
        setFranchises(prev => prev.map(f => f.id === updated.id ? updated : f));
        showFeedback(`${updated.name} bayisi güncellendi.`);
      } else {
        const created = await db.createFranchise({
          city_id: fCityId,
          name: fName.trim(),
          company_title: fCompanyTitle.trim() || null,
          authorized_person: fAuthorizedPerson.trim() || null,
          phone: fPhone.trim() || null,
          email: fEmail.trim() || null,
          status: fStatus,
          revenue_share_percentage: Number(fRevenueShare),
          districts_covered: districts
        });
        franchiseId = created.id;
        setFranchises(prev => [created, ...prev]);
        showFeedback(`${created.name} bayisi sisteme eklendi.`);
      }

      // Provision or update Franchise Manager User if Email is provided
      if (fEmail.trim()) {
        try {
          await db.createOrUpdateFranchiseManager({
            franchise_id: franchiseId,
            city_id: fCityId,
            email: fEmail.trim(),
            password: fPassword.trim() || undefined,
            full_name: fAuthorizedPerson.trim() || `${fName.trim()} Yöneticisi`,
            phone: fPhone.trim() || undefined,
          });
        } catch (authErr) {
          console.warn('Franchise manager account sync note:', authErr);
        }
      }

      setIsFranchiseModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showFeedback(err?.message || 'Bayi kaydedilirken hata oluştu.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Cities
  const filteredCities = cities.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.plate_code.toString().includes(q);
  });

  // Filtered Franchises
  const filteredFranchises = franchises.filter(f => {
    if (selectedCityFilter !== 'all' && f.city_id !== selectedCityFilter) return false;
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      (f.company_title && f.company_title.toLowerCase().includes(q)) ||
      (f.authorized_person && f.authorized_person.toLowerCase().includes(q)) ||
      (f.city_name && f.city_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* FEEDBACK TOAST */}
      {feedbackMsg && (
        <div className={`p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 transition-all ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' 
            : 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20'
        }`}>
          {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-[1.65rem] sm:rounded-2xl border border-border shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-accent/40 text-foreground border border-border">
              <MapPin className="w-5 h-5 text-foreground" />
            </span>
            <h1 className="text-2xl font-black text-foreground">Şehirler & Bayiler (Franchise)</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            UĞRA Türkiye geneli il bazlı operasyon bölgeleri ve yetkili bayi yönetimi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {subTab === 'cities' ? (
            <button
              onClick={() => handleOpenCityModal()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-sm active:scale-95 border-0"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Şehir Ekle</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenFranchiseModal()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-sm active:scale-95 border-0"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Bayi Ekle</span>
            </button>
          )}
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card p-5 rounded-[1.65rem] sm:rounded-2xl border border-border shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tanımlı Şehir</span>
            <h3 className="text-2xl font-black text-foreground mt-1">{cities.length}</h3>
          </div>
          <span className="p-3 bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-xl border border-blue-500/20">
            <MapPin className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-card p-5 rounded-[1.65rem] sm:rounded-2xl border border-border shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Aktif Bayiler</span>
            <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
              {franchises.filter(f => f.status === 'active').length}
            </h3>
          </div>
          <span className="p-3 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
            <Building className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-card p-5 rounded-[1.65rem] sm:rounded-2xl border border-border shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Toplam Bayi</span>
            <h3 className="text-2xl font-black text-foreground mt-1">{franchises.length}</h3>
          </div>
          <span className="p-3 bg-purple-500/10 text-purple-700 dark:text-purple-400 rounded-xl border border-purple-500/20">
            <Layers className="w-6 h-6" />
          </span>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION & SEARCH / FILTERS */}
      <div className="bg-card p-4 rounded-[1.65rem] sm:rounded-2xl border border-border shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-2 bg-accent/30 p-1 rounded-xl border border-border">
            <button
              onClick={() => setSubTab('franchises')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer border-0 ${
                subTab === 'franchises'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Bayiler (Franchise) ({franchises.length})
            </button>
            <button
              onClick={() => setSubTab('cities')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer border-0 ${
                subTab === 'cities'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Şehirler & İller ({cities.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="İsim, yetkili veya şehir ara..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-xl outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/60"
              />
            </div>

            {subTab === 'franchises' && (
              <>
                <select
                  value={selectedCityFilter}
                  onChange={e => setSelectedCityFilter(e.target.value)}
                  className="text-xs bg-background border border-border rounded-xl px-3 py-2 outline-none text-foreground font-bold focus:border-primary"
                >
                  <option value="all">Tüm Şehirler</option>
                  {cities.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.plate_code} - {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="text-xs bg-background border border-border rounded-xl px-3 py-2 outline-none text-foreground font-bold focus:border-primary"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="active">Aktif</option>
                  <option value="suspended">Askıda</option>
                  <option value="passive">Pasif</option>
                </select>
              </>
            )}
          </div>
        </div>

        {/* CITIES LIST */}
        {subTab === 'cities' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-bold">Plaka</th>
                  <th className="py-3 px-4 font-bold">Şehir Adı</th>
                  <th className="py-3 px-4 font-bold">Merkez Koordinat</th>
                  <th className="py-3 px-4 font-bold">Bağlı Bayi Sayısı</th>
                  <th className="py-3 px-4 font-bold">Durum</th>
                  <th className="py-3 px-4 font-bold text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredCities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground font-bold">
                      Arama kriterine uygun şehir bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredCities.map(city => {
                    const linkedCount = franchises.filter(f => f.city_id === city.id).length;
                    return (
                      <tr key={city.id} className="hover:bg-accent/20 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-black text-sm text-foreground">
                          <span className="px-2.5 py-1 bg-accent/30 border border-border rounded-lg">
                            {city.plate_code.toString().padStart(2, '0')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-black text-sm text-foreground">
                          {city.name}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground font-mono">
                          {city.center_lat && city.center_lng ? (
                            `${city.center_lat.toFixed(4)}, ${city.center_lng.toFixed(4)}`
                          ) : (
                            <span className="text-muted-foreground/60 italic">Belirtilmedi</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 font-bold text-[11px]">
                            {linkedCount} Bayi
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleCityActive(city)}
                            disabled={actionLoading}
                            className={`px-3 py-1 rounded-lg text-[11px] font-black border transition-all cursor-pointer ${
                              city.is_active
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20'
                                : 'bg-accent/30 text-muted-foreground border-border hover:bg-accent/50'
                            }`}
                          >
                            {city.is_active ? 'Aktif' : 'Pasif'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenCityModal(city)}
                            className="p-1.5 hover:bg-accent/40 text-muted-foreground hover:text-foreground rounded-lg transition-all cursor-pointer border-0 bg-transparent"
                            title="Şehri Düzenle"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* FRANCHISES LIST */}
        {subTab === 'franchises' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-bold">Bayi / Şube</th>
                  <th className="py-3 px-4 font-bold">Şehir</th>
                  <th className="py-3 px-4 font-bold">Yetkili / Şirket</th>
                  <th className="py-3 px-4 font-bold">İletişim</th>
                  <th className="py-3 px-4 font-bold">Gelir Payı</th>
                  <th className="py-3 px-4 font-bold">Kapsanan İlçeler</th>
                  <th className="py-3 px-4 font-bold">Durum</th>
                  <th className="py-3 px-4 font-bold text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredFranchises.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground font-bold">
                      Arama kriterine uygun bayi bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredFranchises.map(franchise => {
                    const cityName = franchise.city_name || cities.find(c => c.id === franchise.city_id)?.name || 'Bilinmiyor';
                    return (
                      <tr key={franchise.id} className="hover:bg-accent/20 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-black text-sm text-foreground">{franchise.name}</div>
                          {franchise.company_title && (
                            <div className="text-[11px] text-muted-foreground mt-0.5">{franchise.company_title}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-accent/30 border border-border font-extrabold text-foreground">
                            {cityName}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-foreground">
                            {franchise.authorized_person || <span className="text-muted-foreground/60 font-normal italic">Atanmadı</span>}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 space-y-1">
                          {franchise.phone && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Phone className="w-3.5 h-3.5 text-muted-foreground/70" />
                              <span>{franchise.phone}</span>
                            </div>
                          )}
                          {franchise.email && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Mail className="w-3.5 h-3.5 text-muted-foreground/70" />
                              <span>{franchise.email}</span>
                            </div>
                          )}
                          {!franchise.phone && !franchise.email && (
                            <span className="text-muted-foreground/60 italic">İletişim yok</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                          %{franchise.revenue_share_percentage || 0}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {franchise.districts_covered && franchise.districts_covered.length > 0 ? (
                              franchise.districts_covered.slice(0, 3).map((dist, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded-md bg-accent/40 text-foreground text-[10px] font-bold border border-border/50">
                                  {dist}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted-foreground/60 italic text-[11px]">Tüm Şehir</span>
                            )}
                            {franchise.districts_covered && franchise.districts_covered.length > 3 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-accent/50 text-foreground text-[10px] font-bold border border-border/50">
                                +{franchise.districts_covered.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {franchise.status === 'active' && (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-bold text-[10px] uppercase">
                              Aktif
                            </span>
                          )}
                          {franchise.status === 'suspended' && (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-bold text-[10px] uppercase">
                              Askıda
                            </span>
                          )}
                          {franchise.status === 'passive' && (
                            <span className="px-2.5 py-1 rounded-lg bg-accent/30 text-muted-foreground border border-border font-bold text-[10px] uppercase">
                              Pasif
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href="/bayi"
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-bold inline-flex items-center gap-1 transition-all no-underline shadow-sm"
                              title="Bayi Paneline Git"
                            >
                              <span>Bayi Paneli</span>
                              <ChevronRight className="w-3 h-3" />
                            </a>
                            <button
                              onClick={() => handleOpenFranchiseModal(franchise)}
                              className="p-1.5 hover:bg-accent/40 text-muted-foreground hover:text-foreground rounded-lg transition-all cursor-pointer border-0 bg-transparent"
                              title="Bayiyi Düzenle"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* CITY CREATE / EDIT MODAL */}
      {isCityModalOpen && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-[1.65rem] sm:rounded-2xl p-6 shadow-2xl border border-border space-y-5 animate-in zoom-in-95 duration-200 text-foreground">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-black text-foreground">
                {editingCity ? 'Şehri Düzenle' : 'Yeni Şehir Ekle'}
              </h3>
              <button
                onClick={() => setIsCityModalOpen(false)}
                className="p-1.5 hover:bg-accent/40 rounded-xl text-muted-foreground hover:text-foreground transition-all border-0 bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCity} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-foreground mb-1.5">Şehir Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Sakarya, Kocaeli, İzmir"
                  value={cityName}
                  onChange={e => setCityName(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary outline-none rounded-xl p-3 text-xs text-foreground font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-foreground mb-1.5">Plaka Kodu *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={81}
                  placeholder="Örn: 54, 41, 35"
                  value={cityPlate}
                  onChange={e => setCityPlate(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-background border border-border focus:border-primary outline-none rounded-xl p-3 text-xs text-foreground font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-foreground mb-1.5">Merkez Lat</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="40.7731"
                    value={cityLat}
                    onChange={e => setCityLat(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-background border border-border focus:border-primary outline-none rounded-xl p-3 text-xs text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-foreground mb-1.5">Merkez Lng</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="30.4005"
                    value={cityLng}
                    onChange={e => setCityLng(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-background border border-border focus:border-primary outline-none rounded-xl p-3 text-xs text-foreground"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="cityActiveInput"
                  checked={cityActive}
                  onChange={e => setCityActive(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-0 cursor-pointer"
                />
                <label htmlFor="cityActiveInput" className="text-xs font-bold text-foreground cursor-pointer">
                  Şehir Operasyonu Aktif Olsun
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCityModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-border text-xs font-extrabold text-foreground hover:bg-accent/40 transition-all cursor-pointer bg-card"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-xs font-extrabold text-primary-foreground transition-all cursor-pointer border-0 shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FRANCHISE CREATE / EDIT MODAL */}
      {isFranchiseModalOpen && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card w-full max-w-lg rounded-[1.65rem] sm:rounded-2xl p-6 shadow-2xl border border-border space-y-5 my-8 animate-in zoom-in-95 duration-200 text-foreground">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-lg font-black text-foreground">
                {editingFranchise ? 'Bayiyi Düzenle' : 'Yeni Bayi Ekle'}
              </h3>
              <button
                onClick={() => setIsFranchiseModalOpen(false)}
                className="p-1.5 hover:bg-accent/40 rounded-xl text-muted-foreground hover:text-foreground transition-all border-0 bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFranchise} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-foreground mb-1.5">Bağlı Şehir (İl) *</label>
                <select
                  required
                  value={fCityId}
                  onChange={e => setFCityId(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary outline-none rounded-xl p-3 text-xs text-foreground font-bold"
                >
                  <option value="">Şehir Seçiniz</option>
                  {cities.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.plate_code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-foreground mb-1.5">Bayi Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Sakarya Ana Bayi, Hendek Şubesi, İzmit Bayi"
                  value={fName}
                  onChange={e => setFName(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary outline-none rounded-xl p-3 text-xs text-foreground font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-foreground mb-1.5">Şirket Resmi Ünvanı</label>
                <input
                  type="text"
                  placeholder="Örn: ABC Lojistik ve Dağıtım Ltd. Şti."
                  value={fCompanyTitle}
                  onChange={e => setFCompanyTitle(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary outline-none rounded-xl p-3 text-xs text-foreground"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-foreground mb-1.5">Yetkili Kişi</label>
                  <input
                    type="text"
                    placeholder="Ad Soyad"
                    value={fAuthorizedPerson}
                    onChange={e => setFAuthorizedPerson(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary outline-none rounded-xl p-3 text-xs text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-foreground mb-1.5">Telefon</label>
                  <input
                    type="tel"
                    placeholder="05XX XXX XX XX"
                    value={fPhone}
                    onChange={e => setFPhone(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary outline-none rounded-xl p-3 text-xs text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-foreground mb-1.5">Bayi Giriş E-posta (Yetkili Hesabı)</label>
                  <input
                    type="email"
                    placeholder="kocaeli@ugra.app"
                    value={fEmail}
                    onChange={e => setFEmail(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary outline-none rounded-xl p-3 text-xs text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-foreground mb-1.5">
                    {editingFranchise ? 'Yeni Giriş Şifresi (Opsiyonel)' : 'Başlangıç Giriş Şifresi'}
                  </label>
                  <input
                    type="password"
                    placeholder={editingFranchise ? 'Değiştirmek için giriniz' : 'En az 6 karakter'}
                    value={fPassword}
                    onChange={e => setFPassword(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary outline-none rounded-xl p-3 text-xs text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-foreground mb-1.5">Gelir Paylaşım Oranı (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="0"
                    value={fRevenueShare}
                    onChange={e => setFRevenueShare(Number(e.target.value))}
                    className="w-full bg-background border border-border focus:border-primary outline-none rounded-xl p-3 text-xs text-foreground font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-foreground mb-1.5">Durum</label>
                  <select
                    value={fStatus}
                    onChange={e => setFStatus(e.target.value as any)}
                    className="w-full bg-background border border-border focus:border-primary outline-none rounded-xl p-3 text-xs text-foreground font-bold"
                  >
                    <option value="active">Aktif</option>
                    <option value="suspended">Askıya Alındı</option>
                    <option value="passive">Pasif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-foreground mb-1.5">Kapsanan İlçeler (Virgülle ayırarak yazınız)</label>
                <textarea
                  rows={2}
                  placeholder="Adapazarı, Serdivan, Erenler, Hendek..."
                  value={fDistrictsText}
                  onChange={e => setFDistrictsText(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary outline-none rounded-xl p-3 text-xs text-foreground"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsFranchiseModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-border text-xs font-extrabold text-foreground hover:bg-accent/40 transition-all cursor-pointer bg-card"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-xs font-extrabold text-primary-foreground transition-all cursor-pointer border-0 shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
