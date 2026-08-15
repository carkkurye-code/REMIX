import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { InteractiveCard } from '@/components/ui/InteractiveCard';

export interface HeroProps {
  onSelectType?: (type: 'hemen' | 'gecerken') => void;
  onServiceClick?: (service: string) => void;
}

export function Hero({ onSelectType }: HeroProps = {}) {
  const handleSelectType = (type: 'hemen' | 'gecerken') => {
    if (onSelectType) {
      onSelectType(type);
    }
  };

  return (
    <section className="pt-24 sm:pt-28 pb-12 sm:pb-16 flex flex-col justify-center relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-6 md:px-12 z-10 relative">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-light max-w-xl mb-6 sm:mb-8"
          >
            Gitmeye vakit bulamadığın her yere senin için <span className="text-foreground font-medium">UĞRA'yalım.</span>
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xl sm:max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 text-left"
          >
            {/* Hemen UĞRA Card */}
            <InteractiveCard
              animateOnScroll={false}
              onClick={() => handleSelectType('hemen')}
              hoverBorderColor="rgba(255, 255, 255, 0.2)"
              hoverShadow="0 20px 40px -10px rgba(255, 255, 255, 0.1), inset 0 1px 0 0 rgba(255,255,255,0.1)"
              className="glass-panel rounded-2xl p-6 relative overflow-hidden group cursor-pointer border border-white/5 transition-all duration-300 flex flex-col justify-between min-h-[180px]"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[40px] rounded-full group-hover:bg-white/10 pointer-events-none" />

              <div>
                <h4 className="text-lg font-bold mb-2 flex items-center gap-1.5 text-foreground">
                  Hemen UĞRA
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Şimdi çözülmesi gereken işlerin için.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs text-zinc-200 font-bold mt-4 group-hover:translate-x-1.5 transition-transform duration-300">
                Seç ve İlet <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </InteractiveCard>

            {/* Geçerken UĞRA Card */}
            <InteractiveCard
              animateOnScroll={false}
              onClick={() => handleSelectType('gecerken')}
              hoverBorderColor="rgba(255, 255, 255, 0.2)"
              hoverShadow="0 20px 40px -10px rgba(255, 255, 255, 0.1), inset 0 1px 0 0 rgba(255,255,255,0.1)"
              className="glass-panel rounded-2xl p-6 relative overflow-hidden group cursor-pointer border border-white/5 transition-all duration-300 flex flex-col justify-between min-h-[180px]"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[40px] rounded-full group-hover:bg-white/10 pointer-events-none" />

              <div>
                <h4 className="text-lg font-bold mb-2 flex items-center gap-1.5 text-foreground">
                  Geçerken UĞRA
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Gün içinde halledilebilecek işlerin için.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs text-zinc-200 font-bold mt-4 group-hover:translate-x-1.5 transition-transform duration-300">
                Seç ve İlet <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </InteractiveCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
