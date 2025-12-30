
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LOGO_URL } from '../constants';
import { Lock, Mail, Loader2, LogIn, ShieldCheck, Globe, ArrowLeft, AlertCircle } from 'lucide-react';

export const Login = () => {
  const { login, loading, loginError, setLoginError, setView } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Limpa erros ao mudar de view
  useEffect(() => {
    return () => setLoginError(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    try {
      await login(email, password);
    } catch (err: any) {
      // Erro reportado via contexto
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Botão de Voltar para o Site (Landing Page) */}
      <button 
        onClick={() => setView('MARKETING')}
        className="absolute top-8 left-8 text-zinc-500 hover:text-white flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all"
      >
        <ArrowLeft size={16} /> Voltar para o Site
      </button>

      <div className="bg-zinc-950 rounded-[2.5rem] shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row border border-zinc-900">
        
        {/* Lado Esquerdo - Formulário (Totalmente Preto) */}
        <div className="md:w-1/2 p-12 md:p-16 flex flex-col justify-center bg-black relative">
          
          <div className="mb-10 text-center md:text-left">
            <div className="flex flex-col items-center gap-3 mb-8 justify-center md:justify-start">
               <div className="w-48 h-20 flex items-center justify-center">
                 <img src={LOGO_URL} alt="Barber Pro Manager" className="w-full h-full object-contain" />
               </div>
            </div>
            <h1 className="text-4xl font-black text-white mb-3 tracking-tighter">
                Acesso à Rede
            </h1>
            <p className="text-zinc-500 font-bold text-sm">
                Entre com suas credenciais de franqueado ou gerente de unidade.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {loginError && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="text-red-500 shrink-0" size={20} />
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{loginError}</p>
              </div>
            )}

            <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">E-mail de Acesso</label>
                <div className="relative group">
                    <Mail className="absolute left-4 top-4 text-zinc-700 group-focus-within:text-blue-500 transition-colors" size={20}/>
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={e => {
                          setEmail(e.target.value);
                          if(loginError) setLoginError(null);
                        }}
                        className={`w-full pl-12 pr-4 py-4 bg-zinc-950 border-2 rounded-2xl outline-none transition-all font-bold text-white shadow-sm placeholder:text-zinc-800 ${loginError ? 'border-red-500/30 focus:border-red-500' : 'border-zinc-900 focus:border-blue-600'}`}
                        placeholder="exemplo@franquia.com"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Senha</label>
                <div className="relative group">
                    <Lock className="absolute left-4 top-4 text-zinc-700 group-focus-within:text-blue-500 transition-colors" size={20}/>
                    <input 
                        type="password" 
                        required
                        value={password}
                        onChange={e => {
                          setPassword(e.target.value);
                          if(loginError) setLoginError(null);
                        }}
                        className="w-full pl-12 pr-4 py-4 bg-zinc-950 border-2 border-zinc-900 rounded-2xl focus:border-blue-600 outline-none transition-all font-bold text-white shadow-sm placeholder:text-zinc-800"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-black py-5 rounded-2xl transition-all shadow-xl hover:bg-zinc-200 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 text-xs uppercase tracking-widest"
            >
              {loading ? (
                  <Loader2 size={24} className="animate-spin text-black"/>
              ) : (
                  <>Autenticar na Nuvem <LogIn size={18}/></>
              )}
            </button>
            
            <div className="text-center pt-8 border-t border-zinc-900 flex flex-col gap-4">
                <div className="flex items-center justify-center gap-2 text-[10px] font-black text-zinc-700 uppercase tracking-widest">
                  <Globe size={14} />
                  Rede Barber Pro Manager Sincronizada
                </div>
            </div>
          </form>
        </div>

        {/* Lado Direito - Banner */}
        <div className="md:w-1/2 bg-[#0c0d0f] p-16 text-white flex flex-col justify-center relative overflow-hidden border-l border-zinc-900">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full mix-blend-screen filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full mix-blend-screen filter blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>
          
          <div className="relative z-10 space-y-10">
            <div>
              <h2 className="text-5xl font-black mb-6 tracking-tighter leading-[0.9]">Infraestrutura em Nuvem via Google Sheets</h2>
              <p className="text-zinc-500 font-bold leading-relaxed text-sm">
                  Gerenciamento multi-unidade sem necessidade de servidores complexos. 
                  Seu banco de dados reside onde você já trabalha: no Google Drive.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { label: 'Multi-Tenant Master', desc: 'Controle de rede centralizado em planilha mestre.' },
                { label: 'Unidades Independentes', desc: 'Cada barbearia com sua própria planilha isolada.' },
                { label: 'Automação Inteligente', desc: 'WhatsApp e Agenda sincronizados em tempo real.' }
              ].map((item, idx) => (
                <div key={idx} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[2rem] backdrop-blur-md">
                   <h4 className="font-black text-blue-500 text-[10px] uppercase tracking-widest mb-1">{item.label}</h4>
                   <p className="text-[10px] text-zinc-500 font-bold leading-tight">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-4 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
               Status da Rede: Online & Sincronizado
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
