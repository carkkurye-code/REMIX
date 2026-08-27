import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ShoppingBag, 
  Inbox, 
  CreditCard, 
  User as UserIcon, 
  Copy, 
  CheckCircle2, 
  Clock, 
  Package, 
  Truck, 
  AlertCircle,
  Phone,
  Check,
  RefreshCw,
  Store,
  ChevronRight,
  Send,
  Loader2,
  MapPin,
  FileText,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase, db, getStored, setStored, LOCAL_STORAGE_KEYS, Order, isUUID, getExactTableColumns } from '@/lib/supabase';
import { eventBus } from '@/lib/eventBus';
import { toast } from '@/hooks/use-toast';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useModalBackButton } from '@/hooks/useModalBackButton';

export type CustomerTab = 'taleplerim' | 'gelen_kutusu' | 'hesap_bilgilerim';

export interface CustomerAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: CustomerTab;
}

export function CustomerAccountModal({
  isOpen,
  onClose,
  initialTab = 'taleplerim'
}: CustomerAccountModalProps) {
  const { user, profile, refreshProfile, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<CustomerTab>(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submittingOrderId, setSubmittingOrderId] = useState<string | null>(null);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [copiedIban, setCopiedIban] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Profile Edit State
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useBodyScrollLock(isOpen);
  useModalBackButton(isOpen, onClose, 'customer-account-modal');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
    }
  }, [profile]);

  // Fetch Orders for current customer
  const fetchCustomerOrders = async (isSilent = false) => {
    if (!user || !user.id) {
      setOrders([]);
      if (!isSilent) setLoading(false);
      return;
    }
    if (!isSilent) {
      setLoading(true);
    }
    try {
      let fetched: Order[] = [];
      if (supabase) {
        const userId = user.id;
        const phoneStr = (profile?.phone || user.phone || '').trim();
        const sanitizedPhone = phoneStr.replace(/[^0-9+]/g, '');

        const exactCols = await getExactTableColumns('orders');
        const colsSet = new Set(exactCols);

        const orParts: string[] = [];
        if (userId && isUUID(userId)) {
          if (colsSet.has('customer_id') || colsSet.size === 0) {
            orParts.push(`customer_id.eq.${userId}`);
          }
          if (colsSet.has('user_id')) {
            orParts.push(`user_id.eq.${userId}`);
          }
        }

        if (sanitizedPhone && sanitizedPhone.length >= 7) {
          if (colsSet.has('customer_phone') || colsSet.size === 0) {
            orParts.push(`customer_phone.eq.${sanitizedPhone}`);
          }
        }

        if (orParts.length > 0) {
          let query = supabase.from('orders').select('*');
          if (orParts.length === 1) {
            const part = orParts[0];
            if (part.startsWith('customer_id.eq.')) {
              query = query.eq('customer_id', userId);
            } else if (part.startsWith('user_id.eq.')) {
              query = query.eq('user_id', userId);
            } else {
              query = query.eq('customer_phone', sanitizedPhone);
            }
          } else {
            query = query.or(orParts.join(','));
          }

          const { data, error } = await query.order('created_at', { ascending: false }).limit(100);

          if (error) {
            console.warn('Supabase fetchCustomerOrders notice:', error.message || error);
          } else if (data) {
            fetched = data as Order[];
          }
        }

        // Also fetch from tasks table if customer has tasks (strictly using customer_id with valid UUID)
        try {
          if (userId && isUUID(userId)) {
            const { data: taskData, error: taskErr } = await supabase
              .from('tasks')
              .select('*')
              .eq('customer_id', userId)
              .order('created_at', { ascending: false });

            if (taskErr) {
              console.warn('[CustomerAccountModal] tasks fetch notice:', taskErr.message || taskErr);
            } else if (taskData && taskData.length > 0) {
              taskData.forEach((t: any) => {
                const matchedOrder = fetched.find(o => o.id === t.id || o.id === t.order_id);
                if (matchedOrder) {
                  if (t.assistant_id) matchedOrder.assistant_id = t.assistant_id;
                  if (t.assistant_name && t.assistant_name !== 'Saha Asistanı') matchedOrder.assistant_name = t.assistant_name;
                  if (t.status && t.status !== 'bekliyor') matchedOrder.status = t.status;
                  if (t.task_description && !matchedOrder.task_description) matchedOrder.task_description = t.task_description;
                } else {
                  fetched.push({
                    id: t.id,
                    customer_id: t.customer_id,
                    customer_phone: t.customer_phone || '',
                    assistant_id: t.assistant_id,
                    assistant_name: t.assistant_name,
                    status: t.status || 'bekliyor',
                    task_description: t.task_description,
                    preferred_time: t.preferred_time,
                    total_price: t.total_price || t.customer_price || 0,
                    customer_price: t.customer_price || t.total_price || 0,
                    courier_net: t.courier_net || 0,
                    created_at: t.created_at,
                    delivery_address: t.delivery_address || t.pickup_address,
                    customer_address: t.delivery_address || t.pickup_address,
                    notes: t.notes || t.task_description,
                    service_type: t.service_type || 'gecerken'
                  } as Order);
                }
              });
            }
          }
        } catch (_) {}
      }

      // Merge with local storage fallback
      const localOrders = getStored<Order>(LOCAL_STORAGE_KEYS.ORDERS);
      const userPhone = (profile?.phone || user.phone || '').trim();
      const localFiltered = localOrders.filter(
        (o) =>
          o.customer_id === user.id ||
          o.user_id === user.id ||
          (userPhone && o.customer_phone === userPhone)
      );

      // Combine and deduplicate by id, filtering out soft-deleted items
      const map = new Map<string, Order>();
      [...fetched, ...localFiltered].forEach((o) => {
        if (o.id && !map.has(o.id) && !isOrderDeleted(o)) {
          map.set(o.id, o);
        }
      });

      // Query assistant names for any assigned orders where assistant_name is missing, placeholder, or needs resolution
      const assignedOrders = Array.from(map.values()).filter(o => o.assistant_id);
      if (assignedOrders.length > 0 && supabase) {
        const rawIds = Array.from(new Set(assignedOrders.map(o => String(o.assistant_id || '').trim()).filter(Boolean)));
        const validAssistantUuids = rawIds.filter(id => isUUID(id));

        if (validAssistantUuids.length > 0) {
          try {
            const pMap = new Map<string, string>();

            // 1. Check profiles table (id = assistant_id)
            const { data: profs, error: profsErr } = await supabase
              .from('profiles')
              .select('id, full_name')
              .in('id', validAssistantUuids);

            if (!profsErr && profs && profs.length > 0) {
              profs.forEach((p: any) => {
                const fn = (p?.full_name || '').trim();
                if (p?.id && fn && fn !== 'Saha Asistanı') {
                  pMap.set(p.id, fn);
                }
              });
            }

            // 2. Check assistants table (id in UUIDs or user_id in UUIDs) using ONLY existing column full_name
            const { data: assts, error: asstsErr } = await supabase
              .from('assistants')
              .select('id, user_id, full_name')
              .or(`id.in.(${validAssistantUuids.join(',')}),user_id.in.(${validAssistantUuids.join(',')})`);

            if (!asstsErr && assts && assts.length > 0) {
              assts.forEach((a: any) => {
                const fn = (a?.full_name || '').trim();
                if (fn && fn !== 'Saha Asistanı') {
                  if (a.id) pMap.set(a.id, fn);
                  if (a.user_id) pMap.set(a.user_id, fn);
                }
              });
            }

            // Update matched orders with real assistant full_name
            map.forEach((o) => {
              const aid = String(o.assistant_id || '').trim();
              if (aid && pMap.has(aid)) {
                o.assistant_name = pMap.get(aid) || o.assistant_name;
              }
            });
          } catch (e) {
            console.warn('Notice resolving assistant names:', e);
          }
        }
      }

      const sorted = Array.from(map.values()).sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );

      setOrders((prev) => {
        if (prev.length === sorted.length) {
          const isIdentical = prev.every((oldOrder, i) => {
            const newOrder = sorted[i];
            return (
              oldOrder.id === newOrder.id &&
              oldOrder.status === newOrder.status &&
              oldOrder.assistant_id === newOrder.assistant_id &&
              oldOrder.assistant_name === newOrder.assistant_name &&
              oldOrder.updated_at === newOrder.updated_at &&
              oldOrder.customer_price === newOrder.customer_price &&
              oldOrder.total_price === newOrder.total_price &&
              oldOrder.task_description === newOrder.task_description
            );
          });
          if (isIdentical) {
            return prev;
          }
        }
        return sorted;
      });
    } catch (err) {
      console.error('Error fetching customer orders:', err);
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  };

  // Fetch Notifications for current customer
  const fetchCustomerNotifications = async () => {
    if (!user || !user.id || !supabase) {
      setNotifications([]);
      return;
    }
    try {
      const exactCols = await getExactTableColumns('notifications');
      const colsSet = new Set(exactCols);

      const orParts: string[] = [];
      if (colsSet.has('user_id') || colsSet.size === 0) {
        orParts.push(`user_id.eq.${user.id}`);
      }
      if (colsSet.has('recipient_id')) {
        orParts.push(`recipient_id.eq.${user.id}`);
      }
      if (colsSet.has('recipient_profile_id')) {
        orParts.push(`recipient_profile_id.eq.${user.id}`);
      }

      let query = supabase.from('notifications').select('*');
      if (orParts.length > 1) {
        query = query.or(orParts.join(','));
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(50);

      if (!error && data) {
        setNotifications((prev) => {
          if (prev.length === data.length) {
            const isIdentical = prev.every((oldN, i) => {
              const newN = data[i];
              return (
                oldN.id === newN.id &&
                oldN.status === newN.status &&
                oldN.message === newN.message &&
                oldN.created_at === newN.created_at
              );
            });
            if (isIdentical) return prev;
          }
          return data;
        });
      }
    } catch (err) {
      console.warn('Error fetching customer notifications:', err);
    }
  };

  // Filter out soft-deleted orders
  const isOrderDeleted = (o: any) => {
    return Boolean(o?.deleted === true || o?.archived === true || o?.is_deleted === true);
  };

  // State for Delete Confirmations
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [deletingNotifId, setDeletingNotifId] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [notifToDelete, setNotifToDelete] = useState<any | null>(null);

  // Handle Delete Order (Soft Delete with Supabase + LocalStorage Cache Sync)
  const handleDeleteOrder = async (order: Order) => {
    if (!order || !order.id || !user || !user.id) return;
    setDeletingOrderId(order.id);
    try {
      if (supabase) {
        const orderCols = await getExactTableColumns('orders');
        const orderColsSet = new Set(orderCols);

        const updatePayload: Record<string, any> = {};
        if (orderColsSet.has('deleted') || orderColsSet.size === 0) {
          updatePayload.deleted = true;
        }
        if (orderColsSet.has('archived')) {
          updatePayload.archived = true;
        }
        if (orderColsSet.has('updated_at')) {
          updatePayload.updated_at = new Date().toISOString();
        }

        // Update orders table with strict customer ownership filter
        if (isUUID(order.id)) {
          let orderUpdate = supabase
            .from('orders')
            .update(updatePayload)
            .eq('id', order.id);

          if (isUUID(user.id)) {
            if (orderColsSet.has('customer_id') || orderColsSet.size === 0) {
              orderUpdate = orderUpdate.eq('customer_id', user.id);
            } else if (orderColsSet.has('user_id')) {
              orderUpdate = orderUpdate.eq('user_id', user.id);
            }
          }

          const { error: orderErr } = await orderUpdate;
          if (orderErr) {
            console.warn('[handleDeleteOrder] orders soft-delete notice:', orderErr.message || orderErr);
          }
        }

        // Also update tasks table if matching task exists
        try {
          const taskCols = await getExactTableColumns('tasks');
          const taskColsSet = new Set(taskCols);
          const taskUpdatePayload: Record<string, any> = {};
          if (taskColsSet.has('deleted') || taskColsSet.size === 0) {
            taskUpdatePayload.deleted = true;
          }
          if (taskColsSet.has('archived')) {
            taskUpdatePayload.archived = true;
          }

          if (isUUID(order.id)) {
            let taskUpdate = supabase
              .from('tasks')
              .update(taskUpdatePayload)
              .or(`id.eq.${order.id},order_id.eq.${order.id}`);

            if (isUUID(user.id)) {
              taskUpdate = taskUpdate.eq('customer_id', user.id);
            }

            await taskUpdate;
          }
        } catch (tErr) {
          console.warn('[handleDeleteOrder] tasks soft-delete notice:', tErr);
        }
      }

      // Update LocalStorage orders cache
      const localOrders = getStored<Order>(LOCAL_STORAGE_KEYS.ORDERS);
      const updatedLocalOrders = localOrders.filter(
        (o) => o.id !== order.id && (o as any).order_id !== order.id && (o as any).task_id !== order.id
      );
      setStored(LOCAL_STORAGE_KEYS.ORDERS, updatedLocalOrders);

      // Update LocalStorage tasks cache
      const localTasks = getStored<any>('ugra_tasks_cache');
      const updatedLocalTasks = localTasks.filter(
        (t) => t.id !== order.id && t.order_id !== order.id
      );
      setStored('ugra_tasks_cache', updatedLocalTasks);

      // Remove from component state immediately
      setOrders((prev) => prev.filter((o) => o.id !== order.id));

      toast({
        title: 'Talep Silindi',
        description: 'Talebiniz başarıyla silindi.',
        variant: 'plain'
      });
      setOrderToDelete(null);
    } catch (err: any) {
      console.error('Error deleting order:', err);
      toast({
        title: 'Hata',
        description: 'Talep silinirken bir sorun oluştu.',
        variant: 'destructive'
      });
    } finally {
      setDeletingOrderId(null);
    }
  };

  // Handle Delete Notification (Permanent Delete from Supabase + LocalStorage Sync)
  const handleDeleteNotification = async (notif: any) => {
    if (!notif || !notif.id || !user || !user.id) return;
    setDeletingNotifId(notif.id);
    try {
      if (supabase && isUUID(notif.id)) {
        let notifQuery = supabase
          .from('notifications')
          .delete()
          .eq('id', notif.id);

        if (isUUID(user.id)) {
          notifQuery = notifQuery.or(`user_id.eq.${user.id},recipient_id.eq.${user.id},recipient_profile_id.eq.${user.id}`);
        }

        const { error: notifErr } = await notifQuery;
        if (notifErr) {
          console.warn('[handleDeleteNotification] delete notice:', notifErr.message || notifErr);
        }
      }

      // Update LocalStorage virtual notifications cache
      const localNotifs = getStored<any>('ugra_virtual_notifications');
      const updatedLocalNotifs = localNotifs.filter((n) => n.id !== notif.id);
      setStored('ugra_virtual_notifications', updatedLocalNotifs);

      // Remove from component state immediately
      setNotifications((prev) => prev.filter((n) => n.id !== notif.id));

      toast({
        title: 'Bildirim Silindi',
        description: 'Bildirim gelen kutunuzdan kaldırıldı.',
        variant: 'plain'
      });
      setNotifToDelete(null);
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      toast({
        title: 'Hata',
        description: 'Bildirim silinirken bir sorun oluştu.',
        variant: 'destructive'
      });
    } finally {
      setDeletingNotifId(null);
    }
  };

  const handleCopyText = (text: string, label: string, notifId: string) => {
    try {
      navigator.clipboard.writeText(text.replace(/\s+/g, ' '));
      setCopiedField(`${notifId}_${label}`);
      toast({
        title: `${label} Kopyalandı`,
        description: `${label} bilgisi panoya kopyalandı.`,
        variant: 'plain'
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchCustomerOrders(false);
      fetchCustomerNotifications();

      // Realtime EventBus subscriptions
      const unsub1 = eventBus.subscribe('TASK_ACCEPTED', (evt: any) => {
        if (evt?.payload?.assistantName && evt?.payload?.orderId) {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === evt.payload.orderId
                ? {
                    ...o,
                    assistant_id: evt.payload.assistantId || o.assistant_id,
                    assistant_name: evt.payload.assistantName,
                    status: 'accepted'
                  }
                : o
            )
          );
        }
        fetchCustomerOrders(true);
        fetchCustomerNotifications();
      });

      const unsub2 = eventBus.subscribe('TASK_ASSIGNED', () => {
        fetchCustomerOrders(true);
      });

      const unsub3 = eventBus.subscribe('TASK_COMPLETED', () => {
        fetchCustomerOrders(true);
      });

      const unsub4 = eventBus.subscribe('TASK_CREATED', () => {
        fetchCustomerOrders(true);
      });

      // Realtime Supabase Channel
      let channel: any = null;
      if (supabase) {
        try {
          channel = supabase
            .channel(`customer-orders-realtime-${user.id}-${Date.now()}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
              fetchCustomerOrders(true);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
              fetchCustomerOrders(true);
            })
            .subscribe();
        } catch (e) {}
      }

      // Fallback background sync (10 seconds) to conserve bandwidth while Realtime is listening
      const interval = setInterval(() => {
        fetchCustomerOrders(true);
        fetchCustomerNotifications();
      }, 10000);

      return () => {
        clearInterval(interval);
        unsub1();
        unsub2();
        unsub3();
        unsub4();
        if (channel && supabase) {
          supabase.removeChannel(channel);
        }
      };
    }
  }, [isOpen, user]);

  // Handle Reporting Payment ("Ödemeyi Gönderdim")
  const handleReportPayment = async (order: Order) => {
    setSubmittingOrderId(order.id);
    try {
      const nowIso = new Date().toISOString();
      if (supabase) {
        const { error } = await supabase
          .from('orders')
          .update({
            status: 'odeme_bildirildi',
            updated_at: nowIso
          })
          .eq('id', order.id);

        if (error) {
          console.warn('Supabase update status notice:', error.message);
        }
      }

      // Local state update
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: 'odeme_bildirildi' } : o))
      );

      toast({
        title: 'Ödeme Bildirimi Gönderildi',
        description: 'Ödemenizi ilettiğiniz asistana bildirildi. Asistan kontrol edip siparişi hazırlayacaktır.',
        variant: 'plain'
      });

      setSelectedOrderForPayment(null);
      await fetchCustomerOrders(true);
    } catch (err: any) {
      toast({
        title: 'Hata',
        description: 'Ödeme bildirimi iletilemedi: ' + (err?.message || ''),
        variant: 'destructive'
      });
    } finally {
      setSubmittingOrderId(null);
    }
  };

  // Copy IBAN Helper
  const handleCopyIban = (ibanStr: string) => {
    try {
      navigator.clipboard.writeText(ibanStr.replace(/\s+/g, ''));
      setCopiedIban(true);
      toast({
        title: 'IBAN Kopyalandı',
        description: 'Asistan IBAN adresi panoya kopyalandı.',
        variant: 'plain'
      });
      setTimeout(() => setCopiedIban(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  // GPS Location Helper for Hesap Bilgilerim > Konumum
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Konum Desteklenmiyor',
        description: 'Tarayıcınız konum servisini desteklemiyor.',
        variant: 'destructive'
      });
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          if (res.ok) {
            const data = await res.json();
            const formatted = data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
            setAddress(formatted);
            toast({
              title: 'Konum Alındı',
              description: 'Mevcut konumunuz alanına eklendi.',
              variant: 'plain'
            });
          } else {
            setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
            toast({
              title: 'Konum Alındı',
              description: 'Koordinatlarınız konum alanına eklendi.',
              variant: 'plain'
            });
          }
        } catch (e) {
          setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          toast({
            title: 'Konum Alındı',
            description: 'Koordinatlarınız konum alanına eklendi.',
            variant: 'plain'
          });
        } finally {
          setGettingLocation(false);
        }
      },
      (err) => {
        setGettingLocation(false);
        toast({
          title: 'Konum Alınamadı',
          description: 'Lütfen cihazınızda veya tarayıcınızda konum iznini kontrol ediniz.',
          variant: 'destructive'
        });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Handle Saving Profile & Location
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      const cleanName = fullName.trim();
      const cleanPhone = phone.trim();
      const cleanAddress = address.trim();

      if (updateProfile) {
        const res = await updateProfile({
          full_name: cleanName,
          phone: cleanPhone,
          address: cleanAddress
        });

        if (!res.success) {
          throw new Error(res.error || 'Profil güncellenemedi');
        }
      } else {
        if (supabase) {
          await supabase.auth.updateUser({
            data: {
              full_name: cleanName,
              phone: cleanPhone,
              address: cleanAddress
            }
          });
          const { data: upData, error: upErr } = await supabase
            .from('profiles')
            .update({
              full_name: cleanName,
              phone: cleanPhone,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
            .select('id');

          if (upErr) {
            throw upErr;
          }

          if (!upData || upData.length === 0) {
            await supabase
              .from('profiles')
              .upsert({
                id: user.id,
                email: user.email || '',
                full_name: cleanName,
                phone: cleanPhone,
                role: 'customer',
                is_admin: false,
                updated_at: new Date().toISOString()
              }, { onConflict: 'id' });
          }
        }
        if (refreshProfile) {
          await refreshProfile();
        }
      }

      setFullName(cleanName);
      setPhone(cleanPhone);
      setAddress(cleanAddress);

      toast({
        title: 'Konum ve Bilgiler Kaydedildi',
        description: 'Konumunuz ve hesap bilgileriniz başarıyla güncellendi.',
        variant: 'plain'
      });
    } catch (err: any) {
      toast({
        title: 'Hata',
        description: 'Profil güncellenirken hata oluştu: ' + (err?.message || ''),
        variant: 'destructive'
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // Status Helpers
  const getStatusInfo = (statusRaw?: string, isAccepted?: boolean) => {
    const s = (statusRaw || '').toLowerCase();
    if (['cancelled', 'iptal', 'iptal_edildi'].includes(s)) {
      return {
        label: 'İptal edildi',
        color: 'bg-red-500/10 text-red-400 border-red-500/20',
        step: 8
      };
    }
    if (['completed', 'teslim_edildi', 'tamamlandi'].includes(s)) {
      return {
        label: 'Teslim edildi',
        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        step: 7
      };
    }
    if (['delivering', 'on_the_way', 'yolda', 'teslimata_cikti'].includes(s)) {
      return {
        label: 'Teslimata çıktı',
        color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        step: 6
      };
    }
    if (['purchasing', 'hazirlaniyor', 'urunler_aliniyor', 'dogrulandi'].includes(s)) {
      return {
        label: 'Ürünler alınıyor',
        color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        step: 5
      };
    }
    if (['payment_reported', 'odeme_bildirildi'].includes(s)) {
      return {
        label: 'Ödeme bildirildi',
        color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        step: 4
      };
    }
    if (['payment_pending', 'odeme_bekleniyor'].includes(s)) {
      return {
        label: 'Asistan kabul etti',
        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        step: 3
      };
    }
    if (['accepted', 'assigned', 'asistan_kabul_etti'].includes(s) || isAccepted) {
      return {
        label: 'Asistan kabul etti',
        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        step: 2
      };
    }
    return {
      label: 'Bekleniyor',
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      step: 1
    };
  };

  // Helper to extract clean customer task description
  const getCleanTaskDescription = (order: Order): string => {
    // 1. Check order.task_description
    if (order.task_description && typeof order.task_description === 'string' && order.task_description.trim()) {
      let td = order.task_description.trim();
      td = td
        .replace(/^\[.*?\]\s*/g, '')
        .replace(/•?\s*(?:Ne Zaman|Saat|Tercih Edilen Saat):[^\n\r]*/gi, '')
        .replace(/•?\s*Adres Detayı:[^\n\r]*/gi, '')
        .replace(/•?\s*Müşteri:[^\n\r]*/gi, '')
        .replace(/•?\s*Telefon:[^\n\r]*/gi, '')
        .trim();

      if (
        td &&
        td !== 'Yapılacak iş belirtilmemiş.' &&
        td !== 'Hizmet Talebi' &&
        td !== 'Geçerken UĞRA Talebi' &&
        td !== 'Hemen UĞRA Talebi' &&
        !td.toLowerCase().includes('hazır olanı al') &&
        !td.toLowerCase().includes('hazır olanı bırak')
      ) {
        return td;
      }
    }

    // 2. Check order.notes
    if (order.notes && typeof order.notes === 'string') {
      let clean = order.notes
        .replace(/\[(?:Geçerken|Hemen)\s*UĞRA\s*-\s*Hazır\s*Olanı\s*(?:Al|Bırak)\]\s*/gi, '')
        .replace(/\[(?:Mağaza Siparişi|Mağaza|Partner)[^\]]*\]\s*/gi, '')
        .replace(/^\[.*?\]\s*/g, '')
        .replace(/•?\s*(?:Ne Zaman|Saat|Tercih Edilen Saat):[^\n\r]*/gi, '')
        .replace(/•?\s*Adres Detayı:[^\n\r]*/gi, '')
        .replace(/•?\s*Müşteri:[^\n\r]*/gi, '')
        .replace(/•?\s*Telefon:[^\n\r]*/gi, '')
        .replace(/•?\s*Ürün(?:lerin)?\s*Toplamı:[^\n\r]*/gi, '')
        .replace(/•?\s*Asistan\s*Hizmet\s*Bedeli:[^\n\r]*/gi, '')
        .replace(/•?\s*Genel\s*Toplam:[^\n\r]*/gi, '')
        .replace(/\n\s*\n+/g, '\n')
        .trim();

      if (
        clean &&
        clean !== 'Yapılacak iş belirtilmemiş.' &&
        !clean.toLowerCase().includes('hazır olanı al') &&
        !clean.toLowerCase().includes('hazır olanı bırak')
      ) {
        return clean;
      }
    }

    // 3. If real items exist in order.items
    const realItems = getRealStoreProducts(order);
    if (realItems.length > 0) {
      return realItems.map((it: any) => `${it.quantity || 1}x ${it.title || it.name || 'Ürün'}`).join(', ');
    }

    return order.task_description || 'Asistan Hizmet Talebi';
  };

  // Helper to extract preferred time slot
  const getPreferredTimeSlot = (order: Order): string | null => {
    if (order.preferred_time && typeof order.preferred_time === 'string' && order.preferred_time.trim()) {
      return order.preferred_time.trim();
    }
    if ((order as any).time_slot && typeof (order as any).time_slot === 'string' && (order as any).time_slot.trim()) {
      return (order as any).time_slot.trim();
    }
    if ((order as any).delivery_time && typeof (order as any).delivery_time === 'string' && (order as any).delivery_time.trim()) {
      return (order as any).delivery_time.trim();
    }
    if (order.notes && typeof order.notes === 'string') {
      const match = order.notes.match(/•?\s*(?:Ne Zaman|Saat|Tercih Edilen Saat):\s*([^\n\r]+)/i);
      if (match && match[1]?.trim()) {
        return match[1].trim();
      }
    }
    return null;
  };

  // Helper to extract real store products
  const getRealStoreProducts = (order: Order): any[] => {
    const itemsList = order.items || [];
    if (!Array.isArray(itemsList)) return [];
    return itemsList.filter((item: any) => {
      const title = (item?.title || item?.name || '').toLowerCase();
      return (
        title &&
        !title.includes('uğra') &&
        !title.includes('hazır olanı') &&
        !title.includes('asistan talebi')
      );
    });
  };

  // Helper to extract customer address
  const getCustomerAddress = (order: Order): string => {
    return (
      order.customer_address ||
      order.delivery_address ||
      order.pickup_address ||
      (profile?.address ? profile.address : '') ||
      'Belirtilmedi'
    );
  };

  // Helper to get service or store badge label
  const getServiceBadgeLabel = (order: Order): string => {
    if (order.partner_name && order.partner_name.trim()) {
      return order.partner_name.trim();
    }
    const st = (order.service_type || '').toLowerCase();
    if (st === 'gecerken' || st.includes('gecerken')) return 'Geçerken UĞRA';
    if (st === 'hemen' || st.includes('hemen')) return 'Hemen UĞRA';
    return 'UĞRA Asistanı';
  };

  if (!isOpen) return null;

  // Filter Orders Requiring Payment
  const pendingPaymentOrders = orders.filter((o) =>
    ['accepted', 'asistan_kabul_etti', 'payment_pending', 'odeme_bekleniyor', 'payment_reported', 'odeme_bildirildi'].includes(
      (o.status || '').toLowerCase()
    )
  );

  return typeof document !== 'undefined'
    ? createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-4 md:p-6">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              />

              {/* Modal Card */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 260 }}
                className="relative z-10 w-full max-w-3xl bg-card border border-border rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                {/* Modal Header */}
                <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-card/90 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                        <span>{profile?.full_name || user?.email || 'Müşteri Hesabı'}</span>
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Siparişlerinizi, bildirimlerinizi ve ödemelerinizi yönetin.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground border border-border/60 transition-colors cursor-pointer"
                    aria-label="Kapat"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 border-b border-border bg-background/60 overflow-x-auto scrollbar-none shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('taleplerim')}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                      activeTab === 'taleplerim'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-card text-muted-foreground hover:text-foreground hover:bg-card/80 border border-border'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Taleplerim</span>
                    {orders.length > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'taleplerim' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {orders.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('gelen_kutusu')}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                      activeTab === 'gelen_kutusu'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-card text-muted-foreground hover:text-foreground hover:bg-card/80 border border-border'
                    }`}
                  >
                    <Inbox className="w-4 h-4" />
                    <span>Gelen Kutusu</span>
                    {pendingPaymentOrders.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('hesap_bilgilerim')}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                      activeTab === 'hesap_bilgilerim'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-card text-muted-foreground hover:text-foreground hover:bg-card/80 border border-border'
                    }`}
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>Hesap Bilgilerim</span>
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
                  {/* TAB 1: TALEPLERİM */}
                  {activeTab === 'taleplerim' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                          Oluşturduğunuz Asistan Talepleri ({orders.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => fetchCustomerOrders(false)}
                          className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer font-bold"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                          <span>Yenile</span>
                        </button>
                      </div>

                      {loading && orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-3">
                          <Loader2 className="w-7 h-7 animate-spin text-primary" />
                          <p className="text-xs font-medium">Talepleriniz yükleniyor...</p>
                        </div>
                      ) : orders.length === 0 ? (
                        <div className="text-center py-12 bg-card/60 border border-border/80 rounded-2xl space-y-2.5 p-6">
                          <Package className="w-10 h-10 text-muted-foreground/60 mx-auto" />
                          <h3 className="text-sm font-bold text-foreground">Henüz Bir Asistan Talebiniz Yok</h3>
                          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                            Mağaza veya kurye sayfalarımızdan dilediğiniz zaman asistan talebi oluşturabilirsiniz.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {orders.map((order, index) => {
                            const isAccepted = [
                              'accepted',
                              'asistan_kabul_etti',
                              'assigned',
                              'purchasing',
                              'hazirlaniyor',
                              'delivering',
                              'on_the_way',
                              'yolda',
                              'teslimata_cikti',
                              'completed',
                              'teslim_edildi',
                              'tamamlandi',
                              'payment_pending',
                              'odeme_bekleniyor',
                              'payment_reported',
                              'odeme_bildirildi'
                            ].includes((order.status || '').toLowerCase()) || Boolean(order.assistant_id && (order.status || '').toLowerCase() !== 'cancelled' && (order.status || '').toLowerCase() !== 'iptal');

                            const statusInfo = getStatusInfo(order.status, isAccepted);
                            const taskDesc = getCleanTaskDescription(order);
                            const serviceBadge = getServiceBadgeLabel(order);

                            // Assistant Name Resolution
                            const rawAsstName = (order.assistant_name || '').trim();
                            const displayAssistantName = isAccepted
                              ? (rawAsstName && rawAsstName !== 'Saha Asistanı' ? rawAsstName : (rawAsstName || 'Asistan Atandı'))
                              : null;

                            return (
                              <div
                                key={order.id}
                                className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-4 transition-all hover:border-primary/40 shadow-sm"
                              >
                                {/* Talep Numarası ve Sil Butonu */}
                                <div className="flex items-center justify-between pb-1">
                                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    Talep {index + 1}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setOrderToDelete(order)}
                                    disabled={deletingOrderId === order.id}
                                    className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    title="Talebi Sil"
                                  >
                                    {deletingOrderId === order.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                    <span>Sil</span>
                                  </button>
                                </div>

                                {/* Talep Kodu ve Türü / Durumu */}
                                <div className="space-y-1">
                                  <div className="text-base font-mono font-bold text-foreground">
                                    #UG-{order.id.slice(0, 8).toUpperCase()}
                                  </div>
                                  <div className="text-xs text-muted-foreground font-medium">
                                    {serviceBadge} <span className="text-border">·</span>{' '}
                                    <span className={isAccepted ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                                      {statusInfo.label}
                                    </span>
                                  </div>
                                </div>

                                {/* Yapılacak İş */}
                                <div className="space-y-1.5 pt-1">
                                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    Yapılacak İş
                                  </div>
                                  <div className="bg-background/80 border border-border/80 rounded-xl p-3.5">
                                    <p className="text-sm font-medium text-foreground leading-relaxed">
                                      {taskDesc}
                                    </p>
                                  </div>
                                </div>

                                {/* Atanan Asistan (Sadece atanmışsa gösterilir) */}
                                {isAccepted && displayAssistantName && (
                                  <div className="space-y-1 pt-2 border-t border-border/60">
                                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                      Atanan Asistan
                                    </div>
                                    <div className="text-sm font-bold text-emerald-600">
                                      {displayAssistantName}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: GELEN KUTUSU */}
                  {activeTab === 'gelen_kutusu' && (
                    <div className="space-y-4">
                      <div className="pb-2 border-b border-border">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                          Sipariş & Ödeme Bildirimleriniz
                        </span>
                      </div>

                      {(() => {
                        // Filter IBAN notifications: must belong to the logged-in customer and match the relevant order/task
                        const validIbanNotifications = notifications.filter((notif) => {
                          const isIbanDetails = notif.type === 'iban_details' || (notif.message && notif.message.includes('IBAN:'));
                          if (!isIbanDetails) return false;

                          // Ensure notification belongs strictly to the authenticated user
                          const notifUser = notif.user_id || notif.recipient_id || (notif as any).recipient_profile_id;
                          if (notifUser && user?.id && notifUser !== user.id) {
                            return false;
                          }

                          // Check candidate order/task IDs attached to this notification
                          const notifOrderCandidates = [
                            notif.order_id,
                            notif.task_id,
                            notif.payload?.order_id,
                            notif.payload?.task_id,
                          ].filter(Boolean).map(id => String(id).trim());

                          if (notifOrderCandidates.length > 0) {
                            // Find the specific matching order across all identifier variants (id, order_id, task_id)
                            const matchingOrder = orders.find((o: any) => {
                              const oIds = [o.id, o.order_id, o.task_id].filter(Boolean).map(id => String(id).trim());
                              return notifOrderCandidates.some(nid => oIds.includes(nid));
                            });

                            if (matchingOrder) {
                              const s = (matchingOrder.status || '').toLowerCase();
                              // Do not show IBAN notification if the order was cancelled
                              return !['cancelled', 'iptal'].includes(s);
                            }

                            // If orders list is empty or order is temporarily not in state (race condition/loading),
                            // keep the IBAN notification visible since it genuinely belongs to this user
                            return true;
                          }

                          // If notification doesn't have order_id metadata (legacy record),
                          // check matching order if orders exist, otherwise keep visible to prevent disappearance
                          if (orders.length === 0) {
                            return true;
                          }

                          const notifTime = notif.created_at ? new Date(notif.created_at).getTime() : 0;
                          const hasCancelledMatch = orders.some((o: any) => {
                            const s = (o.status || '').toLowerCase();
                            return ['cancelled', 'iptal'].includes(s) && o.id === notif.order_id;
                          });
                          if (hasCancelledMatch) return false;

                          const matchingActiveOrder = orders.find((o: any) => {
                            const s = (o.status || '').toLowerCase();
                            const isOrderActive = ['accepted', 'asistan_kabul_etti', 'payment_pending', 'odeme_bekleniyor', 'payment_reported', 'odeme_bildirildi', 'purchasing', 'hazirlaniyor', 'urunler_aliniyor', 'delivering', 'on_the_way', 'yolda', 'teslimata_cikti'].includes(s);
                            if (!isOrderActive) return false;

                            const orderTime = o.created_at ? new Date(o.created_at).getTime() : 0;
                            return orderTime > 0 && notifTime >= orderTime;
                          });

                          return matchingActiveOrder ? true : true;
                        });

                        const hasAnyContent = pendingPaymentOrders.length > 0 || orders.length > 0 || validIbanNotifications.length > 0;

                        if (!hasAnyContent) {
                          return (
                            <div className="text-center py-12 bg-card/60 border border-border/80 rounded-2xl p-6 space-y-2.5">
                              <Inbox className="w-10 h-10 text-muted-foreground/60 mx-auto" />
                              <h3 className="text-sm font-bold text-foreground">Gelen Kutunuz Boş</h3>
                              <p className="text-xs text-muted-foreground">
                                Asistanınız talebinizi kabul ettiğinde durum bildirimleri ve ödeme bilgileri buraya gelecektir.
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-3">
                            {/* IBAN Notifications */}
                            {validIbanNotifications.map((notif) => {
                              const msg = notif.message || notif.body || '';
                              const accountHolderMatch = msg.match(/Hesap Sahibi:\s*([^\n\r]+)/i);
                              const bankNameMatch = msg.match(/Banka:\s*([^\n\r]+)/i);
                              const ibanMatch = msg.match(/IBAN:\s*([^\n\r]+)/i);

                              const accountHolder = accountHolderMatch ? accountHolderMatch[1].trim() : (notif.payload?.account_holder || null);
                              const bankName = bankNameMatch ? bankNameMatch[1].trim() : (notif.payload?.bank_name || null);
                              const iban = ibanMatch ? ibanMatch[1].trim() : (notif.payload?.iban || null);

                              return (
                                <div
                                  key={notif.id}
                                  className="p-4 bg-card border border-border rounded-2xl space-y-3 shadow-sm"
                                >
                                  <div className="flex items-center justify-between pb-2 border-b border-border">
                                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                                      <CreditCard className="w-4 h-4 text-emerald-600" />
                                      <span>{notif.title || 'Asistan Ödeme Bilgilerini Gönderdi'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {notif.created_at && (
                                        <span className="text-[10px] text-muted-foreground font-mono">
                                          {new Date(notif.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => setNotifToDelete(notif)}
                                        disabled={deletingNotifId === notif.id}
                                        className="p-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 text-xs transition-colors flex items-center cursor-pointer disabled:opacity-50"
                                        title="Bildirimi Sil"
                                      >
                                        {deletingNotifId === notif.id ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Trash2 className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </div>
                                  </div>

                                  <div className="space-y-2 text-xs">
                                    {accountHolder && (
                                      <div className="p-2.5 bg-background/80 border border-border/80 rounded-xl flex items-center justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                          <span className="text-[10px] text-muted-foreground font-bold uppercase block">Hesap Sahibi</span>
                                          <span className="text-foreground font-semibold text-xs truncate block">{accountHolder}</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleCopyText(accountHolder, 'Hesap Sahibi', notif.id)}
                                          className="px-2.5 py-1 rounded-lg bg-card hover:bg-background border border-border text-foreground font-bold text-[11px] transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                                        >
                                          {copiedField === `${notif.id}_Hesap Sahibi` ? (
                                            <Check className="w-3 h-3 text-emerald-600" />
                                          ) : (
                                            <Copy className="w-3 h-3 text-muted-foreground" />
                                          )}
                                          <span>Kopyala</span>
                                        </button>
                                      </div>
                                    )}

                                    {bankName && (
                                      <div className="p-2.5 bg-background/80 border border-border/80 rounded-xl flex items-center justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                          <span className="text-[10px] text-muted-foreground font-bold uppercase block">Banka</span>
                                          <span className="text-foreground font-semibold text-xs truncate block">{bankName}</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleCopyText(bankName, 'Banka', notif.id)}
                                          className="px-2.5 py-1 rounded-lg bg-card hover:bg-background border border-border text-foreground font-bold text-[11px] transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                                        >
                                          {copiedField === `${notif.id}_Banka` ? (
                                            <Check className="w-3 h-3 text-emerald-600" />
                                          ) : (
                                            <Copy className="w-3 h-3 text-muted-foreground" />
                                          )}
                                          <span>Kopyala</span>
                                        </button>
                                      </div>
                                    )}

                                    {iban && (
                                      <div className="p-2.5 bg-background/80 border border-border/80 rounded-xl flex items-center justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                          <span className="text-[10px] text-muted-foreground font-bold uppercase block">IBAN</span>
                                          <span className="text-foreground font-mono font-semibold text-xs tracking-wider break-all block">{iban}</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleCopyText(iban, 'IBAN', notif.id)}
                                          className="px-2.5 py-1 rounded-lg bg-card hover:bg-background border border-border text-foreground font-bold text-[11px] transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                                        >
                                          {copiedField === `${notif.id}_IBAN` ? (
                                            <Check className="w-3 h-3 text-emerald-600" />
                                          ) : (
                                            <Copy className="w-3 h-3 text-muted-foreground" />
                                          )}
                                          <span>Kopyala</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                          {orders.map((order) => {
                            const statusStr = (order.status || '').toLowerCase();
                            const isAccepted = ['accepted', 'asistan_kabul_etti', 'payment_pending', 'odeme_bekleniyor'].includes(statusStr);
                            const isReported = ['payment_reported', 'odeme_bildirildi'].includes(statusStr);
                            const isPurchasing = ['purchasing', 'hazirlaniyor', 'urunler_aliniyor'].includes(statusStr);
                            const isDelivering = ['delivering', 'on_the_way', 'yolda', 'teslimata_cikti'].includes(statusStr);
                            const isCompleted = ['completed', 'teslim_edildi'].includes(statusStr);

                            return (
                              <div
                                key={order.id}
                                className="p-4 bg-card border border-border rounded-2xl space-y-2.5 shadow-sm"
                              >
                                {isAccepted && (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                      <span>🎉 Asistan Talebinizi Kabul Etti!</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      <strong className="text-foreground">{order.assistant_name || 'Uğra Asistanı'}</strong> talebinizi kabul etti. Talebiniz en kısa sürede hazırlanıp adresinize ulaştırılacaktır.
                                    </p>
                                  </div>
                                )}

                                {isReported && (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-purple-700 font-bold text-xs">
                                      <CheckCircle2 className="w-4 h-4 text-purple-600" />
                                      <span>💳 Ödeme Bildirimi Gönderildi</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      Ödemeyi gönderdiğinizi asistana ilettik. Asistanınız kontrol ettikten sonra mağazadan ürünleri satın almak üzere harekete geçecektir.
                                    </p>
                                  </div>
                                )}

                                {isPurchasing && (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                                      <Package className="w-4 h-4 text-indigo-600" />
                                      <span>🛍️ Ürünler Alınıyor</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      Asistanınız <strong className="text-foreground">{order.partner_name || 'Mağaza'}</strong> noktasından seçtiğiniz ürünleri tedarik ediyor.
                                    </p>
                                  </div>
                                )}

                                {isDelivering && (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sky-700 font-bold text-xs">
                                      <Truck className="w-4 h-4 text-sky-600" />
                                      <span>🛵 Teslimata Çıktı</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      Asistanınız siparişinizi teslim etmek üzere verdiğiniz konuma doğru yola çıktı.
                                    </p>
                                  </div>
                                )}

                                {isCompleted && (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                      <span>✅ Teslim Edildi</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      Siparişiniz başarıyla teslim edilmiştir. UĞRA'yı tercih ettiğiniz için teşekkür ederiz!
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}

                  {/* TAB 3: HESAP BİLGİLERİM */}
                  {activeTab === 'hesap_bilgilerim' && (
                    <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg mx-auto">
                      <div className="pb-2 border-b border-border">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
                          Müşteri Profil Bilgileriniz
                        </span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground block">Ad Soyad</label>
                        <input
                          type="text"
                          required
                          placeholder="Adınız Soyadınız"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground/50 transition-all font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground block">Telefon Numarası</label>
                        <input
                          type="tel"
                          required
                          placeholder="05xx xxx xx xx"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground/50 transition-all font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground block">E-posta Adresi</label>
                        <input
                          type="email"
                          disabled
                          value={user?.email || ''}
                          className="w-full bg-background/50 border border-border/60 outline-none rounded-xl p-3 text-xs text-muted-foreground cursor-not-allowed font-medium"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            <span>Konumum</span>
                          </label>
                          <button
                            type="button"
                            onClick={handleGetCurrentLocation}
                            disabled={gettingLocation}
                            className="text-[11px] font-semibold text-primary hover:text-primary/90 flex items-center gap-1 cursor-pointer transition-colors bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg border border-primary/20"
                          >
                            {gettingLocation ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Konum Alınıyor...</span>
                              </>
                            ) : (
                              <>
                                <MapPin className="w-3 h-3" />
                                <span>Mevcut Konumumu Al</span>
                              </>
                            )}
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          placeholder="Konumunuz / Açık adresiniz..."
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground/50 transition-all resize-none font-medium"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Taleplerinizde asistanın size ulaşacağı varsayılan konumunuz olarak kullanılır.
                        </p>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={savingProfile}
                          className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 border-0 shadow-md shadow-primary/20"
                        >
                          {savingProfile ? (
                            <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" />
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Bilgilerimi Güncelle</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Confirm Delete Order Modal */}
                <AnimatePresence>
                  {orderToDelete && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="bg-card border border-border rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl"
                      >
                        <div className="flex items-center gap-3 text-red-600">
                          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <Trash2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-foreground">Talebi Sil</h4>
                            <p className="text-xs text-muted-foreground">Bu işlem geri alınamaz.</p>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          <strong className="text-foreground">#UG-{orderToDelete.id.slice(0, 8).toUpperCase()}</strong> kodlu talebinizi silmek istediğinizden emin misiniz?
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setOrderToDelete(null)}
                            disabled={Boolean(deletingOrderId)}
                            className="px-4 py-2 rounded-xl bg-background hover:bg-muted border border-border text-xs font-semibold text-foreground transition-colors cursor-pointer"
                          >
                            İptal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(orderToDelete)}
                            disabled={Boolean(deletingOrderId)}
                            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-600/20"
                          >
                            {deletingOrderId ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Siliniyor...</span>
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Evet, Sil</span>
                              </>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* Confirm Delete Notification Modal */}
                <AnimatePresence>
                  {notifToDelete && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="bg-card border border-border rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl"
                      >
                        <div className="flex items-center gap-3 text-red-600">
                          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <Trash2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-foreground">Bildirimi Sil</h4>
                            <p className="text-xs text-muted-foreground">Gelen kutunuzdan kaldırılacaktır.</p>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Seçilen bildirimi gelen kutunuzdan silmek istediğinizden emin misiniz?
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setNotifToDelete(null)}
                            disabled={Boolean(deletingNotifId)}
                            className="px-4 py-2 rounded-xl bg-background hover:bg-muted border border-border text-xs font-semibold text-foreground transition-colors cursor-pointer"
                          >
                            İptal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNotification(notifToDelete)}
                            disabled={Boolean(deletingNotifId)}
                            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-600/20"
                          >
                            {deletingNotifId ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Siliniyor...</span>
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Evet, Sil</span>
                              </>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )
    : null;
}
