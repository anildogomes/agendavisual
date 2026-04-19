
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Settings, LogOut, Home, Users, Scissors, Briefcase, Ban, Share2, Sun, Moon, ChevronsLeft, Calendar, AlertTriangle, X, Smartphone, ChartBar, LayoutDashboard, Menu, ExternalLink, Sparkles } from '../constants';
import { Lock } from 'lucide-react';
import { BusinessInfo } from '../types';
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

// --- COMPONENT: ONBOARDING OVERLAY ---
const OnboardingOverlay = ({ step, onNavigate }: { step: { label: string, nextStep: string }, onNavigate: (s: string) => void }) => {
    return (
        <div className="absolute inset-0 z-40 bg-slate-100/40 dark:bg-slate-950/40 backdrop-blur-[2px] flex items-center sm:items-end md:items-center justify-center sm:pb-24 md:pb-0 p-4 sm:p-6 text-center animate-fade-in">
            <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] shadow-2xl border border-slate-200/50 dark:border-slate-800/50 max-w-sm w-full relative"
            >
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gold-400/20 rounded-2xl flex items-center justify-center mb-5 mx-auto">
                    <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-gold-600 dark:text-gold-400 animate-pulse" />
                </div>
                
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    Primeiros Passos
                </h3>
                
                <p className="text-slate-500 dark:text-slate-400 mb-6 text-xs sm:text-sm leading-relaxed">
                    Personalize sua agenda para começar a receber clientes online.
                </p>

                <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gold-600 dark:text-gold-400 mb-1">Passo Pendente</p>
                        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">{step.label}</p>
                    </div>

                    <button 
                        onClick={() => onNavigate(step.nextStep)}
                        className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold uppercase tracking-widest text-[10px] rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        Configurar Agora
                    </button>
                </div>
            </motion.div>
        </div>
    );
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
            link.download = 'qrcode-agendavisual.png';
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

interface DashboardProps {
    onLogout: () => void;
    isDemo?: boolean;
}

