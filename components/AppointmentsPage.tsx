
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Scissors, 
  Check, 
  X, 
  MoreVertical,
  AlertTriangle,
  Loader2,
  TrendingUp,
  DollarSign,
  Users,
  MessageCircle,
  ChevronDown,
  CalendarDays,
  Edit,
  Trash2
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast, useDemoData } from '../App';
import { Appointment, Service, Professional, Client } from '../types';
import { ConfirmationModal, PhoneInput } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

const AppointmentsPage: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'today' | 'all'>('today');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNewClientMode, setIsNewClientMode] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [formData, setFormData] = useState({
        client_id: '',
        service_id: '',
        professional_id: '',
        time: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [newClientData, setNewClientData] = useState({
        name: '',
        phone: ''
    });
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const { addToast } = useToast();
    const { isDemo, demoData, setDemoData } = useDemoData();

    const fetchAppointments = useCallback(async () => {
        if (isDemo) {
            let filtered = demoData.appointments;
            if (viewMode === 'today') {
                const dateStr = selectedDate.toISOString().split('T')[0];
                filtered = filtered.filter(a => a.date === dateStr);
            }
            setAppointments(filtered);
            setLoading(false);
            return;
        }
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let query = supabase
            .from('appointments')
            .select('*')
            .eq('business_id', user.id);
        
        if (viewMode === 'today') {
            const dateStr = selectedDate.toISOString().split('T')[0];
            query = query.eq('date', dateStr);
        }

        const { data, error } = await query.order('date', { ascending: false }).order('time', { ascending: true });

        if (error) {
            addToast('Erro ao carregar agendamentos.', 'error');
        } else {
            setAppointments(data || []);
        }
        setLoading(false);
    }, [selectedDate, viewMode, addToast, isDemo, demoData.appointments]);

    const fetchData = useCallback(async () => {
        if (isDemo) {
            setServices(demoData.services);
            setProfessionals(demoData.professionals);
            setClients(demoData.clients);
            return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [servicesRes, professionalsRes, clientsRes] = await Promise.all([
            supabase.from('services').select('*').eq('business_id', user.id),
            supabase.from('professionals').select('*').eq('business_id', user.id),
            supabase.from('clients').select('*').eq('business_id', user.id)
        ]);

        if (servicesRes.data) setServices(servicesRes.data);
        if (professionalsRes.data) setProfessionals(professionalsRes.data);
        if (clientsRes.data) setClients(clientsRes.data);
    }, [isDemo, demoData.services, demoData.professionals, demoData.clients]);

    useEffect(() => {
        fetchAppointments();
        fetchData();
    }, [fetchAppointments, fetchData]);

    const handleSave = async (e: React.FormEvent) => {
        if (e) e.preventDefault();
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user && !isDemo) return;

        let finalClientId = formData.client_id;

        // Step 1: Create new client if in new client mode
        if (isNewClientMode) {
            if (!newClientData.name || !newClientData.phone) {
                addToast('Preencha o nome e whatsapp do cliente.', 'error');
                return;
            }

            if (isDemo) {
                const newClient: Client = {
                    id: `c${Date.now()}`,
                    name: newClientData.name,
                    phone: newClientData.phone,
                    business_id: demoData.business.id,
                    status: 'active',
                    created_at: new Date().toISOString()
                };
                setDemoData(prev => ({
                    ...prev,
                    clients: [...prev.clients, newClient]
                }));
                finalClientId = newClient.id;
                setClients(prev => [...prev, newClient]);
            } else {
                const { data: clientData, error: clientError } = await supabase
                    .from('clients')
                    .insert([{
                        name: newClientData.name,
                        phone: newClientData.phone,
                        business_id: user?.id,
                        status: 'active'
                    }])
                    .select()
                    .single();

                if (clientError) {
                    addToast('Erro ao cadastrar novo cliente.', 'error');
                    return;
                }
                finalClientId = clientData.id;
                setClients(prev => [...prev, clientData as Client]);
            }
        }

        if (isDemo) {
            const appointmentData: Appointment = {
                id: selectedAppointment?.id || `a${Date.now()}`,
                ...formData,
                client_id: finalClientId,
                status: (selectedAppointment?.status as any) || 'reserved',
                business_id: demoData.business.id,
                created_at: selectedAppointment?.created_at || new Date().toISOString()
            };

            if (selectedAppointment) {
                setDemoData(prev => ({
                    ...prev,
                    appointments: prev.appointments.map(a => a.id === selectedAppointment.id ? appointmentData : a)
                }));
                addToast('Agendamento atualizado (Modo Demo)!', 'success');
            } else {
                setDemoData(prev => ({
                    ...prev,
                    appointments: [...prev.appointments, appointmentData]
                }));
                addToast('Agendamento criado (Modo Demo)!', 'success');
            }
            setIsModalOpen(false);
            fetchAppointments();
            return;
        }

        const appointmentData = {
            ...formData,
            client_id: finalClientId,
            business_id: user?.id,
            status: selectedAppointment?.status || 'reserved'
        };

        if (selectedAppointment) {
            const { error } = await supabase
                .from('appointments')
                .update(appointmentData)
                .eq('id', selectedAppointment.id);

            if (error) addToast('Erro ao atualizar agendamento.', 'error');
            else {
                addToast('Agendamento atualizado com sucesso!', 'success');
                setIsModalOpen(false);
                fetchAppointments();
            }
        } else {
            const { error } = await supabase
                .from('appointments')
                .insert([appointmentData]);

            if (error) addToast('Erro ao criar agendamento.', 'error');
            else {
                addToast('Agendamento criado com sucesso!', 'success');
                setIsModalOpen(false);
                fetchAppointments();
            }
        }
    };

    const handleStatusChange = async (id: string, newStatus: Appointment['status']) => {
        if (isDemo) {
            setDemoData(prev => ({
                ...prev,
                appointments: prev.appointments.map(a => a.id === id ? { ...a, status: newStatus } : a)
            }));
            addToast(`Status atualizado com sucesso!`, 'success');
            fetchAppointments();
            return;
        }
        const { error } = await supabase
            .from('appointments')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            addToast('Erro ao atualizar status.', 'error');
        } else {
            addToast(`Status atualizado com sucesso!`, 'success');
            fetchAppointments();
        }
    };

    const handleDelete = async (id: string) => {
        if (isDemo) {
            setDemoData(prev => ({
                ...prev,
                appointments: prev.appointments.filter(a => a.id !== id)
            }));
            addToast('Agendamento excluído (Modo Demo)!', 'success');
            fetchAppointments();
            return;
        }

        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', id);

        if (error) addToast('Erro ao excluir agendamento.', 'error');
        else {
            addToast('Agendamento excluído com sucesso!', 'success');
            fetchAppointments();
        }
    };

    const openModal = (app: Appointment | null = null) => {
        setSelectedAppointment(app);
        setIsNewClientMode(false);
        setNewClientData({ name: '', phone: '' });
        if (app) {
            setFormData({
                client_id: app.client_id,
                service_id: app.service_id,
                professional_id: app.professional_id,
                time: app.time,
                date: app.date
            });
            setSelectedTime(app.time);
        } else {
            setFormData({
                client_id: '',
                service_id: '',
                professional_id: '',
                time: '',
                date: new Date().toISOString().split('T')[0]
            });
            setSelectedTime(null);
        }
        setIsModalOpen(true);
    };

    const upcomingDays = useMemo(() => {
        const days = [];
        const today = new Date();
        for (let i = 0; i < 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            days.push(date);
        }
        return days;
    }, []);

    const timeSlots = useMemo(() => {
        const slots = [];
        let start = 8; // 8 AM
        let end = 20; // 8 PM
        
        for (let h = start; h < end; h++) {
            slots.push(`${h.toString().padStart(2, '0')}:00`);
            slots.push(`${h.toString().padStart(2, '0')}:30`);
        }
        return slots;
    }, []);

    const filteredAppointments = useMemo(() => {
        return appointments.filter(app => {
            const client = clients.find(c => c.id === app.client_id);
            const matchesSearch = client?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 client?.phone.includes(searchTerm);
            const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [appointments, clients, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        const reserved = appointments.filter(a => a.status === 'reserved');
        const completed = appointments.filter(a => a.status === 'completed');
        const totalRevenue = completed.reduce((acc, curr) => {
            const service = services.find(s => s.id === curr.service_id);
            return acc + (service?.price || 0);
        }, 0);

        return {
            total: appointments.length,
            reserved: reserved.length,
            completed: completed.length,
            revenue: totalRevenue
        };
    }, [appointments, services]);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const changeDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    return (
        <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-8 animate-fade-in mb-20">
            {/* Action Bar (Simplified) */}
            <div className="flex justify-end mb-2">
                <button 
                    onClick={() => openModal()}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-slate-200 dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    Novo Agendamento
                </button>
            </div>

            {/* View Select & Search */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full md:w-auto">
                        <button 
                            onClick={() => setViewMode('today')}
                            className={`flex-1 md:w-32 py-3 text-xs font-bold rounded-xl transition-all ${
                                viewMode === 'today' 
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Hoje
                        </button>
                        <button 
                            onClick={() => setViewMode('all')}
                            className={`flex-1 md:w-32 py-3 text-xs font-bold rounded-xl transition-all ${
                                viewMode === 'all' 
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Todos
                        </button>
                    </div>

                    <div className="relative flex-1 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-gold-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Buscar por cliente ou telefone..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-4 focus:ring-gold-500/10 focus:border-gold-500 outline-none transition-all dark:text-white"
                        />
                    </div>

                    {viewMode === 'today' && (
                        <div className="flex items-center justify-center gap-4 bg-white dark:bg-slate-900 px-3 py-2 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm mx-auto md:mx-0 w-fit">
                            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                <ChevronLeft className="w-5 h-5 text-slate-400" />
                            </button>
                            <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 min-w-[120px] text-center uppercase tracking-tighter">
                                {formatDate(selectedDate)}
                            </span>
                            <button onClick={() => changeDate(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                <ChevronRight className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Status Filters */}
                <div className="flex p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl overflow-x-auto no-scrollbar gap-1">
                    {[
                        { id: 'all', label: 'Todos' },
                        { id: 'reserved', label: 'Reservado' },
                        { id: 'completed', label: 'Concluído' },
                        { id: 'no_show', label: 'Não Veio' },
                        { id: 'cancelled', label: 'Desistiu' }
                    ].map(f => (
                        <button 
                            key={f.id}
                            onClick={() => setStatusFilter(f.id)}
                            className={`px-6 py-2.5 text-[10px] sm:text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                                statusFilter === f.id 
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <StatCard title="Total" value={stats.total.toString()} icon={<CalendarDays className="w-5 h-5" />} color="slate" />
                <StatCard title="Reservados" value={stats.reserved.toString()} icon={<Clock className="w-5 h-5" />} color="gold" />
                <StatCard title="Concluídos" value={stats.completed.toString()} icon={<Check className="w-5 h-5" />} color="emerald" />
                <StatCard title="Receita" value={`R$ ${stats.revenue.toFixed(0)}`} icon={<DollarSign className="w-5 h-5" />} color="blue" />
            </div>

            {/* Lista de Agendamentos */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
                        <p className="text-slate-800 dark:text-slate-400 text-sm font-bold">Sincronizando sua agenda...</p>
                    </div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center px-4 bg-white dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                            <CalendarIcon className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Nenhum agendamento encontrado</h3>
                        <p className="text-slate-800 dark:text-slate-400 text-sm font-medium max-w-xs">Não há atendimentos marcados para este dia com os filtros atuais.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        <AnimatePresence mode="popLayout">
                            {filteredAppointments.map((app) => {
                                const client = clients.find(c => c.id === app.client_id);
                                const service = services.find(s => s.id === app.service_id);
                                const professional = professionals.find(p => p.id === app.professional_id);

                                return (
                                    <motion.div 
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        key={app.id} 
                                        className="bg-white dark:bg-slate-900/50 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-700 shadow-inner shrink-0">
                                                    <span className="text-lg font-bold text-slate-950 dark:text-slate-100 leading-none">{app.time}</span>
                                                    <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-tighter mt-1">{app.date.split('-').reverse().slice(0, 2).join('/')}</span>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">{client?.name || 'Cliente'}</h4>
                                                        <StatusBadge status={app.status} />
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 items-center text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                                                        <div className="flex items-center gap-1.5">
                                                            <Scissors className="w-3 h-3 text-gold-500" />
                                                            <span>{service?.name || 'Serviço'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <User className="w-3 h-3 text-slate-400" />
                                                            <span>{professional?.name || 'Profissional'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                                            <a 
                                                href={`https://wa.me/${client?.phone.replace(/\D/g, '')}`} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="p-3 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 rounded-xl transition-all hover:scale-105 active:scale-95"
                                                title="WhatsApp"
                                            >
                                                <MessageCircle className="w-5 h-5" />
                                            </a>
                                            
                                            <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 mx-1" />

                                            {app.status === 'reserved' && (
                                                <>
                                                    <button 
                                                        onClick={() => handleStatusChange(app.id, 'completed')}
                                                        className="px-4 py-2.5 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all shadow-md active:scale-95"
                                                    >
                                                        Concluir
                                                    </button>
                                                    <button 
                                                        onClick={() => handleStatusChange(app.id, 'no_show')}
                                                        className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                                                    >
                                                        Não Veio
                                                    </button>
                                                </>
                                            )}

                                            <div className="relative group/actions">
                                                <button className="p-3 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                                <div className="absolute right-0 bottom-full mb-2 w-40 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl opacity-0 invisible group-hover/actions:opacity-100 group-hover/actions:visible transition-all p-2 z-10 flex flex-col gap-1">
                                                    <button onClick={() => openModal(app)} className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
                                                        <Edit className="w-4 h-4" />
                                                        Editar
                                                    </button>
                                                    <button onClick={() => handleStatusChange(app.id, 'cancelled')} className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                                                        <X className="w-4 h-4" />
                                                        Desistiu
                                                    </button>
                                                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                                                    <button onClick={() => handleDelete(app.id)} className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                        Excluir
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Modal de Agendamento */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-slate-100/80 dark:bg-slate-950/90 z-[100] flex justify-center items-end sm:items-center overflow-hidden">
                        <motion.div 
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="relative px-8 py-8 flex items-center justify-center border-b border-slate-50 dark:border-slate-800">
                                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    {selectedAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
                                </h3>
                                <button 
                                    onClick={() => setIsModalOpen(false)} 
                                    className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto px-6 py-8 no-scrollbar space-y-8">
                                {/* Details Section */}
                                <div className="bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 space-y-6">
                                    {/* Client Selection */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                                                {isNewClientMode ? 'Dados do Novo Cliente' : 'Cliente'}
                                            </label>
                                            <button 
                                                onClick={() => setIsNewClientMode(!isNewClientMode)}
                                                className="text-[10px] font-black text-primary-600 hover:text-primary-700 dark:text-primary-400 uppercase tracking-[0.2em]"
                                            >
                                                {isNewClientMode ? 'Selecionar Existente' : 'Novo Cliente'}
                                            </button>
                                        </div>
                                        
                                        {isNewClientMode ? (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                                <div className="relative">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <input 
                                                        required
                                                        type="text"
                                                        placeholder="Nome Completo"
                                                        value={newClientData.name}
                                                        onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                                                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <PhoneInput 
                                                        value={newClientData.phone}
                                                        onChange={(val) => setNewClientData({ ...newClientData, phone: val })}
                                                        placeholder="WhatsApp (Ex: 11 99999-9999)"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <select 
                                                    required
                                                    value={formData.client_id}
                                                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                                                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all appearance-none"
                                                >
                                                    <option value="" disabled>Selecione...</option>
                                                    {clients.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                                    <ChevronDown className="w-4 h-4" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Service Selection */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-1">Serviço</label>
                                        <div className="relative">
                                            <select 
                                                required
                                                value={formData.service_id}
                                                onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                                                className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all appearance-none"
                                            >
                                                <option value="" disabled>Selecione...</option>
                                                {services.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} - R$ {s.price.toFixed(2)}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                                <ChevronDown className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Professional Selection */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-1">Profissional</label>
                                        <div className="relative">
                                            <select 
                                                required
                                                value={formData.professional_id}
                                                onChange={(e) => setFormData({ ...formData, professional_id: e.target.value })}
                                                className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all appearance-none"
                                            >
                                                <option value="" disabled>Selecione...</option>
                                                {professionals.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                                <ChevronDown className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Date & Time Section */}
                                <div className="bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 space-y-6">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-1">Data & Hora</label>
                                    
                                    {/* Horizontal Date Picker */}
                                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                        {upcomingDays.map((day, idx) => {
                                            const dateStr = day.toISOString().split('T')[0];
                                            const isSelected = formData.date === dateStr;
                                            const weekday = day.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', '');
                                            const dayNum = day.getDate();

                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, date: dateStr })}
                                                    className={`
                                                        min-w-[70px] flex flex-col items-center justify-center p-4 rounded-2xl transition-all shadow-sm
                                                        ${isSelected 
                                                            ? 'bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 scale-105 z-10' 
                                                            : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}
                                                    `}
                                                >
                                                    <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isSelected ? 'text-white/60 dark:text-slate-900/60' : 'text-slate-400'}`}>
                                                        {weekday}
                                                    </span>
                                                    <span className="text-xl font-black">
                                                        {dayNum}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Time Selector */}
                                    <div className="space-y-4 pt-4">
                                        {!formData.professional_id || !formData.date ? (
                                            <div className="py-12 flex items-center justify-center text-slate-400 text-sm font-medium italic">
                                                Selecione profissional e data.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-4 gap-2">
                                                {timeSlots.map((time) => {
                                                    const isSelected = selectedTime === time;
                                                    return (
                                                        <button
                                                            key={time}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedTime(time);
                                                                setFormData({ ...formData, time });
                                                            }}
                                                            className={`
                                                                py-3 text-xs font-bold rounded-xl transition-all border
                                                                ${isSelected 
                                                                    ? 'bg-primary-600 border-primary-600 text-white shadow-lg' 
                                                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-primary-500'}
                                                            `}
                                                        >
                                                            {time}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer / Action Button */}
                            <div className="p-8 border-t border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-[40px] shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.05)]">
                                <button 
                                    type="button"
                                    onClick={handleSave}
                                    disabled={(!isNewClientMode && !formData.client_id) || (isNewClientMode && (!newClientData.name || !newClientData.phone)) || !formData.service_id || !formData.professional_id || !selectedTime}
                                    className="w-full py-5 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-20 disabled:grayscale"
                                >
                                    {selectedAppointment ? 'Atualizar Agendamento' : 'Confirmar Agendamento'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode, color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-slate-900/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 sm:space-y-4">
        <div className="flex items-center justify-between">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 scale-90 sm:scale-100">
                {icon}
            </div>
        </div>
        <div className="space-y-0.5 sm:space-y-1">
            <p className="text-[9px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider truncate">{title}</p>
            <h4 className="text-lg sm:text-2xl font-bold text-slate-950 dark:text-slate-50 truncate">{value}</h4>
        </div>
    </div>
);

const StatusBadge: React.FC<{ status: Appointment['status'] }> = ({ status }) => {
    const styles = {
        reserved: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50',
        completed: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50',
        cancelled: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50',
        no_show: 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
    };

    const labels = {
        reserved: 'Reservado',
        completed: 'Concluído',
        cancelled: 'Desistiu',
        no_show: 'Não Veio'
    };

    return (
        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase border ${styles[status]}`}>
            {labels[status]}
        </span>
    );
};

export default AppointmentsPage;

