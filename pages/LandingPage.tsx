
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LOGO_URL } from '../constants';
import { 
  Scissors, 
  MonitorPlay, 
  Smartphone, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Globe, 
  Zap, 
  ChevronRight, 
  Database, 
  CheckCircle,
  MessageCircle,
  BarChart3,
  Users,
  X,
  ArrowRight,
  Wallet,
  Box,
  Heart,
  Clock,
  Layout,
  CalendarCheck,
  Award,
  Crown
} from 'lucide-react';

interface FeatureDetail {
  id: string;
  icon: any;
  title: string;
  shortDesc: string;
  longDesc: string;
  benefits: string[];
  color: string;
}

const Calendar = (props: any) => <CalendarCheck {...props} />;

const FEATURES: FeatureDetail[] = [
  {
    id: 'agendamento',
    icon: Calendar,
    title: "Agendamento 24/7",
    shortDesc: "Sua agenda trabalha enquanto você dorme. Link personalizado para clientes marcarem via Instagram ou WhatsApp.",
    longDesc: "Elimine o tempo gasto respondendo mensagens para marcar horários. Com o nosso link de agendamento online, seu cliente escolhe o serviço, o barbeiro e o horário em segundos. O sistema envia lembretes automáticos via WhatsApp para garantir que ele não esqueça, reduzindo o no-show em até 90%.",
    benefits: ["Link de agendamento exclusivo", "Lembretes automáticos via WhatsApp", "Bloqueio de horários em tempo real"],
    color: "bg-blue-500/20 text-blue-400"
  },
  {
    id: 'financeiro',
    icon: Wallet,
    title: "Comissões e Financeiro",
    shortDesc: "Chega de erros no fim do mês. Cálculo automático de comissões e fluxo de caixa completo.",
    longDesc: "Gerencie as finanças da sua barbearia com precisão cirúrgica. O sistema calcula a comissão de cada profissional instantaneamente após cada serviço. Tenha relatórios de entradas, saídas e lucro líquido com um clique, sem precisar de planilhas manuais complexas.",
    benefits: ["Cálculo automático de comissões", "Fluxo de caixa detalhado", "Gestão de despesas fixas e variáveis"],
    color: "bg-emerald-500/20 text-emerald-400"
  },
  {
    id: 'crm',
    icon: Heart,
    title: "CRM & Fidelização",
    shortDesc: "Transforme clientes casuais em recorrentes com perfis analíticos e clubes de vantagens.",
    longDesc: "O lucro da barbearia está na recorrência. Com o nosso CRM, você entende o padrão de cada cliente: quanto ele gasta, quais serviços prefere e quais dias costuma vir. Crie planos de fidelidade e assinaturas personalizadas para garantir receita recorrente e previsível.",
    benefits: ["Análise de padrão de consumo", "Gestão de Planos de Assinatura", "Automação de Marketing para inativos"],
    color: "bg-purple-500/20 text-purple-400"
  },
  {
    id: 'membership',
    icon: Crown,
    title: "Clube de Assinatura",
    shortDesc: "Garanta o faturamento do mês no dia 01. Planos semanais e mensais para seus melhores clientes.",
    longDesc: "Implemente um sistema de recorrência real. Identifique clientes que cortam toda semana e ofereça planos exclusivos. O sistema gerencia as cobranças e o saldo de cortes de cada assinante, fidelizando o cliente e estabilizando seu caixa.",
    benefits: ["Receita recorrente garantida", "Controle de saldo de serviços", "Benefícios exclusivos para sócios"],
    color: "bg-amber-500/20 text-amber-400"
  },
  {
    id: 'bi',
    icon: BarChart3,
    title: "Gestão Baseada em Dados",
    shortDesc: "Dashboards profissionais com os números que realmente importam para o crescimento do seu negócio.",
    longDesc: "Saiba exatamente quem é seu melhor barbeiro, qual serviço é o mais rentável e qual sua taxa de ocupação mensal. Com relatórios intuitivos e dashboards modernos, você para de 'achar' e começa a decidir com base em dados reais.",
    benefits: ["Ranking de produtividade da equipe", "Análise de ticket médio mensal", "Projeção de faturamento futuro"],
    color: "bg-rose-500/20 text-rose-400"
  },
  {
    id: 'tv',
    icon: MonitorPlay,
    title: "Monitor de TV Profissional",
    shortDesc: "Eleve o status da sua recepção com um monitor de atendimentos em tempo real.",
    longDesc: "Dê um ar de tecnologia e organização à sua barbearia. O monitor de TV exibe quem está sendo atendido e quem é o próximo, trazendo autoridade para sua marca e transparência para os clientes que aguardam na recepção.",
    benefits: ["Visual profissional de alto impacto", "Organização da fila de espera", "Sincronização instantânea com a agenda"],
    color: "bg-indigo-500/20 text-indigo-400"
  }
];

