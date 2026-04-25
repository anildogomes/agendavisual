
import React, { useState, useEffect } from 'react';
import Input from '../../components/onboarding/Input';
import Button from '../../components/onboarding/Button';
import { Scissors, DollarSign, Clock, Plus, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../App';

import { onboardingService } from '../../services/onboardingService';

interface Step2Props {
    businessId?: string;
    onNext: () => void;
    onBack: () => void;
}

const Step2: React.FC<Step2Props> = ({ businessId, onNext, onBack }) => {
    const [services, setServices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        const fetchServices = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('services').select('*').eq('business_id', user.id);
                if (data && data.length > 0) {
                    setServices(data.map(s => ({ ...s, isExisting: true })));
                } else {
                    // Start with one empty service for a better UX
                    setServices([{ name: '', price: '', duration: 30, id: Date.now() }]);
                }
            }
            setIsLoading(false);
        };
        fetchServices();
    }, []);

    const addService = () => {
        setServices([...services, { name: '', price: '', duration: 30, id: Date.now() }]);
    };

    const removeService = async (index: number) => {
        const service = services[index];
        if (service.isExisting) {
            const { error } = await supabase.from('services').delete().eq('id', service.id);
            if (error) {
                addToast('Erro ao remover serviço do banco.', 'error');
                return;
            }
        }
        setServices(services.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        const validServices = services.filter(s => s.name.trim() !== '');
        if (validServices.length === 0) {
            addToast('Adicione pelo menos um serviço.', 'error');
            return;
        }

        setIsSaving(true);
        try {
            await onboardingService.saveServices(validServices);
            console.log('[DEBUG] Step 2 complete. Services successfully upserted via Service. Count:', validServices.length);
            onNext();
        } catch (error: any) {
            addToast(`Erro ao salvar serviços: ${error.message || 'Erro desconhecido'}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Seus Serviços</h2>
                <p className="text-sm text-slate-500">Quais tipos de agendamentos seus clientes poderão fazer?</p>
            </div>

            <div className="space-y-6">
                {services.map((service, idx) => (
                    <div 
                        key={service.id || idx} 
                        className="bg-slate-50 dark:bg-slate-900 rounded-[32px] p-6 border-2 border-transparent hover:border-purple-500/20 transition-all relative group"
                    >
                        {services.length > 1 && (
                            <button 
                                onClick={() => removeService(idx)}
                                className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-slate-800 text-red-500 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        
                        <div className="space-y-4">
                            <Input 
                                label="Nome do Serviço" 
                                placeholder="Ex: Corte de Cabelo Masculino" 
                                value={service.name}
                                onChange={e => {
                                    const newS = [...services];
                                    newS[idx].name = e.target.value;
                                    setServices(newS);
                                }}
                                icon={<Scissors className="w-5 h-5" />}
                            />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <Input 
                                    label="Preço (R$)" 
                                    placeholder="0,00" 
                                    type="number"
                                    value={service.price}
                                    onChange={e => {
                                        const newS = [...services];
                                        newS[idx].price = e.target.value;
                                        setServices(newS);
                                    }}
                                    icon={<DollarSign className="w-5 h-5" />}
                                />
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">
                                        Duração
                                    </label>
                                    <div className="relative">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                        <select 
                                            value={service.duration}
                                            onChange={e => {
                                                const newS = [...services];
                                                newS[idx].duration = e.target.value;
                                                setServices(newS);
                                            }}
                                            className="w-full bg-white dark:bg-slate-800 border-none px-4 py-3 pl-11 rounded-2xl text-sm font-bold appearance-none outline-none focus:ring-4 focus:ring-purple-500/10"
                                        >
                                            <option value={15}>15 min</option>
                                            <option value={30}>30 min</option>
                                            <option value={45}>45 min</option>
                                            <option value={60}>1 hora</option>
                                            <option value={90}>1h 30m</option>
                                            <option value={120}>2 horas</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <button 
                    onClick={addService}
                    className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Adicionar outro serviço
                </button>
            </div>

            <div className="flex gap-4 pt-4">
                <Button variant="outline" className="flex-1" onClick={onBack}>
                    Voltar
                </Button>
                <Button 
                    className="flex-[2]" 
                    onClick={handleSave} 
                    isLoading={isSaving}
                    icon={<ArrowRight className="w-5 h-5" />}
                >
                    Continuar
                </Button>
            </div>
        </div>
    );
};

export default Step2;
