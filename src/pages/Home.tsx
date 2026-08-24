import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { SelectionModal } from '@/components/SelectionModal';

const ROTATING_SLOGANS = ["Senin İçin UĞRA'yalım", "Senin Yerine UĞRA'yalım"];

function RotatingSlogan() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => {
        setPrevIdx(prev);
        return (prev + 1) % ROTATING_SLOGANS.length;
      });
    }, 3600);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-x-1.5 text-sm leading-6 text-muted-foreground sm:text-[15px] sm:leading-7">
      <span className="whitespace-nowrap">Gitmeye Vakit Bulamadığın Her Yere</span>
      <span className="relative inline-flex h-6 items-center overflow-hidden sm:h-7" aria-live="polite">
        <span className="invisible whitespace-nowrap" aria-hidden="true">
          Senin Yerine UĞRA'yalım
        </span>
        {prevIdx !== null && (
          <span
            key={`prev-${prevIdx}-${currentIdx}`}
            className="animate-slide-out-up absolute inset-0 flex items-center whitespace-nowrap"
            aria-hidden="true"
          >
            {ROTATING_SLOGANS[prevIdx]}
          </span>
        )}
        <span
          key={`curr-${currentIdx}`}
          className={`absolute inset-0 flex items-center whitespace-nowrap ${prevIdx !== null ? "animate-slide-in-up" : ""}`}
        >
          {ROTATING_SLOGANS[currentIdx]}
        </span>
      </span>
    </div>
  );
}

export function Home() {
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'hemen' | 'gecerken' | null>(null);

  const handleSelectType = (type: 'hemen' | 'gecerken') => {
    setSelectedType(type);
    setIsSelectionModalOpen(true);
  };

  return (
    <main className="grain relative min-h-[100dvh] overflow-hidden bg-background">
      <div className="pointer-events-none absolute left-[-90px] top-[18%] h-56 w-56 rounded-full bg-primary/10 blur-3xl sm:left-[-30px]" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-[-90px] right-[-70px] h-72 w-72 rounded-full bg-accent/40 blur-3xl" aria-hidden="true" />
      
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1280px] flex-col px-5 pb-6 sm:px-8 lg:px-12 justify-between">
        {/* Main Header with Brand and Hamburger Menu */}
        <Header />

        {/* Hero Section */}
        <section className="flex flex-1 flex-col justify-center pb-8 pt-6 sm:pb-12 sm:pt-8 lg:pt-4">
          <div className="mx-auto w-full max-w-[880px]">
            <h1 className="animate-rise-in-delay-1 max-w-[920px] font-serif text-[2.65rem] min-[390px]:text-[3.1rem] sm:text-[5.2rem] md:text-[6.2rem] lg:text-[7.2rem] leading-[.92] sm:leading-[.88] tracking-[-0.04em] text-foreground" data-testid="text-home-heading">
              İşini<br />
              <span className="not-italic text-primary">hallettirmenin</span><br />
              <span className="inline-block whitespace-nowrap">kolay ve hızlı yolu.</span>
            </h1>
            <div className="animate-rise-in-delay-2 mt-7 sm:mt-9 flex max-w-[640px] items-center gap-3">
              <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              <RotatingSlogan />
            </div>
          </div>

          <div className="animate-rise-in-delay-3 mx-auto mt-8 sm:mt-11 w-full max-w-[880px]">
            <div className="grid gap-3.5 sm:grid-cols-2">
              {/* Hemen UĞRA Card */}
              <button
                type="button"
                onClick={() => handleSelectType('hemen')}
                className="group relative flex min-h-[190px] sm:min-h-[220px] w-full flex-col justify-between overflow-hidden rounded-[1.65rem] border border-foreground/10 bg-card p-6 sm:p-7 text-left shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)] transition-all duration-500 hover:-translate-y-1 hover:border-primary/60 hover:shadow-[0_22px_48px_hsl(10_76%_57%_/_0.17)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background active:translate-y-0 cursor-pointer"
                data-testid="button-select-now"
                aria-label="Hemen UĞRA seçeneğini başlat"
              >
                <span className="absolute -right-12 -top-14 h-36 w-36 rounded-full bg-accent/60 transition-transform duration-700 group-hover:scale-[1.7]" aria-hidden="true" />
                <span className="relative z-10 flex items-start justify-end">
                  <ArrowRight className="mt-1 h-5 w-5 text-foreground/40 transition-all duration-500 group-hover:translate-x-1 group-hover:text-primary" strokeWidth={1.8} />
                </span>
                <span className="relative z-10">
                  <span className="block font-serif text-[1.85rem] sm:text-[2.2rem] leading-none tracking-[-0.03em] text-foreground">
                    Hemen UĞRA
                  </span>
                  <span className="block mt-2 text-xs sm:text-sm text-muted-foreground font-sans">
                    Aklındaki işi ilet. Yakınındaki uygun asistanla hemen eşleştirelim.
                  </span>
                </span>
              </button>

              {/* Geçerken UĞRA Card */}
              <button
                type="button"
                onClick={() => handleSelectType('gecerken')}
                className="group relative flex min-h-[190px] sm:min-h-[220px] w-full flex-col justify-between overflow-hidden rounded-[1.65rem] border border-foreground/10 bg-card p-6 sm:p-7 text-left shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)] transition-all duration-500 hover:-translate-y-1 hover:border-primary/60 hover:shadow-[0_22px_48px_hsl(10_76%_57%_/_0.17)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background active:translate-y-0 cursor-pointer"
                data-testid="button-select-on-the-way"
                aria-label="Geçerken UĞRA seçeneğini başlat"
              >
                <span className="absolute -right-12 -top-14 h-36 w-36 rounded-full bg-accent/60 transition-transform duration-700 group-hover:scale-[1.7]" aria-hidden="true" />
                <span className="relative z-10 flex items-start justify-end">
                  <ArrowRight className="mt-1 h-5 w-5 text-foreground/40 transition-all duration-500 group-hover:translate-x-1 group-hover:text-primary" strokeWidth={1.8} />
                </span>
                <span className="relative z-10">
                  <span className="block font-serif text-[1.85rem] sm:text-[2.2rem] leading-none tracking-[-0.03em] text-foreground">
                    Geçerken UĞRA
                  </span>
                  <span className="block mt-2 text-xs sm:text-sm text-muted-foreground font-sans">
                    Rotaya eklenebilecek işi tarif et, gün içinde bütçene uygun teslim edilsin.
                  </span>
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Minimal Footer */}
        <footer className="w-full py-4 border-t border-border/40 flex items-center justify-start text-xs text-muted-foreground">
          <span>&copy; 2026 UĞRA<span className="text-primary">.</span></span>
        </footer>
      </div>

      {/* Selection Modal with Real Dispatch Service */}
      <SelectionModal
        isOpen={isSelectionModalOpen}
        onOpenChange={setIsSelectionModalOpen}
        selectedType={selectedType}
      />
    </main>
  );
}

