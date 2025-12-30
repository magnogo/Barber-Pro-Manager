
import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import { 
  TrendingUp, Users, DollarSign, Calendar, Clock, 
  Scissors, Download, Filter, Sparkles, Loader2,
  ChevronDown, ArrowUpRight, ArrowDownRight, User, Wallet,
  BarChart3, CalendarDays, CalendarRange
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export const Reports = () => {
  const { appointments, services, users, currentUser } = useApp();
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all');
  const [volumePeriod, setVolumePeriod] = useState<'day' | 'week' | 'month'>('day');

  // Filtros de período específicos para a Tabela de Produtividade
  const [staffStartDate, setStaffStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-CA'));
  const [staffEndDate, setStaffEndDate] = useState(new Date().toLocaleDateString('en-CA'));

  // Filtro de dados base para a barbearia atual
  const baseData = useMemo(() => {
    const shopId = currentUser?.barbershopId;
    const filteredApts = appointments.filter(a => String(a.barbershopId).trim() === String(shopId).trim() && a.status !== 'CANCELLED');
    const filteredServices = services.filter(s => String(s.barbershopId).trim() === String(shopId).trim());
    const filteredStaff = users.filter(u => String(u.barbershopId).trim() === String(shopId).trim());
    
    return { appointments: filteredApts, services: filteredServices, staff: filteredStaff };
  }, [appointments, services, users, currentUser]);

  // Filtro por barbeiro selecionado
  const filteredAppointments = useMemo(() => {
    if (selectedBarberId === 'all') return baseData.appointments;
    return baseData.appointments.filter(a => String(a.barberId).trim() === String(selectedBarberId).trim());
  }, [baseData.appointments, selectedBarberId]);

  // Cálculos de KPI baseados no filtro
  const stats = useMemo(() => {
    const totalRevenue = filteredAppointments.reduce((acc, apt) => {
      const service = baseData.services.find(s => String(s.id).trim() === String(apt.serviceId).trim());
      return acc + (service?.price || 0);
    }, 0);

    const avgTicket = filteredAppointments.length > 0 ? totalRevenue / filteredAppointments.length : 0;
    
    return {
      totalRevenue,
      totalAppointments: filteredAppointments.length,
      avgTicket,
      totalStaff: baseData.staff.length
    };
  }, [filteredAppointments, baseData.services, baseData.staff]);

  // Tabela de Produtividade por Barbeiro (Com Filtro de Data Específico)
  const staffPerformance = useMemo(() => {
    return baseData.staff.map(barber => {
      // Filtra atendimentos do barbeiro dentro do intervalo de datas selecionado
      const barberApts = baseData.appointments.filter(a => {
          const isBarber = String(a.barberId).trim() === String(barber.id).trim();
          const matchesDate = (!staffStartDate || a.date >= staffStartDate) && (!staffEndDate || a.date <= staffEndDate);
          return isBarber && matchesDate;
      });

      const revenue = barberApts.reduce((acc, apt) => {
        const s = baseData.services.find(ser => String(ser.id).trim() === String(apt.serviceId).trim());
        return acc + (s?.price || 0);
      }, 0);

      return {
        id: barber.id,
        name: barber.nickname || barber.name,
        photo: barber.photo,
        count: barberApts.length,
        revenue: revenue,
        avgTicket: barberApts.length > 0 ? revenue / barberApts.length : 0
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [baseData, staffStartDate, staffEndDate]);

  // Gráfico: Ticket Médio por Profissional
  const avgTicketByBarber = useMemo(() => {
    return staffPerformance.map(s => ({ 
        name: s.name, 
        ticket: parseFloat(s.avgTicket.toFixed(2)) 
    }));
  }, [staffPerformance]);

  // Gráfico: Faturamento Mensal (Acompanhamento)
  const monthlyRevenueData = useMemo(() => {
    const months: Record<string, number> = {};
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Inicializa últimos 6 meses
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

  // Gráfico: Volume por Período (Dia/Semana/Mês)
  const volumeData = useMemo(() => {
    if (volumePeriod === 'day') {
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const counts = [0, 0, 0, 0, 0, 0, 0];
        filteredAppointments.forEach(apt => {
            const date = new Date(apt.date + 'T12:00:00');
            counts[date.getDay()]++;
        });
        return days.map((name, i) => ({ name, value: counts[i] }));
    } else if (volumePeriod === 'week') {
        // Simulação de semanas do mês atual
        const weeks = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
        const counts = [0, 0, 0, 0];
        filteredAppointments.forEach(apt => {
            const date = new Date(apt.date + 'T12:00:00');
            const day = date.getDate();
            const weekIdx = Math.min(Math.floor((day - 1) / 7), 3);
            counts[weekIdx]++;
        });
        return weeks.map((name, i) => ({ name, value: counts[i] }));
    } else {
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const months: Record<string, number> = {};
        const now = new Date();
        for(let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months[monthNames[d.getMonth()]] = 0;
        }
        filteredAppointments.forEach(apt => {
            const date = new Date(apt.date + 'T12:00:00');
            const mName = monthNames[date.getMonth()];
            if(months[mName] !== undefined) months[mName]++;
        });
        return Object.entries(months).map(([name, value]) => ({ name, value }));
    }
  }, [filteredAppointments, volumePeriod]);

  // Análise de IA
  useEffect(() => {
    const getAiAnalysis = async () => {
      if (filteredAppointments.length === 0) return;
      setLoadingAi(true);
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Analise os dados financeiros da minha barbearia:
        - Profissional selecionado: ${selectedBarberId === 'all' ? 'Toda a Equipe' : baseData.staff.find(u => u.id === selectedBarberId)?.name}
        - Faturamento Total: R$ ${stats.totalRevenue.toFixed(2)}
        - Total de Agendamentos: ${stats.totalAppointments}
        - Ticket Médio Atual: R$ ${stats.avgTicket.toFixed(2)}
        
        Com base nestes números, forneça 1 insight estratégico direto (máximo 20 palavras) para aumentar a rentabilidade ou melhorar o ticket médio.
      `;

      try {
        const result = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });
        setAiAnalysis(result.text || "Dados insuficientes para análise profunda.");
      } catch (err) {
        setAiAnalysis("Continue monitorando seu faturamento mensal para identificar padrões de crescimento.");
      } finally {
        setLoadingAi(false);
      }
    };

    getAiAnalysis();
  }, [stats, selectedBarberId, baseData.staff, filteredAppointments.length]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header com Filtros */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg">
                <BarChart3 size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Relatórios & Performance</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Business Intelligence da Unidade</p>
            </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <User className="absolute left-3 top-3 text-gray-400" size={16} />
            <select 
              value={selectedBarberId}
              onChange={(e) => setSelectedBarberId(e.target.value)}
              className="pl-10 pr-10 py-3 w-full bg-gray-50 border-2 border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-700 outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
            >
              <option value="all">TODOS OS PROFISSIONAIS</option>
              {baseData.staff.map(b => (
                <option key={b.id} value={b.id}>{b.nickname || b.name.toUpperCase()}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={16} />
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all w-full md:w-auto">
            <Download size={16} /> Exportar Fechamento
          </button>
        </div>
      </div>

      {/* Insight Banner IA */}
      <div className="bg-gradient-to-br from-indigo-950 via-gray-900 to-black rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group border border-white/5">
        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Sparkles size={180} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 bg-indigo-500/10 backdrop-blur-3xl rounded-3xl flex items-center justify-center shrink-0 border border-indigo-500/30 shadow-2xl">
            <Sparkles size={40} className="text-indigo-400 animate-pulse" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="font-black text-xl mb-2 flex items-center justify-center md:justify-start gap-3 tracking-tight">
              Master Business Insight
              <span className="text-[9px] bg-indigo-600 text-white px-3 py-1 rounded-full font-black uppercase tracking-widest">IA Analítica</span>
            </h3>
            {loadingAi ? (
              <div className="flex items-center justify-center md:justify-start gap-3 text-indigo-200 italic font-medium">
                <Loader2 size={18} className="animate-spin" /> Analisando métricas de rentabilidade...
              </div>
            ) : (
              <p className="text-gray-300 leading-relaxed text-lg font-medium italic">
                "{aiAnalysis}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Faturamento Período', value: `R$ ${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Serviços Realizados', value: stats.totalAppointments, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Ticket Médio', value: `R$ ${stats.avgTicket.toFixed(2)}`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' }
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
            <div className={`${kpi.bg} ${kpi.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <kpi.icon size={28} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{kpi.label}</p>
            <h4 className="text-3xl font-black text-gray-900 tracking-tighter">{kpi.value}</h4>
          </div>
        ))}
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acompanhamento de Faturamento Mensal */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-gray-800 flex items-center gap-3 tracking-tight">
              <TrendingUp size={22} className="text-indigo-600" /> Faturamento Mensal
            </h3>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">Histórico 6 Meses</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                  formatter={(val: number) => [`R$ ${val.toFixed(2)}`, 'Faturamento']}
                />
                <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Volume de Serviços por Período */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <h3 className="font-black text-gray-800 flex items-center gap-3 tracking-tight">
              <CalendarDays size={22} className="text-emerald-600" /> Volume de Serviços
            </h3>
            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
               {['day', 'week', 'month'].map((p) => (
                  <button 
                    key={p} 
                    onClick={() => setVolumePeriod(p as any)}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                        volumePeriod === p ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                     {p === 'day' ? 'Dia' : p === 'week' ? 'Semana' : 'Mês'}
                  </button>
               ))}
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                  formatter={(val: number) => [val, 'Serviços']}
                />
                <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Comparativo de Ticket Médio por Barbeiro */}
         <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 lg:col-span-1">
            <div className="flex items-center justify-between mb-8">
               <h3 className="font-black text-gray-800 flex items-center gap-3 tracking-tight">
                  <TrendingUp size={22} className="text-blue-600" /> Ticket Médio / Pro
               </h3>
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rentabilidade</span>
            </div>
            <div className="h-80">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={avgTicketByBarber} layout="vertical">
                     <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#374151'}} width={90} />
                     <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                        formatter={(val: number) => [`R$ ${val.toFixed(2)}`, 'Ticket Médio']}
                     />
                     <Bar dataKey="ticket" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={20} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Tabela de Produtividade */}
         <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden lg:col-span-2">
            <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center bg-gray-50/30 gap-4">
               <div>
                  <h3 className="text-xl font-black text-gray-800 tracking-tight">Produtividade da Equipe</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Desempenho por intervalo de datas</p>
               </div>
               
               {/* Filtro de Período Customizado do Card */}
               <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-200 shadow-sm transition-all hover:border-gray-300">
                      <Calendar size={14} className="text-black" />
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">De</span>
                      <input 
                        type="date" 
                        value={staffStartDate} 
                        onChange={e => setStaffStartDate(e.target.value)}
                        className="text-[10px] font-black text-gray-700 bg-transparent outline-none cursor-pointer"
                      />
                  </div>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-200 shadow-sm transition-all hover:border-gray-300">
                      <Calendar size={14} className="text-black" />
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Até</span>
                      <input 
                        type="date" 
                        value={staffEndDate} 
                        onChange={e => setStaffEndDate(e.target.value)}
                        className="text-[10px] font-black text-gray-700 bg-transparent outline-none cursor-pointer"
                      />
                  </div>
                  <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
                      <Filter size={16} />
                  </div>
               </div>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-gray-50/50">
                        <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Colaborador</th>
                        <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Volume</th>
                        <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Bruto Gerado</th>
                        <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ticket Médio</th>
                        <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {staffPerformance.map((barber) => (
                        <tr key={barber.id} className="hover:bg-indigo-50/30 transition-colors group">
                           <td className="p-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 shadow-sm">
                                    {barber.photo ? (
                                       <img src={barber.photo} className="w-full h-full object-cover" alt={barber.name} />
                                    ) : (
                                       <div className="w-full h-full flex items-center justify-center text-gray-400 font-black text-xl bg-indigo-50 text-indigo-300">{barber.name.charAt(0)}</div>
                                    )}
                                 </div>
                                 <div>
                                    <p className="font-black text-gray-900 text-sm">{barber.name}</p>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Barbeiro Parceiro</p>
                                 </div>
                              </div>
                           </td>
                           <td className="p-6 text-center">
                              <span className="inline-flex items-center justify-center w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl font-black text-sm">
                                 {barber.count}
                              </span>
                           </td>
                           <td className="p-6">
                              <p className="font-black text-gray-900 text-sm">R$ {barber.revenue.toFixed(2)}</p>
                           </td>
                           <td className="p-6">
                              <p className="font-black text-gray-600 text-sm">R$ {barber.avgTicket.toFixed(2)}</p>
                           </td>
                           <td className="p-6 text-right">
                              <button 
                                onClick={() => setSelectedBarberId(barber.id)}
                                className="p-3 bg-gray-50 text-gray-400 hover:bg-gray-900 hover:text-white rounded-xl transition-all group-hover:shadow-md"
                              >
                                 <TrendingUp size={16} />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
};
