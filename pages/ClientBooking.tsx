
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { User, Service, Client, Appointment } from '../types';
import { LOGO_URL } from '../constants';
import { uploadImageToImgBB } from '../services/imageService';
import { sanitizeTime } from './Schedule';
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
  QrCode,
  Link as LinkIcon,
  Smartphone,
  Sparkles,
  ArrowRight,
  Download,
  ExternalLink,
  MapPin,
  Star,
  DollarSign,
  X
} from 'lucide-react';
import QRCodeLib from 'qrcode';

interface ClientBookingProps {
  isPublic?: boolean;
}

export const ClientBooking: React.FC<ClientBookingProps> = ({ isPublic = false }) => {
  const { 
    selectedBarbershop, users, services, appointments, 
    clients, addAppointment, addClient, setView, 
    syncWithGoogleSheets, currentUser 
  } = useApp();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Estados do Fluxo
  const [step, setStep] = useState<'phone' | 'register' | 'barber' | 'service' | 'datetime' | 'confirm' | 'success'>(isPublic ? 'phone' : 'phone');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [error, setError] = useState('');

  // Estados de Seleção
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

  // Sincronização inicial
  useEffect(() => {
    const initSync = async () => {
      if (selectedBarbershop?.googleSheetsUrl) {
        setIsSyncing(true);
        try {
          await syncWithGoogleSheets(selectedBarbershop.googleSheetsUrl);
        } catch (e) {
          console.error("Falha ao sincronizar agenda:", e);
        } finally {
          setIsSyncing(false);
        }
      }
    };
    initSync();
  }, [selectedBarbershop?.googleSheetsUrl]);

  // QR Code e Links (Admin View)
  const bookingUrl = useMemo(() => {
    if (!selectedBarbershop) return '';
    return `${window.location.origin}?shop=${selectedBarbershop.id}`;
  }, [selectedBarbershop]);

  useEffect(() => {
    if (!isPublic && qrCanvasRef.current && bookingUrl) {
      QRCodeLib.toCanvas(qrCanvasRef.current, bookingUrl, {
        width: 300,
        margin: 2,
        color: { dark: '#1e293b', light: '#ffffff' },
      }).then(() => {
        if (qrCanvasRef.current) setQrCodeUrl(qrCanvasRef.current.toDataURL('image/png'));
      });
    }
  }, [isPublic, bookingUrl]);

  // Filtros de Dados
  const shopBarbers = useMemo(() => 
    users.filter(u => String(u.barbershopId).trim() === String(selectedBarbershop?.id).trim() && u.useSchedule),
    [users, selectedBarbershop]
  );

  const shopServices = useMemo(() => 
    services.filter(s => String(s.barbershopId).trim() === String(selectedBarbershop?.id).trim()),
    [services, selectedBarbershop]
  );

  const selectedBarber = useMemo(() => shopBarbers.find(b => b.id === formData.barberId), [formData.barberId, shopBarbers]);
  const selectedService = useMemo(() => shopServices.find(s => s.id === formData.serviceId), [formData.serviceId, shopServices]);

  // Helpers
  const applyPhoneMask = (value: string) => {
    const raw = value.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 2) return raw;
    if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
  };

  const getNextDays = (count: number) => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < count; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const formatDisplayDate = (dateStr: string) => dateStr.split('-').reverse().join('/');
  const getDayName = (date: Date) => date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');

  // Logica de Busca de Cliente
  const searchClientByPhone = () => {
    const tel = formData.phone.replace(/\D/g, "");
    if (tel.length < 11) {
      setError('Digite um WhatsApp válido.');
      return;
    }
    setError('');
    const c = clients.find(x => x.phone.replace(/\D/g, "") === tel);
    if (c) {
      setFoundClient(c);
      setFormData(prev => ({ ...prev, name: c.name, email: c.email || '', photo: c.photo || '' }));
      setStep('barber');
    } else {
      setFoundClient(null);
      setStep('register');
    }
  };

  // Upload de Foto
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

  // Horários Disponíveis
  const availableSlots = useMemo(() => {
    if (!selectedBarber || !formData.date || !selectedService) return [];
    
    const [year, month, day] = formData.date.split('-').map(Number);
    const selectedDateObj = new Date(year, month - 1, day);
    const dayOfWeek = selectedDateObj.getDay();

    if (selectedBarber.workDays && !selectedBarber.workDays.includes(dayOfWeek)) return [];

    const slots = [];
    const duration = selectedService.durationMinutes;
    const now = new Date();
    const isToday = formData.date === now.toLocaleDateString('en-CA');
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    const parseTime = (t: string) => {
      const clean = sanitizeTime(t);
      const [h, m] = clean.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const startMin = parseTime(selectedBarber.startTime || '09:00');
    const endMin = parseTime(selectedBarber.endTime || '19:00');

    for (let m = startMin; m + duration <= endMin; m += 30) {
      const timeStr = `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
      const isPast = isToday && (m < currentTotalMinutes);
      const isBooked = appointments.some(a => 
        String(a.barberId).trim() === String(selectedBarber.id).trim() && 
        a.date === formData.date && 
        sanitizeTime(a.time) === timeStr &&
        a.status !== 'CANCELLED'
      );

      slots.push({ time: timeStr, available: !isBooked && !isPast });
    }
    return slots;
  }, [selectedBarber, formData.date, selectedService, appointments]);

  // Finalização
  const handleFinalSubmit = async () => {
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
        setStep('success');
      }
    } catch (err) {
      setError("Erro ao processar agendamento.");
    } finally {
      setIsSaving(false);
    }
  };

  // Render Admin View
  if (!isPublic && currentUser) {
    return (
      <div className="space-y-6 animate-slide-up">
        {/* Banner Admin */}
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-[2.5rem] shadow-2xl p-10 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-6 mb-10">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center shadow-2xl border border-white/30">
                <LinkIcon className="w-10 h-10" />
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-4xl font-black tracking-tighter">Link Agenda Online</h1>
                <p className="text-blue-100 font-bold text-lg mt-1">Sua vitrine digital de agendamentos automáticos</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20"><p className="text-sm font-black uppercase mb-1">Zero Fricção</p><p className="text-xs text-blue-100">Clientes agendam sem criar conta.</p></div>
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20"><p className="text-sm font-black uppercase mb-1">24/7</p><p className="text-xs text-blue-100">Agenda aberta o tempo todo.</p></div>
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20"><p className="text-sm font-black uppercase mb-1">Mobile</p><p className="text-xs text-blue-100">Otimizado para celulares.</p></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-zinc-900 rounded-[2.5rem] p-10 border border-zinc-800">
            <h2 className="text-2xl font-black text-white mb-6">URL da Unidade</h2>
            <div className="bg-black/40 rounded-2xl p-6 border border-zinc-800 mb-6">
                <code className="text-blue-400 text-sm break-all">{bookingUrl}</code>
            </div>
            <div className="flex gap-4">
              <button onClick={() => { navigator.clipboard.writeText(bookingUrl); setCopied(true); setTimeout(()=>setCopied(false), 2000); }} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest">{copied ? 'Copiado!' : 'Copiar Link'}</button>
              <button onClick={() => window.open(bookingUrl, '_blank')} className="flex-1 bg-zinc-800 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest">Abrir Página</button>
            </div>
          </div>
          <div className="bg-zinc-900 rounded-[2.5rem] p-10 border border-zinc-800 flex flex-col items-center">
            <h2 className="text-2xl font-black text-white mb-6">QR Code</h2>
            <div className="bg-white p-6 rounded-3xl mb-6"><canvas ref={qrCanvasRef}></canvas></div>
            <button onClick={() => { const link = document.createElement('a'); link.download = 'qrcode.png'; link.href = qrCodeUrl; link.click(); }} className="w-full bg-purple-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest">Baixar QR Code</button>
          </div>
        </div>
      </div>
    );
  }

  // Render Public View
  const stepIndicators = ['phone', 'barber', 'service', 'datetime'];
  const currentStepIndex = stepIndicators.indexOf(step === 'register' ? 'phone' : step === 'confirm' ? 'datetime' : (step as any));

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-[3rem] shadow-2xl p-12 max-w-md w-full text-center animate-in zoom-in duration-500 border border-gray-100">
           <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 size={48} className="text-green-600" />
           </div>
           <h2 className="text-3xl font-black text-gray-900 mb-2">Agendado!</h2>
           <p className="text-gray-500 font-medium mb-8">Seu horário foi reservado com sucesso.</p>
           
           <div className="bg-gray-50 rounded-3xl p-6 text-left space-y-4 mb-10 border border-gray-100">
              <div className="flex items-center gap-3"><Scissors className="text-gray-400" size={18}/><span className="font-bold text-gray-900">{selectedService?.name}</span></div>
              <div className="flex items-center gap-3"><UserIcon className="text-gray-400" size={18}/><span className="font-bold text-gray-900">{selectedBarber?.name}</span></div>
              <div className="flex items-center gap-3"><Calendar className="text-gray-400" size={18}/><span className="font-bold text-gray-900">{formatDisplayDate(formData.date)} às {formData.time}</span></div>
           </div>

           <button onClick={() => window.location.reload()} className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all">Concluir</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 font-sans">
      <div className="max-w-xl mx-auto bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
        
        {/* Header Público */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-10 text-white relative">
          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 bg-white rounded-2xl p-1 shadow-2xl shrink-0">
               <img src={selectedBarbershop?.logo || LOGO_URL} className="w-full h-full object-cover rounded-xl" />
            </div>
            <div>
               <h1 className="text-3xl font-black tracking-tight">{selectedBarbershop?.name}</h1>
               <p className="text-blue-100 text-xs flex items-center gap-1.5 font-bold uppercase tracking-widest mt-1">
                 <MapPin size={12} /> {selectedBarbershop?.address || 'Agendamento Online'}
               </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
              {stepIndicators.map((s, idx) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                    currentStepIndex >= idx ? 'bg-white text-blue-600 scale-110 shadow-lg' : 'bg-white/20 text-white/50'
                  }`}>
                    {idx + 1}
                  </div>
                  {idx < stepIndicators.length - 1 && <div className="w-4 h-0.5 bg-white/20 rounded-full"></div>}
                </div>
              ))}
          </div>
        </div>

        <div className="p-10">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl mb-8 flex items-center gap-3 animate-bounce">
              <AlertCircle size={20} />
              <p className="text-xs font-black uppercase tracking-widest">{error}</p>
            </div>
          )}

          {step === 'phone' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                 <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Phone className="text-blue-600" size={32} />
                 </div>
                 <h2 className="text-3xl font-black text-gray-900 mb-2">Bem-vindo!</h2>
                 <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Informe seu WhatsApp para começar</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp</label>
                <input 
                  type="tel" 
                  autoFocus
                  className="w-full bg-gray-50 border-2 border-gray-100 p-5 rounded-2xl text-2xl font-black text-center outline-none focus:border-blue-600 focus:bg-white transition-all text-black placeholder:text-gray-200"
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: applyPhoneMask(e.target.value)})}
                />
              </div>

              <button 
                onClick={searchClientByPhone}
                disabled={formData.phone.length < 14}
                className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                Continuar <ChevronRight size={18} />
              </button>
            </div>
          )}

          {step === 'register' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center">
                 <h2 className="text-2xl font-black text-gray-900">Primeiro Agendamento</h2>
                 <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2">Complete seus dados para continuar</p>
              </div>

              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                    <input 
                      className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-sm font-black outline-none focus:border-blue-600 transition-all text-black"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail (Opcional)</label>
                    <input 
                      className="w-full bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl text-sm font-black outline-none focus:border-blue-600 transition-all text-black"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                 </div>
                 <div className="flex flex-col items-center">
                    <div className="relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                       {formData.photo ? (
                         <img src={formData.photo} className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-xl" />
                       ) : (
                         <div className="w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-300">
                            {isUploading ? <Loader2 className="animate-spin" /> : <Camera size={24}/>}
                         </div>
                       )}
                       <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </div>
                    <span className="text-[9px] font-black text-gray-400 uppercase mt-2">Sua Foto (Opcional)</span>
                 </div>
              </div>

              <div className="flex gap-4">
                 <button onClick={() => setStep('phone')} className="flex-1 bg-gray-100 text-gray-500 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest">Voltar</button>
                 <button onClick={() => setStep('barber')} disabled={!formData.name} className="flex-[2] bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl disabled:opacity-50">Continuar</button>
              </div>
            </div>
          )}

          {step === 'barber' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3"><Star className="text-yellow-500 fill-yellow-500" /> Escolha o Barbeiro</h2>
              <div className="grid gap-4">
                {shopBarbers.map(barber => (
                  <button key={barber.id} onClick={() => { setFormData({...formData, barberId: barber.id}); setStep('service'); }} className="bg-gray-50 hover:bg-blue-50 border-2 border-transparent hover:border-blue-600 p-6 rounded-[2rem] flex items-center justify-between group transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-lg">
                          {barber.photo ? <img src={barber.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xl">{barber.name.charAt(0)}</div>}
                       </div>
                       <div className="text-left">
                          <p className="font-black text-gray-900 text-lg">{barber.nickname || barber.name}</p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Barbeiro Especialista</p>
                       </div>
                    </div>
                    <ChevronRight size={24} className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
              <button onClick={() => setStep('phone')} className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><ArrowLeft size={14} /> Voltar</button>
            </div>
          )}

          {step === 'service' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3"><Sparkles className="text-blue-500" /> O que faremos hoje?</h2>
              <div className="grid gap-4">
                {shopServices.map(service => (
                  <button key={service.id} onClick={() => { setFormData({...formData, serviceId: service.id}); setStep('datetime'); }} className="bg-gray-50 hover:bg-blue-50 border-2 border-transparent hover:border-blue-600 p-6 rounded-[2rem] flex items-center justify-between group transition-all text-left">
                    <div className="flex items-center gap-5">
                       <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-xl group-hover:bg-blue-600 group-hover:text-white transition-all"><Scissors size={24}/></div>
                       <div>
                          <p className="font-black text-gray-900 text-lg">{service.name}</p>
                          <div className="flex items-center gap-4 mt-1">
                             <span className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase"><Clock size={12}/> {service.durationMinutes} min</span>
                             <span className="text-[10px] font-black text-green-600 uppercase">R$ {service.price.toFixed(2)}</span>
                          </div>
                       </div>
                    </div>
                    <ChevronRight size={24} className="text-gray-300 group-hover:text-blue-600" />
                  </button>
                ))}
              </div>
              <button onClick={() => setStep('barber')} className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><ArrowLeft size={14} /> Voltar</button>
            </div>
          )}

          {step === 'datetime' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3"><Calendar className="text-purple-600" /> Data e Hora</h2>
               
               <div>
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Escolha o dia</h3>
                  <div className="flex overflow-x-auto gap-3 pb-4 custom-scrollbar">
                     {getNextDays(14).map(date => {
                        const dateStr = date.toLocaleDateString('en-CA');
                        const isSelected = formData.date === dateStr;
                        const dayOfWeek = date.getDay();
                        const isClosed = !selectedBarber?.workDays?.includes(dayOfWeek);

                        return (
                          <button key={dateStr} disabled={isClosed} onClick={() => setFormData({...formData, date: dateStr, time: ''})} className={`min-w-[80px] p-4 rounded-2xl text-center border-2 transition-all ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-105' : isClosed ? 'bg-gray-50 border-gray-50 text-gray-200 cursor-not-allowed' : 'bg-white border-gray-100 text-gray-900 hover:border-blue-600'}`}>
                             <p className="text-[10px] font-black uppercase">{getDayName(date)}</p>
                             <p className="text-xl font-black mt-1">{date.getDate()}</p>
                          </button>
                        );
                     })}
                  </div>
               </div>

               {formData.date && (
                 <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Horários Disponíveis</h3>
                    {availableSlots.length === 0 ? (
                      <div className="text-center py-10 bg-gray-50 rounded-3xl"><p className="text-xs font-black text-gray-400 uppercase">Sem horários para hoje</p></div>
                    ) : (
                      <div className="grid grid-cols-4 gap-3">
                         {availableSlots.map(slot => (
                           <button key={slot.time} disabled={!slot.available} onClick={() => { setFormData({...formData, time: slot.time}); setStep('confirm'); }} className={`p-4 rounded-xl text-center font-black text-sm transition-all border-2 ${!slot.available ? 'bg-gray-50 border-gray-50 text-gray-200 cursor-not-allowed line-through' : 'bg-white border-gray-100 text-gray-900 hover:border-blue-600 hover:bg-blue-50'}`}>
                              {slot.time}
                           </button>
                         ))}
                      </div>
                    )}
                 </div>
               )}
               <button onClick={() => setStep('service')} className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><ArrowLeft size={14} /> Voltar</button>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3"><CheckCircle2 className="text-green-600" /> Confirmar Detalhes</h2>
               
               <div className="bg-blue-50 border border-blue-100 rounded-[2.5rem] p-8 space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-lg"><img src={selectedBarber?.photo || `https://i.pravatar.cc/150?u=${selectedBarber?.id}`} className="w-full h-full object-cover" /></div>
                     <div><p className="text-[10px] font-black text-blue-400 uppercase">Profissional</p><p className="font-black text-gray-900 text-lg">{selectedBarber?.name}</p></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-blue-200/50">
                     <div><p className="text-[10px] font-black text-blue-400 uppercase">Serviço</p><p className="font-black text-gray-900">{selectedService?.name}</p></div>
                     <div><p className="text-[10px] font-black text-blue-400 uppercase">Valor</p><p className="font-black text-green-700">R$ {selectedService?.price.toFixed(2)}</p></div>
                     <div><p className="text-[10px] font-black text-blue-400 uppercase">Data</p><p className="font-black text-gray-900">{formatDisplayDate(formData.date)}</p></div>
                     <div><p className="text-[10px] font-black text-blue-400 uppercase">Hora</p><p className="font-black text-gray-900">{formData.time}</p></div>
                  </div>
               </div>

               <button 
                  onClick={handleFinalSubmit}
                  disabled={isSaving}
                  className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
               >
                 {isSaving ? <Loader2 className="animate-spin" /> : 'Confirmar Agendamento'}
               </button>
               <button onClick={() => setStep('datetime')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest">Revisar Horário</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
