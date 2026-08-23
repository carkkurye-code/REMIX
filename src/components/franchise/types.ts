import { Assistant, Order, Franchise, City, AssistantSubscription, FranchiseSupportTicket } from '@/lib/supabase';

export type TabType = 'overview' | 'assistants' | 'requests' | 'finance' | 'settings' | 'support';
export type TimePeriod = 'today' | 'week' | 'month' | 'custom' | 'all';

export interface FranchiseKPIs {
  totalCouriers: number;
  activeCouriersCount: number;
  onlineCouriers: number;
  pendingApplications: number;
  totalOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalVolume: number;
  completedVolume: number;
  revenueSharePct: number;
  franchiseEarnings: number;
  completedEarnings: number;
  totalSubRevenue: number;
  openTicketsCount: number;
}
