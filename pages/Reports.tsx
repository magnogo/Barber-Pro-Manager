
import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, DollarSign, Calendar, Sparkles, Loader2,
  ChevronDown, User, BarChart3, CalendarDays, Filter
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

export const Reports = () => {
  const { appointments, services, users, currentUser } = useApp();
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');
  const [volumePeriod, setVolumePeriod] = useState<'day' | 'week' | 'month'>('day');

  const baseData = useMemo(() => {
    const shopId = currentUser?.barbershopId;
    const filteredApts = appointments.filter(a => String(a.barbershopId).trim() === String(shopId).trim() && a.status !== 'CANCELLED');
    const filteredServices = services.filter(s => String(s.barbershopId).trim() === String(shopId).trim());
    const filteredStaff = users.filter(u => String(u.barbershopId).trim() === String(shopId).trim());
    return { appointments: filteredApts, services: filteredServices, staff: filteredStaff };
  }, [appointments, services, users, currentUser]);

  const filteredAppointments = useMemo(() => {
    if (selectedBarberId === 'all') return baseData.appointments;
    return baseData.appointments.filter(a => String(a.barberId).trim() === String(selectedBarberId).trim());
  }, [baseData.appointments, selectedBarberId]);

  const stats = useMemo(() => {
    const totalRevenue = filteredAppointments.reduce((acc, apt) => {
      const service = baseData.services.find(s => String(s.id).trim() === String(apt.serviceId).trim());
      return acc + (service?.price || 0);
    }, 0);
    const avgTicket = filteredAppointments.length > 0 ? totalRevenue / filteredAppointments.length : 0;
    return { totalRevenue, totalAppointments: filteredAppointments.length, avgTicket };
  }, [filteredAppointments, baseData.services]);

  const monthlyRevenueData = useMemo(() => {
    const months: Record<string, number> = {};
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    for(let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        months[key] = 0;
    }
    filteredAppointments.forEach(apt => {
      const date = new Date(apt.date + 'T12:00:00');
      const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      if (months[key] !== undefined) {
          const service = baseData.services.find(s => String(s.id).trim() === String(apt.serviceId).trim());
          months[key] += (service?.price || 0);
      }
    });
    return Object.entries(months).map(([name, value]) => ({ name, value }));
  }, [filteredAppointments, baseData.services]);

  useEffect(() => {
    const getAiAnalysis = async () => {
      if (filteredAppointments.length === 0) return;
      setLoadingAi(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analise faturamento R$ ${stats.totalRevenue.toFixed(2)}, Ticket R$ ${stats.avgTicket.toFixed(2)}. Dê um insight curto (15 palavras).`;
      try {
        const result = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
        setAiAnalysis(result.text || "Continue o bom trabalho!");
      } catch (err) { setAiAnalysis("Acompanhe o ticket médio semanal."); }
      finally { setLoadingAi(false); }
    };
    getAiAnalysis();
  }, [stats]);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-xl">
        <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl text-white">
                <BarChart3 size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Relatórios & Performance</h2>
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-0.5">Visão Executiva</p>
            </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <User className="absolute left-3 top-3 text-zinc-500" size={16} />
            <select value={selectedBarberId} onChange={(e) => setSelectedBarberId(e.target.value)} className="pl-10 pr-10 py-3 w-full bg-black border-2 border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-blue-600 appearance-none">
              <option value="all">TODOS OS PROFISSIONAIS</option>
              {baseData.staff.map(b => <option key={b.id} value={b.id}>{b.nickname || b.name.toUpperCase()}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-3 text-zinc-500 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border border-zinc-800">
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
          <Sparkles size={180} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 bg-blue-600/20 rounded-3xl flex items-center justify-center border border-blue-600/30">
            <Sparkles size={40} className="text-blue-400 animate-pulse" />
          </div>
          <div className="flex-1">
            <h3 className="font-black text-xl mb-2 flex items-center gap-3 tracking-tight">Business Insight <span className="text-[9px] bg-blue-600 px-3 py-1 rounded-full uppercase">IA</span></h3>
            <p className="text-zinc-400 leading-relaxed text-lg font-medium italic">{loadingAi ? "Calculando..." : `"${aiAnalysis}"`}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Receita', value: `R$ ${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'bg-blue-600' },
          { label: 'Atendimentos', value: stats.totalAppointments, icon: Calendar, color: 'bg-indigo-600' },
          { label: 'Ticket Médio', value: `R$ ${stats.avgTicket.toFixed(2)}`, icon: TrendingUp, color: 'bg-emerald-600' }
        ].map((kpi, i) => (
          <div key={i} className="bg-zinc-900 p-8 rounded-[2rem] border border-zinc-800 shadow-sm group">
            <div className={`${kpi.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <kpi.icon size={28} className="text-white" />
            </div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{kpi.label}</p>
            <h4 className="text-3xl font-black text-white tracking-tighter">{kpi.value}</h4>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-white flex items-center gap-3 tracking-tight">
              <TrendingUp size={22} className="text-blue-600" /> Histórico de Faturamento
            </h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#71717a'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#71717a'}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#09090b', borderRadius: '16px', border: '1px solid #27272a', color: '#fff'}}
                  formatter={(val: number) => [`R$ ${val.toFixed(2)}`, 'Faturamento']}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
};
