
import React, { useState, useEffect } from 'react';
import Input from '../../components/onboarding/Input';
import Button from '../../components/onboarding/Button';
import DayRow from '../../components/onboarding/DayRow';
import { User, Smartphone, Scissors, Briefcase, Plus, Trash2, Check, ArrowRight, ArrowLeft, Clock } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../App';
import { Service, Professional } from '../../types';

import { onboardingService } from '../../services/onboardingService';

interface Step3Props {
    onFinish: () => void;
    onBack: () => void;
    isLoading?: boolean;
}

const DAY_MAP: Record<string, string> = {
    'Segunda': 'monday',
    'Terça': 'tuesday',
    'Quarta': 'wednesday',
    'Quinta': 'thursday',
    'Sexta': 'friday',
    'Sábado': 'saturday',
    'Domingo': 'sunday'
};

const Step3: React.FC<Step3Props> = ({ onFinish, onBack, isLoading: isFinishing }) => {
    const [professional, setProfessional] = useState<any>({
        name: '',
        whatsapp_phone: '',
        service_ids: [] as string[],
        work_hours: {
            'monday': [{ start: '08:00', end: '18:00' }],
            'tuesday': [{ start: '08:00', end: '18:00' }],
            'wednesday': [{ start: '08:00', end: '18:00' }],
            'thursday': [{ start: '08:00', end: '18:00' }],
            'friday': [{ start: '08:00', end: '18:00' }],
            'saturday': [],
            'sunday': []
        }
    });
    
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Fetch services to select from
                const { data: sData } = await supabase.from('services').select('*').eq('business_id', user.id);
                setServices(sData || []);
                
                // Fetch existing professional if any
                const { data: pData } = await supabase.from('professionals').select('*').eq('business_id', user.id).maybeSingle();
                if (pData) {
                    // Fetch existing service relations
                    const { data: relData } = await supabase.from('professional_services').select('service_id').eq('professional_id', pData.id);
                    const parsedServiceIds = relData ? relData.map(r => r.service_id) : [];

                    setProfessional({
                        ...pData,
                        service_ids: parsedServiceIds
                    });
                }
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const toggleService = (serviceId: string) => {
        setProfessional((prev: any) => {
            const current = prev.service_ids || [];
            if (current.includes(serviceId)) {
                return { ...prev, service_ids: current.filter((id: string) => id !== serviceId) };
            } else {
                return { ...prev, service_ids: [...current, serviceId] };
            }
        });
    };

    const handleSave = async () => {
        if (!professional.name || !professional.whatsapp_phone) {
            addToast('Preencha os dados do profissional.', 'error');
            return;
        }

        if (!professional.service_ids || professional.service_ids.length === 0) {
            addToast('Selecione pelo menos um serviço para este profissional.', 'error');
            return;
        }

        setIsSaving(true);
        try {
            await onboardingService.saveProfessional(professional);
            console.log('[DEBUG] Step 3 complete. Professional saved via Service.');
            onFinish();
        } catch (error: any) {
            addToast(`Erro ao salvar profissional: ${error.message || 'Erro desconhecido'}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sua Equipe</h2>
                <p className="text-sm text-slate-500">Adicione quem irá realizar os atendimentos. Você pode começar por você mesmo!</p>
            </div>

            <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-900 rounded-[32px] p-6 border-2 border-transparent">
                    <div className="space-y-4">
                        <Input 
                            label="Nome do Profissional" 
                            placeholder="Ex: João Silva" 
                            value={professional.name}
                            onChange={e => setProfessional({ ...professional, name: e.target.value })}
                            icon={<User className="w-5 h-5" />}
                        />
                        <Input 
                            label="WhatsApp" 
                            placeholder="(00) 00000-0000" 
                            value={professional.whatsapp_phone}
                            onChange={e => setProfessional({ ...professional, whatsapp_phone: e.target.value })}
                            icon={<Smartphone className="w-5 h-5" />}
                        />
                    </div>
                </div>

                <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2">
                        <Scissors className="w-5 h-5 text-purple-600" />
                        <h3 className="font-bold text-slate-900 dark:text-white">Serviços que realiza</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                        {services.map(service => (
                            <button
                                key={service.id}
                                onClick={() => toggleService(service.id)}
                                className={`
                                    flex items-center justify-between p-4 rounded-2xl border-2 transition-all
                                    ${professional.service_ids?.includes(service.id) 
                                        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 shadow-sm' 
                                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 hover:border-slate-200'}
                                `}
                            >
                                <div className="text-left">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{service.name}</p>
                                    <p className="text-[10px] font-medium text-slate-400">{service.duration} min • R$ {service.price}</p>
                                </div>
                                {professional.service_ids?.includes(service.id) && (
                                    <div className="bg-purple-600 rounded-full p-1">
                                        <Check className="w-3 h-3 text-white stroke-[4]" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-6 pt-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-purple-600" />
                            <h3 className="font-bold text-slate-900 dark:text-white">Horários de Trabalho</h3>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">Defina a disponibilidade individual deste profissional.</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
                        {days.map(day => {
                            const englishKey = DAY_MAP[day];
                            return (
                                <DayRow 
                                    key={day}
                                    day={day}
                                    intervals={professional.work_hours?.[englishKey] || []}
                                    onChange={(intervals) => setProfessional({
                                        ...professional,
                                        work_hours: {
                                            ...professional.work_hours,
                                            [englishKey]: intervals
                                        }
                                    })}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <Button variant="outline" className="flex-1" onClick={onBack}>
                    Voltar
                </Button>
                <Button 
                    className="flex-[2]" 
                    onClick={handleSave} 
                    isLoading={isSaving || isFinishing}
                    icon={<Check className="w-5 h-5" />}
                >
                    Finalizar Configuração
                </Button>
            </div>
        </div>
    );
};

export default Step3;
