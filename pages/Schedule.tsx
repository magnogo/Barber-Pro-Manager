
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Appointment, CalendarViewType, Role, User } from '../types';
import { 
  ChevronLeft, ChevronRight, Plus, X, 
  Clock, Check, User as UserIcon, 
  Lock, Trash2, Scissors, ArrowDown, AlertCircle, Loader2
} from 'lucide-react';

const formatDateISO = (date: Date) => date.toLocaleDateString('en-CA');

/**
 * Função auxiliar para limpar e corrigir horários vindo do Google Sheets.
 * Corrige o bug histórico de fuso horário de 1899 (comum no Brasil/Google Sheets).
 */
export const sanitizeTime = (timeStr: string): string => {
  if (!timeStr) return '';
  if (typeof timeStr !== 'string') return String(timeStr);
  
  // Se for uma string ISO de 1899 (Bug de fuso histórico do Google Sheets)
  if (timeStr.includes('1899-12')) {
    try {
      const date = new Date(timeStr);
      // O erro histórico de 1899 no Brasil é de exatamente 3h 06min (186 minutos)
      date.setMinutes(date.getMinutes() - 186);
      
      const hh = date.getUTCHours().toString().padStart(2, '0');
      const mm = date.getUTCMinutes().toString().padStart(2, '0');
      return `${hh}:${mm}`;
    } catch (e) {
      if (timeStr.includes('T')) return timeStr.split('T')[1].substring(0, 5);
    }
  }

  if (timeStr.includes('T')) {
    return timeStr.split('T')[1].substring(0, 5);
  }
  
  // Caso seja um formato HH:mm:ss ou similar
  return timeStr.substring(0, 5);
};