export const LandingPage = () => {
  const { setView } = useApp();
  const [selectedFeature, setSelectedFeature] = useState<FeatureDetail | null>(null);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const FeatureCard = ({ feature }: { feature: FeatureDetail }) => (
    <div 
      onClick={() => setSelectedFeature(feature)}
      className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-md hover:bg-white/10 transition-all group cursor-pointer hover:scale-[1.02] active:scale-95 flex flex-col h-full"
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${feature.color}`}>
        <feature.icon size={30} />
      </div>
      <h4 className="text-xl font-black text-white mb-3 tracking-tight">{feature.title}</h4>
      <p className="text-gray-400 text-sm leading-relaxed font-medium flex-1">{feature.shortDesc}</p>
      <div className="mt-6 flex items-center gap-2 text-xs font-black text-blue-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
        Ver detalhes <ArrowRight size={14} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden font-sans selection:bg-blue-500 selection:text-white">
      {/* Background Glows */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-2 max-w-7xl mx-auto">
        <div className="flex items-center">
          <div className="w-64 sm:w-80 h-28 flex items-center justify-center">
             <img src={LOGO_URL} alt="Barber Pro Manager" className="w-full h-full object-contain" />
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
           <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors cursor-pointer">Funcionalidades</button>
           <button onClick={() => scrollToSection('proposito')} className="hover:text-white transition-colors cursor-pointer">Nosso Propósito</button>
           <button onClick={() => scrollToSection('impacto')} className="hover:text-white transition-colors cursor-pointer">Impacto</button>
        </div>
        <button 
          onClick={() => setView('LOGIN')}
          className="bg-white text-black px-8 py-3.5 rounded-full font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95"
        >
          Acessar Painel
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-32 px-8 max-w-7xl mx-auto text-center md:text-left flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
           <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-[0.3em]">
             <Sparkles size={14} className="fill-blue-400" /> Domine o Mercado de Barbearias
           </div>
           <h1 className="text-5xl md:text-7xl font-black leading-[0.95] tracking-tighter">
             PARE DE GESTIONAR. <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-600">COMECE A LUCRAR.</span>
           </h1>
           <p className="text-gray-400 text-lg md:text-2xl font-medium max-w-2xl leading-relaxed">
             A plataforma definitiva para barbeiros que buscam liberdade de tempo e controle financeiro absoluto em uma única tela.
           </p>
           <div className="flex flex-col sm:flex-row items-center gap-6">
              <button 
                onClick={() => setView('LOGIN')}
                className="w-full sm:w-auto px-12 py-6 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 shadow-2xl shadow-blue-500/30 transition-all flex items-center justify-center gap-3 group active:scale-95"
              >
                Ativar Barber Pro <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="flex flex-col items-center sm:items-start gap-2">
                <div className="flex -space-x-3">
                   {[1,2,3,4].map(i => <img key={i} src={`https://i.pravatar.cc/100?u=${i+10}`} className="w-10 h-10 rounded-full border-2 border-black" />)}
                   <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-black flex items-center justify-center text-[10px] font-black">+1.2k</div>
                </div>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Empresários usando o sistema agora</p>
              </div>
           </div>
        </div>
        
        <div className="flex-1 relative animate-in fade-in slide-in-from-right-8 duration-1000 w-full">
           <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[4rem] p-1 shadow-2xl absolute inset-0 blur-[60px] opacity-20"></div>
           <div className="relative group/monitor">
              <img 
                src="https://i.ibb.co/Q7qB4VBy/monitor2.png" 
                className="w-full h-auto opacity-90 group-hover/monitor:opacity-100 transition-all duration-1000 shadow-2xl block scale-120 md:scale-[1.3] origin-center" 
                alt="Monitor Profissional" 
              />
           </div>
        </div>
      </section>

      {/* Propósito / Gatilhos */}
      <section id="proposito" className="py-32 px-8 max-w-7xl mx-auto scroll-mt-24">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-12">
               <div className="space-y-4">
                  <h2 className="text-xs font-black text-blue-500 uppercase tracking-[0.5em]">O Desafio do Barbeiro</h2>
                  <h3 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight">
                    Você abriu sua barbearia para <span className="text-blue-500">cortar cabelo</span>, não para preencher planilhas.
                  </h3>
               </div>
               
               <div className="space-y-8">
                  {[
                    { title: "Recupere 10h da sua semana", desc: "Automação completa do agendamento e confirmação." },
                    { title: "Elimine o estresse financeiro", desc: "Comissões e lucros calculados em tempo real, sem erros." },
                    { title: "Valorize sua marca", desc: "Uma experiência digital que seu cliente nunca esquece." }
                  ].map((p, i) => (
                    <div key={i} className="flex gap-6 group">
                       <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <CheckCircle size={28} />
                       </div>
                       <div>
                          <h4 className="text-xl font-black text-white">{p.title}</h4>
                          <p className="text-gray-400 font-medium">{p.desc}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
            <div className="relative">
               <div className="bg-zinc-900 border border-white/10 p-12 rounded-[4rem] space-y-8 relative z-10">
                  <h4 className="text-3xl font-black tracking-tight text-center">Focado no seu <span className="text-emerald-400">Crescimento</span></h4>
                  <div className="space-y-4">
                     <div className="bg-white/5 p-6 rounded-3xl flex justify-between items-center">
                        <span className="text-gray-400 font-bold">Taxa de Ocupação</span>
                        <span className="text-emerald-400 font-black">92.4% ↑</span>
                     </div>
                     <div className="bg-white/5 p-6 rounded-3xl flex justify-between items-center">
                        <span className="text-gray-400 font-bold">Ticket Médio</span>
                        <span className="text-blue-400 font-black">R$ 68,00</span>
                     </div>
                     <div className="bg-white/5 p-6 rounded-3xl flex justify-between items-center">
                        <span className="text-gray-400 font-bold">Retenção de Clientes</span>
                        <span className="text-purple-400 font-black">88%</span>
                     </div>
                  </div>
                  <button onClick={() => setView('LOGIN')} className="w-full py-6 bg-white text-black rounded-3xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-all">
                     Ver Meu Dashboard
                  </button>
               </div>
               <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full"></div>
            </div>
         </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-8 max-w-7xl mx-auto scroll-mt-24">
        <div className="text-center mb-20 space-y-4">
           <h2 className="text-xs font-black text-blue-500 uppercase tracking-[0.5em]">Funcionalidades Elite</h2>
           <h3 className="text-4xl md:text-5xl font-black tracking-tight">Um ecossistema completo para sua elite.</h3>
           <p className="text-gray-500 text-lg font-medium max-w-2xl mx-auto">Tudo que você precisa para centralizar a operação, eliminar erros e decidir com estratégia.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {FEATURES.map(f => (
             <FeatureCard key={f.id} feature={f} />
           ))}
        </div>
      </section>

      {/* Impact Section */}
      <section id="impacto" className="py-32 bg-zinc-950 border-y border-white/5 overflow-hidden">
         <div className="max-w-7xl mx-auto px-8">
            <div className="flex flex-col lg:flex-row gap-20 items-center">
               <div className="flex-1 space-y-10">
                  <h3 className="text-5xl font-black tracking-tighter">Barber Pro Manager: <br/> Onde o estilo encontra a <span className="text-blue-500">Lucratividade.</span></h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div className="p-8 bg-zinc-900 rounded-[2.5rem] border border-white/5 space-y-2">
                        <div className="text-4xl font-black text-white">Web & App</div>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Acesso de qualquer lugar</p>
                     </div>
                     <div className="p-8 bg-zinc-900 rounded-[2.5rem] border border-white/5 space-y-2">
                        <div className="text-4xl font-black text-white">IA Gemini</div>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Insights automáticos do Google</p>
                     </div>
                  </div>
               </div>
               <div className="flex-1 relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-blue-600/10 blur-[120px] rounded-full"></div>
                  <div className="relative z-10 flex gap-4">
                     <div className="p-12 bg-white rounded-[3.5rem] flex flex-col items-center justify-center text-black shadow-2xl">
                        <Smartphone size={64} className="mb-4" />
                        <span className="font-black text-4xl">100%</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Responsivo</span>
                     </div>
                     <div className="p-12 bg-blue-600 rounded-[3.5rem] flex flex-col items-center justify-center text-white shadow-2xl mt-12">
                        <Layout size={64} className="mb-4" />
                        <span className="font-black text-4xl">All-in</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">One Platform</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-8 max-w-5xl mx-auto text-center">
        <div className="bg-gradient-to-br from-blue-700 via-indigo-900 to-zinc-950 rounded-[4rem] p-16 md:p-24 space-y-12 shadow-2xl relative overflow-hidden border border-white/10">
           <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
              <Scissors size={500} className="-rotate-45 -translate-x-1/2 -translate-y-1/2" />
           </div>
           <div className="space-y-6 relative z-10">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter">Sua barbearia merece o <span className="text-blue-400">Próximo Nível.</span></h2>
              <p className="text-blue-100 text-lg md:text-2xl font-medium max-w-2xl mx-auto opacity-80">Junte-se a rede que está redefinindo o padrão de excelência na barbearia brasileira.</p>
           </div>
           <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
              <button 
                onClick={() => setView('LOGIN')}
                className="bg-white text-black px-16 py-7 rounded-3xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-2xl active:scale-95 w-full sm:w-auto"
              >
                Ativar Unidade Agora
              </button>
              <button onClick={() => scrollToSection('features')} className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-opacity">
                Conhecer Recursos <ArrowRight size={16} />
              </button>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 border-t border-white/10 text-center">
         <div className="flex flex-col items-center gap-6">
            <div className="w-48 h-16 flex items-center justify-center">
               <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain grayscale opacity-30" />
            </div>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.5em]">© 2025 Barber Pro Manager - Transformando Barbeiros em Empresários</p>
         </div>
      </footer>

      {/* Feature Detail Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-3xl bg-black/80 animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-white/10 rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 md:p-12 space-y-8">
              <div className="flex justify-between items-start">
                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center ${selectedFeature.color}`}>
                  <selectedFeature.icon size={40} />
                </div>
                <button 
                  onClick={() => setSelectedFeature(null)}
                  className="bg-white/5 hover:bg-white/10 p-4 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="text-3xl md:text-4xl font-black tracking-tight">{selectedFeature.title}</h3>
                <p className="text-gray-400 text-lg leading-relaxed font-medium">
                  {selectedFeature.longDesc}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">O Que Você Ganha</h4>
                <div className="grid grid-cols-1 gap-3">
                  {selectedFeature.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                      <div className="w-5 h-5 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center shrink-0">
                        <CheckCircle size={14} />
                      </div>
                      <span className="text-sm font-bold text-gray-200">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => { setSelectedFeature(null); setView('LOGIN'); }}
                  className="flex-1 bg-white text-black py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl active:scale-95"
                >
                  Ativar Funcionalidade
                </button>
                <button 
                  onClick={() => setSelectedFeature(null)}
                  className="flex-1 bg-white/5 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all active:scale-95"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
