
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Settings, LogOut, Home, Users, Scissors, Briefcase, Ban, Share2, Sun, Moon, ChevronsLeft, Calendar, AlertTriangle, X, Smartphone, ChartBar, LayoutDashboard, Menu, ExternalLink, Sparkles, MessageSquare } from '../constants';
import { Lock, ShieldCheck, ChevronRight, Check, MessageCircle, AlertCircle, Clock } from 'lucide-react';
import { BusinessInfo, Appointment, Client, Service, Professional } from '../types';
import ClientsPage from './ClientsPage';
import ServicesPage from './ServicesPage';
import ProfessionalsPage from './ProfessionalsPage';
import SettingsPage from './SettingsPage';
import AppointmentsPage from './AppointmentsPage';
import ScheduleBlocksPage from './ScheduleBlocksPage';
import ReportsPage from './ReportsPage';
import { useTheme, useToast } from '../App';
import { supabase } from '../supabaseClient';
import { mockBusiness } from '../mockData';
import { motion, AnimatePresence } from 'motion/react';

// Helper to ensure external links have protocol and are clean
const getSafeUrl = (url: string) => {
    if (!url) return '#';
    let clean = url.replace(/['"]/g, '').trim();
    if (clean === '' || clean === '#') return '#';
    if (!clean.match(/^https?:\/\//)) {
        return `https://${clean}`;
    }
    return clean;
};

// --- COMPONENT: RESTRICTED ACCESS OVERLAY ---
const RestrictedAccessView = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-fade-in-down">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-slate-200 dark:border-slate-700">
                <AlertTriangle className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 mb-2">Acesso Temporariamente Restrito</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
                Sua assinatura está pendente ou o período de teste expirou. O acesso às funções de agendamento e gestão está bloqueado.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
                <button 
                    onClick={() => window.location.hash = 'settings'}
                    className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-colors dark:bg-white dark:text-slate-900"
                >
                    Ir para Configurações / Regularizar
                </button>
            </div>
            <p className="mt-6 text-xs text-slate-400">
                Você pode excluir sua conta ou gerenciar sua assinatura na aba Configurações.
            </p>
        </div>
    );
};

// --- COMPONENT: SHARE MODAL ---
const ShareModal = ({ isOpen, onClose, url }: { isOpen: boolean; onClose: () => void; url: string; }) => {
    const [copyButtonText, setCopyButtonText] = useState('Copiar Link');
    const { addToast } = useToast();
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(url)}`;

    const copyUrlToClipboard = () => {
        navigator.clipboard.writeText(url).then(() => {
            setCopyButtonText('Copiado!');
            addToast('Link copiado para a área de transferência!', 'success');
            setTimeout(() => setCopyButtonText('Copiar Link'), 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            setCopyButtonText('Erro ao copiar');
            addToast('Erro ao copiar link.', 'error');
        });
    };

    const downloadQrCode = async () => {
        try {
            const response = await fetch(qrCodeUrl);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = 'qrcode-agendios.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            addToast('QR Code baixado com sucesso!', 'success');
        } catch (error) {
            console.error('Failed to download QR code:', error);
            addToast('Não foi possível baixar o QR Code.', 'error');
        }
    };

    const shareViaWhatsApp = () => {
        const message = `Agende seu horário online: ${url}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md m-4 relative text-center">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                    <X className="w-6 h-6" />
                </button>
                
                <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-slate-100 mb-2">Compartilhe sua Página</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Seus clientes podem agendar online usando o link ou QR Code.</p>
                
                <div className="mb-6 p-3 bg-white inline-block rounded-xl shadow-sm border border-slate-100">
                    <img src={qrCodeUrl} alt="QR Code" className="mx-auto rounded-lg" width="200" height="200" />
                </div>
                
                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={downloadQrCode} className="w-full px-4 py-3 text-sm font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors">
                            Baixar QR Code
                        </button>
                        <button onClick={copyUrlToClipboard} className="w-full px-4 py-3 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-lg dark:bg-white dark:text-slate-900">
                            {copyButtonText}
                        </button>
                    </div>
                    
                    <button onClick={shareViaWhatsApp} className="w-full px-4 py-3 text-sm font-bold text-white bg-[#25D366] rounded-xl hover:bg-[#128C7E] transition-colors shadow-lg flex items-center justify-center gap-2">
                        <Smartphone className="w-5 h-5" />
                        Enviar no WhatsApp
                    </button>
                </div>

                <div className="mt-6">
                    <label htmlFor="booking-url" className="sr-only">URL de Agendamento</label>
                    <input 
                        id="booking-url"
                        type="text" 
                        readOnly 
                        value={url} 
                        className="w-full text-center text-sm bg-slate-50 text-slate-600 border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700"
                    />
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT: RESCHEDULE MANAGER (REAGENDAMENTOS) ---
const RescheduleManager = ({ isDemo }: { isDemo?: boolean }) => {
    const [pendingApps, setPendingApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    const fetchPending = useCallback(async () => {
        setLoading(true);
        if (isDemo) {
            const { mockAppointments, mockClients, mockServices, mockProfessionals } = await import('../mockData');
            // Filter appointments that might need rescheduling (e.g. status='cancelled')
            const filtered = (mockAppointments as any[]).filter(app => app.status === 'cancelled').map(app => ({
                ...app,
                clients: mockClients.find(c => c.id === app.client_id),
                services: mockServices.find(s => s.id === app.service_id),
                professionals: mockProfessionals.find(p => p.id === app.professional_id)
            }));
            setPendingApps(filtered.slice(0, 3));
            setLoading(false);
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('appointments')
            .select('*, clients(*), services(*), professionals(*)')
            .eq('business_id', user.id)
            .eq('status', 'cancelled') // Assuming we mark conflicted ones as cancelled or flag them
            .order('date', { ascending: true });

        if (error) console.error('Error fetching pending reschedules', error);
        else setPendingApps(data || []);
        setLoading(false);
    }, [isDemo]);

    useEffect(() => {
        fetchPending();
    }, [fetchPending]);

    if (pendingApps.length === 0) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 sm:p-8 space-y-6"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Necessidade de Reagendamento</h3>
                        <p className="text-xs text-slate-500 font-medium tracking-tight">Clientes afetados por bloqueios ou imprevistos</p>
                    </div>
                </div>
                <span className="px-3 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black rounded-full">
                    {pendingApps.length} PENDENTE(S)
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingApps.map(app => {
                    const whatsappMessage = `Olá ${app.clients?.name}, tudo bem? Tivemos um imprevisto urgente com o profissional ${app.professionals?.name} e precisaremos reagendar seu serviço (${app.services?.name}) do dia ${new Date(app.date).toLocaleDateString('pt-BR')} às ${app.time}. Podemos ver um novo horário?`;
                    const whatsappUrl = `https://wa.me/${app.clients?.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

                    return (
                        <div key={app.id} className="bg-white dark:bg-slate-800 p-5 rounded-[28px] border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cliente</p>
                                    <h4 className="font-bold text-slate-900 dark:text-slate-100">{app.clients?.name}</h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Horário Original</p>
                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 justify-end">
                                        <Clock className="w-3 h-3" /> {app.time}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Serviço Afetado</p>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{app.services?.name}</p>
                            </div>

                            <a 
                                href={whatsappUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-3 bg-[#25D366] text-white rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20"
                            >
                                <MessageCircle className="w-4 h-4 fill-white/20" />
                                SOLICITAR REAGENDAMENTO
                            </a>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
};

interface DashboardProps {
    onLogout: () => void;
    isDemo?: boolean;
}

// --- ONBOARDING ENFORCEMENT ---
type OnboardingStep = 'CONFIGURACOES' | 'SERVICOS' | 'PROFISSIONAIS' | 'COMPLETO';

const Dashboard: React.FC<DashboardProps> = ({ onLogout, isDemo }) => {
    const [activeView, setActiveView] = useState('inicio');
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [onboardingState, setOnboardingState] = useState<{
        businessInfo: BusinessInfo | null;
        servicesCount: number | null;
        professionalsCount: number | null;
        loading: boolean;
    }>({
        businessInfo: null,
        servicesCount: null,
        professionalsCount: null,
        loading: true
    });
    const { theme, toggleTheme } = useTheme();
    const { addToast } = useToast();

    const businessInfo = onboardingState.businessInfo;
    const servicesCount = onboardingState.servicesCount;
    const professionalsCount = onboardingState.professionalsCount;
    const onboardingLoading = onboardingState.loading;

    // Access Env Vars
    const env = (import.meta as any).env || {};
    // TODO: Quando tiver o novo link do Stripe, adicione VITE_STRIPE_PAYMENT_LINK ao seu .env no Render
    const STRIPE_PAYMENT_LINK = env.VITE_STRIPE_PAYMENT_LINK || '';

    // Trial Calculation & Lock Logic
    const { trialDaysLeft, isLocked } = useMemo(() => {
        if (!businessInfo) return { trialDaysLeft: null, isLocked: false };
        
        const isExempt = businessInfo.is_exempt;
        const isActive = businessInfo.subscription_status === 'active';
        
        const joinDate = new Date(businessInfo.created_at || new Date());
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - joinDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const left = 30 - diffDays; // Updated to 30 days
        
        const trialLeft = left >= 0 ? left : 0;
        
        // Locked if: NOT active subscription AND NOT exempt AND Trial expired
        const locked = !isActive && !isExempt && trialLeft <= 0;

        return { trialDaysLeft: trialLeft, isLocked: locked };
    }, [businessInfo]);

    // Onboarding Logic
    const onboardingStatus = useMemo(() => {
        if (isDemo) return { isComplete: true, step: 'COMPLETO' as OnboardingStep, stepNumber: 4, nextStep: null, label: '' };
        
        // 1. Check Personal Info (Name/Slug)
        if (!businessInfo || !businessInfo.name || !businessInfo.slug) {
            return { isComplete: false, step: 'CONFIGURACOES' as OnboardingStep, stepNumber: 1, nextStep: 'services', label: 'Configurar Nome e Link' };
        }
        
        // 2. Check Services
        if (servicesCount === 0 || servicesCount === null) {
            return { isComplete: false, step: 'SERVICOS' as OnboardingStep, stepNumber: 2, nextStep: 'professionals', label: 'Cadastrar Serviços' };
        }
        
        // 3. Check Professionals
        if (professionalsCount === 0 || professionalsCount === null) {
            return { isComplete: false, step: 'PROFISSIONAIS' as OnboardingStep, stepNumber: 3, nextStep: 'completo', label: 'Cadastrar Profissionais' };
        }
        
        return { isComplete: true, step: 'COMPLETO' as OnboardingStep, stepNumber: 4, nextStep: null, label: '' };
    }, [isDemo, businessInfo, servicesCount, professionalsCount]);

    useEffect(() => {
        if (!onboardingLoading && !onboardingStatus.isComplete && !isDemo) {
            const stepToHash: Record<OnboardingStep, string> = {
                'CONFIGURACOES': 'settings',
                'SERVICOS': 'services',
                'PROFISSIONAIS': 'professionals',
                'COMPLETO': 'inicio'
            };
            
            const targetHash = stepToHash[onboardingStatus.step];
            if (window.location.hash.replace('#', '') !== targetHash) {
                window.location.hash = targetHash;
                addToast(`Por favor, complete esta etapa: ${onboardingStatus.label}`, 'info');
            }
        }
    }, [onboardingStatus, onboardingLoading, isDemo, addToast]);

    const navItems = useMemo(() => {
        const fullItems = [
            { id: 'inicio', label: 'Agenda', icon: Calendar },
            { id: 'clients', label: 'Clientes', icon: Users },
            { id: 'services', label: 'Serviços', icon: Scissors },
            { id: 'professionals', label: 'Profissionais', icon: Briefcase },
            { id: 'blocks', label: 'Bloqueios', icon: Ban },
            { id: 'reports', label: 'Relatórios', icon: ChartBar },
            { id: 'settings', label: 'Configurações', icon: Settings },
        ];

        // If locked (Subscription), restrict navigation to only Settings
        if (isLocked) {
            return [
                { id: 'settings', label: 'Configurações', icon: Settings }
            ];
        }

        // --- NEW: ONBOARDING ITEM LOCKING ---
        if (!onboardingStatus.isComplete && !isDemo) {
            return fullItems.map(item => {
                let locked = false;
                if (onboardingStatus.step === 'CONFIGURACOES' && item.id !== 'settings') locked = true;
                if (onboardingStatus.step === 'SERVICOS' && !['settings', 'services'].includes(item.id)) locked = true;
                if (onboardingStatus.step === 'PROFISSIONAIS' && !['settings', 'services', 'professionals'].includes(item.id)) locked = true;
                
                return { ...item, disabled: locked, locked };
            });
        }

        return fullItems;
    }, [isLocked, onboardingStatus, isDemo]);

    // Restore business info fetching for public URL and header display
    const fetchBusinessInfo = useCallback(async (isInitial: boolean = false) => {
        if (isDemo) {
            setOnboardingState({
                businessInfo: mockBusiness,
                servicesCount: 3,
                professionalsCount: 3,
                loading: false
            });
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            if (isInitial) {
                setOnboardingState(prev => ({ ...prev, loading: true }));
            }
            
            try {
                // Parallel fetch to be as fast as possible
                const [busRes, servRes, profRes] = await Promise.all([
                    supabase.from('businesses').select('*').eq('id', user.id).maybeSingle(),
                    supabase.from('services').select('id', { count: 'exact', head: true }).eq('business_id', user.id),
                    supabase.from('professionals').select('id', { count: 'exact', head: true }).eq('business_id', user.id)
                ]);
                
                // Update all at once to maintain atomic state for onboardingStatus calculation
                setOnboardingState({
                    businessInfo: (busRes.data as BusinessInfo) || null,
                    servicesCount: typeof servRes.count === 'number' ? servRes.count : 0,
                    professionalsCount: typeof profRes.count === 'number' ? profRes.count : 0,
                    loading: false
                });
            } catch (err) {
                console.error("Error fetching onboarding data:", err);
                setOnboardingState(prev => ({ ...prev, loading: false }));
            }
        } else {
            setOnboardingState(prev => ({ ...prev, loading: false }));
        }
    }, [isDemo]);

    useEffect(() => {
        fetchBusinessInfo(true);
        // Listen for updates
        const handleUpdate = () => fetchBusinessInfo(false);
        window.addEventListener('businessInfoUpdated', handleUpdate);
        
        // Also listen for potential session updates that Dashboard might miss
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                fetchBusinessInfo(true);
            }
        });

        return () => {
            window.removeEventListener('businessInfoUpdated', handleUpdate);
            subscription.unsubscribe();
        };
    }, [fetchBusinessInfo]);

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            
            if (navItems.find(item => item.id === hash)) {
                setActiveView(hash);
            } else if (isLocked && hash !== 'settings') {
                // Redirect to settings if locked
                setActiveView('settings');
                window.location.hash = 'settings';
            } else if (!hash || hash === '') {
                 const fallback = isLocked ? 'settings' : 'inicio';
                 setActiveView(fallback);
                 window.location.hash = fallback;
            }
        };

        handleHashChange(); // Check on mount
        setTimeout(() => setIsInitialLoad(false), 500); // Small buffer for content to settle

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [navItems, isLocked]);

    const handleOnboardingExit = () => {
        // Redirecionar para landing page limpando sessão
        window.location.href = '/';
    };

    const renderContent = () => {
        const content = (() => {
            if (onboardingLoading && !isDemo) {
                return (
                    <div className="flex flex-col items-center justify-center h-full py-20 px-6 text-center animate-fade-in">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <Sparkles className="w-8 h-8 text-gold-500" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Preparando seu ambiente...</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm">Validando seus dados de configuração.</p>
                    </div>
                );
            }

            if (isLocked && activeView !== 'settings') {
                return <RestrictedAccessView />;
            }

            switch (activeView) {
                case 'inicio': return (
                    <div className="flex flex-col flex-1 divide-y divide-slate-100 dark:divide-slate-800">
                        <RescheduleManager isDemo={isDemo} />
                        <AppointmentsPage />
                    </div>
                );
                case 'appointments': return <AppointmentsPage />;
                case 'clients': return <ClientsPage />;
                case 'services': return <ServicesPage />;
                case 'professionals': return <ProfessionalsPage />;
                case 'blocks': return <ScheduleBlocksPage />;
                case 'reports': return <ReportsPage />;
                case 'settings': return <SettingsPage />;
                default: return isLocked ? <RestrictedAccessView /> : (
                    <div className="flex flex-col flex-1">
                        <RescheduleManager isDemo={isDemo} />
                        <AppointmentsPage />
                    </div>
                );
            }
        })();

        return (
            <div className="relative min-h-screen flex flex-col overflow-hidden">
                <div className="flex-1 animate-fade-in no-scrollbar overflow-y-auto">
                    {content}
                </div>
            </div>
        );
    };

    const activeLabel = navItems.find(item => item.id === activeView)?.label || (isLocked ? 'Acesso Restrito' : 'Agenda');

    const publicUrl = useMemo(() => {
      if (!businessInfo || !businessInfo.slug) return '';
      // In AI Studio preview, we want to use the current origin
      // In production, we use the custom domain
      const isProduction = window.location.hostname === 'agendios.com.br';
      const baseUrl = isProduction ? 'https://agendios.com.br' : window.location.origin;
      return `${baseUrl}/#/${businessInfo.slug}`;
    }, [businessInfo]);

    return (
        <div className="flex flex-col h-screen font-sans overflow-hidden">
            {/* Demo Mode Banner */}
            {isDemo && (
                <div className="bg-slate-900 text-white px-4 py-2 flex justify-between items-center z-50 shadow-md">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-70">Modo Demo</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => {
                                onLogout();
                                window.location.hash = '#signup';
                            }}
                            className="bg-white text-slate-900 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold hover:bg-slate-100 transition-colors"
                        >
                            Começar Grátis
                        </button>
                        <button 
                            onClick={onLogout}
                            className="text-white/60 hover:text-white text-[10px] sm:text-xs font-medium"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            )}

            {/* Trial Banner - Refined per user request */}
            {trialDaysLeft !== null && !isLocked && !isDemo && (
                <div className="bg-slate-900 dark:bg-slate-950 text-white px-4 py-2 flex justify-between items-center z-50 shadow-md border-b border-white/10 shrink-0 transition-all">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1 px-2 bg-gold-500 rounded-lg hidden sm:block">
                            <span className="text-[10px] font-black text-slate-900 uppercase">Pro</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                            <span className="text-[10px] sm:text-xs font-bold text-white tracking-wide">
                                {trialDaysLeft === 0 
                                    ? "Período de Teste: Acaba hoje!"
                                    : `Período de Teste: ${trialDaysLeft} dias restantes`
                                }
                            </span>
                            <span className="text-[8px] uppercase tracking-widest text-slate-500 font-bold hidden sm:inline opacity-70">• Teste Grátis de 30 dias</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            const safePaymentLink = getSafeUrl(STRIPE_PAYMENT_LINK);
                            if (safePaymentLink && safePaymentLink !== '#') {
                                const dynamicLink = `${safePaymentLink}${safePaymentLink.includes('?') ? '&' : '?'}client_reference_id=${businessInfo?.id}`;
                                window.open(dynamicLink, '_blank');
                            } else {
                                window.location.hash = 'settings';
                            }
                        }}
                        className="px-4 py-1.5 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest bg-gold-500 text-slate-900 hover:bg-gold-400 transition-all shadow-lg active:scale-95"
                    >
                        Assinar
                    </button>
                </div>
            )}
            
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar for Desktop */}
                <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
                <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary-500 p-1.5 rounded-lg text-white shadow-sm">
                            <Scissors className="w-5 h-5" />
                        </div>
                        <h1 className="text-xl font-bold">
                            <span className="text-slate-900 dark:text-slate-100">Agendios</span>
                        </h1>
                    </div>
                </div>
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            disabled={item.disabled}
                            onClick={() => !item.disabled && (window.location.hash = item.id)}
                            className={`w-full flex items-center px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                                activeView === item.id
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl'
                                    : item.disabled
                                        ? 'text-slate-200 dark:text-slate-700 cursor-not-allowed opacity-50 grayscale'
                                        : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                            }`}
                        >
                            <div className="relative">
                                <item.icon className={`w-5 h-5 mr-3 ${activeView === item.id ? 'text-gold-500 dark:text-slate-900' : 'text-slate-400'}`} />
                                {item.locked && (
                                    <div className="absolute -top-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-0.5 border border-slate-100 dark:border-slate-700">
                                        <Lock className="w-2.5 h-2.5 text-slate-400" />
                                    </div>
                                )}
                            </div>
                            {item.label}
                        </button>
                    ))}

                    {/* Desktop Sidebar "Meu Site" Link */}
                    {!isLocked && (publicUrl || isDemo) && (
                        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700/50">
                            <a 
                                href={isDemo ? '#/demonstracao' : publicUrl} 
                                target={isDemo ? '_self' : '_blank'} 
                                rel="noopener noreferrer" 
                                className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-bold text-gold-600 hover:bg-gold-50 dark:text-gold-400 dark:hover:bg-gold-900/20 transition-colors"
                            >
                                <ExternalLink className="w-5 h-5 mr-3" />
                                Meu Site
                            </a>
                        </div>
                    )}
                </nav>
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                    <button onClick={onLogout} className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700/50 transition-colors">
                        <LogOut className="w-5 h-5 mr-3" />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                
                {/* Unified Header (Desktop & Mobile) */}
                <header className="h-16 sm:h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 sm:px-8 z-20 shrink-0">
                <div className="flex items-center gap-1.5 sm:gap-4 min-w-0 flex-1">
                    <button 
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="md:hidden p-1.5 -ml-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col min-w-0">
                        <h2 className="text-sm sm:text-2xl font-serif font-bold text-slate-900 dark:text-slate-100 truncate pr-2">{activeLabel}</h2>
                    </div>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-4 shrink-0">
                    {/* Theme Toggle (Visible on Mobile and Desktop) */}
                    <button onClick={toggleTheme} className="p-1.5 sm:p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>

                    {/* Share Button - Now between theme and Meu Site */}
                    {!isLocked && (
                        <button 
                            onClick={() => {
                                if (publicUrl) {
                                    setIsShareModalOpen(true);
                                } else {
                                    addToast('Configure o nome e link da sua barbearia primeiro!', 'info');
                                    window.location.hash = 'settings';
                                }
                            }} 
                            className="p-1.5 sm:p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors" 
                            title="Compartilhar"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                    )}

                    {/* "Meu Site" Link - THE STAR OF THE HEADER */}
                    {!isLocked && (
                        <button 
                            onClick={() => {
                                if (isDemo) {
                                    window.location.hash = '#/demonstracao';
                                    return;
                                }
                                if (publicUrl) {
                                    window.open(publicUrl, '_blank');
                                } else {
                                    addToast('Configure o nome e link da sua barbearia primeiro!', 'info');
                                    window.location.hash = 'settings';
                                }
                            }}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 bg-gold-500 text-slate-900 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg shadow-gold-500/30 hover:bg-gold-400 hover:scale-105 active:scale-95 transition-all whitespace-nowrap" 
                            title="Ver Meu Site"
                        >
                           <ExternalLink className="w-3 h-3 sm:hidden" />
                           <span className="hidden sm:inline">Meu Site</span>
                           <span className="sm:hidden">Site</span>
                        </button>
                    )}

                    <div className="hidden sm:flex items-center gap-2">
                        {/* Logout (Desktop only) */}
                        <button onClick={onLogout} className="hidden md:flex p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
                             <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

                <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 flex flex-col relative">
                    <div className="flex-1">
                         {renderContent()}
                    </div>
                    <footer className="p-6 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 mt-auto">
                        © {new Date().getFullYear()} AG Sistemas. Todos os direitos reservados.
                    </footer>
                </main>

                {/* Mobile Side Drawer Navigation */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <>
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] md:hidden"
                            />
                            <motion.div 
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 z-[70] md:hidden flex flex-col shadow-2xl"
                            >
                    <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-slate-900 dark:bg-white p-1.5 rounded-lg text-white dark:text-slate-900">
                                            <Scissors className="w-5 h-5" />
                                        </div>
                                        <h1 className="text-lg font-serif font-bold">
                                            <span className="text-slate-900 dark:text-slate-100">Agendios</span>
                                        </h1>
                                    </div>
                                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                                    {navItems.map(item => (
                                        <button
                                            key={item.id}
                                            disabled={item.disabled}
                                            onClick={() => {
                                                if (!item.disabled) {
                                                    window.location.hash = item.id;
                                                    setIsMobileMenuOpen(false);
                                                }
                                            }}
                                            className={`w-full flex items-center px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                                                activeView === item.id
                                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg'
                                                    : item.disabled
                                                        ? 'text-slate-200 dark:text-slate-700 cursor-not-allowed opacity-50 grayscale'
                                                        : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                                            }`}
                                        >
                                            <div className="relative">
                                                <item.icon className={`w-5 h-5 mr-4 ${activeView === item.id ? 'text-gold-500 dark:text-slate-900' : 'text-slate-400'}`} />
                                                {item.locked && (
                                                    <div className="absolute -top-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-0.5 border border-slate-100 dark:border-slate-800">
                                                        <Lock className="w-2.5 h-2.5 text-slate-400" />
                                                    </div>
                                                )}
                                            </div>
                                            {item.label}
                                        </button>
                                    ))}
                                </nav>

                                <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                    {!isLocked && (publicUrl || isDemo) && (
                                        <a 
                                            href={isDemo ? '#/demonstracao' : publicUrl} 
                                            target={isDemo ? '_self' : '_blank'} 
                                            rel="noopener noreferrer" 
                                            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-gold-500 text-slate-900 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-gold-500/20"
                                        >
                                            <ExternalLink className="w-5 h-5" />
                                            Meu Site
                                        </a>
                                    )}
                                    <div className="flex items-center justify-end px-4 mb-2">
                                        {!isLocked && publicUrl && (
                                            <button onClick={() => { setIsShareModalOpen(true); setIsMobileMenuOpen(false); }} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                <Share2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                    <button onClick={onLogout} className="w-full flex items-center px-4 py-3.5 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                        <LogOut className="w-5 h-5 mr-4" />
                                        Sair da Conta
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
            
             <ShareModal 
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                url={publicUrl}
            />
            </div>
        </div>
    );
};

export default Dashboard;
