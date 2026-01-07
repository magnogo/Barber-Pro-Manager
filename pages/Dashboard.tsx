
import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { analyzeDailyPerformance } from '../services/geminiService';
import { 
  Sparkles, Calendar, Clock, DollarSign, 
  Target, BarChart3, ArrowUpRight, CheckCircle2
} from 'lucide-react';
import { sanitizeTime } from './Schedule';

export const Dashboard = () => {
  const { currentUser, selectedBarbershop, appointments, services, clients } = useApp();
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  const currentShopId = useMemo(() => {
    return String(selectedBarbershop?.id || currentUser?.barbershopId || '').trim().toLowerCase();
  }, [currentUser, selectedBarbershop]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA');
    const shopAppointments = appointments.filter(a => String(a.barbershopId).toLowerCase() === currentShopId && a.status !== 'CANCELLED');

    const calcMetrics = (apts: typeof appointments) => {
      let revenue = 0;
      apts.forEach(apt => {
        const service = services.find(s => s.id === apt.serviceId);
        revenue += service ? Number(service.price || 0) : 0;
      });
      return { revenue, count: apts.length };
    };

    const daily = calcMetrics(shopAppointments.filter(a => a.date === todayStr));
    const monthly = calcMetrics(shopAppointments.filter(a => a.date.startsWith(todayStr.slice(0, 7))));

    const chartData = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toLocaleDateString('en-CA');
        const count = shopAppointments.filter(a => a.date === dStr).length;
        chartData.push({ 
            name: d.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase(),
            count 
        });
    }

    return { 
      daily, 
      monthly, 
      chartData, 
      todaysAppointments: shopAppointments.filter(a => a.date === todayStr).sort((a,b) => sanitizeTime(a.time).localeCompare(sanitizeTime(b.time)))
    };
  }, [appointments, services, currentShopId]);

  useEffect(() => {
    const fetchInsight = async () => {
      setLoadingAi(true);
      try {
        const text = await analyzeDailyPerformance(stats.daily.count, stats.daily.revenue, ["Corte", "Barba"]);
        setAiInsight(text);
      } catch (e) {
        setAiInsight("Maximize o faturamento com promoções de fim de semana!");
      } finally {
        setLoadingAi(false);
      }
    };
    fetchInsight();
  }, [stats.daily]);

  const KpiCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-black p-8 rounded-[2.5rem] border border-zinc-900 flex flex-col group hover:border-zinc-700 transition-all duration-300 shadow-2xl">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl ${color} bg-opacity-20 text-white group-hover:scale-110 transition-transform`}>
          <Icon size={24} />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{title}</p>
          <div className="flex items-center justify-end gap-1 text-emerald-400 mt-1">
            <ArrowUpRight size={12} />
            <span className="text-[10px] font-black">{trend}</span>
          </div>
        </div>
      </div>
      <h4 className="text-3xl font-black text-white tracking-tighter">
        {typeof value === 'number' ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : value}
      </h4>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Banner AI Elite */}
      <div className="bg-blue-600 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-20 pointer-events-none">
          <Sparkles size={180} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center backdrop-blur-md shrink-0">
            <Target size={40} className="text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-black tracking-tight">Estratégia do Dia</h3>
                <span className="px-3 py-1 bg-white/10 text-white border border-white/20 text-[9px] font-black uppercase tracking-widest rounded-full">Inteligência Artificial</span>
            </div>
            <p className="text-blue-50 text-lg font-medium leading-relaxed max-w-4xl italic">
              {loadingAi ? "Analisando métricas..." : aiInsight}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard title="Faturamento Hoje" value={stats.daily.revenue} icon={DollarSign} color="bg-blue-600" trend="+12% vs ontem" />
        <KpiCard title="Agendamentos" value={stats.daily.count} icon={Calendar} color="bg-indigo-600" trend="Alta demanda" />
        <KpiCard title="Receita Mensal" value={stats.monthly.revenue} icon={BarChart3} color="bg-emerald-600" trend="Meta 85%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-black p-10 rounded-[3rem] border border-zinc-900 shadow-2xl">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Fluxo de Atendimento</h3>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Últimos 7 dias</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#18181b" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#71717a'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#71717a'}} />
                <Tooltip 
                    cursor={{fill: '#18181b'}} 
                    contentStyle={{backgroundColor: '#000', borderRadius: '20px', border: '1px solid #27272a', color: '#fff'}} 
                />
                <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={40}>
                  {stats.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 6 ? '#2563eb' : '#3f3f46'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-black p-8 rounded-[3rem] border border-zinc-900 flex flex-col h-full shadow-2xl">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-white tracking-tight">Próximos da Fila</h3>
              <span className="px-3 py-1 bg-zinc-900 rounded-full text-[10px] font-black text-zinc-500 uppercase tracking-widest">{stats.todaysAppointments.length} Hoje</span>
           </div>
           
           <div className="space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
              {stats.todaysAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
                  <Clock size={48} className="mb-2 text-white" />
                  <p className="text-xs font-black uppercase text-white">Sem agendamentos</p>
                </div>
              ) : (
                stats.todaysAppointments.map(apt => (
                  <div key={apt.id} className="flex items-center justify-between p-4 bg-zinc-950/40 rounded-3xl border border-zinc-900 hover:border-blue-500/50 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex flex-col items-center justify-center border border-zinc-800 text-blue-500">
                         <span className="text-[10px] font-black">{sanitizeTime(apt.time)}</span>
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-black text-white truncate">{clients.find(c => c.id === apt.clientId)?.name || 'Cliente'}</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase truncate">{services.find(s => s.id === apt.serviceId)?.name || 'Serviço'}</p>
                      </div>
                    </div>
                    <div className="p-2 text-zinc-700 group-hover:text-blue-500 transition-colors">
                      <CheckCircle2 size={20} />
                    </div>
                  </div>
                ))
              )}
           </div>
           
           <button onClick={() => window.dispatchEvent(new CustomEvent('change-view', {detail: 'SCHEDULE'}))} className="w-full mt-6 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-500 hover:text-white transition-all">Ver Agenda Completa</button>
        </div>
      </div>
    </div>
  );
};