export const Schedule = () => {
  const { 
    appointments, users, services, addAppointment, 
    deleteAppointment, currentUser, clients, selectedBarbershop 
  } = useApp();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<CalendarViewType>('day');
  const [selectedBarberFilter, setSelectedBarberFilter] = useState<string>('all');
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [aptToDelete, setAptToDelete] = useState<Appointment | null>(null);

  const [newBooking, setNewBooking] = useState({ 
    barberId: '', 
    serviceId: '', 
    clientId: '', 
    time: '',
    loading: false
  });

  const currentShopId = useMemo(() => {
    return selectedBarbershop?.id || currentUser?.barbershopId || '';
  }, [currentUser, selectedBarbershop]);

  // FILTRO: Mostra apenas profissionais que estão com useSchedule === true
  const shopBarbers = useMemo(() => 
    users.filter(u => 
      String(u.barbershopId).trim() === String(currentShopId).trim() && 
      u.role !== Role.SUPER_ADMIN &&
      u.useSchedule === true
    ),
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
      
      // Sanitização do horário do agendamento
      const cleanAptTime = sanitizeTime(apt.time);
      const [startH, startM] = cleanAptTime.split(':').map(Number);
      const startTotalMinutes = (startH || 0) * 60 + (startM || 0);
      const endTotalMinutes = startTotalMinutes + duration;

      return slotTotalMinutes >= startTotalMinutes && slotTotalMinutes < endTotalMinutes;
    });
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
    } finally {
      setNewBooking(prev => ({ ...prev, loading: false }));
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
    
    // Verificação de horário de expediente com sanitização
    const slotMin = (parseInt(time.split(':')[0]) * 60) + parseInt(time.split(':')[1]);
    const startMin = (parseInt(sanitizeTime(barber.startTime || '09:00').split(':')[0]) * 60) + parseInt(sanitizeTime(barber.startTime || '09:00').split(':')[1]);
    const endMin = (parseInt(sanitizeTime(barber.endTime || '19:00').split(':')[0]) * 60) + parseInt(sanitizeTime(barber.endTime || '19:00').split(':')[1]);
    
    return slotMin >= startMin && slotMin < endMin;
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-800 shadow-2xl">
        <div className="flex items-center space-x-6">
          <div className="flex items-center bg-black/40 rounded-2xl p-1.5 border border-zinc-800">
            <button onClick={() => navigate('prev')} className="p-2.5 hover:bg-zinc-800 rounded-xl text-zinc-400 transition-all"><ChevronLeft size={20} /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-6 text-xs font-black text-white uppercase tracking-widest">Hoje</button>
            <button onClick={() => navigate('next')} className="p-2.5 hover:bg-zinc-800 rounded-xl text-zinc-400 transition-all"><ChevronRight size={20} /></button>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight capitalize">
            {currentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <select 
            value={selectedBarberFilter} 
            onChange={(e) => setSelectedBarberFilter(e.target.value)} 
            className="border-2 border-zinc-800 p-4 rounded-2xl text-[10px] font-black outline-none text-white focus:border-blue-500 bg-black uppercase tracking-widest"
          >
            <option value="all">TODOS BARBEIROS</option>
            {shopBarbers.map(b => <option key={b.id} value={b.id}>{b.nickname || b.name.toUpperCase()}</option>)}
          </select>
          <button 
            onClick={() => handleOpenBooking('', '09:00')}
            className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition-all shadow-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest"
          >
            <Plus size={20} /> Novo Horário
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto bg-zinc-900 rounded-[2.5rem] border border-zinc-800 shadow-2xl">
        <div className="min-w-[900px]">
          <div className="flex border-b border-zinc-800 sticky top-0 z-20 bg-zinc-950">
            <div className="w-24 p-6 border-r border-zinc-800 bg-black text-[10px] font-black uppercase text-zinc-600 flex items-center justify-center tracking-[0.2em]">Hora</div>
            {displayedBarbers.map(barber => (
              <div key={barber.id} className="flex-1 p-6 border-r border-zinc-800 font-black text-center text-white flex flex-col items-center">
                <span className="text-sm tracking-tight">{barber.nickname || barber.name}</span>
                <div className="flex items-center gap-1.5 mt-1 opacity-40">
                   <Clock size={12} />
                   <span className="text-[10px] font-mono">{sanitizeTime(barber.startTime || '09:00')} - {sanitizeTime(barber.endTime || '19:00')}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="custom-scrollbar overflow-y-auto max-h-[calc(100vh-320px)]">
            {timeSlots.map(time => (
              <div key={time} className="flex border-b border-zinc-800 last:border-0 min-h-[90px]">
                <div className="w-24 p-2 border-r border-zinc-800 text-[11px] text-zinc-500 font-black text-center shrink-0 flex items-center justify-center bg-black/40 font-mono">
                  {time}
                </div>
                {displayedBarbers.map(barber => {
                  const apt = getAppointmentForSlot(barber.id, time, currentDate);
                  const isStart = sanitizeTime(apt?.time || '') === time;
                  const client = apt ? getClient(apt.clientId) : null;
                  const available = isBarberAvailable(barber, time, currentDate);
                  const service = apt ? getService(apt.serviceId) : null;
                  
                  return (
                    <div 
                      key={`${barber.id}-${time}`} 
                      className={`flex-1 p-2 border-r border-zinc-800 relative group last:border-0 transition-all ${
                          !available ? 'bg-zinc-800/30' : 'hover:bg-blue-600/5 cursor-pointer'
                      }`}
                      onClick={() => !apt && available && handleOpenBooking(barber.id, time)}
                    >
                      {apt ? (
                        <div className={`h-full p-4 rounded-3xl text-xs border-l-4 shadow-xl transition-all flex items-center gap-4 animate-in fade-in slide-in-from-left-2 duration-300 z-10 relative group/apt ${
                          !isStart ? 'bg-zinc-800/50 border-zinc-700 text-zinc-500 font-black opacity-50' : 
                          apt.status === 'CONFIRMED' ? 'bg-green-500/10 border-green-500 text-white font-black' : 
                          apt.status === 'IN_PROGRESS' ? 'bg-blue-500/10 border-blue-500 text-white font-black' : 'bg-zinc-800 border-zinc-600 text-white font-black'
                        }`}>
                          {isStart ? (
                            <>
                              <div className="w-12 h-12 rounded-2xl bg-zinc-950 flex items-center justify-center shrink-0 border border-zinc-800">
                                {client?.photo ? (
                                  <img src={client.photo} className="w-full h-full object-cover rounded-2xl" />
                                ) : <UserIcon size={20} className="text-zinc-600" />}
                              </div>
                              <div className="overflow-hidden flex-1">
                                <div className="font-black text-sm tracking-tight truncate text-white">{client?.name || 'Cliente'}</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 truncate flex items-center gap-1">
                                    <Scissors size={10} /> {service?.name || 'Serviço'}
                                </div>
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setAptToDelete(apt); }}
                                className="opacity-0 group-hover/apt:opacity-100 p-3 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all shrink-0"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-zinc-600 w-full justify-center">
                               <ArrowDown size={14} />
                            </div>
                          )}
                        </div>
                      ) : available ? (
                        <div className="opacity-0 group-hover:opacity-100 absolute inset-0 w-full h-full flex items-center justify-center bg-blue-600/5 transition-opacity z-10">
                          <div className="bg-blue-600 p-3 rounded-full shadow-xl text-white scale-90 group-hover:scale-100 transition-transform">
                            <Plus size={20} />
                          </div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40">
                          <Lock size={16} className="text-zinc-700" />
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

      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-xl">
          <div className="bg-zinc-900 rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden border border-zinc-800 animate-in zoom-in duration-300">
             <div className="bg-black p-8 text-white flex justify-between items-center border-b border-zinc-800">
                <div>
                   <h3 className="text-2xl font-black tracking-tight">Novo Agendamento</h3>
                   <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
                      {formatDateISO(currentDate).split('-').reverse().join('/')} às {newBooking.time}
                   </p>
                </div>
                <button onClick={() => setIsBookingModalOpen(false)} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl transition-all">
                   <X size={24} />
                </button>
             </div>
             
             <form onSubmit={handleCreateBooking} className="p-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Profissional</label>
                      <select required value={newBooking.barberId} onChange={e => setNewBooking({...newBooking, barberId: e.target.value})} className="w-full border-2 border-zinc-800 p-4 rounded-2xl text-sm font-bold bg-black focus:border-blue-600 outline-none transition-all text-white">
                         <option value="">Selecione...</option>
                         {shopBarbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Horário</label>
                      <input type="time" required value={newBooking.time} onChange={e => setNewBooking({...newBooking, time: e.target.value})} className="w-full border-2 border-zinc-800 p-4 rounded-2xl text-sm font-bold bg-black focus:border-blue-600 outline-none transition-all text-white" />
                   </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Cliente</label>
                    <select required value={newBooking.clientId} onChange={e => setNewBooking({...newBooking, clientId: e.target.value})} className="w-full border-2 border-zinc-800 p-4 rounded-2xl text-sm font-bold bg-black focus:border-blue-600 outline-none transition-all text-white">
                       <option value="">Selecione um cliente...</option>
                       {shopClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Serviço</label>
                    <select required value={newBooking.serviceId} onChange={e => setNewBooking({...newBooking, serviceId: e.target.value})} className="w-full border-2 border-zinc-800 p-4 rounded-2xl text-sm font-bold bg-black focus:border-blue-600 outline-none transition-all text-white">
                       <option value="">Selecione o serviço...</option>
                       {shopServices.map(s => <option key={s.id} value={s.id}>{s.name} (R$ {s.price.toFixed(2)})</option>)}
                    </select>
                </div>
                <button type="submit" disabled={newBooking.loading} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
                  {newBooking.loading ? <Loader2 size={24} className="animate-spin" /> : <>Confirmar Agendamento <Check size={20} /></>}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};
