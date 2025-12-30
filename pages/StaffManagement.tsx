
import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
    User as UserIcon, Plus, Edit3, Trash, X, Calendar, Clock, 
    Check, Briefcase, Loader2, Database, Camera, Image as ImageIcon, 
    Save, Upload, Mail, Shield, UserCircle, Tag, LogOut
} from 'lucide-react';
import { User, Role } from '../types';
import { uploadImageToImgBB } from '../services/imageService';

export const StaffManagement = () => {
  const { users, currentUser, addUser, updateUser, deleteUser } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const shopStaff = useMemo(() => {
    if (!currentUser?.barbershopId) return [];
    const currentId = String(currentUser.barbershopId).toLowerCase().trim();
    return users.filter(u => String(u.barbershopId || '').toLowerCase().trim() === currentId);
  }, [users, currentUser]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    nickname: '',
    email: '',
    photo: '',
    position: 'Barbeiro',
    role: Role.BARBER,
    useSchedule: true,
    startTime: '09:00',
    endTime: '19:00',
    workDays: [1, 2, 3, 4, 5, 6]
  });

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingId(user.id);
      setFormData({ 
        ...user,
        photo: user.photo || '',
        useSchedule: user.useSchedule !== undefined ? user.useSchedule : true
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '', nickname: '', email: '', photo: '',
        position: 'Barbeiro', role: Role.BARBER, useSchedule: true,
        startTime: '09:00', endTime: '19:00', workDays: [1, 2, 3, 4, 5, 6]
      });
    }
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadImageToImgBB(file);
      if (url) setFormData(prev => ({ ...prev, photo: url }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.barbershopId || !formData.name || !formData.email) return;
    
    setIsSaving(true);
    try {
      const userData = {
        ...formData,
        barbershopId: currentUser.barbershopId,
        id: editingId || `u-${Date.now()}`
      } as User;

      if (editingId) {
        await updateUser(userData);
      } else {
        await addUser(userData);
      }
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este profissional?')) {
        await deleteUser(id);
    }
  };

  const toggleDay = (day: number) => {
    const currentDays = formData.workDays || [];
    if (currentDays.includes(day)) {
        setFormData({ ...formData, workDays: currentDays.filter(d => d !== day) });
    } else {
        setFormData({ ...formData, workDays: [...currentDays, day].sort() });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/30">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg">
              <UserIcon size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-800 tracking-tight">Equipe ({shopStaff.length})</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Sincronização em tempo real ativa</p>
            </div>
          </div>
          
          <button 
            onClick={() => handleOpenModal()}
            className="bg-gray-900 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-xl w-full md:w-auto"
          >
            <Plus size={18} /> Novo Profissional
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Colaborador</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Função</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Agenda</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {shopStaff.map(staff => (
                <tr key={staff.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-indigo-50 flex items-center justify-center shrink-0">
                        {staff.photo ? (
                          <img src={staff.photo} className="w-full h-full object-cover" alt={staff.name} />
                        ) : (
                          <span className="text-xl font-black text-indigo-300">{staff.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-black text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">{staff.name}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{staff.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-widest">
                      {staff.position || 'Barbeiro'}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    {staff.useSchedule ? (
                        <div className="text-[10px] font-black text-emerald-600 flex items-center justify-center gap-1.5 uppercase tracking-widest">
                            Ativa
                        </div>
                    ) : (
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Inativa</span>
                    )}
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                        <button 
                        onClick={() => handleOpenModal(staff)} 
                        className="p-3 bg-white text-gray-400 hover:text-indigo-600 border border-gray-100 rounded-xl transition-all"
                        >
                            <Edit3 size={18}/>
                        </button>
                        <button 
                        onClick={() => handleDelete(staff.id)} 
                        className="p-3 bg-white text-gray-400 hover:text-red-600 border border-gray-100 rounded-xl transition-all"
                        >
                            <Trash size={18}/>
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200 max-h-[90vh] flex flex-col">
                <div className="bg-gray-900 p-6 text-white flex justify-between items-center shrink-0">
                    <h3 className="font-black uppercase tracking-widest text-sm">
                        {editingId ? 'Editar Profissional' : 'Novo Profissional'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                        <X size={20}/>
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                    {/* Upload de Foto */}
                    <div className="flex flex-col items-center mb-2">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            {formData.photo ? (
                                <img src={formData.photo} className="w-24 h-24 rounded-3xl object-cover border-4 border-indigo-50 shadow-lg" />
                            ) : (
                                <div className="w-24 h-24 rounded-3xl bg-gray-100 flex items-center justify-center text-gray-300 border-4 border-dashed border-gray-200">
                                    {isUploading ? <Loader2 className="animate-spin" size={28} /> : <Camera size={28} />}
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-2 rounded-xl shadow-lg border-2 border-white">
                                <Upload size={14} />
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                        </div>
                        <span className="text-[9px] font-black text-gray-400 uppercase mt-2">Foto de Perfil</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1 md:col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block flex items-center gap-1">
                                <UserCircle size={12} /> Nome Completo
                            </label>
                            <input required className="w-full border-2 border-gray-100 p-4 rounded-xl text-sm font-black focus:border-indigo-500 outline-none bg-white text-black" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Rodrigo Souza" />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block flex items-center gap-1">
                                <Tag size={12} /> Apelido (Exibição)
                            </label>
                            <input className="w-full border-2 border-gray-100 p-4 rounded-xl text-sm font-black focus:border-indigo-500 outline-none bg-white text-black" value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} placeholder="Ex: Rodrigo" />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block flex items-center gap-1">
                                <Mail size={12} /> E-mail Profissional
                            </label>
                            <input required type="email" className="w-full border-2 border-gray-100 p-4 rounded-xl text-sm font-black focus:border-indigo-500 outline-none bg-white text-black" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@barbearia.com" />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block flex items-center gap-1">
                                <Briefcase size={12} /> Cargo / Função
                            </label>
                            <select className="w-full border-2 border-gray-100 p-4 rounded-xl text-sm font-black focus:border-indigo-500 outline-none bg-white text-black appearance-none" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})}>
                                <option>Barbeiro</option>
                                <option>Manicure</option>
                                <option>Gerente</option>
                                <option>Recepção</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block flex items-center gap-1">
                                <Shield size={12} /> Nível de Acesso
                            </label>
                            <select className="w-full border-2 border-gray-100 p-4 rounded-xl text-sm font-black focus:border-indigo-500 outline-none bg-white text-black appearance-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as Role})}>
                                <option value={Role.BARBER}>Barbeiro (Padrão)</option>
                                <option value={Role.BARBERSHOP_ADMIN}>Gerente (Total)</option>
                            </select>
                        </div>
                    </div>

                    {/* Horários */}
                    <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                <Clock size={14} className="text-indigo-600" /> Disponibilidade na Agenda
                            </h4>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={formData.useSchedule} onChange={e => setFormData({...formData, useSchedule: e.target.checked})} />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        {formData.useSchedule && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Início do Turno</label>
                                        <input type="time" className="w-full border-2 border-gray-200 p-3 rounded-xl text-sm font-black text-black bg-white focus:border-indigo-500 outline-none" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Fim do Turno</label>
                                        <input type="time" className="w-full border-2 border-gray-200 p-3 rounded-xl text-sm font-black text-black bg-white focus:border-indigo-500 outline-none" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase mb-2 block">Dias de Trabalho</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((day, i) => (
                                            <button key={i} type="button" onClick={() => toggleDay(i)} className={`w-10 h-10 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${formData.workDays?.includes(i) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}>
                                                {day.charAt(0)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <button 
                            type="submit"
                            disabled={isSaving || isUploading} 
                            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={18}/> : editingId ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
                        </button>
                        
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="w-full py-4 bg-gray-100 text-gray-500 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-gray-200 active:scale-95"
                        >
                            <LogOut size={16} /> Sair
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
