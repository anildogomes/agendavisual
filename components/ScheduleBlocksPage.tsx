
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
  Edit,
  ChevronDown,
  Check
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast, useDemoData } from '../App';
import { ScheduleBlock, Professional, Appointment } from '../types';
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
        start_time: '12:00',
        end_time: '13:00',
        reason: '',
        is_full_day: false
    });
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [conflicts, setConflicts] = useState<Appointment[]>([]);
    const { addToast } = useToast();

    const fetchBlocks = useCallback(async () => {
        setLoading(true);

        if (isDemo) {
            setBlocks(demoData.blocks || []);
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
            setAppointments(demoData.appointments);
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profs } = await supabase
            .from('professionals')
            .select('*')
            .eq('business_id', user.id);
        
        if (profs) setProfessionals(profs);

        const { data: apps } = await supabase
            .from('appointments')
            .select('*, clients(*), services(*)')
            .eq('business_id', user.id)
            .in('status', ['reserved']);
        
        if (apps) setAppointments(apps);
    }, [isDemo, demoData.professionals, demoData.appointments]);

    useEffect(() => {
        // Detect conflicts whenever time selection changes
        const start = formData.is_full_day ? '00:00' : formData.start_time;
        const end = formData.is_full_day ? '23:59' : formData.end_time;
        
        const filtered = appointments.filter(app => {
            const isSameDate = app.date === formData.date;
            const isSameProf = formData.professional_id === 'all' || app.professional_id === formData.professional_id;
            const isWithinTime = app.time >= start && app.time <= end;
            return isSameDate && isSameProf && isWithinTime;
        });
        
        setConflicts(filtered);
    }, [formData, appointments]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // If is_full_day is checked, we interpret it as 00:00 to 23:59
        const finalData = {
            ...formData,
            start_time: formData.is_full_day ? '00:00' : formData.start_time,
            end_time: formData.is_full_day ? '23:59' : formData.end_time
        };
        // Remove is_full_day before sending to DB as it's a UI helper
        const { is_full_day, ...dbData } = finalData;

        if (isDemo) {
            const blockData: ScheduleBlock = {
                id: selectedBlock?.id || `b${Date.now()}`,
                ...dbData,
                business_id: demoData.business.id
            } as any;

            if (selectedBlock) {
                setDemoData(prev => ({
                    ...prev,
                    blocks: (prev.blocks || []).map(b => b.id === selectedBlock.id ? blockData : b)
                }));
                addToast('Bloqueio atualizado (Modo Demo)!', 'success');
            } else {
                setDemoData(prev => ({
                    ...prev,
                    blocks: [...(prev.blocks || []), blockData]
                }));
                addToast('Bloqueio criado (Modo Demo)!', 'success');
            }
            setIsModalOpen(false);
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const blockDataWithBiz = {
            ...dbData,
            business_id: user.id
        };

        if (selectedBlock) {
            const { error } = await supabase
                .from('schedule_blocks')
                .update(blockDataWithBiz)
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
                .insert([blockDataWithBiz]);

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
            setDemoData(prev => ({
                ...prev,
                blocks: (prev.blocks || []).filter(b => b.id !== selectedBlock.id)
            }));
            addToast('Bloqueio removido (Modo Demo)!', 'success');
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
                reason: block.reason || '',
                is_full_day: block.start_time === '00:00' && block.end_time === '23:59'
            });
        } else {
            setFormData({
                professional_id: '',
                date: new Date().toISOString().split('T')[0],
                start_time: '12:00',
                end_time: '13:00',
                reason: '',
                is_full_day: false
            });
        }
        setIsModalOpen(true);
    };

    const stats = useMemo(() => ({
        total: blocks.length,
        upcoming: blocks.filter(b => new Date(b.date) >= new Date()).length,
        history: blocks.filter(b => new Date(b.date) < new Date()).length
    }), [blocks]);

    const quickReasons = ["Almoço", "Folga", "Médico", "Reunião", "Pessoal", "Manutenção"];

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-10 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bloqueios de Horário</h1>
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

            {/* Lista de Bloqueios - Card-based on mobile, Table on desktop */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
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
                    <>
                        {/* Mobile List View */}
                        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                            {blocks.map((block) => {
                                const prof = professionals.find(p => p.id === block.professional_id);
                                const isPast = new Date(block.date) < new Date();
                                return (
                                    <div key={block.id} className={`p-5 space-y-4 ${isPast ? 'opacity-50' : ''}`}>
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                                                    <CalendarIcon className="w-4 h-4 text-slate-400" />
                                                    {new Date(block.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Clock className="w-4 h-4" />
                                                    {block.is_full_day ? 'Dia Inteiro' : `${block.start_time} às ${block.end_time}`}
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => openModal(block)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => { setSelectedBlock(block); setIsDeleteModalOpen(true); }} className="p-2 text-slate-400 hover:text-red-500 rounded-lg">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                                    {block.professional_id === 'all' ? 'T' : prof?.name?.charAt(0) || 'P'}
                                                </div>
                                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                    {block.professional_id === 'all' ? 'Toda a Equipe' : prof?.name || 'Profissional'}
                                                </span>
                                            </div>
                                            <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-lg border border-amber-100 dark:border-amber-800/50">
                                                {block.reason || 'Indisponibilidade'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
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
                                                            {block.start_time === '00:00' && block.end_time === '23:59' ? 'Dia Inteiro' : `${block.start_time} às ${block.end_time}`}
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
                    </>
                )}
            </div>

            {/* Modal de Cadastro Restruturado */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 z-[100] flex justify-center items-center p-4 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-950 rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200/50 dark:border-slate-800/50"
                        >
                            {/* Header */}
                            <div className="px-8 py-8 flex justify-between items-center bg-white dark:bg-slate-950">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    {selectedBlock ? 'Editar Bloqueio' : 'Novo Bloqueio'}
                                </h3>
                                <button 
                                    onClick={() => setIsModalOpen(false)} 
                                    className="p-2 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-all"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="px-8 pb-10 space-y-8 max-h-[85vh] overflow-y-auto no-scrollbar">
                                {/* Profissional Selector */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Profissional</label>
                                    <div className="relative">
                                        <select 
                                            required
                                            value={formData.professional_id}
                                            onChange={(e) => setFormData({ ...formData, professional_id: e.target.value })}
                                            className="w-full p-4 pl-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-base font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none transition-all appearance-none"
                                        >
                                            <option value="">Selecione um profissional</option>
                                            <option value="all">Toda a Equipe</option>
                                            {professionals.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Data Selector */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Data</label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2">
                                            <CalendarIcon className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <input 
                                            type="date" 
                                            required
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full p-4 pl-14 bg-slate-50/50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl text-base font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Time Selection Card */}
                                <div className="bg-slate-50/80 dark:bg-slate-900/50 p-6 sm:p-8 rounded-[32px] space-y-8 border border-slate-100 dark:border-slate-800">
                                    {/* All Day Toggle */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, is_full_day: !formData.is_full_day })}
                                                className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${formData.is_full_day ? 'bg-slate-900 dark:bg-white' : 'bg-slate-200 dark:bg-slate-800'}`}
                                            >
                                                <div className={`w-4 h-4 rounded-full transition-transform transform ${formData.is_full_day ? 'translate-x-6 bg-white dark:bg-slate-900 shadow-sm' : 'translate-x-0 bg-white shadow-sm'}`} />
                                            </button>
                                            <span className="text-base font-bold text-slate-700 dark:text-slate-200">Dia Inteiro</span>
                                        </div>
                                    </div>

                                    {!formData.is_full_day && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">De</label>
                                                <input 
                                                    type="time" 
                                                    required
                                                    value={formData.start_time}
                                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                                    className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-lg font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none text-center shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Até</label>
                                                <input 
                                                    type="time" 
                                                    required
                                                    value={formData.end_time}
                                                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                                    className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-lg font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 outline-none text-center shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-emerald-500 font-medium text-sm ml-1">
                                        <Check className="w-5 h-5" />
                                        Horário disponível
                                    </div>
                                </div>

                                {/* Conflicts Warning */}
                                <AnimatePresence>
                                    {conflicts.length > 0 && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-[32px] p-6 space-y-4"
                                        >
                                            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                                                <AlertCircle className="w-6 h-6" />
                                                <h4 className="font-bold text-lg">Atenção! Conflito Detectado</h4>
                                            </div>
                                            <p className="text-sm text-rose-500/80 leading-relaxed font-bold">
                                                Existem {conflicts.length} agendamento(s) para este período. Ao bloquear, você precisará avisar os clientes e reagendá-los.
                                            </p>
                                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 no-scrollbar">
                                                {conflicts.map(app => {
                                                    const client: any = (app as any).clients || demoData.clients.find(c => c.id === app.client_id);
                                                    const service: any = (app as any).services || demoData.services.find(s => s.id === app.service_id);
                                                    return (
                                                        <div key={app.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-900/50 rounded-2xl shadow-sm">
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{client?.name}</p>
                                                                <p className="text-[10px] text-slate-500">{service?.name} às {app.time}</p>
                                                            </div>
                                                            <div className="bg-rose-100 dark:bg-rose-500/20 px-3 py-1 rounded-full text-[10px] font-black text-rose-600">REAGENDAR</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Reason Selection */}
                                <div className="space-y-5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Motivo do Bloqueio</label>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        {quickReasons.map(reason => (
                                            <button
                                                key={reason}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, reason })}
                                                className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all border ${
                                                    formData.reason === reason 
                                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-lg' 
                                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400 shadow-sm'
                                                }`}
                                            >
                                                {reason}
                                            </button>
                                        ))}
                                    </div>

                                    <input 
                                        type="text" 
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        className="w-full p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-base font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all shadow-sm"
                                        placeholder="Digite um motivo ou selecione acima..."
                                    />
                                </div>

                                {/* Footer Actions */}
                                <div className="pt-6 grid grid-cols-2 gap-4">
                                    <button 
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="py-5 text-base font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 rounded-[28px] transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        className="py-5 text-base font-bold text-white bg-[#0f172a] dark:bg-white dark:text-slate-900 rounded-[28px] hover:scale-[1.05] active:scale-[0.95] transition-all shadow-2xl shadow-slate-200 dark:shadow-none"
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

