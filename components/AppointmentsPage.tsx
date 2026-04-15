
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
import { ConfirmationModal } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

const AppointmentsPage: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [formData, setFormData] = useState({
        client_id: '',
        service_id: '',
        professional_id: '',
        time: '09:00',
        date: new Date().toISOString().split('T')[0]
    });
    const { addToast } = useToast();
    const { isDemo, demoData, setDemoData } = useDemoData();

    const fetchAppointments = useCallback(async () => {
        if (isDemo) {
            const dateStr = selectedDate.toISOString().split('T')[0];
            const filtered = demoData.appointments.filter(a => a.date === dateStr);
            setAppointments(filtered);
            setLoading(false);
            return;
        }
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const dateStr = selectedDate.toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('business_id', user.id)
            .eq('date', dateStr)
            .order('time', { ascending: true });

        if (error) {
            addToast('Erro ao carregar agendamentos.', 'error');
        } else {
            setAppointments(data || []);
        }
        setLoading(false);
    }, [selectedDate, addToast, isDemo, demoData.appointments]);

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
        e.preventDefault();
        
        if (isDemo) {
            const appointmentData: Appointment = {
                id: selectedAppointment?.id || `a${Date.now()}`,
                ...formData,
                status: selectedAppointment?.status || 'confirmed',
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

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const appointmentData = {
            ...formData,
            business_id: user.id,
            status: selectedAppointment?.status || 'confirmed'
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
            addToast(`Agendamento ${newStatus === 'confirmed' ? 'confirmado' : 'cancelado'} com sucesso!`, 'success');
            return;
        }
        const { error } = await supabase
            .from('appointments')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            addToast('Erro ao atualizar status.', 'error');
        } else {
            addToast(`Agendamento ${newStatus === 'confirmed' ? 'confirmado' : 'cancelado'} com sucesso!`, 'success');
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
        if (app) {
            setFormData({
                client_id: app.client_id,
                service_id: app.service_id,
                professional_id: app.professional_id,
                time: app.time,
                date: app.date
            });
        } else {
            setFormData({
                client_id: '',
                service_id: '',
                professional_id: '',
                time: '09:00',
                date: selectedDate.toISOString().split('T')[0]
            });
        }
        setIsModalOpen(true);
    };

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
        const confirmed = appointments.filter(a => a.status === 'confirmed');
        const totalRevenue = confirmed.reduce((acc, curr) => {
            const service = services.find(s => s.id === curr.service_id);
            return acc + (service?.price || 0);
        }, 0);

        return {
            total: appointments.length,
            confirmed: confirmed.length,
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
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
            {/* Header with Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 capitalize">
                            {formatDate(selectedDate)}
                        </h2>
                        <button onClick={() => setSelectedDate(new Date())} className="text-[10px] font-bold text-gold-600 uppercase tracking-widest text-left hover:underline">
                            Voltar para hoje
                        </button>
                    </div>
                    <button onClick={() => changeDate(1)} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
                <button 
                    onClick={() => openModal()}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gold-500 text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-gold-400 transition-all shadow-xl shadow-gold-500/20 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Novo Agendamento
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard title="Agendamentos" value={stats.total.toString()} icon={<Users className="w-5 h-5" />} color="gold" />
                <StatCard title="Confirmados" value={stats.confirmed.toString()} icon={<Check className="w-5 h-5" />} color="emerald" />
                <StatCard title="Receita Prevista" value={`R$ ${stats.revenue.toFixed(2)}`} icon={<DollarSign className="w-5 h-5" />} color="blue" />
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
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col items-center justify-center min-w-[80px] py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner">
                                                <span className="text-xl font-bold text-slate-950 dark:text-slate-100">{app.time}</span>
                                                <span className="text-[9px] text-slate-600 dark:text-slate-400 uppercase font-bold tracking-widest">Início</span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">{client?.name || 'Cliente'}</h4>
                                                    <StatusBadge status={app.status} />
                                                </div>
                                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-800 dark:text-slate-400 font-bold">
                                                    <div className="flex items-center gap-2">
                                                        <Scissors className="w-3.5 h-3.5 text-gold-500" />
                                                        <span>{service?.name || 'Serviço'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>{professional?.name || 'Profissional'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>{service?.duration || 0} min</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 self-end md:self-center">
                                            <a 
                                                href={`https://wa.me/${client?.phone.replace(/\D/g, '')}`} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="p-3 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-2xl transition-all"
                                                title="Enviar WhatsApp"
                                            >
                                                <MessageCircle className="w-5 h-5" />
                                            </a>
                                            
                                            {app.status === 'pending' && (
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => handleStatusChange(app.id, 'confirmed')}
                                                        className="px-6 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg"
                                                    >
                                                        Confirmar
                                                    </button>
                                                    <button 
                                                        onClick={() => handleStatusChange(app.id, 'cancelled')}
                                                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )}

                                            {app.status === 'confirmed' && (
                                                <button 
                                                    onClick={() => handleStatusChange(app.id, 'cancelled')}
                                                    className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                            )}

                                            <button 
                                                onClick={() => openModal(app)}
                                                className="p-2.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                                title="Editar"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(app.id)}
                                                className="p-2.5 text-slate-400 hover:text-red-500 transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
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
                    <div className="fixed inset-0 bg-slate-900/60 z-[100] flex justify-center items-center p-4 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-slate-100">
                                    {selectedAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSave} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cliente</label>
                                    <select 
                                        required
                                        value={formData.client_id}
                                        onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                                        className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                                    >
                                        <option value="">Selecione um cliente</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Serviço</label>
                                        <select 
                                            required
                                            value={formData.service_id}
                                            onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                                            className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                                        >
                                            <option value="">Selecione</option>
                                            {services.map(s => (
                                                <option key={s.id} value={s.id}>{s.name} - R$ {s.price.toFixed(2)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Profissional</label>
                                        <select 
                                            required
                                            value={formData.professional_id}
                                            onChange={(e) => setFormData({ ...formData, professional_id: e.target.value })}
                                            className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                                        >
                                            <option value="">Selecione</option>
                                            {professionals.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Data</label>
                                        <input 
                                            type="date"
                                            required
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Horário</label>
                                        <input 
                                            type="time"
                                            required
                                            value={formData.time}
                                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                            className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                                        />
                                    </div>
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
                                        {selectedAppointment ? 'Atualizar' : 'Agendar'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode, color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-slate-900/50 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 sm:gap-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400`}>
            {icon}
        </div>
        <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{title}</p>
            <h4 className="text-2xl font-bold text-slate-950 dark:text-slate-50">{value}</h4>
        </div>
    </div>
);

const StatusBadge: React.FC<{ status: Appointment['status'] }> = ({ status }) => {
    const styles = {
        pending: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50',
        confirmed: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50',
        cancelled: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50'
    };

    const labels = {
        pending: 'Pendente',
        confirmed: 'Confirmado',
        cancelled: 'Cancelado'
    };

    return (
        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase border ${styles[status]}`}>
            {labels[status]}
        </span>
    );
};

export default AppointmentsPage;

