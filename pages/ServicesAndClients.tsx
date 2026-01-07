
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
/* Fix: Added missing 'Info' to lucide-react imports */
import { 
    Trash, User, Users, Search, Loader2, X, Plus, CheckCircle2, Edit3, 
    Image as ImageIcon, Table, RefreshCw, Database, Scissors, Clock, 
    DollarSign, AlertTriangle, Send, Camera, Upload, TrendingUp, Award, 
    Calendar, Crown, Star, Sparkles, MessageSquare, Heart, Filter, Check,
    Smartphone, Tag, Info
} from 'lucide-react';
import { Client, Service, Appointment } from '../types';
import { uploadImageToImgBB } from '../services/imageService';
import { analyzeClientBaseMarketing, getClientRetentionStrategy } from '../services/geminiService';

export const ServicesPage = () => {
    const { services, currentUser, addService, updateService, deleteService } = useApp();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const shopServices = useMemo(() => {
        if (!currentUser?.barbershopId) return [];
        const currentShopId = String(currentUser.barbershopId).trim();
        return services.filter(s => String(s.barbershopId).trim() === currentShopId);
    }, [services, currentUser?.barbershopId]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
    const [newService, setNewService] = useState<Partial<Service>>({ name: '', durationMinutes: 30, price: 0 });
    
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [serviceFoundAutomatically, setServiceFoundAutomatically] = useState(false);

    // Busca automática por nome de serviço
    useEffect(() => {
        if (newService.name && newService.name.length > 3 && !editingServiceId) {
            const found = shopServices.find(s => s.name.toLowerCase().trim() === newService.name?.toLowerCase().trim());
            if (found) {
                setEditingServiceId(found.id);
                setNewService(found);
                setServiceFoundAutomatically(true);
            }
        } else if (!newService.name && serviceFoundAutomatically) {
            setEditingServiceId(null);
            setServiceFoundAutomatically(false);
            setNewService({ name: '', durationMinutes: 30, price: 0 });
        }
    }, [newService.name, shopServices, editingServiceId, serviceFoundAutomatically]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const url = await uploadImageToImgBB(file);
            // Nota: Adicionamos suporte visual a imagem mesmo que o tipo Service precise de extensão no futuro
            if (url) setNewService(prev => ({ ...prev, photo: url } as any));
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveService = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser?.barbershopId || !newService.name) return;

        setIsSaving(true);
        try {
            if (editingServiceId) {
                await updateService({
                    id: editingServiceId,
                    barbershopId: currentUser.barbershopId,
                    name: newService.name!,
                    durationMinutes: Number(newService.durationMinutes),
                    price: Number(newService.price)
                });
            } else {
                await addService({
                    barbershopId: currentUser.barbershopId,
                    name: newService.name!,
                    durationMinutes: Number(newService.durationMinutes),
                    price: Number(newService.price)
                });
            }
            setIsModalOpen(false);
            setEditingServiceId(null);
            setServiceFoundAutomatically(false);
        } catch (err) {
            alert("Erro ao salvar serviço.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este serviço?')) {
            await deleteService(id);
        }
    };

    return (
      <div className="space-y-6">
        <div className="bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-800 overflow-hidden">
            <div className="p-8 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-black/20">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-xl shadow-indigo-500/20">
                        <Scissors size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight">
                            Serviços Ativos ({shopServices.length})
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-0.5">Catálogo de preços e durações</p>
                    </div>
                </div>

                <button 
                    onClick={() => { 
                        setEditingServiceId(null); 
                        setServiceFoundAutomatically(false);
                        setNewService({name:'', durationMinutes:30, price:0}); 
                        setIsModalOpen(true); 
                    }}
                    className="bg-white text-black px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all shadow-xl active:scale-95"
                >
                    <Plus size={18}/> Novo Serviço
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-black/40">
                        <tr>
                            <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Serviço</th>
                            <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Duração</th>
                            <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Preço</th>
                            <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {shopServices.map(s => (
                            <tr key={s.id} className="hover:bg-zinc-800/30 transition-colors group">
                                <td className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-zinc-950 p-3 rounded-xl text-indigo-500 border border-zinc-800">
                                            <Scissors size={20} />
                                        </div>
                                        <span className="font-black text-white text-sm group-hover:text-indigo-400 transition-colors">{s.name}</span>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="flex items-center gap-2 text-zinc-400 font-bold text-sm">
                                        <Clock size={14} className="text-zinc-600" />
                                        {s.durationMinutes} min
                                    </div>
                                </td>
                                <td className="p-6">
                                    <span className="text-emerald-500 font-black text-sm">R$ {Number(s.price || 0).toFixed(2)}</span>
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => { setEditingServiceId(s.id); setNewService(s); setIsModalOpen(true); }}
                                            className="p-3 bg-zinc-950 text-zinc-500 hover:text-indigo-500 border border-zinc-800 rounded-xl transition-all hover:bg-zinc-800"
                                        >
                                            <Edit3 size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(s.id)}
                                            className="p-3 bg-zinc-950 text-zinc-500 hover:text-red-500 border border-zinc-800 rounded-xl transition-all hover:bg-zinc-800"
                                        >
                                            <Trash size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {shopServices.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-20 text-center text-zinc-600">
                                    <div className="flex flex-col items-center gap-4">
                                        <Scissors size={48} className="opacity-10" />
                                        <p className="font-bold text-sm uppercase tracking-widest">Nenhum serviço cadastrado.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-xl">
                <div className="bg-zinc-950 rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 border border-zinc-900">
                    <div className="bg-black p-6 text-white flex justify-between items-center border-b border-zinc-900">
                        <h3 className="font-black uppercase tracking-widest text-sm">
                            {editingServiceId ? (serviceFoundAutomatically ? 'Serviço Identificado' : 'Editar Serviço') : 'Novo Serviço'}
                        </h3>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-full transition-all text-zinc-500">
                            <X size={20}/>
                        </button>
                    </div>
                    
                    <form onSubmit={handleSaveService} className="p-8 space-y-6">
                        {/* Status de Serviço Existente */}
                        {serviceFoundAutomatically && (
                            <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
                                <div className="bg-indigo-500 text-white p-1 rounded-full"><Info size={14} /></div>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Este serviço já existe no catálogo!</p>
                            </div>
                        )}

                        {/* Nome do Serviço como Campo Principal */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1 block flex items-center gap-1">
                                <Tag size={12} /> Nome do Serviço
                            </label>
                            <input 
                                required 
                                className={`w-full border-2 p-4 rounded-xl text-lg font-black outline-none transition-all text-white ${serviceFoundAutomatically ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-zinc-900 bg-black focus:border-indigo-500'}`} 
                                value={newService.name} 
                                onChange={e => setNewService({...newService, name: e.target.value})} 
                                placeholder="Ex: Corte Degradê" 
                            />
                        </div>

                        {/* Icone/Foto do Serviço */}
                        <div className="flex flex-col items-center mb-2">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                {(newService as any).photo ? (
                                    <img src={(newService as any).photo} className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/30 shadow-lg" />
                                ) : (
                                    <div className="w-20 h-20 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-700 border-2 border-dashed border-zinc-800 group-hover:border-indigo-500/50 transition-colors">
                                        {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Scissors size={24} />}
                                    </div>
                                )}
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </div>
                            <span className="text-[9px] font-black text-zinc-600 uppercase mt-4 tracking-widest">Imagem do Serviço</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1 block">Duração (Minutos)</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-4 text-zinc-600" size={16} />
                                    <input 
                                        type="number" 
                                        required 
                                        className="w-full border-2 border-zinc-900 pl-11 pr-4 py-4 rounded-xl text-sm font-black focus:border-indigo-500 outline-none bg-black text-white" 
                                        value={newService.durationMinutes} 
                                        onChange={e => setNewService({...newService, durationMinutes: Number(e.target.value)})} 
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1 block">Preço de Venda</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-4 text-zinc-600" size={16} />
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        required 
                                        className="w-full border-2 border-zinc-900 pl-11 pr-4 py-4 rounded-xl text-sm font-black focus:border-indigo-500 outline-none bg-black text-white" 
                                        value={newService.price} 
                                        onChange={e => setNewService({...newService, price: Number(e.target.value)})} 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <button 
                                disabled={isSaving || isUploading} 
                                className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${serviceFoundAutomatically ? 'bg-indigo-600 text-white' : 'bg-white text-black hover:bg-indigo-600 hover:text-white'}`}
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={18}/> : editingServiceId ? 'Atualizar Serviço' : 'Criar Serviço'}
                            </button>
                            <button 
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="w-full py-5 bg-zinc-900 text-zinc-500 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-zinc-800 hover:text-zinc-400 active:scale-95"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </div>
    );
};

export const CustomersPage = () => {
    const { clients, currentUser, appointments, services, addClient, updateClient } = useApp();
    
    const shopClients = useMemo(() => {
        if (!currentUser?.barbershopId) return [];
        const currentId = String(currentUser.barbershopId).toLowerCase().trim();
        return clients.filter(c => String(c.barbershopId || '').toLowerCase().trim() === currentId);
    }, [clients, currentUser?.barbershopId]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClientId, setEditingClientId] = useState<string | null>(null);
    const [insightClient, setInsightClient] = useState<Client | null>(null);
    const [newClient, setNewClient] = useState<Partial<Client>>({ name: '', phone: '', email: '', photo: '' });
    
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [aiGlobalInsight, setAiGlobalInsight] = useState<string>('');
    const [loadingGlobalAi, setLoadingGlobalAi] = useState(false);
    const [clientFoundAutomatically, setClientFoundAutomatically] = useState(false);

    // Função para aplicar máscara de telefone (00) 00000-0000
    const applyPhoneMask = (value: string) => {
        const raw = value.replace(/\D/g, '').slice(0, 11);
        if (raw.length <= 2) return raw;
        if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
        return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
    };

    // Efeito para busca automática por telefone
    useEffect(() => {
        const rawPhone = newClient.phone?.replace(/\D/g, '') || '';
        if (rawPhone.length === 11 && !editingClientId) {
            const found = shopClients.find(c => c.phone.replace(/\D/g, '') === rawPhone);
            if (found) {
                setEditingClientId(found.id);
                setNewClient({
                    ...found,
                    phone: applyPhoneMask(found.phone)
                });
                setClientFoundAutomatically(true);
            } else {
                setClientFoundAutomatically(false);
            }
        } else if (rawPhone.length < 11 && clientFoundAutomatically) {
            // Se o usuário apagar o número após encontrar, reseta para "novo cadastro"
            setEditingClientId(null);
            setClientFoundAutomatically(false);
            setNewClient(prev => ({ ...prev, name: '', email: '', photo: '' }));
        }
    }, [newClient.phone, shopClients, editingClientId, clientFoundAutomatically]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const url = await uploadImageToImgBB(file);
            if (url) setNewClient(prev => ({ ...prev, photo: url }));
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser?.barbershopId || !newClient.name || !newClient.phone) return;
        setIsSaving(true);
        try {
            if (editingClientId) {
                await updateClient({ ...newClient, id: editingClientId, barbershopId: currentUser.barbershopId } as Client);
            } else {
                await addClient({ ...newClient, barbershopId: currentUser.barbershopId } as Client);
            }
            setIsModalOpen(false);
            setEditingClientId(null);
            setClientFoundAutomatically(false);
        } finally {
            setIsSaving(false);
        }
    };

    const segmentation = useMemo(() => {
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const vips = [];
        const atRisk = [];
        const newOnes = [];

        shopClients.forEach(c => {
            const clientApts = appointments.filter(a => String(a.clientId).trim() === String(c.id).trim() && a.status === 'COMPLETED');
            const lastAptDateStr = clientApts.sort((a,b) => b.date.localeCompare(a.date))[0]?.date;
            
            if (clientApts.length >= 10) vips.push(c);
            
            if (lastAptDateStr) {
                const lastDate = new Date(lastAptDateStr + 'T12:00:00');
                if (lastDate < thirtyDaysAgo && clientApts.length >= 2) atRisk.push(c);
            }

            const memberSince = c.memberSince ? new Date(c.memberSince) : new Date();
            if (memberSince > thirtyDaysAgo) newOnes.push(c);
        });

        return { vips, atRisk, newOnes };
    }, [shopClients, appointments]);

    const handleGenerateGlobalCampaign = async () => {
        setLoadingGlobalAi(true);
        const topService = services.filter(s => s.barbershopId === currentUser?.barbershopId)[0]?.name || 'Corte Clássico';
        const insight = await analyzeClientBaseMarketing({
            total: shopClients.length,
            vips: segmentation.vips.length,
            atRisk: segmentation.atRisk.length,
            newOnes: segmentation.newOnes.length,
            topService: topService
        });
        setAiGlobalInsight(insight);
        setLoadingGlobalAi(false);
    };

    const clientInsights = useMemo(() => {
        if (!insightClient) return null;
        const clientApts = appointments.filter(a => String(a.clientId).trim() === String(insightClient.id).trim() && (a.status === 'COMPLETED' || a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS'));
        let totalSpent = 0;
        const serviceCounts: Record<string, number> = {};
        clientApts.forEach(apt => {
            const service = services.find(s => String(s.id).trim() === String(apt.serviceId).trim());
            if (service) {
                totalSpent += Number(service.price || 0);
                serviceCounts[service.name] = (serviceCounts[service.name] || 0) + 1;
            }
        });
        const topService = Object.entries(serviceCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'Nenhum';
        return { totalSpent, totalVisits: clientApts.length, topService };
    }, [insightClient, appointments, services]);

    const filteredClients = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return shopClients.filter(c => c.name.toLowerCase().includes(lowerSearch) || c.phone.includes(searchTerm));
    }, [shopClients, searchTerm]);
  
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900 via-purple-900 to-zinc-950 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
                            <Sparkles className="text-indigo-400" /> Inteligência de Base
                        </h2>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                            {loadingGlobalAi ? (
                                <div className="flex items-center gap-3 text-indigo-300 font-bold italic">
                                    <Loader2 className="animate-spin" size={20} /> Processando métricas...
                                </div>
                            ) : aiGlobalInsight ? (
                                <p className="text-indigo-50 font-bold italic text-lg leading-relaxed">"{aiGlobalInsight}"</p>
                            ) : (
                                <p className="text-indigo-300 font-medium">Análise de dados automática ativa.</p>
                            )}
                        </div>
                    </div>
                    <div className="mt-8 flex items-center gap-4">
                        <button onClick={handleGenerateGlobalCampaign} disabled={loadingGlobalAi} className="bg-white text-indigo-900 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-2xl">
                            <Sparkles size={16} /> Sugerir Campanha
                        </button>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Filter size={14} /> Segmentação</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg"><Crown size={20} /></div>
                            <span className="font-bold text-amber-900">VIPs</span>
                        </div>
                        <span className="text-2xl font-black text-amber-600">{segmentation.vips.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-rose-50 rounded-2xl border border-rose-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg"><AlertTriangle size={20} /></div>
                            <span className="font-bold text-rose-900">Em Risco</span>
                        </div>
                        <span className="text-2xl font-black text-rose-600">{segmentation.atRisk.length}</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-[#1a1d21] rounded-[2.5rem] shadow-2xl border border-zinc-800 overflow-hidden">
            <div className="p-8 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-black/20">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl">
                        <Users size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight">Sua Base de Clientes</h3>
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-0.5">Gestão centralizada de CRM</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-4 text-zinc-700" size={20} />
                        <input 
                            type="text" 
                            placeholder="Buscar cliente..." 
                            className="pl-12 pr-4 py-4 w-full bg-black border border-zinc-800 rounded-2xl text-sm outline-none focus:border-blue-500 text-white font-bold shadow-2xl placeholder:text-zinc-800" 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                        />
                    </div>
                    <button 
                        onClick={() => { setEditingClientId(null); setClientFoundAutomatically(false); setNewClient({name:'', phone:'', email:'', photo:''}); setIsModalOpen(true); }} 
                        className="bg-white text-black px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all shadow-xl active:scale-95"
                    >
                        <Plus size={18}/> Novo Cliente
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-black/40">
                        <tr>
                            <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Cliente</th>
                            <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Contato</th>
                            <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Perfil</th>
                            <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/30">
                        {filteredClients.map(c => (
                            <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                                            {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : <div className="text-zinc-600"><User size={24} /></div>}
                                        </div>
                                        <p className="font-black text-white text-sm group-hover:text-blue-500 transition-colors">{c.name}</p>
                                    </div>
                                </td>
                                <td className="p-6 text-zinc-400 font-bold text-sm">{c.phone}</td>
                                <td className="p-6">
                                    <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${segmentation.vips.some(v => v.id === c.id) ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                                        {segmentation.vips.some(v => v.id === c.id) ? 'VIP' : 'PADRÃO'}
                                    </div>
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setInsightClient(c)} title="Ver Insights" className="p-3 bg-zinc-950 text-zinc-500 hover:text-indigo-500 border border-zinc-800 rounded-xl transition-all hover:bg-zinc-800 shadow-xl"><TrendingUp size={18} /></button>
                                        <button onClick={() => { setEditingClientId(c.id); setClientFoundAutomatically(false); setNewClient(c); setIsModalOpen(true); }} title="Editar Cadastro" className="p-3 bg-zinc-950 text-zinc-500 hover:text-blue-500 border border-zinc-800 rounded-xl transition-all hover:bg-zinc-800 shadow-xl"><Edit3 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredClients.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-20 text-center text-zinc-600">
                                    <div className="flex flex-col items-center gap-4">
                                        <Users size={48} className="opacity-10" />
                                        <p className="font-bold text-sm uppercase tracking-widest">Nenhum cliente localizado na base.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-xl">
                <div className="bg-zinc-950 rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 border border-zinc-900">
                    <div className="bg-black p-6 text-white flex justify-between items-center border-b border-zinc-900">
                        <h3 className="font-black uppercase tracking-widest text-sm">
                            {editingClientId ? (clientFoundAutomatically ? 'Cliente Localizado' : 'Editar Cliente') : 'Novo Cliente'}
                        </h3>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-full transition-all text-zinc-500">
                            <X size={20}/>
                        </button>
                    </div>
                    <form onSubmit={handleSaveClient} className="p-8 space-y-5">
                        {/* Status da Busca Automática */}
                        {clientFoundAutomatically && (
                            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
                                <div className="bg-green-500 text-white p-1 rounded-full"><Check size={14} /></div>
                                <p className="text-[10px] font-black text-green-400 uppercase tracking-widest">Cadastro localizado automaticamente!</p>
                            </div>
                        )}

                        {/* Telefone como Primeiro Campo */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1 block flex items-center gap-1">
                                <Smartphone size={12} /> WhatsApp (Primeiro Passo)
                            </label>
                            <input 
                                required 
                                className={`w-full border-2 p-4 rounded-xl text-lg font-black outline-none transition-all text-white ${clientFoundAutomatically ? 'border-green-500/30 bg-green-500/5' : 'border-zinc-900 bg-black focus:border-blue-500'}`} 
                                value={newClient.phone} 
                                onChange={e => setNewClient({...newClient, phone: applyPhoneMask(e.target.value)})} 
                                placeholder="(00) 00000-0000" 
                            />
                        </div>

                        <div className="flex flex-col items-center mb-2">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                {newClient.photo ? (
                                    <img src={newClient.photo} className="w-20 h-20 rounded-full object-cover border-4 border-blue-500/30 shadow-lg" />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-700 border-2 border-dashed border-zinc-800 group-hover:border-blue-500/50 transition-colors">
                                        {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
                                    </div>
                                )}
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </div>
                            <span className="text-[9px] font-black text-zinc-600 uppercase mt-4 tracking-widest">Foto do Cliente</span>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1 block">Nome Completo</label>
                            <input required className="w-full border-2 border-zinc-900 p-4 rounded-xl text-sm font-black focus:border-blue-500 outline-none bg-black text-white transition-all shadow-xl" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1 block">E-mail (Opcional)</label>
                            <input type="email" className="w-full border-2 border-zinc-900 p-4 rounded-xl text-sm font-black focus:border-blue-500 outline-none bg-black text-white transition-all shadow-xl" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <button disabled={isSaving || isUploading} className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${clientFoundAutomatically ? 'bg-green-600 text-white' : 'bg-white text-black hover:bg-blue-600 hover:text-white'}`}>
                                {isSaving ? <Loader2 className="animate-spin" size={18}/> : editingClientId ? 'Atualizar Cadastro' : 'Cadastrar Cliente'}
                            </button>
                            <button 
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="w-full py-5 bg-zinc-900 text-zinc-500 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-zinc-800 hover:text-zinc-400 active:scale-95"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {insightClient && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110] p-4 backdrop-blur-xl">
                <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">
                    <div className="bg-gradient-to-br from-indigo-900 to-black p-10 text-white text-center">
                        <div className="w-24 h-24 rounded-full border-4 border-white/20 mx-auto mb-6 overflow-hidden shadow-2xl">
                            {insightClient.photo ? <img src={insightClient.photo} className="w-full h-full object-cover" /> : <User size={48} className="mx-auto mt-6 opacity-30"/>}
                        </div>
                        <h3 className="text-3xl font-black tracking-tight">{insightClient.name}</h3>
                        <p className="text-indigo-300 font-black uppercase text-[10px] tracking-[0.3em] mt-2">Visão Analítica do Cliente</p>
                    </div>
                    <div className="p-10 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                                <p className="text-[9px] font-black text-gray-400 uppercase">Visitas</p>
                                <p className="text-xl font-black text-black">{clientInsights?.totalVisits}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                                <p className="text-[9px] font-black text-gray-400 uppercase">Total Gasto</p>
                                <p className="text-xl font-black text-indigo-600">R$ {Number(clientInsights?.totalSpent || 0).toFixed(2)}</p>
                            </div>
                        </div>
                        <button onClick={() => setInsightClient(null)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest">Fechar Análise</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
};
