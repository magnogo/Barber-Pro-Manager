
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, 
  Building2, 
  Search, 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  ShieldCheck, 
  UserCheck, 
  RefreshCw, 
  Layers, 
  Calendar,
  AlertTriangle,
  Camera,
  Loader2,
  Upload,
  UserCircle,
  Edit,
  X,
  Mail,
  Shield,
  Tag,
  CheckCircle2,
  Edit2
} from 'lucide-react';
import { Barbershop, Role } from '../types';
import { uploadImageToImgBB } from '../services/imageService';

type SuperAdminTab = 'EMPRESAS' | 'PAGAMENTOS' | 'ADMINS';

export const SuperAdmin = () => {
  const { 
    barbershops, payments, unitAdmins, 
    networkTotalRevenue, networkTotalAppointments,
    addBarbershop, updateBarbershop, updateUnitAdmin,
    setSelectedBarbershop, setView, 
    syncMasterData, calculateNetworkMetrics, isAutoSyncing 
  } = useApp();
  
  const shopLogoInputRef = useRef<HTMLInputElement>(null);
  const adminPhotoInputRef = useRef<HTMLInputElement>(null);
  const managerPhotoInputRef = useRef<HTMLInputElement>(null);
  
  const [activeSubTab, setActiveSubTab] = useState<SuperAdminTab>('EMPRESAS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalTab, setModalTab] = useState<'dados' | 'financeiro' | 'acesso'>('dados');
  
  const [shopForm, setShopForm] = useState({ 
    name: '', address: '', phone: '', email: '', logo: '',
    plan: 'Plano Básico', monthlyFee: 99.90, subscriptionStatus: 'ACTIVE',
    isActive: true, googleSheetsUrl: '',
    adminName: '', adminEmail: '', adminPhoto: '', adminPass: '',
    initialPaymentStatus: 'PAID', paymentMethod: 'PIX'
  });

  const [managerForm, setManagerForm] = useState({
    id: '',
    name: '',
    email: '',
    role: Role.BARBERSHOP_ADMIN,
    status: 'ACTIVE',
    barbershopId: '',
    urlfoto: ''
  });

  const [isSavingManager, setIsSavingManager] = useState(false);

  useEffect(() => {
    syncMasterData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'adminPhoto' | 'managerPhoto') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadImageToImgBB(file);
      if (url) {
        if (target === 'managerPhoto') {
          setManagerForm(prev => ({ ...prev, urlfoto: url }));
        } else {
          setShopForm(prev => ({ ...prev, [target]: url }));
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenModal = (shop?: Barbershop) => {
      if (shop) {
          setEditingId(shop.id);
          const admin = unitAdmins.find(a => String(a.barbershopId).trim() === String(shop.id).trim());
          setShopForm({ 
            name: shop.name || '',
            address: shop.address || '',
            phone: shop.phone || '',
            email: shop.email || '',
            logo: shop.logo || '',
            plan: shop.plan || 'Plano Básico',
            monthlyFee: shop.monthlyFee || 99.90,
            subscriptionStatus: shop.subscriptionStatus || 'ACTIVE',
            isActive: shop.isActive !== undefined ? shop.isActive : true,
            googleSheetsUrl: shop.googleSheetsUrl || '',
            adminName: admin?.name || '',
            adminEmail: admin?.email || '',
            adminPhoto: admin?.urlfoto || '',
            adminPass: '',
            initialPaymentStatus: 'PAID',
            paymentMethod: 'PIX'
          });
      } else {
          setEditingId(null);
          setShopForm({ 
            name: '', address: '', phone: '', email: '', logo: '',
            plan: 'Plano Básico', monthlyFee: 99.90, subscriptionStatus: 'ACTIVE',
            isActive: true, googleSheetsUrl: '',
            adminName: '', adminEmail: '', adminPhoto: '', adminPass: '',
            initialPaymentStatus: 'PAID', paymentMethod: 'PIX'
          });
      }
      setModalTab('dados');
      setIsModalOpen(true);
  };

  const handleOpenManagerModal = (admin?: any) => {
    if (admin) {
        setManagerForm({
          id: admin.id,
          name: admin.name || '',
          email: admin.email || '',
          role: (admin.role as Role) || Role.BARBERSHOP_ADMIN,
          status: admin.status || 'ACTIVE',
          barbershopId: admin.barbershopId || '',
          urlfoto: admin.urlfoto || ''
        });
    } else {
        setManagerForm({
          id: `adm-${Date.now()}`,
          name: '',
          email: '',
          role: Role.BARBERSHOP_ADMIN,
          status: 'ACTIVE',
          barbershopId: '',
          urlfoto: ''
        });
    }
    setIsManagerModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (shopForm.name && shopForm.phone) {
        if (editingId) {
            await updateBarbershop({ ...shopForm, id: editingId } as any);
        } else {
            await addBarbershop(shopForm as any);
        }
        setIsModalOpen(false);
    }
  };

  const handleManagerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (managerForm.name && managerForm.email) {
      setIsSavingManager(true);
      try {
          await updateUnitAdmin(managerForm);
          setIsManagerModalOpen(false);
      } finally {
          setIsSavingManager(false);
      }
    }
  };

  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (activeSubTab === 'EMPRESAS') {
      return barbershops.filter(s => s.name?.toLowerCase().includes(term) || s.phone?.includes(term));
    } else if (activeSubTab === 'PAGAMENTOS') {
      return (payments || []).filter(p => p.barbershopId?.toLowerCase().includes(term) || p.referenceMonth?.toLowerCase().includes(term));
    } else {
      return (unitAdmins || []).filter(a => a.name?.toLowerCase().includes(term) || a.email?.toLowerCase().includes(term));
    }
  }, [activeSubTab, barbershops, payments, unitAdmins, searchTerm]);

  const TabButton = ({ id, label, icon: Icon }: { id: SuperAdminTab, label: string, icon: any }) => (
    <button
      onClick={() => setActiveSubTab(id)}
      className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
        activeSubTab === id 
          ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
          : 'bg-zinc-900 text-zinc-500 hover:text-white border border-zinc-800'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-black via-blue-950/40 to-black rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden border border-zinc-900">
          <div className="absolute right-0 top-0 p-10 opacity-5">
              <Building2 size={240} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/30">Barber XPro Master</span>
                    {isAutoSyncing && <RefreshCw size={14} className="animate-spin text-blue-400" />}
                  </div>
                  <h1 className="text-4xl font-black mb-2 tracking-tight">Gestão da Rede</h1>
                  <p className="text-zinc-400 text-lg font-bold max-w-xl">
                      Controle centralizado e métricas reais de faturamento de todas as unidades conectadas.
                  </p>
              </div>
              <div className="flex gap-4">
                 <button 
                  onClick={() => calculateNetworkMetrics()} 
                  title="Consolidar métricas da rede"
                  className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-blue-400 hover:text-white transition-all flex items-center gap-2 group"
                 >
                   <RefreshCw size={24} className={isAutoSyncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
                   <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Atualizar Rede</span>
                 </button>
                 
                 {activeSubTab === 'ADMINS' ? (
                     <button onClick={() => handleOpenManagerModal()} className="bg-white text-black px-10 py-4 rounded-2xl flex items-center gap-3 text-sm font-black shadow-xl hover:bg-emerald-600 hover:text-white transition-all active:scale-95">
                        <Plus size={20} /> Novo Gestor
                     </button>
                 ) : (
                     <button onClick={() => handleOpenModal()} className="bg-white text-black px-10 py-4 rounded-2xl flex items-center gap-3 text-sm font-black shadow-xl hover:bg-blue-600 hover:text-white transition-all active:scale-95">
                        <Plus size={20} /> Nova Unidade
                     </button>
                 )}
              </div>
          </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
              { 
                label: 'Receita Total da Rede', 
                value: `R$ ${networkTotalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
                icon: DollarSign, 
                color: 'text-emerald-500', 
                bg: 'bg-emerald-500/10',
                desc: 'Soma bruta de todos os atendimentos'
              },
              { 
                label: 'Total de Atendimentos', 
                value: networkTotalAppointments.toLocaleString(), 
                icon: Calendar, 
                color: 'text-blue-500', 
                bg: 'bg-blue-500/10',
                desc: 'Volume total em todas as unidades'
              },
              { 
                label: 'Unidades Conectadas', 
                value: `${barbershops.filter(s => s.googleSheetsUrl).length} / ${barbershops.length}`, 
                icon: TrendingUp, 
                color: 'text-indigo-500', 
                bg: 'bg-indigo-500/10',
                desc: 'Sincronização ativa na rede'
              }
          ].map((kpi, i) => (
              <div key={i} className="bg-black p-8 rounded-[2rem] border border-zinc-900 flex items-center gap-6 group hover:border-zinc-700 transition-all relative overflow-hidden shadow-2xl">
                  <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12 group-hover:rotate-0 transition-transform">
                      <kpi.icon size={100} />
                  </div>
                  <div className={`${kpi.bg} ${kpi.color} p-5 rounded-3xl group-hover:scale-110 transition-transform z-10`}>
                      <kpi.icon size={32}/>
                  </div>
                  <div className="z-10">
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{kpi.label}</p>
                      <h4 className="text-3xl font-black text-white tracking-tighter">{kpi.value}</h4>
                      <p className="text-[9px] font-bold text-zinc-500 mt-1 uppercase tracking-tighter">{kpi.desc}</p>
                  </div>
              </div>
          ))}
      </div>

      {/* Sub Navigation */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 p-1.5 bg-black rounded-[1.5rem] border border-zinc-900 shadow-2xl">
             <TabButton id="EMPRESAS" label="Empresas" icon={Building2} />
             <TabButton id="PAGAMENTOS" label="Financeiro SaaS" icon={CreditCard} />
             <TabButton id="ADMINS" label="Gestores" icon={UserCheck} />
          </div>
          
          <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-4 text-zinc-700" size={20} />
              <input 
                  type="text" 
                  placeholder="Pesquisar na base..." 
                  className="pl-12 pr-4 py-4 w-full bg-black border border-zinc-900 rounded-2xl text-sm outline-none focus:border-blue-500 text-white font-bold shadow-2xl placeholder:text-zinc-800"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
              />
          </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-black rounded-[2.5rem] border border-zinc-900 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="bg-zinc-950 border-b border-zinc-900">
                          {activeSubTab === 'EMPRESAS' && (
                            <>
                              <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Unidade</th>
                              <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Contato</th>
                              <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Plano</th>
                              <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Status Sync</th>
                              <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest text-right">Ações</th>
                            </>
                          )}
                          {activeSubTab === 'PAGAMENTOS' && (
                            <>
                              <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest">ID Unidade</th>
                              <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Mês Referência</th>
                              <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Valor</th>
                              <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Status</th>
                              <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest text-right">Data</th>
                            </>
                          )}
                          {activeSubTab === 'ADMINS' && (
                            <>
                              <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Gestor Responsável</th>
                              <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Unidade Vinculada</th>
                              <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Acesso Master</th>
                              <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Nível</th>
                              <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Status</th>
                              <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest text-right">Ações</th>
                            </>
                          )}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                      {filteredData.map((item, idx) => (
                          <tr key={idx} className="hover:bg-zinc-900/20 transition-colors group">
                              {activeSubTab === 'EMPRESAS' && (
                                <>
                                  <td className="p-6">
                                      <div className="flex items-center gap-4">
                                          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-zinc-600 overflow-hidden shrink-0 shadow-lg">
                                              {item.logo ? <img src={item.logo} className="w-full h-full object-cover" /> : item.name?.charAt(0)}
                                          </div>
                                          <div>
                                              <p className="font-black text-white text-sm group-hover:text-blue-500 transition-colors">{item.name}</p>
                                              <p className="text-[10px] text-zinc-500 font-bold truncate max-w-[150px]">{item.address}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="p-6 text-xs font-bold text-zinc-400">
                                      {item.phone}<br/>
                                      <span className="text-[10px] text-zinc-600">{item.email}</span>
                                  </td>
                                  <td className="p-6">
                                      <span className="text-[10px] font-black px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full border border-blue-500/20">
                                          {item.plan}
                                      </span>
                                  </td>
                                  <td className="p-6">
                                      {item.googleSheetsUrl ? (
                                        <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black">
                                          <ShieldCheck size={14} /> CONECTADA
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2 text-zinc-700 text-[10px] font-black">
                                          <AlertTriangle size={14} /> OFF-SYNC
                                        </div>
                                      )}
                                  </td>
                                  <td className="p-6 text-right">
                                      <div className="flex justify-end items-center gap-2">
                                          <button 
                                              onClick={() => handleOpenModal(item)}
                                              title="Editar Empresa"
                                              className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-xl transition-all border border-zinc-800 shadow-xl"
                                          >
                                              <Edit2 size={16} />
                                          </button>
                                          <button 
                                              onClick={() => { setSelectedBarbershop(item); setView('DASHBOARD'); }}
                                              className="bg-zinc-900 text-zinc-300 hover:bg-blue-600 hover:text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                          >
                                              Acessar
                                          </button>
                                      </div>
                                  </td>
                                </>
                              )}

                              {activeSubTab === 'PAGAMENTOS' && (
                                <>
                                  <td className="p-6 text-xs font-black text-white">{item.barbershopId}</td>
                                  <td className="p-6 text-xs font-bold text-zinc-400 capitalize">{item.referenceMonth}</td>
                                  <td className="p-6 text-sm font-black text-emerald-500">R$ {Number(item.amount).toFixed(2)}</td>
                                  <td className="p-6">
                                      <span className={`text-[10px] font-black px-3 py-1 rounded-full ${item.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                          {item.status}
                                      </span>
                                  </td>
                                  <td className="p-6 text-right text-[10px] font-bold text-zinc-600">{item.date}</td>
                                </>
                              )}

                              {activeSubTab === 'ADMINS' && (
                                <>
                                  <td className="p-6">
                                      <div className="flex items-center gap-4">
                                          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-zinc-600 overflow-hidden shrink-0 shadow-lg">
                                              {item.urlfoto ? <img src={item.urlfoto} className="w-full h-full object-cover" /> : <UserCircle size={24} />}
                                          </div>
                                          <div>
                                              <p className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors">{item.name}</p>
                                              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tight">{item.email}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="p-6">
                                      <div className="flex items-center gap-2">
                                          <Building2 size={14} className="text-blue-500" />
                                          <span className="text-xs font-black text-zinc-400">
                                            {barbershops.find(b => b.id === item.barbershopId)?.name || item.barbershopId}
                                          </span>
                                      </div>
                                  </td>
                                  <td className="p-6 text-xs font-bold text-zinc-500">
                                      {item.email}
                                  </td>
                                  <td className="p-6">
                                      <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                                        {item.role === Role.SUPER_ADMIN ? 'REDE MASTER' : 'UNIDADE'}
                                      </span>
                                  </td>
                                  <td className="p-6">
                                      <div className={`flex items-center gap-2 text-[10px] font-black px-3 py-1 rounded-full w-fit border ${item.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                          <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                          {item.status === 'ACTIVE' ? 'ATIVO' : 'BLOQUEADO'}
                                      </div>
                                  </td>
                                  <td className="p-6 text-right">
                                    <button 
                                      onClick={() => handleOpenManagerModal(item)}
                                      className="p-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-xl transition-all border border-zinc-800 shadow-xl"
                                    >
                                      <Edit size={18} />
                                    </button>
                                  </td>
                                </>
                              )}
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Modal de Cadastro/Edição de Unidade */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-xl">
          <div className="bg-black rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200 border border-zinc-800">
            <div className="flex h-[650px]">
                <div className="w-1/3 bg-zinc-950 p-10 border-r border-zinc-900 space-y-4">
                    {['dados', 'financeiro', 'acesso'].map((t: any) => (
                      <button 
                          key={t}
                          onClick={() => setModalTab(t as any)}
                          className={`w-full text-left p-4 rounded-2xl flex items-center gap-3 transition-all ${modalTab === t ? 'bg-blue-600 text-white shadow-xl' : 'text-zinc-600 hover:text-white'}`}
                      >
                          {t === 'dados' && <Building2 size={20}/>}
                          {t === 'financeiro' && <DollarSign size={20}/>}
                          {t === 'acesso' && <ShieldCheck size={20}/>}
                          <span className="text-[10px] font-black uppercase tracking-widest">{t}</span>
                      </button>
                    ))}
                    
                    <div className="pt-20">
                         <div className="p-6 bg-blue-600/10 border border-blue-500/20 rounded-3xl">
                             <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2">Instrução</p>
                             <p className="text-[10px] text-zinc-500 font-bold leading-relaxed">
                                 Unidades cadastradas aqui aparecem automaticamente na rede para acompanhamento financeiro.
                             </p>
                         </div>
                    </div>
                </div>

                <div className="flex-1 p-10 relative flex flex-col bg-black">
                    <button onClick={() => setIsModalOpen(false)} className="absolute right-6 top-6 w-10 h-10 rounded-full hover:bg-zinc-900 flex items-center justify-center text-zinc-500"><X size={24}/></button>
                    
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                        <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                            {modalTab === 'dados' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <h3 className="text-xl font-black text-white mb-6 tracking-tight">Dados da Unidade</h3>
                                    <div className="flex justify-center mb-6">
                                      <div className="relative cursor-pointer group" onClick={() => shopLogoInputRef.current?.click()}>
                                          {shopForm.logo ? (
                                          <img src={shopForm.logo} className="w-24 h-24 rounded-[2rem] object-cover border-2 border-blue-500/30 shadow-2xl" />
                                          ) : (
                                          <div className="w-24 h-24 rounded-[2rem] bg-zinc-900 flex items-center justify-center text-zinc-700 border-2 border-dashed border-zinc-800 group-hover:border-blue-500/50 transition-all">
                                              {isUploading ? <Loader2 className="animate-spin" size={28} /> : <Camera size={28} />}
                                          </div>
                                          )}
                                          <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-2 rounded-2xl shadow-xl border border-blue-400/20">
                                              <Upload size={14} />
                                          </div>
                                          <input type="file" ref={shopLogoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                                      </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1 block">Nome Comercial</label>
                                        <input className="w-full bg-zinc-950 border border-zinc-900 p-4 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none text-white transition-all shadow-xl" value={shopForm.name} onChange={e => setShopForm({...shopForm, name: e.target.value})} placeholder="Ex: Barbearia Centro" required />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1 block">WhatsApp Central</label>
                                        <input className="w-full bg-zinc-950 border border-zinc-900 p-4 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none text-white transition-all shadow-xl" value={shopForm.phone} onChange={e => setShopForm({...shopForm, phone: e.target.value})} placeholder="(11) 99999-9999" required />
                                    </div>
                                    <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                                        <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 block flex items-center gap-2"><Layers size={14}/> Google Apps Script Endpoint</label>
                                        <input className="w-full bg-zinc-950 border border-zinc-900 p-4 rounded-xl text-[10px] font-mono text-zinc-500 focus:border-blue-500 outline-none transition-all" value={shopForm.googleSheetsUrl} onChange={e => setShopForm({...shopForm, googleSheetsUrl: e.target.value})} placeholder="https://script.google.com/macros/s/.../exec" />
                                    </div>
                                </div>
                            )}

                            {modalTab === 'financeiro' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <h3 className="text-xl font-black text-white mb-6 tracking-tight">Condições Comerciais</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1 block">Plano SaaS</label>
                                            <select className="w-full bg-zinc-950 border border-zinc-900 p-4 rounded-2xl text-sm font-bold text-white outline-none appearance-none transition-all cursor-pointer" value={shopForm.plan} onChange={e => setShopForm({...shopForm, plan: e.target.value})}>
                                                <option>Plano Básico</option>
                                                <option>Plano Pro</option>
                                                <option>Plano Enterprise</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1 block">Mensalidade (R$)</label>
                                            <input type="number" className="w-full bg-zinc-950 border border-zinc-900 p-4 rounded-2xl text-sm font-bold text-white outline-none transition-all" value={shopForm.monthlyFee} onChange={e => setShopForm({...shopForm, monthlyFee: Number(e.target.value)})} />
                                        </div>
                                    </div>
                                    <div className="p-6 bg-zinc-900 rounded-3xl border border-zinc-800 space-y-4 mt-8">
                                         <div className="flex items-center justify-between">
                                              <span className="text-[10px] font-black text-zinc-500 uppercase">Método de Ativação</span>
                                              <span className="text-[10px] font-black text-white uppercase tracking-widest bg-blue-600 px-3 py-1 rounded-full shadow-lg">PIX IMEDIATO</span>
                                         </div>
                                         <p className="text-[10px] text-zinc-600 font-bold leading-relaxed">
                                             Ao confirmar, o primeiro pagamento será registrado como concluído automaticamente para ativação da infraestrutura.
                                         </p>
                                    </div>
                                </div>
                            )}

                            {modalTab === 'acesso' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <h3 className="text-xl font-black text-white mb-6 tracking-tight">Gestor da Unidade</h3>
                                    
                                    <div className="flex justify-center mb-6">
                                      <div className="relative cursor-pointer group" onClick={() => adminPhotoInputRef.current?.click()}>
                                          {shopForm.adminPhoto ? (
                                          <img src={shopForm.adminPhoto} className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500/30 shadow-2xl transition-transform group-hover:scale-105" />
                                          ) : (
                                          <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-700 border-2 border-dashed border-zinc-800 group-hover:border-emerald-500/50 transition-all">
                                              {isUploading ? <Loader2 className="animate-spin" size={28} /> : <UserCircle size={28} />}
                                          </div>
                                          )}
                                          <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-2 rounded-full shadow-xl border border-emerald-400/20">
                                              <Upload size={14} />
                                          </div>
                                          <input type="file" ref={adminPhotoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'adminPhoto')} />
                                      </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1 block">Nome do Responsável</label>
                                        <input className="w-full bg-zinc-950 border border-zinc-900 p-4 rounded-2xl text-sm font-bold text-white outline-none transition-all shadow-xl" value={shopForm.adminName} onChange={e => setShopForm({...shopForm, adminName: e.target.value})} placeholder="Nome Completo" required />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1 block">E-mail de Login</label>
                                        <input className="w-full bg-zinc-950 border border-zinc-900 p-4 rounded-2xl text-sm font-bold text-white outline-none transition-all shadow-xl" value={shopForm.adminEmail} onChange={e => setShopForm({...shopForm, adminEmail: e.target.value})} placeholder="admin@unidade.com" required />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center pt-8 mt-auto border-t border-zinc-900">
                            <div className="flex-1"></div>
                            {modalTab !== 'acesso' ? (
                                <button type="button" onClick={() => setModalTab(modalTab === 'dados' ? 'financeiro' : 'acesso')} className="bg-blue-600 text-white px-12 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/10 hover:bg-blue-700 active:scale-95 transition-all">Próximo</button>
                            ) : (
                                <button type="submit" disabled={isUploading} className="bg-white text-black px-12 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50 active:scale-95">
                                  {isUploading ? 'Processando...' : editingId ? 'Salvar Alterações' : 'Ativar Unidade'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro/Edição de Gestor - COMPLETO */}
      {isManagerModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110] p-4 backdrop-blur-xl">
          <div className="bg-black rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200 border border-zinc-800">
            <div className="bg-zinc-950 p-8 text-white flex justify-between items-center shrink-0 border-b border-zinc-900">
              <div>
                <h3 className="font-black uppercase tracking-[0.2em] text-sm">Ficha do Gestor</h3>
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Configuração de credenciais master da unidade</p>
              </div>
              <button onClick={() => setIsManagerModalOpen(false)} className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-2xl transition-all text-zinc-500">
                <X size={24}/>
              </button>
            </div>

            <form onSubmit={handleManagerSubmit} className="p-10 space-y-8 bg-black overflow-y-auto max-h-[80vh] custom-scrollbar">
              {/* Foto do Gestor */}
              <div className="flex flex-col items-center mb-6">
                  <div className="relative group cursor-pointer" onClick={() => managerPhotoInputRef.current?.click()}>
                      {managerForm.urlfoto ? (
                          <img src={managerForm.urlfoto} className="w-28 h-28 rounded-full object-cover border-4 border-blue-500/20 shadow-2xl transition-transform group-hover:scale-105" />
                      ) : (
                          <div className="w-28 h-28 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-700 border-2 border-dashed border-zinc-800 group-hover:border-blue-500/50 transition-all">
                              {isUploading ? <Loader2 className="animate-spin" size={32} /> : <UserCircle size={32} />}
                          </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-2.5 rounded-full shadow-xl border border-blue-400/20">
                          <Upload size={16} />
                      </div>
                      <input type="file" ref={managerPhotoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'managerPhoto')} />
                  </div>
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-4">Foto de Perfil</span>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <UserCircle size={14} className="text-blue-500" /> Nome Completo
                  </label>
                  <input required className="w-full bg-zinc-950 border border-zinc-900 p-4 rounded-2xl text-sm font-bold focus:border-blue-600 outline-none transition-all text-white shadow-xl placeholder:text-zinc-800" value={managerForm.name} onChange={e => setManagerForm({...managerForm, name: e.target.value})} placeholder="Nome do Responsável" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Mail size={14} className="text-blue-500" /> E-mail de Acesso
                  </label>
                  <input required type="email" className="w-full bg-zinc-950 border border-zinc-900 p-4 rounded-2xl text-sm font-bold focus:border-blue-600 outline-none transition-all text-white shadow-xl placeholder:text-zinc-800" value={managerForm.email} onChange={e => setManagerForm({...managerForm, email: e.target.value})} placeholder="gestor@unidade.com" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Building2 size={14} className="text-blue-500" /> Unidade Vinculada
                    </label>
                    <select className="w-full bg-zinc-950 border border-zinc-900 p-4 rounded-2xl text-sm font-bold focus:border-blue-600 outline-none transition-all text-white appearance-none cursor-pointer shadow-xl" value={managerForm.barbershopId} onChange={e => setManagerForm({...managerForm, barbershopId: e.target.value})}>
                      <option value="">Nenhuma / Sem Unidade</option>
                      {barbershops.map(shop => (
                        <option key={shop.id} value={shop.id}>{shop.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Shield size={14} className="text-blue-500" /> Nível Master
                    </label>
                    <select className="w-full bg-zinc-950 border border-zinc-900 p-4 rounded-2xl text-sm font-bold focus:border-blue-600 outline-none transition-all text-white appearance-none cursor-pointer shadow-xl" value={managerForm.role} onChange={e => setManagerForm({...managerForm, role: e.target.value as Role})}>
                      <option value={Role.BARBERSHOP_ADMIN}>Gestor de Unidade</option>
                      <option value={Role.SUPER_ADMIN}>Admin Rede Master</option>
                      <option value={Role.BARBER}>Profissional / Barber</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Tag size={14} className="text-blue-500" /> Status da Credencial
                  </label>
                  <select className="w-full bg-zinc-950 border border-zinc-900 p-4 rounded-2xl text-sm font-bold focus:border-blue-600 outline-none transition-all text-white appearance-none cursor-pointer shadow-xl" value={managerForm.status} onChange={e => setManagerForm({...managerForm, status: e.target.value})}>
                    <option value="ACTIVE">Ativo - Acesso Liberado</option>
                    <option value="INACTIVE">Bloqueado - Sem Acesso</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-6">
                <button 
                  type="submit"
                  disabled={isUploading || isSavingManager} 
                  className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-50"
                >
                  {isSavingManager ? (
                      <><Loader2 className="animate-spin" size={18}/> Salvando Alterações...</>
                  ) : (
                      <><CheckCircle2 size={18}/> Confirmar Cadastro</>
                  )}
                </button>
                
                <button 
                  type="button"
                  onClick={() => setIsManagerModalOpen(false)}
                  className="w-full py-6 bg-zinc-900 text-zinc-500 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-zinc-800 hover:text-zinc-400 active:scale-95 border border-zinc-800"
                >
                  Descartar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
