import React, { useState, useEffect } from 'react';
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
    setIsSubmittingOrder(true);

    if (!taskDescription.trim()) {
      toast({
        title: 'Ne yapmak istiyorsun?',
        description: 'Lütfen ne yapmak istediğinizi belirtiniz.',
        variant: 'destructive',
      });
      setIsSubmittingOrder(false);
      return;
    }

    if (!isPhoneValid) {
      toast({
        title: 'Telefon Numarası Gerekli',
        description: 'Lütfen geçerli bir telefon numarası giriniz.',
        variant: 'destructive',
      });
      setIsSubmittingOrder(false);
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
      return;
    }

    if (!isOfferValid) {
      toast({
        title: 'Kaç TL teklif ediyorsun?',
        description: "Minimum teklif tutarı 100 TL'dir.",
        variant: 'destructive',
      });
      setIsSubmittingOrder(false);
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
          pickup_address: 'Adapazarı',
          delivery_address: 'Serdivan',
          pickup_zone: 'Adapazarı',
          delivery_zone: 'Serdivan',
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
            border-white/[0.09]
            bg-[#171719]
            rounded-[28px]
            shadow-[0_35px_100px_rgba(0,0,0,0.7)]
            overflow-hidden
            outline-none
          "
        >
          <DialogTitle className="sr-only">
            {activeDeliveryType === 'gecerken'
              ? 'Geçerken UĞRA'
              : 'Hemen UĞRA'}
          </DialogTitle>

          {/* Hafif premium ışık */}
          <div
            className="
              pointer-events-none
              absolute
              -right-28
              -top-28
              h-72
              w-72
              rounded-full
              bg-white/[0.035]
              blur-[80px]
            "
          />

          <div className="relative z-10 p-6 sm:p-7">
              {/* ÜST KISIM */}
              <div className="mb-5 flex items-center justify-between">
                <h3
                  className="
                    text-[18px]
                    font-semibold
                    tracking-[-0.02em]
                    text-white
                  "
                >
                  {activeDeliveryType === 'gecerken'
                    ? 'GEÇERKEN UĞRA'
                    : 'HEMEN UĞRA'}
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
                    border-white/[0.08]
                    bg-white/[0.04]
                    text-zinc-500
                    transition-all
                    hover:bg-white/[0.08]
                    hover:text-white
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
                      h-[2px]
                      flex-1
                      rounded-full
                      transition-all
                      duration-300
                      ${
                        index + 1 <= step
                          ? 'bg-white'
                          : 'bg-white/[0.08]'
                      }
                    `}
                  />
                ))}
              </div>

              {/* STEP 1: NE YAPMAK İSTİYORSUN? (Hem Hemen hem Geçerken) */}
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="mb-2 text-[12px] font-medium text-zinc-300">
                    Ne yapmak istiyorsun?
                  </div>

                  <textarea
                    autoFocus
                    rows={5}
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Ne yapmak istiyorsun?"
                    className="
                      min-h-[160px]
                      w-full
                      resize-none
                      rounded-[20px]
                      border
                      border-white/[0.08]
                      bg-white/[0.025]
                      p-4
                      text-[14px]
                      leading-6
                      text-white
                      placeholder:text-zinc-600
                      outline-none
                      transition-all
                      focus:border-white/[0.16]
                      focus:bg-white/[0.04]
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
                        bg-white
                        px-5
                        py-3
                        text-[12px]
                        font-bold
                        text-black
                        transition-all
                        hover:bg-zinc-200
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
                  <div className="mb-2 text-[12px] font-medium text-zinc-300">
                    Telefon Numaran
                  </div>

                  <div
                    className="
                      rounded-[20px]
                      border
                      border-white/[0.08]
                      bg-white/[0.025]
                      p-4
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
                        text-white
                        outline-none
                        placeholder:text-zinc-700
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
                        text-[12px]
                        font-medium
                        text-zinc-500
                        transition-colors
                        hover:text-white
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
                        bg-white
                        px-5
                        py-3
                        text-[12px]
                        font-bold
                        text-black
                        transition-all
                        hover:bg-zinc-200
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
                  <div className="mb-2 text-[12px] font-medium text-zinc-300">
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
                                ? 'border-white bg-white text-black'
                                : 'border-white/[0.08] bg-white/[0.025] text-zinc-400 hover:border-white/[0.16] hover:bg-white/[0.05] hover:text-white'
                            }
                          `}
                        >
                          <div
                            className={`
                              text-[13px]
                              font-semibold
                              ${selected ? 'text-black' : 'text-white'}
                            `}
                          >
                            {slot}
                          </div>

                          <div
                            className={`
                              mt-1
                              text-[10px]
                              ${selected ? 'text-zinc-500' : 'text-zinc-600'}
                            `}
                          >
                            UĞRA zamanı
                          </div>

                          {selected && (
                            <Check className="absolute right-3 top-3 h-3.5 w-3.5 stroke-[3]" />
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
                        text-[12px]
                        font-medium
                        text-zinc-500
                        transition-colors
                        hover:text-white
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
                        bg-white
                        px-5
                        py-3
                        text-[12px]
                        font-bold
                        text-black
                        transition-all
                        hover:bg-zinc-200
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
                  <div className="mb-2 text-[12px] font-medium text-zinc-300">
                    Kaç TL teklif ediyorsun?
                  </div>

                  <div
                    className="
                      rounded-[20px]
                      border
                      border-white/[0.08]
                      bg-white/[0.025]
                      p-5
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
                        placeholder="Kaç TL teklif ediyorsun?"
                        className="
                          w-full
                          bg-transparent
                          text-center
                          text-[28px]
                          sm:text-[32px]
                          font-semibold
                          tracking-[-0.03em]
                          text-white
                          outline-none
                          placeholder:text-zinc-700
                          placeholder:text-[14px]
                          placeholder:font-normal
                        "
                      />

                      {customerOffer !== '' && (
                        <span
                          className="
                            ml-1
                            text-[15px]
                            font-semibold
                            text-zinc-500
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
                          text-[11px]
                          font-medium
                          text-rose-400
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
                        text-[12px]
                        font-medium
                        text-zinc-500
                        transition-colors
                        hover:text-white
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
                        bg-white
                        px-5
                        py-3
                        text-[12px]
                        font-bold
                        text-black
                        transition-all
                        hover:bg-zinc-200
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
                  <div className="mb-2 text-[12px] font-medium text-zinc-300">
                    Son kontrol
                  </div>

                  <div
                    className="
                      space-y-3
                      rounded-[20px]
                      border
                      border-white/[0.08]
                      bg-white/[0.025]
                      p-4
                    "
                  >
                    <div className="border-b border-white/[0.06] pb-2.5">
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                        Ne yapılacak?
                      </div>
                      <div className="mt-1 text-[13px] font-medium text-white line-clamp-2">
                        {taskDescription}
                      </div>
                    </div>

                    <div className="border-b border-white/[0.06] pb-2.5">
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                        Telefon
                      </div>
                      <div className="mt-1 text-[13px] font-medium text-white">
                        {phoneNumber}
                      </div>
                    </div>

                    {activeDeliveryType === 'gecerken' && (
                      <div className="border-b border-white/[0.06] pb-2.5">
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                          Saat Aralığı
                        </div>
                        <div className="mt-1 text-[13px] font-medium text-white">
                          {selectedTimeSlot}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                        Teklif Tutarı
                      </div>
                      <div className="mt-1 text-[16px] font-bold text-white">
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
                        text-[12px]
                        font-medium
                        text-zinc-500
                        transition-colors
                        hover:text-white
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
                        bg-white
                        px-6
                        py-3.5
                        text-[12px]
                        font-bold
                        text-black
                        shadow-[0_10px_30px_rgba(0,0,0,0.3)]
                        transition-all
                        hover:bg-zinc-200
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                        cursor-pointer
                      "
                    >
                      {isSubmittingOrder ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          UĞRA'ya iletiyoruz...
                        </>
                      ) : (
                        <>
                          UĞRA'YALIM
                          <ArrowRight className="h-3.5 w-3.5" />
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
