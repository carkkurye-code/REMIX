import React from 'react';
import { Header } from '@/components/Header';
import { motion } from 'framer-motion';
import { 
  X, 
  Cpu, 
  User, 
  UserCheck, 
  Handshake, 
  DollarSign, 
  ShieldCheck, 
  Ban, 
  ShieldAlert, 
  Building2, 
  CheckCircle2 
} from 'lucide-react';
import { useLocation } from 'wouter';

export function TasimaKosullari() {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation('/');
    }
  };

  const sections = [
    {
      id: "ugra-tasima-hizmeti-sunmaz",
      icon: Cpu,
      title: "1. UĞRA Taşıma Hizmeti Sunmaz",
      paragraphs: [
        "UĞRA doğrudan taşıma, kurye veya teslimat hizmeti sunan bir işletme değildir.",
        "UĞRA'nın sunduğu hizmet, müşteriler ile bağımsız asistanların birbirleriyle iletişim kurmasını sağlayan dijital yazılım altyapısıdır."
      ]
    },
    {
      id: "musteri-talepleri",
      icon: User,
      title: "2. Müşteri Talepleri",
      paragraphs: [
        "Müşteriler UĞRA platformu üzerinden zaman kazanmak adına ihtiyaçlarına ilişkin talep oluşturabilir.",
        "Talebin içeriği ve hizmet için sunulan bedel müşteri tarafından belirlenebilir."
      ]
    },
    {
      id: "asistanlarin-talepleri-degerlendirmesi",
      icon: UserCheck,
      title: "3. Asistanların Talepleri Değerlendirmesi",
      paragraphs: [
        "UĞRA asistan panelini kullanan bağımsız asistanlar kendilerine iletilen talepleri inceleyebilir.",
        "Asistan talebi kabul edebilir veya reddedebilir.",
        "Talebi kabul eden asistan, müşteri ile doğrudan iletişim kurarak hizmetin detaylarını görüşür."
      ]
    },
    {
      id: "hizmetin-gerceklestirilmesi",
      icon: Handshake,
      title: "4. Hizmetin Gerçekleştirilmesi",
      paragraphs: [
        "Talebi kabul eden asistan ile müşteri, hizmetin gerçekleştirileceği zamanı, konumu, kapsamını ve diğer şartlarını kendi aralarında belirler.",
        "UĞRA bu fiziksel hizmetin doğrudan tarafı değildir."
      ]
    },
    {
      id: "ucret-ve-odeme",
      icon: DollarSign,
      title: "5. Ücret ve Ödeme",
      paragraphs: [
        "Müşteri ile asistan arasında kararlaştırılan hizmet bedeli taraflar arasındaki bağımsız ilişkiye aittir.",
        "UĞRA bu hizmet bedelinden komisyon almaz.",
        "Ödeme yöntemi ve ödeme koşulları taraflar arasında kararlaştırılır."
      ]
    },
    {
      id: "asistanlarin-bagimsizligi",
      icon: ShieldCheck,
      title: "6. Asistanların Bağımsızlığı",
      paragraphs: [
        "Asistanlar UĞRA'nın çalışanı veya doğrudan personeli olarak değerlendirilmez.",
        "Asistanlar kendi faaliyetlerinden ve kendi yasal yükümlülüklerinden sorumludur.",
        "Bayi sistemi üzerinden sisteme dahil edilen asistanlar bakımından bayi ile asistan arasındaki ilişki ayrıca değerlendirilebilir."
      ]
    },
    {
      id: "yasakli-ve-riskli-talepler",
      icon: Ban,
      title: "7. Yasaklı ve Riskli Talepler",
      paragraphs: [
        "Mevzuata aykırı, tehlikeli veya taşınması yasak olan maddelerin taşınması ya da teslim edilmesi amacıyla talep oluşturulamaz.",
        "UĞRA güvenlik veya mevzuat nedeniyle uygun görmediği talepleri sınırlandırabilir veya kaldırabilir."
      ]
    },
    {
      id: "sorumluluk",
      icon: ShieldAlert,
      title: "8. Sorumluluk",
      isHighlighted: true,
      paragraphs: [
        "UĞRA'nın sorumluluğu sunduğu dijital yazılım altyapısı ile sınırlıdır.",
        "UĞRA:"
      ],
      items: [
        "Fiziksel taşıma yapmaz.",
        "Kurye görevi üstlenmez.",
        "Teslimat garantisi vermez.",
        "Müşteri ile asistan arasındaki hizmetin tarafı değildir.",
        "Hizmetin sonucunu garanti etmez.",
        "Taraflar arasındaki ödeme anlaşmasının tarafı değildir."
      ],
      outro: "Müşteri ve asistan, kendi aralarında gerçekleştirdikleri hizmetin şartlarını ve yasal yükümlülüklerini kendileri üstlenir."
    },
    {
      id: "bayiler-ve-kendi-asistanlari",
      icon: Building2,
      title: "9. Bayiler ve Kendi Asistanları",
      paragraphs: [
        "Bayi sistemi kapsamında faaliyet gösteren bayiler, UĞRA tarafından kendilerine verilen yetkiler dahilinde kendi asistanlarını sisteme dahil edebilir.",
        "Bayi tarafından sisteme dahil edilen asistanların faaliyetleri ve bayi ile asistan arasındaki ilişki, ilgili tarafların kendi sorumluluğundadır.",
        "UĞRA'nın rolü dijital yazılım altyapısının sağlanmasıdır."
      ]
    },
    {
      id: "son-hukumler",
      icon: CheckCircle2,
      title: "10. Son Hükümler",
      paragraphs: [
        "UĞRA platformunun kullanılması, kullanıcıların bu koşulları kabul ettiği anlamına gelir.",
        "UĞRA, mevzuat veya iş modelindeki değişiklikler doğrultusunda bu koşulları güncelleme hakkını saklı tutar."
      ]
    }
  ];

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-background text-foreground">
      {/* Background ambient glow matching Home */}
      <div className="pointer-events-none absolute left-[-90px] top-[10%] h-72 w-72 rounded-full bg-primary/10 blur-3xl sm:left-[-30px]" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-[-90px] right-[-70px] h-80 w-80 rounded-full bg-accent/40 blur-3xl" aria-hidden="true" />

      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1280px] flex-col px-5 pb-6 sm:px-8 lg:px-12 justify-between">
        <Header />

        <div className="mx-auto w-full max-w-4xl pt-6 pb-12 sm:pt-10">
          {/* Main Title with Top-Right Close Button */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10 flex items-start justify-between gap-4 border-b border-border/40 pb-8"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/60 border border-foreground/10 text-xs text-foreground font-medium mb-3">
                <Cpu className="w-3.5 h-3.5 text-primary" />
                <span>Dijital Yazılım Altyapısı ve Süreç Esasları</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight tracking-[-0.03em] text-foreground mb-3">
                Hizmet ve Talep Koşulları
              </h1>
              <p className="text-muted-foreground leading-relaxed max-w-2xl text-sm sm:text-base font-normal">
                UĞRA platformu üzerinden oluşturulan taleplerin, bağımsız asistanların ve taraflar arasındaki hizmet sürecinin esasları.
              </p>
              <p className="text-xs text-muted-foreground/70 mt-2 font-mono">Son Güncelleme: 1 Ocak 2026</p>
            </div>

            <button
              type="button"
              onClick={handleBack}
              aria-label="Kapat"
              title="Kapat"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-foreground/15 bg-card/80 text-foreground transition-all duration-300 hover:border-primary/60 hover:text-primary hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95 cursor-pointer shrink-0 mt-1"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>

          {/* Section List */}
          <div className="space-y-6">
            {sections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <motion.section 
                  key={section.id}
                  id={section.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.04 }}
                  className={`rounded-[1.65rem] border p-6 sm:p-8 shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)] ${
                    section.isHighlighted 
                      ? 'border-primary/30 bg-primary/[0.03]' 
                      : 'border-foreground/10 bg-card'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl border shrink-0 ${
                      section.isHighlighted 
                        ? 'bg-primary/10 border-primary/30 text-primary' 
                        : 'bg-accent/40 border-foreground/10 text-foreground'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h2 className="font-serif text-lg sm:text-xl font-bold tracking-tight text-foreground">
                      {section.title}
                    </h2>
                  </div>

                  {section.paragraphs && (
                    <div className="space-y-3">
                      {section.paragraphs.map((p, pIdx) => (
                        <p key={pIdx} className="text-muted-foreground text-sm sm:text-[15px] leading-relaxed">
                          {p}
                        </p>
                      ))}
                    </div>
                  )}

                  {section.items && (
                    <ul className="mt-4 space-y-2.5">
                      {section.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-3 text-sm text-foreground/90 bg-accent/30 border border-foreground/5 rounded-2xl p-3.5">
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.outro && (
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mt-4 pt-3 border-t border-border/40 font-medium">
                      {section.outro}
                    </p>
                  )}
                </motion.section>
              );
            })}
          </div>
        </div>

        {/* Minimal Footer */}
        <footer className="w-full py-4 border-t border-border/40 flex items-center justify-start text-xs text-muted-foreground">
          <span>&copy; 2026 UĞRA<span className="text-primary">.</span></span>
        </footer>
      </div>
    </main>
  );
}

