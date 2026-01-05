
import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
    User as UserIcon, Plus, Edit3, Trash, X, Calendar, Clock, 
    Check, Briefcase, Loader2, Database, Camera, Image as ImageIcon, 
    Save, Upload, Mail, Shield, UserCircle, Tag, LogOut
} from 'lucide-react';
import { User, Role } from '../types';
import { uploadImageToImgBB } from '../services/imageService';
import { sanitizeTime } from './Schedule';

/**
 * Função utilitária para converter o campo workDays vindo da planilha
 * Suporta array real, string JSON "[1,2]" ou lista "1,2,3"
 */
const parseWorkDays = (val: any): number[] => {
  if (!val) return [1, 2, 3, 4, 5, 6];
  if (Array.isArray(val)) return val;
  if (typeof val === 'number') return [val];
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return [1, 2, 3, 4, 5, 6];
    
    // Tenta parse como JSON (formato [1,2,3])
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.warn("Falha ao processar workDays como JSON:", val);
      }
    }
    
    // Fallback para lista separada por vírgula (formato 1,2,3)
    return trimmed.split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n));
  }
  return [1, 2, 3, 4, 5, 6];
};

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
        useSchedule: user.useSchedule !== undefined ? (typeof user.useSchedule === 'string' ? user.useSchedule === 'true' : !!user.useSchedule) : true,
        startTime: sanitizeTime(user.startTime || '09:00'),
        endTime: sanitizeTime(user.endTime || '19:00'),
        workDays: parseWorkDays(user.workDays)
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
      <div className="bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-800 overflow-hidden">
        <div className="p-8 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-black/20">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl shadow-blue-500/20">
              <UserIcon size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Equipe ({shopStaff.length})</h3>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-0.5">Gestão de Colaboradores em tempo real</p>
            </div>
          </div>
          
          <button 
            onClick={() => handleOpenModal()}
            className="bg-white text-black px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all shadow-xl w-full md:w-auto active:scale-95"
          >
            <Plus size={18} /> Novo Profissional
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/40">
              <tr>
                <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Colaborador</th>
                <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Função</th>
                <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center">Agenda</th>
                <th className="p-6 text-[10px] font-black text-zinc-600 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {shopStaff.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-zinc-600">
                    <div className="flex flex-col items-center gap-4">
                      <UserIcon size={48} className="opacity-10" />
                      <p className="font-bold text-sm uppercase tracking-widest">Nenhum profissional cadastrado.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                shopStaff.map(staff => (
                  <tr key={staff.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-zinc-800 bg-black flex items-center justify-center shrink-0">
                          {staff.photo ? (
                            <img src={staff.photo} className="w-full h-full object-cover" alt={staff.name} />
                          ) : (
                            <span className="text-xl font-black text-zinc-700">{staff.name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-black text-white text-sm group-hover:text-blue-500 transition-colors">{staff.name}</div>
                          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">{staff.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-[10px] font-black text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full uppercase tracking-widest border border-zinc-700">
                        {staff.position || 'Barbeiro'}
                      </span>
                    </td>
                    <td className="p-6 text-center">
                      {(staff.useSchedule === true || (staff.useSchedule as any) === 'true') ? (
                          <div className="text-[10px] font-black text-emerald-500 flex items-center justify-center gap-1.5 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 mx-auto w-fit">
                              Ativa
                          </div>
                      ) : (
                          <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Inativa</span>
                      )}
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleOpenModal(staff)} 
                            className="p-3 bg-zinc-950 text-zinc-500 hover:text-blue-500 border border-zinc-800 rounded-xl transition-all hover:bg-zinc-800"
                          >
                              <Edit3 size={18}/>
                          </button>
                          <button 
                            onClick={() => handleDelete(staff.id)} 
                            className="p-3 bg-zinc-950 text-zinc-500 hover:text-red-500 border border-zinc-800 rounded-xl transition-all hover:bg-zinc-800"
                          >
                              <Trash size={18}/>
                          </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-xl">
            <div className="bg-zinc-950 rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200 max-h-[90vh] flex flex-col border border-zinc-900">
                <div className="bg-black p-6 text-white flex justify-between items-center shrink-0 border-b border-zinc-900">
                    <div>
                        <h3 className="font-black uppercase tracking-[0.2em] text-sm">
                            {editingId ? 'Editar Perfil' : 'Novo Colaborador'}
                        </h3>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-full transition-all text-zinc-500">
                        <X size={20}/>
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-zinc-950">
                    {/* Upload de Foto */}
                    <div className="flex flex-col items-center mb-2">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            {formData.photo ? (
                                <img src={formData.photo} className="w-24 h-24 rounded-[2rem] object-cover border-2 border-blue-500/30 shadow-2xl" />
                            ) : (
                                <div className="w-24 h-24 rounded-[2rem] bg-zinc-900 flex items-center justify-center text-zinc-700 border-2 border-dashed border-zinc-800 group-hover:border-blue-500/50 transition-colors">
                                    {isUploading ? <Loader2 className="animate-spin" size={28} /> : <Camera size={28} />}
                                </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-2.5 rounded-2xl shadow-xl border border-blue-400/20">
                                <Upload size={14} />
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                        </div>
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-4">Foto Profissional</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-1">
                                <UserCircle size={12} /> Nome Completo
                            </label>
                            <input required className="w-full bg-black border border-zinc-900 p-4 rounded-2xl text-sm font-bold focus:border-blue-600 outline-none transition-all text-white placeholder:text-zinc-800" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Rodrigo Souza" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-1">
                                <Tag size={12} /> Apelido
                            </label>
                            <input className="w-full bg-black border border-zinc-900 p-4 rounded-2xl text-sm font-bold focus:border-blue-600 outline-none transition-all text-white placeholder:text-zinc-800" value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} placeholder="Ex: Rodrigo" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-1">
                                <Mail size={12} /> E-mail
                            </label>
                            <input required type="email" className="w-full bg-black border border-zinc-900 p-4 rounded-2xl text-sm font-bold focus:border-blue-600 outline-none transition-all text-white placeholder:text-zinc-800" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@barbearia.com" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-1">
                                <Briefcase size={12} /> Função
                            </label>
                            <select className="w-full bg-black border border-zinc-900 p-4 rounded-2xl text-sm font-bold focus:border-blue-600 outline-none transition-all text-white appearance-none" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})}>
                                <option>Barbeiro</option>
                                <option>Manicure</option>
                                <option>Gerente</option>
                                <option>Recepção</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-1">
                                <Shield size={12} /> Permissões
                            </label>
                            <select className="w-full bg-black border border-zinc-900 p-4 rounded-2xl text-sm font-bold focus:border-blue-600 outline-none transition-all text-white appearance-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as Role})}>
                                <option value={Role.BARBER}>Barbeiro</option>
                                <option value={Role.BARBERSHOP_ADMIN}>Administrador</option>
                            </select>
                        </div>
                    </div>

                    {/* Horários */}
                    <div className="p-6 bg-black rounded-[2rem] border border-zinc-900 space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Clock size={14} className="text-blue-500" /> Disponibilidade
                            </h4>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={formData.useSchedule} onChange={e => setFormData({...formData, useSchedule: e.target.checked})} />
                                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-600 after:border-zinc-800 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {formData.useSchedule && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-1 block">Início</label>
                                        <input type="time" className="w-full bg-zinc-950 border border-zinc-900 p-3 rounded-xl text-sm font-bold text-white focus:border-blue-600 outline-none" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-1 block">Fim</label>
                                        <input type="time" className="w-full bg-zinc-950 border border-zinc-900 p-3 rounded-xl text-sm font-bold text-white focus:border-blue-600 outline-none" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-3 block">Dias da Semana</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((day, i) => (
                                            <button 
                                              key={i} 
                                              type="button" 
                                              onClick={() => toggleDay(i)} 
                                              className={`w-10 h-10 rounded-xl text-[10px] font-black uppercase transition-all border ${
                                                formData.workDays?.includes(i) 
                                                  ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/20' 
                                                  : 'bg-zinc-900 text-zinc-700 border-zinc-800 hover:border-zinc-700 hover:text-zinc-500'
                                              }`}
                                            >
                                                {day.charAt(0)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        <button 
                            type="submit"
                            disabled={isSaving || isUploading} 
                            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/10 flex items-center justify-center gap-2 transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={18}/> : editingId ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                        </button>
                        
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="w-full py-5 bg-zinc-900 text-zinc-500 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-zinc-800 hover:text-zinc-400 active:scale-95"
                        >
                            Descartar
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
