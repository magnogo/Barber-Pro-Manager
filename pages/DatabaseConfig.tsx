
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { Database, FileSpreadsheet, Code, Save, ShieldAlert, Info, AlertTriangle, CheckCircle2, Link, Globe, XCircle } from 'lucide-react';
import { fetchSheetData } from '../services/googleSheetsService';

export const DatabaseConfig = () => {
  const { masterUrl, setMasterUrl, currentUser, selectedBarbershop, updateBarbershop } = useApp();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | 'wrong_link' | null>(null);
  const [showScript, setShowScript] = useState(false);
  const [localUrl, setLocalUrl] = useState('');

  // Verifica se o usuário logado é o Administrador Geral da Rede (SaaS Master)
  const isPlatformOwner = currentUser?.role === Role.SUPER_ADMIN;
  
  // Verifica se o contexto atual é a gestão da rede ou de uma unidade específica pelo Super Admin
  const isNetworkView = isPlatformOwner && !selectedBarbershop;

  useEffect(() => {
    // Carrega a URL correta baseada no contexto (Master URL ou URL da Unidade)
    if (isNetworkView) {
      setLocalUrl(masterUrl);
    } else if (selectedBarbershop) {
      setLocalUrl(selectedBarbershop.googleSheetsUrl || '');
    }
  }, [masterUrl, selectedBarbershop, isNetworkView]);

  // Efeito para testar conexão automaticamente para o gestor da unidade (sem campo de URL)
  useEffect(() => {
    if (!isPlatformOwner && localUrl) {
        testConnectionAuto();
    }
  }, [localUrl, isPlatformOwner]);

  const testConnectionAuto = async () => {
    if (!localUrl.includes('/exec')) {
        setTestResult('error');
        return;
    }
    setIsTesting(true);
    try {
        const tabToTest = 'Clientes';
        const data = await fetchSheetData(localUrl, tabToTest);
        setTestResult(data ? 'success' : 'error');
    } catch (e) {
        setTestResult('error');
    } finally {
        setIsTesting(false);
    }
  };

  const handleTestAndSave = async () => {
      if (!localUrl.includes('/exec')) {
          setTestResult('wrong_link');
          return;
      }
      setIsTesting(true);
      try {
          const tabToTest = isNetworkView ? 'Empresas' : 'Clientes';
          const data = await fetchSheetData(localUrl, tabToTest);
          
          if (data) {
              setTestResult('success');
              if (isNetworkView) {
                  setMasterUrl(localUrl);
                  alert("Conexão Master atualizada com sucesso!");
              } else if (selectedBarbershop) {
                  await updateBarbershop({
                      ...selectedBarbershop,
                      googleSheetsUrl: localUrl
                  });
                  alert("URL da unidade salva na Planilha Mestre e sincronizada!");
              }
          } else {
              setTestResult('error');
          }
      } catch (e) {
          setTestResult('error');
      } finally {
          setIsTesting(false);
      }
  };

  const scriptCode = `/** 
 * BARBERPRO UNIT DRIVER V22
 * Script para Planilha de Unidade Individual
 */
const EXPECTED_HEADERS = {
  'Clientes': ['id', 'barbershopId', 'name', 'phone', 'email', 'photo'],
  'Servicos': ['id', 'barbershopId', 'name', 'durationMinutes', 'price'],
  'Funcionarios': ['id', 'barbershopId', 'name', 'nickname', 'email', 'position', 'role', 'useSchedule', 'startTime', 'endTime', 'workDays', 'photo'],
  'Agendamentos': ['id', 'barbershopId', 'barberId', 'clientId', 'serviceId', 'date', 'time', 'status']
};
function doGet(e) { ... }
function doPost(e) { ... }
function createResponse(data) { ... }`;

  const headersInfo = isNetworkView ? [
    { tab: 'Empresas', cols: ['id', 'name', 'address', 'phone', 'email', 'logo', 'isActive', 'googleSheetsUrl', 'plan', 'monthlyFee'], desc: 'Cadastro geral das unidades da rede.' },
    { tab: 'ControlePagamentos', cols: ['id', 'barbershopId', 'amount', 'date', 'status', 'method', 'referenceMonth'], desc: 'Histórico de mensalidades pagas pelas unidades.' },
    { tab: 'AdministradoresUnidades', cols: ['id', 'barbershopId', 'name', 'email', 'role', 'status', 'password'], desc: 'Logins dos donos/gerentes de cada barbearia.' }
  ] : [
    { tab: 'Clientes', cols: ['id', 'barbershopId', 'name', 'phone', 'email', 'photo'], desc: 'Seus clientes sincronizados.' },
    { tab: 'Servicos', cols: ['id', 'barbershopId', 'name', 'durationMinutes', 'price'], desc: 'Seu catálogo de serviços.' },
    { tab: 'Agendamentos', cols: ['id', 'barbershopId', 'barberId', 'clientId', 'serviceId', 'date', 'time', 'status'], desc: 'Todos os horários marcados.' }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl text-white shadow-lg ${isNetworkView ? 'bg-blue-600 shadow-blue-100' : 'bg-indigo-600 shadow-indigo-100'}`}>
              <Database size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">
                {isNetworkView ? 'Banco de Dados da Rede (Master)' : 'Banco de Dados da Unidade'}
              </h2>
              <p className="text-gray-500 font-bold text-sm">
                {isNetworkView 
                  ? 'Configuração da Planilha Mestre que gerencia todos os franqueados.' 
                  : `Status da sincronização para: ${selectedBarbershop?.name}`}
              </p>
            </div>
          </div>
          
          {isPlatformOwner && (
            <button 
                onClick={() => setShowScript(!showScript)}
                className="px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-black hover:bg-black transition-all flex items-center gap-2"
            >
                <Code size={18} /> {showScript ? 'Ocultar Código' : 'Gerar Script V22'}
            </button>
          )}
        </div>

        {/* Lado do Gestor da Barbearia (Apenas Visualização de Status) */}
        {!isPlatformOwner && (
            <div className="space-y-6 mb-10">
                <div className={`p-12 rounded-[2.5rem] border-2 flex flex-col items-center text-center transition-all ${
                    testResult === 'success' ? 'bg-green-50 border-green-200 shadow-lg shadow-green-50' : 'bg-gray-50 border-gray-100'
                }`}>
                    {isTesting ? (
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                            <div className="space-y-2">
                                <p className="font-black text-gray-900 uppercase tracking-widest text-sm">Consultando Servidor Google</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Aguarde a sincronização de dados...</p>
                            </div>
                        </div>
                    ) : testResult === 'success' ? (
                        <div className="animate-in fade-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-200">
                                <CheckCircle2 size={48} />
                            </div>
                            <h3 className="text-3xl font-black text-green-900 mb-3 tracking-tight">Conectado</h3>
                            <p className="text-green-700 font-bold text-sm max-w-sm mb-8">
                                Sua barbearia está operando em nuvem. Todos os agendamentos e clientes estão sendo salvos em tempo real.
                            </p>
                            <div className="flex items-center gap-3 px-8 py-3 bg-white border border-green-200 rounded-2xl shadow-sm text-[10px] font-black text-green-600 uppercase tracking-[0.2em]">
                                <Globe size={16} className="animate-pulse" />
                                Status: Sincronizado & Seguro
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8">
                                <XCircle size={48} />
                            </div>
                            <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Não Configurada</h3>
                            <p className="text-gray-500 font-bold text-sm max-w-sm mb-8">
                                A URL da sua planilha mestre ainda não foi vinculada pelo administrador da franquia.
                            </p>
                            <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex items-start gap-4 text-left max-w-md">
                                <div className="p-2 bg-amber-100 rounded-lg text-amber-600 shrink-0">
                                    <Info size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">Acesso Restrito</p>
                                    <p className="text-xs text-amber-700 font-bold leading-relaxed">
                                        Por motivos de segurança, apenas o <b>Administrador Geral da Rede</b> pode alterar o link do banco de dados. 
                                        Por favor, entre em contato com a central para vincular sua planilha.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Lado do Administrador Geral (Edição Habilitada) */}
        {isPlatformOwner && (
            <div className="space-y-6 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`p-8 border-2 rounded-[2.5rem] transition-all ${
                    testResult === 'success' ? 'bg-green-50 border-green-200' : 
                    testResult === 'wrong_link' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'
                }`}>
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Link size={14}/> URL de Implantação (/exec) - {isNetworkView ? 'Master' : 'Unidade'}
                        </label>
                        {testResult === 'success' && <span className="text-green-600 font-black text-xs flex items-center gap-1"><CheckCircle2 size={14}/> CONEXÃO ATIVA</span>}
                    </div>
                    
                    <div className="flex gap-3">
                        <input 
                            className="flex-1 border-2 border-white p-4 rounded-2xl text-sm font-bold bg-white shadow-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all text-black"
                            placeholder="https://script.google.com/macros/s/.../exec"
                            value={localUrl}
                            onChange={e => setLocalUrl(e.target.value)}
                        />
                        <button 
                            onClick={handleTestAndSave}
                            disabled={isTesting}
                            className={`${isNetworkView ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-8 rounded-2xl font-black text-sm shadow-xl disabled:opacity-50 flex items-center gap-2 transition-all`}
                        >
                            {isTesting ? 'Validando...' : (
                                <>
                                    <Save size={18}/> Validar e Salvar
                                </>
                            )}
                        </button>
                    </div>

                    {!isNetworkView && (
                        <div className="mt-4 flex items-center gap-2">
                             <div className="px-3 py-1 bg-amber-100 border border-amber-200 rounded-full text-[9px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-1.5">
                                <ShieldAlert size={12}/> Modo Super Admin
                             </div>
                             <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Você está editando a configuração desta unidade remotamente</span>
                        </div>
                    )}
                </div>
            </div>
        )}

        {isPlatformOwner && showScript && (
          <div className="mb-8 p-6 bg-gray-900 rounded-3xl relative animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-yellow-400" />
                <span className="text-[10px] text-yellow-400 font-black tracking-widest uppercase">Copie para o Apps Script da planilha</span>
              </div>
              <button 
                onClick={() => { navigator.clipboard.writeText(scriptCode); alert('Script Copiado!'); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-black hover:bg-blue-700"
              >
                Copiar Script V22
              </button>
            </div>
            <pre className="text-blue-300 font-mono text-[10px] overflow-x-auto p-4 bg-black/30 rounded-xl max-h-60 custom-scrollbar">
              {scriptCode}
            </pre>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-3 mb-2 flex items-center justify-between">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Estrutura de Abas Esperada</h4>
                <div className="w-12 h-px bg-gray-100 flex-1 mx-4"></div>
            </div>
            {headersInfo.map(item => (
                <div key={item.tab} className="bg-gray-50 border border-gray-100 rounded-3xl p-6 hover:shadow-xl transition-all group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg transition-colors bg-white ${isNetworkView ? 'text-blue-600 group-hover:bg-blue-600' : 'text-indigo-600 group-hover:bg-indigo-600'} group-hover:text-white`}>
                            <FileSpreadsheet size={20}/>
                        </div>
                        <h5 className="font-black text-gray-800 text-xs uppercase tracking-wider">{item.tab}</h5>
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold mb-4 leading-relaxed">{item.desc}</p>
                    <div className="flex flex-wrap gap-1">
                        {item.cols.map(c => (
                            <span key={c} className="text-[9px] font-mono bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-400 font-bold">{c}</span>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
