
import React, { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import Dashboard from './components/Dashboard';
import LoginPage, { UpdatePassword } from './components/LoginPage';
import PublicBookingPage from './components/PublicBookingPage';
import LandingPage from './components/LandingPage';
import DemoSelector from './components/DemoSelector';
import AppointmentConfirmationPage from './components/AppointmentConfirmationPage';
import AdminDashboard from './components/AdminDashboard';
import FeedbackPage from './components/FeedbackPage';
import { Check, X, Bell, Calendar } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import { mockSession, mockAdminSession, mockBusiness, mockClients, mockServices, mockProfessionals, mockAppointments } from './mockData';
import { Appointment, Service, Professional, Client, BusinessInfo, ScheduleBlock } from './types';

// --- DEMO DATA CONTEXT ---
interface DemoData {
    appointments: Appointment[];
    clients: Client[];
    services: Service[];
    professionals: Professional[];
    business: BusinessInfo;
    blocks: ScheduleBlock[];
}

const initialDemoData: DemoData = {
    appointments: mockAppointments as any,
    clients: mockClients as any,
    services: mockServices as any,
    professionals: mockProfessionals as any,
    business: mockBusiness as any,
    blocks: []
};

type DemoDataContextType = {
    demoData: DemoData;
    setDemoData: React.Dispatch<React.SetStateAction<DemoData>>;
    isDemo: boolean;
};

export const DemoDataContext = createContext<DemoDataContextType>({
    demoData: initialDemoData,
    setDemoData: () => {},
    isDemo: false
});

export const useDemoData = () => useContext(DemoDataContext);

// --- THEME CONTEXT ---
type ThemeContextType = {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
};
export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => console.warn('no theme provider'),
});
export const useTheme = () => useContext(ThemeContext);

// --- TOAST CONTEXT & COMPONENTS ---
type ToastType = 'success' | 'error' | 'info' | 'incoming'; // Added 'incoming' type

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  persistent?: boolean; // New property
}

type ToastContextType = {
  addToast: (message: string, type?: ToastType, persistent?: boolean) => void;
};

export const ToastContext = createContext<ToastContextType>({
  addToast: () => {},
});

export const useToast = () => useContext(ToastContext);

