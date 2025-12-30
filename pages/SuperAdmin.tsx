
import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, CheckCircle2, AlertTriangle, Building2, Search, DollarSign, Table, Eye, Users, TrendingUp, Star, LayoutGrid, Mail, Key, ShieldCheck, CreditCard, Layout, Phone, MapPin, Link, Camera, Upload, Loader2 } from 'lucide-react';
import { Barbershop, Role } from '../types';
import { uploadImageToImgBB } from '../services/imageService';

export const SuperAdmin = () => {
  const { barbershops, addBarbershop, updateBarbershop, setSelectedBarbershop, setView } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'dados' | 'financeiro' | 'acesso'>('dados');
  
  const [shopForm, setShopForm] = useState({ 
    name: '', address: '', phone: '', email: '', logo: '',
    plan: 'Plano Básico', monthlyFee: 99.90, subscriptionStatus: 'ACTIVE',
    isActive: true, googleSheetsUrl: '',
    adminName: '', adminEmail: '', adminPass: '',
    initialPaymentStatus: 'PAID', paymentMethod: 'PIX'
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImageToImgBB(file);
      if (url) {
        setShopForm(prev => ({ ...prev, logo: url }));
      } else {
        alert("Erro no upload do Logo.");
      }
    } catch (err) {
      alert("Erro no upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const redeStats = useMemo(() => {
      return {
          totalUnidades: barbershops.length,
          unidadesAtivas: barbershops.filter(s => s.isActive).length,
          faturamentoRede: barbershops.reduce((acc, s) => acc + (s.monthlyFee || 0), 0)
      };
  }, [barbershops]);

  const handleOpenModal = (shop?: Barbershop) => {
      if (shop) {
          setEditingId(shop.id);
          setShopForm({ ...shopForm, ...shop } as any);
      } else {
          setEditingId(null);
          setShopForm({ 
            name: '', address: '', phone: '', email: '', logo: '',
            plan: 'Plano Básico', monthlyFee: 99.90, subscriptionStatus: 'ACTIVE',
            isActive: true, googleSheetsUrl: '',
            adminName: '', adminEmail: '', adminPass: '',
            initialPaymentStatus: 'PAID', paymentMethod: 'PIX'
          });
      }
      setActiveTab('dados');
      setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (shopForm.name && shopForm.phone) {
        if (editingId) {
            await updateBarbershop(shopForm as any);
        } else {
            await addBarbershop(shopForm as any);
        }
        setIsModalOpen(false);
    }
  };

  const filteredShops = barbershops.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.phone.includes(searchTerm) ||
    (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 p-10 opacity-10">
              <Building2 size={240} />
          </div>
          <div className="relative z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/30 mb-4 inline-block">SaaS Master Panel</span>
              <h1 className="text-4xl font-black mb-2 tracking-tight">Painel da Rede</h1>
              <p className="text-blue-200 text-lg font-bold max-w-xl">
                  Visualização centralizada de todas as unidades da franquia e controle de faturamento SaaS.
              </p>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
              { label: 'Unidades na Rede', value: redeStats.totalUnidades, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Faturamento Mensal', value: `R$ ${redeStats.faturamentoRede.toFixed(2)}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Status da Rede', value: `${redeStats.unidadesAtivas} Ativas`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' }
          ].map((kpi, i) => (
              <div key={i} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-6 group hover:shadow-xl transition-all">
                  <div className={`${kpi.bg} ${kpi.color} p-5 rounded-3xl group-hover:scale-110 transition-transform`}>
                      <kpi.icon size={32}/>
                  </div>
                  <div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                      <h4 className="text-3xl font-black text-gray-900 tracking-tight">{kpi.value}</h4>
                  </div>
              </div>
          ))}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-4 top-4 text-gray-400" size={20} />
              <input 
                  type="text" 
                  placeholder="Localizar unidade..." 
                  className="pl-12 pr-4 py-4 w-full border-2 border-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-black font-bold"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
              />
          </div>
          <button onClick={() => handleOpenModal()} className="bg-gray-900 hover:bg-black text-white px-10 py-4 rounded-2xl flex items-center gap-2 text-sm font-black shadow-xl transition-all active:scale-95 whitespace-nowrap">
              <Plus size={20} /> Cadastrar Unidade
          </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                          <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Unidade</th>
                          <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contato</th>
                          <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Assinatura</th>
                          <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Planilha</th>
                          <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                          <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                      {filteredShops.map(shop => (
                          <tr key={shop.id} className="hover:bg-blue-50/30 transition-colors group">
                              <td className="p-6">
                                  <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center font-black text-gray-400 overflow-hidden shrink-0">
                                          {shop.logo ? (
                                              <img src={shop.logo} className="w-full h-full object-cover" alt={shop.name} />
                                          ) : (
                                              shop.name.charAt(0)
                                          )}
                                      </div>
                                      <div>
                                          <p className="font-black text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{shop.name}</p>
                                          <p className="text-[10px] text-gray-400 font-bold truncate max-w-[150px]">{shop.address}</p>
                                      </div>
                                  </div>
                              </td>
                              <td className="p-6">
                                  <div className="space-y-1">
                                      <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                                          <Phone size={12} className="text-blue-500" />
                                          {shop.phone}
                                      </div>
                                      <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400">
                                          <Mail size={12} className="text-gray-300" />
                                          {shop.email || 'N/A'}
                                      </div>
                                  </div>
                              </td>
                              <td className="p-6">
                                  <div>
                                      <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100 uppercase tracking-tighter">
                                          {shop.plan}
                                      </span>
                                      <p className="text-sm font-black text-gray-900 mt-1">R$ {shop.monthlyFee?.toFixed(2)}</p>
                                  </div>
                              </td>
                              <td className="p-6">
                                  {shop.googleSheetsUrl ? (
                                      <div className="flex items-center gap-2 text-green-600">
                                          <CheckCircle2 size={16} />
                                          <span className="text-[10px] font-black uppercase">Vinculada</span>
                                      </div>
                                  ) : (
                                      <div className="flex items-center gap-2 text-amber-500">
                                          <AlertTriangle size={16} />
                                          <span className="text-[10px] font-black uppercase">Sem Link</span>
                                      </div>
                                  )}
                              </td>
                              <td className="p-6">
                                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black tracking-widest ${shop.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                      <div className={`w-1.5 h-1.5 rounded-full ${shop.isActive ? 'bg-green-600 animate-pulse' : 'bg-red-600'}`}></div>
                                      {shop.isActive ? 'ATIVA' : 'SUSPENSA'}
                                  </div>
                              </td>
                              <td className="p-6 text-right">
                                  <div className="flex justify-end items-center gap-2">
                                      <button 
                                          onClick={() => { setSelectedBarbershop(shop); setView('DASHBOARD'); }}
                                          className="flex items-center gap-2 bg-gray-900 text-white hover:bg-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95"
                                      >
                                          <Eye size={14}/> Gerenciar
                                      </button>
                                      <button 
                                          onClick={() => handleOpenModal(shop)}
                                          className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-all border border-blue-100"
                                      >
                                          <CreditCard size={16}/>
                                      </button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-xl">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="flex h-[600px]">
                <div className="w-1/3 bg-gray-50 p-10 border-r border-gray-100 space-y-4">
                    <button 
                        onClick={() => setActiveTab('dados')}
                        className={`w-full text-left p-4 rounded-2xl flex items-center gap-3 transition-all ${activeTab === 'dados' ? 'bg-white shadow-lg text-blue-600' : 'text-gray-400 hover:bg-white'}`}
                    >
                        <Building2 size={20}/> <span className="text-xs font-black uppercase tracking-widest">Unidade</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('financeiro')}
                        className={`w-full text-left p-4 rounded-2xl flex items-center gap-3 transition-all ${activeTab === 'financeiro' ? 'bg-white shadow-lg text-blue-600' : 'text-gray-400 hover:bg-white'}`}
                    >
                        <DollarSign size={20}/> <span className="text-xs font-black uppercase tracking-widest">Assinatura</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('acesso')}
                        className={`w-full text-left p-4 rounded-2xl flex items-center gap-3 transition-all ${activeTab === 'acesso' ? 'bg-white shadow-lg text-blue-600' : 'text-gray-400 hover:bg-white'}`}
                    >
                        <ShieldCheck size={20}/> <span className="text-xs font-black uppercase tracking-widest">Acesso</span>
                    </button>
                </div>

                <div className="flex-1 p-10 relative flex flex-col">
                    <button onClick={() => setIsModalOpen(false)} className="absolute right-6 top-6 w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"><Plus size={24} className="rotate-45 text-gray-400"/></button>
                    
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                        <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                            {activeTab === 'dados' && (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                    <h3 className="text-xl font-black text-gray-800 mb-6">Configurações da Unidade</h3>
                                    
                                    <div className="flex flex-col items-center mb-4">
                                      <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                          {shopForm.logo ? (
                                          <img src={shopForm.logo} className="w-20 h-20 rounded-2xl object-cover border-4 border-blue-50 shadow-lg" />
                                          ) : (
                                          <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-300 border-4 border-dashed border-gray-200">
                                              {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
                                          </div>
                                          )}
                                          <div className="absolute -bottom-1 -right-1 bg-white p-2 rounded-lg shadow-md border border-gray-100 text-blue-600">
                                            <Upload size={14} />
                                          </div>
                                          <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            accept="image/*" 
                                            onChange={handleFileUpload} 
                                          />
                                      </div>
                                      <span className="text-[9px] font-black text-gray-400 uppercase mt-2">Logo da Unidade (ImgBB)</span>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Nome Comercial</label>
                                        <input className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold bg-gray-50 focus:border-blue-500 outline-none text-black" placeholder="Ex: Barber Club Premium" value={shopForm.name} onChange={e => setShopForm({...shopForm, name: e.target.value})} required />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">WhatsApp</label>
                                        <input className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold bg-gray-50 focus:border-blue-500 outline-none text-black" placeholder="(11) 99999-9999" value={shopForm.phone} onChange={e => setShopForm({...shopForm, phone: e.target.value})} required />
                                    </div>
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                                        <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 block flex items-center gap-2">
                                            <Link size={14}/> Link da Planilha (/exec)
                                        </label>
                                        <input className="w-full border-2 border-white p-4 rounded-xl text-xs font-mono bg-white focus:border-blue-500 outline-none text-gray-600" placeholder="https://script.google.com/macros/s/.../exec" value={shopForm.googleSheetsUrl} onChange={e => setShopForm({...shopForm, googleSheetsUrl: e.target.value})} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'financeiro' && (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                    <h3 className="text-xl font-black text-gray-800 mb-6">Dados de Cobrança SaaS</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Plano</label>
                                            <select className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold bg-gray-50 focus:border-blue-500 outline-none text-black" value={shopForm.plan} onChange={e => setShopForm({...shopForm, plan: e.target.value})}>
                                                <option>Plano Básico</option>
                                                <option>Plano Pro</option>
                                                <option>Plano Enterprise</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Valor Mensal</label>
                                            <input type="number" className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold bg-gray-50 focus:border-blue-500 outline-none text-black" value={shopForm.monthlyFee} onChange={e => setShopForm({...shopForm, monthlyFee: Number(e.target.value)})} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'acesso' && (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                    <h3 className="text-xl font-black text-gray-800 mb-6">Conta do Administrador</h3>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Nome do Dono</label>
                                        <input className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold bg-gray-50 focus:border-blue-500 outline-none text-black" placeholder="João da Silva" value={shopForm.adminName} onChange={e => setShopForm({...shopForm, adminName: e.target.value})} required />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">E-mail de Login</label>
                                        <input className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold bg-gray-50 focus:border-blue-500 outline-none text-black" placeholder="admin@unidade.com" value={shopForm.adminEmail} onChange={e => setShopForm({...shopForm, adminEmail: e.target.value})} required />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Senha Inicial</label>
                                        <input type="password" className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold bg-gray-50 focus:border-blue-500 outline-none text-black" placeholder="••••••••" value={shopForm.adminPass} onChange={e => setShopForm({...shopForm, adminPass: e.target.value})} required={!editingId} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center pt-6 mt-auto border-t border-gray-100">
                            {activeTab !== 'dados' && (
                                <button type="button" onClick={() => setActiveTab(activeTab === 'acesso' ? 'financeiro' : 'dados')} className="text-xs font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest">Voltar</button>
                            )}
                            <div className="flex-1"></div>
                            {activeTab !== 'acesso' ? (
                                <button type="button" onClick={() => setActiveTab(activeTab === 'dados' ? 'financeiro' : 'acesso')} className="bg-blue-600 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-100">Próximo</button>
                            ) : (
                                <button type="submit" disabled={isUploading} className="bg-gray-900 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all disabled:opacity-50">
                                  {isUploading ? 'Aguarde Upload...' : 'Salvar Unidade'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
