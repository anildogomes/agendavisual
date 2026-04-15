
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Ban, 
  Plus, 
  Trash2, 
  Loader2,
  X,
  Calendar as CalendarIcon,
  Clock,
  User,
  AlertCircle,
  TrendingUp,
  CalendarDays,
  ChevronRight,
  History,
  Edit
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast, useDemoData } from '../App';
import { ScheduleBlock, Professional } from '../types';
import { ConfirmationModal } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

const ScheduleBlocksPage: React.FC = () => {
    const { isDemo, demoData, setDemoData } = useDemoData();
    const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedBlock, setSelectedBlock] = useState<ScheduleBlock | null>(null);
    const [formData, setFormData] = useState({ 
        professional_id: '', 
        date: new Date().toISOString().split('T')[0],
        start_time: '08:00',
        end_time: '18:00',
        reason: ''
    });
    const { addToast } = useToast();

    const fetchBlocks = useCallback(async () => {
        setLoading(true);

        if (isDemo) {
            setBlocks(demoData.appointments.filter(a => a.status === 'cancelled').map(a => ({
                id: a.id,
                business_id: a.business_id,
                professional_id: a.professional_id,
                date: a.date,
                start_time: a.time,
                end_time: a.time, // Simplified for demo
                reason: 'Cancelado'
            })) as any); // Demo doesn't have explicit blocks in mockData yet, using cancelled apps as placeholder
            setLoading(false);
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('schedule_blocks')
            .select('*')
            .eq('business_id', user.id)
            .order('date', { ascending: false });

        if (error) {
            addToast('Erro ao carregar bloqueios.', 'error');
        } else {
            setBlocks(data || []);
        }
        setLoading(false);
    }, [addToast, isDemo, demoData.appointments]);

    const fetchProfessionals = useCallback(async () => {
        if (isDemo) {
            setProfessionals(demoData.professionals);
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('professionals')
            .select('*')
            .eq('business_id', user.id);
        
        if (data) setProfessionals(data);
    }, [isDemo, demoData.professionals]);

    useEffect(() => {
        fetchBlocks();
        fetchProfessionals();
    }, [fetchBlocks, fetchProfessionals]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isDemo) {
            const blockData = {
                id: selectedBlock?.id || `b${Date.now()}`,
                ...formData,
                business_id: demoData.business.id
            };

            if (selectedBlock) {
                setDemoData(prev => ({
                    ...prev,
                    appointments: prev.appointments.map(a => a.id === selectedBlock.id ? blockData as any : a)
                }));
                addToast('Bloqueio atualizado (Modo Demo)!', 'success');
            } else {
                setDemoData(prev => ({
                    ...prev,
                    appointments: [...prev.appointments, blockData as any]
                }));
                addToast('Bloqueio criado (Modo Demo)!', 'success');
            }
            setIsModalOpen(false);
            fetchBlocks();
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const blockData = {
            ...formData,
            business_id: user.id
        };

        if (selectedBlock) {
            const { error } = await supabase
                .from('schedule_blocks')
                .update(blockData)
                .eq('id', selectedBlock.id);

            if (error) addToast('Erro ao atualizar bloqueio.', 'error');
            else {
                addToast('Bloqueio atualizado com sucesso!', 'success');
                setIsModalOpen(false);
                fetchBlocks();
            }
        } else {
            const { error } = await supabase
                .from('schedule_blocks')
                .insert([blockData]);

            if (error) addToast('Erro ao criar bloqueio.', 'error');
            else {
                addToast('Bloqueio criado com sucesso!', 'success');
                setIsModalOpen(false);
                fetchBlocks();
            }
        }
    };

    const handleDelete = async () => {
        if (!selectedBlock) return;

        if (isDemo) {
            addToast('Bloqueios não podem ser excluídos no Modo Demo.', 'info');
            setIsDeleteModalOpen(false);
            return;
        }

        const { error } = await supabase
            .from('schedule_blocks')
            .delete()
            .eq('id', selectedBlock.id);

        if (error) addToast('Erro ao excluir bloqueio.', 'error');
        else {
            addToast('Bloqueio excluído com sucesso!', 'success');
            setIsDeleteModalOpen(false);
            fetchBlocks();
        }
    };

    const openModal = (block: ScheduleBlock | null = null) => {
        setSelectedBlock(block);
        if (block) {
            setFormData({
                professional_id: block.professional_id,
                date: block.date,
                start_time: block.start_time,
                end_time: block.end_time,
                reason: block.reason || ''
            });
        } else {
            setFormData({
                professional_id: '',
                date: new Date().toISOString().split('T')[0],
                start_time: '08:00',
                end_time: '18:00',
                reason: ''
            });
        }
        setIsModalOpen(true);
    };

    const stats = useMemo(() => ({
        total: blocks.length,
        upcoming: blocks.filter(b => new Date(b.date) >= new Date()).length,
        history: blocks.filter(b => new Date(b.date) < new Date()).length
    }), [blocks]);

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-10 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Bloqueios de Agenda</h2>
                    <p className="text-sm text-slate-500">Gerencie períodos de indisponibilidade dos profissionais.</p>
                </div>
                <button 
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                >
                    <Plus className="w-5 h-5" />
                    Novo Bloqueio
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard title="Total de Bloqueios" value={stats.total.toString()} icon={<Ban className="w-5 h-5" />} color="gold" />
                <StatCard title="Próximos Bloqueios" value={stats.upcoming.toString()} icon={<CalendarDays className="w-5 h-5" />} color="emerald" />
                <StatCard title="Histórico" value={stats.history.toString()} icon={<History className="w-5 h-5" />} color="blue" />
            </div>

            {/* Lista de Bloqueios */}
            <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Sincronizando disponibilidade...</p>
                    </div>
                ) : blocks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                            <Ban className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Sem bloqueios ativos</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">Use bloqueios para folgas, feriados ou intervalos da equipe.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data e Horário</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profissional</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Motivo</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {blocks.map((block) => {
                                    const prof = professionals.find(p => p.id === block.professional_id);
                                    const isPast = new Date(block.date) < new Date();
                                    return (
                                        <motion.tr 
                                            layout
                                            key={block.id} 
                                            className={`group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${isPast ? 'opacity-50' : ''}`}
                                        >
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                                                        <CalendarIcon className="w-4 h-4 text-slate-400" />
                                                        {new Date(block.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                                                        <Clock className="w-3 h-3" />
                                                        {block.start_time} às {block.end_time}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 text-xs font-bold">
                                                        {prof?.name.charAt(0).toUpperCase() || 'T'}
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        {prof?.name || 'Toda a Equipe'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-lg border border-amber-100 dark:border-amber-800/50">
                                                        {block.reason || 'Indisponibilidade'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => openModal(block)}
                                                        className="p-2.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all"
                                                        title="Editar"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => { setSelectedBlock(block); setIsDeleteModalOpen(true); }} 
                                                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de Cadastro Premium */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 z-[100] flex justify-center items-center p-4 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-slate-100">
                                    {selectedBlock ? 'Editar Bloqueio' : 'Novo Bloqueio'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSave} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Profissional</label>
                                    <select 
                                        required
                                        value={formData.professional_id}
                                        onChange={(e) => setFormData({ ...formData, professional_id: e.target.value })}
                                        className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all appearance-none"
                                    >
                                        <option value="">Selecione um profissional</option>
                                        <option value="all">Toda a Equipe</option>
                                        {professionals.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Data do Bloqueio</label>
                                    <input 
                                        type="date" 
                                        required
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Início</label>
                                        <input 
                                            type="time" 
                                            required
                                            value={formData.start_time}
                                            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                            className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fim</label>
                                        <input 
                                            type="time" 
                                            required
                                            value={formData.end_time}
                                            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                            className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Motivo (Opcional)</label>
                                    <input 
                                        type="text" 
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                                        placeholder="Ex: Feriado, Almoço, Folga..."
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
                                        {selectedBlock ? 'Atualizar' : 'Criar Bloqueio'}
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
                title="Excluir Bloqueio"
                message="Tem certeza que deseja remover este bloqueio? Isso liberará o horário para novos agendamentos imediatamente."
            />
        </div>
    );
};

const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode, color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400`}>
            {icon}
        </div>
        <div className="space-y-0.5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{value}</h4>
        </div>
    </div>
);

export default ScheduleBlocksPage;

