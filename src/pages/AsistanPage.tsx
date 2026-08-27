import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Loader2, Phone, Calendar, ShieldCheck, X, Navigation, 
  MapPin, CheckCircle2, DollarSign, Clock, Radio, Power, AlertCircle, Key,
  LogOut, User, CheckSquare, ListOrdered, Building, Lock, Mail, RefreshCw,
  XCircle, Package, UserCheck, CreditCard, FileText, ExternalLink,
  ChevronDown, ChevronUp, Menu, Wallet, Bell, Settings, ChevronRight, Zap,
  Instagram
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { 
  supabase, supabaseAssistant, isSupabaseConfigured, db, Assistant, Order, 
  Partner, City, Franchise, resolveFranchiseForCity, isUUID, toUUID, 
  getExactTableColumns, filterPayloadByValidColumns, filterTaskPayload, 
  filterOrderPayload, TURKEY_PROVINCES, ASSISTANT_SUBSCRIPTION_PACKAGES 
} from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { playNotificationSound, showBrowserNotification } from '@/lib/soundUtils';
import { LiveDispatchService } from '@/lib/dispatchService';
import { eventBus } from '@/lib/eventBus';

interface ApplicationFormData {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  city: string;
  cityId: string;
  franchiseId: string;
  motorInfo: string;
  licenseInfo: string;
  experience: string;
  hasCompany: string;
  notes: string;
  subscriptionPackage: '3_aylik' | '6_aylik' | '9_aylik' | '12_aylik';
}

const initialFormData: ApplicationFormData = {
  fullName: '',
  phone: '',
  email: '',
  password: '',
  city: '',
  cityId: '',
  franchiseId: '',
  motorInfo: '',
  licenseInfo: '',
  experience: '',
  hasCompany: 'Evet',
  notes: '',
  subscriptionPackage: '12_aylik'
};

export interface ResolvedTaskFields {
  id: string;
  order_number: string;
  service_type: 'hemen' | 'gecerken' | string;
  service_action: 'al' | 'birak';
  status: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  task_description: string;
  store_name?: string;
  pickup_address: string;
  pickup_address_detail: string;
  delivery_address: string;
  delivery_address_detail: string;
  preferred_time?: string | null;
  pickup_lat?: number;
  pickup_lng?: number;
  delivery_lat?: number;
  delivery_lng?: number;
  latitude?: number;
  longitude?: number;
  payment_type: string;
  notes: string;
  total_price: number;
  courier_net: number;
  customer_price: number;
  distance: string;
  duration: string;
}

export interface AssistantSubscription {
  id: string;
  assistant_id: string;
  start_date?: string;
  expires_at?: string;
  monthly_price?: number;
  status?: string;
  payment_status?: string;
  renewal_requested?: boolean;
  renewal_decision?: 'pending' | 'approved' | 'rejected' | string;
  created_at?: string;
  updated_at?: string;
}

const taskFieldsCache = new WeakMap<object, ResolvedTaskFields>();

export function getOrderCategoryBadge(order: any): { label: string; className: string } {
  const isStoreTask = Boolean(
    order?.is_task ||
    order?.source === 'tasks' ||
    order?.service_type === 'asistan_siparis' ||
    order?.service_type === 'magaza'
  );

  if (isStoreTask) {
    return {
      label: 'MAĞAZA',
      className: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20'
    };
  }

  const rawService = order?.service_type || order?.delivery_type;
  if (rawService === 'gecerken' || rawService === 'gecerken_ugra') {
    return {
      label: 'GEÇERKEN UĞRA',
      className: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
    };
  }

  return {
    label: 'HEMEN UĞRA',
    className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
  };
}

export function resolveTaskFields(item: any): ResolvedTaskFields {
  if (!item) {
    return {
      id: '',
      order_number: '',
      service_type: 'hemen',
      service_action: 'al',
      status: 'pending',
      customer_name: '',
      customer_phone: '',
      customer_address: '',
      task_description: '',
      store_name: '',
      pickup_address: '',
      pickup_address_detail: '',
      delivery_address: '',
      delivery_address_detail: '',
      payment_type: 'Kapıda Nakit',
      notes: '',
      total_price: 0,
      courier_net: 0,
      customer_price: 0,
      distance: '',
      duration: '',
    };
  }

  if (typeof item === 'object' && item !== null && taskFieldsCache.has(item)) {
    return taskFieldsCache.get(item)!;
  }

  const o = item.order || item;
  const p = item.payload || o.payload || {};

  // 1. YAPILACAK İŞ (Task Description)
  let taskDescription = '';
  const descCandidates = [
    item.task_description,
    o.task_description,
    p.task_description,
    item.description,
    o.description,
    p.description,
    item.title,
    o.title,
    item.note,
    o.note,
    p.note,
    item.notes,
    o.notes,
    p.notes,
    item.customer_request,
    item.instruction,
    item.instruction_text,
    item.special_request,
    item.special_notes,
    item.service_description,
    item.service_detail,
    p.task,
  ];

  for (const cand of descCandidates) {
    if (cand && typeof cand === 'string' && cand.trim().length > 0 && !cand.startsWith('[')) {
      const cleanCand = cand.trim();
      if (cleanCand !== 'Yapılacak iş belirtilmemiş.' && cleanCand !== 'Hizmet Talebi') {
        taskDescription = cleanCand;
        break;
      }
    }
  }

  // Check items array/string
  if (!taskDescription) {
    const itemsList = item.items || o.items || p.items;
    if (Array.isArray(itemsList) && itemsList.length > 0) {
      taskDescription = itemsList
        .map((it: any) => `${it.quantity || 1}x ${it.title || it.name || it.product_name || 'Ürün'}`)
        .join(', ');
    } else if (typeof itemsList === 'string' && itemsList.trim()) {
      taskDescription = itemsList.trim();
    }
  }

  if (taskDescription) {
    taskDescription = taskDescription
      .replace(/\[(?:Mağaza Siparişi\s*-\s*|Mağaza:\s*|Partner:\s*)[^\]]+\]\s*/gi, '')
      .replace(/^\[.*?\]\s*/g, '')
      .replace(/Müşteri:\s*[^\n\r]*/gi, '')
      .replace(/•?\s*Adres Detayı:[^\n\r]*/gi, '')
      .replace(/•?\s*Ne Zaman:[^\n\r]*/gi, '')
      .replace(/•?\s*Ürün(?:lerin)?\s*Toplamı:[^\n\r]*/gi, '')
      .replace(/•?\s*Asistan\s*Hizmet\s*Bedeli:[^\n\r]*/gi, '')
      .replace(/•?\s*Hizmet\s*Bedeli:[^\n\r]*/gi, '')
      .replace(/•?\s*Genel\s*Toplam:[^\n\r]*/gi, '')
      .replace(/•?\s*Toplam\s*Fiyat:[^\n\r]*/gi, '')
      .replace(/•?\s*Toplam\s*Tutar:[^\n\r]*/gi, '')
      .replace(/•?\s*Müşterinin\s*(?:Toplam\s*)?Ödeyeceği:[^\n\r]*/gi, '')
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .trim();
  } else {
    taskDescription = '';
  }

  // 2. MÜŞTERİ ADI ("Müşteri" yazısı tek başına gösterilmeyecek)
  let customerName = '';
  const nameCandidates = [
    item.customer_name,
    item.client_name,
    item.name,
    o.customer_name,
    o.name,
    p.customer_name,
    p.name,
  ];
  for (const nc of nameCandidates) {
    if (nc && typeof nc === 'string' && nc.trim()) {
      const trimmed = nc.trim();
      if (trimmed !== 'Müşteri') {
        customerName = trimmed;
        break;
      }
    }
  }

  if (!customerName) {
    const textPool = [item.task_description, o.task_description, item.notes, o.notes, p.notes];
    for (const text of textPool) {
      if (typeof text === 'string' && text) {
        const match = text.match(/Müşteri:\s*([^\(\n\r]+)/i);
        if (match && match[1]?.trim()) {
          const nameFound = match[1].trim();
          if (nameFound && nameFound !== 'Müşteri') {
            customerName = nameFound;
            break;
          }
        }
      }
    }
  }

  // 3. TELEFON
  let customerPhone = '';
  const phoneCandidates = [
    item.customer_phone,
    item.phone,
    item.mobile,
    item.telephone,
    o.customer_phone,
    o.phone,
    p.customer_phone,
    p.phone,
  ];
  for (const pc of phoneCandidates) {
    if (pc && typeof pc === 'string' && pc.trim()) {
      customerPhone = pc.trim();
      break;
    }
  }

  if (!customerPhone) {
    const textPool = [item.task_description, o.task_description, item.notes, o.notes, p.notes];
    for (const text of textPool) {
      if (typeof text === 'string' && text) {
        const match = text.match(/Müşteri:[^\(\n\r]*\(([^)]+)\)/i);
        if (match && match[1]?.trim()) {
          customerPhone = match[1].trim();
          break;
        }
      }
    }
  }

  // 4. MAĞAZA / PARTNER ADI
  let storeName = '';
  const storeCandidates = [
    item.store_name,
    item.partner_name,
    item.partner?.business_name,
    item.partner?.name,
    o.store_name,
    o.partner_name,
    o.partner?.business_name,
    o.partner?.name,
    p.store_name,
    p.partner_name,
    p.business_name,
    item.restaurant_name,
    o.restaurant_name,
  ];
  for (const sc of storeCandidates) {
    if (sc && typeof sc === 'string' && sc.trim() && sc.trim() !== 'Mağaza') {
      storeName = sc.trim();
      break;
    }
  }
  if (!storeName) {
    const rawPool = [item.raw_notes, item.task_description, o.task_description, item.notes, o.notes, p.notes];
    for (const text of rawPool) {
      if (typeof text === 'string' && text) {
        const match = text.match(/\[(?:Mağaza Siparişi\s*-\s*|Mağaza:\s*|Partner:\s*)([^\]]+)\]/i);
        if (match && match[1]?.trim()) {
          const found = match[1].trim();
          if (found && found !== 'Mağaza') {
            storeName = found;
            break;
          }
        }
      }
    }
  }

  // 5. ALINACAK ADRES (pickup_address)
  let pickupAddress = '';
  const pickupCandidates = [
    item.pickup_address,
    item.store_address,
    item.partner_address,
    item.origin_address,
    item.start_address,
    item.partner?.address,
    o.pickup_address,
    o.store_address,
    o.partner_address,
    o.origin_address,
    o.partner?.address,
    p.pickup_address,
    p.store_address,
    p.address,
  ];
  for (const pac of pickupCandidates) {
    if (pac && typeof pac === 'string' && pac.trim() && pac.trim() !== 'Mağaza' && pac.trim() !== 'Adres') {
      pickupAddress = pac.trim();
      break;
    }
  }

  // 6. ALINACAK ADRES DETAYI
  let pickupAddressDetail = '';
  const pickupDetailCandidates = [
    item.pickup_address_detail,
    item.pickup_detail,
    item.store_address_detail,
    item.partner_address_detail,
    item.address_detail,
    item.details,
    o.pickup_detail,
    o.pickup_address_detail,
    o.address_detail,
    p.pickup_address_detail,
    p.address_detail,
  ];
  for (const padc of pickupDetailCandidates) {
    if (padc && typeof padc === 'string' && padc.trim()) {
      pickupAddressDetail = padc.trim();
      break;
    }
  }

  // 7. TESLİM ADRESİ
  let deliveryAddress = '';
  const deliveryCandidates = [
    item.delivery_address,
    item.destination_address,
    item.customer_address,
    o.delivery_address,
    o.customer_address,
    p.delivery_address,
  ];
  for (const dac of deliveryCandidates) {
    if (dac && typeof dac === 'string' && dac.trim() && dac.trim() !== 'Adres' && dac.trim() !== 'Teslimat Adresi') {
      deliveryAddress = dac.trim();
      break;
    }
  }

  // 8. TESLİM ADRESİ DETAYI
  let deliveryAddressDetail = '';
  const deliveryDetailCandidates = [
    item.delivery_address_detail,
    item.delivery_detail,
    item.address_detail,
    item.details,
    o.delivery_detail,
    o.address_detail,
    p.delivery_address_detail,
  ];
  for (const dadc of deliveryDetailCandidates) {
    if (dadc && typeof dadc === 'string' && dadc.trim()) {
      if (dadc.trim() !== pickupAddressDetail || !pickupAddress) {
        deliveryAddressDetail = dadc.trim();
        break;
      }
    }
  }

  // 9. ÖDEME
  let paymentType = '';
  const paymentCandidates = [
    item.payment_type,
    item.payment_method,
    o.payment_type,
    p.payment_type,
  ];
  for (const pay of paymentCandidates) {
    if (pay && typeof pay === 'string' && pay.trim()) {
      paymentType = pay.trim();
      break;
    }
  }

  // 10. SİPARİŞ NOTU
  let notes = '';
  const notesCandidates = [
    item.notes,
    item.customer_note,
    o.notes,
    o.customer_note,
    p.customer_note,
    p.notes,
  ];
  for (const n of notesCandidates) {
    if (n && typeof n === 'string' && n.trim()) {
      const clean = n
        .replace(/\[.*?\]/g, '')
        .replace(/•?\s*Adres Detayı:[^\n\r]*/gi, '')
        .replace(/•?\s*Ne Zaman:[^\n\r]*/gi, '')
        .replace(/Müşteri:\s*[^\n\r]*/gi, '')
        .replace(/•?\s*Ürün(?:lerin)?\s*Toplamı:[^\n\r]*/gi, '')
        .replace(/•?\s*Asistan\s*Hizmet\s*Bedeli:[^\n\r]*/gi, '')
        .replace(/•?\s*Genel\s*Toplam:[^\n\r]*/gi, '')
        .replace(/•?\s*Toplam\s*Fiyat:[^\n\r]*/gi, '')
        .replace(/•?\s*Toplam\s*Tutar:[^\n\r]*/gi, '')
        .trim();
      if (clean && clean !== taskDescription && clean !== 'Hizmet Talebi' && clean !== 'Yapılacak iş belirtilmemiş.') {
        notes = clean;
        break;
      }
    }
  }

  // 11. ASİSTAN HİZMET BEDELİ (courier_net / assistant_fee)
  let courierNet = 0;
  const netCandidates = [
    item.courier_net,
    o.courier_net,
    p.courier_net,
    item.assistant_earning,
    item.courier_fee,
    item.assistant_fee,
    o.assistant_earning,
    o.courier_fee,
    o.assistant_fee,
    p.assistant_earning,
    p.courier_fee,
    p.assistant_fee,
  ];
  for (const net of netCandidates) {
    if (typeof net === 'number' && net > 0) {
      courierNet = net;
      break;
    } else if (typeof net === 'string' && !isNaN(parseFloat(net)) && parseFloat(net) > 0) {
      courierNet = parseFloat(net);
      break;
    }
  }

  // 12. ÜRÜNLERİN TOPLAMI (total_price / base_price / products_total)
  let totalPrice = 0;
  const totalCandidates = [
    item.total_price,
    item.base_price,
    item.products_total,
    item.products_price,
    o.total_price,
    o.base_price,
    p.total_price,
    p.base_price,
  ];
  for (const pr of totalCandidates) {
    if (typeof pr === 'number' && pr > 0) {
      totalPrice = pr;
      break;
    } else if (typeof pr === 'string' && !isNaN(parseFloat(pr)) && parseFloat(pr) > 0) {
      totalPrice = parseFloat(pr);
      break;
    }
  }

  // 13. MÜŞTERİ TOPLAM ÖDEYECEĞİ (customer_price)
  let customerPrice = 0;
  const priceCandidates = [
    item.customer_price,
    o.customer_price,
    p.customer_price,
  ];
  for (const pr of priceCandidates) {
    if (typeof pr === 'number' && pr > 0) {
      customerPrice = pr;
      break;
    } else if (typeof pr === 'string' && !isNaN(parseFloat(pr)) && parseFloat(pr) > 0) {
      customerPrice = parseFloat(pr);
      break;
    }
  }

  // Fallback regex parsing from notes/raw_notes/task_description
  const rawTextPool = [
    item.raw_notes,
    item.notes,
    item.task_description,
    o.raw_notes,
    o.notes,
    o.task_description,
    p.notes,
  ];
  for (const text of rawTextPool) {
    if (typeof text === 'string' && text) {
      if (totalPrice === 0) {
        const matchUrun = text.match(/(?:•\s*)?Ürün(?:lerin)?\s*Toplamı:\s*(\d+(?:[.,]\d+)?)/i);
        if (matchUrun && matchUrun[1]) {
          totalPrice = parseFloat(matchUrun[1].replace(',', '.'));
        }
      }
      if (courierNet === 0) {
        const matchAsistan = text.match(/(?:•\s*)?Asistan\s*Hizmet\s*Bedeli:\s*(\d+(?:[.,]\d+)?)/i);
        if (matchAsistan && matchAsistan[1]) {
          courierNet = parseFloat(matchAsistan[1].replace(',', '.'));
        }
      }
      if (customerPrice === 0) {
        const matchGenel = text.match(/(?:•\s*)?(?:Genel\s*Toplam|Toplam\s*Fiyat|Müşterinin\s*(?:Toplam\s*)?Ödeyeceği):\s*(\d+(?:[.,]\d+)?)/i);
        if (matchGenel && matchGenel[1]) {
          customerPrice = parseFloat(matchGenel[1].replace(',', '.'));
        }
      }
    }
  }

  // Price synchronization & consistency logic:
  if (customerPrice === 0) {
    if (totalPrice > 0 && courierNet > 0) {
      customerPrice = totalPrice + courierNet;
    } else if (totalPrice > 0) {
      customerPrice = totalPrice;
    } else if (courierNet > 0) {
      customerPrice = courierNet;
    }
  } else {
    // If customerPrice and courierNet exist, but totalPrice was unset or set equal to customerPrice
    if (courierNet > 0 && (totalPrice === 0 || totalPrice === customerPrice)) {
      totalPrice = customerPrice > courierNet ? (customerPrice - courierNet) : 0;
    } else if (totalPrice > 0 && customerPrice < totalPrice) {
      customerPrice = totalPrice + courierNet;
    }
  }

  // 14. MESAFE VE SÜRE
  let distance = '';
  const distCandidates = [
    item.distance,
    item.estimated_distance,
    item.calc_distance,
    o.distance,
    o.estimated_distance,
    p.distance,
    p.estimated_distance,
  ];
  for (const dist of distCandidates) {
    if (dist !== undefined && dist !== null && String(dist).trim() !== '') {
      const distStr = String(dist).trim();
      distance = distStr.includes('km') || distStr.includes('m') ? distStr : `${distStr} km`;
      break;
    }
  }

  let duration = '';
  const durCandidates = [
    item.duration,
    item.estimated_duration,
    item.estimated_time,
    o.duration,
    o.estimated_duration,
    o.estimated_time,
    p.duration,
    p.estimated_duration,
  ];
  for (const dur of durCandidates) {
    if (dur !== undefined && dur !== null && String(dur).trim() !== '') {
      const durStr = String(dur).trim();
      duration = durStr.includes('dk') || durStr.includes('min') || durStr.includes('saat') ? durStr : `${durStr} dk`;
      break;
    }
  }

  // 15. HİZMET TİPİ (hemen vs gecerken)
  let serviceType: 'hemen' | 'gecerken' = 'hemen';
  const rawServiceType = item.service_type || item.delivery_type || o.service_type || o.delivery_type || p.service_type || p.delivery_type || item.task_type;
  if (rawServiceType === 'gecerken' || rawServiceType === 'gecerken_ugra') {
    serviceType = 'gecerken';
  } else if (rawServiceType === 'hemen' || rawServiceType === 'hemen_ugra') {
    serviceType = 'hemen';
  } else {
    const fullText = (item.notes || '') + ' ' + (item.task_description || '') + ' ' + JSON.stringify(item.items || []) + ' ' + (o.notes || '') + ' ' + (o.task_description || '');
    if (fullText.includes('Geçerken') || fullText.includes('gecerken')) {
      serviceType = 'gecerken';
    } else {
      serviceType = 'hemen';
    }
  }

  // 16. HİZMET EYLEMİ (al vs birak)
  let serviceAction: 'al' | 'birak' = 'al';
  const rawAction = item.service_action || item.service_mode || item.action_type || o.service_action || o.service_mode || o.action_type || p.service_action || p.service_mode || p.action_type;
  if (rawAction === 'birak') {
    serviceAction = 'birak';
  } else if (rawAction === 'al') {
    serviceAction = 'al';
  } else {
    const fullText = (item.notes || '') + ' ' + (item.task_description || '') + ' ' + JSON.stringify(item.items || []) + ' ' + (o.notes || '') + ' ' + (o.task_description || '');
    if (fullText.includes('Hazır Olanı Bırak') || fullText.includes('Bırak') || fullText.includes('birak')) {
      serviceAction = 'birak';
    } else {
      serviceAction = 'al';
    }
  }

  const id = item.id || o.id || '';
  const orderNumber = item.order_number || (id ? id.slice(0, 8).toUpperCase() : 'GÖREV');
  const status = item.status || o.status || 'pending';

  const pLat = item.pickup_lat ?? o.pickup_lat ?? null;
  const pLng = item.pickup_lng ?? o.pickup_lng ?? null;
  const dLat = item.delivery_lat ?? o.delivery_lat ?? item.latitude ?? o.latitude ?? p.latitude ?? null;
  const dLng = item.delivery_lng ?? o.delivery_lng ?? item.longitude ?? o.longitude ?? p.longitude ?? null;

  // 17. ZAMAN TERCİHİ (preferred_time)
  let resolvedPreferredTime: string | null =
    item.preferred_time || o.preferred_time || p.preferred_time || item.raw_preferred_time || null;

  if (!resolvedPreferredTime) {
    const rawNotesList = [
      item.raw_notes,
      o.raw_notes,
      item.notes,
      o.notes,
      p.notes,
      item.task_description,
      o.task_description,
    ].filter((n): n is string => typeof n === 'string' && n.length > 0);

    for (const str of rawNotesList) {
      const match = str.match(/(?:•\s*)?Ne Zaman:\s*([^\n\r]+)/i);
      if (match && match[1]?.trim()) {
        resolvedPreferredTime = match[1].trim();
        break;
      }
    }
  }

  if (!resolvedPreferredTime && serviceType === 'gecerken') {
    resolvedPreferredTime = 'Gün içinde fark etmez';
  }

  const resolved: ResolvedTaskFields = {
    id,
    order_number: orderNumber,
    service_type: serviceType,
    service_action: serviceAction,
    status,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_address: deliveryAddress || item.customer_address || o.customer_address || '',
    task_description: taskDescription,
    store_name: storeName,
    pickup_address: pickupAddress,
    pickup_address_detail: pickupAddressDetail,
    delivery_address: deliveryAddress,
    delivery_address_detail: deliveryAddressDetail,
    preferred_time: resolvedPreferredTime,
    pickup_lat: pLat,
    pickup_lng: pLng,
    delivery_lat: dLat,
    delivery_lng: dLng,
    latitude: dLat ?? pLat,
    longitude: dLng ?? pLng,
    payment_type: paymentType || 'Kapıda Nakit',
    notes,
    total_price: totalPrice,
    courier_net: courierNet,
    customer_price: customerPrice,
    distance,
    duration,
  };

  if (typeof item === 'object' && item !== null) {
    taskFieldsCache.set(item, resolved);
  }
  return resolved;
}

