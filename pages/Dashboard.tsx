
import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { analyzeDailyPerformance } from '../services/geminiService';
import { 
  Sparkles, Calendar, Clock, DollarSign, 
  Target, BarChart3, ArrowUpRight, CheckCircle2,
  Trophy, TrendingUp, Users, UserMinus, UserPlus, 
  Award, AlertCircle, Scissors, ArrowRight, ChevronRight,
  TrendingDown, Percent
} from 'lucide-react';
import { sanitizeTime } from './Schedule';
import { Role } from '../types';

export const Dashboard = () => {
  const { currentUser, selectedBarbershop, appointments, services, clients, users, setView } = useApp();
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  const currentShopId = useMemo(() => {
    return String(selectedBarbershop?.id || currentUser?.barbershopId || '').trim().toLowerCase();
  }, [currentUser, selectedBarbershop]);

  const shopClients = useMemo(() => {
    return clients.filter(c => String(c.barbershopId).toLowerCase() === currentShopId);
  }, [clients, currentShopId]);

  const shopStaff = useMemo(() => {
    return users.filter(u => 
      String(u.barbershopId).toLowerCase() === currentShopId && 
      u.role !== Role.SUPER_ADMIN &&
      (u.useSchedule === true || String(u.useSchedule).toLowerCase() === 'true')
    );
  }, [users, currentShopId]);

  const stats = useMemo(() => {
    const shopAppointments = appointments.filter(a => String(a.barbershopId).toLowerCase() === currentShopId && a.status !== 'CANCELLED');
    
    // Processamento de Performance por Barbeiro (Apenas os filtrados com agenda ativa)
    const barberPerformance = shopStaff.map(barber => {
      const barberApts = shopAppointments.filter(a => String(a.barberId).trim() === String(barber.id).trim());
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
        noShows: 0, // Placeholder
        status: 'Ativo'
      };
    }).sort((a, b) => b.atendimentos - a.atendimentos);

    // Métricas Globais da Unidade
    const totalRevenue = barberPerformance.reduce((acc, b) => acc + b.faturamento, 0);
    const totalCompleted = barberPerformance.reduce((acc, b) => acc + b.concluidos, 0);
    const totalApts = shopAppointments.length;
    const avgConversion = barberPerformance.length > 0 ? barberPerformance.reduce((acc, b) => acc + b.conversao, 0) / barberPerformance.length : 0;
    const avgRevenuePerBarber = barberPerformance.length > 0 ? totalRevenue / barberPerformance.length : 0;

    // Métricas de Clientes (CRM)
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const newClientsCount = shopClients.filter(c => c.memberSince && c.memberSince.startsWith(currentMonth)).length;
    
    const clientVisitCounts: Record<string, number> = {};
    shopAppointments.filter(a => a.status === 'COMPLETED').forEach(a => {
        clientVisitCounts[a.clientId] = (clientVisitCounts[a.clientId] || 0) + 1;
    });
    const recurringClientsCount = Object.values(clientVisitCounts).filter(count => count > 1).length;
    const recurringPercent = shopClients.length > 0 ? (recurringClientsCount / shopClients.length) * 100 : 0;

    return { 
      barberPerformance,
      networkStats: {
          avgConversion,
          avgRevenuePerBarber,
          totalApts
      },
      crmStats: {
          total: shopClients.length,
          new: newClientsCount,
          recurring: recurringPercent,
          recurringCount: recurringClientsCount,
          noShows: 0
      }
    };
  }, [appointments, services, currentShopId, shopStaff, shopClients]);

  useEffect(() => {
    const fetchInsight = async () => {
      setLoadingAi(true);
      try {
        const text = await analyzeDailyPerformance(stats.networkStats.totalApts, stats.networkStats.avgRevenuePerBarber * stats.barberPerformance.length, ["Corte", "Barba"]);
        setAiInsight(text);
      } catch (e) {
        setAiInsight("Não é quem atende mais — é quem gera mais valor. Barbeiros com conversão baixa podem precisar de melhor gestão de agenda.");
      } finally {
        setLoadingAi(false);
      }
    };
    fetchInsight();
  }, [stats.networkStats]);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      
      {/* SEÇÃO: DESEMPENHO POR BARBEIRO */}
      <div className="bg-[#1a1d21] rounded-[2rem] border border-zinc-800 shadow-2xl overflow-hidden">
        <div className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Desempenho por Barbeiro</h2>
              <p className="text-sm font-bold text-zinc-500">Gestão completa do time</p>
           </div>
           <button onClick={() => setView('STAFF')} className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-6 py-2.5 rounded-xl border border-blue-500/20 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all">
              <Award size={16} /> Ranking
           </button>
        </div>

        <div className="overflow-x-auto px-8 pb-4">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800/50">
                <th className="pb-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">Posição</th>
                <th className="pb-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Barbeiro</th>
                <th className="pb-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center">Atendimentos</th>
                <th className="pb-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center">Concluídos</th>
                <th className="pb-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center">Conversão</th>
                <th className="pb-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center">Faturamento</th>
                <th className="pb-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center">Ticket Médio</th>
                <th className="pb-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center">No-Shows</th>
                <th className="pb-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest text-right px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {stats.barberPerformance.map((barber, index) => (
                <tr key={barber.id} className="group hover:bg-white/[0.02] transition-all">
                  <td className="py-6 px-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] border ${
                      index === 0 ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                    }`}>
                      {index + 1}º
                    </div>
                  </td>
                  <td className="py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 shrink-0">
                        {barber.photo ? <img src={barber.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-zinc-700">{barber.name.charAt(0)}</div>}
                      </div>
                      <span className="font-black text-white text-sm tracking-tight">{barber.name}</span>
                    </div>
                  </td>
                  <td className="py-6 text-center font-black text-white text-sm">{barber.atendimentos}</td>
                  <td className="py-6 text-center font-black text-emerald-500 text-sm">{barber.concluidos}</td>
                  <td className="py-6 text-center">
                    <div className="flex items-center justify-center gap-1.5 font-black text-emerald-500 text-sm">
                      {barber.conversao.toFixed(1)}% <TrendingUp size={14} className="opacity-60" />
                    </div>
                  </td>
                  <td className="py-6 text-center font-black text-emerald-500 text-sm">R$ {barber.faturamento.toFixed(2)}</td>
                  <td className="py-6 text-center font-black text-white text-sm">R$ {barber.ticketMedio.toFixed(2)}</td>
                  <td className="py-6 text-center font-black text-red-500/60 text-sm">{barber.noShows}</td>
                  <td className="py-6 text-right px-2">
                     <div className={`w-2 h-2 rounded-full ml-auto ${barber.status === 'Ativo' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-zinc-700'}`}></div>
                  </td>
                </tr>
              ))}
              {stats.barberPerformance.length === 0 && (
                <tr>
                   <td colSpan={9} className="py-20 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs">Nenhum profissional com atividade registrada</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Resumo Rodapé da Tabela */}
        <div className="p-8 bg-zinc-900/30 border-t border-zinc-800/50">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Média de Conversão</p>
                <h4 className="text-3xl font-black text-white">{stats.networkStats.avgConversion.toFixed(1)}%</h4>
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Faturamento Médio</p>
                <h4 className="text-3xl font-black text-white">R$ {stats.networkStats.avgRevenuePerBarber.toFixed(2)}</h4>
              </div>
              <div>
                <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1">Total de Atendimentos</p>
                <h4 className="text-3xl font-black text-white">{stats.networkStats.totalApts}</h4>
              </div>
           </div>
           
           <div className="bg-black/40 border border-zinc-800 p-6 rounded-2xl flex items-start gap-4">
              <span className="font-black text-white text-sm shrink-0">Insight:</span>
              <p className="text-zinc-500 text-sm font-medium leading-relaxed italic">
                 {aiInsight || "Analise seus indicadores para otimizar o faturamento."}
              </p>
           </div>
        </div>
      </div>

      {/* SEÇÃO: ANÁLISE DE CLIENTES (CRM) */}
      <div className="bg-[#1a1d21] rounded-[2rem] border border-zinc-800 shadow-2xl overflow-hidden p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
           <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Análise de Clientes</h2>
              <p className="text-sm font-bold text-zinc-500">CRM simples e poderoso</p>
           </div>
           <button onClick={() => setView('CUSTOMERS')} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-6 py-2.5 rounded-xl border border-zinc-700 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all">
              <Users size={16} /> {stats.crmStats.total} clientes
           </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {/* Card Total */}
           <div className="bg-[#212429] p-6 rounded-2xl border border-zinc-800 hover:border-blue-500/30 transition-all group">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users size={20} />
                 </div>
                 <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Total</span>
              </div>
              <h3 className="text-4xl font-black text-white mb-1">{stats.crmStats.total}</h3>
              <p className="text-[10px] font-bold text-blue-400/60 uppercase tracking-tighter">clientes cadastrados</p>
           </div>

           {/* Card Novos */}
           <div className="bg-[#1f2622] p-6 rounded-2xl border border-zinc-800 hover:border-emerald-500/30 transition-all group">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UserPlus size={20} />
                 </div>
                 <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Novos</span>
              </div>
              <h3 className="text-4xl font-black text-white mb-1">{stats.crmStats.new}</h3>
              <p className="text-[10px] font-bold text-emerald-400/60 uppercase tracking-tighter">no período</p>
           </div>

           {/* Card Recorrentes */}
           <div className="bg-[#242129] p-6 rounded-2xl border border-zinc-800 hover:border-purple-500/30 transition-all group">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp size={20} />
                 </div>
                 <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Recorrentes</span>
              </div>
              <h3 className="text-4xl font-black text-white mb-1">{stats.crmStats.recurring.toFixed(1)}%</h3>
              <p className="text-[10px] font-bold text-purple-400/60 uppercase tracking-tighter">{stats.crmStats.recurringCount} clientes</p>
           </div>

           {/* Card No-Show */}
           <div className="bg-[#292121] p-6 rounded-2xl border border-zinc-800 hover:border-red-500/30 transition-all group">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 rounded-xl bg-red-600/10 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UserMinus size={20} />
                 </div>
                 <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Com No-Show</span>
              </div>
              <h3 className="text-4xl font-black text-white mb-1">{stats.crmStats.noShows}</h3>
              <p className="text-[10px] font-bold text-red-400/60 uppercase tracking-tighter">clientes problemáticos</p>
           </div>
        </div>
      </div>
    </div>
  );
};
