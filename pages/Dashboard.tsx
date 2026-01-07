
import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { analyzeDailyPerformance } from '../services/geminiService';
import { 
  TrendingUp, Users, UserPlus, UserMinus, Award, 
  DollarSign, Calendar, Clock, BarChart3, ChevronRight,
  Scissors, CheckCircle2, AlertCircle, Sparkles, Filter
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { sanitizeTime } from './Schedule';
import { Role } from '../types';

export const Dashboard = () => {
  const { currentUser, selectedBarbershop, appointments, services, clients, users, setView } = useApp();
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  const currentShopId = useMemo(() => {
    return String(selectedBarbershop?.id || currentUser?.barbershopId || '').trim().toLowerCase();
  }, [currentUser, selectedBarbershop]);

  const todayISO = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  // --- CÁLCULOS DE MÉTRICAS ---
  const metrics = useMemo(() => {
    const shopAppointments = appointments.filter(a => String(a.barbershopId).toLowerCase() === currentShopId && a.status !== 'CANCELLED');
    const todayApts = shopAppointments.filter(a => a.date === todayISO);
    
    const calculateRevenue = (apts: any[]) => {
      return apts.reduce((acc, apt) => {
        const service = services.find(s => String(s.id).trim() === String(apt.serviceId).trim());
        return acc + (Number(service?.price) || 0);
      }, 0);
    };

    const revenueToday = calculateRevenue(todayApts);
    const revenueMonth = calculateRevenue(shopAppointments.filter(a => a.date.startsWith(todayISO.slice(0, 7))));

    // Fluxo de Atendimento (Últimos 7 dias)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toLocaleDateString('en-CA');
      const count = shopAppointments.filter(a => a.date === iso).length;
      chartData.push({
        name: d.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', ''),
        contagem: count,
        date: iso
      });
    }

    // Próximos da Fila (Hoje, pendentes ou confirmados, ordenados por hora)
    const queue = todayApts
      .filter(a => a.status === 'PENDING' || a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS')
      .sort((a, b) => a.time.localeCompare(b.time));

    return { revenueToday, revenueMonth, todayCount: todayApts.length, chartData, queue, shopAppointments };
  }, [appointments, services, currentShopId, todayISO]);

  const shopClients = useMemo(() => clients.filter(c => String(c.barbershopId).toLowerCase() === currentShopId), [clients, currentShopId]);
  const shopStaff = useMemo(() => users.filter(u => 
    String(u.barbershopId).toLowerCase() === currentShopId && 
    u.role !== Role.SUPER_ADMIN &&
    (u.useSchedule === true || String(u.useSchedule).toLowerCase() === 'true')
  ), [users, currentShopId]);

  // Performance por Barbeiro (Apenas os com agenda ativa)
  const barberPerformance = useMemo(() => {
    return shopStaff.map(barber => {
      const barberApts = metrics.shopAppointments.filter(a => String(a.barberId).trim() === String(barber.id).trim());
      const completed = barberApts.filter(a => a.status === 'COMPLETED').length;
      const totalCount = barberApts.length;
      const conversion = totalCount > 0 ? (completed / totalCount) * 100 : 0;
      
      let revenue = 0;
      barberApts.filter(a => a.status === 'COMPLETED').forEach(apt => {
        const service = services.find(s => s.id === apt.serviceId);
        revenue += service ? Number(service.price || 0) : 0;
      });

      const avgTicket = completed > 0 ? revenue / completed : 0;

      return {
        id: barber.id,
        name: barber.name,
        photo: barber.photo || barber.avatar,
        atendimentos: totalCount,
        concluidos: completed,
        conversao: conversion,
        faturamento: revenue,
        ticketMedio: avgTicket,
        status: 'Ativo'
      };
    }).sort((a, b) => b.atendimentos - a.atendimentos);
  }, [shopStaff, metrics.shopAppointments, services]);

  useEffect(() => {
    const fetchInsight = async () => {
      setLoadingAi(true);
      try {
        const text = await analyzeDailyPerformance(metrics.todayCount, metrics.revenueToday, ["Corte", "Barba"]);
        setAiInsight(text);
      } catch (e) {
        setAiInsight("Mantenha o foco na experiência do cliente para aumentar o faturamento.");
      } finally {
        setLoadingAi(false);
      }
    };
    fetchInsight();
  }, [metrics.todayCount, metrics.revenueToday]);

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      
      {/* 1. TOP CARDS (ESTILO IMAGEM) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Faturamento Hoje */}
        <div className="bg-black border border-zinc-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
           <div className="flex justify-between items-start mb-8">
              <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/10">
                <DollarSign size={28} />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Faturamento Hoje</p>
                <p className="text-emerald-500 text-[10px] font-black flex items-center justify-end gap-1 mt-1">
                  <TrendingUp size={12} /> +12% vs ontem
                </p>
              </div>
           </div>
           <h3 className="text-5xl font-black text-white tracking-tighter">
             R$ {metrics.revenueToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
           </h3>
        </div>

        {/* Agendamentos */}
        <div className="bg-black border border-zinc-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
           <div className="flex justify-between items-start mb-8">
              <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-500/10">
                <Calendar size={28} />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Agendamentos</p>
                <p className="text-blue-400 text-[10px] font-black flex items-center justify-end gap-1 mt-1 uppercase">
                  Alta demanda
                </p>
              </div>
           </div>
           <h3 className="text-5xl font-black text-white tracking-tighter">
             {metrics.todayCount}
           </h3>
        </div>

        {/* Receita Mensal */}
        <div className="bg-black border border-zinc-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
           <div className="flex justify-between items-start mb-8">
              <div className="w-14 h-14 bg-emerald-600/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/10">
                <BarChart3 size={28} />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Receita Mensal</p>
                <p className="text-emerald-500 text-[10px] font-black flex items-center justify-end gap-1 mt-1 uppercase">
                  Meta 85%
                </p>
              </div>
           </div>
           <h3 className="text-5xl font-black text-white tracking-tighter">
             R$ {metrics.revenueMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
           </h3>
        </div>
      </div>

      {/* 2. GRÁFICO E FILA (ESTILO IMAGEM) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Fluxo de Atendimento */}
        <div className="lg:col-span-2 bg-black border border-zinc-900 rounded-[2.5rem] p-10 shadow-2xl">
          <div className="mb-12">
            <h2 className="text-2xl font-black text-white tracking-tight">Fluxo de Atendimento</h2>
            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mt-1">Dados dos últimos 7 dias de operação</p>
          </div>
          
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#121212" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#3f3f46', fontSize: 10, fontWeight: 900 }} 
                  dy={15}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #27272a', borderRadius: '16px', fontWeight: 'bold' }}
                />
                <Bar dataKey="contagem" radius={[12, 12, 0, 0]} barSize={50}>
                  {metrics.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 6 ? '#3b82f6' : '#18181b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Próximos da Fila */}
        <div className="bg-black border border-zinc-900 rounded-[2.5rem] p-10 shadow-2xl flex flex-col">
          <div className="flex justify-between items-center mb-10">
             <h2 className="text-2xl font-black text-white tracking-tight">Próximos da Fila</h2>
             <span className="bg-zinc-900 text-zinc-500 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-zinc-800">
               {metrics.queue.length} HOJE
             </span>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto custom-scrollbar pr-2 max-h-[380px]">
            {metrics.queue.map((apt, idx) => {
              const client = clients.find(c => String(c.id).trim() === String(apt.clientId).trim());
              const service = services.find(s => String(s.id).trim() === String(apt.serviceId).trim());
              return (
                <div key={idx} className="bg-zinc-950/40 border border-zinc-900/50 rounded-[2rem] p-6 flex items-center gap-5 group hover:border-blue-500/30 transition-all hover:bg-zinc-950">
                  <div className="w-18 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center text-blue-500 font-black text-sm border border-zinc-800 shrink-0">
                    {sanitizeTime(apt.time)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-white font-black text-base truncate tracking-tight">{client?.name || 'Cliente'}</p>
                    <p className="text-zinc-600 text-[10px] font-black uppercase truncate tracking-widest mt-0.5">{service?.name || 'Serviço'}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-700 group-hover:text-emerald-500 group-hover:border-emerald-500/30 transition-colors">
                    <CheckCircle2 size={18} />
                  </div>
                </div>
              );
            })}
            {metrics.queue.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                <Clock size={64} />
                <p className="text-[10px] font-black uppercase mt-6 tracking-[0.3em]">Agenda Limpa</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => setView('SCHEDULE')}
            className="w-full mt-10 bg-white text-black py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all shadow-2xl active:scale-95"
          >
            Ver Agenda Completa
          </button>
        </div>
      </div>

      {/* 3. DESEMPENHO POR BARBEIRO (EQUIPE) */}
      <div className="bg-[#09090b] rounded-[3rem] border border-zinc-900 shadow-2xl overflow-hidden">
        <div className="p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Performance da Equipe</h2>
              <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mt-1">Ranking de produtividade</p>
           </div>
           <button onClick={() => setView('STAFF')} className="bg-zinc-900 hover:bg-blue-600 text-zinc-400 hover:text-white px-8 py-3 rounded-2xl border border-zinc-800 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all">
              <Award size={18} /> Gerenciar Time
           </button>
        </div>

        <div className="overflow-x-auto px-10 pb-6">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-900">
                <th className="pb-8 text-[10px] font-black text-zinc-700 uppercase tracking-widest px-2">Pos</th>
                <th className="pb-8 text-[10px] font-black text-zinc-700 uppercase tracking-widest">Profissional</th>
                <th className="pb-8 text-[10px] font-black text-zinc-700 uppercase tracking-widest text-center">Atend.</th>
                <th className="pb-8 text-[10px] font-black text-zinc-700 uppercase tracking-widest text-center">Concluídos</th>
                <th className="pb-8 text-[10px] font-black text-zinc-700 uppercase tracking-widest text-center">Conversão</th>
                <th className="pb-8 text-[10px] font-black text-zinc-700 uppercase tracking-widest text-center">Faturamento</th>
                <th className="pb-8 text-[10px] font-black text-zinc-700 uppercase tracking-widest text-right px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50">
              {barberPerformance.map((barber, index) => (
                <tr key={barber.id} className="group hover:bg-white/[0.01] transition-all">
                  <td className="py-8 px-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] border ${
                      index === 0 ? 'bg-blue-600/10 border-blue-500/30 text-blue-500' : 'bg-zinc-900 border-zinc-800 text-zinc-600'
                    }`}>
                      {index + 1}º
                    </div>
                  </td>
                  <td className="py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shrink-0 shadow-lg">
                        {barber.photo ? <img src={barber.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-zinc-800 bg-zinc-900">{barber.name.charAt(0)}</div>}
                      </div>
                      <span className="font-black text-white text-base tracking-tight">{barber.name}</span>
                    </div>
                  </td>
                  <td className="py-8 text-center font-black text-white text-sm">{barber.atendimentos}</td>
                  <td className="py-8 text-center font-black text-emerald-500 text-sm">{barber.concluidos}</td>
                  <td className="py-8 text-center font-black text-blue-500 text-sm">{barber.conversao.toFixed(1)}%</td>
                  <td className="py-8 text-center font-black text-emerald-500 text-sm">R$ {barber.faturamento.toFixed(2)}</td>
                  <td className="py-8 text-right px-2">
                     <div className={`w-2.5 h-2.5 rounded-full ml-auto bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]`}></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. CRM SIMPLIFICADO */}
      <div className="bg-[#09090b] rounded-[3rem] border border-zinc-900 shadow-2xl p-10">
        <div className="flex justify-between items-center mb-10">
           <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Base de Clientes</h2>
              <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mt-1">Visão geral do CRM</p>
           </div>
           <button onClick={() => setView('CUSTOMERS')} className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 px-8 py-3 rounded-2xl border border-zinc-800 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all">
              <Users size={18} /> {shopClients.length} Clientes
           </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           <div className="bg-black/40 p-8 rounded-[2rem] border border-zinc-900 hover:border-blue-500/30 transition-all group">
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center border border-blue-500/10 group-hover:scale-110 transition-transform"><Users size={24} /></div>
                 <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Total</span>
              </div>
              <h3 className="text-5xl font-black text-white mb-2">{shopClients.length}</h3>
              <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-tighter">clientes cadastrados</p>
           </div>
           
           <div className="bg-black/40 p-8 rounded-[2rem] border border-zinc-900 hover:border-emerald-500/30 transition-all group">
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-500 flex items-center justify-center border border-emerald-500/10 group-hover:scale-110 transition-transform"><UserPlus size={24} /></div>
                 <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Novos</span>
              </div>
              <h3 className="text-5xl font-black text-white mb-2">{shopClients.filter(c => c.memberSince?.startsWith(todayISO.slice(0, 7))).length}</h3>
              <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-tighter">neste mês</p>
           </div>

           <div className="lg:col-span-2 bg-blue-600 rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-blue-600/10">
              <div className="absolute right-0 top-0 p-10 opacity-10 group-hover:scale-110 transition-transform">
                <Sparkles size={180} />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-blue-100">AI Business Insight</p>
                <p className="text-xl font-bold leading-relaxed italic pr-10">
                  {loadingAi ? "Analisando métricas..." : `"${aiInsight}"`}
                </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
