
import { Role, User, Barbershop, Service, Appointment, Client, Payment } from './types';

// URL DO LOGO ATUALIZADA - VERSÃO FINAL BARBER XPRO
export const LOGO_URL = "https://i.ibb.co/XfrghJNt/Barber-XPro.png";

// Helper de data futura
const nextMonth = new Date();
nextMonth.setMonth(nextMonth.getMonth() + 1);
const dateString = nextMonth.toISOString().split('T')[0];

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

export const MOCK_BARBERSHOPS: Barbershop[] = [
  {
    id: 'shop-1',
    name: 'Barbearia Vintage',
    address: 'Rua Principal, 123, São Paulo',
    phone: '(11) 95555-0101',
    email: 'financeiro@vintage.com',
    logo: 'https://i.pinimg.com/originals/24/00/e9/2400e9929281a8b303426742a78107cd.jpg',
    isActive: true,
    plan: 'Plano Pro',
    monthlyFee: 149.90,
    nextDueDate: dateString,
    subscriptionStatus: 'ACTIVE',
    whatsappConfig: {
      welcomeMessage: "Olá! 👋 Bem-vindo à Barbearia Vintage. Pronto para renovar o visual?",
      menuOptions: ["1. Agendar Corte", "2. Barba", "3. Falar com Atendente"],
      confirmationMessage: "Agendado! Nos vemos dia {date} às {time}. ✂️"
    }
  },
  {
    id: 'shop-2',
    name: 'Estilo Moderno',
    address: 'Av. Tecnologia, 456, Rio de Janeiro',
    phone: '(21) 95555-0202',
    email: 'pagamentos@estilomoderno.com',
    logo: 'https://img.freepik.com/vetores-gratis/design-de-logotipo-de-barbearia-detalhado_23-2148696894.jpg',
    isActive: true,
    plan: 'Plano Enterprise',
    monthlyFee: 299.00,
    nextDueDate: dateString,
    subscriptionStatus: 'LATE', // Atrasado para exemplo
    whatsappConfig: {
      welcomeMessage: "Bem-vindo à Estilo Moderno. Cortes de precisão para o homem moderno.",
      menuOptions: ["Agendar Horário", "Ver Serviços", "Cancelar"],
      confirmationMessage: "Agendamento confirmado. Por favor, chegue 5 minutos antes."
    }
  }
];

export const MOCK_USERS: User[] = [
  { id: 'u-1', name: 'Super Admin', email: 'admin@platform.com', role: Role.SUPER_ADMIN },
  { 
    id: 'u-2', 
    name: 'João Dono', 
    email: 'john@vintage.com', 
    role: Role.BARBERSHOP_ADMIN, 
    barbershopId: 'shop-1',
    avatar: 'https://i.pravatar.cc/150?u=john',
    workDays: [1, 2, 3, 4, 5, 6], // Seg a Sáb
    startTime: '09:00',
    endTime: '19:00'
  },
  { 
    id: 'u-3', 
    name: 'Miguel Barbeiro', 
    email: 'mike@vintage.com', 
    role: Role.BARBER, 
    barbershopId: 'shop-1',
    avatar: 'https://i.pravatar.cc/150?u=mike',
    workDays: [2, 3, 4, 5, 6], // Ter a Sáb
    startTime: '10:00',
    endTime: '20:00'
  },
  { 
    id: 'u-4', 
    name: 'Sara Dona', 
    email: 'sarah@modern.com', 
    role: Role.BARBERSHOP_ADMIN, 
    barbershopId: 'shop-2',
    workDays: [1, 2, 3, 4, 5],
    startTime: '08:00',
    endTime: '17:00'
  },
];

export const MOCK_SERVICES: Service[] = [
  { id: 's-1', barbershopId: 'shop-1', name: 'Corte Clássico', durationMinutes: 45, price: 35 },
  { id: 's-2', barbershopId: 'shop-1', name: 'Barba e Bigode', durationMinutes: 30, price: 20 },
  { id: 's-3', barbershopId: 'shop-2', name: 'Degradê e Estilo', durationMinutes: 60, price: 50 },
];

export const MOCK_CLIENTS: Client[] = [
  { 
      id: 'c-1', 
      barbershopId: 'shop-1', 
      name: 'Alice Cliente', 
      phone: '(11) 99999-9999', 
      email: 'alice@teste.com',
      photo: 'https://i.pravatar.cc/150?u=alice'
  },
  { 
      id: 'c-2', 
      barbershopId: 'shop-1', 
      name: 'Roberto Regular', 
      phone: '(11) 98888-8888',
      photo: 'https://i.pravatar.cc/150?u=roberto'
  },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'a-1',
    barbershopId: 'shop-1',
    barberId: 'u-3',
    clientId: 'c-1',
    serviceId: 's-1',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    status: 'CONFIRMED'
  },
  {
    id: 'a-2',
    barbershopId: 'shop-1',
    barberId: 'u-3',
    clientId: 'c-2',
    serviceId: 's-2',
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    status: 'PENDING'
  }
];

export const MOCK_PAYMENTS: Payment[] = [
  { id: 'p-1', barbershopId: 'shop-1', amount: 149.90, date: today, status: 'PAID', method: 'PIX' },
  { id: 'p-2', barbershopId: 'shop-1', amount: 149.90, date: '2023-11-25', status: 'PAID', method: 'PIX' },
  { id: 'p-3', barbershopId: 'shop-2', amount: 299.00, date: today, status: 'FAILED', method: 'CREDIT_CARD' },
  { id: 'p-4', barbershopId: 'shop-2', amount: 299.00, date: '2023-11-25', status: 'PAID', method: 'CREDIT_CARD' },
];
