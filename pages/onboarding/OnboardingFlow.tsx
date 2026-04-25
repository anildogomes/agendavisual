
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';
import Stepper from '../../components/onboarding/Stepper';
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import { BusinessInfo, Service, Professional } from '../../types';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../App';

const OnboardingFlow: React.FC = () => {
    const [step, setStep] = useState(1);
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // Consolidated Onboarding State
    const [data, setData] = useState({
        business: {
            name: '',
            full_name: '',
            whatsapp_phone: '',
            slug: '',
            street: '',
            number: '',
            neighborhood: '',
            city: '',
            state: '',
            cep: '',
            work_hours: {
                'monday': [{ start: '08:00', end: '18:00' }],
                'tuesday': [{ start: '08:00', end: '18:00' }],
                'wednesday': [{ start: '08:00', end: '18:00' }],
                'thursday': [{ start: '08:00', end: '18:00' }],
                'friday': [{ start: '08:00', end: '18:00' }],
                'saturday': [],
                'sunday': []
            }
        } as Partial<BusinessInfo>,
        services: [] as any[],
        professionals: [] as any[]
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Parallel fetch to be efficient
                const [bizRes, servRes, profRes] = await Promise.all([
                    supabase.from('businesses').select('*').eq('id', user.id).maybeSingle(),
                    supabase.from('services').select('id', { count: 'exact', head: true }).eq('business_id', user.id),
                    supabase.from('professionals').select('id', { count: 'exact', head: true }).eq('business_id', user.id)
                ]);

                const biz = bizRes.data;
                const hasBiz = !!(biz?.name && biz?.slug && biz?.whatsapp_phone);
                const hasServices = (servRes.count || 0) > 0;
                const hasProfessionals = (profRes.count || 0) > 0;

                // If everything is already set up, get out of here
                if (hasBiz && hasServices && hasProfessionals) {
                    window.location.hash = '#inicio';
                    return;
                }

                if (biz) {
                    setData(prev => ({ 
                        ...prev, 
                        business: { ...prev.business, ...biz } 
                    }));
                }
            }
        };
        fetchInitialData();
    }, []);

    const nextStep = () => {
        setStep(prev => Math.min(prev + 1, 3));
        window.scrollTo(0, 0);
    };

    const prevStep = () => {
        setStep(prev => Math.max(prev - 1, 1));
        window.scrollTo(0, 0);
    };

    const handleFinish = async () => {
        setIsLoading(true);
        try {
            // Final save logic (Step 3 handles its own saves or we batch here)
            window.location.hash = '#inicio';
            addToast('Sua conta foi configurada com sucesso!', 'success');
        } catch (error) {
            addToast('Erro ao finalizar configuração.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center">
            {/* Header */}
            <header className="w-full max-w-[400px] px-6 pt-12 pb-4 flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/20 mb-4 animate-bounce-subtle">
                    <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Agendios
                </h1>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                    Configuração da sua conta
                </p>
            </header>

            {/* Stepper Container */}
            <div className="w-full max-w-[400px] px-6">
                <Stepper 
                    currentStep={step} 
                    steps={['Negócio', 'Serviços', 'Equipe']} 
                />
            </div>

            {/* Steps Content */}
            <main className="w-full max-w-[400px] px-6 pb-24 flex-1">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                        {step === 1 && <Step1 data={data.business} onUpdate={(b) => setData(p => ({ ...p, business: b }))} onNext={nextStep} />}
                        {step === 2 && <Step2 businessId={data.business.id} onNext={nextStep} onBack={prevStep} />}
                        {step === 3 && <Step3 onFinish={handleFinish} onBack={prevStep} isLoading={isLoading} />}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default OnboardingFlow;
