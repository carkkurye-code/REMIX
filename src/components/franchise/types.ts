import { Assistant, Order, Partner, Franchise, City, AssistantSubscription, FranchiseSupportTicket } from '@/lib/supabase';

export type TabType = 'overview' | 'partners' | 'finance' | 'reports' | 'settings' | 'support';
export type TimePeriod = 'today' | 'week' | 'month' | 'custom' | 'all';

export interface FranchiseKPIs {
  totalPartners: number;
  activePartners: number;
  totalOrders: number;
  pendingOrders?: number;
  inProgressOrders?: number;
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

