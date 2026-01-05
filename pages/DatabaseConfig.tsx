
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Database, Server, ShieldCheck, Globe, Lock, CheckCircle2, RefreshCw, Link, FileSpreadsheet, ExternalLink } from 'lucide-react';

export const DatabaseConfig = () => {
  const { selectedBarbershop, syncWithGoogleSheets } = useApp();
  const [isVerifying, setIsVerifying] = useState(false);

  const handleTestConnection = async () => {
    if (!selectedBarbershop?.googleSheetsUrl) return;
    setIsVerifying(true);
    await syncWithGoogleSheets(selectedBarbershop.googleSheetsUrl);
    setTimeout(() => setIsVerifying(false), 1500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-800 p-10">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20">
              <FileSpreadsheet size={40} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">Infraestrutura em Nuvem</h2>
              <p className="text-zinc-500 font-bold">Dados processados via Google Sheets & Apps Script.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500 text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck size={16} /> Status: Online & Sincronizado
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Status do Sheet */}
          <div className="bg-black/40 rounded-[2rem] p-8 border border-zinc-800 space-y-6">
            <h3 className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em] mb-4">Conexão da Unidade</h3>
            <div className="space-y-4">
               <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                  <span className="text-xs font-bold text-zinc-500 uppercase">Motor de Dados</span>
                  <span className="text-xs font-black text-white">Google Apps Script API</span>
               </div>
               <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                  <span className="text-xs font-bold text-zinc-500 uppercase">Acesso</span>
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-emerald-500" />
                    <span className="text-xs font-black text-white">Google Cloud Region</span>
                  </div>
               </div>
               <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                  <span className="text-xs font-bold text-zinc-500 uppercase">Latência Sync</span>
                  <span className="text-xs font-black text-emerald-500">~1.2s</span>
               </div>
            </div>
          </div>

          {/* Segurança Tenant */}
          <div className="bg-zinc-800/50 rounded-[2rem] p-8 text-white space-y-6 relative overflow-hidden border border-zinc-700">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Lock size={120} />
            </div>
            <div className="relative z-10">
              <h3 className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mb-4">Segurança Multi-Tenant</h3>
              <p className="text-sm font-medium text-zinc-400 leading-relaxed mb-6">
                Sua barbearia utiliza uma planilha isolada. O Barber Pro Manager atua apenas como interface, garantindo que a propriedade dos dados permaneça na sua conta Google.
              </p>
              <div className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-zinc-700">
                <Link size={24} className="text-emerald-500" />
                <div className="overflow-hidden">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white">Script Endpoint</p>
                  <code className="text-[9px] text-zinc-500 font-mono truncate block">
                    {selectedBarbershop?.googleSheetsUrl || 'Não configurado'}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-12 border-t border-zinc-800">
          <div className="bg-zinc-800/30 border border-zinc-700 rounded-3xl p-8 flex items-start gap-6">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
               <RefreshCw size={24} />
            </div>
            <div className="space-y-2">
              <h4 className="font-black text-white">Sincronização de Tabelas</h4>
              <p className="text-sm text-zinc-400 font-medium">
                Sempre que você altera dados diretamente na planilha do Google, pode forçar uma atualização aqui para garantir que a agenda e o monitor de TV estejam refletindo a realidade.
              </p>
              <div className="pt-4 flex items-center gap-4">
                <button 
                  onClick={handleTestConnection}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-emerald-500/10 hover:bg-emerald-700 transition-all"
                >
                  {isVerifying ? <RefreshCw size={16} className="animate-spin" /> : <><CheckCircle2 size={16} /> Sincronizar Agora</>}
                </button>
                <a 
                  href={selectedBarbershop?.googleSheetsUrl?.replace('/exec', '')} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-zinc-800 text-zinc-400 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-zinc-700 hover:text-white transition-all border border-zinc-700"
                >
                   <ExternalLink size={16} /> Abrir Planilha
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
