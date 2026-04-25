
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
  Trash2,
  BarChart2,
  Activity,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
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
    const [serviceFilter, setServiceFilter] = useState<string>('all');
    const [professionalFilter, setProfessionalFilter] = useState<string>('all');
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNewClientMode, setIsNewClientMode] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isChartModalOpen, setIsChartModalOpen] = useState(false);
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

    const agendaStats = useMemo(() => {
        const total = appointments.length;
        const completed = appointments.filter(a => a.status === 'completed');
        const revenue = completed.reduce((acc, curr) => {
            const service = services.find(s => s.id === curr.service_id);
            return acc + (service?.price || 0);
        }, 0);
        
        let occupancy = 0;
        const activeProfessionals = professionals.length || 1;
        const dailySlots = timeSlots.length;

        if (viewMode === 'today') {
            const validApps = appointments.filter(a => a.status !== 'cancelled').length;
            occupancy = (validApps / (dailySlots * activeProfessionals)) * 100;
        } else {
            const validApps = appointments.filter(a => a.status !== 'cancelled').length;
            occupancy = (validApps / (dailySlots * 24 * activeProfessionals)) * 100;
        }

        return {
            total,
            revenue,
            occupancy: Math.min(Math.round(occupancy), 100)
        };
    }, [appointments, services, professionals, viewMode, timeSlots]);

    const chartData = useMemo(() => {
        const statuses = ['reserved', 'completed', 'cancelled', 'no_show'];
        const distribution = statuses.map(s => ({
            name: s === 'reserved' ? 'Pendentes' : s === 'completed' ? 'Concluídos' : s === 'cancelled' ? 'Cancelados' : 'Faltas',
            value: appointments.filter(a => a.status === s).length,
            color: s === 'reserved' ? '#6366f1' : s === 'completed' ? '#10b981' : s === 'cancelled' ? '#94a3b8' : '#f43f5e'
        })).filter(d => d.value > 0);

        const profVolume = professionals.map(p => ({
            name: p.name.split(' ')[0],
            agendamentos: appointments.filter(a => a.professional_id === p.id).length
        })).sort((a, b) => b.agendamentos - a.agendamentos);

        return { distribution, profVolume };
    }, [appointments, professionals]);

    const filteredAppointments = useMemo(() => {
        return appointments.filter(app => {
            const client = clients.find(c => c.id === app.client_id);
            const service = services.find(s => s.id === app.service_id);
            const professional = professionals.find(p => p.id === app.professional_id);
            
            const matchesSearch = 
                client?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                client?.phone.includes(searchTerm) ||
                service?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                professional?.name.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
            const matchesService = serviceFilter === 'all' || app.service_id === serviceFilter;
            const matchesProfessional = professionalFilter === 'all' || app.professional_id === professionalFilter;

            return matchesSearch && matchesStatus && matchesService && matchesProfessional;
        });
    }, [appointments, clients, services, professionals, searchTerm, statusFilter, serviceFilter, professionalFilter]);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const changeDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 py-4 sm:py-12 space-y-4 sm:space-y-16 mb-32 animate-fade-in font-sans selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-slate-900">
            {/* Header: Global Actions & Navigation */}
            <header className="space-y-4 sm:space-y-8">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-6">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                            onClick={() => openModal()}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-3 px-4 py-3.5 sm:px-8 sm:py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl sm:rounded-[28px] font-black text-[10px] sm:text-[11px] uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-slate-900/10 dark:shadow-none min-w-0"
                        >
                            <Plus className="w-4 h-4 shrink-0" />
                            <span className="truncate">Novo Agendamento</span>
                        </button>
                        <button 
                            onClick={() => {
                                const csvData = filteredAppointments.map(app => {
                                    const c = clients.find(cl => cl.id === app.client_id);
                                    const s = services.find(sv => sv.id === app.service_id);
                                    const p = professionals.find(pr => pr.id === app.professional_id);
                                    return {
                                        Data: app.date,
                                        Hora: app.time,
                                        Cliente: c?.name || 'Vazio',
                                        WhatsApp: c?.phone || 'Vazio',
                                        Serviço: s?.name || 'Vazio',
                                        Valor: s?.price || 0,
                                        Profissional: p?.name || 'Vazio',
                                        Status: app.status
                                    };
                                });
                                
                                const csvRows = [
                                    ['Data', 'Hora', 'Cliente', 'WhatsApp', 'Servico', 'Valor', 'Profissional', 'Status'],
                                    ...csvData.map(d => [d.Data, d.Hora, d.Cliente, d.WhatsApp, d.Serviço, d.Valor, d.Profissional, d.Status])
                                ];
                                
                                const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
                                const encodedUri = encodeURI(csvContent);
                                const link = document.createElement("a");
                                link.setAttribute("href", encodedUri);
                                link.setAttribute("download", `agendamentos_${new Date().toISOString().split('T')[0]}.csv`);
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                addToast('Exportação concluída!', 'success');
                            }}
                            className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm active:scale-95 flex items-center gap-2 group shrink-0"
                            title="Exportar para Excel/CSV"
                        >
                            <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest hidden sm:inline">Exportar</span>
                        </button>
                    </div>

                    {/* Mini Dashboards for Appointments */}
                    <div className="flex gap-2 sm:gap-4 overflow-x-auto no-scrollbar w-full sm:w-auto py-1 items-center relative after:absolute after:right-0 after:top-0 after:bottom-0 after:w-4 after:bg-gradient-to-l after:from-slate-50 dark:after:from-slate-900 after:pointer-events-none sm:after:hidden">
                        <AgendaMiniStat 
                            label="Agends" 
                            labelFull="Agendamentos" 
                            value={agendaStats.total.toString()} 
                            icon={<CalendarDays className="w-3 h-3" />}
                        />
                        <AgendaMiniStat 
                            label="Receita" 
                            value={`R$ ${agendaStats.revenue.toLocaleString()}`} 
                            icon={<DollarSign className="w-3 h-3 text-emerald-600" />}
                        />
                        <AgendaMiniStat 
                            label="Ocupação" 
                            value={`${agendaStats.occupancy}%`} 
                            icon={<Activity className="w-3 h-3 text-indigo-500" />}
                        />
                        <button 
                            onClick={() => setIsChartModalOpen(true)}
                            className="p-3.5 sm:p-4 bg-white dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm border border-slate-100 dark:border-slate-700 active:scale-95 flex items-center gap-2 group shrink-0"
                            title="Ver Gráficos"
                        >
                            <BarChart2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest hidden sm:inline">Ver Gráficos</span>
                        </button>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto">
                        {/* Compact Date Info on the Left of navigation group */}
                        {viewMode === 'today' && (
                            <div className="flex items-center gap-1 sm:gap-4">
                                <button onClick={() => changeDate(-1)} className="p-2 sm:p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-400 hover:text-slate-900">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <div className="text-center min-w-[70px] sm:min-w-[140px]">
                                    <span className="text-[11px] sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                                        {selectedDate.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '')}
                                    </span>
                                </div>
                                <button onClick={() => changeDate(1)} className="p-2 sm:p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-400 hover:text-slate-900">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* View Switcher on the Right */}
                        <div className="flex p-0.5 sm:p-1 bg-slate-100 dark:bg-slate-800/50 rounded-[14px] sm:rounded-[24px]">
                            <button 
                                onClick={() => setViewMode('today')}
                                className={`px-4 sm:px-10 py-2 sm:py-3.5 text-[9px] sm:text-xs font-black uppercase tracking-widest rounded-[11px] sm:rounded-[18px] transition-all whitespace-nowrap ${
                                    viewMode === 'today' 
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md' 
                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                            >
                                Hoje
                            </button>
                            <button 
                                onClick={() => setViewMode('all')}
                                className={`px-4 sm:px-10 py-2 sm:py-3.5 text-[9px] sm:text-xs font-black uppercase tracking-widest rounded-[11px] sm:rounded-[18px] transition-all whitespace-nowrap ${
                                    viewMode === 'all' 
                                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md' 
                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                            >
                                Mês
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Controls Bar: Search & Filters Unified */}
            <section className="space-y-4 sm:space-y-8">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6 w-full">
                    <div className="flex items-center gap-2 sm:gap-6 flex-1">
                        {/* Integrated Search - Expands on mobile */}
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Buscar..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 sm:py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-transparent focus:border-slate-100 dark:focus:border-slate-800 rounded-[18px] sm:rounded-[24px] text-[10px] sm:text-xs font-bold focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-white/5 transition-all outline-none dark:text-white placeholder:text-slate-300"
                            />
                        </div>

                        {/* Advanced Filter Button */}
                        <div className="relative shrink-0">
                            <button 
                                onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                                className={`p-3 sm:p-3.5 rounded-[18px] sm:rounded-[24px] border transition-all flex items-center gap-2 ${
                                    isFilterMenuOpen || serviceFilter !== 'all' || professionalFilter !== 'all'
                                        ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900 shadow-lg'
                                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 dark:bg-slate-900 dark:border-slate-800'
                                }`}
                            >
                                <Filter className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Filtros</span>
                            </button>

                        <AnimatePresence>
                            {isFilterMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsFilterMenuOpen(false)} />
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-full mt-4 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] sm:rounded-[32px] shadow-2xl z-50 p-6 space-y-6"
                                    >
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-1">Profissional</label>
                                                <select 
                                                    value={professionalFilter}
                                                    onChange={(e) => setProfessionalFilter(e.target.value)}
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-[16px] text-xs font-bold outline-none border border-transparent focus:border-slate-100 dark:text-white"
                                                >
                                                    <option value="all">Todos os Profissionais</option>
                                                    {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-1">Serviço</label>
                                                <select 
                                                    value={serviceFilter}
                                                    onChange={(e) => setServiceFilter(e.target.value)}
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-[16px] text-xs font-bold outline-none border border-transparent focus:border-slate-100 dark:text-white"
                                                >
                                                    <option value="all">Todos os Serviços</option>
                                                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="pt-2 flex gap-2">
                                            <button 
                                                onClick={() => { setServiceFilter('all'); setProfessionalFilter('all'); setIsFilterMenuOpen(false); }}
                                                className="flex-1 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                                            >
                                                Limpar
                                            </button>
                                            <button 
                                                onClick={() => setIsFilterMenuOpen(false)}
                                                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white"
                                            >
                                                Aplicar
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Integrated Filter Group - Scrollable next to search */}
                    <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1 items-center w-full">
                        {[
                            { id: 'all', label: 'Tudo' },
                            { id: 'reserved', label: 'Pendentes' },
                            { id: 'completed', label: 'Concluídos' },
                            { id: 'cancelled', label: 'Cancelados' }
                        ].map(f => (
                            <button 
                                key={f.id}
                                onClick={() => setStatusFilter(f.id)}
                                className={`px-4 sm:px-8 py-2.5 sm:py-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-full transition-all border whitespace-nowrap ${
                                    statusFilter === f.id 
                                        ? 'bg-slate-100 border-slate-200 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white shadow-sm' 
                                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* List with Timeline Aesthetic */}
            <main className="space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-8">
                        <Loader2 className="w-10 h-10 text-slate-200 animate-spin" />
                        <p className="text-slate-300 text-xs font-black uppercase tracking-widest">Sincronizando...</p>
                    </div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 sm:py-40 text-center bg-slate-50 dark:bg-slate-900/40 rounded-[32px] sm:rounded-[56px] border border-dashed border-slate-200 dark:border-slate-800/40">
                        <h3 className="text-2xl sm:text-4xl font-black text-slate-200 dark:text-slate-800 tracking-tighter uppercase">Agenda Livre</h3>
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] sm:text-sm font-bold max-w-xs mt-2 sm:mt-4">Nenhum compromisso encontrado.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-y-6 sm:gap-x-8 sm:gap-y-8">
                        <AnimatePresence mode="popLayout">
                            {filteredAppointments.map((app) => (
                                <AppointmentRow 
                                    key={app.id}
                                    app={app}
                                    client={clients.find(c => c.id === app.client_id)}
                                    service={services.find(s => s.id === app.service_id)}
                                    professional={professionals.find(p => p.id === app.professional_id)}
                                    onStatusChange={handleStatusChange}
                                    onEdit={openModal}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            {/* Modal - Modern Native Sheet */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-white/60 dark:bg-slate-950/80 backdrop-blur-2xl z-[100] flex justify-center items-end sm:items-center p-0 sm:p-6">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 100 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 100 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-t-[32px] sm:rounded-[64px] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[96vh] sm:max-h-[90vh] overflow-hidden"
                        >
                            <header className="px-5 sm:px-12 py-6 sm:py-12 flex items-center justify-between shrink-0">
                                <h3 className="text-xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                                    {selectedAppointment ? 'Editar' : 'Novo'}
                                </h3>
                                <button 
                                    onClick={() => setIsModalOpen(false)} 
                                    className="p-2.5 sm:p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-all"
                                >
                                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            </header>

                            <div className="flex-1 overflow-y-auto px-5 sm:px-12 pb-8 sm:pb-12 no-scrollbar grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-16">
                                {/* Left Side: Who & What */}
                                <div className="space-y-6 sm:space-y-10">
                                    <div className="space-y-6 sm:space-y-10 bg-slate-50 dark:bg-slate-800/20 p-5 sm:p-10 rounded-[28px] sm:rounded-[48px]">
                                        <div className="space-y-3 sm:space-y-4">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest">Cliente</label>
                                                <button onClick={() => setIsNewClientMode(!isNewClientMode)} className="text-[9px] sm:text-[10px] font-black underline underline-offset-4 decoration-primary-500/20 text-indigo-600 dark:text-indigo-400">
                                                    {isNewClientMode ? 'Lista de Clientes' : 'Novo Cliente'}
                                                </button>
                                            </div>
                                            
                                            {isNewClientMode ? (
                                                <div className="space-y-3 sm:space-y-4">
                                                    <input 
                                                        type="text"
                                                        placeholder="Nome"
                                                        value={newClientData.name}
                                                        onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                                                        className="w-full px-5 py-4 sm:px-8 sm:py-5 bg-white dark:bg-slate-900/50 rounded-[18px] sm:rounded-[24px] text-sm sm:text-lg font-bold outline-none ring-4 ring-transparent focus:ring-slate-900/5 dark:text-white"
                                                    />
                                                    <PhoneInput value={newClientData.phone} onChange={(val) => setNewClientData({ ...newClientData, phone: val })} />
                                                </div>
                                            ) : (
                                                <div className="relative group">
                                                    <select 
                                                        value={formData.client_id}
                                                        onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                                                        className="w-full px-5 py-4 sm:px-8 sm:py-5 bg-white dark:bg-slate-900/50 rounded-[18px] sm:rounded-[24px] text-sm sm:text-lg font-bold appearance-none outline-none dark:text-white"
                                                    >
                                                        <option value="" disabled>Escolher...</option>
                                                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                    </select>
                                                    <ChevronDown className="absolute right-5 sm:right-8 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-200 pointer-events-none" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3 sm:space-y-4">
                                            <label className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Serviço</label>
                                            <div className="relative">
                                                <select 
                                                    value={formData.service_id}
                                                    onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                                                    className="w-full px-5 py-4 sm:px-8 sm:py-5 bg-white dark:bg-slate-900/50 rounded-[18px] sm:rounded-[24px] text-sm sm:text-lg font-bold appearance-none outline-none dark:text-white text-emerald-600 dark:text-emerald-400"
                                                >
                                                    <option value="" disabled>Escolher...</option>
                                                    {services.map(s => <option key={s.id} value={s.id}>{s.name} • R$ {s.price.toFixed(0)}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-5 sm:right-8 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-200 pointer-events-none" />
                                            </div>
                                        </div>

                                        <div className="space-y-3 sm:space-y-4">
                                            <label className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Profissional</label>
                                            <div className="relative">
                                                <select 
                                                    value={formData.professional_id}
                                                    onChange={(e) => setFormData({ ...formData, professional_id: e.target.value })}
                                                    className="w-full px-5 py-4 sm:px-8 sm:py-5 bg-white dark:bg-slate-900/50 rounded-[18px] sm:rounded-[24px] text-sm sm:text-lg font-bold appearance-none outline-none dark:text-white"
                                                >
                                                    <option value="" disabled>Escolher...</option>
                                                    {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-5 sm:right-8 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-200 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: When */}
                                <div className="space-y-6 sm:space-y-10">
                                    <div className="space-y-4 sm:space-y-8">
                                        <label className="block text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Data</label>
                                        <div className="flex gap-2 sm:gap-4 overflow-x-auto no-scrollbar pb-2 sm:pb-4 px-1">
                                            {upcomingDays.map((day, idx) => {
                                                const dateStr = day.toISOString().split('T')[0];
                                                const isSelected = formData.date === dateStr;
                                                return (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, date: dateStr })}
                                                        className={`min-w-[70px] sm:min-w-[100px] py-4 sm:py-10 rounded-[18px] sm:rounded-[40px] transition-all flex flex-col items-center justify-center gap-0.5 sm:gap-2 shrink-0 ${
                                                            isSelected 
                                                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 scale-105 shadow-xl z-10' 
                                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
                                                        }`}
                                                    >
                                                        <span className="text-[7px] sm:text-[10px] font-black uppercase tracking-widest opacity-60">
                                                            {day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                                                        </span>
                                                        <span className="text-lg sm:text-3xl font-black">{day.getDate()}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-4 sm:space-y-8">
                                        <label className="block text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Horário</label>
                                        <div className="grid grid-cols-4 gap-2 sm:gap-3 px-1">
                                            {timeSlots.map((time) => {
                                                const isSelected = selectedTime === time;
                                                return (
                                                    <button
                                                        key={time}
                                                        type="button"
                                                        onClick={() => { setSelectedTime(time); setFormData({ ...formData, time }); }}
                                                        className={`py-3 sm:py-5 rounded-[14px] sm:rounded-[24px] text-[10px] sm:text-xs font-black transition-all ${
                                                            isSelected 
                                                                ? 'bg-primary-600 text-white shadow-lg scale-105 z-10' 
                                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        {time}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <footer className="px-5 sm:px-12 py-6 sm:py-12 bg-slate-50 dark:bg-slate-800/30 flex flex-col sm:flex-row gap-4 sm:gap-6 shrink-0">
                                <button 
                                    type="button"
                                    onClick={handleSave}
                                    disabled={(!isNewClientMode && !formData.client_id) || (isNewClientMode && (!newClientData.name || !newClientData.phone)) || !formData.service_id || !formData.professional_id || !selectedTime}
                                    className="flex-1 py-4 sm:py-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[20px] sm:rounded-[32px] font-black text-[11px] sm:text-sm uppercase tracking-[0.2em] shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-20"
                                >
                                    Confirmar Atendimento
                                </button>
                            </footer>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Floating Charts Modal */}
            <AnimatePresence>
                {isChartModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[32px] sm:rounded-[48px] shadow-2xl p-6 sm:p-10 space-y-8 relative overflow-hidden"
                        >
                            <button 
                                onClick={() => setIsChartModalOpen(false)}
                                className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="space-y-1">
                                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Visão Detalhada</h3>
                                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">{viewMode === 'today' ? 'Dados de Hoje' : 'Dados do Mês'}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 overflow-y-auto pr-1 no-scrollbar max-h-[60vh] sm:max-h-none">
                                {/* Distribution Chart */}
                                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/20 p-4 rounded-3xl">
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-1">Distribuição de Status</p>
                                    <div className="h-40 sm:h-52 w-full flex items-center justify-center">
                                        {chartData.distribution.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={chartData.distribution}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={45}
                                                        outerRadius={65}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {chartData.distribution.map((entry: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip 
                                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <p className="text-xs text-slate-400 font-bold italic">Sem dados suficientes</p>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center">
                                        {chartData.distribution.map((d, i) => (
                                            <div key={i} className="flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                                                <span className="text-[8px] font-black uppercase text-slate-500">{d.name} ({d.value})</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Professional Performance */}
                                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/20 p-4 rounded-3xl">
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-1">Volume por Profissional</p>
                                    <div className="h-40 sm:h-52 w-full">
                                        {chartData.profVolume.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={chartData.profVolume} layout="vertical">
                                                    <XAxis type="number" hide />
                                                    <YAxis dataKey="name" type="category" width={50} axisLine={false} tickLine={false} style={{ fontSize: '9px', fontWeight: '900', fill: '#94a3b8', textTransform: 'uppercase' }} />
                                                    <Tooltip 
                                                        cursor={{ fill: 'transparent' }}
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                                                        labelStyle={{ display: 'none' }}
                                                    />
                                                    <Bar dataKey="agendamentos" fill="#0f172a" radius={[0, 8, 8, 0]} barSize={10} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <p className="text-xs text-slate-400 font-bold italic text-center py-10">Nenhum registro</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center p-3 sm:p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Ocupação</span>
                                            <span className="text-xs font-black text-slate-900 dark:text-white">{agendaStats.occupancy}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const AppointmentRow: React.FC<{ 
    app: Appointment, 
    client?: Client, 
    service?: Service, 
    professional?: Professional,
    onStatusChange: (id: string, status: Appointment['status']) => void,
    onEdit: (app: Appointment) => void,
    onDelete: (id: string) => void
}> = ({ app, client, service, professional, onStatusChange, onEdit, onDelete }) => {
    const statusColors = {
        reserved: 'border-indigo-500',
        completed: 'border-emerald-500',
        cancelled: 'border-orange-500',
        no_show: 'border-slate-300'
    };

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex gap-3 sm:gap-4 lg:gap-5 items-start"
        >
            {/* External Time & Indicator */}
            <div className="flex flex-col items-center pt-2 min-w-[50px] sm:min-w-[60px] lg:min-w-[80px] shrink-0">
                <span className="text-sm sm:text-lg lg:text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">{app.time}</span>
                <span className="text-[7px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                    {new Date(app.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}
                </span>
                <div className={`w-1.5 h-1.5 rounded-full mt-2 ${
                    app.status === 'reserved' ? 'bg-indigo-500' : 
                    app.status === 'completed' ? 'bg-emerald-500' : 
                    app.status === 'cancelled' ? 'bg-orange-500' : 'bg-slate-300'
                }`} />
            </div>

            {/* Main Card */}
            <div className={`flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[18px] sm:rounded-[22px] lg:rounded-[28px] overflow-hidden shadow-sm hover:shadow-md hover:translate-x-1 lg:hover:translate-x-1 transition-all border-l-4 ${statusColors[app.status]} h-full`}>
                <div className="p-4 lg:p-5 space-y-4">
                    {/* Top Row: Client & Badge */}
                    <div className="flex justify-between items-start gap-3">
                        <div className="space-y-0.5">
                            <h4 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none truncate max-w-[120px] sm:max-w-none">{client?.name || 'Cliente'}</h4>
                        </div>
                        <StatusBadge status={app.status} />
                    </div>

                    {/* Info Rows */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 font-bold text-[10px] sm:text-xs">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                                <Scissors className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                                <span className="truncate">{service?.name || 'Serviço'}</span>
                            </div>
                            <span className="opacity-60 whitespace-nowrap ml-2">{service?.duration} min</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 font-bold text-[10px] sm:text-xs">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                                <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                                <span className="truncate">{professional?.name || 'Profissional'}</span>
                            </div>
                            <span className="text-slate-900 dark:text-white font-black whitespace-nowrap ml-2">R$ {service?.price.toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>

                    <div className="h-px bg-slate-50 dark:bg-slate-800/50 w-full" />

                    {/* Primary Actions Row */}
                    <div className="flex items-center gap-1.5">
                        <a 
                            href={`https://wa.me/${client?.phone.replace(/\D/g, '')}?text=Olá ${client?.name}, lembrete do seu agendamento hoje às ${app.time}.`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex-1 text-center py-2.5 sm:py-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl lg:rounded-2xl text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-[0.05em] lg:tracking-widest hover:scale-[1.02] transition-all"
                        >
                            Lembrar
                        </a>
                        
                        {(app.status === 'reserved' || app.status === 'completed') && (
                            <button 
                                onClick={() => onStatusChange(app.id, 'no_show')}
                                className="flex-1 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 rounded-xl lg:rounded-2xl text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-[0.05em] lg:tracking-widest hover:scale-[1.02] transition-all"
                            >
                                Ausente
                            </button>
                        )}

                        {app.status === 'reserved' && (
                            <button 
                                onClick={() => onStatusChange(app.id, 'completed')}
                                className="flex-1 py-2.5 sm:py-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl lg:rounded-2xl text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-[0.05em] lg:tracking-widest hover:scale-[1.02] transition-all"
                            >
                                Concluir
                            </button>
                        )}
                    </div>

                    {/* Utils Footer Row - RIGHT ALIGNED */}
                    <div className="flex items-center justify-end gap-3 pt-1">
                        <button 
                            onClick={() => onEdit(app)}
                            className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            Editar
                        </button>
                        <div className="h-3 w-px bg-slate-100 dark:bg-slate-800" />
                        <button 
                            onClick={() => onDelete(app.id)}
                            className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                        >
                            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const StatusDot: React.FC<{ status: Appointment['status'] }> = ({ status }) => {
    const colors = {
        reserved: 'bg-indigo-500',
        completed: 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
        cancelled: 'bg-slate-300',
        no_show: 'bg-rose-500'
    };
    return <div className={`w-3 h-3 rounded-full ${colors[status]} mb-1`} />;
};

const StatusBadge: React.FC<{ status: Appointment['status'] }> = ({ status }) => {
    const styles = {
        reserved: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10',
        completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10',
        cancelled: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10',
        no_show: 'bg-slate-100 text-slate-600 dark:bg-slate-800'
    };

    const labels = {
        reserved: 'RESERVADO',
        completed: 'CONCLUÍDO',
        cancelled: 'CANCELADO',
        no_show: 'NÃO VEIO'
    };

    return (
        <span className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-[10px] text-[8px] sm:text-[10px] font-black uppercase tracking-[0.1em] ${styles[status]}`}>
            {labels[status]}
        </span>
    );
};

const AgendaMiniStat: React.FC<{ icon: React.ReactNode, label: string, labelFull?: string, value: string }> = ({ icon, label, labelFull, value }) => (
    <div className="flex flex-col gap-0.5 sm:gap-1.5 p-2.5 sm:p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl sm:rounded-2xl min-w-[85px] sm:min-w-[120px] shadow-sm shrink-0">
        <div className="flex items-center gap-1 opacity-60">
            {icon}
            <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-tight sm:tracking-widest truncate max-w-[50px] sm:max-w-none">
                <span className="sm:hidden">{label}</span>
                <span className="hidden sm:inline">{labelFull || label}</span>
            </span>
        </div>
        <span className="text-[10px] sm:text-lg font-black text-slate-900 dark:text-white tracking-tighter truncate">{value}</span>
    </div>
);

export default AppointmentsPage;