// --- ONBOARDING ENFORCEMENT ---
const OnboardingLock: React.FC<{ status: any, currentView: string, onViewChange: (v: string) => void, onExit: () => void }> = ({ status, currentView, onViewChange, onExit }) => {
    if (status.isComplete) return null;

    // Show the lock overlay if we are not on the correct step
    // OR if we are on the step but want to ensure the user knows it's the required one
    // Actually, user wants "mensagem flutuante informando que ele devera inserir dados necessarios - passo a passo"
    // If currentView is the nextStep, we can show a smaller "Step indicator" or just let them fill.
    // However, user said "direcionado a pagina agenda(isso não deve acontecer pois deve estar bloqueado)"
    // So we definitely block everything except nextStep.
    
    if (currentView !== status.nextStep) {
        return (
            <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 text-center"
                >
                    <div className="w-24 h-24 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            <Settings className="w-12 h-12 text-gold-600" />
                        </motion.div>
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-2 border-2 border-slate-100 dark:border-slate-800 shadow-sm">
                            <Lock className="w-4 h-4 text-slate-400" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-4">Quase lá!</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                        Para liberar sua agenda, você precisa completar a configuração passo a passo:
                    </p>

                    <div className="space-y-4 mb-10">
                        {[
                            { step: 1, label: 'Perfil, Endereço e Horários', complete: status.stepNumber > 1 },
                            { step: 2, label: 'Cadastrar Serviços', complete: status.stepNumber > 2 },
                            { step: 3, label: 'Cadastrar Profissionais', complete: status.stepNumber > 3 }
                        ].map(({ step, label, complete }) => (
                            <div key={step} className="flex items-center gap-4 text-left p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                                    complete ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 
                                    step === status.stepNumber ? 'bg-gold-500 text-white shadow-lg shadow-gold-500/20' : 
                                    'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                                }`}>
                                    {complete ? '✓' : step}
                                </div>
                                <span className={`text-sm font-medium ${step === status.stepNumber ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <button 
                            onClick={() => {
                                onViewChange(status.nextStep);
                                window.location.hash = status.nextStep;
                            }}
                            className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-900/20 dark:shadow-white/10"
                        >
                            Ir para o Passo {status.stepNumber}
                        </button>
                        <button 
                            onClick={onExit}
                            className="w-full py-3 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 font-bold text-xs uppercase tracking-widest transition-colors"
                        >
                            Desistir e Sair
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return null;
};

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
        const left = 7 - diffDays; // Updated to 7 days
        
        const trialLeft = left >= 0 ? left : 0;
        
        // Locked if: NOT active subscription AND NOT exempt AND Trial expired
        const locked = !isActive && !isExempt && trialLeft <= 0;

        return { trialDaysLeft: trialLeft, isLocked: locked };
    }, [businessInfo]);

    // Onboarding Logic
    const onboardingStatus = useMemo(() => {
        if (isDemo) return { isComplete: true, nextStep: null, stepNumber: 0 };
        
        // While businessInfo is null OR counts are loading, we are in a pending state.
        // For security/redirect logic, we assume Step 1 is the starting point.
        if (!businessInfo || onboardingLoading) {
             return { 
                isComplete: false, 
                nextStep: 'settings', 
                stepNumber: 1,
                label: 'Passo 1: Configurações (Perfil, Endereço e Horários)' 
            };
        }

        // --- STEP 1: SETTINGS ---
        const biz = onboardingState.businessInfo;
        const hasProfile = !!(biz?.full_name?.trim() && biz?.business_name?.trim() && biz?.slug?.trim() && biz?.whatsapp_phone?.trim());
        const hasAddress = !!(biz?.street?.trim() && biz?.number?.trim() && biz?.neighborhood?.trim() && biz?.city?.trim() && biz?.state?.trim());
        const hasHours = !!(biz?.work_hours && Object.values(biz.work_hours).some((intervals: any) => intervals && intervals.length > 0));

        if (!hasProfile || !hasAddress || !hasHours) {
            return { 
                isComplete: false, 
                nextStep: 'settings', 
                stepNumber: 1,
                label: 'Passo 1: Configurações (Perfil, Endereço e Horários)' 
            };
        }

        // --- STEP 2: SERVICES ---
        // Be extremely defensive: if count is 0, null, or undefined, it's step 2
        const sCount = onboardingState.servicesCount;
        if (sCount === null || sCount === undefined || sCount === 0) {
            return { 
                isComplete: false, 
                nextStep: 'services', 
                stepNumber: 2,
                label: 'Passo 2: Cadastrar ao menos um Serviço' 
            };
        }

        // --- STEP 3: PROFESSIONALS ---
        // Be extremely defensive: if count is 0, null, or undefined, it's step 3
        const pCount = onboardingState.professionalsCount;
        if (pCount === null || pCount === undefined || pCount === 0) {
            return { 
                isComplete: false, 
                nextStep: 'professionals', 
                stepNumber: 3,
                label: 'Passo 3: Cadastrar ao menos um Profissional' 
            };
        }
        
        return { isComplete: true, nextStep: null, stepNumber: 4 };
    }, [onboardingState]);

    useEffect(() => {
        if (!onboardingStatus.isComplete && !isDemo && businessInfo) {
            // Check if we need to show the initial onboarding notification
            const onboardingKey = `onboarding_welcome_${businessInfo.id}`;
            const shown = localStorage.getItem(onboardingKey);
            if (!shown) {
                addToast('Bem-vindo(a)! Complete o passo a passo para liberar sua agenda.', 'info');
                localStorage.setItem(onboardingKey, 'true');
            }
        }
    }, [onboardingStatus.isComplete, isDemo, businessInfo, addToast]);

    const navItems = useMemo(() => {
        const fullItems = [
            { id: 'settings', label: 'Configurações', icon: Settings },
            { id: 'services', label: 'Serviços', icon: Scissors },
            { id: 'professionals', label: 'Profissionais', icon: Briefcase },
            { id: 'inicio', label: 'Agenda', icon: Calendar },
            { id: 'clients', label: 'Clientes', icon: Users },
            { id: 'blocks', label: 'Bloqueios', icon: Ban },
            { id: 'reports', label: 'Relatórios', icon: ChartBar },
        ];

        // If locked (Subscription), restrict navigation to only Settings
        if (isLocked) {
            return [
                { id: 'settings', label: 'Configurações', icon: Settings }
            ];
        }

        // --- ENFORCED ONBOARDING NAV LOCK ---
        if (!onboardingStatus.isComplete && !isDemo) {
            // Only allow the current necessary step and Settings
            return fullItems.map(item => ({
                ...item,
                disabled: item.id !== onboardingStatus.nextStep && item.id !== 'settings',
                locked: item.id !== onboardingStatus.nextStep && item.id !== 'settings'
            }));
        }

        return fullItems;
    }, [isLocked, onboardingStatus]);

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
            
            // If onboarding is active, force the correct view
            if (!isDemo && !onboardingLoading && !onboardingStatus.isComplete) {
                const requiredPage = onboardingStatus.nextStep || 'settings';
                if (hash !== requiredPage) {
                    setActiveView(requiredPage);
                    window.location.hash = requiredPage;
                } else {
                    setActiveView(hash);
                }
                return;
            }

            if (navItems.find(item => item.id === hash)) {
                setActiveView(hash);
            } else if (isLocked && hash !== 'settings') {
                // Redirect to settings if locked
                setActiveView('settings');
                window.location.hash = 'settings';
            } else if (!hash || hash === '') {
                 // Prioritize onboarding step over inicio for new users
                 const fallback = (!onboardingStatus.isComplete && !isDemo) ? (onboardingStatus.nextStep || 'settings') : (isLocked ? 'settings' : 'inicio');
                 setActiveView(fallback);
                 window.location.hash = fallback;
            }
        };

        handleHashChange(); // Check on mount
        setTimeout(() => setIsInitialLoad(false), 500); // Small buffer for content to settle

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [navItems, isLocked, onboardingStatus, isDemo, onboardingLoading]);

    const renderContent = () => {
        if (isLocked && activeView !== 'settings') {
            return <RestrictedAccessView />;
        }

        // Access Restriction during Onboarding
        const isOnboardingPage = ['settings', 'services', 'professionals'].includes(activeView);
        if (!onboardingStatus.isComplete && !isOnboardingPage && !isDemo) {
            return <OnboardingOverlay step={onboardingStatus as any} onNavigate={(s) => window.location.hash = s} />;
        }

        switch (activeView) {
            case 'inicio': return <AppointmentsPage />;
            case 'appointments': return <AppointmentsPage />; // Fallback for old links
            case 'clients': return <ClientsPage />;
            case 'services': return <ServicesPage />;
            case 'professionals': return <ProfessionalsPage />;
            case 'blocks': return <ScheduleBlocksPage />;
            case 'reports': return <ReportsPage />;
            case 'settings': return <SettingsPage />;
            default: return isLocked ? <RestrictedAccessView /> : <AppointmentsPage />;
        }
    };

    const activeLabel = navItems.find(item => item.id === activeView)?.label || (isLocked ? 'Acesso Restrito' : 'Agenda');

    const publicUrl = useMemo(() => {
      if (!businessInfo || !businessInfo.slug) return '';
      // In AI Studio preview, we want to use the current origin
      // In production, we use the custom domain
      const isProduction = window.location.hostname === 'agendavisual.com.br';
      const baseUrl = isProduction ? 'https://agendavisual.com.br' : window.location.origin;
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
            
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar for Desktop */}
                <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
                <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary-500 p-1.5 rounded-lg text-white shadow-sm">
                            <Scissors className="w-5 h-5" />
                        </div>
                        <h1 className="text-xl font-bold">
                            <span className="text-slate-900 dark:text-slate-100">Agenda</span>
                            <span className="text-gold-600 dark:text-gold-400">Visual</span>
                        </h1>
                    </div>
                </div>
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            disabled={item.disabled}
                            onClick={() => !item.disabled && (window.location.hash = item.id)}
                            className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                activeView === item.id
                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                                    : item.disabled
                                        ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50 grayscale'
                                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50'
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
                <header className="h-16 sm:h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-2 sm:px-8 z-20 shrink-0">
                <div className="flex items-center gap-1 sm:gap-4 min-w-0 flex-1">
                    <button 
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="md:hidden p-2 -ml-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col min-w-0">
                        <h2 className="text-base sm:text-2xl font-serif font-bold text-slate-900 dark:text-slate-100 truncate">{activeLabel}</h2>
                        {!onboardingStatus.isComplete && !isDemo && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-gold-600 truncate">Configuração em Andamento</span>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-4 shrink-0">
                    {/* Theme Toggle (Visible on Mobile and Desktop) */}
                    <button onClick={toggleTheme} className="p-2 sm:p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
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
                            className="p-2 sm:p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors" 
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
                            className="flex items-center gap-2 px-2.5 sm:px-6 py-2 sm:py-2.5 bg-gold-500 text-slate-900 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg shadow-gold-500/30 hover:bg-gold-400 hover:scale-105 active:scale-95 transition-all whitespace-nowrap" 
                            title="Ver Meu Site"
                        >
                           <span>Meu Site</span>
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

                {/* Trial Banner - Subtler darker design (Only show if not locked and NOT demo) */}
                {trialDaysLeft !== null && !isLocked && !isDemo && (
                    <div className="bg-slate-900 text-white px-4 py-1.5 flex flex-col sm:flex-row justify-between items-center text-[10px] sm:text-xs gap-1.5 z-10 shrink-0 shadow-sm border-b border-slate-800">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-300 uppercase tracking-widest">
                                {trialDaysLeft === 0 
                                    ? "Atenção: Último dia de teste"
                                    : `Período de Teste: ${trialDaysLeft} dias`
                                }
                            </span>
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
                            className="px-3 py-1 rounded-full font-black text-[9px] sm:text-[10px] uppercase tracking-tighter bg-gold-500 text-slate-900 hover:bg-gold-400 transition-colors"
                        >
                            Regularizar Assinatura
                        </button>
                    </div>
                )}

                <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 flex flex-col relative">
                    <OnboardingLock 
                        status={onboardingStatus} 
                        currentView={activeView} 
                        onViewChange={(view) => {
                            setActiveView(view);
                            window.location.hash = view;
                        }} 
                        onExit={onLogout}
                    />
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
                                <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-slate-900 dark:bg-white p-1.5 rounded-lg text-white dark:text-slate-900">
                                            <Scissors className="w-5 h-5" />
                                        </div>
                                        <h1 className="text-xl font-serif font-bold">
                                            <span className="text-slate-900 dark:text-slate-100">Agenda</span>
                                            <span className="text-gold-600 dark:text-gold-400">Visual</span>
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
                                                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg shadow-slate-900/20 dark:shadow-white/10'
                                                    : item.disabled
                                                        ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50 grayscale'
                                                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
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
