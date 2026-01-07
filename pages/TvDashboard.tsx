
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Role, User, Appointment, Service } from '../types';
import { LOGO_URL } from '../constants';
import { Clock, User as UserIcon, Scissors, Phone, Play, CalendarCheck, CheckCircle2, AlertCircle, LogOut, ArrowLeft, ArrowDown, RefreshCw, Wifi } from 'lucide-react';
import { sanitizeTime } from './Schedule';

export const TvDashboard = () => {
  const { users, appointments, services, currentUser, selectedBarbershop, syncWithGoogleSheets, clients, updateAppointmentStatus, setView } = useApp();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);

  const displayLogo = selectedBarbershop?.logo || LOGO_URL;

  // Clock Update - 60s
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // AUTO-SYNC POLLING - 60s
  useEffect(() => {
    const pollData = async () => {
      if (selectedBarbershop?.googleSheetsUrl) {
        setIsAutoSyncing(true);
        try {
          await syncWithGoogleSheets(selectedBarbershop.googleSheetsUrl);
        } catch (err) {
          console.error("Erro no polling do Monitor:", err);
        } finally {
          setTimeout(() => setIsAutoSyncing(false), 2000);
        }
      }
    };
    pollData();
    const syncInterval = setInterval(pollData, 60000);
    return () => clearInterval(syncInterval);
  }, [selectedBarbershop?.googleSheetsUrl]);

  const getCurrentSlotString = () => {
    const h = currentTime.getHours();
    const m = currentTime.getMinutes();
    const minutesString = m < 30 ? '00' : '30';
    return `${h.toString().padStart(2, '0')}:${minutesString}`;
  };
  
  const currentSlotString = getCurrentSlotString();
  const todayISO = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  useEffect(() => {
    const autoStartAppointments = () => {
        appointments.forEach(apt => {
            if (String(apt.barbershopId).trim() === String(currentUser?.barbershopId).trim() && apt.date === todayISO) {
                if (sanitizeTime(apt.time) === currentSlotString && (apt.status === 'PENDING' || apt.status === 'CONFIRMED')) {
                    updateAppointmentStatus(apt.id, 'IN_PROGRESS');
                }
            }
        });
    };
    autoStartAppointments();
  }, [currentSlotString, appointments, currentUser, todayISO, updateAppointmentStatus]);
  
  const shopBarbers = useMemo(() => {
    return users.filter(u => 
      String(u.barbershopId).trim() === String(currentUser?.barbershopId).trim() && 
      u.role !== Role.SUPER_ADMIN &&
      (u.useSchedule === true || (u.useSchedule as any) === 'true')
    );
  }, [users, currentUser]);

  const shopServices = services.filter(s => String(s.barbershopId).trim() === String(currentUser?.barbershopId).trim());

  const generateDynamicSlots = () => {
    const slots = [];
    const currentHour = currentTime.getHours();
    let startHour = currentHour - 1;
    const totalHoursToShow = 5; 

    for (let i = 0; i < totalHoursToShow; i++) {
      const h = startHour + i;
      if (h >= 0 && h < 24) { 
        slots.push(`${h.toString().padStart(2, '0')}:00`);
        slots.push(`${h.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  const dynamicSlots = generateDynamicSlots();

  const getClient = (id: string) => clients.find(c => String(c.id).trim() === String(id).trim());
  const getService = (id: string) => shopServices.find(s => String(s.id).trim() === String(id).trim());

  const getAppointmentAtTime = (barberId: string, time: string) => {
    const [slotH, slotM] = time.split(':').map(Number);
    const slotTotalMinutes = (Number(slotH) || 0) * 60 + (Number(slotM) || 0);

    return appointments.find(a => {
      if (String(a.barberId).trim() !== String(barberId).trim() || a.date !== todayISO || a.status === 'CANCELLED') return false;
      
      const service = getService(a.serviceId);
      // CORREÇÃO CRÍTICA: Garantir que a duração seja um número para evitar concatenação de strings
      const duration = Number(service?.durationMinutes || 30);
      
      const [startH, startM] = sanitizeTime(a.time).split(':').map(Number);
      const startTotalMinutes = (Number(startH) || 0) * 60 + (Number(startM) || 0);
      const endTotalMinutes = startTotalMinutes + duration;

      // Um agendamento pertence ao slot se ele estiver dentro do intervalo de tempo do serviço
      return slotTotalMinutes >= startTotalMinutes && slotTotalMinutes < endTotalMinutes;
    });
  };

  const calculateEndTime = (startTime: string, duration: any) => {
    const cleanStart = sanitizeTime(startTime);
    if (!cleanStart.includes(':')) return cleanStart;
    
    const [h, m] = cleanStart.split(':').map(Number);
    // CORREÇÃO: Forçar Number(duration) para evitar o bug de "22:30" (soma de string 1050 + "30" = "105030")
    const totalMinutes = (Number(h) * 60) + Number(m) + Number(duration);
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full bg-[#121417] overflow-hidden flex flex-col font-sans">
      <div className="px-6 py-4 bg-[#1a1d21] border-b border-gray-800 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-6">
            <h1 className="text-white font-bold text-2xl flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-zinc-900 border border-gray-800 shadow-2xl flex items-center justify-center shrink-0">
                    <img 
                      src={displayLogo} 
                      alt="Logo" 
                      className="w-full h-full object-cover transition-transform hover:scale-110 duration-500" 
                      onError={(e) => {
                        (e.target as any).src = LOGO_URL;
                      }}
                    />
                </div>
                Monitor de Atendimentos
            </h1>
            
            <div className="flex items-center gap-4">
              <button 
                  onClick={() => setView('DASHBOARD')}
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white px-4 py-2 rounded-xl transition-all border border-gray-700 text-sm font-bold group"
              >
                  <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                  Sair do Modo TV
              </button>

              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 ${
                isAutoSyncing 
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                  : 'bg-green-500/10 border-green-500/30 text-green-400'
              }`}>
                {isAutoSyncing ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Wifi size={14} className="animate-pulse" />
                )}
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {isAutoSyncing ? 'sincronizando' : 'sincronizado'}
                </span>
              </div>
            </div>
        </div>
        <div className="text-right">
            <div className="text-3xl font-bold text-white tracking-widest">
                {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-gray-400 text-sm uppercase font-medium">
                {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
        </div>
      </div>

      <div className="flex-1 p-4 flex gap-4 overflow-hidden">
        {shopBarbers.map(barber => {
          const activeAppointment = getAppointmentAtTime(barber.id, currentSlotString);
          const isBusy = !!activeAppointment;
          const barberPhoto = barber.photo || barber.avatar;
          
          // Controle de renderização para evitar duplicatas na coluna do barbeiro
          const renderedAptIds = new Set<string>();
          let skipSlotsCount = 0;

          return (
            <div key={barber.id} className={`flex-1 flex flex-col rounded-2xl overflow-hidden border shadow-2xl relative transition-colors duration-500 ${
                isBusy ? 'bg-[#1f1a1a] border-red-900/30' : 'bg-[#1f2226] border-gray-800/50'
            }`}>
              
              <div className={`p-4 border-b flex items-center gap-4 shrink-0 transition-colors duration-500 ${
                  isBusy ? 'bg-red-900/20 border-red-900/50' : 'bg-[#25282e] border-gray-700/50'
              }`}>
                 <div className="relative">
                   {barberPhoto ? (
                       <img src={barberPhoto} className={`w-16 h-16 rounded-full object-cover border-2 shadow-lg transition-all ${isBusy ? 'border-red-500' : 'border-green-500'}`} />
                   ) : (
                      <div className={`w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center border-2 ${isBusy ? 'border-red-500' : 'border-green-500'}`}>
                          <UserIcon className="text-gray-400" size={32} />
                      </div>
                   )}
                   <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#25282e] ${isBusy ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                 </div>
                 <div className="overflow-hidden">
                     <h3 className="text-white font-bold text-xl truncate">{barber.nickname || barber.name}</h3>
                     <div className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1 ${
                         isBusy ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                     }`}>
                         {isBusy ? (
                             <><AlertCircle size={10} /> Em Atendimento</>
                         ) : (
                             <><CheckCircle2 size={10} /> Disponível</>
                         )}
                     </div>
                 </div>
              </div>

              <div className="flex-1 flex flex-col p-2 gap-2 h-full justify-between overflow-hidden">
                {dynamicSlots.map((time) => {
                  if (skipSlotsCount > 0) {
                    skipSlotsCount--;
                    return null;
                  }

                  const isPast = time < currentSlotString;
                  const appointment = getAppointmentAtTime(barber.id, time);
                  
                  // Se encontrarmos um agendamento que já foi renderizado nesta coluna, pulamos
                  if (appointment && renderedAptIds.has(appointment.id)) {
                      return null;
                  }

                  const client = appointment ? getClient(appointment.clientId) : null;
                  const service = appointment ? getService(appointment.serviceId) : null;
                  const isInProgress = appointment?.status === 'IN_PROGRESS';
                  const isCompleted = appointment?.status === 'COMPLETED';

                  let flexGrow = 1;
                  if (appointment) {
                    renderedAptIds.add(appointment.id);
                    const duration = Number(service?.durationMinutes || 30);
                    // Calcula quantos slots de 30min esse serviço ocupa
                    flexGrow = Math.max(1, Math.ceil(duration / 30));
                    skipSlotsCount = flexGrow - 1;
                  }

                  let containerClass = "bg-[#25282e] border-gray-700"; 
                  let timeColor = "text-gray-500";
                  
                  if (appointment) {
                      if (isInProgress) {
                          containerClass = `bg-red-900/30 border-red-500 shadow-lg shadow-red-900/20 z-10 ring-1 ring-red-500 scale-100`;
                          timeColor = "text-red-200";
                      } else if (isCompleted) {
                          containerClass = "bg-gray-800 border-gray-700 opacity-60";
                      } else {
                          containerClass = `bg-[#2a2e33] border-blue-500/50`;
                          timeColor = "text-white";
                      }
                  } else {
                      if (!isPast) {
                          containerClass = "bg-green-900/20 border-green-500/50 shadow-inner shadow-green-900/10";
                          timeColor = "text-green-400";
                      } else {
                          containerClass = "bg-[#1f2226] border-gray-800 opacity-40";
                      }
                  }

                  const startTimeDisplay = appointment ? sanitizeTime(appointment.time) : time;
                  const endTimeDisplay = appointment ? calculateEndTime(appointment.time, service?.durationMinutes || 30) : '';

                  return (
                    <div 
                      key={time} 
                      style={{ flexGrow }}
                      className={`flex-grow rounded-xl border flex flex-col justify-center px-4 relative transition-all duration-500 ease-in-out shrink-0 ${containerClass}`}
                    >
                      <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3 w-full">
                              <span className={`text-xl font-bold font-mono ${timeColor}`}>
                                  {appointment ? (
                                    `${startTimeDisplay} - ${endTimeDisplay}`
                                  ) : (
                                    time
                                  )}
                              </span>
                              
                              {isInProgress && (
                                  <span className="ml-auto text-[10px] font-bold uppercase bg-red-600 text-white px-3 py-1 rounded-full animate-pulse flex items-center gap-1 shadow-md">
                                      <AlertCircle size={10} /> Ocupado
                                  </span>
                              )}
                              
                              {!appointment && !isPast && (
                                  <span className="ml-auto text-[10px] font-bold uppercase bg-green-600/20 text-green-400 border border-green-500/50 px-3 py-1 rounded-full flex items-center gap-1">
                                      <CheckCircle2 size={10} /> Livre
                                  </span>
                              )}
                          </div>
                      </div>

                      {appointment ? (
                        <div className="mt-2 animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-3 w-full overflow-hidden">
                                    {client?.photo ? (
                                      <img src={client.photo} className="w-12 h-12 rounded-full object-cover border border-white/20 shadow-lg shrink-0" alt={client.name} />
                                    ) : (
                                      <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-white/50 shrink-0">
                                          <UserIcon size={20} />
                                      </div>
                                    )}
                                    
                                    <div className="overflow-hidden">
                                        <div className={`font-bold text-xl truncate ${isInProgress ? 'text-white' : 'text-gray-200'}`}>
                                            {client?.name || 'Cliente'}
                                        </div>
                                        <div className="flex flex-col gap-0.5 mt-1">
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <Scissors size={12} className={isInProgress ? "text-red-300" : "text-blue-300"} />
                                                <span className={isInProgress ? "text-red-100" : "text-gray-300"}>
                                                  {service?.name} 
                                                  <span className="ml-2 opacity-60 font-mono text-[11px]">
                                                      ({service?.durationMinutes} min)
                                                  </span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                      ) : (
                          <div className="flex items-center gap-2 mt-1">
                              {!isPast ? (
                                  <span className="text-green-500/80 italic text-sm font-medium">Horário Livre</span>
                              ) : (
                                  <span className="text-gray-700 italic text-xs">Finalizado</span>
                              )}
                          </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {shopBarbers.length === 0 && (
             <div className="w-full h-full flex items-center justify-center text-gray-500 flex-col gap-4">
                 <CalendarCheck size={64} className="opacity-20" />
                 <p className="text-xl">Nenhum barbeiro com agenda ativa para exibição.</p>
             </div>
        )}
      </div>
    </div>
  );
};
