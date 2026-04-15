
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Users
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast, useDemoData } from '../App';
import { Professional, Service } from '../types';
import { PhoneInput, ConfirmationModal, StatCard } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

const ProfessionalsPage: React.FC = () => {
    const { isDemo, demoData, setDemoData } = useDemoData();
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
    const [formData, setFormData] = useState({ 
        name: '', 
        whatsapp_phone: '', 
        avatar_url: '',
        service_ids: [] as string[] 
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

    useEffect(() => {
        fetchProfessionals();
        fetchServices();
    }, [fetchProfessionals, fetchServices]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isDemo) {
            const professionalData: Professional = {
                id: selectedProfessional?.id || `p${Date.now()}`,
                name: formData.name,
                whatsapp_phone: formData.whatsapp_phone,
                avatar_url: formData.avatar_url,
                service_ids: formData.service_ids,
                business_id: demoData.business.id,
                work_hours: selectedProfessional?.work_hours || demoData.business.work_hours
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
        if (!user) return;

        const professionalData = {
            name: formData.name,
            whatsapp_phone: formData.whatsapp_phone,
            avatar_url: formData.avatar_url,
            service_ids: formData.service_ids,
            business_id: user.id,
            work_hours: {} // Default empty work hours for now
        };

        if (selectedProfessional) {
            const { error } = await supabase
                .from('professionals')
                .update(professionalData)
                .eq('id', selectedProfessional.id);

            if (error) addToast('Erro ao atualizar profissional.', 'error');
            else {
                addToast('Profissional atualizado com sucesso!', 'success');
                setIsModalOpen(false);
                fetchProfessionals();
            }
        } else {
            const { error } = await supabase
                .from('professionals')
                .insert([professionalData]);

            if (error) addToast('Erro ao cadastrar profissional.', 'error');
            else {
                addToast('Profissional cadastrado com sucesso!', 'success');
                setIsModalOpen(false);
                fetchProfessionals();
            }
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
        setFormData(prof ? { 
            name: prof.name, 
            whatsapp_phone: prof.whatsapp_phone || '', 
            avatar_url: prof.avatar_url || '',
            service_ids: prof.service_ids || [] 
        } : { name: '', whatsapp_phone: '', avatar_url: '', service_ids: [] });
        setIsModalOpen(true);
    };

    const stats = useMemo(() => ({
        total: professionals.length,
        active: professionals.length, // Simulado
        specialties: services.length
    }), [professionals, services]);

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-10 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard title="Total da Equipe" value={stats.total.toString()} icon={<Users className="w-5 h-5" />} color="gold" />
                <StatCard title="Ativos Hoje" value={stats.active.toString()} icon={<ShieldCheck className="w-5 h-5" />} color="emerald" />
                <StatCard title="Especialidades" value={stats.specialties.toString()} icon={<Award className="w-5 h-5" />} color="blue" />
            </div>

            {/* Grid de Profissionais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Sincronizando equipe...</p>
                    </div>
                ) : professionals.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center px-4">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                            <Briefcase className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Nenhum profissional cadastrado</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">Sua equipe ainda não foi montada. Adicione profissionais para começar a agendar.</p>
                    </div>
                ) : (
                    professionals.map((prof) => (
                        <motion.div 
                            layout
                            key={prof.id} 
                            className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all group relative"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-2xl shadow-inner overflow-hidden">
                                    {prof.avatar_url ? (
                                        <img 
                                            src={prof.avatar_url} 
                                            alt={prof.name} 
                                            className="w-full h-full object-cover" 
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        prof.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openModal(prof)} className="p-2.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => { setSelectedProfessional(prof); setIsDeleteModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">{prof.name}</h4>
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Disponível agora
                                </div>
                            </div>

                            <div className="mt-6 space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {prof.service_ids && prof.service_ids.length > 0 ? (
                                        prof.service_ids.slice(0, 3).map(sid => {
                                            const service = services.find(s => s.id === sid);
                                            return service ? (
                                                <span key={sid} className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-lg border border-slate-100 dark:border-slate-700">
                                                    {service.name}
                                                </span>
                                            ) : null;
                                        })
                                    ) : (
                                        <span className="text-[10px] text-slate-400 italic">Nenhum serviço vinculado</span>
                                    )}
                                    {prof.service_ids && prof.service_ids.length > 3 && (
                                        <span className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 text-slate-400 text-[10px] font-bold rounded-lg border border-slate-100 dark:border-slate-700">
                                            +{prof.service_ids.length - 3}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                                    <a 
                                        href={`https://wa.me/${prof.whatsapp_phone?.replace(/\D/g, '')}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:underline"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        WhatsApp
                                    </a>
                                    <div className="flex items-center gap-1 text-slate-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-medium">Horário comercial</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Modal de Cadastro/Edição Premium */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 z-[100] flex justify-center items-center p-4 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
                        >
                            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                                <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-slate-100">
                                    {selectedProfessional ? 'Editar Perfil' : 'Novo Profissional'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSave} className="p-8 space-y-8 overflow-y-auto">
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome do Profissional</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                                            placeholder="Ex: Carlos Oliveira"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">URL da Foto (Opcional)</label>
                                        <input 
                                            type="url" 
                                            value={formData.avatar_url}
                                            onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                                            className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                                            placeholder="https://exemplo.com/foto.jpg"
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
                                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                                        {services.map(service => (
                                            <button
                                                key={service.id}
                                                type="button"
                                                onClick={() => toggleService(service.id)}
                                                className={`flex items-center justify-between p-3 rounded-xl text-sm transition-all ${
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

                                <div className="pt-4 flex gap-4 shrink-0">
                                    <button 
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-3.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 py-3.5 text-sm font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                                    >
                                        {selectedProfessional ? 'Atualizar' : 'Cadastrar'}
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

