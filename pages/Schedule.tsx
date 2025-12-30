
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Appointment, CalendarViewType, Role, User } from '../types';
import { 
  ChevronLeft, ChevronRight, Users, Plus, Edit2, X, 
  Calendar as CalendarIcon, Clock, Check, User as UserIcon, 
  Lock, Trash2, Scissors, ArrowDown, Search, AlertCircle, Loader2,
  CheckCircle2
} from 'lucide-react';

const formatDateISO = (date: Date) => date.toLocaleDateString('en-CA');

export const Schedule = () => {
  const { 
    appointments, users, services, addAppointment, 
    deleteAppointment, currentUser, clients, selectedBarbershop 
  } = useApp();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<CalendarViewType>('day');
  const [selectedBarberFilter, setSelectedBarberFilter] = useState<string>('all');
  
  // Estados de Modal
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [aptToDelete, setAptToDelete] = useState<Appointment | null>(null);

  // Estado do Novo Agendamento
  const [newBooking, setNewBooking] = useState({ 
    barberId: '', 
    serviceId: '', 
    clientId: '', 
    time: '',
    loading: false
  });

  // Identifica o ID da barbearia ativa (Perfil ou Seleção do Super Admin)
  const currentShopId = useMemo(() => {
    return selectedBarbershop?.id || currentUser?.barbershopId || '';
  }, [currentUser, selectedBarbershop]);

  // Filtros de dados vinculados à unidade ativa
  const shopBarbers = useMemo(() => 
    users.filter(u => String(u.barbershopId).trim() === String(currentShopId).trim() && u.role !== Role.SUPER_ADMIN),
    [users, currentShopId]
  );
  
  const displayedBarbers = selectedBarberFilter === 'all' ? shopBarbers : shopBarbers.filter(b => b.id === selectedBarberFilter);
  const shopServices = services.filter(s => String(s.barbershopId).trim() === String(currentShopId).trim());
  const shopClients = clients.filter(c => String(c.barbershopId).trim() === String(currentShopId).trim());

  const getClient = (id: string) => clients.find(c => String(c.id).trim() === String(id).trim());
  const getService = (id: string) => shopServices.find(s => String(s.id).trim() === String(id).trim());

  const getAppointmentForSlot = (barberId: string, time: string, date: Date) => {
    const dateKey = formatDateISO(date);
    const [slotH, slotM] = time.split(':').map(Number);
    const slotTotalMinutes = slotH * 60 + slotM;

    return appointments.find(apt => {
      if (String(apt.barberId).trim() !== String(barberId).trim() || apt.date !== dateKey || apt.status === 'CANCELLED') return false;
      
      const service = getService(apt.serviceId);
      const duration = service?.durationMinutes || 30;
      
      const [startH, startM] = apt.time.split(':').map(Number);
      const startTotalMinutes = startH * 60 + startM;
      const endTotalMinutes = startTotalMinutes + duration;

      return slotTotalMinutes >= startTotalMinutes && slotTotalMinutes < endTotalMinutes;
    });
  };

  const calculateEndTime = (startTime: string, duration: number) => {
    const [h, m] = startTime.split(':').map(Number);
    const totalMinutes = h * 60 + m + duration;
    const endH = Math.floor(totalMinutes / 60);
    const endM = totalMinutes % 60;
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  };

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewType === 'day') newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const handleOpenBooking = (barberId: string, time: string) => {
    setNewBooking({ 
      barberId, 
      time, 
      serviceId: shopServices[0]?.id || '', 
      clientId: shopClients[0]?.id || '',
      loading: false
    });
    setIsBookingModalOpen(true);
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShopId || !newBooking.clientId || !newBooking.serviceId || !newBooking.barberId) {
      alert("Preencha todos os campos do agendamento.");
      return;
    }

    setNewBooking(prev => ({ ...prev, loading: true }));
    try {
      await addAppointment({
        barbershopId: currentShopId,
        barberId: newBooking.barberId,
        clientId: newBooking.clientId,
        serviceId: newBooking.serviceId,
        date: formatDateISO(currentDate),
        time: newBooking.time,
        status: 'PENDING'
      });
      setIsBookingModalOpen(false);
    } catch (err) {
      alert("Erro ao salvar agendamento na planilha.");
    } finally {
      setNewBooking(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteApt = async () => {
    if (aptToDelete) {
      setIsDeleting(true);
      try {
        await deleteAppointment(aptToDelete.id);
        setAptToDelete(null);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 21; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  const isBarberAvailable = (barber: User, time: string, date: Date) => {
    const dayOfWeek = date.getDay();
    if (barber.workDays && !barber.workDays.includes(dayOfWeek)) return false;
    if (!barber.startTime || !barber.endTime) return true; // Se não definido, assume disponível
    
    const [h, m] = time.split(':').map(Number);
    const [startH, startM] = barber.startTime.split(':').map(Number);
    const [endH, endM] = barber.endTime.split(':').map(Number);
    
    const timeVal = h * 60 + m;
    const startVal = startH * 60 + startM;
    const endVal = endH * 60 + endM;
    
    return timeVal >= startVal && timeVal < endVal;
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header Agenda */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex items-center space-x-6">
          <div className="flex items-center bg-gray-50 rounded-2xl p-1.5 border border-gray-100">
            <button onClick={() => navigate('prev')} className="p-2.5 hover:bg-white rounded-xl text-gray-600 transition-all hover:shadow-sm"><ChevronLeft size={20} /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-6 text-xs font-black text-gray-700 uppercase tracking-widest">Hoje</button>
            <button onClick={() => navigate('next')} className="p-2.5 hover:bg-white rounded-xl text-gray-600 transition-all hover:shadow-sm"><ChevronRight size={20} /></button>
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight capitalize">
            {currentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <select 
            value={selectedBarberFilter} 
            onChange={(e) => setSelectedBarberFilter(e.target.value)} 
            className="border-2 border-gray-50 p-4 rounded-2xl text-[10px] font-black outline-none text-gray-700 focus:border-blue-500 bg-gray-50 uppercase tracking-widest"
          >
            <option value="all">TODOS BARBEIROS</option>
            {shopBarbers.map(b => <option key={b.id} value={b.id}>{b.nickname || b.name.toUpperCase()}</option>)}
          </select>
          <button 
            onClick={() => handleOpenBooking('', '09:00')}
            className="bg-gray-900 text-white p-4 rounded-2xl hover:bg-black transition-all shadow-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest"
          >
            <Plus size={20} /> Novo Horário
          </button>
        </div>
      </div>

      {/* Grid da Agenda */}
      <div className="flex-1 overflow-x-auto bg-white rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="min-w-[900px]">
          <div className="flex border-b border-gray-100 sticky top-0 z-20 bg-white">
            <div className="w-24 p-6 border-r border-gray-100 bg-gray-50/50 shrink-0 text-[10px] font-black uppercase text-gray-400 flex items-center justify-center tracking-[0.2em]">Hora</div>
            {displayedBarbers.map(barber => (
              <div key={barber.id} className="flex-1 p-6 bg-gray-50/30 border-r border-gray-100 font-black text-center text-gray-800 flex flex-col items-center">
                <span className="text-sm tracking-tight">{barber.nickname || barber.name}</span>
                <div className="flex items-center gap-1.5 mt-1 opacity-40">
                   <Clock size={12} />
                   <span className="text-[10px] font-mono">{barber.startTime || '09:00'} - {barber.endTime || '19:00'}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="custom-scrollbar overflow-y-auto max-h-[calc(100vh-320px)]">
            {timeSlots.map(time => (
              <div key={time} className="flex border-b border-gray-50 last:border-0 min-h-[90px]">
                <div className="w-24 p-2 border-r border-gray-100 text-[11px] text-gray-400 font-black text-center shrink-0 flex items-center justify-center bg-gray-50/20 font-mono">
                  {time}
                </div>
                {displayedBarbers.map(barber => {
                  const apt = getAppointmentForSlot(barber.id, time, currentDate);
                  const isStart = apt?.time === time;
                  const client = apt ? getClient(apt.clientId) : null;
                  const available = isBarberAvailable(barber, time, currentDate);
                  const service = apt ? getService(apt.serviceId) : null;
                  
                  return (
                    <div 
                      key={`${barber.id}-${time}`} 
                      className={`flex-1 p-2 border-r border-gray-50 relative group last:border-0 transition-all ${
                          !available ? 'bg-zinc-200/50' : 'hover:bg-blue-50/30 cursor-pointer'
                      }`}
                      onClick={() => !apt && available && handleOpenBooking(barber.id, time)}
                    >
                      {apt ? (
                        <div className={`h-full p-4 rounded-3xl text-xs border-l-4 shadow-sm transition-all flex items-center gap-4 animate-in fade-in slide-in-from-left-2 duration-300 z-10 relative group/apt ${
                          !isStart ? 'bg-zinc-100 border-zinc-200 text-zinc-600 font-black opacity-70' : 
                          apt.status === 'CONFIRMED' ? 'bg-green-50 border-green-500 text-black font-black' : 
                          apt.status === 'IN_PROGRESS' ? 'bg-blue-50 border-blue-500 text-black font-black' : 'bg-gray-100 border-gray-400 text-black font-black'
                        }`}>
                          {isStart ? (
                            <>
                              <div className="w-12 h-12 rounded-2xl bg-white/80 flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
                                {client?.photo ? (
                                  <img src={client.photo} className="w-full h-full object-cover rounded-2xl" />
                                ) : <UserIcon size={20} className="text-gray-300" />}
                              </div>
                              <div className="overflow-hidden flex-1">
                                <div className="font-black text-sm tracking-tight truncate text-black">{client?.name || 'Cliente'}</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-black truncate flex items-center gap-1">
                                    <Scissors size={10} className="text-black" /> {service?.name || 'Serviço'}
                                </div>
                              </div>
                              
                              <button 
                                onClick={(e) => { e.stopPropagation(); setAptToDelete(apt); }}
                                className="opacity-0 group-hover/apt:opacity-100 p-3 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-2xl transition-all shrink-0"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-zinc-400 w-full justify-center">
                               <ArrowDown size={14} />
                            </div>
                          )}
                        </div>
                      ) : available ? (
                        <div className="opacity-0 group-hover:opacity-100 absolute inset-0 w-full h-full flex items-center justify-center bg-blue-50/50 transition-opacity z-10">
                          <div className="bg-white p-3 rounded-full shadow-xl text-blue-600 scale-90 group-hover:scale-100 transition-transform">
                            <Plus size={20} />
                          </div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40">
                          <Lock size={16} className="text-zinc-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Novo Agendamento */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-xl">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in duration-300">
             <div className="bg-gray-900 p-8 text-white flex justify-between items-center">
                <div>
                   <h3 className="text-2xl font-black tracking-tight">Novo Agendamento</h3>
                   <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
                      {formatDateISO(currentDate).split('-').reverse().join('/')} às {newBooking.time}
                   </p>
                </div>
                <button onClick={() => setIsBookingModalOpen(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                   <X size={24} />
                </button>
             </div>
             
             <form onSubmit={handleCreateBooking} className="p-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Profissional</label>
                      <select 
                        required
                        value={newBooking.barberId}
                        onChange={e => setNewBooking({...newBooking, barberId: e.target.value})}
                        className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold bg-gray-50 focus:border-blue-500 outline-none transition-all text-black"
                      >
                         <option value="">Selecione...</option>
                         {shopBarbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Horário</label>
                      <input 
                        type="time" 
                        required 
                        value={newBooking.time}
                        onChange={e => setNewBooking({...newBooking, time: e.target.value})}
                        className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold bg-gray-50 focus:border-blue-500 outline-none transition-all text-black"
                      />
                   </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cliente</label>
                    <select 
                      required
                      value={newBooking.clientId}
                      onChange={e => setNewBooking({...newBooking, clientId: e.target.value})}
                      className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold bg-gray-50 focus:border-blue-500 outline-none transition-all text-black"
                    >
                       <option value="">Selecione um cliente...</option>
                       {shopClients.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Serviço</label>
                    <select 
                      required
                      value={newBooking.serviceId}
                      onChange={e => setNewBooking({...newBooking, serviceId: e.target.value})}
                      className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold bg-gray-50 focus:border-blue-500 outline-none transition-all text-black"
                    >
                       <option value="">Selecione o serviço...</option>
                       {shopServices.map(s => <option key={s.id} value={s.id}>{s.name} (R$ {s.price.toFixed(2)})</option>)}
                    </select>
                </div>

                <button 
                  type="submit" 
                  disabled={newBooking.loading}
                  className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {newBooking.loading ? <Loader2 size={24} className="animate-spin" /> : <>Confirmar Agendamento <Check size={20} /></>}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Modal Deletar Agendamento */}
      {aptToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 backdrop-blur-md">
           <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full text-center space-y-6 shadow-2xl animate-in zoom-in duration-200">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                 <AlertCircle size={40} />
              </div>
              <div>
                 <h4 className="text-2xl font-black text-gray-900 tracking-tight">Cancelar Horário?</h4>
                 <p className="text-gray-500 font-bold text-sm mt-2">Esta ação removerá o agendamento da planilha de forma permanente.</p>
              </div>
              <div className="flex flex-col gap-3 pt-4">
                 <button 
                   onClick={handleDeleteApt}
                   disabled={isDeleting}
                   className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-100 flex items-center justify-center gap-2"
                 >
                    {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Confirmar Cancelamento'}
                 </button>
                 <button 
                   onClick={() => setAptToDelete(null)}
                   className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                 >
                    Manter Horário
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
