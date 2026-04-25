
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Scissors, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  X,
  Clock,
  DollarSign,
  Tag,
  Info,
  ChevronRight,
  TrendingUp,
  Briefcase
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast, useDemoData } from '../App';
import { Service } from '../types';
import { ConfirmationModal } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

const ServicesPage: React.FC = () => {
    const { isDemo, demoData, setDemoData } = useDemoData();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [formData, setFormData] = useState({ name: '', price: '', duration: '30', description: '' });
    const { addToast } = useToast();

    const fetchServices = useCallback(async () => {
        setLoading(true);

        if (isDemo) {
            setServices(demoData.services);
            setLoading(false);
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('services')
            .select('*')
            .eq('business_id', user.id)
            .order('name', { ascending: true });

        if (error) {
            addToast('Erro ao carregar serviços.', 'error');
        } else {
            setServices(data || []);
        }
        setLoading(false);
    }, [addToast, isDemo, demoData.services]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // --- VALIDATION ---
        if (!formData.name.trim()) {
            addToast('O nome do serviço é obrigatório.', 'error');
            return;
        }
        if (!formData.price || parseFloat(formData.price) <= 0) {
            addToast('O preço deve ser maior que zero.', 'error');
            return;
        }
        if (!formData.duration || parseInt(formData.duration) <= 0) {
            addToast('A duração deve ser maior que zero.', 'error');
            return;
        }

        if (isDemo) {
            const serviceData: Service = {
                id: selectedService?.id || `s${Date.now()}`,
                name: formData.name,
                price: parseFloat(formData.price),
                duration: parseInt(formData.duration),
                description: formData.description,
                business_id: demoData.business.id
            };

            if (selectedService) {
                setDemoData(prev => ({
                    ...prev,
                    services: prev.services.map(s => s.id === selectedService.id ? serviceData : s)
                }));
                addToast('Serviço atualizado (Modo Demo)!', 'success');
            } else {
                setDemoData(prev => ({
                    ...prev,
                    services: [...prev.services, serviceData]
                }));
                addToast('Serviço cadastrado (Modo Demo)!', 'success');
            }
            setIsModalOpen(false);
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const serviceData = {
            name: formData.name,
            price: parseFloat(formData.price),
            duration: parseInt(formData.duration),
            description: formData.description,
            business_id: user.id
        };

        if (selectedService) {
            const { error } = await supabase
                .from('services')
                .update(serviceData)
                .eq('id', selectedService.id);

            if (error) addToast('Erro ao atualizar serviço.', 'error');
            else {
                addToast('Serviço atualizado com sucesso!', 'success');
                setIsModalOpen(false);
                fetchServices();
            }
        } else {
            const { error } = await supabase
                .from('services')
                .insert([serviceData]);

            if (error) addToast('Erro ao cadastrar serviço.', 'error');
            else {
                addToast('Serviço cadastrado com sucesso!', 'success');
                setIsModalOpen(false);
                fetchServices();
                window.dispatchEvent(new CustomEvent('businessInfoUpdated'));
            }
        }
    };

    const handleDelete = async () => {
        if (!selectedService) return;

        if (isDemo) {
            setDemoData(prev => ({
                ...prev,
                services: prev.services.filter(s => s.id !== selectedService.id)
            }));
            addToast('Serviço excluído (Modo Demo)!', 'success');
            setIsDeleteModalOpen(false);
            return;
        }

        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', selectedService.id);

        if (error) addToast('Erro ao excluir serviço.', 'error');
        else {
            addToast('Serviço excluído com sucesso!', 'success');
            setIsDeleteModalOpen(false);
            fetchServices();
        }
    };

    const openModal = (service: Service | null = null) => {
        setSelectedService(service);
        setFormData(service ? { 
            name: service.name, 
            price: service.price.toString(), 
            duration: service.duration.toString(),
            description: service.description || ''
        } : { name: '', price: '', duration: '30', description: '' });
        setIsModalOpen(true);
    };

    const stats = useMemo(() => ({
        total: services.length,
        avgPrice: services.length > 0 ? services.reduce((acc, s) => acc + s.price, 0) / services.length : 0,
        mostPopular: services[0]?.name || 'N/A'
    }), [services]);

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-10 animate-fade-in mb-20">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Gerencie os serviços oferecidos, preços e durações.
                    </p>
                </div>
                <button 
                    onClick={() => openModal()}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-2xl font-bold text-sm hover:opacity-90 transition-all active:scale-95 shadow-xl w-full sm:w-auto"
                >
                    <Plus className="w-5 h-5" />
                    Novo Serviço
                </button>
            </div>

            {/* Lista de Serviços Simples e Compacta */}
            <div className="space-y-3">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Carregando catálogo...</p>
                    </div>
                ) : services.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-white dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <Scissors className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Nenhum serviço cadastrado</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs max-w-xs">Adicione serviços para começar a receber agendamentos.</p>
                    </div>
                ) : (
                    services.map((service) => (
                        <motion.div 
                            layout
                            key={service.id} 
                            className="bg-white dark:bg-slate-900 px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 transition-all group"
                        >
                            <div className="flex flex-col gap-2">
                                {/* Top Line: Name and Price Badge */}
                                <div className="flex items-start justify-between gap-4">
                                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate tracking-tight">
                                        {service.name}
                                    </h4>
                                    <span className="shrink-0 px-2.5 py-1.5 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 text-xs font-black rounded-lg leading-none">
                                        R$ {service.price.toFixed(2)}
                                    </span>
                                </div>
                                
                                {/* Bottom Line: Description and Duration/Actions */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-50 dark:border-slate-800/50 pt-2 mt-1">
                                    <div className="flex-1 min-w-0">
                                        {service.description && (
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed">
                                                {service.description}
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-6 shrink-0 justify-end">
                                        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{service.duration}m</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-0.5">
                                            <button 
                                                onClick={() => openModal(service)} 
                                                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                                                title="Editar"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => { setSelectedService(service); setIsDeleteModalOpen(true); }} 
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-slate-950/60 z-[100] flex justify-center items-end sm:items-center p-0 sm:p-4 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 100 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 100 }}
                            className="bg-white dark:bg-slate-900 rounded-t-[24px] sm:rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col"
                        >
                            <div className="px-5 py-4 sm:px-8 sm:py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
                                <h3 className="text-base sm:text-xl font-serif font-bold text-slate-900 dark:text-slate-100">
                                    {selectedService ? 'Editar Serviço' : 'Novo Serviço'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="overflow-y-auto no-scrollbar flex-1">
                                <form onSubmit={handleSave} className="p-5 sm:p-8 space-y-5 sm:space-y-8">
                                    <div className="space-y-5">
                                        <div className="space-y-2 sm:space-y-4">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Nome do Serviço</label>
                                            <input 
                                                type="text" 
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                                placeholder="Ex: Corte Moderno"
                                            />
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                            <div className="space-y-3 sm:space-y-4">
                                                <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Preço de Venda</label>
                                                <div className="relative">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                        <span className="text-xs font-bold text-slate-400">R$</span>
                                                    </div>
                                                    <input 
                                                        type="number" 
                                                        step="0.01"
                                                        required
                                                        value={formData.price}
                                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                        className="w-full p-3.5 pl-10 sm:p-4 sm:pl-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-3 sm:space-y-4">
                                                <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Duração (min)</label>
                                                <div className="relative">
                                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input 
                                                        type="number" 
                                                        required
                                                        value={formData.duration}
                                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                                        className="w-full p-3.5 pl-10 sm:p-4 sm:pl-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                                        placeholder="30"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 sm:space-y-4">
                                            <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Descrição</label>
                                            <textarea 
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all min-h-[100px] sm:min-h-[120px] resize-none dark:text-white"
                                                placeholder="Detalhes sobre o serviço..."
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
                                        <button 
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="w-full sm:flex-1 py-3.5 sm:py-4 text-xs sm:text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            type="submit"
                                            className="w-full sm:flex-1 py-3.5 sm:py-4 text-xs sm:text-sm font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                                        >
                                            {selectedService ? 'Salvar Alterações' : 'Criar Serviço'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Excluir Serviço"
                message="Tem certeza que deseja excluir este serviço? Isso não afetará agendamentos já realizados, mas impedirá novos."
            />
        </div>
    );
};

export default ServicesPage;