// Sub-components for clean reusable UI rendering according to guidelines
const TaskDescriptionCard = React.memo(function TaskDescriptionCard({ description }: { description: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!description || description.trim() === '' || description === 'Yapılacak iş belirtilmemiş.' || description === 'Hizmet Talebi') {
    return null;
  }

  const cleanDesc = description
    .replace(/\[(?:Mağaza Siparişi\s*-\s*|Mağaza:\s*|Partner:\s*)[^\]]+\]\s*/gi, '')
    .replace(/^\[.*?\]\s*/g, '')
    .replace(/Müşteri:\s*[^\n\r]*/gi, '')
    .replace(/•?\s*Adres Detayı:[^\n\r]*/gi, '')
    .replace(/•?\s*Ne Zaman:[^\n\r]*/gi, '')
    .replace(/•?\s*Ürün(?:lerin)?\s*Toplamı:[^\n\r]*/gi, '')
    .replace(/•?\s*Asistan\s*Hizmet\s*Bedeli:[^\n\r]*/gi, '')
    .replace(/•?\s*Hizmet\s*Bedeli:[^\n\r]*/gi, '')
    .replace(/•?\s*Genel\s*Toplam:[^\n\r]*/gi, '')
    .replace(/•?\s*Toplam\s*Fiyat:[^\n\r]*/gi, '')
    .replace(/•?\s*Toplam\s*Tutar:[^\n\r]*/gi, '')
    .replace(/•?\s*Müşterinin\s*(?:Toplam\s*)?Ödeyeceği:[^\n\r]*/gi, '')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();

  if (!cleanDesc) {
    return null;
  }

  const isLong = cleanDesc.length > 110 || cleanDesc.split('\n').length > 4;

  return (
    <div className="bg-background p-3.5 rounded-xl border border-border space-y-1">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
        YAPILACAK İŞ
      </span>
      <div className={`text-foreground font-medium text-xs leading-relaxed ${isExpanded ? 'max-h-[250px] overflow-y-auto pr-1' : 'line-clamp-4'}`}>
        <p className="whitespace-pre-wrap">{cleanDesc}</p>
      </div>
      {isLong && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-primary font-bold text-xs pt-0.5 transition-colors cursor-pointer"
        >
          {isExpanded ? 'Daha Az Göster' : 'Devamını Gör'}
        </button>
      )}
    </div>
  );
});

const CustomerOfferCard = React.memo(function CustomerOfferCard({
  totalPrice,
  courierNet,
  customerPrice,
}: {
  totalPrice?: number;
  courierNet?: number;
  customerPrice?: number;
}) {
  const pTotal = Number(totalPrice) || 0;
  const cNet = Number(courierNet) || 0;
  const cTotal = Number(customerPrice) || 0;

  // Asistanın bu talebi kabul ettiğinde kazanacağı / net alacağı ücret
  const earning = cNet > 0 ? cNet : (cTotal > 0 ? cTotal : (pTotal > 0 ? pTotal : 0));

  return (
    <div className="bg-background p-3.5 rounded-xl border border-border space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
          MÜŞTERİ TEKLİFİ
        </span>
      </div>

      <div className="flex items-center justify-between pt-0.5">
        <span className="text-foreground/80 font-medium text-xs">Asistan Kazancı</span>
        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-base">
          {earning} TL
        </span>
      </div>
    </div>
  );
});

