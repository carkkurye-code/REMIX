import React from 'react';
import { Header } from '@/components/Header';
import { motion } from 'framer-motion';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Database, 
  PhoneCall, 
  Building2, 
  CheckCircle2, 
  Shield, 
  Share2, 
  Clock, 
  FileText 
} from 'lucide-react';
import { useLocation } from 'wouter';

export function PrivacyPolicy() {
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
      id: "genel-ilke",
      icon: ShieldCheck,
      title: "1. Genel İlke",
      paragraphs: [
        "UĞRA kullanıcıların gizliliğine önem verir.",
        "UĞRA yalnızca platformun çalışması, kullanıcı hesabının oluşturulması, talep süreçlerinin yürütülmesi, güvenlik ve teknik operasyonların sağlanması için gerekli bilgileri işlemeyi amaçlar.",
        "Gereksiz kişisel veri toplanmaz."
      ]
    },
    {
      id: "google-ve-gmail-ile-giris",
      icon: Lock,
      title: "2. Google / Gmail ile Giriş",
      paragraphs: [
        "Kullanıcılar UĞRA platformuna Google hesabı üzerinden giriş yapabilir.",
        "Google ile giriş sırasında UĞRA'ya Google tarafından sağlanan temel hesap bilgileri kullanılabilir.",
        "UĞRA, kullanıcıların Google hesap şifrelerini görmez veya saklamaz."
      ]
    },
    {
      id: "talep-bilgileri",
      icon: Database,
      title: "3. Talep Bilgileri",
      paragraphs: [
        "Müşterinin oluşturduğu talep kapsamında hizmetin gerçekleştirilebilmesi için gerekli bilgiler sisteme aktarılabilir.",
        "Talep, uygun asistanlara iletilebilir.",
        "Talebi kabul eden asistan, hizmetin gerçekleştirilebilmesi amacıyla müşteri ile iletişim kurabilir."
      ]
    },
    {
      id: "musteri-ve-asistan-iletisimi",
      icon: PhoneCall,
      title: "4. Müşteri ve Asistan İletişimi",
      paragraphs: [
        "Talep kabul edildiğinde müşteri ile asistan doğrudan iletişim kurabilir.",
        "Tarafların birbirleriyle paylaşacağı bilgilerin hizmetin gerçekleştirilmesi amacıyla kullanılması esastır.",
        "UĞRA, tarafların kendi aralarında gerçekleştirdiği özel görüşmelerin veya anlaşmaların tarafı değildir."
      ]
    },
    {
      id: "asistan-ve-bayi-bilgileri",
      icon: Building2,
      title: "5. Asistan ve Bayi Bilgileri",
      paragraphs: [
        "Asistan panelini kullanan kişilerin ve bayi kullanıcılarının sisteme erişimi için gerekli hesap ve kullanım bilgileri işlenebilir.",
        "Bayiler, sistemin kendilerine verdiği yetki kapsamında kendi asistanlarını sisteme dahil edebilir.",
        "Bu durumda ilgili kişilerin sisteme aktarılması ve yönetilmesi, platformdaki yetki yapısına uygun şekilde gerçekleştirilir."
      ]
    },
    {
      id: "verilerin-kullanim-amaclari",
      icon: CheckCircle2,
      title: "6. Verilerin Kullanım Amaçları",
      paragraphs: [
        "Kişisel veriler aşağıdaki amaçlarla kullanılabilir:"
      ],
      items: [
        "Kullanıcı hesabının oluşturulması ve yönetilmesi.",
        "Talep oluşturma ve talebin uygun asistana ulaştırılması.",
        "Asistan panelinin çalıştırılması.",
        "Bayi sisteminin işletilmesi.",
        "Güvenlik ve kötüye kullanımın önlenmesi.",
        "Teknik sorunların giderilmesi.",
        "Yasal yükümlülüklerin yerine getirilmesi."
      ]
    },
    {
      id: "veri-guvenligi",
      icon: Shield,
      title: "7. Veri Güvenliği",
      paragraphs: [
        "UĞRA, işlediği bilgilerin yetkisiz erişime, kayba veya kötüye kullanıma karşı korunması için teknik ve idari tedbirler almaya çalışır.",
        "Hiçbir internet sistemi mutlak güvenlik garantisi sağlayamayacağından, UĞRA da internet üzerindeki tüm risklerin tamamen ortadan kaldırılacağını garanti etmez."
      ]
    },
    {
      id: "verilerin-paylasilmasi",
      icon: Share2,
      title: "8. Verilerin Paylaşılması",
      paragraphs: [
        "Kişisel bilgiler yalnızca hizmetin yürütülmesi, teknik altyapının çalışması, yasal yükümlülüklerin yerine getirilmesi veya kullanıcının açıkça talep ettiği işlemlerin gerçekleştirilmesi gibi gerekli durumlarda ilgili taraflarla paylaşılabilir.",
        "Kişisel veriler reklam veya benzeri amaçlarla gereksiz şekilde satılmaz veya kiralanmaz."
      ]
    },
    {
      id: "saklama-suresi",
      icon: Clock,
      title: "9. Saklama Süresi",
      paragraphs: [
        "Kişisel veriler yalnızca gerekli olduğu süre boyunca ve yürürlükteki mevzuatın gerektirdiği ölçüde saklanır.",
        "Saklanmasına gerek kalmayan bilgiler, teknik olarak mümkün ve hukuken gerekli olduğu ölçüde silinir, anonimleştirilir veya erişimi kaldırılır."
      ]
    },
    {
      id: "kullanici-haklari",
      icon: FileText,
      title: "10. Kullanıcı Hakları",
      paragraphs: [
        "Kullanıcılar yürürlükteki kişisel verilerin korunmasına ilişkin mevzuat kapsamında sahip oldukları hakları kullanabilir.",
        "Başvuru ve iletişim yöntemleri mevcut sistemde belirtilen iletişim kanalları (ugraapp@gmail.com) üzerinden yürütülür."
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
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>Kişisel Verilerin Korunması ve Gizlilik</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight tracking-[-0.03em] text-foreground mb-3">
                Gizlilik Politikası
              </h1>
              <p className="text-muted-foreground leading-relaxed max-w-2xl text-sm sm:text-base font-normal">
                UĞRA platformunda kullanıcı bilgilerinin işlenmesi, korunması ve veri güvenliği hakkında bilgilendirme.
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
                  className="rounded-[1.65rem] p-6 sm:p-8 shadow-[0_12px_28px_hsl(256_24%_17%_/_0.04)] border border-foreground/10 bg-card"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border shrink-0 bg-accent/40 border-foreground/10 text-foreground">
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
                          {p.includes('ugraapp@gmail.com') ? (
                            <>
                              {p.split('ugraapp@gmail.com')[0]}
                              <a 
                                href="mailto:ugraapp@gmail.com" 
                                className="text-foreground font-medium underline underline-offset-4 decoration-primary/50 hover:text-primary hover:decoration-primary transition-colors"
                              >
                                ugraapp@gmail.com
                              </a>
                              {p.split('ugraapp@gmail.com')[1]}
                            </>
                          ) : (
                            p
                          )}
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

