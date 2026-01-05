
import React from 'react';
import { useApp } from '../context/AppContext';
import { LOGO_URL } from '../constants';
import { 
  Scissors, 
  MonitorPlay, 
  Smartphone, 
  Sparkles, 
  ChevronRight, 
  Database, 
  CheckCircle,
  BarChart3,
  Users,
  Layout,
  CalendarCheck,
  ShieldCheck,
  ArrowRight,
  Zap,
  Star
} from 'lucide-react';

export const LandingPage = () => {
  const { setView } = useApp();

  return (
    <div className="min-h-screen bg-black text-zinc-300 selection:bg-blue-600 selection:text-white overflow-x-hidden">
      {/* Background Glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Navbar - Ajustada para h-32 para comportar o logo maior */}
      <nav className="fixed top-0 w-full z-50 bg-black/60 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-8 h-32 flex items-center justify-between">
          <div className="w-72 h-32 flex items-center">
            <img src={LOGO_URL} alt="Barber XPro" className="w-full h-full object-contain" />
          </div>
          <div className="hidden md:flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
            <a href="#funcionalidades" className="hover:text-blue-500 transition-colors">Recursos</a>
            <a href="#bi" className="hover:text-blue-500 transition-colors">Estatísticas</a>
            <a href="#rede" className="hover:text-blue-500 transition-colors">Rede Master</a>
          </div>
          <button 
            onClick={() => setView('LOGIN')}
            className="bg-white text-black px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl active:scale-95"
          >
            Acessar Painel
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-56 pb-32 px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-10 animate-slide-up">
          <Zap size={14} className="fill-blue-400" /> A Revolução na Gestão de Barbearias
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] mb-8 animate-slide-up text-white">
          A GESTÃO QUE O <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-400">PROFISSIONAL</span> MERECE.
        </h1>
        
        <p className="text-zinc-500 text-xl md:text-2xl font-medium max-w-3xl leading-relaxed mb-12 animate-slide-up" style={{animationDelay: '0.1s'}}>
          Controle sua agenda, comissões, faturamento e fidelidade em um único ecossistema focado no crescimento em escala.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-6 animate-slide-up" style={{animationDelay: '0.2s'}}>
          <button 
            onClick={() => setView('LOGIN')}
            className="px-12 py-6 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 shadow-2xl shadow-blue-500/20 transition-all flex items-center gap-3 group active:scale-95"
          >
            Começar Agora <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <div className="flex items-center gap-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
            <div className="flex -space-x-3">
               {[1,2,3,4].map(i => <img key={i} src={`https://i.pravatar.cc/100?u=${i+40}`} className="w-10 h-10 rounded-full border-4 border-black" />)}
            </div>
            <span>+2.500 Unidades Ativas</span>
          </div>
        </div>

        {/* Mockup with Glow Effect */}
        <div className="mt-24 relative w-full max-w-6xl mx-auto animate-slide-up" style={{animationDelay: '0.3s'}}>
           <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-[4rem] blur-2xl -z-10"></div>
           <div className="bg-zinc-900/50 rounded-[3rem] p-4 shadow-2xl border border-zinc-800 backdrop-blur-sm">
             <img src="https://i.ibb.co/Q7qB4VBy/monitor2.png" className="w-full h-auto rounded-[2rem] opacity-90" alt="Interface Barber Pro" />
           </div>
           {/* Floating Badge */}
           <div className="absolute -right-8 bottom-1/4 bg-blue-600 p-6 rounded-3xl shadow-2xl hidden lg:block border border-blue-400/20 animate-bounce" style={{ animationDuration: '4s' }}>
              <div className="flex items-center gap-3">
                <Star size={24} className="text-white fill-white" />
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase text-blue-100">Avaliação Média</p>
                  <p className="text-xl font-black text-white">4.9 / 5.0</p>
                </div>
              </div>
           </div>
        </div>
      </section>

      {/* Grid de Recursos - Dark Variant */}
      <section id="funcionalidades" className="py-32 bg-zinc-950 px-8 border-y border-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-white tracking-tighter mb-4">Arquitetura de Alta Performance</h2>
            <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em]">Tudo o que você precisa para dominar o mercado</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
               { title: "Agenda Inteligente", icon: CalendarCheck, desc: "Grid de horários com suporte a drag-and-drop e bloqueios automáticos sincronizados." },
               { title: "Monitor de TV", icon: MonitorPlay, desc: "Interface de recepção dedicada para que seus clientes acompanhem a fila em tempo real." },
               { title: "BI e Relatórios", icon: BarChart3, desc: "Dashboards analíticos de faturamento, ticket médio e performance por profissional." },
               { title: "SaaS Multi-tenant", icon: Database, desc: "Gerencie centenas de unidades em uma única rede com isolamento total de dados." },
               { title: "Agendamento Público", icon: Smartphone, desc: "Link personalizado para seus clientes agendarem direto pelo celular, sem complicações." },
               { title: "Infraestrutura Cloud", icon: ShieldCheck, desc: "Segurança de nível bancário com backup automático em planilhas Google dedicadas." }
             ].map((feature, idx) => (
               <div key={idx} className="p-10 rounded-[2.5rem] bg-zinc-900/50 border border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-900 transition-all group">
                  <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center text-blue-500 shadow-xl mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <feature.icon size={28} />
                  </div>
                  <h4 className="text-xl font-black mb-3 tracking-tight text-white">{feature.title}</h4>
                  <p className="text-zinc-500 font-medium text-sm leading-relaxed">{feature.desc}</p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="bi" className="py-32 px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { label: 'Unidades Ativas', val: '2.5k+' },
              { label: 'Cortes Realizados', val: '1.2M+' },
              { label: 'Ticket Médio', val: 'R$ 85' },
              { label: 'Retenção', val: '94%' }
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <p className="text-4xl md:text-5xl font-black text-white tracking-tighter">{stat.val}</p>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
      </section>

      {/* CTA Final - Black & Blue Glow */}
      <section className="py-32 px-8 max-w-6xl mx-auto text-center">
         <div className="bg-gradient-to-br from-zinc-900 to-black rounded-[4rem] p-16 md:p-24 text-white shadow-2xl relative overflow-hidden border border-zinc-800">
            <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12">
               <Scissors size={400} />
            </div>
            <div className="relative z-10 space-y-12">
               <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                 SUA BARBEARIA NO <br/> <span className="text-blue-500">PRÓXIMO NÍVEL.</span>
               </h2>
               <p className="text-zinc-500 text-lg md:text-2xl font-medium max-w-2xl mx-auto">
                 Pare de gerenciar através de papéis e planilhas confusas. Assuma o controle total do seu império hoje.
               </p>
               <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                 <button 
                  onClick={() => setView('LOGIN')}
                  className="px-16 py-7 bg-white text-black rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-2xl active:scale-95"
                 >
                   Ativar Minha Unidade
                 </button>
                 <button className="px-12 py-7 bg-zinc-800 text-zinc-300 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-zinc-700 transition-all border border-zinc-700">
                   Falar com Consultor
                 </button>
               </div>
            </div>
         </div>
      </section>

      <footer className="py-20 border-t border-zinc-900 text-center">
         <div className="flex flex-col items-center gap-6">
           <div className="w-72 h-32 opacity-90">
             <img src={LOGO_URL} alt="Footer Logo" className="w-full h-full object-contain" />
           </div>
           <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.5em]">
             © 2025 Barber Pro Manager - Elite SaaS Solution
           </p>
           <div className="flex gap-8 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
             <a href="#" className="hover:text-blue-500 transition-colors">Privacidade</a>
             <a href="#" className="hover:text-blue-500 transition-colors">Termos de Uso</a>
             <a href="#" className="hover:text-blue-500 transition-colors">Status da Rede</a>
           </div>
         </div>
      </footer>
    </div>
  );
};