const CustomerLocationCard = React.memo(function CustomerLocationCard({
  address,
  addressDetail,
  lat,
  lng,
}: {
  address?: string;
  addressDetail?: string;
  lat?: number | null;
  lng?: number | null;
}) {
  const displayAddress = (address && address.trim() !== '' && address.trim() !== 'Adres')
    ? address.trim()
    : 'Adapazarı, Sakarya';

  const hasCoords = lat != null && lng != null && Number(lat) !== 0 && Number(lng) !== 0;

  const mapHref = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress)}`;

  return (
    <div className="bg-background p-3.5 rounded-xl border border-border text-xs space-y-1.5 w-full min-w-0">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          MÜŞTERİ KONUMU
        </span>
        <a
          href={mapHref}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1 bg-card hover:bg-accent/40 text-foreground border border-border font-bold text-[10px] rounded-lg shadow-xs cursor-pointer transition-all shrink-0 ml-auto flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3 text-muted-foreground" />
          <span>Haritada Aç</span>
        </a>
      </div>
      <p className="text-foreground text-xs font-medium leading-relaxed break-words whitespace-pre-wrap min-w-0 w-full text-left">
        {displayAddress}
      </p>
      {addressDetail && addressDetail.trim() !== '' && (
        <p className="text-muted-foreground text-[11px] pt-1 border-t border-border/60 leading-normal break-words whitespace-pre-wrap min-w-0 w-full text-left">
          Adres Detayı: {addressDetail.trim()}
        </p>
      )}
    </div>
  );
});

const CustomerInfoCard = React.memo(function CustomerInfoCard({ name, phone }: { name?: string; phone?: string }) {
  const cleanName = name && name.trim() !== '' && name.trim() !== 'Müşteri' ? name.trim() : null;
  const cleanPhone = phone && phone.trim() !== '' ? phone.trim() : null;

  return (
    <div className="bg-background p-3.5 rounded-xl border border-border space-y-1.5 text-xs w-full min-w-0">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block shrink-0">MÜŞTERİ BİLGİLERİ</span>
        {cleanPhone ? (
          <a
            href={`tel:${cleanPhone}`}
            className="px-2.5 py-1 bg-card hover:bg-accent/40 text-foreground border border-border font-bold text-[10px] rounded-lg shadow-xs cursor-pointer transition-all shrink-0 ml-auto flex items-center gap-1"
          >
            <Phone className="w-3 h-3 text-muted-foreground" />
            <span>Müşteriyi Ara</span>
          </a>
        ) : (
          <span className="px-2.5 py-1 bg-card opacity-50 text-muted-foreground border border-border font-bold text-[10px] rounded-lg shadow-xs shrink-0 ml-auto flex items-center gap-1 cursor-not-allowed">
            <Phone className="w-3 h-3 text-muted-foreground" />
            <span>Müşteriyi Ara</span>
          </span>
        )}
      </div>
      <div className="space-y-0.5 min-w-0">
        {cleanName && (
          <div className="text-foreground font-semibold text-xs truncate">
            <span>{cleanName}</span>
          </div>
        )}
        <div className="text-muted-foreground font-mono text-xs">
          <span>Telefon: {cleanPhone || 'Belirtilmemiş'}</span>
        </div>
      </div>
    </div>
  );
});

const DistanceDurationCard = React.memo(function DistanceDurationCard({ distance, duration }: { distance?: string; duration?: string }) {
  if (!distance && !duration) return null;

  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      {distance && (
        <div className="bg-background p-3 rounded-xl border border-border space-y-0.5">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Tahmini Mesafe</span>
          <span className="text-foreground font-medium text-xs font-mono block">{distance}</span>
        </div>
      )}
      {duration && (
        <div className="bg-background p-3 rounded-xl border border-border space-y-0.5">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Tahmini Süre</span>
          <span className="text-foreground font-medium text-xs font-mono block">{duration}</span>
        </div>
      )}
    </div>
  );
});

export function AsistanPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Mode switcher: 'panel' or 'application'
  const [activeTabMode, setActiveTabMode] = useState<'panel' | 'application'>('panel');
  
  // Auth state (Supabase Auth)
  const [authUser, setAuthUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSubmitting, setLoginSubmitting] = useState<boolean>(false);

  // Assistant & Operations state
  const [currentAssistant, setCurrentAssistant] = useState<Assistant | null>(null);
  const [connectedPartner, setConnectedPartner] = useState<Partner | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  
  // Assistant Subscription state
  const [subscription, setSubscription] = useState<AssistantSubscription | null>(null);
  const [subLoading, setSubLoading] = useState<boolean>(false);
  const [renewalSubmitting, setRenewalSubmitting] = useState<boolean>(false);
  
  // Drawer & Modal state for mobile courier experience
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<'wallet' | 'notifications' | 'settings' | 'subscription' | null>(null);
  

  // Tabs inside Assistant Panel: 'pending' | 'active' | 'completed' | 'profile' | 'iban'
  const [panelTab, setPanelTab] = useState<'pending' | 'active' | 'completed' | 'profile' | 'iban'>('pending');

  // IBAN Form State
  const [ibanAccountHolder, setIbanAccountHolder] = useState<string>('');
  const [ibanBankName, setIbanBankName] = useState<string>('');
  const [ibanValue, setIbanValue] = useState<string>('');
  const [isSavingIban, setIsSavingIban] = useState<boolean>(false);

  useEffect(() => {
    if (currentAssistant) {
      setIbanAccountHolder(currentAssistant.account_holder || currentAssistant.full_name || '');
      setIbanBankName(currentAssistant.bank_name || '');
      setIbanValue(currentAssistant.iban || '');
    }
  }, [currentAssistant]);

  const handleIbanInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!raw.startsWith('TR') && raw.length > 0) {
      if (raw.startsWith('T')) raw = 'TR' + raw.slice(1);
      else if (raw.startsWith('R')) raw = 'TR' + raw;
      else raw = 'TR' + raw;
    }
    raw = raw.slice(0, 26);

    let formatted = '';
    for (let i = 0; i < raw.length; i++) {
      if (i === 2 || i === 6 || i === 10 || i === 14 || i === 18 || i === 22) {
        formatted += ' ';
      }
      formatted += raw[i];
    }
    setIbanValue(formatted);
  };

  const handleIbanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAssistant?.id) {
      toast({
        title: "Hata",
        description: "Asistan oturumu bulunamadı.",
        variant: "destructive"
      });
      return;
    }

    const cleanIban = ibanValue.replace(/\s+/g, '').toUpperCase();
    if (!cleanIban.startsWith('TR') || cleanIban.length !== 26) {
      toast({
        title: "Geçersiz IBAN Formatı",
        description: "Lütfen TR ile başlayan 26 karakterlik geçerli bir Türkiye IBAN adresi giriniz.",
        variant: "destructive"
      });
      return;
    }

    setIsSavingIban(true);
    try {
      const updated = await db.updateAssistant(currentAssistant.id, {
        account_holder: ibanAccountHolder,
        bank_name: ibanBankName,
        iban: ibanValue
      });

      if (updated) {
        setCurrentAssistant(updated);
      }

      toast({
        title: "Bilgiler Kaydedildi",
        description: "IBAN bilgileriniz başarıyla kaydedildi.",
      });
    } catch (err: any) {
      console.error("Error saving IBAN:", err);
      toast({
        title: "Kayıt Hatası",
        description: err?.message || "IBAN bilgileri kaydedilirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsSavingIban(false);
    }
  };

  const handleCopyText = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({
      title: "Kopyalandı",
      description: `${label} panoya kopyalandı.`,
    });
  };
  
  // Orders & Tasks lists
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const rejectedOrderIdsRef = useRef<Set<string>>(new Set());
  const [rejectedOrderIds, setRejectedOrderIds] = useState<Set<string>>(new Set());
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter Orders for specific tabs
  const pendingOrders = useMemo(() => {
    const filtered = allOrders.filter((o) => {
      const orderId = o.id;
      const linkedTaskId = (o as any).task_id;
      const linkedOrderId = (o as any).order_id;
      const linkedOfferId = (o as any).offer_id;

      // 1. Central Rejection Check: If offer or order was rejected by this assistant, NEVER show
      if (
        (orderId && (rejectedOrderIds.has(orderId) || rejectedOrderIdsRef.current.has(orderId))) ||
        (linkedTaskId && (rejectedOrderIds.has(linkedTaskId) || rejectedOrderIdsRef.current.has(linkedTaskId))) ||
        (linkedOrderId && (rejectedOrderIds.has(linkedOrderId) || rejectedOrderIdsRef.current.has(linkedOrderId))) ||
        (linkedOfferId && (rejectedOrderIds.has(linkedOfferId) || rejectedOrderIdsRef.current.has(linkedOfferId)))
      ) {
        return false;
      }

      // 2. Primary Source of Truth: Must have an active dispatch offer specifically offered to this assistant
      if (!linkedOfferId) {
        return false;
      }

      // 3. Status check: Exclude any orders that have already transitioned to active/completed/cancelled
      const isAlreadyActiveOrFinished = [
        'assigned', 'rezerve', 'accepted', 'reserved', 'dogrulandi',
        'yolda', 'kuryede', 'teslimatta', 'in_progress', 'on_the_way',
        'delivered', 'completed', 'tamamlandi', 'teslim_edildi',
        'cancelled', 'iptal', 'iptal_edildi', 'rejected', 'reddedildi'
      ].includes(o.status);

      if (isAlreadyActiveOrFinished) {
        return false;
      }

      // 4. 30-Minute / Expiration Check
      if ((o as any).expires_at) {
        const expiresTime = new Date((o as any).expires_at).getTime();
        if (Date.now() >= expiresTime) return false;
      } else if (o.created_at) {
        const createdTime = new Date(o.created_at).getTime();
        if (Date.now() - createdTime >= 30 * 60 * 1000) return false;
      }

      return true;
    });

    console.log('[Pending Orders]', {
      beforeCount: allOrders.length,
      afterCount: filtered.length,
      offers: filtered.map((f: any) => ({
        orderId: f.id,
        offerId: f.offer_id,
        status: f.status,
        expires_at: f.expires_at
      }))
    });

    return filtered;
  }, [allOrders, rejectedOrderIds]);

  const activeOrders = allOrders.filter((o) => {
    const isActiveStatus = ['assigned', 'rezerve', 'accepted', 'reserved', 'dogrulandi', 'yolda', 'kuryede', 'teslimatta', 'in_progress', 'on_the_way'].includes(o.status);
    const isMine = currentAssistant && (o.assistant_id === currentAssistant.id || o.assistant_id === currentAssistant.user_id);
    return isActiveStatus && isMine;
  });

  const completedOrders = allOrders.filter((o) => {
    const isCompletedStatus = ['teslim_edildi', 'tamamlandi', 'completed'].includes(o.status);
    const isMine = currentAssistant && (o.assistant_id === currentAssistant.id || o.assistant_id === currentAssistant.user_id);
    return isCompletedStatus && isMine;
  });

  // Cancellation modal state for "Ulaşılamadı"
  const [cancelModalOrder, setCancelModalOrder] = useState<any | null>(null);
  const [cancelReasonText, setCancelReasonText] = useState<string>('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState<boolean>(false);

  // Delivery Code Verification state
  const [verificationCodes, setVerificationCodes] = useState<Record<string, string>>({});
  const [verificationErrors, setVerificationErrors] = useState<Record<string, string>>({});
  const [verifiedOrderIds, setVerifiedOrderIds] = useState<Record<string, boolean>>({});
  const [verifyingOrder, setVerifyingOrder] = useState<string | null>(null);

  // Lock body scroll when cancel modal is open
  useEffect(() => {
    if (cancelModalOrder) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [cancelModalOrder]);

  // Candidate Application state
  const [vehicleType, setVehicleType] = useState<'motosiklet' | 'bisiklet'>('motosiklet');
  const [stage, setStage] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState<ApplicationFormData>(initialFormData);
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [activeCities, setActiveCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [cityResolution, setCityResolution] = useState<{
    count: number;
    franchiseId: string | null;
    franchise: Franchise | null;
    franchises: Franchise[];
  }>({ count: 0, franchiseId: null, franchise: null, franchises: [] });
  const [cityResolving, setCityResolving] = useState(false);

  // Load active cities for candidate application
  useEffect(() => {
    let isMounted = true;
    const fetchActiveCities = async () => {
      setLoadingCities(true);
      try {
        const cts = await db.getActiveCities();
        if (isMounted) {
          setActiveCities(cts || []);
        }
      } catch (err) {
        console.error('Error fetching active cities for assistant registration:', err);
      } finally {
        if (isMounted) setLoadingCities(false);
      }
    };
    fetchActiveCities();
    return () => {
      isMounted = false;
    };
  }, []);

  // 1. Initialize Supabase Session & Listen to Auth Changes
  const checkAndInitSession = useCallback(async () => {
    setAuthLoading(true);
    setLoginError(null);
    try {
      if (!isSupabaseConfigured || !supabaseAssistant) {
        setAuthUser(null);
        setCurrentAssistant(null);
        return;
      }

      const { data: sessionData } = await supabaseAssistant.auth.getSession();
      let user = sessionData?.session?.user || null;

      if (!user) {
        // Fallback session check from localStorage for active assistants
        if (typeof window !== 'undefined') {
          const rawLocalSession = localStorage.getItem('ugra_assistant_session');
          if (rawLocalSession) {
            try {
              const parsed = JSON.parse(rawLocalSession);
              if (parsed?.assistant?.id || parsed?.user?.email) {
                const activeClient = supabaseAssistant || supabase;
                let freshAsst: Assistant | null = null;

                if (parsed.assistant?.id) {
                  const { data } = await activeClient
                    .from('assistants')
                    .select('*')
                    .eq('id', parsed.assistant.id)
                    .maybeSingle();
                  if (data) freshAsst = data as Assistant;
                }

                if (!freshAsst && parsed.user?.email) {
                  const { data } = await activeClient
                    .from('assistants')
                    .select('*')
                    .ilike('email', parsed.user.email)
                    .maybeSingle();
                  if (data) freshAsst = data as Assistant;
                }

                if (freshAsst) {
                  const statusStr = (freshAsst.status || '').toLowerCase();
                  const isAllowed = statusStr === 'aktif' || statusStr === 'approved' || statusStr === 'görevde' || freshAsst.active !== false;
                  if (isAllowed) {
                    const fallbackUser = parsed.user || { id: freshAsst.user_id || freshAsst.id, email: freshAsst.email };
                    setAuthUser(fallbackUser);
                    setCurrentAssistant(freshAsst);
                    setIsOnline(freshAsst.is_online !== false);
                    if (freshAsst.partner_id) {
                      const partnerData = await db.getPartnerById(freshAsst.partner_id);
                      setConnectedPartner(partnerData);
                    }
                    return;
                  }
                }
              }
            } catch (e) {
              console.warn('[AsistanPage] Local assistant session parse error:', e);
            }
          }
        }
        setAuthUser(null);
        setCurrentAssistant(null);
        return;
      }

      // Check public.profiles using authenticated client
      const activeClient = supabaseAssistant || (await getAuthenticatedClient());
      let profile: any = null;
      if (isUUID(user.id)) {
        const { data, error: profileErr } = await activeClient
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileErr) {
          console.error('Error fetching profile for assistant session:', profileErr);
        }
        profile = data;
      }

      // Rule 3: profile.assistant_id or user.id
      const assistantId = profile?.assistant_id || profile?.id || user.id;

      // Rule 4 & 5: Fetch from assistants table
      let asstRecord = await db.getAssistantById(assistantId, user.email || undefined);

      if (!asstRecord && isSupabaseConfigured) {
        try {
          if (isUUID(assistantId)) {
            const { data: rawAsst } = await activeClient
              .from('assistants')
              .select('*')
              .eq('id', assistantId)
              .maybeSingle();
            if (rawAsst) asstRecord = rawAsst as Assistant;
          }
          if (!asstRecord && isUUID(user.id)) {
            const { data: rawAsstByUser } = await activeClient
              .from('assistants')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle();
            if (rawAsstByUser) asstRecord = rawAsstByUser as Assistant;
          }
          if (!asstRecord && user.email) {
            const { data: rawAsstByEmail } = await activeClient
              .from('assistants')
              .select('*')
              .ilike('email', user.email)
              .maybeSingle();
            if (rawAsstByEmail) asstRecord = rawAsstByEmail as Assistant;
          }
        } catch (e) {
          console.warn('[AsistanPage] Assistant fallback query notice:', e);
        }
      }

      // If assistant record is passive, sign out immediately
      const asstStatus = asstRecord ? (asstRecord.status || '').toLowerCase() : '';
      if (asstRecord && (asstStatus === 'passive' || asstStatus === 'pasif' || asstStatus === 'deleted' || asstRecord.active === false)) {
        await supabaseAssistant.auth.signOut();
        if (typeof window !== 'undefined') localStorage.removeItem('ugra_assistant_session');
        setAuthUser(null);
        setCurrentAssistant(null);
        setLoginError('Bu asistan hesabı şu anda pasif durumdadır. Admin tarafından tekrar aktif edildiğinde giriş yapabilirsiniz.');
        return;
      }

      // Only sign out if profile explicitly exists AND has another role (like partner or customer) AND no assistant record exists
      if (profile && profile.role && profile.role !== 'assistant' && profile.role !== 'courier' && !asstRecord) {
        await supabaseAssistant.auth.signOut();
        if (typeof window !== 'undefined') localStorage.removeItem('ugra_assistant_session');
        setAuthUser(null);
        setCurrentAssistant(null);
        setLoginError('Bu hesap asistan hesabı değildir.');
        return;
      }

      setAuthUser(user);

      if (asstRecord) {
        // Link user_id if missing
        if (user.id && isUUID(user.id) && asstRecord.user_id !== user.id) {
          try {
            await activeClient
              .from('assistants')
              .update({ user_id: user.id })
              .eq('id', asstRecord.id);
            asstRecord.user_id = user.id;
          } catch (_) {}
        }

        setCurrentAssistant(asstRecord);
        setIsOnline(asstRecord.is_online !== false);

        // Fetch connected partner if exists
        if (asstRecord.partner_id) {
          const partnerData = await db.getPartnerById(asstRecord.partner_id);
          setConnectedPartner(partnerData);
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem('ugra_assistant_session', JSON.stringify({
            user: { id: user.id, email: user.email },
            assistant: asstRecord,
            timestamp: Date.now()
          }));
        }
      } else {
        // Construct fallback assistant profile
        const fallbackAsst: Assistant = {
          id: assistantId,
          user_id: user.id,
          full_name: profile?.full_name || user.email?.split('@')[0] || 'Saha Asistanı',
          phone: profile?.phone || '',
          email: user.email,
          city: 'İstanbul',
          vehicle_type: 'motosiklet',
          active: true,
          status: 'aktif',
          is_online: true,
          task_status: 'Müsait',
          created_at: new Date().toISOString()
        };
        setCurrentAssistant(fallbackAsst);
      }

      console.log('[Assistant Session Debug]', {
        authUserId: user.id,
        authEmail: user.email,
        profileId: profile?.id,
        profileRole: profile?.role,
        assistantId: asstRecord?.id || assistantId,
        assistantUserId: asstRecord?.user_id || user.id,
        storageKey: 'ugra_auth_assistant'
      });
    } catch (err: any) {
      console.error('Session init error:', err);
      setLoginError(err.message || 'Oturum açılırken bir hata oluştu.');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAndInitSession();

    if (isSupabaseConfigured && supabaseAssistant) {
      const { data: listener } = supabaseAssistant.auth.onAuthStateChange((event: any) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          checkAndInitSession();
        } else if (event === 'SIGNED_OUT') {
          setAuthUser(null);
          setCurrentAssistant(null);
        }
      });

      return () => {
        listener?.subscription?.unsubscribe();
      };
    }
  }, [checkAndInitSession]);

  // Check if current user is an approved and active assistant
  const isApprovedAssistant = Boolean(
    currentAssistant && currentAssistant.active !== false
  );

  // Ensure activeTabMode is locked to 'panel' for approved active assistants
  useEffect(() => {
    if (!authLoading) {
      if (isApprovedAssistant && activeTabMode !== 'panel') {
        setActiveTabMode('panel');
      }
    }
  }, [isApprovedAssistant, authLoading, activeTabMode]);

  // Get active authenticated Supabase client for assistant (strictly isolated to supabaseAssistant)
  const getAuthenticatedClient = useCallback(async () => {
    if (isSupabaseConfigured && supabaseAssistant) {
      return supabaseAssistant;
    }
    return supabase;
  }, []);

  // Fetch tasks assigned to / available for this assistant from public.orders AND public.tasks
  const fetchAssistantOrders = useCallback(async () => {
    if (!currentAssistant) return;
    setOrdersLoading(true);
    try {
      let tasksList: any[] = [];
      if (isSupabaseConfigured) {
        try {
          const activeClient = await getAuthenticatedClient();
          const assistantUserIds = Array.from(new Set([currentAssistant.user_id, currentAssistant.id, authUser?.id].filter(Boolean))) as string[];
          const nowMs = Date.now();

          console.log('[Dispatch Offers Debug]', {
            authUserId: authUser?.id,
            authEmail: authUser?.email,
            profileId: currentAssistant.user_id || authUser?.id,
            profileRole: (currentAssistant as any)?.role || 'assistant',
            'assistants.id': currentAssistant.id,
            'assistants.user_id': currentAssistant.user_id,
            canonicalDispatchAssistantId: currentAssistant.user_id || authUser?.id
          });

          // 1. Fetch ALL dispatch offers specifically for this assistant
          const { data: allOffersRes, error: offersErr } = await activeClient
            .from('dispatch_offers')
            .select('id, order_id, task_id, status, expires_at, offered_at, customer_price, courier_net')
            .in('assistant_id', assistantUserIds);

          console.log('[Dispatch Offers Query]', {
            queriedAssistantId: assistantUserIds,
            returnedOfferCount: allOffersRes?.length ?? 0,
            returnedOffers: allOffersRes || [],
            error: offersErr || null
          });

          const offerMap = new Map<string, string>();
          const offerMetaMap = new Map<string, any>();
          const pendingTargetIds = new Set<string>();

          if (allOffersRes && allOffersRes.length > 0) {
            allOffersRes.forEach((offer: any) => {
              const offerId = offer.id;
              const orderId = offer.order_id;
              const taskId = offer.task_id;
              const status = (offer.status || '').toLowerCase().trim();

              // If rejected, cancelled, declined or not pending -> add to rejected set strictly
              if (status === 'rejected' || status === 'cancelled' || status === 'declined' || status === 'expired') {
                if (offerId) rejectedOrderIdsRef.current.add(offerId);
                if (orderId) rejectedOrderIdsRef.current.add(orderId);
                if (taskId) rejectedOrderIdsRef.current.add(taskId);
                return;
              }

              // Check expiration (30 minutes or expires_at)
              const expiresTime = offer.expires_at ? new Date(offer.expires_at).getTime() : 0;
              const offeredTime = offer.offered_at ? new Date(offer.offered_at).getTime() : 0;
              const isExpired = (expiresTime > 0 && expiresTime <= nowMs) || (offeredTime > 0 && (nowMs - offeredTime >= 30 * 60 * 1000));

              if (isExpired) {
                if (offerId) rejectedOrderIdsRef.current.add(offerId);
                return;
              }

              // If pending and not in rejected set
              if (status === 'pending') {
                const isRejected = (
                  (offerId && rejectedOrderIdsRef.current.has(offerId)) ||
                  (orderId && rejectedOrderIdsRef.current.has(orderId)) ||
                  (taskId && rejectedOrderIdsRef.current.has(taskId))
                );

                if (!isRejected) {
                  if (orderId && isUUID(orderId)) {
                    pendingTargetIds.add(orderId);
                    offerMap.set(orderId, offerId);
                    offerMetaMap.set(orderId, offer);
                  }
                  if (taskId && isUUID(taskId)) {
                    pendingTargetIds.add(taskId);
                    offerMap.set(taskId, offerId);
                    offerMetaMap.set(taskId, offer);
                  }
                }
              }
            });
          }

          // Sync React state for rejected IDs
          setRejectedOrderIds(new Set(rejectedOrderIdsRef.current));

          // 2. Fetch assigned orders/tasks (for Active & Completed tabs) and pending orders/tasks (for Bekleyen Talepler)
          const targetPendingArray = Array.from(pendingTargetIds);
          const [assignedOrdersRes, assignedTasksRes, pendingOrdersRes, pendingTasksRes] = await Promise.all([
            activeClient.from('orders').select('*').in('assistant_id', assistantUserIds).order('created_at', { ascending: false }),
            activeClient.from('tasks').select('*').in('assistant_id', assistantUserIds).order('created_at', { ascending: false }),
            targetPendingArray.length > 0
              ? activeClient.from('orders').select('*').in('id', targetPendingArray).order('created_at', { ascending: false })
              : Promise.resolve({ data: [] }),
            targetPendingArray.length > 0
              ? activeClient.from('tasks').select('*').in('id', targetPendingArray).order('created_at', { ascending: false })
              : Promise.resolve({ data: [] }),
          ]);

          const rawOrdersMap = new Map<string, any>();
          (pendingOrdersRes?.data || []).forEach((o: any) => {
            if (o?.id && !rejectedOrderIdsRef.current.has(o.id)) {
              rawOrdersMap.set(o.id, o);
            }
          });
          (assignedOrdersRes?.data || []).forEach((o: any) => {
            if (o?.id) rawOrdersMap.set(o.id, o);
          });

          const rawTasksMap = new Map<string, any>();
          (pendingTasksRes?.data || []).forEach((t: any) => {
            if (t?.id && !rejectedOrderIdsRef.current.has(t.id)) {
              rawTasksMap.set(t.id, t);
            }
          });
          (assignedTasksRes?.data || []).forEach((t: any) => {
            if (t?.id) rawTasksMap.set(t.id, t);
          });

          // Check if any pending target is missing from rawOrdersMap and rawTasksMap
          const missingTargetIds = targetPendingArray.filter(id => !rawOrdersMap.has(id) && !rawTasksMap.has(id));
          if (missingTargetIds.length > 0) {
            console.log('[Dispatch Offers] Pending targets not returned by activeClient orders query, checking fallback:', missingTargetIds);
            try {
              const { data: fbOrders } = await supabase.from('orders').select('*').in('id', missingTargetIds);
              (fbOrders || []).forEach((o: any) => {
                if (o?.id && !rejectedOrderIdsRef.current.has(o.id)) {
                  rawOrdersMap.set(o.id, o);
                }
              });
            } catch (_) {}

            try {
              if (typeof window !== 'undefined') {
                const rawStored = localStorage.getItem('ugra_orders');
                if (rawStored) {
                  const storedOrders = JSON.parse(rawStored);
                  (storedOrders || []).forEach((o: any) => {
                    if (o?.id && missingTargetIds.includes(o.id) && !rawOrdersMap.has(o.id) && !rejectedOrderIdsRef.current.has(o.id)) {
                      rawOrdersMap.set(o.id, o);
                    }
                  });
                }
              }
            } catch (_) {}
          }

          // Ensure any pending offer with missing order row is synthesized directly from dispatch_offers so it is NEVER lost
          if (allOffersRes && allOffersRes.length > 0) {
            allOffersRes.forEach((offer: any) => {
              const offerId = offer.id;
              const targetId = offer.order_id || offer.task_id || offer.id;
              const status = (offer.status || '').toLowerCase().trim();

              if (status === 'pending' && !rejectedOrderIdsRef.current.has(offerId) && !rejectedOrderIdsRef.current.has(targetId)) {
                if (!rawOrdersMap.has(targetId) && !rawTasksMap.has(targetId)) {
                  console.log('[Dispatch Offers] Synthesizing order card directly from offer record:', {
                    offerId,
                    targetId,
                    customer_price: offer.customer_price,
                    courier_net: offer.courier_net
                  });

                  const synthOrder: any = {
                    id: targetId,
                    order_id: offer.order_id || targetId,
                    offer_id: offerId,
                    task_id: offer.task_id || targetId,
                    customer_name: 'Müşteri Talebi',
                    customer_phone: '',
                    customer_address: 'Hizmet Adresi',
                    delivery_address: 'Hizmet Adresi',
                    pickup_address: 'Hizmet Noktası',
                    payment_type: 'Kapıda Nakit',
                    total_price: Number(offer.customer_price || 0),
                    customer_price: Number(offer.customer_price || 0),
                    courier_net: Number(offer.courier_net || 0),
                    service_type: offer.service_type || 'hemen',
                    status: 'pending',
                    created_at: offer.offered_at || new Date().toISOString(),
                    expires_at: offer.expires_at || null,
                    task_description: `Yeni Görev Teklifi (${offer.service_type || 'Hızlı Teslimat'})`,
                    requires_delivery_code: true
                  };

                  rawOrdersMap.set(targetId, synthOrder);
                }
              }
            });
          }
          const rawOrders = Array.from(rawOrdersMap.values());
          const rawTasks = Array.from(rawTasksMap.values());

          let mappedOrders: any[] = [];
          if (rawOrders.length > 0) {
            mappedOrders = rawOrders
              .filter((order: any) => {
                const isAssignedToMe = order.assistant_id && assistantUserIds.includes(order.assistant_id);
                if (isAssignedToMe) return true;
                // For unassigned pending orders: must have active offer and must NOT be rejected
                const hasOffer = offerMap.has(order.id);
                const isRejected = rejectedOrderIdsRef.current.has(order.id);
                return hasOffer && !isRejected;
              })
              .map((order: any) => {
              let rawDesc = order.task_description || order.notes || '';
              let extractedName = '';
              const custMatch = rawDesc.match(/Müşteri:\s*([^\(\n\r]+)/i);
              if (custMatch && custMatch[1]?.trim()) {
                extractedName = custMatch[1].trim();
              }

              let extractedPhone = '';
              const phoneMatch = rawDesc.match(/Müşteri:[^\(\n\r]*\(([^)]+)\)/i);
              if (phoneMatch && phoneMatch[1]?.trim()) {
                extractedPhone = phoneMatch[1].trim();
              }

              let extractedStoreName = '';
              const storeMatch = rawDesc.match(/\[(?:Mağaza Siparişi\s*-\s*|Mağaza:\s*|Partner:\s*)([^\]]+)\]/i);
              if (storeMatch && storeMatch[1]?.trim() && storeMatch[1].trim() !== 'Mağaza') {
                extractedStoreName = storeMatch[1].trim();
              }

              let desc = rawDesc;
              if (desc && desc.includes('[') && desc.includes(']')) {
                desc = desc
                  .replace(/^\[.*?\]\s*/, '')
                  .replace(/• Adres Detayı:[^\n\r]*/gi, '')
                  .replace(/• Ne Zaman:[^\n\r]*/gi, '')
                  .trim();
              }
              desc = desc
                .replace(/Müşteri:\s*[^\n\r]*/gi, '')
                .replace(/•?\s*Ürün Toplamı:[^\n\r]*/gi, '')
                .replace(/•?\s*Asistan Hizmet Bedeli:[^\n\r]*/gi, '')
                .replace(/•?\s*Genel Toplam:[^\n\r]*/gi, '')
                .replace(/•?\s*Toplam Fiyat:[^\n\r]*/gi, '')
                .replace(/•?\s*Toplam Tutar:[^\n\r]*/gi, '')
                .replace(/\n\s*\n\s*\n/g, '\n\n')
                .trim();

              let noteStr = order.notes || '';
              if (noteStr) {
                noteStr = noteStr
                  .replace(/\[.*?\]/g, '')
                  .replace(/• Adres Detayı:[^\n\r]*/gi, '')
                  .replace(/• Ne Zaman:[^\n\r]*/gi, '')
                  .replace(/Müşteri:\s*[^\n\r]*/gi, '')
                  .replace(/•?\s*Ürün Toplamı:[^\n\r]*/gi, '')
                  .replace(/•?\s*Asistan Hizmet Bedeli:[^\n\r]*/gi, '')
                  .replace(/•?\s*Genel Toplam:[^\n\r]*/gi, '')
                  .trim();
                if (noteStr === desc) noteStr = '';
              }

              const finalName = order.customer_name && order.customer_name !== 'Müşteri' && order.customer_name.trim() !== ''
                ? order.customer_name.trim()
                : (extractedName || 'Müşteri');

              const finalStore = order.store_name || order.partner_name || extractedStoreName || undefined;
              const offerMeta = offerMetaMap.get(order.id);

              return {
                id: order.id,
                order_id: order.id,
                customer_id: order.customer_id || order.user_id || null,
                user_id: order.user_id || order.customer_id || null,
                customer_name: finalName,
                customer_phone: order.customer_phone || extractedPhone || '',
                customer_address: order.customer_address || order.delivery_address || 'Adres',
                delivery_address: order.delivery_address || order.customer_address || '',
                pickup_address: order.pickup_address || finalStore || '',
                store_name: finalStore,
                payment_type: order.payment_type || 'Kapıda Nakit',
                total_price: Number(order.total_price || order.customer_price || 0),
                customer_price: Number(order.customer_price || order.total_price || 0),
                courier_net: Number(order.courier_net || (offerMeta?.courier_net) || 0),
                items: order.items || [],
                notes: noteStr || undefined,
                raw_notes: order.notes || null,
                preferred_time: order.preferred_time || null,
                latitude: order.latitude ?? null,
                longitude: order.longitude ?? null,
                accuracy: order.accuracy ?? null,
                street: order.street ?? null,
                district: order.district ?? null,
                city: order.city ?? null,
                province: order.province ?? null,
                postal_code: order.postal_code ?? null,
                place_id: order.place_id ?? null,
                pickup_lat: order.pickup_lat ?? order.latitude ?? null,
                pickup_lng: order.pickup_lng ?? order.longitude ?? null,
                delivery_lat: order.delivery_lat ?? order.latitude ?? null,
                delivery_lng: order.delivery_lng ?? order.longitude ?? null,
                requires_delivery_code: order.requires_delivery_code ?? true,
                delivery_code: order.delivery_code ?? null,
                delivery_code_verified: order.delivery_code_verified ?? false,
                created_at: order.created_at,
                expires_at: offerMeta?.expires_at || null,

                assistant_id: order.assistant_id || null,
                assistant_name: order.assistant_name || null,
                assistant_phone: order.assistant_phone || null,
                status: order.status,
                accepted_at: order.accepted_at || null,
                started_at: order.started_at || order.accepted_at || null,
                completed_at: order.delivered_at || order.completed_at || null,
                cancelled_at: order.cancelled_at || null,
                service_type: order.service_type || 'hemen',
                task_description: desc || undefined,
                offer_id: offerMap.get(order.id) || null,
              };
            });
          }

          let mappedTasks: any[] = [];
          if (rawTasks.length > 0) {
            mappedTasks = rawTasks
              .filter((task: any) => {
                const isAssignedToMe = task.assistant_id && assistantUserIds.includes(task.assistant_id);
                if (isAssignedToMe) return true;
                // For unassigned pending tasks: must have active offer and must NOT be rejected
                const hasOffer = offerMap.has(task.id);
                const isRejected = rejectedOrderIdsRef.current.has(task.id);
                return hasOffer && !isRejected;
              })
              .map((task: any) => {
              let rawDesc = task.task_description || task.description || task.title || task.notes || '';
              let extractedName = '';
              const custMatch = rawDesc.match(/Müşteri:\s*([^\(\n\r]+)/i);
              if (custMatch && custMatch[1]?.trim()) {
                extractedName = custMatch[1].trim();
              }

              let extractedPhone = '';
              const phoneMatch = rawDesc.match(/Müşteri:[^\(\n\r]*\(([^)]+)\)/i);
              if (phoneMatch && phoneMatch[1]?.trim()) {
                extractedPhone = phoneMatch[1].trim();
              }

              let extractedStoreName = '';
              const storeMatch = rawDesc.match(/\[(?:Mağaza Siparişi\s*-\s*|Mağaza:\s*|Partner:\s*)([^\]]+)\]/i);
              if (storeMatch && storeMatch[1]?.trim() && storeMatch[1].trim() !== 'Mağaza') {
                extractedStoreName = storeMatch[1].trim();
              }

              let desc = rawDesc;
              if (desc && desc.includes('[') && desc.includes(']')) {
                desc = desc
                  .replace(/^\[.*?\]\s*/, '')
                  .replace(/• Adres Detayı:[^\n\r]*/gi, '')
                  .replace(/• Ne Zaman:[^\n\r]*/gi, '')
                  .trim();
              }
              desc = desc
                .replace(/Müşteri:\s*[^\n\r]*/gi, '')
                .replace(/•?\s*Ürün Toplamı:[^\n\r]*/gi, '')
                .replace(/•?\s*Asistan Hizmet Bedeli:[^\n\r]*/gi, '')
                .replace(/•?\s*Genel Toplam:[^\n\r]*/gi, '')
                .replace(/•?\s*Toplam Fiyat:[^\n\r]*/gi, '')
                .replace(/•?\s*Toplam Tutar:[^\n\r]*/gi, '')
                .replace(/\n\s*\n\s*\n/g, '\n\n')
                .trim();

              let noteStr = task.notes || '';
              if (noteStr) {
                noteStr = noteStr
                  .replace(/\[.*?\]/g, '')
                  .replace(/• Adres Detayı:[^\n\r]*/gi, '')
                  .replace(/• Ne Zaman:[^\n\r]*/gi, '')
                  .replace(/Müşteri:\s*[^\n\r]*/gi, '')
                  .replace(/•?\s*Ürün Toplamı:[^\n\r]*/gi, '')
                  .replace(/•?\s*Asistan Hizmet Bedeli:[^\n\r]*/gi, '')
                  .replace(/•?\s*Genel Toplam:[^\n\r]*/gi, '')
                  .trim();
                if (noteStr === desc) noteStr = '';
              }

              const finalName = task.customer_name && task.customer_name !== 'Müşteri' && task.customer_name.trim() !== ''
                ? task.customer_name.trim()
                : (extractedName || 'Müşteri');

              const finalStore = task.store_name || task.partner_name || extractedStoreName || undefined;
              const offerMeta = offerMetaMap.get(task.id);

              return {
                id: task.id,
                task_id: task.id,
                is_task: true,
                source: 'tasks',
                customer_id: task.customer_id || task.user_id || null,
                user_id: task.user_id || task.customer_id || null,
                customer_name: finalName,
                customer_phone: task.customer_phone || extractedPhone || '',
                customer_address: task.customer_address || task.delivery_address || 'Adres',
                delivery_address: task.delivery_address || task.customer_address || '',
                pickup_address: task.pickup_address || finalStore || '',
                store_name: finalStore,
                payment_type: task.payment_type || 'Kapıda Kart',
                total_price: Number(task.total_price || task.customer_price || 0),
                customer_price: Number(task.customer_price || task.total_price || 0),
                courier_net: Number(task.courier_net || (offerMeta?.courier_net) || 0),
                items: task.items || [],
                notes: noteStr || undefined,
                raw_notes: task.notes || null,
                latitude: task.latitude ?? task.pickup_lat ?? null,
                longitude: task.longitude ?? task.pickup_lng ?? null,
                pickup_lat: task.pickup_lat ?? task.latitude ?? null,
                pickup_lng: task.pickup_lng ?? task.longitude ?? null,
                delivery_lat: task.delivery_lat ?? task.latitude ?? null,
                delivery_lng: task.delivery_lng ?? task.longitude ?? null,
                created_at: task.created_at,
                expires_at: offerMeta?.expires_at || null,

                assistant_id: task.assistant_id || null,
                assistant_name: task.assistant_name || null,
                assistant_phone: task.assistant_phone || null,
                status: task.status || 'bekliyor',
                accepted_at: task.accepted_at || null,
                started_at: task.started_at || task.accepted_at || null,
                completed_at: task.completed_at || task.delivered_at || null,
                cancelled_at: task.cancelled_at || null,
                service_type: task.service_type || 'asistan_siparis',
                task_description: desc || 'Mağaza Ürün Siparişi',
                offer_id: offerMap.get(task.id) || null,
              };
            });
          }

          tasksList = [...mappedOrders, ...mappedTasks];
          tasksList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } catch (e) {
          console.warn('[AsistanPage] Supabase orders/tasks fetch warning:', e);
        }
      }

      setAllOrders(tasksList as Order[]);
    } catch (err) {
      console.error('Error fetching assistant tasks:', err);
    } finally {
      setOrdersLoading(false);
    }
  }, [currentAssistant, authUser?.id, getAuthenticatedClient]);

  // Fetch Assistant Subscription Details
  const fetchAssistantSubscription = useCallback(async () => {
    if (!currentAssistant || !isSupabaseConfigured) return;
    setSubLoading(true);
    try {
      const activeClient = await getAuthenticatedClient();
      const assistantUserIds = [currentAssistant.id, currentAssistant.user_id].filter(Boolean) as string[];
      const { data, error } = await activeClient
        .from('assistant_subscriptions')
        .select('*')
        .in('assistant_id', assistantUserIds)
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('[AsistanPage] assistant_subscriptions fetch warning:', error);
      } else if (data) {
        setSubscription(data as AssistantSubscription);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      console.warn('[AsistanPage] Subscription fetch error:', err);
    } finally {
      setSubLoading(false);
    }
  }, [currentAssistant, getAuthenticatedClient]);

  // Renewal / Subscription Request Handler
  const handleRenewalRequest = async () => {
    if (!currentAssistant || !isSupabaseConfigured) return;
    setRenewalSubmitting(true);
    try {
      const activeClient = await getAuthenticatedClient();
      const { data: sessionData } = await activeClient.auth.getSession();

      if (!sessionData?.session) {
        toast({
          title: 'Oturum Hatası',
          description: 'Oturum doğrulanamadı. Lütfen sayfayı yenileyip tekrar giriş yapın.',
          variant: 'destructive'
        });
        setRenewalSubmitting(false);
        return;
      }

      const nowIso = new Date().toISOString();
      let rpcSuccess = false;

      // 1. Try secure SECURITY DEFINER RPC function first
      try {
        const { data: rpcData, error: rpcErr } = await activeClient.rpc('request_assistant_subscription', {
          p_assistant_id: currentAssistant.id
        });
        if (!rpcErr && rpcData) {
          rpcSuccess = true;
          if (typeof rpcData === 'object') {
            setSubscription(rpcData as AssistantSubscription);
          }
        }
      } catch (e) {
        console.warn('RPC request_assistant_subscription notice, using fallback:', e);
      }

      // 2. Fallback to direct table query if RPC was unavailable
      if (!rpcSuccess) {
        if (subscription?.id) {
          const { error } = await activeClient
            .from('assistant_subscriptions')
            .update({
              renewal_requested: true,
              renewal_decision: 'pending',
              updated_at: nowIso
            })
            .eq('id', subscription.id);

          if (error) throw error;

          setSubscription((prev) => prev ? {
            ...prev,
            renewal_requested: true,
            renewal_decision: 'pending',
            updated_at: nowIso
          } : null);
        } else {
          const { data: newSubData, error } = await activeClient
            .from('assistant_subscriptions')
            .insert({
              assistant_id: currentAssistant.id,
              status: 'inactive',
              payment_status: 'pending',
              renewal_requested: true,
              renewal_decision: 'pending',
              created_at: nowIso,
              updated_at: nowIso
            })
            .select('*')
            .single();

          if (error) throw error;
          if (newSubData) {
            setSubscription(newSubData as AssistantSubscription);
          }
        }
      }

      await fetchAssistantSubscription();

      toast({
        title: 'Talep Alındı',
        description: 'Abonelik talebiniz yöneticiye gönderildi.',
      });
    } catch (err: any) {
      console.error('Renewal request error:', err);
      toast({
        title: 'Hata',
        description: err.message || 'Abonelik talebi gönderilemedi.',
        variant: 'destructive'
      });
    } finally {
      setRenewalSubmitting(false);
    }
  };

  // Helper calculation for subscription remaining days
  const getSubscriptionDaysRemaining = (expiresAtStr?: string) => {
    if (!expiresAtStr) return 0;
    const expiryDate = new Date(expiresAtStr);
    const now = new Date();
    const expiryUtc = Date.UTC(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate());
    const nowUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = expiryUtc - nowUtc;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatTurkishDateStr = (dateStr?: string) => {
    if (!dateStr) return 'Belirtilmemiş';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return dateStr.split('T')[0];
    }
  };

  const formatPaymentStatusText = (status?: string) => {
    if (!status) return null;
    const s = status.toLowerCase();
    if (s === 'pending') return 'Ödeme bekleniyor';
    if (s === 'paid') return 'Ödeme tamamlandı';
    if (s === 'failed') return 'Ödeme başarısız';
    return status;
  };

  // Manual Refresh Handler with minimum visual delay for UX feedback
  const handleManualRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    const startTime = Date.now();
    try {
      await Promise.all([fetchAssistantOrders(), fetchAssistantSubscription()]);
    } finally {
      const elapsed = Date.now() - startTime;
      const minDuration = 500; // Minimum 500ms spinning feedback for smooth UX
      if (elapsed < minDuration) {
        await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed));
      }
      setIsRefreshing(false);
    }
  }, [fetchAssistantOrders, fetchAssistantSubscription, isRefreshing]);

  useEffect(() => {
    if (currentAssistant) {
      fetchAssistantOrders();
      fetchAssistantSubscription();
      const interval = setInterval(fetchAssistantOrders, 8000);
      return () => clearInterval(interval);
    }
  }, [currentAssistant, fetchAssistantOrders, fetchAssistantSubscription]);

  const fetchOrdersRef = useRef(fetchAssistantOrders);
  useEffect(() => {
    fetchOrdersRef.current = fetchAssistantOrders;
  }, [fetchAssistantOrders]);

  // Subscribe to Realtime orders, tasks and dispatch_offers table updates
  useEffect(() => {
    if (!currentAssistant?.id) return;

    let ordersChannel: any = null;
    let tasksChannel: any = null;
    let offersChannel: any = null;
    const client = supabaseAssistant || supabase;
    const assistantUserIds = Array.from(new Set([currentAssistant.user_id, currentAssistant.id, authUser?.id].filter(Boolean))) as string[];

    if (isSupabaseConfigured && client) {
      ordersChannel = client
        .channel(`assistant-orders-${currentAssistant.id}`)
        .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'orders' }, () => {
          fetchOrdersRef.current();
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log(`[AsistanPage] Realtime subscribed for assistant orders`);
          }
        });

      tasksChannel = client
        .channel(`assistant-tasks-${currentAssistant.id}`)
        .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'tasks' }, () => {
          fetchOrdersRef.current();
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log(`[AsistanPage] Realtime subscribed for assistant tasks`);
          }
        });

      offersChannel = client
        .channel(`assistant-offers-${currentAssistant.id}`)
        .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'dispatch_offers' }, (payload: any) => {
          const newRecord = payload?.new;
          const belongsToMe = newRecord && assistantUserIds.includes(newRecord.assistant_id);

          console.log('[Dispatch Offers Realtime]', {
            eventType: payload?.eventType,
            offerId: newRecord?.id || payload?.old?.id,
            offerAssistantId: newRecord?.assistant_id,
            authUserId: authUser?.id,
            canonicalDispatchAssistantId: currentAssistant?.user_id || authUser?.id,
            belongsToMe: !!belongsToMe,
            status: newRecord?.status
          });

          if (belongsToMe) {
            const offerId = newRecord.id;
            const targetId = newRecord.order_id || newRecord.task_id;
            const status = (newRecord.status || '').toLowerCase().trim();

            if (status === 'rejected' || status === 'cancelled' || status === 'declined' || status === 'expired') {
              if (offerId) rejectedOrderIdsRef.current.add(offerId);
              if (targetId) rejectedOrderIdsRef.current.add(targetId);
              if (newRecord.order_id) rejectedOrderIdsRef.current.add(newRecord.order_id);
              if (newRecord.task_id) rejectedOrderIdsRef.current.add(newRecord.task_id);
              setRejectedOrderIds(new Set(rejectedOrderIdsRef.current));

              setAllOrders((prev) =>
                prev.filter((o) => {
                  if (o.id === targetId || o.id === offerId) return false;
                  if ((o as any).order_id === targetId || (o as any).order_id === newRecord.order_id) return false;
                  if ((o as any).task_id === targetId || (o as any).task_id === newRecord.task_id) return false;
                  if ((o as any).offer_id === offerId) return false;
                  return true;
                })
              );
              return;
            }
          }

          fetchOrdersRef.current();
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log(`[AsistanPage] Realtime subscribed for assistant dispatch_offers`);
          }
        });
    }

    return () => {
      if (client) {
        if (ordersChannel) client.removeChannel(ordersChannel);
        if (tasksChannel) client.removeChannel(tasksChannel);
        if (offersChannel) client.removeChannel(offersChannel);
      }
    };
  }, [currentAssistant?.id, currentAssistant?.user_id, authUser?.id]);

  // Rule 1 & 2: Asistan Giriş (Assistant Login)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSubmitting(true);

    try {
      if (!loginEmail || !loginPassword) {
        throw new Error('E-posta adresi ve şifrenizi giriniz.');
      }

      const cleanEmail = loginEmail.trim().toLowerCase();

      if (isSupabaseConfigured && supabaseAssistant) {
        let authUser: SupabaseUser | null = null;
        let authSuccess = false;

        // 1. Try Supabase Auth signInWithPassword
        const { data: authData, error: authErr } = await supabaseAssistant.auth.signInWithPassword({
          email: cleanEmail,
          password: loginPassword,
        });

        if (!authErr && authData?.user) {
          authUser = authData.user;
          authSuccess = true;
        }

        // 2. Fetch assistant record from DB
        const activeClient = supabaseAssistant || supabase;
        let dbAssistant: Assistant | null = null;

        if (authUser?.id && isUUID(authUser.id)) {
          const { data: byUser } = await activeClient
            .from('assistants')
            .select('*')
            .eq('user_id', authUser.id)
            .maybeSingle();
          if (byUser) dbAssistant = byUser as Assistant;
        }

        if (!dbAssistant) {
          const { data: byEmail } = await activeClient
            .from('assistants')
            .select('*')
            .ilike('email', cleanEmail)
            .maybeSingle();
          if (byEmail) dbAssistant = byEmail as Assistant;
        }

        // 3. Evaluate assistant status & credentials
        if (dbAssistant) {
          const asstStatus = (dbAssistant.status || '').toLowerCase();

          if (asstStatus === 'pending') {
            if (authSuccess) await supabaseAssistant.auth.signOut();
            throw new Error('Başvurunuz yönetici onayı bekliyor.');
          }

          if (asstStatus === 'passive' || asstStatus === 'pasif' || asstStatus === 'deleted' || dbAssistant.active === false) {
            if (authSuccess) await supabaseAssistant.auth.signOut();
            throw new Error('Bu asistan hesabı şu anda pasif durumdadır. Admin tarafından tekrar aktif edildiğinde giriş yapabilirsiniz.');
          }

          if (asstStatus === 'rejected' || asstStatus === 'suspended') {
            if (authSuccess) await supabaseAssistant.auth.signOut();
            throw new Error('Asistan hesabınız askıya alınmıştır veya dondurulmuştur.');
          }

          // If auth was not successful, verify stored password or sync Auth user
          const dbPassword = (dbAssistant as any).password;
          if (!authSuccess) {
            if (dbPassword && dbPassword !== loginPassword) {
              throw new Error('E-posta adresi veya şifre hatalı.');
            }

            // Attempt user registration / sign up to sync Auth user
            const { data: signUpData } = await supabaseAssistant.auth.signUp({
              email: cleanEmail,
              password: loginPassword,
              options: {
                data: {
                  full_name: dbAssistant.full_name,
                  role: 'assistant'
                }
              }
            });

            if (signUpData?.user) {
              authUser = signUpData.user;
              authSuccess = true;
            } else {
              // Try login once more in case signup linked credentials
              const { data: retryData } = await supabaseAssistant.auth.signInWithPassword({
                email: cleanEmail,
                password: loginPassword,
              });
              if (retryData?.user) {
                authUser = retryData.user;
                authSuccess = true;
              }
            }
          }

          // Ensure user_id in assistants table is linked to authUser.id
          if (authUser?.id && isUUID(authUser.id) && dbAssistant.user_id !== authUser.id) {
            try {
              await activeClient
                .from('assistants')
                .update({ user_id: authUser.id })
                .eq('id', dbAssistant.id);
              dbAssistant.user_id = authUser.id;
            } catch (linkErr) {
              console.warn('[AsistanPage] Failed linking user_id:', linkErr);
            }
          }
        } else {
          // No record in assistants table
          if (!authSuccess) {
            throw new Error('E-posta adresi veya şifre hatalı.');
          }
        }

        if (!authSuccess && !dbAssistant) {
          throw new Error('E-posta adresi veya şifre hatalı.');
        }

        // Store fallback local session for resilience
        if (typeof window !== 'undefined') {
          const effectiveUser = authUser || { id: dbAssistant?.user_id || dbAssistant?.id || 'asst_session', email: cleanEmail };
          localStorage.setItem('ugra_assistant_session', JSON.stringify({
            user: effectiveUser,
            assistant: dbAssistant,
            timestamp: Date.now()
          }));
        }

        console.log('[Assistant Login Submit Debug]', {
          authUser: authUser ? { id: authUser.id, email: authUser.email } : null,
          dbAssistant: dbAssistant ? { id: dbAssistant.id, user_id: dbAssistant.user_id, email: dbAssistant.email } : null,
          storageKey: 'ugra_auth_assistant'
        });

        toast({
          title: 'Giriş Başarılı ✅',
          description: 'Asistan paneline yönlendiriliyorsunuz.',
        });

        await checkAndInitSession();
      } else {
        throw new Error('Supabase veritabanı bağlantısı henüz yapılandırılmamış.');
      }
    } catch (err: any) {
      console.error('Assistant login catch error:', err);
      setLoginError(err.message || 'Giriş sırasında hata oluştu.');
    } finally {
      setLoginSubmitting(false);
    }
  };

  // Rule 13: Sign Out (Çıkış Yap)
  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ugra_assistant_session');
      }
      if (isSupabaseConfigured && supabaseAssistant) {
        await supabaseAssistant.auth.signOut();
      }
      setAuthUser(null);
      setCurrentAssistant(null);
      setConnectedPartner(null);
      setLoginError(null);
      toast({
        title: 'Çıkış Yapıldı',
        description: 'Asistan oturumunuz kapatıldı.',
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Online / Offline Toggle
  const handleToggleOnline = async () => {
    if (!currentAssistant) return;

    if (isOnline && activeOrders.length > 0) {
      return;
    }

    const nextState = !isOnline;
    setIsOnline(nextState);

    try {
      if (isSupabaseConfigured && supabase) {
        await supabase
          .from('assistants')
          .update({ status: nextState ? 'aktif' : 'pasif' })
          .eq('id', currentAssistant.id);
      }
      toast({
        title: nextState ? 'Çevrimiçi Olundu 🟢' : 'Çevrimdışı Olundu 🔴',
        description: nextState ? 'Saha sipariş bildirimleri aktif.' : 'Saha bildirimleri durduruldu.',
      });
    } catch (err) {
      console.warn('Error updating online status:', err);
    }
  };

  // 1. STATUS = "beklemede" -> "Kabul Et"
  const handleAcceptOrder = async (orderId: string, offerId?: string) => {
    if (!currentAssistant) return;

    if (activeOrders.length > 0) {
      toast({
        title: 'Aktif Siparişiniz Var',
        description: 'Aynı anda birden fazla aktif sipariş alamazsınız.',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(orderId);
    const assistantId = currentAssistant.id || currentAssistant.user_id || '';
    const assistantName = currentAssistant.full_name || (currentAssistant as any).name || 'Saha Asistanı';
    const nowIso = new Date().toISOString();

    // Optimistic state update so UI moves order to active immediately
    setAllOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, assistant_id: assistantId, assistant_name: assistantName, status: 'accepted' }
          : o
      )
    );

    try {
      const targetItem = allOrders.find(o => o.id === orderId || (o as any).task_id === orderId);
      const isTask = Boolean((targetItem as any)?.is_task || (targetItem as any)?.source === 'tasks' || (targetItem as any)?.service_type === 'asistan_siparis');

      if (isSupabaseConfigured) {
        const activeClient = await getAuthenticatedClient();
        if (isTask) {
          await activeClient
            .from('tasks')
            .update({
              assistant_id: assistantId,
              assistant_name: assistantName,
              status: 'accepted',
              accepted_at: nowIso
            })
            .eq('id', orderId);
        } else {
          const orderCols = await getExactTableColumns('orders');
          const rawOrderPayload: Record<string, any> = {
            assistant_id: assistantId,
            status: 'accepted',
            accepted_at: nowIso,
            updated_at: nowIso
          };
          const orderPayload = filterPayloadByValidColumns(rawOrderPayload, orderCols);
          if (Object.keys(orderPayload).length > 0) {
            const { error: ordersErr } = await activeClient
              .from('orders')
              .update(orderPayload)
              .eq('id', orderId);

            if (ordersErr) {
              console.error('Error updating orders table for accept:', ordersErr);
            }
          }
        }
      }

      const targetOfferId = (offerId && isUUID(offerId))
        ? offerId
        : (isUUID((targetItem as any)?.offer_id) ? (targetItem as any)?.offer_id : undefined);
      await LiveDispatchService.acceptOffer(orderId, targetOfferId, assistantId, assistantName);

      await fetchAssistantOrders();
      setPanelTab('active');
    } catch (err: any) {
      console.error('Error accepting order:', err);
      toast({
        title: 'Hata',
        description: err.message || 'Sipariş kabul edilemedi.',
        variant: 'destructive',
      });
      await fetchAssistantOrders();
    } finally {
      setActionLoading(null);
    }
  };

  // 3. STATUS = "rezerve" -> "Doğrulandı"
  const handleVerifyOrder = async (orderId: string) => {
    if (!currentAssistant || !isUUID(orderId)) return;
    setActionLoading(orderId);
    try {
      const nowIso = new Date().toISOString();
      if (isSupabaseConfigured) {
        const activeClient = await getAuthenticatedClient();
        const { data: tData } = await activeClient.from('tasks').select('id, order_id').eq('id', orderId).maybeSingle();
        if (tData) {
          const taskPayload = filterTaskPayload({ status: 'dogrulandi', updated_at: nowIso });
          await activeClient.from('tasks').update(taskPayload).eq('id', orderId);
          if (tData.order_id && isUUID(tData.order_id)) {
            const orderPayload = filterOrderPayload({ status: 'dogrulandi', verified_at: nowIso });
            await activeClient.from('orders').update(orderPayload).eq('id', tData.order_id);
          }
        } else {
          const orderPayload = filterOrderPayload({ status: 'dogrulandi', verified_at: nowIso });
          const { error: ordersErr } = await activeClient
            .from('orders')
            .update(orderPayload)
            .eq('id', orderId);

          if (ordersErr) {
            console.error('Error updating orders table for dogrulandi:', ordersErr);
            throw new Error(ordersErr.message || 'Sipariş doğrulanırken veritabanı hatası oluştu.');
          }
        }
      }

      await fetchAssistantOrders();
    } catch (err: any) {
      console.error('Error verifying order:', err);
      toast({
        title: 'Hata',
        description: err.message || 'İşlem gerçekleştirilemedi.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // 4. STATUS = "rezerve" -> "Ulaşılamadı" (İptal)
  const handleCancelOrder = async (orderId: string, reason: string) => {
    if (!currentAssistant || !isUUID(orderId)) return;
    setIsSubmittingCancel(true);
    try {
      const nowIso = new Date().toISOString();
      if (isSupabaseConfigured) {
        const activeClient = await getAuthenticatedClient();
        const { data: tData } = await activeClient.from('tasks').select('id, order_id').eq('id', orderId).maybeSingle();
        if (tData) {
          const taskPayload = filterTaskPayload({ status: 'cancelled', cancelled_at: nowIso });
          await activeClient.from('tasks').update(taskPayload).eq('id', orderId);
          if (tData.order_id && isUUID(tData.order_id)) {
            const orderPayload = filterOrderPayload({ status: 'cancelled', cancel_reason: reason });
            await activeClient.from('orders').update(orderPayload).eq('id', tData.order_id);
          }
        } else {
          const orderPayload = filterOrderPayload({ status: 'cancelled', cancel_reason: reason });
          const res1 = await activeClient
            .from('orders')
            .update(orderPayload)
            .eq('id', orderId);

          if (res1.error) {
            console.error('Error updating orders table for cancel:', res1.error);
            throw new Error(res1.error.message || 'Sipariş iptal edilirken veritabanı hatası oluştu.');
          }
        }
      }

      setCancelModalOrder(null);
      setCancelReasonText('');
      await fetchAssistantOrders();
    } catch (err: any) {
      console.error('Error canceling order:', err);
      toast({
        title: 'Hata',
        description: err.message || 'İptal işlemi gerçekleştirilemedi.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  // IBAN Gönder Handler
  const handleSendIban = async (order: Order) => {
    if (!currentAssistant) return;

    const accountHolder = (currentAssistant.account_holder || '').trim();
    const bankName = (currentAssistant.bank_name || '').trim();
    const iban = (currentAssistant.iban || '').trim();

    if (!accountHolder || !bankName || !iban) {
      toast({
        title: 'Eksik IBAN Bilgisi',
        description: 'Lütfen önce IBAN Bilgilerim bölümünden bilgilerinizi kaydedin.',
        variant: 'destructive',
      });
      setPanelTab('iban');
      return;
    }

    const targetCustomerId = order.customer_id || order.user_id;
    if (!targetCustomerId) {
      toast({
        title: 'Müşteri Bulunamadı',
        description: 'Sipariş için geçerli müşteri ID tespiti yapılamadı.',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(`iban_${order.id}`);
    try {
      const messageContent = `Hesap Sahibi: ${accountHolder}\nBanka: ${bankName}\nIBAN: ${iban}`;

      if (isSupabaseConfigured) {
        const activeClient = await getAuthenticatedClient();
        const notifCols = await getExactTableColumns('notifications');
        const colsSet = new Set(notifCols);

        const payload: Record<string, any> = {
          title: 'Asistan Ödeme Bilgilerini Gönderdi',
          message: messageContent,
          type: 'iban_details',
        };

        const assistantIdToAttach = currentAssistant.id || currentAssistant.user_id || null;

        if (colsSet.has('user_id') || colsSet.size === 0) {
          payload.user_id = targetCustomerId;
        }
        if (colsSet.has('recipient_id')) {
          payload.recipient_id = targetCustomerId;
        }
        if (colsSet.has('recipient_profile_id')) {
          payload.recipient_profile_id = targetCustomerId;
        }
        if (colsSet.has('assistant_id') && assistantIdToAttach) {
          payload.assistant_id = assistantIdToAttach;
        }
        if (colsSet.has('body')) {
          payload.body = messageContent;
        }
        if (colsSet.has('order_id')) {
          payload.order_id = order.id;
        }
        if (colsSet.has('task_id')) {
          payload.task_id = order.id;
        }
        if (colsSet.has('payload')) {
          payload.payload = {
            order_id: order.id,
            task_id: order.id,
            assistant_id: assistantIdToAttach,
            account_holder: accountHolder,
            bank_name: bankName,
            iban: iban,
          };
        }
        if (colsSet.has('is_read')) {
          payload.is_read = false;
        }
        if (colsSet.has('read')) {
          payload.read = false;
        }

        const { error: notifErr } = await activeClient.from('notifications').insert(payload);
        if (notifErr) {
          console.error('Error inserting notification:', notifErr);
        }
      }

      toast({
        title: 'IBAN Gönderildi',
        description: 'Ödeme bilgileri müşteriye başarıyla iletildi.',
      });
    } catch (err: any) {
      console.error('Error sending IBAN details:', err);
      toast({
        title: 'Hata',
        description: err.message || 'IBAN bilgileri gönderilirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // 5. STATUS = "dogrulandi" -> "Yola Çık"
  const handlePickupOrder = async (orderId: string) => {
    if (!currentAssistant || !isUUID(orderId)) return;
    setActionLoading(orderId);
    try {
      const nowIso = new Date().toISOString();
      if (isSupabaseConfigured) {
        const activeClient = await getAuthenticatedClient();
        const { data: tData } = await activeClient.from('tasks').select('id, order_id').eq('id', orderId).maybeSingle();
        if (tData) {
          const taskPayload = filterTaskPayload({ status: 'yolda', updated_at: nowIso });
          await activeClient.from('tasks').update(taskPayload).eq('id', orderId);
          if (tData.order_id && isUUID(tData.order_id)) {
            const orderPayload = filterOrderPayload({ status: 'yolda' });
            await activeClient.from('orders').update(orderPayload).eq('id', tData.order_id);
          }
        } else {
          const orderPayload = filterOrderPayload({ status: 'yolda' });
          await activeClient.from('orders').update(orderPayload).eq('id', orderId);
        }
      }

      await fetchAssistantOrders();
    } catch (err: any) {
      console.error('Error updating order to yolda:', err);
      toast({
        title: 'Hata',
        description: err.message || 'İşlem gerçekleştirilemedi.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Teslimat Kodu Doğrulama
  const handleVerifyDeliveryCode = async (order: any) => {
    const targetId = order.id;
    const enteredCode = (verificationCodes[targetId] || '').trim();
    const expectedCode = String(order.delivery_code || '').trim();

    if (!enteredCode || enteredCode.length !== 6) {
      setVerificationErrors(prev => ({ ...prev, [targetId]: 'Teslim kodu 6 haneli olmalıdır.' }));
      return;
    }

    if (enteredCode !== expectedCode) {
      setVerificationErrors(prev => ({ ...prev, [targetId]: 'Teslim kodu hatalı.' }));
      return;
    }

    setVerifyingOrder(targetId);
    setVerificationErrors(prev => ({ ...prev, [targetId]: '' }));

    try {
      const nowIso = new Date().toISOString();
      if (isSupabaseConfigured && isUUID(targetId)) {
        const activeClient = await getAuthenticatedClient();
        const { data: tData } = await activeClient.from('tasks').select('id, order_id').eq('id', targetId).maybeSingle();
        if (tData) {
          const taskPayload = filterTaskPayload({ updated_at: nowIso });
          if (Object.keys(taskPayload).length > 0) {
            await activeClient.from('tasks').update(taskPayload).eq('id', targetId);
          }
          if (tData.order_id && isUUID(tData.order_id)) {
            const orderPayload = filterOrderPayload({ delivery_code_verified: true });
            await activeClient.from('orders').update(orderPayload).eq('id', tData.order_id);
          }
        } else {
          const orderPayload = filterOrderPayload({ delivery_code_verified: true });
          await activeClient.from('orders').update(orderPayload).eq('id', targetId);
        }
      }

      setVerifiedOrderIds(prev => ({ ...prev, [targetId]: true }));
      await fetchAssistantOrders();
    } catch (err: any) {
      console.error('Error verifying delivery code:', err);
      setVerificationErrors(prev => ({ ...prev, [targetId]: 'Kod doğrulanırken hata oluştu.' }));
    } finally {
      setVerifyingOrder(null);
    }
  };

  // 6. STATUS = "yolda" -> "Teslim Edildi"
  const handleCompleteOrder = async (orderId: string) => {
    if (!currentAssistant || !isUUID(orderId)) return;
    setActionLoading(orderId);
    try {
      const nowIso = new Date().toISOString();
      if (isSupabaseConfigured) {
        const activeClient = await getAuthenticatedClient();
        const { data: tData } = await activeClient.from('tasks').select('id, order_id').eq('id', orderId).maybeSingle();
        if (tData) {
          const taskPayload = filterTaskPayload({ status: 'teslim_edildi', completed_at: nowIso });
          await activeClient.from('tasks').update(taskPayload).eq('id', orderId);
          if (tData.order_id && isUUID(tData.order_id)) {
            const orderPayload = filterOrderPayload({ status: 'teslim_edildi', delivered_at: nowIso });
            await activeClient.from('orders').update(orderPayload).eq('id', tData.order_id);
          }
        } else {
          const orderPayload = filterOrderPayload({ status: 'teslim_edildi', delivered_at: nowIso });
          await activeClient.from('orders').update(orderPayload).eq('id', orderId);
        }
      }

      await fetchAssistantOrders();
      setPanelTab('completed');
    } catch (err: any) {
      console.error('Error completing order:', err);
      toast({
        title: 'Hata',
        description: err.message || 'Sipariş tamamlanamadı.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Sipariş Reddet (Reject Order)
  const handleRejectOrder = async (orderId: string, offerId?: string) => {
    if (!currentAssistant) return;
    setActionLoading(orderId);
    try {
      const targetItem = allOrders.find(o => o.id === orderId || (o as any).task_id === orderId);
      const targetOfferId = offerId || (targetItem as any)?.offer_id;
      const assistantUserIds = Array.from(new Set([currentAssistant.user_id, currentAssistant.id, authUser?.id].filter(Boolean))) as string[];
      const assistantIdToUse = currentAssistant.user_id || currentAssistant.id || '';

      // Immediately add all identifiers to synchronous ref and React state
      if (orderId) rejectedOrderIdsRef.current.add(orderId);
      if (targetOfferId) rejectedOrderIdsRef.current.add(targetOfferId);
      if ((targetItem as any)?.task_id) rejectedOrderIdsRef.current.add((targetItem as any).task_id);
      if ((targetItem as any)?.order_id) rejectedOrderIdsRef.current.add((targetItem as any).order_id);
      setRejectedOrderIds(new Set(rejectedOrderIdsRef.current));

      // Optimistically remove from state immediately
      setAllOrders((prev) =>
        prev.filter(
          (o) =>
            o.id !== orderId &&
            o.id !== targetOfferId &&
            (o as any).order_id !== orderId &&
            (o as any).task_id !== orderId &&
            (o as any).offer_id !== targetOfferId
        )
      );

      if (isSupabaseConfigured) {
        try {
          const activeClient = await getAuthenticatedClient();
          await LiveDispatchService.rejectOffer(orderId, targetOfferId || '', assistantIdToUse, activeClient, assistantUserIds);
        } catch (dbErr: any) {
          console.error('[AsistanPage] Reject offer exception:', dbErr);
        }
      }

      await fetchAssistantOrders();
    } catch (err: any) {
      toast({
        title: 'Hata',
        description: err.message || 'İşlem başarısız.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Turkey 81 Cities options
  const cityOptions = useMemo(() => {
    return TURKEY_PROVINCES.map((provName) => {
      const dbCity = activeCities.find(c => c.name?.toLowerCase().trim() === provName.toLowerCase().trim());
      return {
        id: dbCity ? dbCity.id : provName,
        name: provName,
        dbCity: dbCity || null
      };
    });
  }, [activeCities]);

  // Candidate application handlers
  const handleAppInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCityChange = async (selectedVal: string) => {
    if (!selectedVal) {
      setFormData(prev => ({
        ...prev,
        cityId: '',
        city: '',
        franchiseId: ''
      }));
      setCityResolution({ count: 0, franchiseId: null, franchise: null, franchises: [] });
      return;
    }

    const matchedOption = cityOptions.find(c => c.id === selectedVal || c.name === selectedVal);
    const cityName = matchedOption ? matchedOption.name : selectedVal;
    const cityId = matchedOption?.dbCity?.id || (matchedOption ? matchedOption.id : selectedVal);

    setFormData(prev => ({
      ...prev,
      cityId,
      city: cityName,
      franchiseId: ''
    }));

    setCityResolving(true);
    try {
      if (matchedOption?.dbCity?.id || isUUID(cityId)) {
        const resolution = await resolveFranchiseForCity(matchedOption?.dbCity?.id || cityId);
        setCityResolution(resolution);
        if (resolution.count === 1 && resolution.franchiseId) {
          setFormData(prev => ({ ...prev, franchiseId: resolution.franchiseId || '' }));
        }
      } else {
        setCityResolution({ count: 0, franchiseId: null, franchise: null, franchises: [] });
      }
    } catch (err) {
      console.error('Error resolving franchise for city:', err);
      setCityResolution({ count: 0, franchiseId: null, franchise: null, franchises: [] });
    } finally {
      setCityResolving(false);
    }
  };

  const handleAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password.trim()) {
      toast({
        title: 'Eksik Bilgi',
        description: 'E-posta ve şifre alanları zorunludur.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.city && !formData.cityId) {
      toast({
        title: 'Eksik Bilgi',
        description: 'Lütfen çalışmak istediğiniz şehri seçiniz.',
        variant: 'destructive',
      });
      return;
    }

    if (cityResolution.count > 1 && !formData.franchiseId) {
      toast({
        title: 'Eksik Bilgi',
        description: 'Lütfen çalışmak istediğiniz bayiyi seçiniz.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.subscriptionPackage) {
      toast({
        title: 'Eksik Bilgi',
        description: 'Lütfen bir asistan paneli kullanım paketi seçiniz.',
        variant: 'destructive',
      });
      return;
    }

    const selectedPkg = ASSISTANT_SUBSCRIPTION_PACKAGES.find(p => p.id === formData.subscriptionPackage) || ASSISTANT_SUBSCRIPTION_PACKAGES[3];

    setIsSubmittingApp(true);
    try {
      await db.createAssistantApplication({
        full_name: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        vehicle_type: vehicleType,
        city_id: formData.cityId && isUUID(formData.cityId) ? formData.cityId : (cityResolution.franchise?.city_id || null),
        franchise_id: formData.franchiseId || cityResolution.franchiseId || null,
        city: formData.city,
        subscription_package: selectedPkg.id,
        subscription_package_name: selectedPkg.title,
        subscription_package_price: selectedPkg.total_price,
        notes: [
          formData.motorInfo ? `Motor/Araç: ${formData.motorInfo}` : '',
          formData.licenseInfo ? `Ehliyet: ${formData.licenseInfo}` : '',
          formData.experience ? `Deneyim: ${formData.experience}` : '',
          formData.hasCompany ? `Şahıs Şirketi: ${formData.hasCompany}` : '',
          formData.notes ? `Notlar: ${formData.notes}` : ''
        ].filter(Boolean).join(' | ')
      });

      toast({
        title: 'Başvuru Alındı',
        description: 'Asistan başvurunuz başarıyla kaydedilmiştir. Yönetici onayından sonra belirlediğiniz e-posta ve şifre ile giriş yapabilirsiniz.',
      });

      setStage('success');
    } catch (err: any) {
      console.error('Error submitting application:', err);
      toast({
        title: 'Hata',
        description: err.message || 'Başvuru kaydedilirken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingApp(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-30 py-3.5 shadow-xs">
        <div className="container mx-auto px-4 sm:px-6 md:px-12 flex justify-between items-center relative min-h-[44px]">
          {/* Sol: Menü Butonu */}
          <div className="flex items-center z-10">
            {currentAssistant && currentAssistant.active !== false ? (
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-card hover:bg-accent/50 border border-border text-foreground text-xs font-bold transition-all cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
                aria-label="Asistan Menüsü"
                title="Asistan Menüsü"
              >
                <Menu className="w-4 h-4 text-foreground" />
                <span>Menü</span>
              </button>
            ) : (
              <div className="w-11 h-11" />
            )}
          </div>

          {/* Orta: Tam Ortalanmış Çevrimiçi / Çevrimdışı Toggle */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-auto z-10">
            {currentAssistant && currentAssistant.active !== false && (
              <button
                type="button"
                onClick={handleToggleOnline}
                className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-200 cursor-pointer shadow-xs border active:scale-95 ${
                  isOnline
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                    : 'bg-card text-muted-foreground border-border hover:bg-accent/40'
                }`}
                title={isOnline ? 'Çevrimdışı olmak için dokunun' : 'Çevrimiçi olmak için dokunun'}
              >
                <div className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                  isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/50'
                }`} />
                <span className="tracking-wider uppercase">{isOnline ? 'ÇEVRİMİÇİ' : 'ÇEVRİMDIŞI'}</span>
              </button>
            )}
          </div>

          {/* Sağ: Görevleri Yenile Butonu */}
          <div className="flex items-center z-10">
            <button
              type="button"
              disabled={isRefreshing || ordersLoading}
              onClick={handleManualRefresh}
              className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl bg-card hover:bg-accent/50 active:scale-95 border border-border text-foreground text-xs font-bold transition-all cursor-pointer shrink-0 shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
              title="Görevleri Yenile"
              aria-label="Görevleri Yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-foreground transition-transform duration-300 ${isRefreshing || ordersLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Yenile</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 md:px-12 py-4 sm:py-6 flex-grow flex flex-col items-center justify-start relative z-10 max-w-4xl">
        {authLoading ? (
          <div className="w-full py-20 flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Asistan oturum bilgileri kontrol ediliyor...</p>
          </div>
        ) : currentAssistant && currentAssistant.active !== false ? (
          /* ONAYLI VE AKTİF ASİSTAN EKRANI */
          <div className="w-full space-y-4">
            {/* Talep Odaklı Tab Barı (Bekleyen Talep, Aktif Talep) */}
            <div className="grid grid-cols-2 gap-2 bg-card p-1.5 rounded-2xl border border-border w-full shadow-xs">
              <button
                type="button"
                onClick={() => setPanelTab('pending')}
                className={`py-2.5 px-2 sm:px-3 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  panelTab === 'pending'
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
                }`}
              >
                <span>Bekleyen Talep</span>
                {pendingOrders.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    panelTab === 'pending' ? 'bg-primary-foreground text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {pendingOrders.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setPanelTab('active')}
                className={`py-2.5 px-2 sm:px-3 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  panelTab === 'active'
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
                }`}
              >
                <span>Aktif Talep</span>
                {activeOrders.length > 0 && (
                  <span className={`w-2 h-2 rounded-full ${panelTab === 'active' ? 'bg-primary-foreground' : 'bg-emerald-500'}`} />
                )}
              </button>
            </div>

              {/* TAB CONTENT AREAS */}

              {/* TAB 1: BEKLEYEN GÖREVLER */}
              {panelTab === 'pending' && (
                <div className="space-y-3">
                  {pendingOrders.length === 0 ? (
                    <div className="bg-card border border-border rounded-2xl p-10 text-center shadow-xs space-y-2">
                      <h3 className="text-base font-bold text-foreground">Bekleyen görev bulunmuyor.</h3>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Yeni gelen saha siparişleri burada listelenecektir. Çevrimiçi kaldığınızdan emin olun.
                      </p>
                    </div>
                  ) : (
                    pendingOrders.map((order) => {
                      const r = resolveTaskFields(order);

                      return (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, scale: 0.99 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-card border border-border p-4 sm:p-5 rounded-2xl space-y-3 shadow-xs relative"
                        >
                          {/* 1. Sipariş No & Service Badge Header */}
                          <div className="flex items-center justify-between border-b border-border pb-2.5">
                            <div className="flex items-center gap-2">
                              {(() => {
                                const catBadge = getOrderCategoryBadge(order);
                                return (
                                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${catBadge.className}`}>
                                    {catBadge.label}
                                  </span>
                                );
                              })()}
                              <span className="font-mono text-xs text-muted-foreground">
                                #{r.order_number}
                              </span>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 uppercase tracking-wider">
                              Bekleyen
                            </span>
                          </div>

                          {/* 2. Yapılacak İş */}
                          <TaskDescriptionCard description={r.task_description} />

                          {/* 3. Müşteri Teklifi & Asistan Kazancı */}
                          <CustomerOfferCard
                            totalPrice={r.total_price}
                            courierNet={r.courier_net}
                            customerPrice={r.customer_price}
                          />

                          {/* 4. Müşteri Bilgileri */}
                          <CustomerInfoCard name={r.customer_name} phone={r.customer_phone} />

                          {/* 5. Müşteri Konumu */}
                          <CustomerLocationCard
                            address={r.customer_address || r.delivery_address || r.pickup_address || r.store_name}
                            addressDetail={r.delivery_address_detail || r.pickup_address_detail}
                            lat={r.delivery_lat ?? r.latitude ?? r.pickup_lat}
                            lng={r.delivery_lng ?? r.longitude ?? r.pickup_lng}
                          />

                          {/* Tahmini Mesafe & Süre */}
                          <DistanceDurationCard distance={r.distance} duration={r.duration} />

                          {/* Geçerken UĞRA - Zaman Tercihi */}
                          {r.service_type === 'gecerken' && (
                            <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 text-xs space-y-0.5">
                              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase block">GEÇERKEN UĞRA — ZAMAN TERCİHİ</span>
                              <p className="text-xs text-foreground font-semibold">
                                {r.preferred_time || (r.notes?.match(/• Ne Zaman:\s*(.+)/)?.[1]?.trim()) || 'Gün içinde fark etmez'}
                              </p>
                            </div>
                          )}

                          {/* Sipariş Notu */}
                          {r.notes && r.notes.trim() !== '' && (
                            <div className="bg-background p-3 rounded-xl border border-border text-xs space-y-0.5">
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Sipariş Notu</span>
                              <p className="text-xs text-foreground font-normal leading-normal">{r.notes}</p>
                            </div>
                          )}

                          {/* Sipariş kabul et & Reddet Butonları */}
                          <div className="pt-1.5 border-t border-border grid grid-cols-2 gap-2.5">
                            <button
                              type="button"
                              disabled={actionLoading === order.id || activeOrders.length > 0}
                              onClick={() => handleAcceptOrder(order.id, (order as any).offer_id)}
                              className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                            >
                              {actionLoading === order.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                              ) : (
                                <span>Kabul Et</span>
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading === order.id}
                              onClick={() => handleRejectOrder(order.id, (order as any).offer_id)}
                              className="py-3 rounded-xl bg-card hover:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                            >
                              <span>Reddet</span>
                            </button>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 2: AKTİF GÖREV */}
              {panelTab === 'active' && (
                <div className="space-y-3">
                  {activeOrders.length === 0 ? (
                    <div className="bg-card border border-border rounded-2xl p-10 text-center shadow-xs space-y-2">
                      <h3 className="text-base font-bold text-foreground">Aktif Saha Görevi Bulunmuyor</h3>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Bekleyen görevler sekmesinden yeni bir sipariş kabul ettiğinizde aktif görev detayları burada görüntülenecektir.
                      </p>
                    </div>
                  ) : (
                    activeOrders.map((order) => {
                      const r = resolveTaskFields(order);
                      const currentStatus = order.status || r.status;

                      return (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, scale: 0.99 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-card border border-border p-4 sm:p-5 rounded-2xl space-y-3 shadow-xs relative"
                        >
                          {/* 1. Sipariş No & Service Badge Header */}
                          <div className="flex items-center justify-between border-b border-border pb-2.5">
                            <div className="flex items-center gap-2">
                              {(() => {
                                const catBadge = getOrderCategoryBadge(order);
                                return (
                                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${catBadge.className}`}>
                                    {catBadge.label}
                                  </span>
                                );
                              })()}
                              <span className="font-mono text-xs text-muted-foreground">
                                #{r.order_number}
                              </span>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-muted text-muted-foreground border border-border uppercase tracking-wider">
                              {currentStatus === 'rezerve' || currentStatus === 'accepted' ? 'Rezerve' :
                               currentStatus === 'dogrulandi' ? 'Doğrulandı' :
                               currentStatus === 'yolda' || currentStatus === 'kuryede' || currentStatus === 'teslimatta' ? 'Yolda' :
                               currentStatus === 'teslim_edildi' || currentStatus === 'tamamlandi' ? 'Teslim Edildi' : currentStatus}
                            </span>
                          </div>

                          {/* 2. Yapılacak İş */}
                          <TaskDescriptionCard description={r.task_description} />

                          {/* 3. Müşteri Teklifi & Asistan Kazancı */}
                          <CustomerOfferCard
                            totalPrice={r.total_price}
                            courierNet={r.courier_net}
                            customerPrice={r.customer_price}
                          />

                          {/* 4. Müşteri Bilgileri */}
                          <CustomerInfoCard name={r.customer_name} phone={r.customer_phone} />

                          {/* 5. Müşteri Konumu */}
                          <CustomerLocationCard
                            address={r.customer_address || r.delivery_address || r.pickup_address || r.store_name}
                            addressDetail={r.delivery_address_detail || r.pickup_address_detail}
                            lat={r.delivery_lat ?? r.latitude ?? r.pickup_lat}
                            lng={r.delivery_lng ?? r.longitude ?? r.pickup_lng}
                          />

                          {/* Tahmini Mesafe & Süre */}
                          <DistanceDurationCard distance={r.distance} duration={r.duration} />

                          {/* Geçerken UĞRA - Zaman Tercihi */}
                          {r.service_type === 'gecerken' && (
                            <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 text-xs space-y-0.5">
                              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase block">GEÇERKEN UĞRA — ZAMAN TERCİHİ</span>
                              <p className="text-xs text-foreground font-semibold">
                                {r.preferred_time || (r.notes?.match(/• Ne Zaman:\s*(.+)/)?.[1]?.trim()) || 'Gün içinde fark etmez'}
                              </p>
                            </div>
                          )}

                          {/* Sipariş Notu */}
                          {r.notes && r.notes.trim() !== '' && (
                            <div className="bg-background p-3 rounded-xl border border-border text-xs space-y-0.5">
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Sipariş Notu</span>
                              <p className="text-xs text-foreground font-normal leading-normal">{r.notes}</p>
                            </div>
                          )}

                          {/* İş Akışı Butonları */}
                          <div className="pt-1.5 border-t border-border">
                            {(currentStatus === 'rezerve' || currentStatus === 'accepted') && (
                              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                <button
                                  type="button"
                                  disabled={actionLoading === order.id}
                                  onClick={() => handleVerifyOrder(order.id)}
                                  className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs cursor-pointer flex items-center justify-center transition-all"
                                >
                                  {actionLoading === order.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                                  ) : (
                                    <span>Doğrulandı</span>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  disabled={actionLoading === order.id}
                                  onClick={() => {
                                    setCancelModalOrder(order);
                                    setCancelReasonText('');
                                  }}
                                  className="py-2.5 px-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs cursor-pointer flex items-center justify-center transition-all"
                                >
                                  <span>Ulaşılamadı</span>
                                </button>
                              </div>
                            )}

                            {currentStatus === 'dogrulandi' && (
                              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                <button
                                  type="button"
                                  disabled={actionLoading === order.id || actionLoading === `iban_${order.id}`}
                                  onClick={() => handleSendIban(order)}
                                  className="py-2.5 px-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  {actionLoading === `iban_${order.id}` ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                                  ) : (
                                    <span>IBAN Gönder</span>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  disabled={actionLoading === order.id || actionLoading === `iban_${order.id}`}
                                  onClick={() => handlePickupOrder(order.id)}
                                  className="py-2.5 px-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  {actionLoading === order.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                                  ) : (
                                    <span>Yola Çık</span>
                                  )}
                                </button>
                              </div>
                            )}

                            {(currentStatus === 'yolda' || currentStatus === 'kuryede' || currentStatus === 'teslimatta' || currentStatus === 'in_progress' || currentStatus === 'on_the_way') && (() => {
                              const requiresCode = Boolean(order.requires_delivery_code);
                              const isCodeVerified = Boolean(order.delivery_code_verified || verifiedOrderIds[order.id]);

                              if (requiresCode && !isCodeVerified) {
                                return (
                                  <div className="space-y-2 border-t border-border pt-3 mt-2">
                                    <label className="block text-xs font-bold text-foreground">
                                      Teslim Kodunu Doğrula
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={6}
                                        placeholder="6 Haneli Kod"
                                        value={verificationCodes[order.id] || ''}
                                        onChange={(e) => {
                                          const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                          setVerificationCodes(prev => ({ ...prev, [order.id]: val }));
                                          if (verificationErrors[order.id]) {
                                            setVerificationErrors(prev => ({ ...prev, [order.id]: '' }));
                                          }
                                        }}
                                        className="flex-1 bg-background border border-border focus:border-primary rounded-xl px-3 py-2 text-xs font-mono font-bold text-foreground outline-none text-center tracking-widest transition-all"
                                      />
                                      <button
                                        type="button"
                                        disabled={verifyingOrder === order.id || !(verificationCodes[order.id] || '').trim()}
                                        onClick={() => handleVerifyDeliveryCode(order)}
                                        className="py-2 px-3.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer shrink-0 flex items-center justify-center"
                                      >
                                        {verifyingOrder === order.id ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                        ) : (
                                          <span>Kodu Doğrula</span>
                                        )}
                                      </button>
                                    </div>
                                    {verificationErrors[order.id] && (
                                      <p className="text-[11px] font-bold text-destructive mt-1">
                                        {verificationErrors[order.id]}
                                      </p>
                                    )}
                                  </div>
                                );
                              }

                              return (
                                <button
                                  type="button"
                                  disabled={actionLoading === order.id}
                                  onClick={() => handleCompleteOrder(order.id)}
                                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  {actionLoading === order.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                                  ) : (
                                    <span>{requiresCode ? 'Teslimi Tamamla' : 'Teslim Edildi'}</span>
                                  )}
                                </button>
                              );
                            })()}

                            {(currentStatus === 'teslim_edildi' || currentStatus === 'tamamlandi' || currentStatus === 'completed') && null}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 3: TESLİM EDİLENLER */}
              {panelTab === 'completed' && (
                <div className="space-y-3">
                  {completedOrders.length === 0 ? (
                    <div className="bg-card border border-border rounded-2xl p-10 text-center shadow-xs space-y-2">
                      <h3 className="text-base font-bold text-foreground">Teslim Edilen Sipariş Bulunmuyor</h3>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Tamamladığınız saha görevleri burada listelenecektir.
                      </p>
                    </div>
                  ) : (
                    completedOrders.map((order) => {
                      const r = resolveTaskFields(order);
                      const formattedDate = order.created_at || order.delivered_at 
                        ? new Date(order.delivered_at || order.created_at).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Tamamlandı';

                      return (
                        <div
                          key={order.id}
                          className="bg-card border border-border p-4 rounded-2xl shadow-xs space-y-3"
                        >
                          {/* Header: Status badge & Date */}
                          <div className="flex items-center justify-between border-b border-border pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 uppercase tracking-wider">
                                TESLİM EDİLDİ
                              </span>
                              <span className="font-mono text-xs text-muted-foreground">#{r.order_number}</span>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                              {formattedDate}
                            </span>
                          </div>

                          {/* Info Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="bg-background p-3 rounded-xl border border-border space-y-0.5">
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Müşteri</span>
                              <p className="font-medium text-foreground text-xs">{r.customer_name || 'Müşteri'}</p>
                              {r.customer_phone && <p className="text-muted-foreground text-[11px] font-mono">{r.customer_phone}</p>}
                            </div>

                            <div className="bg-background p-3 rounded-xl border border-border space-y-0.5">
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Müşteri Konumu</span>
                              <p className="text-foreground text-xs font-medium line-clamp-2">{r.customer_address || r.delivery_address || r.pickup_address || 'Müşteri Konumu'}</p>
                            </div>
                          </div>

                          {/* Task summary if available */}
                          {r.task_description && (
                            <div className="bg-background px-3 py-2 rounded-xl border border-border text-xs">
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Yapılan İş</span>
                              <p className="text-foreground font-medium text-xs line-clamp-1">{r.task_description}</p>
                            </div>
                          )}

                          {/* Geçerken UĞRA - Zaman Tercihi */}
                          {r.service_type === 'gecerken' && (
                            <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 text-xs space-y-0.5">
                              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase block">GEÇERKEN UĞRA — ZAMAN TERCİHİ</span>
                              <p className="text-xs text-foreground font-semibold">
                                {r.preferred_time || 'Gün içinde fark etmez'}
                              </p>
                            </div>
                          )}

                          {/* Footer: Earnings & Price */}
                          <div className="flex items-center justify-between pt-1 border-t border-border text-xs">
                            <span className="text-muted-foreground font-medium">
                              Müşteri Fiyatı: <strong className="text-foreground font-mono">{r.customer_price || order.total_price} ₺</strong>
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground font-semibold uppercase">Kazanç:</span>
                              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                +{r.courier_net || order.courier_net || 0} ₺
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 4: PROFİL */}
              {panelTab === 'profile' && (
                <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-xs space-y-5">
                  <div className="flex items-center gap-4 border-b border-border pb-5">
                    <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center text-foreground text-xl font-bold">
                      {currentAssistant.full_name?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {currentAssistant.full_name || 'Saha Asistanı'}
                      </h3>
                      <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                        {connectedPartner
                          ? `Bağlı İş Ortağı: ${connectedPartner.business_name}`
                          : 'Bağımsız Saha Asistanı'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-background p-3.5 rounded-xl border border-border">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-0.5">
                        İsim Soyisim
                      </span>
                      <p className="font-medium text-foreground text-sm">{currentAssistant.full_name || '-'}</p>
                    </div>

                    <div className="bg-background p-3.5 rounded-xl border border-border">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-0.5">
                        Telefon Numarası
                      </span>
                      <p className="font-medium text-foreground text-sm">{currentAssistant.phone || '-'}</p>
                    </div>

                    <div className="bg-background p-3.5 rounded-xl border border-border">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-0.5">
                        Aktiflik Durumu
                      </span>
                      <p className="font-medium text-sm flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/50'}`} />
                        <span className="text-foreground">
                          {isOnline ? 'Çevrimiçi (Saha Aktif)' : 'Çevrimdışı'}
                        </span>
                      </p>
                    </div>

                    <div className="bg-background p-3.5 rounded-xl border border-border">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-0.5">
                        Bağlı Olduğu Partner
                      </span>
                      <p className="font-medium text-foreground text-sm">
                        {connectedPartner?.business_name || currentAssistant.partner_id || 'Bağımsız'}
                      </p>
                    </div>

                    <div className="bg-background p-3.5 rounded-xl border border-border">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-0.5">
                        Görev Durumu
                      </span>
                      <p className="font-medium text-foreground text-sm">
                        {activeOrders.length > 0 ? 'Görevde (Sipariş Teslimatında)' : 'Müsait (Görev Bekliyor)'}
                      </p>
                    </div>

                    <div className="bg-background p-3.5 rounded-xl border border-border">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-0.5">
                        Araç Tipi / Şehir
                      </span>
                      <p className="font-medium text-foreground text-sm capitalize">
                        {currentAssistant.vehicle_type || 'Motosiklet'} • {currentAssistant.city || 'İstanbul'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      Tamamlanan Sipariş Sayısı: <strong className="text-foreground">{completedOrders.length}</strong>
                    </span>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="px-4 py-2 rounded-xl bg-card hover:bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      <span>Çıkış Yap</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 5: IBAN BİLGİLERİM */}
              {panelTab === 'iban' && (
                <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-xs space-y-6">
                  <div className="border-b border-border pb-4">
                    <h3 className="text-lg font-bold text-foreground">IBAN Bilgilerim</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ödemelerinizin aktarılacağı banka hesap bilgilerinizi düzenleyebilirsiniz.
                    </p>
                  </div>

                  <form onSubmit={handleIbanSubmit} className="space-y-4">
                    {/* 1. Hesap Sahibi / Ad Soyad */}
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                        Hesap Sahibi (Ad Soyad)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={ibanAccountHolder}
                          onChange={(e) => setIbanAccountHolder(e.target.value)}
                          placeholder="Ad Soyad"
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 pr-20 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all"
                        />
                        {ibanAccountHolder && (
                          <button
                            type="button"
                            onClick={() => handleCopyText(ibanAccountHolder, 'Ad Soyad')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-card hover:bg-accent/50 text-foreground border border-border rounded-lg text-xs font-medium cursor-pointer transition-colors"
                          >
                            Kopyala
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 2. Banka Adı */}
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                        Banka Adı
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={ibanBankName}
                          onChange={(e) => setIbanBankName(e.target.value)}
                          placeholder="Örn: Garanti BBVA, İş Bankası, Ziraat Bankası"
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 pr-20 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all"
                        />
                        {ibanBankName && (
                          <button
                            type="button"
                            onClick={() => handleCopyText(ibanBankName, 'Banka Adı')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-card hover:bg-accent/50 text-foreground border border-border rounded-lg text-xs font-medium cursor-pointer transition-colors"
                          >
                            Kopyala
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 3. IBAN */}
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                        IBAN
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          maxLength={32}
                          value={ibanValue}
                          onChange={handleIbanInputChange}
                          placeholder="TR00 0000 0000 0000 0000 0000 00"
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 pr-20 text-sm font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all"
                        />
                        {ibanValue && (
                          <button
                            type="button"
                            onClick={() => handleCopyText(ibanValue, 'IBAN')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-card hover:bg-accent/50 text-foreground border border-border rounded-lg text-xs font-medium cursor-pointer transition-colors"
                          >
                            Kopyala
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSavingIban}
                        className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSavingIban ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Kaydediliyor...</span>
                          </>
                        ) : (
                          <span>Kaydet</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
        ) : (
          /* ADAY / GİRİŞ EKRANI */
          <>
            {/* Mode Switcher Header - Aday / Giriş Sekmeleri */}
            <div className="w-full bg-muted/60 border border-border p-1.5 rounded-2xl flex gap-2 mb-8 shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTabMode('application')}
                className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTabMode === 'application'
                    ? 'bg-card text-foreground font-extrabold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>Asistan Aday Başvurusu</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTabMode('panel')}
                className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTabMode === 'panel'
                    ? 'bg-card text-foreground font-extrabold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>Asistan Girişi</span>
              </button>
            </div>

            {activeTabMode === 'panel' ? (
              /* ASİSTAN GİRİŞ EKRANI */
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xs space-y-6 mx-auto"
              >
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    Asistan Girişi
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Saha görevlerinizi yönetmek ve siparişleri takip etmek için giriş yapın.
                  </p>
                </div>

                {loginError && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs">
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                      E-Posta
                    </label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="asistan@ugra.app"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                      Şifre
                    </label>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loginSubmitting}
                    className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loginSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Kontrol Ediliyor...
                      </>
                    ) : (
                      <span>Giriş Yap</span>
                    )}
                  </button>
                </form>

                <div className="text-center pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Henüz asistan hesabınız yok mu?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTabMode('application')}
                      className="text-primary underline font-bold cursor-pointer"
                    >
                      Başvuru Yapın
                    </button>
                  </p>
                </div>
              </motion.div>
            ) : (
              /* CANDIDATE APPLICATION SECTION */
              <div className="w-full">
            <AnimatePresence mode="wait">
              {stage === 'form' ? (
                <motion.div
                  key="application-form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="bg-card border border-border rounded-2xl p-6 md:p-10 shadow-xs relative overflow-hidden"
                >
                  <div className="flex items-center justify-center mb-8">
                    <div className="bg-muted p-1.5 rounded-2xl border border-border flex gap-2">
                      <button
                        type="button"
                        onClick={() => setVehicleType('motosiklet')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                          vehicleType === 'motosiklet'
                            ? 'bg-card text-foreground font-extrabold shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Motosiklet
                      </button>
                      <button
                        type="button"
                        onClick={() => setVehicleType('bisiklet')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                          vehicleType === 'bisiklet'
                            ? 'bg-card text-foreground font-extrabold shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Bisiklet
                      </button>
                    </div>
                  </div>

                  <div className="mb-10 text-center md:text-left">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mt-1">
                      {vehicleType === 'bisiklet' ? 'Bisikletli Asistan Başvurusu' : 'Motosikletli Asistan Başvurusu'}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-3 leading-relaxed max-w-xl">
                      {vehicleType === 'bisiklet' 
                        ? 'Bisikletinizle ekibimize katılın, şehir içi çevre dostu teslimatlar yaparak esnek saatlerle kazanç elde edin.' 
                        : 'Motosikletinizle ekibimize katılın, esnek saatlerle yüksek kazanç elde edin. Başvuru formunu doldurarak ilk adımı atın.'}
                    </p>
                  </div>

                  <form onSubmit={handleAppSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                          Ad Soyad
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          required
                          value={formData.fullName}
                          onChange={handleAppInputChange}
                          placeholder="Adınız Soyadınız"
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                          Telefon Numarası
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          required
                          value={formData.phone}
                          onChange={handleAppInputChange}
                          placeholder="05xx xxx xx xx"
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                          E-Posta Adresi <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleAppInputChange}
                          placeholder="ornek@email.com"
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                          Giriş Şifresi <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="password"
                          name="password"
                          required
                          minLength={6}
                          value={formData.password}
                          onChange={handleAppInputChange}
                          placeholder="Giriş için kullanacağınız şifreniz"
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                          Çalışmak İstediğiniz Şehir <span className="text-destructive">*</span>
                        </label>
                        <select
                          name="cityId"
                          required
                          value={formData.cityId || formData.city}
                          onChange={(e) => handleCityChange(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary"
                        >
                          <option value="">Şehir Seçiniz</option>
                          {cityOptions.map((c) => (
                            <option key={c.id || c.name} value={c.id || c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        {formData.city && !cityResolving && cityResolution.count === 1 && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1.5 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Bayi: {cityResolution.franchises[0]?.name} (Otomatik Eşleşti)
                          </p>
                        )}
                      </div>

                      {formData.city && cityResolution.count > 1 ? (
                        <div>
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                            Çalışmak İstediğiniz Bayi / Bölge <span className="text-destructive">*</span>
                          </label>
                          <select
                            name="franchiseId"
                            required
                            value={formData.franchiseId}
                            onChange={(e) => setFormData((prev) => ({ ...prev, franchiseId: e.target.value }))}
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary"
                          >
                            <option value="">Bayi Seçiniz</option>
                            {cityResolution.franchises.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                            {vehicleType === 'bisiklet' ? 'Bisiklet Marka / Model' : 'Motosiklet Marka / Model'}
                          </label>
                          <input
                            type="text"
                            name="motorInfo"
                            required
                            value={formData.motorInfo}
                            onChange={handleAppInputChange}
                            placeholder={vehicleType === 'bisiklet' ? 'Örn: Trek FX 3' : 'Örn: Honda Forza 250'}
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
                          />
                        </div>
                      )}
                    </div>

                    {formData.city && cityResolution.count > 1 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                            {vehicleType === 'bisiklet' ? 'Bisiklet Marka / Model' : 'Motosiklet Marka / Model'}
                          </label>
                          <input
                            type="text"
                            name="motorInfo"
                            required
                            value={formData.motorInfo}
                            onChange={handleAppInputChange}
                            placeholder={vehicleType === 'bisiklet' ? 'Örn: Trek FX 3' : 'Örn: Honda Forza 250'}
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    )}

                    <div className={`grid grid-cols-1 ${vehicleType === 'motosiklet' ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-5`}>
                      {vehicleType === 'motosiklet' && (
                        <div>
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                            Ehliyet Sınıfı
                          </label>
                          <input
                            type="text"
                            name="licenseInfo"
                            required={vehicleType === 'motosiklet'}
                            value={formData.licenseInfo}
                            onChange={handleAppInputChange}
                            placeholder="Örn: A, A2, A1"
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
                          />
                        </div>
                      )}
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                          Saha / Teslimat Deneyimi
                        </label>
                        <input
                          type="text"
                          name="experience"
                          required
                          value={formData.experience}
                          onChange={handleAppInputChange}
                          placeholder="Örn: 2 Yıl Kurye Deneyimi"
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    {/* Asistan Paneli Kullanım Paketi */}
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                        Asistan Paneli Kullanım Paketi <span className="text-destructive">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ASSISTANT_SUBSCRIPTION_PACKAGES.map((pkg) => {
                          const isSelected = formData.subscriptionPackage === pkg.id;
                          return (
                            <button
                              key={pkg.id}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, subscriptionPackage: pkg.id as any }))}
                              className={`p-4 rounded-xl border text-left transition-all relative cursor-pointer ${
                                isSelected
                                  ? 'border-primary bg-primary/10 ring-1 ring-primary'
                                  : 'border-border bg-card hover:bg-accent/40'
                              }`}
                            >
                              {pkg.badge && (
                                <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded bg-primary text-primary-foreground">
                                  {pkg.badge}
                                </span>
                              )}
                              <div className="font-bold text-sm text-foreground">{pkg.title}</div>
                              <div className="text-base font-extrabold text-foreground mt-1">
                                {pkg.total_price.toLocaleString('tr-TR')} TL
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                Aylık {pkg.monthly_price.toLocaleString('tr-TR')} TL
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                        Ek Not / Açıklama
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleAppInputChange}
                        placeholder="Eklemek istediğiniz notlar..."
                        rows={3}
                        className="w-full bg-background border border-border rounded-xl p-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingApp}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs"
                    >
                      {isSubmittingApp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Gönderiliyor...</span>
                        </>
                      ) : (
                        <>
                          <span>Başvuruyu Gönder</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="success-card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card border border-border rounded-2xl p-8 md:p-16 text-center shadow-xs relative overflow-hidden"
                >
                  <div className="flex flex-col items-center max-w-lg mx-auto">
                    <div className="mb-8 select-none">
                      <span className="text-4xl md:text-[40px] font-extrabold tracking-wider text-foreground">
                        UĞRA<span className="text-primary">.</span>
                      </span>
                    </div>

                    <h2 className="text-3xl font-extrabold text-foreground mb-4">
                      Başvurunuz Başarıyla Alındı!
                    </h2>
                    
                    <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                      UĞRA<span className="text-primary">.</span> asistan adaylığınız sistemimize kaydedildi. Ekibimiz başvurunuzu inceledikten sonra onay sürecinde tarafınıza bilgi verilecektir.
                    </p>

                    <button
                      type="button"
                      onClick={() => setStage('form')}
                      className="bg-primary text-primary-foreground font-extrabold px-8 py-3.5 rounded-xl hover:bg-primary/90 transition-all cursor-pointer text-sm"
                    >
                      Yeni Başvuru Yap
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
            )}
          </>
        )}
      </main>

      {/* Slide-in Mobile Courier Drawer (Yan Panel) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 cursor-pointer"
            />

            {/* Slide Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed top-0 left-0 bottom-0 w-[82vw] max-w-[340px] bg-card border-r border-border z-50 p-5 flex flex-col justify-between overflow-y-auto shadow-2xl text-foreground"
            >
              <div>
                {/* Header of Drawer */}
                <div className="pb-4 border-b border-border space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="absolute -top-1 -right-1 p-1.5 rounded-full bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    aria-label="Kapat"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center font-bold text-foreground text-lg">
                      {currentAssistant?.avatar_url ? (
                        <img src={currentAssistant.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span>{currentAssistant?.full_name ? currentAssistant.full_name.charAt(0).toUpperCase() : 'G'}</span>
                      )}
                    </div>
                    <div className="min-w-0 pr-6">
                      <p className="text-xs text-muted-foreground font-medium">Hoş Geldin</p>
                      <h3 className="text-sm font-bold text-foreground truncate uppercase tracking-tight">
                        {currentAssistant?.full_name || 'GÖKHAN GÖKALP'}
                      </h3>
                    </div>
                  </div>

                  <a
                    href="tel:05394659154"
                    className="flex items-center gap-2 pt-1 hover:opacity-80 transition-opacity cursor-pointer inline-flex"
                  >
                    <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Phone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">Asistan Temsilcisi</span>
                  </a>
                </div>

                {/* Drawer Menu Options */}
                <div className="py-3 space-y-4 text-foreground">
                  {/* SECTION 1: Profil */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 mb-1">
                      Profil
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setPanelTab('profile');
                        setIsDrawerOpen(false);
                      }}
                      className="w-full text-left py-2 px-2 rounded-lg hover:bg-accent/50 text-foreground font-medium text-sm transition-colors cursor-pointer block"
                    >
                      Şifre Değiştir
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPanelTab('iban');
                        setIsDrawerOpen(false);
                      }}
                      className="w-full text-left py-2 px-2 rounded-lg hover:bg-accent/50 text-foreground font-medium text-sm transition-colors cursor-pointer block"
                    >
                      IBAN Bilgilerim
                    </button>
                  </div>

                  <div className="border-b border-border" />

                  {/* SECTION 2: İşlemler */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 mb-1">
                      İşlemler
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal('wallet');
                        setIsDrawerOpen(false);
                      }}
                      className="w-full text-left py-2 px-2 rounded-lg hover:bg-accent/50 text-foreground font-medium text-sm transition-colors cursor-pointer block"
                    >
                      Ödemeler
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal('subscription');
                        setIsDrawerOpen(false);
                      }}
                      className="w-full text-left py-2 px-2 rounded-lg hover:bg-accent/50 text-foreground font-medium text-sm transition-colors cursor-pointer block"
                    >
                      Aboneliğim
                    </button>
                  </div>

                  <div className="border-b border-border" />

                  {/* SECTION 3: Davet Listesi */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 mb-1">
                      Davet Listesi
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDrawerOpen(false);
                      }}
                      className="w-full text-left py-2 px-2 rounded-lg hover:bg-accent/50 text-foreground font-medium text-sm transition-colors cursor-pointer block"
                    >
                      Arkadaşlarını Davet Et
                    </button>
                  </div>

                  <div className="border-b border-border" />

                  {/* SECTION 4: Ayarlar */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 mb-1">
                      Ayarlar
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal('settings');
                        setIsDrawerOpen(false);
                      }}
                      className="w-full text-left py-2 px-2 rounded-lg hover:bg-accent/50 text-foreground font-medium text-sm transition-colors cursor-pointer block"
                    >
                      Sıkça Sorulan Sorular
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDrawerOpen(false);
                      }}
                      className="w-full text-left py-2 px-2 rounded-lg hover:bg-accent/50 text-foreground font-medium text-sm transition-colors cursor-pointer block"
                    >
                      Kullanıcı Sözleşmesi
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDrawerOpen(false);
                      }}
                      className="w-full text-left py-2 px-2 rounded-lg hover:bg-accent/50 text-foreground font-medium text-sm transition-colors cursor-pointer block"
                    >
                      Gizlilik Sözleşmesi
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDrawerOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left py-2 px-2 rounded-lg hover:bg-destructive/10 text-destructive font-medium text-sm transition-colors cursor-pointer block"
                    >
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer of Drawer */}
              <div className="pt-4 border-t border-border mt-4">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-muted text-foreground flex items-center justify-center hover:bg-accent transition-colors inline-flex"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4.5 h-4.5" />
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Aboneliğim Modal */}
      <AnimatePresence>
        {activeModal === 'subscription' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl space-y-5 text-foreground"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-foreground">
                    <Clock className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Aboneliğim</h3>
                    <p className="text-xs text-muted-foreground">Abonelik durumunuz ve süre takibiniz</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="p-2 rounded-xl bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              {subLoading ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-center">
                  <Loader2 className="w-6 h-6 text-foreground animate-spin" />
                  <p className="text-xs text-muted-foreground">Abonelik bilgileri yükleniyor...</p>
                </div>
              ) : !subscription ? (
                <div className="py-6 px-4 text-center space-y-4 bg-background rounded-xl border border-border">
                  <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">
                      Aktif aboneliğiniz bulunmuyor.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Abonelik talebi göndererek yönetici onayına sunabilirsiniz.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={renewalSubmitting}
                    onClick={handleRenewalRequest}
                    className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs uppercase transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                  >
                    {renewalSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Talep Gönderiliyor...</span>
                      </>
                    ) : (
                      <span>Abonelik Talebi Gönder</span>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between bg-background border border-border p-3.5 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                        Abonelik Durumu
                      </span>
                      <span className="text-sm font-bold text-foreground block">
                        {(() => {
                          if (subscription.renewal_requested && subscription.renewal_decision === 'pending') {
                            return 'Bekleyen Abonelik Talebi';
                          }
                          const remainingDays = getSubscriptionDaysRemaining(subscription.expires_at);
                          const isExpired = remainingDays <= 0 || subscription.status === 'expired' || subscription.status === 'cancelled' || subscription.status === 'pasif' || subscription.status === 'inactive';
                          if (isExpired) return 'Süresi Doldu / Pasif';
                          if (subscription.status === 'pending' || subscription.status === 'beklemede') return 'Beklemede';
                          if (subscription.status === 'cancelled' || subscription.status === 'iptal') return 'İptal Edildi';
                          return 'Aktif Abonelik';
                        })()}
                      </span>
                    </div>

                    {(() => {
                      if (subscription.renewal_requested && subscription.renewal_decision === 'pending') {
                        return (
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                            ● Talep İncelemede
                          </span>
                        );
                      }
                      const remainingDays = getSubscriptionDaysRemaining(subscription.expires_at);
                      const isExpired = remainingDays <= 0 || subscription.status === 'expired' || subscription.status === 'cancelled' || subscription.status === 'pasif' || subscription.status === 'inactive';
                      const isNearExpiry = !isExpired && remainingDays <= 7;

                      if (isExpired) {
                        return (
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-muted text-muted-foreground border border-border">
                            ● Pasif / Süresi Doldu
                          </span>
                        );
                      }
                      if (isNearExpiry) {
                        return (
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                            ● Yakında Bitiyor
                          </span>
                        );
                      }
                      return (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                          ● Aktif
                        </span>
                      );
                    })()}
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-background p-3 rounded-xl border border-border space-y-0.5">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Başlangıç</span>
                      <span className="text-foreground font-medium text-xs block">
                        {formatTurkishDateStr(subscription.start_date)}
                      </span>
                    </div>

                    <div className="bg-background p-3 rounded-xl border border-border space-y-0.5">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Bitiş</span>
                      <span className="text-foreground font-medium text-xs block">
                        {formatTurkishDateStr(subscription.expires_at)}
                      </span>
                    </div>

                    <div className="bg-background p-3 rounded-xl border border-border space-y-0.5">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Aylık Ücret</span>
                      <span className="text-foreground font-bold text-xs font-mono block">
                        {subscription.monthly_price && subscription.monthly_price > 0 
                          ? `${subscription.monthly_price.toLocaleString('tr-TR')} TL` 
                          : 'Ücretsiz / Belirtilmemiş'}
                      </span>
                    </div>

                    <div className="bg-background p-3 rounded-xl border border-border space-y-0.5">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Ödeme Durumu</span>
                      <span className="text-foreground font-medium text-xs block">
                        {subscription.payment_status === 'paid' || subscription.payment_status === 'odendi' ? 'Ödendi' : subscription.payment_status === 'unpaid' ? 'Ödenmedi' : 'Beklemede'}
                      </span>
                    </div>

                    <div className="bg-background p-3 rounded-xl border border-border space-y-0.5 col-span-2">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Kalan Süre</span>
                      <span className="text-foreground font-bold text-sm font-mono block">
                        {(() => {
                          const remainingDays = getSubscriptionDaysRemaining(subscription.expires_at);
                          if (remainingDays <= 0 || subscription.status === 'expired' || subscription.status === 'inactive') {
                            return 'Abonelik süresi doldu';
                          }
                          return `${remainingDays} gün`;
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Warning Messages */}
                  {(() => {
                    const remainingDays = getSubscriptionDaysRemaining(subscription.expires_at);
                    const isExpired = remainingDays <= 0 || subscription.status === 'expired' || subscription.status === 'cancelled' || subscription.status === 'pasif' || subscription.status === 'inactive';

                    if (isExpired) {
                      return (
                        <div className="p-3 bg-muted border border-border rounded-xl text-xs text-foreground space-y-1">
                          <p className="font-semibold">Abonelik süresi doldu.</p>
                          <p className="text-[11px] text-muted-foreground">Yenileme talebi göndererek aboneliğinizi uzatabilirsiniz.</p>
                        </div>
                      );
                    }
                    if (remainingDays <= 3) {
                      return (
                        <div className="p-3 bg-muted border border-border rounded-xl text-xs text-foreground space-y-1">
                          <p className="font-semibold">Aboneliğiniz yakında sona erecek. Yenileme talebi gönderebilirsiniz.</p>
                        </div>
                      );
                    }
                    if (remainingDays <= 7) {
                      return (
                        <div className="p-3 bg-muted border border-border rounded-xl text-xs text-foreground">
                          <p className="font-semibold">Aboneliğinizin süresi yakında sona erecek.</p>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Renewal Request Action */}
                  {subscription.renewal_requested && subscription.renewal_decision === 'pending' ? (
                    <div className="p-3.5 bg-background border border-border rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">Abonelik talebiniz yönetici tarafından inceleniyor.</span>
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Beklemede
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Abonelik / yenileme talebiniz yönetici incelemesindedir.</p>
                    </div>
                  ) : subscription.renewal_decision === 'rejected' && !subscription.renewal_requested ? (
                    <div className="space-y-3">
                      <div className="p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-destructive">Abonelik talebiniz reddedildi.</span>
                          <span className="text-[10px] font-bold text-destructive bg-card px-2 py-0.5 rounded border border-destructive/20">
                            Reddedildi
                          </span>
                        </div>
                        <p className="text-[11px] text-destructive">Tekrar talep gönderebilirsiniz.</p>
                      </div>
                      <button
                        type="button"
                        disabled={renewalSubmitting}
                        onClick={handleRenewalRequest}
                        className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs uppercase transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                      >
                        {renewalSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Talep Gönderiliyor...</span>
                          </>
                        ) : (
                          <span>Abonelik Talebi Gönder</span>
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={renewalSubmitting}
                      onClick={handleRenewalRequest}
                      className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs uppercase transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                    >
                      {renewalSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Talep Gönderiliyor...</span>
                        </>
                      ) : (
                        <span>Abonelik Talebi Gönder</span>
                      )}
                    </button>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 bg-muted hover:bg-accent text-foreground font-bold rounded-xl text-xs uppercase transition-all cursor-pointer"
              >
                Kapat
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cüzdan Modal */}
      <AnimatePresence>
        {activeModal === 'wallet' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl space-y-5 text-foreground"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Cüzdanım & Hak Ediş</h3>
                    <p className="text-xs text-muted-foreground">Kazançlarınız ve teslimat bakiye özetiniz</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="p-2 rounded-xl bg-muted hover:bg-accent text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Total Balance Card */}
              <div className="bg-background border border-border rounded-xl p-4 space-y-1.5">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Toplam Net Kazanç</p>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {completedOrders.reduce((acc, curr) => acc + (curr.courier_net || 0), 0)} ₺
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                  <span>Tamamlanan Teslimat:</span>
                  <span className="font-bold text-foreground">{completedOrders.length} Adet</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background border border-border p-3 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Ortalama Teslimat Net</span>
                  <span className="text-sm font-bold text-foreground font-mono">
                    {completedOrders.length > 0 
                      ? Math.round((completedOrders.reduce((acc, curr) => acc + (curr.courier_net || 0), 0) / completedOrders.length)) 
                      : 0} ₺
                  </span>
                </div>
                <div className="bg-background border border-border p-3 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Ödeme Durumu</span>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md inline-block border border-primary/20">
                    Haftalık Aktarım
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs uppercase transition-all cursor-pointer shadow-xs"
              >
                Kapat
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bildirimler Modal */}
      <AnimatePresence>
        {activeModal === 'notifications' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl space-y-5 text-foreground"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Bildirim & Ses Ayarları</h3>
                    <p className="text-xs text-muted-foreground">Saha bildirimleri ve ses tercihleri</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="p-2 rounded-xl bg-muted hover:bg-accent text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-background border border-border rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Sesli Görev Uyarıları</h4>
                    <p className="text-[11px] text-muted-foreground">Yeni sipariş geldiğinde yüksek sesli zil çalar</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playNotificationSound();
                      toast({ title: 'Test Sesi', description: 'Bildirim sesi çalındı.' });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-card hover:bg-accent/50 text-foreground font-bold text-xs border border-border shadow-xs cursor-pointer"
                  >
                    Test Et
                  </button>
                </div>

                <div className="p-3.5 bg-background border border-border rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">GPS Canlı Konum</h4>
                    <p className="text-[11px] text-muted-foreground">Çevrimiçi modda arka planda konum iletilir</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    Etkin
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs uppercase transition-all cursor-pointer shadow-xs"
              >
                Tamam
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ayarlar Modal */}
      <AnimatePresence>
        {activeModal === 'settings' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl space-y-5 text-foreground"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-foreground">
                    <Settings className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Asistan Ayarları</h3>
                    <p className="text-xs text-muted-foreground">Araç ve uygulama parametreleri</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="p-2 rounded-xl bg-muted hover:bg-accent text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 bg-background border border-border rounded-xl flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Araç Tipi</span>
                  <span className="font-semibold text-foreground capitalize">{currentAssistant?.vehicle_type || 'Motosiklet'}</span>
                </div>
                <div className="p-3 bg-background border border-border rounded-xl flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Çalışma Şehri</span>
                  <span className="font-semibold text-foreground">{currentAssistant?.city || 'İstanbul'}</span>
                </div>
                <div className="p-3 bg-background border border-border rounded-xl flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Uygulama Sürümü</span>
                  <span className="font-mono text-muted-foreground">v2.4.0 (Saha Sürümü)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs uppercase transition-all cursor-pointer shadow-xs"
              >
                Kapat
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ulaşılamadı (İptal Sebebi) Modal */}
      <AnimatePresence>
        {cancelModalOrder && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card border border-border rounded-2xl p-6 space-y-4 text-foreground shadow-xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="text-base font-bold text-foreground">Sipariş İptal Nedeni</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Lütfen iptal nedenini belirtiniz</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCancelModalOrder(null);
                    setCancelReasonText('');
                  }}
                  className="p-2 rounded-xl bg-muted hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">İptal Sebebi</label>
                <textarea
                  value={cancelReasonText}
                  onChange={(e) => setCancelReasonText(e.target.value)}
                  placeholder="Müşteri telefonlara cevap vermiyor, adreste bulunamadı vb."
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCancelModalOrder(null);
                    setCancelReasonText('');
                  }}
                  className="flex-1 py-2.5 bg-card hover:bg-destructive/10 text-destructive font-bold rounded-xl text-xs uppercase border border-destructive/30 cursor-pointer transition-colors shadow-xs"
                >
                  İptal
                </button>

                <button
                  type="button"
                  disabled={isSubmittingCancel || !cancelReasonText.trim()}
                  onClick={() => handleCancelOrder(cancelModalOrder.id, cancelReasonText.trim())}
                  className="flex-1 py-2.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold rounded-xl text-xs uppercase transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {isSubmittingCancel ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <span>Onayla</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


