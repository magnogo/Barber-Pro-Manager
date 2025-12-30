import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateWhatsAppMessage } from '../services/geminiService';
import { MessageCircle, Wand2, Smartphone, Save, QrCode, RefreshCw, CheckCircle2 } from 'lucide-react';
import { WhatsAppConfig } from '../types';

export const WhatsAppConfigPage = () => {
  const { currentUser, barbershops, updateBarbershopConfig } = useApp();
  
  const myShop = barbershops.find(s => s.id === currentUser?.barbershopId);
  const [config, setConfig] = useState<WhatsAppConfig>(myShop?.whatsappConfig || {
    welcomeMessage: '',
    menuOptions: [],
    confirmationMessage: ''
  });
  
  const [loadingAi, setLoadingAi] = useState(false);
  const [isConnected, setIsConnected] = useState(false); // Simulação de estado de conexão

  const handleAiGenerate = async (type: 'welcome' | 'confirmation') => {
    if (!myShop) return;
    setLoadingAi(true);
    const text = await generateWhatsAppMessage(myShop.name, 'friendly', type);
    setConfig(prev => ({
      ...prev,
      [type === 'welcome' ? 'welcomeMessage' : 'confirmationMessage']: text
    }));
    setLoadingAi(false);
  };

  const handleSave = () => {
    if (myShop) {
      updateBarbershopConfig(myShop.id, config);
      alert('Configuração do WhatsApp salva!');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      
      {/* Coluna Esquerda: Status e Conexão */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
        {/* Card de Conexão */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center justify-center border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Smartphone size={20} className={isConnected ? "text-green-500" : "text-gray-400"}/> 
                Status da Conexão
            </h3>
            
            {isConnected ? (
                <div className="flex flex-col items-center animate-fade-in">
                    <div className="w-48 h-48 bg-green-50 rounded-xl flex items-center justify-center border-2 border-green-500 mb-4">
                        <CheckCircle2 size={64} className="text-green-600" />
                    </div>
                    <p className="text-green-700 font-bold mb-2">Conectado!</p>
                    <p className="text-xs text-gray-500 text-center">Instância rodando e pronta para automação.</p>
                    <button 
                        onClick={() => setIsConnected(false)}
                        className="mt-4 text-red-500 text-xs hover:underline"
                    >
                        Desconectar
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center">
                    <div className="w-48 h-48 bg-gray-900 rounded-xl flex items-center justify-center relative group cursor-pointer overflow-hidden border-4 border-gray-800" onClick={() => setIsConnected(true)}>
                        <QrCode size={120} className="text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-bold text-sm">Clique para Simular Scan</span>
                        </div>
                    </div>
                    <p className="text-gray-600 font-medium mt-4 text-sm">Escaneie o QR Code no seu WhatsApp</p>
                    <p className="text-xs text-gray-400 mt-1">Acesse Configurações {'>'} Aparelhos Conectados</p>
                </div>
            )}
        </div>

        {/* Preview do Mobile (Movido para cá em telas grandes) */}
        <div className="hidden lg:block bg-gray-900 rounded-[30px] p-3 shadow-2xl flex-1 border-4 border-gray-800 relative max-h-[500px]">
            <div className="bg-[#e5ddd5] w-full h-full rounded-[24px] overflow-hidden flex flex-col relative">
                <div className="bg-[#075e54] p-3 flex items-center text-white space-x-2 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gray-300"></div>
                    <div className="flex-1">
                        <p className="text-sm font-bold truncate">{myShop?.name}</p>
                        <p className="text-[10px] opacity-80">{isConnected ? 'Online' : 'Visto por último hoje'}</p>
                    </div>
                </div>
                <div className="flex-1 p-3 space-y-4 overflow-y-auto">
                    <div className="bg-white p-2 rounded-lg rounded-tl-none shadow text-xs max-w-[80%] text-gray-800">
                        {config.welcomeMessage || '...'}
                        <p className="text-[9px] text-gray-400 text-right mt-1">10:00</p>
                    </div>
                    {config.menuOptions.length > 0 && (
                        <div className="bg-white p-2 rounded-lg rounded-tl-none shadow text-xs max-w-[80%] text-gray-800">
                            Menu:
                            <ul className="list-decimal pl-4 mt-1">
                                {config.menuOptions.map((opt, i) => <li key={i}>{opt}</li>)}
                            </ul>
                            <p className="text-[9px] text-gray-400 text-right mt-1">10:00</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Coluna Direita: Editor */}
      <div className="flex-1 bg-white rounded-xl shadow-sm p-6 overflow-y-auto space-y-8">
        <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Fluxo de Automação</h3>
            <p className="text-gray-500 text-sm">Configure as mensagens automáticas.</p>
        </div>

        {/* Step 1: Greeting */}
        <div className="p-4 border border-gray-200 rounded-xl relative group">
            <div className="absolute -left-3 top-4 bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</div>
            <div className="flex justify-between items-center mb-2">
                <label className="font-semibold text-gray-700">Boas-vindas</label>
                <button 
                    onClick={() => handleAiGenerate('welcome')}
                    disabled={loadingAi}
                    className="flex items-center text-xs text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded transition-colors"
                >
                    <Wand2 size={12} className="mr-1" />
                    IA
                </button>
            </div>
            <textarea
                value={config.welcomeMessage}
                onChange={(e) => setConfig({...config, welcomeMessage: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                placeholder="Olá {nome}, bem-vindo..."
            />
        </div>

        {/* Step 2: Menu */}
        <div className="p-4 border border-gray-200 rounded-xl relative">
            <div className="absolute -left-3 top-4 bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</div>
            <label className="font-semibold text-gray-700 block mb-2">Opções do Menu</label>
            <div className="space-y-2">
                {config.menuOptions.map((opt, idx) => (
                    <input
                        key={idx}
                        value={opt}
                        onChange={(e) => {
                            const newOpts = [...config.menuOptions];
                            newOpts[idx] = e.target.value;
                            setConfig({...config, menuOptions: newOpts});
                        }}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-gray-50"
                    />
                ))}
                <button 
                    onClick={() => setConfig({...config, menuOptions: [...config.menuOptions, `Opção ${config.menuOptions.length + 1}`]})}
                    className="text-sm text-blue-600 hover:underline font-medium"
                >
                    + Adicionar Item
                </button>
            </div>
        </div>

         {/* Step 3: Confirmation */}
         <div className="p-4 border border-gray-200 rounded-xl relative">
            <div className="absolute -left-3 top-4 bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</div>
            <div className="flex justify-between items-center mb-2">
                <label className="font-semibold text-gray-700">Confirmação</label>
                <button 
                    onClick={() => handleAiGenerate('confirmation')}
                    disabled={loadingAi}
                    className="flex items-center text-xs text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded transition-colors"
                >
                    <Wand2 size={12} className="mr-1" />
                    IA
                </button>
            </div>
            <textarea
                value={config.confirmationMessage}
                onChange={(e) => setConfig({...config, confirmationMessage: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
            />
        </div>

        <button 
            onClick={handleSave}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-lg"
        >
            <Save size={18} /> Salvar Configuração
        </button>

      </div>
    </div>
  );
};