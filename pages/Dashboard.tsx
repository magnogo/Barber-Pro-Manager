
import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { analyzeDailyPerformance } from '../services/geminiService';
import { 
  Sparkles, TrendingUp, Calendar, Clock, DollarSign, 
  Loader2, Users, Target, CalendarDays, Wallet, 
  ArrowUpRight, BarChart3, PieChart, RefreshCw, CheckCircle2 
} from 'lucide-react';

export const Dashboard = () => {
  const { currentUser, selectedBarbershop, appointments, services, clients, isAutoSyncing } = useApp();
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  const currentShopId = useMemo(() => {
    const id = selectedBarbershop?.id || currentUser?.barbershopId || '';
    return String(id).trim().toLowerCase();
  }, [currentUser, selectedBarbershop]);

  const normalizeDate = (dateVal: any) => {
    if (!dateVal) return '';
    const str = String(dateVal).trim();
    if (str.includes('T')) return str.split('T')[0];
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return str;
  };

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA');
    
    // Início da semana (Domingo)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfWeekStr = startOfWeek.toLocaleDateString('en-CA');

    // Início do mês
    const startOfMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;

    const shopAppointments = appointments.filter(a => 
      String(a.barbershopId || '').trim().toLowerCase() === currentShopId &&
      a.status !== 'CANCELLED'
    );

    const calcMetrics = (apts: typeof appointments) => {
      let realized = 0;
      let projected = 0;
      const uniqueClients = new Set();

      apts.forEach(apt => {
        const service = services.find(s => String(s.id).trim().toLowerCase() === String(apt.serviceId).trim().toLowerCase());
        const price = service ? parseFloat(String(service.price || 0).replace(',', '.')) : 0;
        const status = String(apt.status || '').toUpperCase();
        
        projected += price;
        if (['CONFIRMED', 'COMPLETED', 'IN_PROGRESS', 'CONFIRMADO', 'CONCLUIDO'].includes(status)) {
          realized += price;
        }
        if (apt.clientId) uniqueClients.add(apt.clientId);
      });

      return { realized, projected, clientsCount: uniqueClients.size, total: apts.length };
    };

    const daily = calcMetrics(shopAppointments.filter(a => normalizeDate(a.date) === todayStr));
    const weekly = calcMetrics(shopAppointments.filter(a => normalizeDate(a.date) >= startOfWeekStr));
    const monthly = calcMetrics(shopAppointments.filter(a => normalizeDate(a.date) >= startOfMonthStr));

    // Dados para o Gráfico (Últimos 7 dias)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toLocaleDateString('en-CA');
      const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      const count = shopAppointments.filter(a => normalizeDate(a.date) === dStr).length;
      last7Days.push({ name: dayName.charAt(0).toUpperCase() + dayName.slice(1), apps: count, fullDate: dStr });
    }

    return {
      daily,
      weekly,
      monthly,
      chartData: last7Days,
      hasData: shopAppointments.length > 0,
      todaysAppointments: shopAppointments.filter(a => normalizeDate(a.date) === todayStr)
    };
  }, [appointments, services, currentShopId]);

  useEffect(() => {
    const fetchInsight = async () => {
      if (!stats.hasData) return;
      setLoadingAi(true);
      try {
        const topServices = services
          .filter(s => String(s.barbershopId).trim().toLowerCase() === currentShopId)
          .slice(0, 3).map(s => s.name);
        const text = await analyzeDailyPerformance(stats.daily.total, stats.daily.realized, topServices);
        setAiInsight(text);
      } catch (e) {
        setAiInsight("Foque na retenção de clientes esta semana para aumentar o faturamento previsto!");
      } finally {
        setLoadingAi(false);
      }
    };
    fetchInsight();
  }, [currentShopId, stats.daily, services]);

  const KpiCard = ({ title, realized, projected, clients, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col group hover:shadow-xl transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${color} bg-opacity-10 transition-transform group-hover:scale-110`}>
          <Icon className={color.replace('bg-', 'text-')} size={24} />
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{title}</span>
          <div className="flex items-center gap-1 text-emerald-500">
            <TrendingUp size={12} />
            <span className="text-[10px] font-bold">Performance Ativa</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase">Realizado</p>
          <h4 className="text-2xl font-black text-gray-900 tracking-tighter">
            R$ {realized.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h4>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase">Previsto</p>
            <p className="text-sm font-black text-blue-600">R$ {projected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase">Clientes</p>
            <p className="text-sm font-black text-gray-700">{clients} únicos</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Barra de Sincronização */}
      {isAutoSyncing && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl animate-bounce">
          {/* Fix: Added RefreshCw to the imports above */}
          <RefreshCw size={14} className="animate-spin" /> Atualizando Base de Dados...
        </div>
      )}

      {/* Banner AI */}
      <div className="bg-gradient-to-br from-black via-zinc-900 to-zinc-950 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden border border-zinc-800">
        <div className="absolute -right-10 -top-10 opacity-10 rotate-12">
          <Sparkles size={250} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 bg-blue-500/10 backdrop-blur-3xl rounded-[2rem] flex items-center justify-center border border-blue-500/20 shrink-0 shadow-inner">
            <Target size={40} className="text-blue-400 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
               <h3 className="font-black text-2xl tracking-tight">Análise Estratégica da Unidade</h3>
               <span className="px-3 py-1 bg-blue-600 text-[9px] font-black uppercase tracking-[0.2em] rounded-full">Inteligência Artificial</span>
            </div>
            <p className="text-gray-300 text-xl font-medium leading-relaxed italic max-w-4xl">
              {loadingAi ? "Processando métricas e tendências..." : aiInsight || "Seja bem-vindo! Estamos consolidando os dados da sua rede para gerar novos insights."}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Grid Analítico */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard 
          title="Resultados de Hoje" 
          realized={stats.daily.realized} 
          projected={stats.daily.projected} 
          clients={stats.daily.clientsCount}
          icon={Calendar} 
          color="bg-blue-500"
        />
        <KpiCard 
          title="Esta Semana" 
          realized={stats.weekly.realized} 
          projected={stats.weekly.projected} 
          clients={stats.weekly.clientsCount}
          icon={CalendarDays} 
          color="bg-indigo-500"
        />
        <KpiCard 
          title="Fechamento Mensal" 
          realized={stats.monthly.realized} 
          projected={stats.monthly.projected} 
          clients={stats.monthly.clientsCount}
          icon={BarChart3} 
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Volume Real */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="font-black text-gray-800 text-xl tracking-tight flex items-center gap-3">
                <TrendingUp size={24} className="text-blue-600" /> Fluxo de Atendimentos
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Volume de agendamentos nos últimos 7 dias</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-2 h-2 rounded-full bg-blue-600"></div>
              <span className="text-[10px] font-black text-gray-600 uppercase">Dados em Tempo Real</span>
            </div>
          </div>
          <div className="h-80 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 11, fontWeight: 800, fill: '#64748b'}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 11, fontWeight: 800, fill: '#64748b'}} 
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px'}}
                  labelStyle={{fontWeight: '900', color: '#1e293b', marginBottom: '4px'}}
                />
                <Bar dataKey="apps" radius={[10, 10, 0, 0]} barSize={45}>
                  {stats.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 6 ? '#2563eb' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Próximos Clientes e Agenda do Dia */}
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col max-h-[500px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-gray-800 text-xl tracking-tight">Agenda de Hoje</h3>
            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black">{stats.daily.total} Horários</span>
          </div>
          
          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
            {stats.todaysAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
                <CalendarDays size={64} className="mb-4" />
                <p className="font-black uppercase tracking-widest text-xs">Sem atividades hoje</p>
              </div>
            ) : (
              stats.todaysAppointments
                .sort((a, b) => a.time.localeCompare(b.time))
                .map(apt => {
                  const sId = String(apt.serviceId || '').trim().toLowerCase();
                  const cId = String(apt.clientId || '').trim().toLowerCase();
                  const service = services.find(s => String(s.id).trim().toLowerCase() === sId);
                  const client = clients.find(c => String(c.id).trim().toLowerCase() === cId);
                  const isCompleted = ['COMPLETED', 'CONCLUIDO'].includes(String(apt.status).toUpperCase());
                  const isInProgress = String(apt.status).toUpperCase() === 'IN_PROGRESS';
                  
                  return (
                    <div key={apt.id} className={`flex items-center justify-between p-4 rounded-3xl border transition-all ${
                      isInProgress ? 'bg-blue-50 border-blue-100 shadow-md scale-[1.02]' : 'bg-gray-50/50 border-gray-100'
                    }`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black text-xs shadow-sm ${
                          isInProgress ? 'bg-blue-600 text-white' : 'bg-white text-gray-400'
                        }`}>
                          {apt.time}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-black text-gray-900 text-sm truncate max-w-[130px]">{client?.name || 'Cliente'}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                             <div className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : isInProgress ? 'bg-blue-500 animate-pulse' : 'bg-amber-500'}`}></div>
                             <p className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[110px]">{service?.name || 'Serviço'}</p>
                          </div>
                        </div>
                      </div>
                      <div className={`p-2 rounded-xl ${isCompleted ? 'text-emerald-500 bg-emerald-50' : isInProgress ? 'text-blue-600 bg-blue-100' : 'text-gray-300'}`}>
                         {/* Fix: Added CheckCircle2 to the imports above */}
                         {isCompleted ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
          
          <button className="mt-8 w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl">
             Ver Agenda Completa
          </button>
        </div>
      </div>
    </div>
  );
};
