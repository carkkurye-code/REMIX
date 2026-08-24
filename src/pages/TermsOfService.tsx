import React from 'react';
import { Header } from '@/components/Header';
import { motion } from 'framer-motion';
import { 
  X, 
  FileText, 
  Cpu, 
  User, 
  UserCheck, 
  Building2, 
  Send, 
  Handshake, 
  DollarSign, 
  ShieldAlert, 
  AlertCircle, 
  Ban, 
  CheckCircle2 
} from 'lucide-react';
import { useLocation } from 'wouter';

export function TermsOfService() {
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
      id: "ugra-platformu-ve-is-modeli",
      icon: Cpu,
      title: "1. UĞRA Platformu ve İş Modeli",
      paragraphs: [
        "UĞRA, kullanıcılar ile bağımsız hizmet sağlayıcıları birbirleriyle buluşturan dijital bir yazılım platformudur.",
        "UĞRA'nın temel iş modeli; dijital platform altyapısının işletilmesi, ülke genelinde bayi sisteminin sunulması ve bağımsız asistanların kullanabileceği asistan panelinin abonelik/kiralama modeliyle sunulmasıdır.",
        "UĞRA fiziksel taşıma, kurye, teslimat veya saha hizmetini doğrudan gerçekleştirmez.",
        "UĞRA'nın sunduğu yazılım altyapısı yalnızca tarafların birbirleriyle iletişim kurabilmesini ve taleplerin uygun asistanlara ulaştırılmasını sağlar."
      ]
    },
    {
      id: "musteriler",
      icon: User,
      title: "2. Müşteriler",
      paragraphs: [
        "Müşteriler UĞRA platformu üzerinden zaman kazanmak adına ihtiyaçlarına ilişkin talep oluşturabilir.",
        "Müşteri oluşturduğu talebin içeriğini, gerekli bilgileri ve kendi belirlediği hizmet bedelini sisteme girebilir.",
        "Oluşturulan talep, UĞRA asistan panelini kullanan uygun bağımsız asistanlara iletilebilir.",
        "Müşteri, talebini kabul eden asistan ile iletişim kurarak hizmetin detaylarını doğrudan görüşür."
      ]
    },
    {
      id: "asistanlar",
      icon: UserCheck,
      title: "3. Asistanlar",
      paragraphs: [
        "Asistanlar UĞRA tarafından sunulan asistan panelini kullanarak uygun talepleri görüntüleyebilir.",
        "Asistan, kendisine ulaşan bir talebi kabul edebilir veya reddedebilir.",
        "Bir asistan talebi kabul ettiğinde müşteri ile iletişime geçerek hizmetin detaylarını, konumunu, zamanını ve diğer şartlarını kendi aralarında belirler.",
        "Asistanlar bağımsız hizmet sağlayıcı olarak hareket eder.",
        "UĞRA, asistanların gerçekleştirdiği fiziksel hizmetin doğrudan sağlayıcısı değildir.",
        "Asistanların kendi faaliyetleriyle ilgili yasal, vergisel ve mesleki yükümlülükleri kendilerine aittir."
      ]
    },
    {
      id: "bayiler",
      icon: Building2,
      title: "4. Bayiler",
      paragraphs: [
        "UĞRA, iş modelinin bir parçası olarak ülke genelinde bayi sistemi sunabilir.",
        "Bayi, UĞRA tarafından sağlanan yazılım altyapısını ve panel sistemlerini kendi bölgesinde kullanabilir.",
        "Bayi, kendisine tanımlanan yetkilere ve sözleşme şartlarına uygun şekilde kendi operasyonunu yürütebilir.",
        "Bayi, sistemin izin verdiği durumlarda kendi asistanlarını UĞRA altyapısına dahil edebilir.",
        "Bayinin kendi bünyesine dahil ettiği veya yönettiği asistanlarla arasındaki ilişki, bayi ile ilgili asistan arasındaki bağımsız ilişki kapsamında değerlendirilir."
      ]
    },
    {
      id: "talep-ve-hizmet-akisi",
      icon: Send,
      title: "5. Talep ve Hizmet Akışı",
      items: [
        "Talep Oluşturma: Müşteri UĞRA üzerinden bir hizmet talebi oluşturur.",
        "Talebin Asistanlara İletilmesi: Oluşturulan talep, uygun UĞRA asistan paneli kullanıcılarına iletilebilir.",
        "Kabul veya Ret: Asistan kendisine ulaşan talebi kabul edebilir veya reddedebilir.",
        "Hizmetin Gerçekleştirilmesi: Asistan talebi kabul ettiğinde müşteri ile doğrudan iletişim kurar. Hizmetin nasıl gerçekleştirileceği, zamanlaması, konumu ve tarafların kendi aralarında belirleyeceği diğer şartlar müşteri ve asistan arasında kararlaştırılır. UĞRA bu fiziksel hizmetin tarafı değildir."
      ]
    },
    {
      id: "taraflarin-bagimsizligi",
      icon: Handshake,
      title: "6. Tarafların Bağımsızlığı",
      paragraphs: [
        "Platform üzerinden oluşabilecek ilişkiler doğrudan taraflar arasında kurulur.",
        "Müşteri ile asistan arasındaki hizmet ilişkisi bağımsızdır.",
        "Bayi ile kendi asistanları arasındaki ilişki bağımsızdır.",
        "UĞRA; müşteri, asistan veya bayi adına işveren, acente, temsilci, kurye, taşıyıcı veya hizmet sağlayıcı sıfatıyla hareket etmez."
      ]
    },
    {
      id: "ucretlendirme-ve-komisyon",
      icon: DollarSign,
      title: "7. Ücretlendirme ve Komisyon",
      paragraphs: [
        "UĞRA müşterilerden talep oluşturma veya platformu kullanma karşılığında hizmet komisyonu almaz.",
        "UĞRA asistanların gerçekleştirdiği hizmetlerden komisyon veya pay almaz.",
        "Asistanların UĞRA panelini kullanması için abonelik/kiralama ücreti uygulanabilir.",
        "Bayi sistemi kapsamında ayrıca belirlenen abonelik, lisans, kullanım veya bayilik ücretleri bulunabilir.",
        "Müşteri ile asistan arasındaki hizmet bedeli UĞRA tarafından belirlenmez ve taraflar arasında kararlaştırılır."
      ]
    },
    {
      id: "ugranin-sorumluluk-alani",
      icon: ShieldAlert,
      title: "8. UĞRA'nın Sorumluluk Alanı",
      isHighlighted: true,
      paragraphs: [
        "UĞRA bir yazılım ve dijital platform sağlayıcısıdır."
      ],
      disclaimerList: [
        "Fiziksel taşıma veya teslimat gerçekleştirmez.",
        "Kurye hizmeti doğrudan sunmaz.",
        "Müşteri ile asistan arasındaki hizmet sözleşmesinin tarafı değildir.",
        "Asistanların gerçekleştirdiği hizmetin doğrudan sağlayıcısı değildir.",
        "Müşteri ile asistan arasındaki ücret anlaşmasının tarafı değildir.",
        "Asistanların eylemlerinden bağımsız olarak sorumlu tutulamaz.",
        "Hizmetin sonucunu garanti etmez."
      ],
      outro: "Ancak UĞRA, kendi sunduğu yazılım altyapısının işletilmesi ve teknik olarak erişilebilir tutulması konusunda kendi hizmet alanı kapsamında gerekli özeni göstermeyi amaçlar."
    },
    {
      id: "kullanim-kurallari",
      icon: AlertCircle,
      title: "9. Kullanım Kuralları",
      paragraphs: [
        "Platform; hukuka aykırı, tehdit edici, kötü niyetli veya sistemi kötüye kullanmaya yönelik amaçlarla kullanılamaz.",
        "Sahte hesap oluşturulması, yanıltıcı bilgi verilmesi, sisteme zarar verilmesi veya platformun kötüye kullanılması halinde ilgili hesabın erişimi sınırlandırılabilir veya sonlandırılabilir."
      ]
    },
    {
      id: "yasakli-talepler",
      icon: Ban,
      title: "10. Yasaklı Talepler",
      paragraphs: [
        "Uyuşturucu, silah, mühimmat, patlayıcı, yasa dışı maddeler veya mevzuat gereği taşınması ya da teslim edilmesi yasak olan unsurlar platform üzerinden talep konusu yapılamaz.",
        "UĞRA, mevzuata aykırı veya güvenlik riski oluşturan talepleri kaldırma ve ilgili kullanıcıların erişimini sınırlandırma hakkını saklı tutar."
      ]
    },
    {
      id: "uygulanacak-hukuk",
      icon: CheckCircle2,
      title: "11. Uygulanacak Hukuk",
      paragraphs: [
        "Bu Kullanım Koşulları Türkiye Cumhuriyeti mevzuatına tabidir.",
        "Uyuşmazlıklarda yürürlükteki mevzuat kapsamında görevli ve yetkili mahkeme ve icra daireleri uygulanır."
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
          {/* Top Header */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10 flex items-start justify-between gap-6 border-b border-border/40 pb-8"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/60 border border-foreground/10 text-xs text-foreground font-medium mb-3">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span>Dijital Platform ve Kullanım Şartları</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight tracking-[-0.03em] text-foreground mb-3">
                Kullanım Koşulları
              </h1>
              <p className="text-muted-foreground leading-relaxed max-w-2xl text-sm sm:text-base font-normal">
                UĞRA dijital platformunun, bağımsız asistan panelinin ve bayi altyapısının kullanım şartları.
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

          {/* Policy Sections */}
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
                  className={`rounded-[1.65rem] p-6 sm:p-8 shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)] border ${
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

                  {section.disclaimerList && (
                    <div className="mt-5 grid grid-cols-1 gap-2.5">
                      {section.disclaimerList.map((disc, discIdx) => (
                        <div key={discIdx} className="flex items-start gap-3 text-sm text-foreground/90 bg-card border border-primary/20 rounded-2xl p-3.5">
                          <ShieldAlert className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span className="leading-relaxed font-medium">{disc}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {section.outro && (
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mt-4 pt-3 border-t border-border/40 italic">
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

