
import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Role, ViewState } from '../types';
import { LOGO_URL } from '../constants';
import { 
  LayoutDashboard, 
  Calendar, 
  Scissors, 
  Users, 
  MessageCircle, 
  LogOut, 
  Building2,
  PieChart,
  MonitorPlay,
  Database,
  UserCircle,
  ArrowLeft,
  Store,
  ShieldCheck,
  LayoutGrid,
  ExternalLink,
  Wifi,
  RefreshCw
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, selectedBarbershop, setSelectedBarbershop, logout, setView, view, isAutoSyncing } = useApp();

  if (!currentUser) return <>{children}</>;

  const isTvMode = (view as any) === 'TV_DASHBOARD';

  const NavItem = ({ icon: Icon, label, targetView, active }: { icon: any, label: string, targetView: ViewState, active: boolean }) => (
    <button
      onClick={() => setView(targetView)}
      className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200 group relative ${
        active 
          ? 'bg-blue-600 text-white shadow-lg nav-active-glow scale-[1.02]' 
          : 'text-gray-400 hover:bg-zinc-900 hover:text-white'
      }`}
    >
      <Icon size={20} className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
      <span className={`font-semibold text-sm ${active ? 'translate-x-1' : 'group-hover:translate-x-1'} transition-transform`}>{label}</span>
      {active && (
        <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
      )}
    </button>
  );

  const getRoleLabel = (role: Role) => {
      switch(role) {
          case Role.SUPER_ADMIN: return 'Administrador Geral';
          case Role.BARBERSHOP_ADMIN: return 'Gerente da Unidade';
          case Role.BARBER: return 'Barbeiro Profissional';
          default: return 'Usuário';
      }
  }

  const getViewLabel = (view: string) => {
      const labels: Record<string, string> = {
          'SUPER_ADMIN': 'Rede de Barbearias',
          'DASHBOARD': 'Visão Geral',
          'SCHEDULE': 'Controle de Agenda',
          'TV_DASHBOARD': 'Painel de TV',
          'CUSTOMERS': 'Gestão de Clientes',
          'SERVICES': 'Configuração de Serviços',
          'STAFF': 'Gestão de Equipe',
          'WHATSAPP': 'Automação WhatsApp',
          'REPORTS': 'Business Intelligence',
          'DATABASE_CONFIG': 'Integração com o banco de dados',
          'CLIENT_BOOKING': 'Link de Agendamento'
      };
      return labels[view] || view;
  }

  const displayLogo = selectedBarbershop ? selectedBarbershop.logo : LOGO_URL;
  const isShopLogo = !!selectedBarbershop;

  const memoizedChildren = useMemo(() => (
    <div key={view} className="animate-page-fade">
      {children}
    </div>
  ), [view, children]);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      {!isTvMode && (
      <aside className="w-68 bg-black text-white flex flex-col shadow-2xl transition-all duration-300 shrink-0 z-50 border-r border-zinc-900">
        <div className="p-8 border-b border-zinc-900 flex flex-col items-center">
          
          <div className={`flex items-center justify-center shrink-0 mb-6 transition-all duration-500 overflow-hidden ${
            isShopLogo 
              ? 'w-32 h-32 bg-zinc-900 rounded-full' 
              : 'w-full h-24'
          }`}>
             <img 
                src={displayLogo || LOGO_URL} 
                alt="Logo" 
                className={`transition-transform hover:scale-105 duration-500 ${
                  isShopLogo ? 'w-full h-full object-cover' : 'max-w-full max-h-full object-contain'
                }`} 
                onError={(e) => {
                  (e.target as any).src = LOGO_URL;
                }}
             />
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
              <ShieldCheck size={12} className="text-blue-400" />
              <span className="text-[10px] text-blue-400 uppercase tracking-widest font-black text-center">
                {getRoleLabel(currentUser.role)}
              </span>
          </div>
        </div>

        <nav className="flex-1 p-5 space-y-2 overflow-y-auto custom-scrollbar">
          {currentUser.role === Role.SUPER_ADMIN && !selectedBarbershop && (
            <div className="space-y-1">
                <div className="px-3 pb-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Painel de Franqueador</div>
                <NavItem 
                icon={Building2} 
                label="Unidades da Rede" 
                targetView="SUPER_ADMIN" 
                active={view === 'SUPER_ADMIN'} 
                />
            </div>
          )}

          {(selectedBarbershop || currentUser.role !== Role.SUPER_ADMIN) && (
            <>
              {currentUser.role === Role.SUPER_ADMIN && (
                  <button 
                    onClick={() => { setSelectedBarbershop(null); setView('SUPER_ADMIN'); }}
                    className="flex items-center space-x-3 w-full p-3 rounded-xl text-orange-400 bg-orange-400/10 hover:bg-orange-400/20 mb-6 transition-all border border-orange-400/20 group"
                  >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-black text-xs uppercase tracking-widest">Sair da Unidade</span>
                  </button>
              )}
              
              <div className="px-3 pb-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Operação</div>
              <NavItem icon={LayoutDashboard} label="Dashboard" targetView="DASHBOARD" active={view === 'DASHBOARD'} />
              <NavItem icon={Calendar} label="Agenda" targetView="SCHEDULE" active={view === 'SCHEDULE'} />
              <NavItem icon={ExternalLink} label="Link Agendamento" targetView="CLIENT_BOOKING" active={view === 'CLIENT_BOOKING'} />
              <NavItem icon={MonitorPlay} label="Modo TV" targetView="TV_DASHBOARD" active={view === 'TV_DASHBOARD'} />
              <NavItem icon={Users} label="Clientes" targetView="CUSTOMERS" active={view === 'CUSTOMERS'} />
              
              <div className="pt-6 px-3 pb-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Gestão & BI</div>
              <NavItem icon={Scissors} label="Serviços" targetView="SERVICES" active={view === 'SERVICES'} />
              <NavItem icon={UserCircle} label="Profissionais" targetView="STAFF" active={view === 'STAFF'} />
              <NavItem icon={PieChart} label="Relatórios" targetView="REPORTS" active={view === 'REPORTS'} />
              
              <div className="pt-6 px-3 pb-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Configuração</div>
              <NavItem icon={MessageCircle} label="WhatsApp" targetView="WHATSAPP" active={view === 'WHATSAPP'} />
              <NavItem icon={Database} label="Banco de Dados" targetView="DATABASE_CONFIG" active={view === 'DATABASE_CONFIG'} />
            </>
          )}
        </nav>

        <div className="p-6 border-t border-zinc-900">
          <div className="flex items-center space-x-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-sm font-black border border-blue-400 shadow-lg">
              {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-gray-100">{currentUser.name}</p>
              <p className="text-[10px] text-zinc-500 truncate font-medium">{currentUser.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center space-x-2 w-full p-3 text-red-400 bg-red-400/10 hover:bg-red-500 hover:text-white rounded-xl transition-all font-bold text-sm"
          >
            <LogOut size={18} />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>
      )}

      <main className={`flex-1 overflow-y-auto ${isTvMode ? 'bg-[#1a1d21]' : 'bg-gray-50'}`}>
        {!isTvMode && (
          <header className="bg-white/80 backdrop-blur-md shadow-sm p-5 sticky top-0 z-40 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-5">
                  <h2 className="text-xl font-black text-gray-800 tracking-tight">
                    {getViewLabel(view)}
                  </h2>
                  {selectedBarbershop && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2.5 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-700 shadow-sm">
                          <Store size={16}/>
                          <span className="text-xs font-black uppercase tracking-widest">{selectedBarbershop.name}</span>
                      </div>
                      
                      {/* Indicador de Status de Conexão Automático */}
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 ${
                        isAutoSyncing 
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-600' 
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                      }`}>
                        {isAutoSyncing ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <Wifi size={12} className="animate-pulse" />
                        )}
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          {isAutoSyncing ? 'Sincronizando...' : 'Conectado'}
                        </span>
                      </div>
                    </div>
                  )}
                  {currentUser.role === Role.SUPER_ADMIN && !selectedBarbershop && (
                      <div className="flex items-center gap-2.5 px-4 py-1.5 bg-gray-900 border border-gray-800 rounded-2xl text-white shadow-xl">
                          <LayoutGrid size={16}/>
                          <span className="text-[10px] font-black uppercase tracking-widest">Painel da Rede</span>
                      </div>
                  )}
              </div>
              <div className="flex items-center space-x-4">
                <button className="w-10 h-10 flex items-center justify-center text-gray-500 bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-md rounded-xl relative transition-all">
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                  🔔
                </button>
              </div>
            </div>
          </header>
        )}
        
        <div className={isTvMode ? 'p-0 h-screen' : 'p-8'}>
          {memoizedChildren}
        </div>
      </main>
    </div>
  );
};
