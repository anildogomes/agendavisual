
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Briefcase, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  X,
  User,
  Phone,
  Check,
  Clock,
  Scissors,
  MessageCircle,
  TrendingUp,
  Award,
  ChevronRight,
  ShieldCheck,
  Users,
  Camera,
  Calendar,
  Settings2
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast, useDemoData } from '../App';
import { Professional, Service, BusinessInfo } from '../types';
import { PhoneInput, ConfirmationModal } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
    'monday': 'Segunda-feira',
    'tuesday': 'Terça-feira',
    'wednesday': 'Quarta-feira',
    'thursday': 'Quinta-feira',
    'friday': 'Sexta-feira',
    'saturday': 'Sábado',
    'sunday': 'Domingo'
};

const ProfessionalsPage: React.FC = () => {
    const { isDemo, demoData, setDemoData } = useDemoData();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState<'perfil' | 'horario'>('perfil');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
    const [formData, setFormData] = useState({ 
        name: '', 
        whatsapp_phone: '', 
        avatar_url: '',
        service_ids: [] as string[],
        work_hours: {} as any
    });
    const { addToast } = useToast();

    const fetchProfessionals = useCallback(async () => {
        setLoading(true);
        
        if (isDemo) {
            setProfessionals(demoData.professionals);
            setLoading(false);
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('professionals')
            .select('*')
            .eq('business_id', user.id)
            .order('name', { ascending: true });

        if (error) {
            addToast('Erro ao carregar profissionais.', 'error');
        } else {
            setProfessionals(data || []);
        }
        setLoading(false);
    }, [addToast, isDemo, demoData.professionals]);

    const fetchServices = useCallback(async () => {
        if (isDemo) {
            setServices(demoData.services);
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('services')
            .select('*')
            .eq('business_id', user.id);
        
        if (data) setServices(data);
    }, [isDemo, demoData.services]);

    const fetchBusinessInfo = useCallback(async () => {
        if (isDemo) {
            setBusinessInfo(demoData.business);
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', user.id)
            .single();
        
        if (data) setBusinessInfo(data);
    }, [isDemo, demoData.business]);

    useEffect(() => {
        fetchProfessionals();
        fetchServices();
        fetchBusinessInfo();
    }, [fetchProfessionals, fetchServices, fetchBusinessInfo]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            addToast('O nome do profissional é obrigatório.', 'error');
            return;
        }

        setSaving(true);

        try {
            // --- VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS ---
            if (!formData.name.trim()) {
                addToast('O nome do profissional é obrigatório.', 'error');
                setSaving(false);
                return;
            }

            if (!formData.whatsapp_phone.trim() || formData.whatsapp_phone.length < 10) {
                addToast('Insira um número de WhatsApp válido.', 'error');
                setSaving(false);
                return;
            }

            if (!formData.service_ids || formData.service_ids.length === 0) {
                addToast('Selecione pelo menos um serviço que este profissional realiza.', 'error');
                setSaving(false);
                return;
            }

            // Verifica se há pelo menos um dia com horário configurado
            const hasWorkHours = Object.values(formData.work_hours).some((day: any) => day && day.length > 0);
            if (!hasWorkHours) {
                addToast('Configure o horário de atendimento na aba "Horários".', 'error');
                setModalTab('horario'); // Alterna para a aba de horários para facilitar
                setSaving(false);
                return;
            }

            if (isDemo) {
                const professionalData: Professional = {
                    id: selectedProfessional?.id || `p${Date.now()}`,
                    name: formData.name.trim(),
                    whatsapp_phone: formData.whatsapp_phone.trim(),
                    avatar_url: formData.avatar_url,
                    service_ids: formData.service_ids,
                    business_id: demoData.business.id,
                    work_hours: formData.work_hours,
                    created_at: selectedProfessional?.created_at || new Date().toISOString()
                };

                if (selectedProfessional) {
                    setDemoData(prev => ({
                        ...prev,
                        professionals: prev.professionals.map(p => p.id === selectedProfessional.id ? professionalData : p)
                    }));
                    addToast('Profissional atualizado (Modo Demo)!', 'success');
                } else {
                    setDemoData(prev => ({
                        ...prev,
                        professionals: [...prev.professionals, professionalData]
                    }));
                    addToast('Profissional cadastrado (Modo Demo)!', 'success');
                }
                setIsModalOpen(false);
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            console.log('Verificando usuário logado:', user);
            
            if (!user) {
                addToast('Sessão expirada. Faça login novamente.', 'error');
                return;
            }

            // Ensure business record exists first
            const cleanUserId = String(user.id).trim();
            console.log('Clean User ID para salvamento:', cleanUserId);
            
            // SECURITY: Double check if user is not using a known wildcard or invalid string
            if (!cleanUserId || cleanUserId === '*' || cleanUserId === 'undefined' || cleanUserId === 'null') {
                console.error('ALERTA: ID de usuário inválido detectado no salvamento:', cleanUserId);
                addToast('Sessão inválida. Por favor, saia e entre novamente no sistema.', 'error');
                setSaving(false);
                return;
            }

            // Data sanitization
            const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
            
            const validServiceIds = (formData.service_ids || []).filter(id => 
                id && typeof id === 'string' && (isDemo ? id.length > 0 : isUuid(id))
            );

            if (validServiceIds.length === 0) {
                addToast('Selecione pelo menos um serviço válido cadastrado por você.', 'error');
                setSaving(false);
                return;
            }

            const { data: businessCheck } = await supabase
                .from('businesses')
                .select('id')
                .eq('id', cleanUserId)
                .maybeSingle();
            
            if (!businessCheck) {
                // Create a basic business record if it doesn't exist to prevent orphaned relation errors
                const { error: bizError } = await supabase.from('businesses').insert([{
                    id: cleanUserId,
                    business_name: 'Minha Barbearia',
                    full_name: user.user_metadata?.full_name || 'Membro da Equipe', 
                    slug: `barbearia-${Math.random().toString(36).slice(2, 7)}`,
                    whatsapp_phone: '',
                    work_hours: {}
                }]);
                if (bizError) {
                    console.error('Error creating business profile:', bizError);
                    addToast('Erro ao inicializar dados do negócio. Verifique sua conexão.', 'error');
                    setSaving(false);
                    return;
                }
            }

            const professionalData = {
                name: formData.name.trim(),
                whatsapp_phone: formData.whatsapp_phone.trim(),
                avatar_url: formData.avatar_url,
                service_ids: validServiceIds,
                business_id: cleanUserId,
                work_hours: formData.work_hours
            };

            // Fix for "invalid input syntax for type uuid" error
            // If the ID is short (like "p1") or numeric, it's demo data. 
            // In a real session, we MUST force an insert for such items.
            const isRealUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

            if (selectedProfessional && isRealUuid(selectedProfessional.id)) {
                console.log('Atualizando profissional real:', selectedProfessional.id);
                const { error } = await supabase
                    .from('professionals')
                    .update(professionalData)
                    .eq('id', selectedProfessional.id);

                if (error) {
                    console.error('Error updating professional:', error);
                    addToast(`Erro ao atualizar: ${error.message}`, 'error');
                } else {
                    addToast('Profissional atualizado com sucesso!', 'success');
                    setIsModalOpen(false);
                    fetchProfessionals();
                }
            } else {
                console.log('Inserindo novo profissional (ou convertendo demo para real)');
                const { error } = await supabase
                    .from('professionals')
                    .insert([professionalData]);

                if (error) {
                    console.error('Error inserting professional:', error);
                    addToast(`Erro ao cadastrar: ${error.message}`, 'error');
                } else {
                    addToast('Profissional cadastrado com sucesso!', 'success');
                    setIsModalOpen(false);
                    fetchProfessionals();

                    // Check for completion
                    const { count: profCount } = await supabase
                        .from('professionals')
                        .select('id', { count: 'exact', head: true })
                        .eq('business_id', cleanUserId);

                    if (profCount === 1) {
                         addToast('Parabéns! Cadastro completo. Sua agenda agora está disponível para os clientes.', 'success', true);
                    }
                    
                    window.dispatchEvent(new CustomEvent('businessInfoUpdated'));
                }
            }
        } catch (error: any) {
            console.error('Unexpected error:', error);
            addToast('Ocorreu um erro inesperado ao salvar.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 800 * 1024) { // 800KB limit
                addToast('A imagem deve ter menos de 800KB', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, avatar_url: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDelete = async () => {
        if (!selectedProfessional) return;

        if (isDemo) {
            setDemoData(prev => ({
                ...prev,
                professionals: prev.professionals.filter(p => p.id !== selectedProfessional.id)
            }));
            addToast('Profissional excluído (Modo Demo)!', 'success');
            setIsDeleteModalOpen(false);
            return;
        }

        const { error } = await supabase
            .from('professionals')
            .delete()
            .eq('id', selectedProfessional.id);

        if (error) addToast('Erro ao excluir profissional.', 'error');
        else {
            addToast('Profissional excluído com sucesso!', 'success');
            setIsDeleteModalOpen(false);
            fetchProfessionals();
        }
    };

    const toggleService = (id: string) => {
        setFormData(prev => {
            const ids = prev.service_ids.includes(id)
                ? prev.service_ids.filter(sid => sid !== id)
                : [...prev.service_ids, id];
            return { ...prev, service_ids: ids };
        });
    };

    const openModal = (prof: Professional | null = null) => {
        setSelectedProfessional(prof);
        setModalTab('perfil');
        if (prof) {
            setFormData({ 
                name: prof.name, 
                whatsapp_phone: prof.whatsapp_phone || '', 
                avatar_url: prof.avatar_url || '',
                service_ids: prof.service_ids || [],
                work_hours: prof.work_hours || {}
            });
        } else {
            // Default to business hours
            setFormData({ 
                name: '', 
                whatsapp_phone: '', 
                avatar_url: '', 
                service_ids: [],
                work_hours: businessInfo?.work_hours || {}
            });
        }
        setIsModalOpen(true);
    };

    const toggleDay = (day: string) => {
        setFormData(prev => {
            const currentHours = prev.work_hours[day];
            const newHours = currentHours ? null : (businessInfo?.work_hours[day] || [{ start: '09:00', end: '18:00' }]);
            return {
                ...prev,
                work_hours: { ...prev.work_hours, [day]: newHours }
            };
        });
    };

    const addInterval = (day: string) => {
        setFormData(prev => {
            const current = prev.work_hours[day] || [];
            return {
                ...prev,
                work_hours: { 
                    ...prev.work_hours, 
                    [day]: [...current, { start: '12:00', end: '13:00' }] 
                }
            };
        });
    };

    const removeInterval = (day: string, index: number) => {
        setFormData(prev => {
            const current = [...(prev.work_hours[day] || [])];
            current.splice(index, 1);
            return {
                ...prev,
                work_hours: { ...prev.work_hours, [day]: current.length > 0 ? current : null }
            };
        });
    };

    const updateInterval = (day: string, index: number, field: 'start' | 'end', value: string) => {
        setFormData(prev => {
            const current = [...(prev.work_hours[day] || [])];
            current[index] = { ...current[index], [field]: value };
            return {
                ...prev,
                work_hours: { ...prev.work_hours, [day]: current }
            };
        });
    };

    const stats = useMemo(() => ({
        total: professionals.length,
        active: professionals.length, // Simulado
        specialties: services.length
    }), [professionals, services]);

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-10 animate-fade-in mb-20">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Gerencie os especialistas e seus horários de atendimento.
                    </p>
                </div>
                <button 
                    onClick={() => openModal()}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-2xl font-bold text-sm hover:opacity-90 transition-all active:scale-95 shadow-xl w-full sm:w-auto"
                >
                    <Plus className="w-5 h-5" />
                    Adicionar Profissional
                </button>
            </div>

            {/* Lista de Profissionais Simples e Compacta */}
            <div className="space-y-3">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Sincronizando equipe...</p>
                    </div>
                ) : professionals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-white dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <Briefcase className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Nenhum profissional cadastrado</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs max-w-xs">Adicione profissionais para completar sua equipe.</p>
                    </div>
                ) : (
                    professionals.map((prof) => (
                        <motion.div 
                            layout
                            key={prof.id} 
                            className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-lg shadow-inner overflow-hidden shrink-0">
                                    {prof.avatar_url ? (
                                        <img 
                                            src={prof.avatar_url} 
                                            alt={prof.name} 
                                            className="w-full h-full object-cover" 
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        prof.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">{prof.name}</h4>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {prof.service_ids && prof.service_ids.length > 0 ? (
                                            prof.service_ids.slice(0, 2).map(sid => {
                                                const service = services.find(s => s.id === sid);
                                                return service ? (
                                                    <span key={sid} className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-500 text-[9px] font-bold rounded-md border border-slate-100 dark:border-slate-700">
                                                        {service.name}
                                                    </span>
                                                ) : null;
                                            })
                                        ) : (
                                            <span className="text-[10px] text-slate-400 italic">Sem serviços</span>
                                        )}
                                        {prof.service_ids && prof.service_ids.length > 2 && (
                                            <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-400 text-[9px] font-bold rounded-md border border-slate-100 dark:border-slate-700">
                                                +{prof.service_ids.length - 2}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-50 dark:border-slate-800">
                                <div className="text-right flex flex-col items-end gap-1">
                                    <a 
                                        href={`https://wa.me/${prof.whatsapp_phone?.replace(/\D/g, '')}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold hover:underline"
                                    >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        WhatsApp
                                    </a>
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                        <Clock className="w-3 h-3" />
                                        Comercial
                                    </div>
                                </div>
                                
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => openModal(prof)} 
                                        className="p-2.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                                        title="Editar"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => { setSelectedProfessional(prof); setIsDeleteModalOpen(true); }} 
                                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                        title="Excluir"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Modal de Cadastro/Edição Premium */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 z-[100] flex justify-center items-end sm:items-center p-0 sm:p-4 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 100 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 100 }}
                            className="bg-white dark:bg-slate-900 rounded-t-[24px] sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
                        >
                            <div className="px-5 py-4 sm:px-8 sm:py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                                <h3 className="text-base sm:text-xl font-serif font-bold text-slate-900 dark:text-slate-100">
                                    {selectedProfessional ? 'Editar Perfil' : 'Novo Profissional'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Tabs Navigation */}
                            <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 sm:px-8">
                                <button 
                                    type="button"
                                    onClick={() => setModalTab('perfil')}
                                    className={`py-3 sm:py-4 px-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
                                        modalTab === 'perfil' 
                                            ? 'border-gold-500 text-gold-600' 
                                            : 'border-transparent text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    Perfil
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setModalTab('horario')}
                                    className={`py-3 sm:py-4 px-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
                                        modalTab === 'horario' 
                                            ? 'border-gold-500 text-gold-600' 
                                            : 'border-transparent text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    Horário
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
                                <div className="p-5 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto flex-1">
                                    {modalTab === 'perfil' ? (
                                        <>
                                            <div className="space-y-8">
                                                {/* Avatar Upload */}
                                                <div className="flex flex-col items-center gap-4">
                                                    <input 
                                                        type="file" 
                                                        ref={fileInputRef} 
                                                        onChange={handleFileChange} 
                                                        accept="image/*" 
                                                        className="hidden" 
                                                    />
                                                    <div 
                                                        className="relative group cursor-pointer"
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden transition-all group-hover:border-gold-500/50">
                                                            {formData.avatar_url ? (
                                                                <img 
                                                                    src={formData.avatar_url} 
                                                                    alt="Preview" 
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : formData.name ? (
                                                                <span className="text-3xl font-black text-slate-300 dark:text-slate-600">
                                                                    {formData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                                </span>
                                                            ) : (
                                                                <User className="w-8 h-8 text-slate-300" />
                                                            )}
                                                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                <Camera className="w-6 h-6 text-white" />
                                                            </div>
                                                        </div>
                                                        <div className="absolute -bottom-2 -right-2 bg-gold-500 text-white p-2 rounded-xl shadow-lg border-2 border-white dark:border-slate-900">
                                                            <Plus className="w-3 h-3" />
                                                        </div>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Foto do Profissional</p>
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="space-y-4">
                                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome Completo</label>
                                                        <input 
                                                            type="text" 
                                                            required
                                                            value={formData.name}
                                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all dark:text-white"
                                                            placeholder="Ex: Carlos Oliveira"
                                                        />
                                                    </div>
                                                    <div className="space-y-4">
                                                        <PhoneInput 
                                                            label="WhatsApp de Contato"
                                                            value={formData.whatsapp_phone}
                                                            onChange={(val) => setFormData({ ...formData, whatsapp_phone: val })}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Especialidades (Serviços)</label>
                                                    <div className="grid grid-cols-1 gap-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                                                        {services.map(service => (
                                                            <button
                                                                key={service.id}
                                                                type="button"
                                                                onClick={() => toggleService(service.id)}
                                                                className={`flex items-center justify-between p-3.5 rounded-xl text-sm transition-all ${
                                                                    formData.service_ids.includes(service.id)
                                                                        ? 'bg-gold-500 text-slate-900 font-bold shadow-lg'
                                                                        : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                                                                }`}
                                                            >
                                                                <span>{service.name}</span>
                                                                {formData.service_ids.includes(service.id) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4 opacity-30" />}
                                                            </button>
                                                        ))}
                                                        {services.length === 0 && <p className="text-xs text-slate-400 p-2 italic text-center">Nenhum serviço cadastrado.</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-6">
                                            {(!businessInfo?.work_hours || Object.keys(businessInfo.work_hours).length === 0) ? (
                                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-4">
                                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                                                        <Calendar className="w-6 h-6 text-slate-300" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 italic">Horários do Negócio não definidos</h4>
                                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-relaxed">
                                                            Você precisa configurar os dias e horários de funcionamento do seu negócio em <b>Configurações</b> antes de definir os horários dos profissionais.
                                                        </p>
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        onClick={() => window.location.hash = 'settings'}
                                                        className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg"
                                                    >
                                                        Configurar Agora
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
                                                        <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                                                        <p className="text-[10px] font-medium text-amber-800 dark:text-amber-400 leading-relaxed uppercase tracking-wider">
                                                            Dias disponíveis baseados no funcionamento do negócio definido em Configurações.
                                                        </p>
                                                    </div>

                                                    <div className="space-y-4">
                                                        {DAYS_OF_WEEK.map(day => {
                                                            const isBusinessDayActive = businessInfo?.work_hours?.[day] != null;
                                                            const isProfessionalDayActive = formData.work_hours?.[day] != null;
                                                            
                                                            if (!isBusinessDayActive) return null;

                                                            return (
                                                                <div key={day} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`p-2 rounded-lg ${isProfessionalDayActive ? 'bg-gold-100 text-gold-600' : 'bg-slate-200 text-slate-400'}`}>
                                                                                <Clock className="w-4 h-4" />
                                                                            </div>
                                                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{DAY_LABELS[day]}</span>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleDay(day)}
                                                                            className={`w-12 h-6 rounded-full transition-all relative ${isProfessionalDayActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                                                        >
                                                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isProfessionalDayActive ? 'left-7' : 'left-1'}`} />
                                                                        </button>
                                                                    </div>

                                                                    {isProfessionalDayActive && (
                                                                        <div className="space-y-3 pt-2">
                                                                            {(formData.work_hours[day] || []).map((interval: any, idx: number) => (
                                                                                <div key={idx} className="flex items-center gap-2">
                                                                                    <input 
                                                                                        type="time" 
                                                                                        value={interval.start}
                                                                                        onChange={(e) => updateInterval(day, idx, 'start', e.target.value)}
                                                                                        className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono dark:text-white"
                                                                                    />
                                                                                    <span className="text-slate-300">às</span>
                                                                                    <input 
                                                                                        type="time" 
                                                                                        value={interval.end}
                                                                                        onChange={(e) => updateInterval(day, idx, 'end', e.target.value)}
                                                                                        className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono dark:text-white"
                                                                                    />
                                                                                    <button 
                                                                                        type="button" 
                                                                                        onClick={() => removeInterval(day, idx)}
                                                                                        className="p-2 text-slate-400 hover:text-red-500"
                                                                                    >
                                                                                        <Trash2 className="w-4 h-4" />
                                                                                    </button>
                                                                                </div>
                                                                            ))}
                                                                            <button 
                                                                                type="button"
                                                                                onClick={() => addInterval(day)}
                                                                                className="w-full py-2 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 text-[10px] font-bold uppercase rounded-xl hover:border-gold-500 hover:text-gold-600 transition-all flex items-center justify-center gap-1"
                                                                            >
                                                                                <Plus className="w-3 h-3" />
                                                                                Adicionar Intervalo
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex gap-4 shrink-0 bg-white dark:bg-slate-900 z-10">
                                    <button 
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-4 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 py-4 text-sm font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Salvando...
                                            </>
                                        ) : (
                                            selectedProfessional ? 'Salvar Alterações' : 'Cadastrar Profissional'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Excluir Profissional"
                message="Tem certeza que deseja remover este profissional da equipe? Isso não afetará agendamentos passados."
            />
        </div>
    );
};

export default ProfessionalsPage;

