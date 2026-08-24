import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowLeft, ArrowRight, Loader2, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { LiveDispatchService } from '@/lib/dispatchService';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import { AuthModal } from '@/components/auth/AuthModal';

export interface SelectionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedType?: 'hemen' | 'gecerken' | null;
  onSelectOption?: (option: 'al' | 'birak') => void;
  partner_id?: string | null;
  selectedPartner?: { id: string } | null;
}

const TIME_SLOTS = [
  '09:00 – 10:00',
  '10:00 – 11:00',
  '11:00 – 12:00',
  '12:00 – 13:00',
  '13:00 – 14:00',
  '14:00 – 15:00',
  '15:00 – 16:00',
  '16:00 – 17:00',
  '17:00 – 18:00',
];

export function SelectionModal({
  isOpen,
  onOpenChange,
  selectedType,
  partner_id,
  selectedPartner,
}: SelectionModalProps) {
  const { toast } = useToast();
  const { user, profile } = useCustomerAuth();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingDispatchSubmit, setPendingDispatchSubmit] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const submitLockRef = useRef(false);

  const activeDeliveryType = selectedType || 'hemen';

  const [step, setStep] = useState(1);

  const [taskDescription, setTaskDescription] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [customerOffer, setCustomerOffer] = useState('');

  const totalSteps = activeDeliveryType === 'gecerken' ? 5 : 4;

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setTaskDescription('');
      setSelectedTimeSlot('');
      setCustomerOffer('');
      setIsSubmittingOrder(false);
      submitLockRef.current = false;

      const initialPhone =
        profile?.phone ||
        user?.phone ||
        user?.user_metadata?.phone ||
        '';

      setPhoneNumber(initialPhone);
    }
  }, [isOpen, profile?.phone, user]);

  useEffect(() => {
    if (!isOpen) return;

    const scrollY =
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      0;

    const bodyStyle = document.body.style;
    const htmlStyle = document.documentElement.style;

    const previous = {
      position: bodyStyle.position,
      top: bodyStyle.top,
      width: bodyStyle.width,
      overflow: bodyStyle.overflow,
      htmlOverflow: htmlStyle.overflow,
      overscroll: bodyStyle.overscrollBehavior,
      htmlOverscroll: htmlStyle.overscrollBehavior,
    };

    bodyStyle.position = 'fixed';
    bodyStyle.top = `-${scrollY}px`;
    bodyStyle.width = '100%';
    bodyStyle.overflow = 'hidden';
    bodyStyle.overscrollBehavior = 'none';

    htmlStyle.overflow = 'hidden';
    htmlStyle.overscrollBehavior = 'none';

    return () => {
      bodyStyle.position = previous.position;
      bodyStyle.top = previous.top;
      bodyStyle.width = previous.width;
      bodyStyle.overflow = previous.overflow;
      bodyStyle.overscrollBehavior = previous.overscroll;

      htmlStyle.overflow = previous.htmlOverflow;
      htmlStyle.overscrollBehavior = previous.htmlOverscroll;

      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const isPhoneValid = cleanPhone.length >= 10;

  const offerNum = Number(customerOffer);

  const isOfferValid =
    customerOffer.trim() !== '' &&
    !isNaN(offerNum) &&
    offerNum >= 100;

  const executeOrderSubmission = async () => {
    if (submitLockRef.current) {
      return;
    }
    submitLockRef.current = true;
    setIsSubmittingOrder(true);

    if (!taskDescription.trim()) {
      toast({
        title: 'Ne yapmak istiyorsun?',
        description: 'Lütfen ne yapmak istediğinizi belirtiniz.',
        variant: 'destructive',
      });
      setIsSubmittingOrder(false);
      submitLockRef.current = false;
      return;
    }

    if (!isPhoneValid) {
      toast({
        title: 'Telefon Numarası Gerekli',
        description: 'Lütfen geçerli bir telefon numarası giriniz.',
        variant: 'destructive',
      });
      setIsSubmittingOrder(false);
      submitLockRef.current = false;
      return;
    }

    if (
      activeDeliveryType === 'gecerken' &&
      !selectedTimeSlot.trim()
    ) {
      toast({
        title: 'Hangi saat aralığında UĞRA\'yalım?',
        description:
          "Lütfen UĞRA'mızı istediğiniz saat aralığını seçiniz.",
        variant: 'destructive',
      });
      setIsSubmittingOrder(false);
      submitLockRef.current = false;
      return;
    }

    if (!isOfferValid) {
      toast({
        title: 'Kaç TL teklif ediyorsun?',
        description: "Minimum teklif tutarı 100 TL'dir.",
        variant: 'destructive',
      });
      setIsSubmittingOrder(false);
      submitLockRef.current = false;
      return;
    }

    try {
      const customerFullName =
        profile?.full_name ||
        user?.user_metadata?.full_name ||
        user?.email?.split('@')[0] ||
        'Müşteri';

      const customerPhoneNumber =
        phoneNumber.trim() ||
        profile?.phone ||
        user?.user_metadata?.phone ||
        '';

      if (user?.id && customerPhoneNumber) {
        try {
          const savedKey = `ugra_saved_customer_info_${user.id}`;
          const existing = localStorage.getItem(savedKey);
          const parsed = existing ? JSON.parse(existing) : {};

          localStorage.setItem(
            savedKey,
            JSON.stringify({
              ...parsed,
              phone: customerPhoneNumber,
            })
          );

          localStorage.setItem(
            'ugra_saved_customer_info',
            JSON.stringify({
              ...parsed,
              phone: customerPhoneNumber,
            })
          );
        } catch (e) {}
      }

      const customerSavedLocation =
        profile?.address?.trim() ||
        (() => {
          try {
            if (user?.id) {
              const directLoc = localStorage.getItem(`ugra_customer_location_${user.id}`);
              if (directLoc && directLoc.trim()) return directLoc.trim();
              const saved = localStorage.getItem(`ugra_saved_customer_info_${user.id}`);
              if (saved) {
                const parsed = JSON.parse(saved);
                const loc = parsed.custAddress || parsed.location || parsed.address || parsed.customer_address;
                if (loc && loc.trim()) return loc.trim();
              }
            }
            const genericLoc = localStorage.getItem('ugra_customer_location');
            if (genericLoc && genericLoc.trim()) return genericLoc.trim();
            const genericSaved = localStorage.getItem('ugra_saved_customer_info');
            if (genericSaved) {
              const parsed = JSON.parse(genericSaved);
              const loc = parsed.custAddress || parsed.location || parsed.address || parsed.customer_address;
              if (loc && loc.trim()) return loc.trim();
            }
          } catch (e) {}
          return '';
        })() || 'Adapazarı, Sakarya';

      const result =
        await LiveDispatchService.createOrderAndDispatch({
          delivery_type: activeDeliveryType,
          service_type: 'al',
          task_description:
            taskDescription.trim() ||
            (activeDeliveryType === 'gecerken'
              ? 'Geçerken UĞRA Talebi'
              : 'Hemen UĞRA Talebi'),
          customer_phone: customerPhoneNumber,
          customer_name: customerFullName,
          customer_id: user?.id,
          customer_address: customerSavedLocation,
          pickup_address: customerSavedLocation,
          delivery_address: customerSavedLocation,
          pickup_zone: customerSavedLocation,
          delivery_zone: customerSavedLocation,
          total_price: offerNum,
          customer_price: offerNum,
          courier_net: offerNum,
          estimated_minutes:
            activeDeliveryType === 'gecerken' ? 45 : 20,
          preferred_time:
            activeDeliveryType === 'gecerken'
              ? selectedTimeSlot
              : null,
          partner_id:
            partner_id ||
            selectedPartner?.id ||
            null,
          city_id: (selectedPartner as any)?.city_id || null,
          franchise_id:
            (selectedPartner as any)?.franchise_id || null,
          requires_delivery_code: false,
          delivery_code_verified: true,
        });

      if (result.success) {
        toast({
          title: 'Talebiniz Alındı.',
          description:
            'Şimdi sıra bizde. En kısa sürede sizinle iletişime geçeceğiz.',
          variant: 'plain',
        });

        onOpenChange(false);
      } else {
        toast({
          title: 'Hata',
          description:
            result.error ||
            'Talebiniz iletilirken bir sorun oluştu.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'İşlem Başarısız',
        description: err?.message || 'Bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingOrder(false);
      submitLockRef.current = false;
    }
  };

  const handleSelectTimeSlot = (slot: string) => {
    setSelectedTimeSlot(slot);
    setTimeout(() => {
      setStep(4);
    }, 140);
  };

  const goNext = () => {
    // 1. Adım: Ne yapmak istiyorsun?
    if (step === 1) {
      if (!taskDescription.trim()) {
        toast({
          title: 'Ne yapmak istiyorsun?',
          description: 'Lütfen ne yapmak istediğinizi belirtiniz.',
          variant: 'destructive',
        });
        return;
      }
      setStep(2);
      return;
    }

    // 2. Adım: Telefon Numaran
    if (step === 2) {
      if (!isPhoneValid) {
        toast({
          title: 'Telefon Numarası Gerekli',
          description: 'Sana ulaşabilmemiz için telefon numaran gerekli.',
          variant: 'destructive',
        });
        return;
      }
      setStep(3);
      return;
    }

    // Geçerken UĞRA için Adım 3 (Saat) & Adım 4 (Teklif)
    if (activeDeliveryType === 'gecerken') {
      if (step === 3) {
        if (!selectedTimeSlot.trim()) {
          toast({
            title: 'Hangi saat aralığında UĞRA\'yalım?',
            description: "Lütfen bir saat aralığı seçiniz.",
            variant: 'destructive',
          });
          return;
        }
        setStep(4);
        return;
      }

      if (step === 4) {
        if (!isOfferValid) {
          toast({
            title: 'Kaç TL teklif ediyorsun?',
            description: "Minimum teklif tutarı 100 TL'dir.",
            variant: 'destructive',
          });
          return;
        }
        setStep(5);
        return;
      }

      if (step === 5) {
        submit();
        return;
      }
    } else {
      // Hemen UĞRA için Adım 3 (Teklif) & Adım 4 (Son kontrol)
      if (step === 3) {
        if (!isOfferValid) {
          toast({
            title: 'Kaç TL teklif ediyorsun?',
            description: "Minimum teklif tutarı 100 TL'dir.",
            variant: 'destructive',
          });
          return;
        }
        setStep(4);
        return;
      }

      if (step === 4) {
        submit();
        return;
      }
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const submit = async () => {
    if (!isOfferValid) {
      toast({
        title: 'Kaç TL teklif ediyorsun?',
        description: "Minimum teklif tutarı 100 TL'dir.",
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      setPendingDispatchSubmit(true);
      onOpenChange(false);
      setIsAuthModalOpen(true);
      return;
    }

    await executeOrderSubmission();
  };

  const handleAuthClose = () => {
    setIsAuthModalOpen(false);

    if (pendingDispatchSubmit) {
      onOpenChange(true);
      setPendingDispatchSubmit(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
  };

  useEffect(() => {
    if (user && pendingDispatchSubmit) {
      setIsAuthModalOpen(false);
      onOpenChange(true);
      setPendingDispatchSubmit(false);
      executeOrderSubmission();
    }
  }, [user, pendingDispatchSubmit]);

  const isReviewStep =
    (activeDeliveryType === 'gecerken' && step === 5) ||
    (activeDeliveryType === 'hemen' && step === 4);

  const isOfferStep =
    (activeDeliveryType === 'gecerken' && step === 4) ||
    (activeDeliveryType === 'hemen' && step === 3);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent
          hideClose
          className="
            w-[calc(100vw-28px)]
            max-w-[470px]
            p-0
            border
            border-border/80
            bg-card
            text-foreground
            rounded-[28px]
            shadow-[0_20px_60px_hsl(256_24%_17%_/_0.15)]
            overflow-hidden
            outline-none
          "
        >
          <DialogTitle className="sr-only">
            {activeDeliveryType === 'gecerken'
              ? 'Geçerken UĞRA'
              : 'Hemen UĞRA'}
          </DialogTitle>

          {/* Hafif sıcak vurgulu arka plan ışığı */}
          <div
            className="
              pointer-events-none
              absolute
              -right-20
              -top-20
              h-64
              w-64
              rounded-full
              bg-accent/40
              blur-[60px]
            "
          />

          <div className="relative z-10 p-6 sm:p-7">
              {/* ÜST KISIM */}
              <div className="mb-5 flex items-center justify-between">
                <h3
                  className="
                    font-serif
                    text-[22px]
                    sm:text-[24px]
                    font-normal
                    tracking-[-0.02em]
                    text-foreground
                  "
                >
                  {activeDeliveryType === 'gecerken'
                    ? 'Geçerken UĞRA'
                    : 'Hemen UĞRA'}
                </h3>

                <DialogClose
                  className="
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-border
                    bg-background/80
                    text-muted-foreground
                    transition-all
                    hover:bg-background
                    hover:text-foreground
                    hover:border-foreground/30
                    cursor-pointer
                  "
                >
                  <X className="h-4 w-4" />
                </DialogClose>
              </div>

              {/* İLERLEME ÇİZGİSİ */}
              <div className="mb-6 flex gap-1.5">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <div
                    key={index}
                    className={`
                      h-[3px]
                      flex-1
                      rounded-full
                      transition-all
                      duration-300
                      ${
                        index + 1 <= step
                          ? 'bg-primary'
                          : 'bg-muted'
                      }
                    `}
                  />
                ))}
              </div>

              {/* STEP 1: NE YAPMAK İSTİYORSUN? (Hem Hemen hem Geçerken) */}
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="mb-2 text-[13px] font-semibold text-foreground/80 font-sans">
                    Ne yapmak istiyorsun?
                  </div>

                  <textarea
                    autoFocus
                    rows={5}
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Örn: Kadıköy'den evrak alıp Beşiktaş'a bırakılması gerekiyor..."
                    className="
                      min-h-[160px]
                      w-full
                      resize-none
                      rounded-[20px]
                      border
                      border-border
                      bg-background/90
                      p-4
                      text-[14px]
                      leading-6
                      text-foreground
                      placeholder:text-muted-foreground/70
                      outline-none
                      transition-all
                      focus:border-primary/60
                      focus:ring-2
                      focus:ring-primary/20
                      focus:bg-background
                    "
                  />

                  <div className="mt-5 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={goNext}
                      className="
                        flex
                        items-center
                        gap-2
                        rounded-full
                        bg-primary
                        px-6
                        py-3
                        text-[13px]
                        font-bold
                        text-primary-foreground
                        shadow-[0_4px_16px_hsl(10_76%_57%_/_0.2)]
                        transition-all
                        hover:bg-primary/90
                        hover:shadow-[0_6px_20px_hsl(10_76%_57%_/_0.3)]
                        active:scale-[0.98]
                        cursor-pointer
                      "
                    >
                      Devam
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: TELEFON NUMARASI (Hem Hemen hem Geçerken) */}
              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="mb-2 text-[13px] font-semibold text-foreground/80 font-sans">
                    Telefon Numaran
                  </div>

                  <div
                    className="
                      rounded-[20px]
                      border
                      border-border
                      bg-background/90
                      p-4
                      focus-within:border-primary/60
                      focus-within:ring-2
                      focus-within:ring-primary/20
                      transition-all
                    "
                  >
                    <input
                      autoFocus
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="05XX XXX XX XX"
                      className="
                        w-full
                        bg-transparent
                        text-[20px]
                        font-semibold
                        tracking-tight
                        text-foreground
                        outline-none
                        placeholder:text-muted-foreground/50
                      "
                    />
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={goBack}
                      className="
                        flex
                        items-center
                        gap-2
                        text-[13px]
                        font-medium
                        text-muted-foreground
                        transition-colors
                        hover:text-foreground
                        cursor-pointer
                      "
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Geri
                    </button>

                    <button
                      type="button"
                      onClick={goNext}
                      className="
                        flex
                        items-center
                        gap-2
                        rounded-full
                        bg-primary
                        px-6
                        py-3
                        text-[13px]
                        font-bold
                        text-primary-foreground
                        shadow-[0_4px_16px_hsl(10_76%_57%_/_0.2)]
                        transition-all
                        hover:bg-primary/90
                        hover:shadow-[0_6px_20px_hsl(10_76%_57%_/_0.3)]
                        active:scale-[0.98]
                        cursor-pointer
                      "
                    >
                      Devam
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3 (GEÇERKEN UĞRA): SAAT SEÇİMİ */}
              {activeDeliveryType === 'gecerken' && step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="mb-2 text-[13px] font-semibold text-foreground/80 font-sans">
                    Hangi saat aralığında UĞRA'yalım?
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-0.5">
                    {TIME_SLOTS.map((slot) => {
                      const selected = selectedTimeSlot === slot;

                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleSelectTimeSlot(slot)}
                          className={`
                            group
                            relative
                            rounded-[16px]
                            border
                            px-4
                            py-4
                            text-left
                            transition-all
                            duration-200
                            cursor-pointer
                            ${
                              selected
                                ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/40 shadow-sm'
                                : 'border-border bg-background/70 text-muted-foreground hover:border-foreground/30 hover:bg-background hover:text-foreground'
                            }
                          `}
                        >
                          <div
                            className={`
                              text-[13px]
                              font-semibold
                              ${selected ? 'text-foreground font-bold' : 'text-foreground/90'}
                            `}
                          >
                            {slot}
                          </div>

                          <div
                            className={`
                              mt-1
                              text-[11px]
                              ${selected ? 'text-primary font-medium' : 'text-muted-foreground'}
                            `}
                          >
                            UĞRA zamanı
                          </div>

                          {selected && (
                            <Check className="absolute right-3 top-3 h-4 w-4 text-primary stroke-[3]" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={goBack}
                      className="
                        flex
                        items-center
                        gap-2
                        text-[13px]
                        font-medium
                        text-muted-foreground
                        transition-colors
                        hover:text-foreground
                        cursor-pointer
                      "
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Geri
                    </button>

                    <button
                      type="button"
                      onClick={goNext}
                      className="
                        flex
                        items-center
                        gap-2
                        rounded-full
                        bg-primary
                        px-6
                        py-3
                        text-[13px]
                        font-bold
                        text-primary-foreground
                        shadow-[0_4px_16px_hsl(10_76%_57%_/_0.2)]
                        transition-all
                        hover:bg-primary/90
                        hover:shadow-[0_6px_20px_hsl(10_76%_57%_/_0.3)]
                        active:scale-[0.98]
                        cursor-pointer
                      "
                    >
                      Devam
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* TEKLİF ADIMI (Hemen için Step 3, Geçerken için Step 4) */}
              {isOfferStep && (
                <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="mb-2 text-[13px] font-semibold text-foreground/80 font-sans">
                    Kaç TL teklif ediyorsun?
                  </div>

                  <div
                    className="
                      rounded-[20px]
                      border
                      border-border
                      bg-background/90
                      p-5
                      focus-within:border-primary/60
                      focus-within:ring-2
                      focus-within:ring-primary/20
                      transition-all
                    "
                  >
                    <div className="flex items-center justify-center">
                      <input
                        autoFocus
                        type="text"
                        inputMode="numeric"
                        value={customerOffer}
                        onChange={(e) =>
                          setCustomerOffer(e.target.value.replace(/\D/g, ''))
                        }
                        placeholder="Teklif tutarı girin"
                        className="
                          w-full
                          bg-transparent
                          text-center
                          text-[28px]
                          sm:text-[32px]
                          font-semibold
                          tracking-[-0.03em]
                          text-foreground
                          outline-none
                          placeholder:text-muted-foreground/50
                          placeholder:text-[14px]
                          placeholder:font-normal
                        "
                      />

                      {customerOffer !== '' && (
                        <span
                          className="
                            ml-1
                            text-[16px]
                            font-bold
                            text-primary
                          "
                        >
                          TL
                        </span>
                      )}
                    </div>

                    {customerOffer !== '' && Number(customerOffer) < 100 && (
                      <div
                        className="
                          mt-3
                          text-center
                          text-[12px]
                          font-medium
                          text-destructive
                        "
                      >
                        Minimum teklif tutarı 100 TL'dir.
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={goBack}
                      className="
                        flex
                        items-center
                        gap-2
                        text-[13px]
                        font-medium
                        text-muted-foreground
                        transition-colors
                        hover:text-foreground
                        cursor-pointer
                      "
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Geri
                    </button>

                    <button
                      type="button"
                      onClick={goNext}
                      className="
                        flex
                        items-center
                        gap-2
                        rounded-full
                        bg-primary
                        px-6
                        py-3
                        text-[13px]
                        font-bold
                        text-primary-foreground
                        shadow-[0_4px_16px_hsl(10_76%_57%_/_0.2)]
                        transition-all
                        hover:bg-primary/90
                        hover:shadow-[0_6px_20px_hsl(10_76%_57%_/_0.3)]
                        active:scale-[0.98]
                        cursor-pointer
                      "
                    >
                      Devam
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* SON KONTROL & TALEBİ GÖNDER (Hemen için Step 4, Geçerken için Step 5) */}
              {isReviewStep && (
                <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="mb-2 text-[13px] font-semibold text-foreground/80 font-sans">
                    Son kontrol
                  </div>

                  <div
                    className="
                      space-y-3
                      rounded-[20px]
                      border
                      border-border
                      bg-background/90
                      p-4
                    "
                  >
                    <div className="border-b border-border/60 pb-2.5">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Ne yapılacak?
                      </div>
                      <div className="mt-1 text-[13px] font-medium text-foreground line-clamp-2">
                        {taskDescription}
                      </div>
                    </div>

                    <div className="border-b border-border/60 pb-2.5">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Telefon
                      </div>
                      <div className="mt-1 text-[13px] font-medium text-foreground">
                        {phoneNumber}
                      </div>
                    </div>

                    {activeDeliveryType === 'gecerken' && (
                      <div className="border-b border-border/60 pb-2.5">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Saat Aralığı
                        </div>
                        <div className="mt-1 text-[13px] font-medium text-foreground">
                          {selectedTimeSlot}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Teklif Tutarı
                      </div>
                      <div className="mt-1 text-[18px] font-bold text-primary">
                        {customerOffer} TL
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={goBack}
                      className="
                        flex
                        items-center
                        gap-2
                        text-[13px]
                        font-medium
                        text-muted-foreground
                        transition-colors
                        hover:text-foreground
                        cursor-pointer
                      "
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Geri
                    </button>

                    <button
                      type="button"
                      onClick={goNext}
                      disabled={isSubmittingOrder}
                      className="
                        flex
                        items-center
                        gap-2
                        rounded-full
                        bg-primary
                        px-7
                        py-3.5
                        text-[13px]
                        font-bold
                        text-primary-foreground
                        shadow-[0_10px_24px_hsl(10_76%_57%_/_0.25)]
                        transition-all
                        hover:bg-primary/90
                        hover:shadow-[0_14px_30px_hsl(10_76%_57%_/_0.35)]
                        active:scale-[0.98]
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                        cursor-pointer
                      "
                    >
                      {isSubmittingOrder ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          UĞRA'ya iletiyoruz...
                        </>
                      ) : (
                        <>
                          UĞRA'YALIM
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
        </DialogContent>
      </Dialog>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleAuthClose}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
