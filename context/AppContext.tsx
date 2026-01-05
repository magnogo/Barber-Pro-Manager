
import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { User, Barbershop, Service, Appointment, Role, ViewState, Client, WhatsAppConfig, Payment } from '../types';
import { MOCK_USERS, MOCK_BARBERSHOPS, MOCK_SERVICES, MOCK_CLIENTS, MOCK_APPOINTMENTS } from '../constants';
import { fetchSheetData, saveToSheet } from '../services/googleSheetsService';

const MASTER_SHEET_URL = "https://script.google.com/macros/s/AKfycbx3LelLNGM298cM8n9nQDH7AoF0HQ5t3vYe8dWzs4RzlsI2iCggYoaF-mGgfZ_EJt1D/exec";

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
  payments: any[]; 
  unitAdmins: any[]; 
  networkTotalRevenue: number;
  networkTotalAppointments: number;
  addBarbershop: (shop: any) => Promise<void>;
  updateBarbershop: (shop: any) => Promise<void>;
  updateUnitAdmin: (admin: any) => Promise<void>;
  updateBarbershopConfig: (id: string, config: WhatsAppConfig) => Promise<void>;
  syncWithGoogleSheets: (url: string) => Promise<void>;
  syncMasterData: () => Promise<void>;
  calculateNetworkMetrics: () => Promise<void>;
  users: User[];
  addUser: (user: User) => Promise<void>;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: PropsWithChildren<{}>) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null); 
  const [selectedBarbershop, setSelectedBarbershop] = useState<Barbershop | null>(null);
  const [view, setView] = useState<ViewState>('MARKETING');
  const [loading, setLoading] = useState(false);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const [barbershops, setBarbershops] = useState<Barbershop[]>(MOCK_BARBERSHOPS);
  const [payments, setPayments] = useState<any[]>([]);
  const [unitAdmins, setUnitAdmins] = useState<any[]>([]);
  const [networkTotalRevenue, setNetworkTotalRevenue] = useState(0);
  const [networkTotalAppointments, setNetworkTotalAppointments] = useState(0);

  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [services, setServices] = useState<Service[]>(MOCK_SERVICES);
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);

  // Sincronização inicial ao carregar o App
  useEffect(() => {
    syncMasterData();
  }, []);

  const calculateNetworkMetrics = async () => {
    if (barbershops.length === 0) return;
    setIsAutoSyncing(true);
    let totalRevenue = 0;
    let totalApts = 0;

    try {
      const shopsToSync = barbershops.filter(s => s.googleSheetsUrl && s.googleSheetsUrl.includes('script.google.com'));
      
      const syncPromises = shopsToSync.map(async (shop) => {
        const [apts, svcs] = await Promise.all([
          fetchSheetData(shop.googleSheetsUrl!, 'Agendamentos'),
          fetchSheetData(shop.googleSheetsUrl!, 'Servicos')
        ]);

        if (apts && Array.isArray(apts)) {
          totalApts += apts.length;
          if (svcs && Array.isArray(svcs)) {
            apts.forEach(apt => {
              const service = svcs.find(s => String(s.id) === String(apt.serviceId));
              if (service) totalRevenue += Number(service.price || 0);
            });
          }
        }
      });

      await Promise.all(syncPromises);
      setNetworkTotalRevenue(totalRevenue);
      setNetworkTotalAppointments(totalApts);
    } catch (error) {
      console.error("Erro ao consolidar métricas da rede:", error);
    } finally {
      setIsAutoSyncing(false);
    }
  };

  const syncMasterData = async () => {
    if (!MASTER_SHEET_URL) return;
    setIsAutoSyncing(true);
    try {
      const [shops, payData, adminData] = await Promise.all([
        fetchSheetData(MASTER_SHEET_URL, 'Empresas'),
        fetchSheetData(MASTER_SHEET_URL, 'ControlePagamentos'),
        fetchSheetData(MASTER_SHEET_URL, 'AdministradoresUnidades')
      ]);

      if (shops) setBarbershops(shops);
      if (payData) setPayments(payData);
      
      if (adminData && Array.isArray(adminData)) {
        setUnitAdmins(adminData);
        
        // Mapeia administradores da planilha para o estado de usuários do sistema
        const sheetUsers: User[] = adminData.map((adm: any) => ({
          id: adm.id,
          name: adm.name,
          email: adm.email,
          role: (adm.role || Role.BARBERSHOP_ADMIN) as Role,
          barbershopId: adm.barbershopId,
          status: adm.status,
          photo: adm.urlfoto // Mapeia urlfoto para photo
        }));

        setUsers(prev => {
          const existingEmails = new Set(prev.map(u => u.email.toLowerCase()));
          const newUsers = sheetUsers.filter(u => u.email && !existingEmails.has(u.email.toLowerCase()));
          // Atualiza dados de usuários existentes se necessário (como a foto)
          const updatedPrev = prev.map(u => {
              const fromSheet = sheetUsers.find(su => su.email.toLowerCase() === u.email.toLowerCase());
              return fromSheet ? { ...u, ...fromSheet } : u;
          });
          return [...updatedPrev, ...newUsers];
        });
      }
      
      if (shops) {
          setTimeout(() => calculateNetworkMetrics(), 100);
      }
    } catch (error) {
      console.error("Erro ao sincronizar dados master:", error);
    } finally {
      setIsAutoSyncing(false);
    }
  };

  const syncWithGoogleSheets = async (url: string) => {
    if (!url) return;
    setIsAutoSyncing(true);
    try {
      const [newAppointments, newClients, newServices, newUsers] = await Promise.all([
        fetchSheetData(url, 'Agendamentos'),
        fetchSheetData(url, 'Clientes'),
        fetchSheetData(url, 'Servicos'),
        fetchSheetData(url, 'Funcionarios')
      ]);

      if (newAppointments) setAppointments(newAppointments);
      if (newClients) setClients(newClients);
      if (newServices) setServices(newServices);
      
      if (newUsers && Array.isArray(newUsers)) {
        setUsers(prev => {
          const existingEmails = new Set(prev.map(u => u.email.toLowerCase()));
          const filteredNewUsers = newUsers.filter(u => u.email && !existingEmails.has(u.email.toLowerCase()));
          // Atualiza dados de usuários existentes se necessário
          const updatedPrev = prev.map(u => {
              const fromSheet = newUsers.find(su => su.email && su.email.toLowerCase() === u.email.toLowerCase());
              return fromSheet ? { ...u, ...fromSheet } : u;
          });
          return [...updatedPrev, ...filteredNewUsers];
        });
      }
    } finally {
      setIsAutoSyncing(false);
    }
  };

  const login = async (email: string, password?: string) => {
    setLoading(true);
    setLoginError(null);
    try {
        const cleanEmail = email.trim().toLowerCase();
        const user = users.find(u => u.email.toLowerCase() === cleanEmail);
        
        if (user) {
            setCurrentUser(user);
            if (user.role === Role.SUPER_ADMIN) {
                setView('SUPER_ADMIN');
                await syncMasterData();
            } else {
                const shop = barbershops.find(s => String(s.id).trim() === String(user.barbershopId).trim());
                if (shop) {
                    setSelectedBarbershop(shop);
                    if (shop.googleSheetsUrl) {
                        await syncWithGoogleSheets(shop.googleSheetsUrl);
                    }
                    setView('DASHBOARD');
                } else if (user.role === Role.BARBERSHOP_ADMIN) {
                    // Se for admin mas a barbearia ainda não carregou, tenta um sync forçado
                    await syncMasterData();
                    const shopRetry = barbershops.find(s => String(s.id).trim() === String(user.barbershopId).trim());
                    if (shopRetry) {
                      setSelectedBarbershop(shopRetry);
                      if (shopRetry.googleSheetsUrl) await syncWithGoogleSheets(shopRetry.googleSheetsUrl);
                      setView('DASHBOARD');
                    } else {
                      setLoginError("Unidade não encontrada para este administrador.");
                    }
                } else {
                  setView('DASHBOARD');
                }
            }
        } else {
            setLoginError("Usuário não encontrado. Verifique se o e-mail está correto na planilha master.");
        }
    } catch (error) {
      setLoginError("Erro ao processar login. Tente novamente.");
    } finally {
        setLoading(false);
    }
  };

  const addBarbershop = async (shop: any) => {
    const newId = `shop-${Date.now()}`;
    const newShop = { ...shop, id: newId };
    setBarbershops(prev => [...prev, newShop]);
    
    if (MASTER_SHEET_URL) {
      await saveToSheet(MASTER_SHEET_URL, 'Empresas', [newShop], 'insert');
      if (shop.adminName && shop.adminEmail) {
        const newAdmin = { 
          id: `adm-${Date.now()}`, 
          barbershopId: newId, 
          name: shop.adminName, 
          email: shop.adminEmail, 
          role: Role.BARBERSHOP_ADMIN, 
          status: 'ACTIVE',
          urlfoto: shop.adminPhoto || '' // Salva a foto do gestor
        };
        await saveToSheet(MASTER_SHEET_URL, 'AdministradoresUnidades', [newAdmin], 'insert');
      }
      const initialPayment = { id: `pay-${Date.now()}`, barbershopId: newId, amount: shop.monthlyFee, date: new Date().toISOString().split('T')[0], status: 'PAID', method: 'PIX', referenceMonth: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) };
      await saveToSheet(MASTER_SHEET_URL, 'ControlePagamentos', [initialPayment], 'insert');
    }
    await syncMasterData();
  };

  const updateBarbershop = async (shop: any) => {
    setBarbershops(prev => prev.map(s => s.id === shop.id ? { ...s, ...shop } : s));
    if (MASTER_SHEET_URL) {
      await saveToSheet(MASTER_SHEET_URL, 'Empresas', [shop], 'update');
      
      // Se tiver dados de admin no form de edição, atualiza na aba de admins também
      if (shop.adminName || shop.adminEmail || shop.adminPhoto) {
         // Tenta encontrar o admin dessa unidade
         const currentAdmin = unitAdmins.find(a => a.barbershopId === shop.id);
         if (currentAdmin) {
            const updatedAdmin = {
               ...currentAdmin,
               name: shop.adminName || currentAdmin.name,
               email: shop.adminEmail || currentAdmin.email,
               urlfoto: shop.adminPhoto || currentAdmin.urlfoto
            };
            await saveToSheet(MASTER_SHEET_URL, 'AdministradoresUnidades', [updatedAdmin], 'update');
         }
      }
    }
    await syncMasterData();
  };

  const updateUnitAdmin = async (admin: any) => {
    if (MASTER_SHEET_URL) {
      await saveToSheet(MASTER_SHEET_URL, 'AdministradoresUnidades', [admin], 'update');
      await syncMasterData();
    }
  };

  const addUser = async (user: User) => {
    setUsers(prev => [...prev, user]);
    if (selectedBarbershop?.googleSheetsUrl) {
      await saveToSheet(selectedBarbershop.googleSheetsUrl, 'Funcionarios', [user], 'insert');
    }
  };

  const updateUser = async (user: User) => {
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    if (selectedBarbershop?.googleSheetsUrl) {
      await saveToSheet(selectedBarbershop.googleSheetsUrl, 'Funcionarios', [user], 'update');
    }
    
    // Se for um administrador de unidade, atualiza também na planilha mestre
    const admin = unitAdmins.find(a => a.id === user.id || a.email === user.email);
    if (admin && MASTER_SHEET_URL) {
      const updatedMasterAdmin = {
        ...admin,
        name: user.name,
        email: user.email,
        urlfoto: user.photo
      };
      await saveToSheet(MASTER_SHEET_URL, 'AdministradoresUnidades', [updatedMasterAdmin], 'update');
    }
  };

  const deleteUser = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    if (selectedBarbershop?.googleSheetsUrl) {
      await saveToSheet(selectedBarbershop.googleSheetsUrl, 'Funcionarios', [{ id }], 'delete');
    }
  };

  const addService = async (service: Omit<Service, 'id'>) => {
    const newService = { ...service, id: `s-${Date.now()}` } as Service;
    setServices(prev => [...prev, newService]);
    if (selectedBarbershop?.googleSheetsUrl) {
      await saveToSheet(selectedBarbershop.googleSheetsUrl, 'Servicos', [newService], 'insert');
    }
  };

  const updateService = async (service: Service) => {
    setServices(prev => prev.map(s => s.id === service.id ? service : s));
    if (selectedBarbershop?.googleSheetsUrl) {
      await saveToSheet(selectedBarbershop.googleSheetsUrl, 'Servicos', [service], 'update');
    }
  };

  const deleteService = async (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    if (selectedBarbershop?.googleSheetsUrl) {
      await saveToSheet(selectedBarbershop.googleSheetsUrl, 'Servicos', [{ id }], 'delete');
    }
  };

  const addAppointment = async (apt: Omit<Appointment, 'id'>) => {
    const newApt = { ...apt, id: `apt-${Date.now()}` } as Appointment;
    setAppointments(prev => [...prev, newApt]);
    if (selectedBarbershop?.googleSheetsUrl) {
      await saveToSheet(selectedBarbershop.googleSheetsUrl, 'Agendamentos', [newApt], 'insert');
    }
  };

  const updateAppointmentStatus = async (id: string, status: Appointment['status']) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    const apt = appointments.find(a => a.id === id);
    if (apt && selectedBarbershop?.googleSheetsUrl) {
      await saveToSheet(selectedBarbershop.googleSheetsUrl, 'Agendamentos', [{ ...apt, status }], 'update');
    }
  };

  const addClient = async (client: Omit<Client, 'id'>) => {
    const newClient = { ...client, id: `c-${Date.now()}` } as Client;
    setClients(prev => [...prev, newClient]);
    if (selectedBarbershop?.googleSheetsUrl) {
      await saveToSheet(selectedBarbershop.googleSheetsUrl, 'Clientes', [newClient], 'insert');
    }
  };

  const updateClient = async (client: Client) => {
    setClients(prev => prev.map(c => c.id === client.id ? client : c));
    if (selectedBarbershop?.googleSheetsUrl) {
      await saveToSheet(selectedBarbershop.googleSheetsUrl, 'Clientes', [client], 'update');
    }
  };

  const deleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    if (selectedBarbershop?.googleSheetsUrl) {
      await saveToSheet(selectedBarbershop.googleSheetsUrl, 'Clientes', [{ id }], 'delete');
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser, selectedBarbershop, setSelectedBarbershop, loading, isAutoSyncing,
      loginError, setLoginError, login, logout: () => { setCurrentUser(null); setView('MARKETING'); },
      view, setView, barbershops, payments, unitAdmins, 
      networkTotalRevenue, networkTotalAppointments,
      addBarbershop, updateBarbershop, updateUnitAdmin, syncMasterData, calculateNetworkMetrics,
      updateBarbershopConfig: async () => {}, syncWithGoogleSheets,
      users, addUser, updateUser, deleteUser,
      services, addService, updateService, deleteService,
      appointments, addAppointment, deleteAppointment: async (id) => {
          setAppointments(prev => prev.filter(a => a.id !== id));
          if (selectedBarbershop?.googleSheetsUrl) {
              await saveToSheet(selectedBarbershop.googleSheetsUrl, 'Agendamentos', [{id}], 'delete');
          }
      }, updateAppointmentStatus,
      clients, addClient, updateClient, deleteClient
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
