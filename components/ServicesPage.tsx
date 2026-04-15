
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
import { ConfirmationModal, StatCard } from '../constants';
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
        <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-10 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard title="Total de Serviços" value={stats.total.toString()} icon={<Briefcase className="w-5 h-5" />} color="gold" />
                <StatCard title="Ticket Médio" value={`R$ ${stats.avgPrice.toFixed(2)}`} icon={<TrendingUp className="w-5 h-5" />} color="emerald" />
                <StatCard title="Destaque" value={stats.mostPopular} icon={<Scissors className="w-5 h-5" />} color="blue" />
            </div>

            {/* Grid de Serviços */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Carregando catálogo...</p>
                    </div>
                ) : services.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center px-4">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                            <Scissors className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Nenhum serviço cadastrado</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">Sua vitrine está vazia. Adicione serviços para começar a receber agendamentos.</p>
                    </div>
                ) : (
                    services.map((service) => (
                        <motion.div 
                            layout
                            key={service.id} 
                            className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all group relative"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-gold-500/10 flex items-center justify-center text-gold-600 dark:text-gold-400">
                                    <Scissors className="w-7 h-7" />
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openModal(service)} className="p-2.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => { setSelectedService(service); setIsDeleteModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">{service.name}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[32px]">
                                    {service.description || 'Sem descrição definida para este serviço.'}
                                </p>
                            </div>

                            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-50 dark:border-slate-800">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-xs font-bold">{service.duration} min</span>
                                </div>
                                <div className="text-lg font-serif font-bold text-slate-900 dark:text-slate-50">
                                    R$ {service.price.toFixed(2)}
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
                            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-slate-100">
                                    {selectedService ? 'Editar Serviço' : 'Novo Serviço'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSave} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome do Serviço</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                                        placeholder="Ex: Corte Moderno + Lavagem"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Preço (R$)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                required
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                className="w-full p-3.5 pl-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Duração (min)</label>
                                        <div className="relative">
                                            <Clock className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                                            <input 
                                                type="number" 
                                                required
                                                value={formData.duration}
                                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                                className="w-full p-3.5 pl-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                                                placeholder="30"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Descrição da Experiência</label>
                                    <textarea 
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all min-h-[100px] resize-none"
                                        placeholder="Descreva o que está incluso e o diferencial deste serviço..."
                                    />
                                </div>

                                <div className="pt-4 flex gap-4">
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
                                        {selectedService ? 'Atualizar' : 'Cadastrar'}
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
                title="Excluir Serviço"
                message="Tem certeza que deseja excluir este serviço? Isso não afetará agendamentos já realizados, mas impedirá novos."
            />
        </div>
    );
};

export default ServicesPage;

