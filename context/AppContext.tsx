
import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { fetchSheetData, saveToSheet } from '../services/googleSheetsService';
import { User, Barbershop, Service, Appointment, Role, ViewState, Client, Payment } from '../types';
import { MOCK_USERS, MOCK_BARBERSHOPS, MOCK_SERVICES, MOCK_CLIENTS, MOCK_APPOINTMENTS } from '../constants';

interface ExtendedBarbershopForm extends Omit<Barbershop, 'id'> {
  id?: string;
  adminName?: string;
  adminEmail?: string;
  adminPass?: string;
  initialPaymentStatus?: string;
  paymentMethod?: string;
}

interface AppContextType {
  currentUser: User | null;
  selectedBarbershop: Barbershop | null;
  setSelectedBarbershop: (shop: Barbershop | null) => void;
  loading: boolean;
  isAutoSyncing: boolean;
  loginError: string | null;
  setLoginError: (error: string | null) => void;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  view: ViewState;
  setView: (view: ViewState) => void;
  barbershops: Barbershop[];
  addBarbershop: (shop: ExtendedBarbershopForm) => Promise<void>;
  updateBarbershop: (shop: ExtendedBarbershopForm) => Promise<void>;
  updateBarbershopConfig: (id: string, config: any) => Promise<void>;
  users: User[];
  addUser: (user: User, passwordForSignup?: string) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  services: Service[];
  addService: (service: Omit<Service, 'id'>) => Promise<void>;
  updateService: (service: Service) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  appointments: Appointment[];
  addAppointment: (apt: Omit<Appointment, 'id'>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => Promise<void>;
  clients: Client[];
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  payments: Payment[];
  syncWithGoogleSheets: (url: string) => Promise<void>;
  masterUrl: string;
  setMasterUrl: (url: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_MASTER_URL = "https://script.google.com/macros/s/AKfycbzIK-qjM6XWHLgETuQp8d9yyQOnUKPNawZSD3jBx5mPQtWgYbvJ6c5iVgpwaRC6VhxO/exec";

const normalizeDateSync = (val: any): string => {
  if (!val) return '';
  const str = String(val).trim();
  if (str.includes('T')) return str.split('T')[0];
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return str;
};

const parseTime = (val: any): string => {
  if (!val) return '09:00';
  const str = String(val).trim();
  if (str.includes('T')) {
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const h = d.getHours().toString().padStart(2, '0');
        const m = d.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
      }
    } catch (e) {
      const timePart = str.split('T')[1];
      const timeComponents = timePart.split(':');
      if (timeComponents.length >= 2) {
        return `${timeComponents[0].padStart(2, '0')}:${timeComponents[1].padStart(2, '0')}`;
      }
    }
  }
  const match = str.match(/(\d{1,2}):(\d{1,2})/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2].padStart(2, '0')}`;
  }
  return str;
};

const findValue = (obj: any, key: string) => {
    if (!obj) return undefined;
    const targetKey = key.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const mappings: Record<string, string[]> = {
        starttime: ['inicio', 'entrada', 'horainicio', 'start'],
        endtime: ['fim', 'saida', 'horafim', 'end'],
        useschedule: ['agenda', 'utilizaagenda', 'ativo'],
        workdays: ['dias', 'semana'],
        barberid: ['barbeiro', 'idbarbeiro', 'idbarber'],
        clientid: ['cliente', 'idcliente', 'idclient'],
        serviceid: ['servico', 'idservico', 'idservice'],
        googlesheetsurl: ['url', 'planilha', 'sheets', 'googlesheetsurl'],
        durationminutes: ['duracao', 'minutos', 'tempo', 'duration'],
        price: ['preco', 'valor', 'price', 'cost'],
        barbershopid: ['barbershopid', 'empresa', 'unidade', 'idunidade'],
        photo: ['foto', 'imagem', 'avatar', 'photo', 'url'],
        password: ['senha', 'password', 'pass', 'credential']
    };
    const realKey = Object.keys(obj).find(k => {
        const kClean = k.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        if (kClean === targetKey) return true;
        if (mappings[targetKey]) return mappings[targetKey].some(m => kClean.includes(m));
        return false;
    });
    return realKey ? obj[realKey] : undefined;
};

export const AppProvider = ({ children }: PropsWithChildren<{}>) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null); 
  const [selectedBarbershop, setSelectedBarbershop] = useState<Barbershop | null>(null);
  const [view, setView] = useState<ViewState>('MARKETING');
  const [loading, setLoading] = useState(true);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [services, setServices] = useState<Service[]>(MOCK_SERVICES);
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [masterUrl, setMasterUrl] = useState<string>(DEFAULT_MASTER_URL);

  useEffect(() => {
    refreshMasterData();
  }, []);

  // Polling Automático de Dados (Back-end como serviço)
  useEffect(() => {
    let interval: any;
    
    if (selectedBarbershop?.googleSheetsUrl && currentUser) {
        // Primeira carga imediata
        syncWithGoogleSheets(selectedBarbershop.googleSheetsUrl);

        // Polling a cada 60 segundos
        interval = setInterval(() => {
            syncWithGoogleSheets(selectedBarbershop.googleSheetsUrl!);
        }, 60000);
    }

    return () => clearInterval(interval);
  }, [selectedBarbershop?.id, currentUser?.id]);

  const refreshMasterData = async () => {
      setLoading(true);
      try {
          const shopsData = await fetchSheetData(DEFAULT_MASTER_URL, 'Empresas');
          if (shopsData && Array.isArray(shopsData)) {
              const syncedShops: Barbershop[] = shopsData.map(s => ({
                  id: String(findValue(s, 'id')).trim(),
                  name: String(findValue(s, 'name') || 'Unidade'),
                  address: String(findValue(s, 'address') || ''),
                  phone: String(findValue(s, 'phone') || ''),
                  email: String(findValue(s, 'email') || ''),
                  logo: String(findValue(s, 'logo') || ''),
                  isActive: String(findValue(s, 'isActive')).toLowerCase() === 'true',
                  googleSheetsUrl: String(findValue(s, 'googleSheetsUrl') || findValue(s, 'planilha') || ''),
                  plan: String(findValue(s, 'plan') || 'Básico'),
                  monthlyFee: Number(findValue(s, 'monthlyFee') || 0)
              }));
              setBarbershops(syncedShops);
          } else {
              setBarbershops(MOCK_BARBERSHOPS);
          }
      } catch (err) {
          setBarbershops(MOCK_BARBERSHOPS);
      } finally {
          setLoading(false);
      }
  };

  const login = async (email: string, password?: string) => {
    setLoading(true);
    setLoginError(null);
    try {
        if (email === 'admin@platform.com' && password === 'admin123') {
            const superUser = MOCK_USERS.find(u => u.role === Role.SUPER_ADMIN)!;
            setCurrentUser(superUser);
            setView('SUPER_ADMIN');
            return;
        }

        let foundAdmin = null;
        try {
          const adminsData = await fetchSheetData(DEFAULT_MASTER_URL, 'AdministradoresUnidades');
          if (adminsData && Array.isArray(adminsData)) {
              foundAdmin = adminsData.find(adm => {
                  const admEmail = findValue(adm, 'email');
                  const admPass = findValue(adm, 'password');
                  const emailMatch = String(admEmail).toLowerCase() === email.toLowerCase();
                  return emailMatch && (!password || !admPass || String(admPass) === password);
              });
          }
        } catch (e) { }

        if (foundAdmin) {
            const shopId = String(findValue(foundAdmin, 'barbershopId')).trim();
            const shop = barbershops.find(s => s.id === shopId);
            const user: User = {
                id: String(findValue(foundAdmin, 'id')),
                name: String(findValue(foundAdmin, 'name')),
                email: String(findValue(foundAdmin, 'email')),
                role: (findValue(foundAdmin, 'role') as Role) || Role.BARBER,
                barbershopId: shopId
            };
            setCurrentUser(user);
            if (shop) {
                setSelectedBarbershop(shop);
                setView('DASHBOARD');
            } else {
                setView('SUPER_ADMIN');
            }
            return;
        }

        const mockUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (mockUser) {
          setCurrentUser(mockUser);
          const shop = barbershops.find(s => s.id === mockUser.barbershopId);
          if (shop) setSelectedBarbershop(shop);
          if (mockUser.role === Role.SUPER_ADMIN) setView('SUPER_ADMIN');
          else setView('DASHBOARD');
          return;
        }

        const errorMsg = "E-mail ou senha incorretos";
        setLoginError(errorMsg);
        throw new Error(errorMsg);
    } catch (err: any) {
        if (!loginError) setLoginError(err.message || "Erro ao autenticar.");
        throw err;
    } finally {
        setLoading(false);
    }
  };

  const addBarbershop = async (form: ExtendedBarbershopForm) => {
    const newShopId = `shop-${Date.now()}`;
    const newAdminId = `adm-${Date.now()}`;
    try {
        await saveToSheet(DEFAULT_MASTER_URL, 'Empresas', [
            newShopId, form.name, form.address, form.phone, form.email || '', 
            form.logo || '', String(form.isActive), form.googleSheetsUrl || '', 
            form.plan || '', Number(form.monthlyFee || 0)
        ], 'insert');

        await saveToSheet(DEFAULT_MASTER_URL, 'AdministradoresUnidades', [
            newAdminId, 
            newShopId, 
            form.adminName || '', 
            form.adminEmail || '', 
            Role.BARBERSHOP_ADMIN, 
            'ACTIVE',
            form.adminPass || ''
        ], 'insert');

        refreshMasterData();
    } catch (err) {
        alert("Erro ao gravar na planilha mestre.");
    }
  };

  const updateBarbershop = async (form: ExtendedBarbershopForm) => { 
    if (!form.id) return;
    setBarbershops(prev => prev.map(item => item.id === form.id ? (form as any) : item));

    try {
        await saveToSheet(DEFAULT_MASTER_URL, 'Empresas', [
            form.id, form.name, form.address, form.phone, form.email || '', 
            form.logo || '', String(form.isActive), form.googleSheetsUrl || '', 
            form.plan || '', Number(form.monthlyFee || 0)
        ], 'update');

        if (form.adminEmail || form.adminPass) {
            await saveToSheet(DEFAULT_MASTER_URL, 'AdministradoresUnidades', [
                `adm-${form.id}`, 
                form.id, 
                form.adminName || '', 
                form.adminEmail || '', 
                Role.BARBERSHOP_ADMIN, 
                'ACTIVE',
                form.adminPass || ''
            ], 'update');
        }
    } catch (err) {
        console.error("Erro ao atualizar unidade:", err);
    }
  };

  const syncWithGoogleSheets = async (url: string) => {
    if (!url || !url.includes('/exec')) return;
    const currentShopId = selectedBarbershop?.id;
    if (!currentShopId) return;

    setIsAutoSyncing(true);
    try {
        const staffRaw = await fetchSheetData(url, 'Funcionarios');
        let staffList: User[] = [];
        if (staffRaw && Array.isArray(staffRaw)) {
            staffList = staffRaw.map((u, i) => ({
                id: String(findValue(u, 'id') || `u-${i}`).trim(),
                barbershopId: currentShopId,
                name: String(findValue(u, 'name') || 'Sem Nome'),
                nickname: String(findValue(u, 'nickname') || ''),
                email: String(findValue(u, 'email') || ''),
                position: String(findValue(u, 'position') || 'Barbeiro'),
                role: (findValue(u, 'role') as Role) || Role.BARBER,
                useSchedule: String(findValue(u, 'useSchedule')).toLowerCase() === 'true',
                startTime: parseTime(findValue(u, 'startTime')),
                endTime: parseTime(findValue(u, 'endTime')),
                workDays: String(findValue(u, 'workDays') || '1,2,3,4,5,6').split(',').map(Number),
                photo: String(findValue(u, 'photo') || findValue(u, 'avatar') || '')
            }));
            setUsers(prev => [...prev.filter(u => u.barbershopId !== currentShopId), ...staffList]);
        }

        const servicesRaw = await fetchSheetData(url, 'Servicos');
        if (servicesRaw && Array.isArray(servicesRaw)) {
            const syncedServices = servicesRaw.map((s, i) => ({
                id: String(findValue(s, 'id') || `s-${i}`).trim(),
                barbershopId: currentShopId,
                name: String(findValue(s, 'name') || 'Serviço'),
                durationMinutes: Number(findValue(s, 'durationMinutes') || 30),
                price: Number(String(findValue(s, 'price') || 0).replace(',', '.'))
            }));
            setServices(prev => [...prev.filter(s => s.barbershopId !== currentShopId), ...syncedServices]);
        }

        const clientsRaw = await fetchSheetData(url, 'Clientes');
        if (clientsRaw && Array.isArray(clientsRaw)) {
            const syncedClients = clientsRaw.map((c, i) => ({
                id: String(findValue(c, 'id') || `c-${i}`).trim(),
                barbershopId: currentShopId,
                name: String(findValue(c, 'name') || 'Cliente'),
                phone: String(findValue(c, 'phone') || ''),
                email: String(findValue(c, 'email') || ''),
                photo: String(findValue(c, 'photo') || findValue(c, 'avatar') || '')
            }));
            setClients(prev => [...prev.filter(c => c.barbershopId !== currentShopId), ...syncedClients]);
        }

        const appointmentsRaw = await fetchSheetData(url, 'Agendamentos');
        if (appointmentsRaw && Array.isArray(appointmentsRaw)) {
            const syncedApts = appointmentsRaw.map((a, i) => ({
                id: String(findValue(a, 'id') || `a-${i}`).trim(),
                barbershopId: currentShopId,
                barberId: String(findValue(a, 'barberId') || '').trim(),
                clientId: String(findValue(a, 'clientId') || '').trim(),
                serviceId: String(findValue(a, 'serviceId') || '').trim(),
                date: normalizeDateSync(findValue(a, 'date')),
                time: parseTime(findValue(a, 'time')),
                status: (findValue(a, 'status') as Appointment['status']) || 'PENDING'
            }));
            setAppointments(prev => [...prev.filter(a => a.barbershopId !== currentShopId), ...syncedApts]);
        }
    } catch (err) { 
        console.error("Erro na sincronização Sheets:", err);
    } finally {
        setTimeout(() => setIsAutoSyncing(false), 2000);
    }
  };

  const addUser = async (user: User) => {
    setUsers(prev => [...prev, user]);
    if (selectedBarbershop?.googleSheetsUrl) await saveToSheet(selectedBarbershop.googleSheetsUrl, 'Funcionarios', [user.id, user.barbershopId, user.name, user.nickname || '', user.email, user.position || 'Barbeiro', user.role, String(user.useSchedule), user.startTime, user.endTime, (user.workDays || []).join(','), user.photo || ''], 'insert');
  };

  const updateUser = async (user: User) => {
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    if (selectedBarbershop?.googleSheetsUrl) await saveToSheet(selectedBarbershop.googleSheetsUrl, 'Funcionarios', [user.id, user.barbershopId, user.name, user.nickname || '', user.email, user.position || 'Barbeiro', user.role, String(user.useSchedule), user.startTime, user.endTime, (user.workDays || []).join(','), user.photo || ''], 'update');
  };

  const deleteUser = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    if (selectedBarbershop?.googleSheetsUrl) await saveToSheet(selectedBarbershop.googleSheetsUrl, 'Funcionarios', [id], 'delete');
  };

  const addService = async (service: Omit<Service, 'id'>) => {
    const newId = `ser-${Date.now()}`;
    setServices(prev => [...prev, { id: newId, ...service }]);
    if (selectedBarbershop?.googleSheetsUrl) await saveToSheet(selectedBarbershop.googleSheetsUrl, 'Servicos', [newId, service.barbershopId, service.name, Number(service.durationMinutes), Number(service.price)], 'insert');
  };

  const updateService = async (s: Service) => {
    setServices(prev => prev.map(item => item.id === s.id ? s : item));
    if (selectedBarbershop?.googleSheetsUrl) await saveToSheet(selectedBarbershop.googleSheetsUrl, 'Servicos', [s.id, s.barbershopId, s.name, Number(s.durationMinutes), Number(s.price)], 'update');
  };

  const deleteService = async (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    if (selectedBarbershop?.googleSheetsUrl) await saveToSheet(selectedBarbershop.googleSheetsUrl, 'Servicos', [id], 'delete');
  };

  const addAppointment = async (apt: Omit<Appointment, 'id'>) => {
    const newId = `apt-${Date.now()}`;
    setAppointments(prev => [...prev, { id: newId, ...apt }]);
    if (selectedBarbershop?.googleSheetsUrl) await saveToSheet(selectedBarbershop.googleSheetsUrl, 'Agendamentos', [newId, apt.barbershopId, apt.barberId, apt.clientId, apt.serviceId, apt.date, apt.time, apt.status], 'insert');
  };

  const deleteAppointment = async (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
    if (selectedBarbershop?.googleSheetsUrl) await saveToSheet(selectedBarbershop.googleSheetsUrl, 'Agendamentos', [id], 'delete');
  };

  const addClient = async (client: Omit<Client, 'id'>) => {
    const newId = `cli-${Date.now()}`;
    setClients(prev => [...prev, { id: newId, ...client }]);
    if (selectedBarbershop?.googleSheetsUrl) {
      await saveToSheet(selectedBarbershop.googleSheetsUrl, 'Clientes', [newId, client.barbershopId, client.name, client.phone, client.email || '', client.photo || ''], 'insert');
    }
  };

  const updateClient = async (client: Client) => {
    setClients(prev => prev.map(c => c.id === client.id ? client : c));
    if (selectedBarbershop?.googleSheetsUrl) {
      await saveToSheet(selectedBarbershop.googleSheetsUrl, 'Clientes', [client.id, client.barbershopId, client.name, client.phone, client.email || '', client.photo || ''], 'update');
    }
  };

  const deleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    if (selectedBarbershop?.googleSheetsUrl) {
      await saveToSheet(selectedBarbershop.googleSheetsUrl, 'Clientes', [id], 'delete');
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser, selectedBarbershop, setSelectedBarbershop, loading, isAutoSyncing,
      loginError, setLoginError, login, logout: () => { setCurrentUser(null); setView('MARKETING'); }, view, setView,
      barbershops, addBarbershop, updateBarbershop, updateBarbershopConfig: async () => {},
      users, addUser, updateUser, deleteUser, 
      services, addService, updateService, deleteService,
      appointments, addAppointment, deleteAppointment, updateAppointmentStatus: async (id, s) => setAppointments(prev => prev.map(a => a.id === id ? {...a, status: s} : a)),
      clients, addClient, updateClient, deleteClient, 
      payments: [], syncWithGoogleSheets, masterUrl, setMasterUrl
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