const ToastContainer: React.FC<{ toasts: Toast[]; removeToast: (id: number) => void }> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto flex items-center p-4 rounded-xl shadow-2xl border-l-4 transform transition-all duration-300 ease-in-out animate-slide-in
            ${toast.type === 'success' ? 'bg-white dark:bg-slate-800 border-green-500 text-slate-800 dark:text-slate-100' : ''}
            ${toast.type === 'error' ? 'bg-white dark:bg-slate-800 border-red-500 text-slate-800 dark:text-slate-100' : ''}
            ${toast.type === 'info' ? 'bg-white dark:bg-slate-800 border-primary-500 text-slate-800 dark:text-slate-100' : ''}
            ${toast.type === 'incoming' ? 'bg-slate-900 dark:bg-white border-gold-500 text-white dark:text-slate-900' : ''}
          `}
          role="alert"
        >
          <div className="flex-shrink-0 mr-3">
            {toast.type === 'success' && <Check className="w-5 h-5 text-green-500" />}
            {toast.type === 'error' && <X className="w-5 h-5 text-red-500" />}
            {toast.type === 'info' && <Bell className="w-5 h-5 text-primary-500" />}
            {toast.type === 'incoming' && (
                <div className="relative">
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                    </span>
                    <Calendar className="w-6 h-6 text-orange-500 dark:text-slate-900" />
                </div>
            )}
          </div>
          <div className="flex-1 text-sm font-medium leading-tight">
              {toast.message}
              {toast.type === 'incoming' && <p className="text-xs opacity-80 mt-1 font-normal">Atualize a agenda para ver detalhes.</p>}
          </div>
          <button onClick={() => removeToast(toast.id)} className="ml-3 p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-slate-200/20 transition-colors">
            <X className="w-4 h-4 opacity-70" />
          </button>
        </div>
      ))}
    </div>
  );
};

// --- HELPER: Admin Check ---
const ADMIN_EMAIL = 'ocodador@gmail.com';
const isUserAdmin = (user: any) => {
    return user?.email?.toLowerCase().trim() === ADMIN_EMAIL;
};

// --- SOUND HELPER ---
const playNotificationSound = () => {
    try {
        // Simple, pleasant notification sound (beep) hosted on a CDN or embedded
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio autoplay blocked, interaction needed first.', e));
    } catch (e) {
        console.error('Error playing sound', e);
    }
};

// --- MAIN APP ---
const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [demoData, setDemoData] = useState<DemoData>(initialDemoData);
  const [route, setRoute] = useState(window.location.hash);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    return savedTheme || 'light';
  });

  // Toast State
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextToastId = useRef(0);

  const addToast = useCallback((message: string, type: ToastType = 'info', persistent: boolean = false) => {
    const id = nextToastId.current++;
    setToasts((prev) => [...prev, { id, message, type, persistent }]);
    
    // Only auto-dismiss if NOT persistent
    if (!persistent) {
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000); // 5s for normal messages
    } else {
        // Play sound for persistent (incoming) messages
        if (type === 'incoming') playNotificationSound();
    }
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // --- REALTIME LISTENER (The "Digital Doorbell") ---
  useEffect(() => {
    if (!session?.user) return;

    // Listen for NEW appointments for this business
    const channel = supabase
      .channel('appointments-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: `business_id=eq.${session.user.id}`, // Filter by logged in user's business
        },
        (payload) => {
          addToast('🔔 Novo Agendamento Recebido!', 'incoming', true);
          
          // Dispatch event so Dashboard can refresh data if it wants to
          window.dispatchEvent(new Event('new_appointment_received'));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, addToast]);


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAdmin(isUserAdmin(session?.user));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        const isAdminUser = isUserAdmin(session?.user);
        setIsAdmin(isAdminUser);

        if (_event === 'PASSWORD_RECOVERY') {
            window.location.hash = '#update-password';
            setRoute('#update-password');
            return;
        }

        if (_event === 'SIGNED_IN') {
            const currentHash = window.location.hash;
            const isPublicRoute = currentHash.startsWith('#/') && currentHash.length > 2;
            const isSpecificRoute = currentHash.startsWith('#confirm-appointment') || currentHash.startsWith('#feedback') || currentHash === '#update-password';

            if (!isPublicRoute && !isSpecificRoute) {
                const newHash = isAdminUser ? '#admin/dashboard' : '#inicio';
                // Use replace to avoid history pollution and ensure clean landing
                window.location.replace(newHash);
                setRoute(newHash);
            }

            // Force a small delay to ensure session is fully propagated before fetching names
            setTimeout(async () => {
                const { data: { session: currentSession } } = await supabase.auth.getSession();
                if (currentSession?.user) {
                    if (window.location.hash !== '#update-password') {
                        if (isAdminUser) {
                            addToast('Bem Vindo(a) Administrador!', 'success');
                        } else {
                            const { data, error } = await supabase
                                .from('businesses')
                                .select('full_name')
                                .eq('id', currentSession.user.id)
                                .maybeSingle();
                            
                            if (!error && data && data.full_name) {
                                addToast(`Bem Vindo(a) ${data.full_name}!`, 'success');
                            } else {
                                addToast('Bem-vindo de volta! Vamos completar seu cadastro.', 'info');
                            }
                        }
                    }
                }
            }, 500);
        } else if (_event === 'SIGNED_OUT') {
            const currentHash = window.location.hash;
            const isPublicRoute = currentHash.startsWith('#/') && currentHash.length > 2;
            const isSpecificRoute = currentHash.startsWith('#confirm-appointment') || currentHash.startsWith('#feedback');

            if (!isPublicRoute && !isSpecificRoute && currentHash !== '') {
                window.location.hash = '';
                setRoute('');
            }
        }
    });

    return () => subscription.unsubscribe();
  }, [addToast]);


  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Synchronize theme state with DOM and localStorage
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      // Apply immediately for best responsiveness
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
      localStorage.setItem('theme', next);
      return next;
    });
  }, []);

  const handleLogout = async () => {
    if (isDemo) {
        setIsDemo(false);
        setSession(null);
        setIsAdmin(false);
        setDemoData(initialDemoData); // Reset demo data
        window.location.hash = '';
        addToast('Saindo do Modo Demo. Dados temporários excluídos.', 'info');
        return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
        addToast('Erro ao sair do sistema.', 'error');
    } else {
        addToast('Você saiu do sistema.', 'info');
    }
  };
  
  const renderContent = () => {
      if (route.startsWith('#confirm-appointment/')) return <AppointmentConfirmationPage />;
      if (route.startsWith('#feedback/')) return <FeedbackPage />;
      if (route === '#update-password') return <UpdatePassword />; 

      if (route === '#demo-booking') {
          window.location.hash = '#/demonstracao';
          return null;
      }

      if (route.startsWith('#/') && route.length > 2) {
          return <PublicBookingPage />;
      }
      
      if (route === '#demo') {
          if (!isDemo) {
              setIsDemo(true);
              setSession(mockSession);
              setIsAdmin(false);
              addToast('Modo Demonstração Ativado!', 'success');
          }
      }

      if (session || isDemo) {
          if (isAdmin) return <AdminDashboard onLogout={handleLogout} isDemo={isDemo} />;
          return <Dashboard onLogout={handleLogout} isDemo={isDemo} />;
      }
      
      if (route === '#login') return <LoginPage />;
      if (route === '#selecionar-demo') return <DemoSelector />;
      return <LandingPage />;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <ToastContext.Provider value={{ addToast }}>
        <DemoDataContext.Provider value={{ demoData, setDemoData, isDemo }}>
          <div className={`antialiased min-h-screen transition-colors duration-300 ${theme === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>
            {renderContent()}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
          </div>
        </DemoDataContext.Provider>
      </ToastContext.Provider>
    </ThemeContext.Provider>
  );
};

export default App;
