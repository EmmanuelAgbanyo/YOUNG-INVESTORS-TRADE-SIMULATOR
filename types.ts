import type React from 'react';

export enum TradeType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  TRAILING_STOP = 'TRAILING_STOP',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  WORKING = 'WORKING',
  EXECUTED = 'EXECUTED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export interface OHLC {
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  lastPrice?: number;
  priceHistory: OHLC[];
  volatility: number;
  trend: number;
}

export interface ToastMessage {
  type: 'success' | 'error' | 'info';
  text: string;
}

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';
export type AuthRole = 'SUPER_ADMIN' | 'SUPERVISOR' | 'SUPPORT' | 'ANALYST';
export type StaffRole = AuthRole | 'ADMIN';
export type Permission =
  | 'overview.read'
  | 'users.read'
  | 'users.manage'
  | 'portfolios.read'
  | 'market.manage'
  | 'competitions.manage'
  | 'support.read'
  | 'support.reply'
  | 'staff.read'
  | 'staff.manage'
  | 'settings.manage'
  | 'audit.read';

export interface AuthClaims {
  role: AuthRole;
  permissions: Permission[];
  claimsVersion?: number;
}
export type StaffStatus = 'INVITED' | 'ACTIVE' | 'SUSPENDED';
export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'RESOLVED' | 'CLOSED';
export type SupportTicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type CompetitionStatus = 'DRAFT' | 'INVITE_ONLY' | 'OPEN' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type CompetitionVisibility = 'PRIVATE' | 'PUBLIC';
export type CompetitionScoring = 'TOTAL_RETURN' | 'NET_WORTH';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  createdAt: number;
  password?: string;
  teamId?: string;
  isTeamLeader?: boolean;
  isDisqualified?: boolean;
  accountStatus?: AccountStatus;
}

export interface Team {
  id:string;
  name: string;
  leaderId: string;
  memberIds: string[];
}

export interface TeamInvite {
  code: string;
  teamId: string;
  createdAt: number;
}

export interface SupportMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'USER' | 'STAFF' | 'ADMIN';
  text: string;
  createdAt: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: 'ACCOUNT' | 'TRADING' | 'PORTFOLIO' | 'TECHNICAL' | 'OTHER';
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  assignedTo?: string;
  assignedName?: string;
  createdAt: number;
  updatedAt: number;
  messages: SupportMessage[];
}

export interface StaffMember {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  status: StaffStatus;
  permissions: string[];
  invitedAt: number;
  lastActiveAt?: number;
}

export interface Competition {
  id: string;
  name: string;
  description: string;
  status: CompetitionStatus;
  visibility: CompetitionVisibility;
  scoring: CompetitionScoring;
  startAt: number;
  endAt: number;
  entryCapital: number;
  maxParticipants: number;
  inviteCode: string;
  createdBy: string;
  createdAt: number;
  participantIds: string[];
}

export interface CompetitionInvite {
  id: string;
  competitionId: string;
  inviteCode: string;
  email?: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  createdAt: number;
  acceptedBy?: string;
  acceptedAt?: number;
}

export interface Holding {
  symbol: string;
  quantity: number;
  avgCost: number;
}

export interface UnsettledCashItem {
  amount: number;
  settlesAt: number;
}

export interface Portfolio {
  cash: number;
  unsettledCash: UnsettledCashItem[];
  holdings: { [symbol: string]: Holding };
}

export interface TradeOrder {
  symbol: string;
  quantity: number;
  tradeType: TradeType;
  orderType: OrderType;
  limitPrice?: number;
  trailPercent?: number;
}

export interface ActiveOrder extends TradeOrder {
  id: string;
  name: string;
  status: OrderStatus.PENDING | OrderStatus.WORKING;
  createdAt: number;
  submittedAt: number;
  traderId: string;
  traderName: string;
  highWaterMark?: number;
  triggerPrice?: number;
}

export interface OrderHistoryItem {
  id: string;
  symbol: string;
  name: string;
  tradeType: TradeType;
  orderType: OrderType;
  quantity: number;
  finalStatus: OrderStatus.EXECUTED | OrderStatus.CANCELLED | OrderStatus.EXPIRED;
  timestamp: number;
  price?: number;
  total?: number;
  traderId: string;
  traderName: string;
}

export interface PerformanceHistoryEntry {
  timestamp: number;
  portfolioValue: number;
}

export interface ProfileState {
  portfolio: Portfolio;
  activeOrders: ActiveOrder[];
  orderHistory: OrderHistoryItem[];
  performanceHistory: PerformanceHistoryEntry[];
}

export interface NewsHeadline {
  symbol: string;
  headline: string;
  impact: 'positive' | 'negative' | 'neutral';
}

export type MarketSentiment = 'Bullish' | 'Bearish' | 'Neutral';

export type MarketControlMode = 'AUTO' | 'MANUAL';
export type MarketStatus = 'PRE_MARKET' | 'OPEN' | 'CLOSED' | 'HALTED';

export interface MarketEvent {
    title: string;
    description: string;
    driftModifier: number;
    volatilityModifier: number;
    duration: number;
    expiresAt: number;
}

export interface AdminSettings {
    startingCapital: number;
    settlementCycle: 'T+1' | 'T+2' | 'T+3';
    baseDrift: number;
    baseVolatility: number;
    eventFrequency: number;
    marketDurationMinutes: number;
    circuitBreakerEnabled: boolean;
    circuitBreakerThreshold: number;
    circuitBreakerHaltSeconds: number;
    simulationSpeed: 'Slow' | 'Normal' | 'Fast';
    interestRate: number;
    commissionFee: number;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
}

export interface Lesson {
  id: string;
  title: string;
  content: React.ReactNode;
  videoId?: string;
  quiz?: QuizQuestion[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface AcademyProgress {
  [lessonId: string]: {
    completed: boolean;
    score?: number;
  };
}