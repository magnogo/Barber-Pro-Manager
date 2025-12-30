
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { User, Service, Client, Appointment } from '../types';
import { LOGO_URL } from '../constants';
import { uploadImageToImgBB } from '../services/imageService';
import { 
  Phone, 
  User as UserIcon, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Scissors, 
  ArrowLeft, 
  Loader2, 
  Share2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Check,
  Search,
  UserPlus,
  Camera,
  Upload,
  Info,
  Copy,
  MessageCircle,
  QrCode
} from 'lucide-react';

interface ClientBookingProps {
  isPublic?: boolean;
}

export const ClientBooking: React.FC<ClientBookingProps> = ({ isPublic = false }) => {
  const { selectedBarbershop, users, services, appointments, clients, addAppointment, addClient, setView, syncWithGoogleSheets, currentUser } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [showServiceWarning, setShowServiceWarning] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    email: '',
    photo: '',
    barberId: '',
    serviceId: '',
    date: new Date().toLocaleDateString('en-CA'),
    time: ''
  });

  const [foundClient, setFoundClient] = useState<Client | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Geração do Link de Compartilhamento
  const bookingUrl = useMemo(() => {
    if (!selectedBarbershop) return '';
    const base = window.location.origin + window.location.pathname;
    return `${base}?shop=${selectedBarbershop.id}`;
  }, [selectedBarbershop]);

  const qrCodeUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(bookingUrl)}`;
  }, [bookingUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Olá! Agende seu horário na ${selectedBarbershop?.name} clicando no link abaixo:\n\n${bookingUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Sincroniza dados da planilha assim que a página abre
  useEffect(() => {
    const initSync = async () => {
      if (selectedBarbershop?.googleSheetsUrl) {
        setIsSyncing(true);
        try {
          await syncWithGoogleSheets(selectedBarbershop.googleSheetsUrl);
        } catch (e) {
          console.error("Falha ao sincronizar agenda do cliente:", e);
        } finally {
          setIsSyncing(false);
        }
      }
    };
    initSync();
  }, [selectedBarbershop?.googleSheetsUrl]);

  const shopBarbers = useMemo(() => 
    users.filter(u => String(u.barbershopId).trim() === String(selectedBarbershop?.id).trim() && u.useSchedule),
    [users, selectedBarbershop]
  );

  const shopServices = useMemo(() => 
    services.filter(s => String(s.barbershopId).trim() === String(selectedBarbershop?.id).trim()),
    [services, selectedBarbershop]
  );

  const shopClients = useMemo(() => 
    clients.filter(c => String(c.barbershopId).trim() === String(selectedBarbershop?.id).trim()),
    [clients, selectedBarbershop]
  );

  const selectedBarber = useMemo(() => 
    shopBarbers.find(b => b.id === formData.barberId),
    [formData.barberId, shopBarbers]
  );

  const selectedService = useMemo(() => 
    shopServices.find(s => s.id === formData.serviceId),
    [formData.serviceId, shopServices]
  );

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.split('-').reverse().join('/');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImageToImgBB(file);
      if (url) {
        setFormData(prev => ({ ...prev, photo: url }));
      } else {
        alert("Erro no upload da imagem.");
      }
    } catch (err) {
      alert("Erro ao enviar imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 11);
    if (v.length >= 11) v = v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    else if (v.length >= 7) v = v.replace(/(\d{2})(\d{4})(\d+)/, "($1) $2-$3");
    else if (v.length >= 3) v = v.replace(/(\d{2})(\d+)/, "($1) $2");
    setFormData({ ...formData, phone: v, name: foundClient ? formData.name : '', email: foundClient ? formData.email : '', photo: foundClient ? (foundClient.photo || '') : '' });
    if (v.length < 14) {
        setHasSearched(false);
        setFoundClient(null);
    }
  };

  useEffect(() => {
    const tel = formData.phone.replace(/\D/g, "");
    if (tel.length === 11) {
      const c = shopClients.find(x => x.phone.replace(/\D/g, "") === tel);
      setHasSearched(true);
      if (c) {
        setFoundClient(c);
        setFormData(prev => ({ ...prev, name: c.name, email: c.email || '', photo: c.photo || '' }));
      } else {
        setFoundClient(null);
        setFormData(prev => ({ ...prev, name: '', email: '', photo: '' }));
      }
    }
  }, [formData.phone, shopClients]);

  const timeSlots = useMemo(() => {
    if (!selectedBarber || !formData.date || !selectedService) return [];
    
    const [year, month, day] = formData.date.split('-').map(Number);
    const selectedDateObj = new Date(year, month - 1, day);
    const dayOfWeek = selectedDateObj.getDay();

    if (selectedBarber.workDays && !selectedBarber.workDays.includes(dayOfWeek)) {
      return [];
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isToday = formData.date === todayStr;
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    const slots = [];
    const durt = selectedService.durationMinutes;
    
    const extrairMin = (v: string) => {
      if (!v) return 0;
      const [h, m] = v.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const ini = extrairMin(selectedBarber.startTime || '09:00');
    const fim = extrairMin(selectedBarber.endTime || '19:00');

    for (let m = ini; m + durt <= fim; m += 30) {
      const hora = `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
      const isPast = isToday && (m < currentTotalMinutes);
      const conflito = appointments.some(a => 
        String(a.barberId).trim() === String(selectedBarber.id).trim() && 
        a.date === formData.date && 
        a.time === hora &&
        a.status !== 'CANCELLED'
      );

      slots.push({ 
        time: hora, 
        available: !conflito && !isPast,
        isPast: isPast,
        isConflito: conflito
      });
    }
    return slots;
  }, [selectedBarber, formData.date, selectedService, appointments]);

  const handleConfirmBooking = async () => {
    if (!selectedBarbershop || !formData.time || !formData.barberId || !formData.serviceId) return;

    setIsSaving(true);
    try {
      let clientId = foundClient?.id;
      if (!foundClient) {
        const newId = `cli-${Date.now()}`;
        await addClient({
          barbershopId: selectedBarbershop.id,
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          photo: formData.photo
        });
        clientId = newId;
      }

      if (clientId) {
        await addAppointment({
          barbershopId: selectedBarbershop.id,
          barberId: formData.barberId,
          clientId: clientId,
          serviceId: formData.serviceId,
          date: formData.date,
          time: formData.time,
          status: 'PENDING'
        });
        setStep(3);
      }
    } catch (err) {
      alert("Erro ao realizar agendamento.");
    } finally {
      setIsSaving(false);
    }
  };

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < startDay; i++) days.push(null);

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      const todayStr = new Date().toLocaleDateString('en-CA');
      const isPast = dateStr < todayStr;
      
      let worksOnThisDay = true;
      if (selectedBarber && selectedBarber.workDays) {
        const dateObj = new Date(year, month, d);
        worksOnThisDay = selectedBarber.workDays.includes(dateObj.getDay());
      }

      days.push({
        day: d,
        dateStr,
        isPast,
        isAvailable: !isPast && worksOnThisDay
      });
    }
    return days;
  }, [currentCalendarDate, selectedBarber]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentCalendarDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentCalendarDate(newDate);
  };

  const handleDateClick = (dateStr: string) => {
    if (!formData.serviceId) {
      setShowServiceWarning(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setShowServiceWarning(false), 3000);
      return;
    }
    setFormData({...formData, date: dateStr, time: ''});
  };

  return (
    <div className="min-h-full bg-gray-50 flex flex-col items-center py-8 px-4 font-sans">
      <div className="w-full max-w-xl space-y-6">
        
        {/* Painel de Compartilhamento (Apenas para Admin Logado) */}
        {!isPublic && currentUser && (
          <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-xl shadow-indigo-100/20 space-y-4 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg">
                <Share2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Divulgue seu Agendamento</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Envie para seus clientes pelo WhatsApp ou use o QR Code</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* QR Code */}
              <div className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100 shrink-0">
                <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24 rounded-lg shadow-sm" />
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">QR Code da Unidade</span>
              </div>

              {/* Ações de Link */}
              <div className="flex-1 space-y-3 flex flex-col justify-center">
                <div className="relative group">
                  <input 
                    readOnly 
                    value={bookingUrl} 
                    className="w-full bg-gray-100 border-2 border-gray-50 p-3 pr-24 rounded-xl text-[10px] font-mono font-bold text-gray-600 outline-none" 
                  />
                  <button 
                    onClick={handleCopyLink}
                    className={`absolute right-1.5 top-1.5 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                      copySuccess ? 'bg-green-50 text-white' : 'bg-indigo-600 text-white hover:bg-black'
                    }`}
                  >
                    {copySuccess ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={handleShareWhatsApp}
                    className="flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-100 hover:scale-[1.02] transition-all"
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </button>
                  <button 
                    onClick={() => setView('DASHBOARD')}
                    className="flex items-center justify-center gap-2 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                  >
                    <ArrowLeft size={14} /> Voltar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Card Agendamento */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 animate-page-fade">
          <header className="bg-zinc-900 p-8 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <Scissors size={200} className="absolute -right-10 -top-10 rotate-12" />
             </div>
             <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-[1.5rem] bg-white p-1 shadow-2xl overflow-hidden">
                   <img src={selectedBarbershop?.logo || LOGO_URL} className="w-full h-full object-cover rounded-[1.2rem]" />
                </div>
                <div>
                   <h2 className="text-white font-black text-2xl tracking-tight">{selectedBarbershop?.name}</h2>
                   <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">Sua nova experiência começa aqui</p>
                </div>
             </div>
          </header>

          <div className="p-8">
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="space-y-6">
                    <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><Search size={18} className="text-indigo-600" /> Identificação</h3>
                    
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Seu WhatsApp</label>
                      <input 
                        type="tel" 
                        className="w-full border-2 border-gray-50 bg-gray-50 p-4 rounded-2xl text-xl font-black outline-none focus:border-indigo-500 focus:bg-white transition-all text-black placeholder:text-gray-200" 
                        placeholder="(00) 00000-0000" 
                        value={formData.phone} 
                        onChange={handlePhoneChange} 
                      />
                    </div>

                    {hasSearched && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                            {foundClient ? (
                                <div className="p-6 bg-green-50 border-2 border-green-200 rounded-[2rem] flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-[1.2rem] overflow-hidden border-2 border-white shadow-md">
                                        {foundClient.photo ? <img src={foundClient.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-green-500 text-white flex items-center justify-center text-lg font-black">{foundClient.name.charAt(0)}</div>}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-green-800 uppercase tracking-widest">Cadastro Localizado</p>
                                        <p className="text-lg font-black text-green-900">Olá, {foundClient.name}!</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-[2rem] flex items-center gap-4">
                                        <div className="w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-amber-100">
                                            <AlertCircle size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-amber-800 uppercase tracking-widest">Cadastro não localizado</p>
                                            <p className="text-sm font-bold text-amber-900">Preencha seus dados para continuar o agendamento.</p>
                                        </div>
                                    </div>

                                    {/* Upload de Foto para Novo Cliente */}
                                    <div className="flex flex-col items-center">
                                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                            {formData.photo ? (
                                                <img src={formData.photo} className="w-20 h-20 rounded-[1.2rem] object-cover border-4 border-indigo-100 shadow-lg" />
                                            ) : (
                                                <div className="w-20 h-20 rounded-[1.2rem] bg-indigo-50 flex items-center justify-center text-indigo-200 border-4 border-dashed border-indigo-100">
                                                    {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
                                                </div>
                                            )}
                                            <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-md border border-gray-100 text-indigo-600">
                                                <Upload size={12} />
                                            </div>
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                className="hidden" 
                                                accept="image/*" 
                                                onChange={handleFileUpload} 
                                            />
                                        </div>
                                        <span className="text-[9px] font-black text-gray-400 uppercase mt-2">Sua Foto (Opcional)</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                            <input type="text" className="w-full border-2 border-gray-50 bg-gray-50 p-4 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all text-black" placeholder="Como devemos te chamar?" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail (Opcional)</label>
                                            <input type="email" className="w-full border-2 border-gray-50 bg-gray-50 p-4 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all text-black" placeholder="seu@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                 </div>

                 {hasSearched && (
                 <div className="space-y-4">
                    <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><UserIcon size={18} className="text-indigo-600" /> Profissional</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                       {shopBarbers.map(barber => (
                          <button key={barber.id} onClick={() => setFormData({...formData, barberId: barber.id, time: ''})} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${formData.barberId === barber.id ? 'border-indigo-600 bg-indigo-50 shadow-lg' : 'border-gray-50 bg-gray-50 hover:border-gray-200'}`}>
                             <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-md">
                                {barber.photo ? <img src={barber.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-indigo-200 flex items-center justify-center text-indigo-600 font-black">{barber.name.charAt(0)}</div>}
                             </div>
                             <span className={`text-[10px] font-black uppercase tracking-tight text-center ${formData.barberId === barber.id ? 'text-indigo-700' : 'text-gray-500'}`}>{barber.nickname || barber.name}</span>
                          </button>
                       ))}
                    </div>
                 </div>
                 )}

                 {hasSearched && (
                    <button 
                        disabled={!formData.phone || !formData.name || !formData.barberId || isUploading} 
                        onClick={() => setStep(2)} 
                        className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 ${
                            foundClient ? 'bg-zinc-900 hover:bg-black text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                        }`}
                    >
                        {isUploading ? (
                            <><Loader2 className="animate-spin" size={18} /> Enviando Foto...</>
                        ) : foundClient ? (
                            <>Próximo Passo <ChevronRight size={18} /></>
                        ) : (
                            <>Realizar Cadastro <UserPlus size={18} /></>
                        )}
                    </button>
                 )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                 <button onClick={() => setStep(1)} className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-600 transition-colors"><ArrowLeft size={14} /> Voltar</button>

                 <div className="space-y-4">
                    <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><Scissors size={18} className="text-indigo-600" /> Serviço</h3>
                    
                    {showServiceWarning && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3 animate-bounce shadow-lg shadow-red-100/50">
                            <AlertCircle className="text-red-500" size={20} />
                            <p className="text-xs font-black text-red-700 uppercase tracking-widest">Selecione um serviço antes de escolher o dia!</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-3">
                       {shopServices.map(service => (
                          <button key={service.id} onClick={() => setFormData({...formData, serviceId: service.id, time: ''})} className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${formData.serviceId === service.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-50 bg-gray-50 hover:border-gray-200'}`}>
                             <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${formData.serviceId === service.id ? 'bg-indigo-600 text-white' : 'bg-white text-gray-400'}`}><Scissors size={16} /></div>
                                <div className="text-left">
                                   <p className={`text-sm font-black ${formData.serviceId === service.id ? 'text-indigo-900' : 'text-gray-700'}`}>{service.name}</p>
                                   <p className="text-[10px] text-gray-400 font-bold">{service.durationMinutes} min</p>
                                </div>
                             </div>
                             <span className="text-sm font-black text-indigo-600">R$ {service.price.toFixed(2)}</span>
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><Calendar size={18} className="text-indigo-600" /> Data do Agendamento</h3>
                    
                    <div className={`bg-gray-50 rounded-3xl p-6 border transition-all ${!formData.serviceId ? 'opacity-60 cursor-not-allowed grayscale' : 'border-gray-100'}`}>
                       <div className="flex items-center justify-between mb-6">
                          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded-xl text-gray-400 transition-all"><ChevronLeft size={20}/></button>
                          <h4 className="font-black text-sm uppercase tracking-widest text-gray-800">
                             {currentCalendarDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                          </h4>
                          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded-xl text-gray-400 transition-all"><ChevronRight size={20}/></button>
                       </div>

                       <div className="grid grid-cols-7 gap-1 text-center mb-2">
                          {['D','S','T','Q','Q','S','S'].map(d => <span key={d} className="text-[10px] font-black text-gray-400">{d}</span>)}
                       </div>

                       <div className="grid grid-cols-7 gap-1">
                          {calendarDays.map((d, i) => d ? (
                             <button
                                key={i}
                                disabled={!d.isAvailable}
                                onClick={() => handleDateClick(d.dateStr)}
                                className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                                  formData.date === d.dateStr 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                    : d.isAvailable 
                                      ? 'bg-white text-gray-700 hover:border-indigo-400 border border-transparent' 
                                      : 'bg-transparent text-gray-300 cursor-not-allowed'
                                }`}
                             >
                                {d.day}
                             </button>
                          ) : <div key={i} className="aspect-square"></div>)}
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-lg font-black text-gray-800 flex items-center gap-2"><Clock size={18} className="text-indigo-600" /> Horários Disponíveis</h3>
                    {!formData.serviceId ? (
                         <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem] flex flex-col items-center gap-3 text-center animate-pulse">
                            <Info className="text-indigo-500" size={28} />
                            <p className="text-sm font-bold text-indigo-700 leading-tight">Selecione um serviço acima para ver os horários disponíveis.</p>
                         </div>
                    ) : timeSlots.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {timeSlots.map(slot => (
                          <button 
                            key={slot.time}
                            disabled={!slot.available}
                            onClick={() => setFormData({...formData, time: slot.time})}
                            className={`p-3 rounded-xl text-xs font-bold transition-all border-2 ${
                              !slot.available 
                                ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed opacity-40' 
                                : formData.time === slot.time 
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' 
                                  : 'bg-white text-gray-700 border-gray-100 hover:border-indigo-200'
                            }`}
                          >
                             {slot.time}
                          </button>
                        ))}
                      </div>
                    ) : (
                       <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex flex-col items-center gap-2 text-center">
                          <AlertCircle className="text-amber-500" size={24} />
                          <p className="text-xs font-bold text-amber-700">O profissional selecionado não atende nesta data ou não há horários livres.</p>
                       </div>
                    )}
                 </div>

                 <button disabled={!formData.time || isSaving} onClick={handleConfirmBooking} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 flex items-center justify-center gap-3">
                    {isSaving ? <Loader2 className="animate-spin" /> : 'Confirmar Agendamento'}
                 </button>
              </div>
            )}

            {step === 3 && (
              <div className="py-12 flex flex-col items-center text-center space-y-6 animate-in zoom-in duration-500">
                 <div className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center shadow-2xl"><CheckCircle2 size={48} /></div>
                 <div>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight">Tudo Pronto!</h3>
                    <p className="text-gray-500 font-bold mt-2">Seu horário foi reservado com sucesso.</p>
                 </div>
                 <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 w-full space-y-3">
                    <div className="flex justify-between text-xs font-bold">
                       <span className="text-gray-400">PROFISSIONAL</span>
                       <span className="text-gray-900">{selectedBarber?.nickname || selectedBarber?.name}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                       <span className="text-gray-400">SERVIÇO</span>
                       <span className="text-gray-900">{selectedService?.name}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                       <span className="text-gray-400">DATA / HORA</span>
                       <span className="text-gray-900">{formatDisplayDate(formData.date)} às {formData.time}</span>
                    </div>
                 </div>

                 <button 
                   onClick={() => setView('DASHBOARD')}
                   className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3"
                 >
                   <Check size={20} /> Concluir
                 </button>
              </div>
            )}
          </div>
        </div>
        <p className="text-center text-[9px] text-gray-300 font-black uppercase tracking-[0.5em]">BarberPro SaaS Technology</p>
      </div>
    </div>
  );
};
