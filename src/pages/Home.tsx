import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { SelectionModal } from '@/components/SelectionModal';

export function Home() {
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'hemen' | 'gecerken' | null>(null);

  const handleSelectType = (type: 'hemen' | 'gecerken') => {
    setSelectedType(type);
    setIsSelectionModalOpen(true);
  };

  return (
    <div className="min-h-screen w-full bg-transparent selection:bg-primary/30 selection:text-primary-foreground font-sans flex flex-col justify-start">
      <Header />
      
      <main className="w-full flex flex-col justify-start">
        <Hero onSelectType={handleSelectType} />
      </main>

      {/* PWA Install Prompter & Assistant */}
      <PWAInstallPrompt />

      {/* Ara Seçim Ekranı Modal */}
      <SelectionModal
        isOpen={isSelectionModalOpen}
        onOpenChange={setIsSelectionModalOpen}
        selectedType={selectedType}
      />
    </div>
  );
}
