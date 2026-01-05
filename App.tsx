
import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { LandingPage } from './pages/LandingPage';
import { SuperAdmin } from './pages/SuperAdmin';
import { Dashboard } from './pages/Dashboard';
import { Schedule } from './pages/Schedule';
import { WhatsAppConfigPage } from './pages/WhatsAppConfig';
import { ServicesPage, CustomersPage } from './pages/ServicesAndClients';
import { StaffManagement } from './pages/StaffManagement';
import { TvDashboard } from './pages/TvDashboard';
import { DatabaseConfig } from './pages/DatabaseConfig';
import { Reports } from './pages/Reports';
import { ClientBooking } from './pages/ClientBooking';
import { Loader2 } from 'lucide-react';
import { LOGO_URL } from './constants';

const MainContent = () => {
  const { view, currentUser, loading, setView, barbershops, setSelectedBarbershop } = useApp();

  // Detectar link público de agendamento (?shop=ID)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shopId = params.get('shop');
    
    if (shopId && barbershops.length > 0) {
      const shop = barbershops.find(s => s.id === shopId);
      if (shop) {
        setSelectedBarbershop(shop);
        setView('CLIENT_BOOKING');
      }
    }
  }, [barbershops, setView, setSelectedBarbershop]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-black text-white">
        <div className="w-96 h-48 mb-8 animate-pulse flex items-center justify-center">
           <img src={LOGO_URL} alt="Barber Pro Manager" className="w-full h-full object-contain" />
        </div>
        <Loader2 size={32} className="animate-spin mb-6 text-blue-500" />
        <div className="flex flex-col items-center gap-1.5">
           <p className="font-black uppercase tracking-[0.4em] text-[10px] text-zinc-600">Barber Pro Manager</p>
           <p className="font-bold text-zinc-300 text-xs tracking-wide">Sincronizando infraestrutura...</p>
        </div>
        {/* Decorative elements to match the UI style */}
        <div className="fixed bottom-10 left-10 w-64 h-64 bg-blue-600/5 rounded-full blur-[100px] -z-10"></div>
        <div className="fixed top-10 right-10 w-64 h-64 bg-indigo-600/5 rounded-full blur-[100px] -z-10"></div>
      </div>
    );
  }

  // Se for acesso via link de agendamento sem login
  if (!currentUser && view === 'CLIENT_BOOKING') {
    return <ClientBooking isPublic />;
  }

  // Se não houver usuário e a view for MARKETING, mostra a landing page
  if (!currentUser && view === 'MARKETING') return <LandingPage />;
  
  if (view === 'LOGIN' || !currentUser) return <Login />;

  return (
    <Layout>
      {view === 'SUPER_ADMIN' && <SuperAdmin />}
      {view === 'DASHBOARD' && <Dashboard />}
      {view === 'SCHEDULE' && <Schedule />}
      {view === 'TV_DASHBOARD' && <TvDashboard />}
      {view === 'WHATSAPP' && <WhatsAppConfigPage />}
      {view === 'DATABASE_CONFIG' && <DatabaseConfig />}
      {view === 'SERVICES' && <ServicesPage />}
      {view === 'CUSTOMERS' && <CustomersPage />}
      {view === 'STAFF' && <StaffManagement />}
      {view === 'REPORTS' && <Reports />}
      {view === 'CLIENT_BOOKING' && <ClientBooking />}
    </Layout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
