
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  BARBERSHOP_ADMIN = 'BARBERSHOP_ADMIN',
  BARBER = 'BARBER'
}

export interface User {
  id: string;
  name: string;
  nickname?: string;
  email: string;
  role: Role;
  position?: string; // Função/Cargo
  barbershopId?: string;
  avatar?: string; // Legado
  photo?: string; // Novo campo de foto
  useSchedule?: boolean; // Utiliza agenda
  workDays?: number[]; // [0,1,2,3,4,5,6]
  startTime?: string;
  endTime?: string;
}

export type SubscriptionStatus = 'ACTIVE' | 'LATE' | 'CANCELLED' | 'TRIAL';

export interface Barbershop {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  logo?: string;
  isActive: boolean;
  googleSheetsUrl?: string; // URL da API do Apps Script
  
  plan?: string;
  monthlyFee?: number;
  nextDueDate?: string;
  subscriptionStatus?: SubscriptionStatus;

  whatsappConfig?: WhatsAppConfig;
}

export interface WhatsAppConfig {
  welcomeMessage: string;
  menuOptions: string[];
  confirmationMessage: string;
}

export interface Service {
  id: string;
  barbershopId: string;
  name: string;
  durationMinutes: number;
  price: number;
}

export interface Client {
  id: string;
  barbershopId: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  photo?: string;
  fidelityPlan?: 'NONE' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  memberSince?: string;
}

export interface Appointment {
  id: string;
  barbershopId: string;
  barberId: string;
  clientId: string;
  serviceId: string;
  date: string;
  time: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'IN_PROGRESS';
}

export interface Payment {
  id: string;
  barbershopId: string;
  amount: number;
  date: string;
  status: 'PAID' | 'PENDING' | 'FAILED';
  method: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
}

export type ViewState = 'LOGIN' | 'SUPER_ADMIN' | 'DASHBOARD' | 'SCHEDULE' | 'TV_DASHBOARD' | 'CUSTOMERS' | 'SERVICES' | 'WHATSAPP' | 'REPORTS' | 'DATABASE_CONFIG' | 'STAFF' | 'MARKETING' | 'CLIENT_BOOKING';

export type CalendarViewType = 'day' | 'week' | 'month';
