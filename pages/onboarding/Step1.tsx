
import React, { useState } from 'react';
import Input from '../../components/onboarding/Input';
import DayRow from '../../components/onboarding/DayRow';
import Button from '../../components/onboarding/Button';
import { Smartphone, Globe, MapPin, Building, Hash, Navigation, ArrowRight } from 'lucide-react';
import { BusinessInfo } from '../../types';
import { supabase } from '../../supabaseClient';
import { useToast } from '../../App';

interface Step1Props {
    data: Partial<BusinessInfo>;
    onUpdate: (data: Partial<BusinessInfo>) => void;
    onNext: () => void;
}

import { onboardingService } from '../../services/onboardingService';

const DAY_MAP: Record<string, string> = {
    'Segunda': 'monday',
    'Terça': 'tuesday',
    'Quarta': 'wednesday',
    'Quinta': 'thursday',
    'Sexta': 'friday',
    'Sábado': 'saturday',
    'Domingo': 'sunday'
};

const Step1: React.FC<Step1Props> = ({ data, onUpdate, onNext }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Rigorous validation: All critical fields must be present
        const requiredFields = [
            { key: 'name', label: 'Nome do Negócio' },
            { key: 'full_name', label: 'Nome do Proprietário' },
            { key: 'whatsapp_phone', label: 'WhatsApp / Telefone' },
            { key: 'slug', label: 'Link Personalizado' },
            { key: 'cep', label: 'CEP' },
            { key: 'street', label: 'Rua' },
            { key: 'number', label: 'Número' },
            { key: 'neighborhood', label: 'Bairro' },
            { key: 'city', label: 'Cidade' },
            { key: 'state', label: 'Estado' }
        ];

        let hasError = false;
        for (const field of requiredFields) {
            const value = (data as any)[field.key];
            if (!value || String(value).trim() === '') {
                addToast(`O campo "${field.label}" é obrigatório.`, 'error');
                hasError = true;
                break;
            }
        }

        if (hasError) return;

        setIsLoading(true);
        try {
            await onboardingService.saveCompany(data);
            console.log('[DEBUG] Step 1 complete. Data saved via OnboardingService.');
            onNext();
        } catch (error: any) {
            console.error('Error saving step 1:', error);
            addToast(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

    return (
        <form onSubmit={handleSave} className="space-y-8 animate-fade-in">
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sobre seu Negócio</h2>
                <p className="text-sm text-slate-500">Comece com o básico para as pessoas te encontrarem.</p>
            </div>

            <div className="space-y-4">
                <Input 
                    label="Nome do Negócio" 
                    placeholder="Ex: Barbeira do João" 
                    value={data.name || ''}
                    onChange={e => onUpdate({ ...data, name: e.target.value })}
                    icon={<Building className="w-5 h-5" />}
                    required
                />
                <Input 
                    label="Nome do Proprietário" 
                    placeholder="Seu nome completo" 
                    value={data.full_name || ''}
                    onChange={e => onUpdate({ ...data, full_name: e.target.value })}
                    required
                />
                <Input 
                    label="WhatsApp / Telefone" 
                    placeholder="(00) 00000-0000" 
                    value={data.whatsapp_phone || ''}
                    onChange={e => onUpdate({ ...data, whatsapp_phone: e.target.value })}
                    icon={<Smartphone className="w-5 h-5" />}
                    required
                />
                <div className="group">
                    <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider mb-1.5 block">
                        Link Personalizado (URL)
                    </label>
                    <div className="flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent focus-within:border-purple-500/20 focus-within:ring-4 focus-within:ring-purple-500/10 transition-all">
                        <span className="pl-4 text-slate-400 text-sm font-medium">agendios.com.br/</span>
                        <input 
                            className="bg-transparent py-3 pr-4 text-sm font-bold text-purple-600 outline-none w-full lowercase" 
                            placeholder="seu-link"
                            value={data.slug || ''}
                            onChange={e => onUpdate({ ...data, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-6 pt-4">
                <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold text-slate-900 dark:text-white">Localização</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <Input 
                        label="CEP" 
                        placeholder="00000-000" 
                        value={data.cep || ''}
                        onChange={e => onUpdate({ ...data, cep: e.target.value })}
                    />
                    <Input 
                        label="Número" 
                        placeholder="123" 
                        value={data.number || ''}
                        onChange={e => onUpdate({ ...data, number: e.target.value })}
                    />
                </div>
                <Input 
                    label="Rua" 
                    placeholder="Nome da avenida ou rua" 
                    value={data.street || ''}
                    onChange={e => onUpdate({ ...data, street: e.target.value })}
                />
                <Input 
                    label="Bairro" 
                    placeholder="Digite o bairro" 
                    value={data.neighborhood || ''}
                    onChange={e => onUpdate({ ...data, neighborhood: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                    <Input 
                        label="Cidade" 
                        placeholder="Ex: Fortaleza" 
                        value={data.city || ''}
                        onChange={e => onUpdate({ ...data, city: e.target.value })}
                    />
                    <Input 
                        label="Estado" 
                        placeholder="UF" 
                        maxLength={2}
                        value={data.state || ''}
                        onChange={e => onUpdate({ ...data, state: e.target.value.toUpperCase() })}
                    />
                </div>
            </div>

            <div className="space-y-6 pt-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Hash className="w-5 h-5 text-purple-600" />
                        <h3 className="font-bold text-slate-900 dark:text-white">Horários de Atendimento</h3>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Selecione os dias e intervalos que você trabalha.</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
                    {days.map(day => {
                        const englishKey = DAY_MAP[day];
                        return (
                            <DayRow 
                                key={day}
                                day={day}
                                intervals={data.work_hours?.[englishKey] || []}
                                onChange={(intervals) => onUpdate({
                                    ...data,
                                    work_hours: {
                                        ...data.work_hours,
                                        [englishKey]: intervals
                                    }
                                })}
                            />
                        );
                    })}
                </div>
            </div>

            <Button type="submit" className="w-full h-14" isLoading={isLoading} icon={<ArrowRight className="w-5 h-5" />}>
                Salvar e Continuar
            </Button>
        </form>
    );
};

export default Step1;
