
import React, { useState } from 'react';
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
  UserCircle,
  ArrowLeft,
  Store,
  ShieldCheck,
  ExternalLink,
  Wifi,
  RefreshCw,
  Bell,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, selectedBarbershop, setSelectedBarbershop, logout, setView, view, isAutoSyncing } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!currentUser) return <>{children}</>;

  const isTvMode = (view as any) === 'TV_DASHBOARD';

  // LOGICA: Se estiver na view SUPER_ADMIN, mostra sempre o LOGO_URL do sistema.
  // Caso contrário, tenta mostrar o logo da barbearia selecionada.
  const isUnitView = view !== 'SUPER_ADMIN';
  const displayLogo = view === 'SUPER_ADMIN' ? LOGO_URL : (selectedBarbershop?.logo || LOGO_URL);

  const NavItem = ({ icon: Icon, label, targetView, active }: { icon: any, label: string, targetView: ViewState, active: boolean }) => (
    <button
      onClick={() => setView(targetView)}
      title={isCollapsed ? label : ""}
      className={`flex items-center space-x-3 w-full p-4 rounded-2xl transition-all duration-300 group relative ${
        active 
          ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 scale-[1.02]' 
          : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-white'
      } ${isCollapsed ? 'justify-center space-x-0' : ''}`}
    >
      <Icon size={20} className={`${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform shrink-0`} />
      {!isCollapsed && <span className="font-bold text-sm tracking-tight truncate">{label}</span>}
    </button>
  );

  const getRoleLabel = (role: Role) => {
      switch(role) {
          case Role.SUPER_ADMIN: return 'Rede Master';
          case Role.BARBERSHOP_ADMIN: return 'Gestor';
          case Role.BARBER: return 'Profissional';
          default: return 'Usuário';
      }
  }

  const getViewTitle = (v: ViewState) => {
    if (v === 'STAFF') return 'Equipe';
    if (v === 'WHATSAPP') return 'Automação WhatsApp';
    if (v === 'DATABASE_CONFIG') return 'Infraestrutura';
    if (v === 'CLIENT_BOOKING') return 'Agendamento Público';
    if (v === 'SUPER_ADMIN') return 'Gestão da Rede Master';
    if (v === 'SERVICES') return 'SERVIÇOS';
    return v.replace('_', ' ');
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans">
      {!isTvMode && (
      <aside className={`${isCollapsed ? 'w-24' : 'w-72'} bg-black flex flex-col shrink-0 z-50 border-r border-zinc-900 shadow-2xl shadow-black transition-all duration-300 relative`}>
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-10 bg-blue-600 text-white rounded-full p-1 shadow-lg z-50 hover:bg-blue-500 transition-colors border border-blue-400/20"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="p-6 flex flex-col items-center">
          {/* Logo Circle Container */}
          <div className={`
            ${isCollapsed ? 'w-12 h-12' : 'w-28 h-28'} 
            ${isUnitView ? 'rounded-full border-2 border-zinc-800 bg-zinc-900 shadow-2xl' : 'w-full h-24'} 
            mb-6 flex items-center justify-center transition-all duration-300 overflow-hidden group
          `}>
             <img 
               src={displayLogo} 
               alt="Logo" 
               className={`
                ${isUnitView ? 'w-full h-full object-cover' : 'w-full h-full object-contain filter drop-shadow-lg'}
                transition-transform group-hover:scale-110 duration-500
               `} 
             />
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900 rounded-full border border-zinc-800 animate-in fade-in duration-300">
                <ShieldCheck size={14} className="text-blue-500" />
                <span className="text-[10px] text-zinc-300 uppercase tracking-widest font-black">
                  {getRoleLabel(currentUser.role)}
                </span>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {currentUser.role === Role.SUPER_ADMIN && (
            <div className="pb-4">
                {!isCollapsed && <p className="px-4 pb-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Painel Administrativo</p>}
                <NavItem icon={Building2} label="Unidades da Rede" targetView="SUPER_ADMIN" active={view === 'SUPER_ADMIN'} />
            </div>
          )}

          {(selectedBarbershop || currentUser.role !== Role.SUPER_ADMIN) && view !== 'SUPER_ADMIN' && (
            <div className="space-y-1">
              {currentUser.role === Role.SUPER_ADMIN && (
                  <button 
                    onClick={() => { setSelectedBarbershop(null); setView('SUPER_ADMIN'); }}
                    title={isCollapsed ? "Sair da Unidade" : ""}
                    className={`flex items-center space-x-3 w-full p-4 rounded-2xl text-orange-400 bg-orange-400/10 hover:bg-orange-400/20 mb-6 transition-all border border-orange-400/20 font-black text-xs uppercase tracking-widest ${isCollapsed ? 'justify-center space-x-0' : ''}`}
                  >
                    <ArrowLeft size={18} className="shrink-0" />
                    {!isCollapsed && <span className="truncate">Sair da Unidade</span>}
                  </button>
              )}
              
              {!isCollapsed && <p className="px-4 pb-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Operação</p>}
              <NavItem icon={LayoutDashboard} label="Dashboard" targetView="DASHBOARD" active={view === 'DASHBOARD'} />
              <NavItem icon={Calendar} label="Agenda" targetView="SCHEDULE" active={view === 'SCHEDULE'} />
              <NavItem icon={MonitorPlay} label="Modo TV" targetView="TV_DASHBOARD" active={view === 'TV_DASHBOARD'} />
              <NavItem icon={Users} label="Clientes" targetView="CUSTOMERS" active={view === 'CUSTOMERS'} />
              
              {!isCollapsed && <p className="px-4 pt-6 pb-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Gestão</p>}
              <NavItem icon={Scissors} label="Serviços" targetView="SERVICES" active={view === 'SERVICES'} />
              <NavItem icon={UserCircle} label="Equipe" targetView="STAFF" active={view === 'STAFF'} />
              <NavItem icon={PieChart} label="Relatórios" targetView="REPORTS" active={view === 'REPORTS'} />
              
              {!isCollapsed && <p className="px-4 pt-6 pb-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Avançado</p>}
              <NavItem icon={MessageCircle} label="WhatsApp" targetView="WHATSAPP" active={view === 'WHATSAPP'} />
              <NavItem icon={ExternalLink} label="Link Público" targetView="CLIENT_BOOKING" active={view === 'CLIENT_BOOKING'} />
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-zinc-900 bg-black/20">
          <div className={`flex items-center space-x-3 mb-6 px-2 ${isCollapsed ? 'justify-center space-x-0' : ''}`}>
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/20 shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden animate-in fade-in duration-300">
                <p className="text-sm font-black truncate text-white">{currentUser.name}</p>
                <p className="text-[10px] text-zinc-500 truncate font-bold uppercase">{currentUser.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            title={isCollapsed ? "Sair" : ""}
            className={`flex items-center justify-center space-x-2 w-full p-4 text-red-400 bg-red-400/10 hover:bg-red-600 hover:text-white rounded-2xl transition-all font-black text-xs uppercase tracking-widest border border-red-400/20 ${isCollapsed ? 'space-x-0' : ''}`}
          >
            <LogOut size={18} className="shrink-0" />
            {!isCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>
      )}

      <main className={`flex-1 overflow-y-auto bg-black`}>
        {!isTvMode && (
          <header className="bg-black/80 backdrop-blur-xl sticky top-0 z-40 border-b border-zinc-900 px-8 py-4 flex justify-between items-center shadow-2xl">
              <div className="flex items-center gap-4">
                  <h2 className="text-xl font-black text-white tracking-tight uppercase">
                    {getViewTitle(view)}
                  </h2>
                  {selectedBarbershop && view !== 'SUPER_ADMIN' && (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-white rounded-2xl text-black shadow-xl">
                        <Store size={14} className="text-blue-600"/>
                        <span className="text-[10px] font-black uppercase tracking-widest">{selectedBarbershop.name}</span>
                    </div>
                  )}
              </div>
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 ${isAutoSyncing ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                   {isAutoSyncing ? <RefreshCw size={12} className="animate-spin" /> : <Wifi size={12} className="animate-pulse" />}
                   <span className="text-[9px] font-black uppercase tracking-widest">{isAutoSyncing ? 'Sincronizando' : 'Online'}</span>
                </div>
                <button className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-2xl text-zinc-400 transition-all border border-zinc-800">
                  <Bell size={18} />
                </button>
              </div>
          </header>
        )}
        
        <div className={isTvMode ? 'p-0 h-screen' : 'p-8 max-w-7xl mx-auto'}>
          <div key={view} className="animate-slide-up">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
