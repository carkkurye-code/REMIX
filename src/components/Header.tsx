import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User as UserIcon, Package, Inbox, Settings, LogOut, Download, Store, Bike, Building, ShieldCheck, FileText, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useModalBackButton } from '@/hooks/useModalBackButton';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { CustomerAccountModal, CustomerTab } from '@/components/CustomerAccountModal';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerModalTab, setCustomerModalTab] = useState<CustomerTab>('taleplerim');
  const [, setLocation] = useLocation();

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  const { user, profile, role, signOut } = useAuth();

  const isGuest = !user;
  const isAssistant = Boolean(user && (profile?.role === 'assistant' || role === 'assistant'));
  const isPartnerOrAdmin = Boolean(
    user && (
      profile?.role === 'partner' ||
      profile?.role === 'admin' ||
      profile?.role === 'super_admin' ||
      role === 'partner' ||
      role === 'admin' ||
      role === 'super_admin'
    )
  );

  // Portallar görünürlük kontrolü:
  // - Misafir: Asistan Girişi ve Bayi Girişi gösterilir
  // - Asistan: Asistan Girişi gösterilir
  // - Bayi/Admin: Bayi Girişi gösterilir
  // - Müşteri: Asistan ve Bayi girişleri gizlenir
  const showAsistanPortal = isGuest || isAssistant;
  const showBayiPortal = isGuest || isPartnerOrAdmin;
  const showPortalsSection = showAsistanPortal || showBayiPortal;

  useBodyScrollLock(isOpen);
  useModalBackButton(isOpen, () => setIsOpen(false), 'hamburger-menu');

  // Focus trap & ESC key listener for accessible drawer navigation
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          drawerRef.current.focus();
        }
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !drawerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !drawerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      if (triggerRef.current) {
        try {
          triggerRef.current.focus();
        } catch (e) {}
      }
    };
  }, [isOpen]);

  useEffect(() => {
    const handleOpenCustomerModalEvent = (e: Event) => {
      const customEv = e as CustomEvent<{ tab?: CustomerTab }>;
      if (customEv.detail?.tab) {
        setCustomerModalTab(customEv.detail.tab);
      }
      setCustomerModalOpen(true);
    };

    window.addEventListener('open-customer-account-modal', handleOpenCustomerModalEvent);
    return () => {
      window.removeEventListener('open-customer-account-modal', handleOpenCustomerModalEvent);
    };
  }, []);

  const openAuthModal = () => {
    setAuthModalOpen(true);
    setIsOpen(false);
  };

  const handleOpenCustomerTab = (tab: CustomerTab) => {
    setIsOpen(false);
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setCustomerModalTab(tab);
    setCustomerModalOpen(true);
  };

  const navigateTo = (path: string) => {
    setIsOpen(false);
    setLocation(path);
  };

  return (
    <>
      <header 
        className="w-full z-30 py-4 sm:py-6"
        data-testid="main-header"
      >
        <div className="flex items-center justify-between">
          {/* Brand Lockup */}
          <Link href="/" className="group inline-flex flex-col items-start select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
            <span className="font-sans text-[1.65rem] sm:text-[1.75rem] font-extrabold leading-none tracking-[-0.08em] text-foreground transition-colors group-hover:text-foreground/90">
              UĞRA<span className="ml-[2px] text-primary">.</span>
            </span>
            <span className="mt-1.5 font-mono text-[9.5px] sm:text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              ŞEHİR İÇİ ZAMAN ASİSTANINIZ
            </span>
          </Link>

          {/* Right Header: Hamburger Menu Button */}
          <div className="flex items-center gap-2">
            <button 
              ref={triggerRef}
              type="button"
              onClick={() => setIsOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-foreground/15 bg-card/80 text-foreground transition-all duration-300 hover:border-primary/60 hover:text-primary hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95 cursor-pointer"
              aria-label={isOpen ? "Menüyü kapat" : "Menüyü aç"}
              aria-expanded={isOpen}
              aria-controls="ugra-main-drawer"
              data-testid="button-hamburger-menu"
            >
              <Menu className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Customer Account Modal */}
      <CustomerAccountModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        initialTab={customerModalTab}
      />

      {/* Right to Left Drawer Menu */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Clickable Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 z-[9990] bg-foreground/25 backdrop-blur-[4px]"
                aria-hidden="true"
              />

              {/* Drawer Container */}
              <motion.div
                ref={drawerRef}
                id="ugra-main-drawer"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 240 }}
                className="fixed inset-y-0 right-0 z-[9995] bg-card text-foreground border-l border-border flex flex-col justify-between shadow-[0_24px_80px_hsl(256_24%_17%_/_0.2)] w-[88%] sm:w-[380px] max-w-[420px] h-full overflow-y-auto"
                role="dialog"
                aria-modal="true"
                aria-label="Ana Menü"
                tabIndex={-1}
              >
                {/* Header & Close */}
                <div className="flex items-center justify-between p-6 sm:p-7 border-b border-border/60">
                  <div className="inline-flex flex-col items-start">
                    <span className="font-sans text-2xl font-extrabold leading-none tracking-[-0.08em] text-foreground">
                      UĞRA<span className="text-primary">.</span>
                    </span>
                    <span className="mt-1 font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Zamanın sana kalsın
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/15 text-foreground/70 transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                    aria-label="Menüyü kapat"
                    data-testid="button-close-drawer"
                  >
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>

                {/* Content Sections */}
                <div className="flex-1 px-6 sm:px-7 py-6 space-y-6 overflow-y-auto">
                  {/* HESAP BÖLÜMÜ */}
                  <div className="space-y-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                      HESAP
                    </span>

                    {user ? (
                      <div className="rounded-2xl border border-border bg-background/60 p-3.5 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                            {(profile?.full_name || user.email || 'M').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm truncate text-foreground">
                              {profile?.full_name || user.email?.split('@')[0] || 'Müşteri'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email || user.phone || 'Kayıtlı Kullanıcı'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-1.5 pt-2 border-t border-border/60">
                          <button
                            type="button"
                            onClick={() => handleOpenCustomerTab('taleplerim')}
                            className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-sm font-medium hover:bg-card text-foreground transition-colors cursor-pointer text-left"
                          >
                            <span className="flex items-center gap-2.5">
                              <Package className="w-4 h-4 text-primary" />
                              Taleplerim
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenCustomerTab('gelen_kutusu')}
                            className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-sm font-medium hover:bg-card text-foreground transition-colors cursor-pointer text-left"
                          >
                            <span className="flex items-center gap-2.5">
                              <Inbox className="w-4 h-4 text-primary" />
                              Gelen Kutusu
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenCustomerTab('hesap_bilgilerim')}
                            className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-sm font-medium hover:bg-card text-foreground transition-colors cursor-pointer text-left"
                          >
                            <span className="flex items-center gap-2.5">
                              <Settings className="w-4 h-4 text-primary" />
                              Hesap Bilgilerim
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={openAuthModal}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 cursor-pointer"
                        data-testid="button-drawer-login"
                      >
                        <UserIcon className="w-4 h-4" />
                        Giriş Yap / Kayıt Ol
                      </button>
                    )}
                  </div>

                  {/* PORTALLAR & HİZMETLER */}
                  {showPortalsSection && (
                    <div className="space-y-3">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                        PORTALLAR
                      </span>

                      <div className="space-y-1.5">
                        {showAsistanPortal && (
                          <button
                            type="button"
                            onClick={() => navigateTo('/asistan')}
                            className="flex items-center justify-between w-full p-3 rounded-2xl border border-border bg-background/50 hover:bg-background hover:border-primary/40 text-foreground transition-all cursor-pointer text-left group"
                            data-testid="link-drawer-asistan"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Bike className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold leading-tight">Asistan Girişi</p>
                                <p className="text-xs text-muted-foreground">Kurye ve asistan paneli</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        )}

                        {showBayiPortal && (
                          <button
                            type="button"
                            onClick={() => navigateTo('/bayi')}
                            className="flex items-center justify-between w-full p-3 rounded-2xl border border-border bg-background/50 hover:bg-background hover:border-primary/40 text-foreground transition-all cursor-pointer text-left group"
                            data-testid="link-drawer-bayi"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Building className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold leading-tight">Bayi Girişi</p>
                                <p className="text-xs text-muted-foreground">İl / bölge yönetim paneli</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* UYGULAMA YÜKLEME */}
                  <div className="space-y-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                      UYGULAMA
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        window.dispatchEvent(new CustomEvent('trigger-pwa-install'));
                      }}
                      className="flex items-center gap-3 w-full p-3 rounded-2xl border border-border bg-background/50 hover:bg-background hover:border-foreground/30 text-foreground transition-all cursor-pointer text-left"
                    >
                      <Download className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Ana Ekrana Ekle</span>
                    </button>
                  </div>

                  {/* KURUMSAL & YASAL */}
                  <div className="space-y-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                      BİLGİ & YASAL
                    </span>
                    <div className="flex flex-col space-y-2 text-sm text-muted-foreground pl-1">
                      <button
                        type="button"
                        onClick={() => navigateTo('/tasima-kosullari')}
                        className="flex items-center gap-2 text-left hover:text-foreground transition-colors cursor-pointer py-0.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Taşıma Koşulları
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateTo('/privacy')}
                        className="flex items-center gap-2 text-left hover:text-foreground transition-colors cursor-pointer py-0.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Gizlilik Politikası
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateTo('/terms')}
                        className="flex items-center gap-2 text-left hover:text-foreground transition-colors cursor-pointer py-0.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Kullanım Koşulları
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Section / Logout */}
                {user && (
                  <div className="p-6 sm:p-7 border-t border-border/60 bg-background/30 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
                    <button
                      type="button"
                      onClick={async () => {
                        setIsOpen(false);
                        await signOut();
                      }}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-red-500/20 text-red-600 hover:bg-red-500/10 transition-colors text-xs font-semibold cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Oturumu Kapat
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

