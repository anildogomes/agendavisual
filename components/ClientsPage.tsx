
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Loader2,
  X,
  Check,
  MessageCircle,
  TrendingUp,
  UserPlus,
  UserCheck,
  ChevronRight,
  Filter,
  Info,
  ChevronDown,
  History,
  UserMinus,
  FileText,
  Scissors,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast, useDemoData } from '../App';
import { Client } from '../types';
import { PhoneInput, ConfirmationModal } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

const ClientsPage: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'new'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [formData, setFormData] = useState({ name: '', phone: '', notes: '' });
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const { addToast } = useToast();
    const { isDemo, demoData, setDemoData } = useDemoData();

    const fetchClients = useCallback(async () => {
        if (isDemo) {
            setClients(demoData.clients);
            setLoading(false);
            return;
        }
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('business_id', user.id)
            .order('name', { ascending: true });

        if (error) {
            addToast('Erro ao carregar clientes.', 'error');
        } else {
            setClients(data || []);
        }
        setLoading(false);
    }, [addToast]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isDemo) {
            if (selectedClient) {
                setDemoData(prev => ({
                    ...prev,
                    clients: prev.clients.map(c => c.id === selectedClient.id ? { ...c, ...formData } : c)
                }));
                addToast('Cliente atualizado com sucesso (Modo Demo)!', 'success');
            } else {
                const newClient: Client = {
                    id: Math.random().toString(36).substr(2, 9),
                    business_id: demoData.business.id,
                    name: formData.name,
                    phone: formData.phone,
                    status: 'active',
                    created_at: new Date().toISOString()
                };
                setDemoData(prev => ({
                    ...prev,
                    clients: [newClient, ...prev.clients]
                }));
                addToast('Cliente cadastrado com sucesso (Modo Demo)!', 'success');
            }
            setIsModalOpen(false);
            fetchClients();
            return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (selectedClient) {
            const { error } = await supabase
                .from('clients')
                .update({ 
                    name: formData.name, 
                    phone: formData.phone,
                    notes: formData.notes 
                })
                .eq('id', selectedClient.id);

            if (error) addToast('Erro ao atualizar cliente.', 'error');
            else {
                addToast('Cliente atualizado com sucesso!', 'success');
                setIsModalOpen(false);
                fetchClients();
            }
        } else {
            const { error } = await supabase
                .from('clients')
                .insert([{ ...formData, business_id: user.id, status: 'active' }]);

            if (error) addToast('Erro ao cadastrar cliente.', 'error');
            else {
                addToast('Cliente cadastrado com sucesso!', 'success');
                setIsModalOpen(false);
                fetchClients();
            }
        }
    };

    const toggleStatus = async (client: Client) => {
        const newStatus = client.status === 'active' ? 'inactive' : 'active';
        if (isDemo) {
            setDemoData(prev => ({
                ...prev,
                clients: prev.clients.map(c => c.id === client.id ? { ...c, status: newStatus } : c)
            }));
            addToast(`Cliente ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso (Modo Demo)!`, 'success');
            fetchClients();
            return;
        }

        const { error } = await supabase
            .from('clients')
            .update({ status: newStatus })
            .eq('id', client.id);

        if (error) addToast('Erro ao alterar status do cliente.', 'error');
        else {
            addToast(`Cliente ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso!`, 'success');
            fetchClients();
        }
    };

    const handleDelete = async () => {
        if (!selectedClient) return;
        if (isDemo) {
            setDemoData(prev => ({
                ...prev,
                clients: prev.clients.filter(c => c.id !== selectedClient.id)
            }));
            addToast('Cliente excluído com sucesso (Modo Demo)!', 'success');
            setIsDeleteModalOpen(false);
            fetchClients();
            return;
        }
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', selectedClient.id);

        if (error) addToast('Erro ao excluir cliente.', 'error');
        else {
            addToast('Cliente excluído com sucesso!', 'success');
            setIsDeleteModalOpen(false);
            fetchClients();
        }
    };

    const openModal = (client: Client | null = null) => {
        setSelectedClient(client);
        setFormData(client ? { name: client.name, phone: client.phone, notes: client.notes || '' } : { name: '', phone: '', notes: '' });
        setIsModalOpen(true);
    };

    const filteredClients = useMemo(() => {
        return clients.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                c.phone.includes(searchTerm);
            
            let matchesStatus = false;
            if (statusFilter === 'all') {
                matchesStatus = true;
            } else if (statusFilter === 'new') {
                // Considera "novo" se cadastrado nos últimos 30 dias
                if (c.created_at) {
                    const createdAtDate = new Date(c.created_at);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    matchesStatus = createdAtDate >= thirtyDaysAgo;
                } else {
                    matchesStatus = false;
                }
            } else {
                matchesStatus = c.status === statusFilter;
            }

            return matchesSearch && matchesStatus;
        });
    }, [clients, searchTerm, statusFilter]);

    return (
        <div className="max-w-7xl mx-auto p-3 sm:p-8 space-y-4 sm:space-y-10 animate-fade-in mb-20">
            {/* Action Bar (Simplified - No Redundancy) */}
            <div className="flex justify-end mb-2">
                <button 
                    onClick={() => openModal()}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-slate-200 dark:shadow-none"
                >
                    <UserPlus className="w-5 h-5" />
                    Adicionar Cliente
                </button>
            </div>

            {/* Search & Filter Section (Based on UI Image) */}
            <div className="space-y-4">
                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-gold-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Buscar nome ou telefone..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm focus:ring-4 focus:ring-gold-500/10 focus:border-gold-500 outline-none transition-all dark:text-white"
                    />
                </div>

                <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl sm:max-w-xl overflow-x-auto no-scrollbar">
                    <button 
                        onClick={() => setStatusFilter('all')}
                        className={`flex-1 min-w-[80px] py-3 text-[10px] sm:text-xs font-bold rounded-[14px] transition-all whitespace-nowrap ${
                            statusFilter === 'all' 
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                        }`}
                    >
                        Total
                    </button>
                    <button 
                        onClick={() => setStatusFilter('active')}
                        className={`flex-1 min-w-[80px] py-3 text-[10px] sm:text-xs font-bold rounded-[14px] transition-all whitespace-nowrap ${
                            statusFilter === 'active' 
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                        }`}
                    >
                        Ativos
                    </button>
                    <button 
                        onClick={() => setStatusFilter('new')}
                        className={`flex-1 min-w-[80px] py-3 text-[10px] sm:text-xs font-bold rounded-[14px] transition-all whitespace-nowrap ${
                            statusFilter === 'new' 
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                        }`}
                    >
                        Novos (Mês)
                    </button>
                    <button 
                        onClick={() => setStatusFilter('inactive')}
                        className={`flex-1 min-w-[80px] py-3 text-[10px] sm:text-xs font-bold rounded-[14px] transition-all whitespace-nowrap ${
                            statusFilter === 'inactive' 
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                        }`}
                    >
                        Inativos
                    </button>
                </div>
            </div>

            {/* Lista de Clientes */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 p-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Sincronizando base de clientes...</p>
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 p-20 flex flex-col items-center justify-center text-center px-4">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                            <Users className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Nenhum cliente encontrado</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">Não encontramos resultados para sua busca ou sua base ainda está vazia.</p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {filteredClients.map((client) => (
                            <ClientCard 
                                key={client.id}
                                client={client}
                                onEdit={() => openModal(client)}
                                onDelete={() => { setSelectedClient(client); setIsDeleteModalOpen(true); }}
                                onToggleStatus={() => toggleStatus(client)}
                                onHistory={() => { setSelectedClient(client); setIsHistoryOpen(true); }}
                            />
                        ))}
                    </AnimatePresence>
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
                            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="text-2xl font-serif font-black text-slate-900 dark:text-slate-100 italic">
                                    {selectedClient ? 'Editar Perfil' : 'Novo Cliente'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative -top-1">
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>
                            <form onSubmit={handleSave} className="p-8 space-y-8 max-h-[80vh] overflow-y-auto no-scrollbar">
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Nome Completo</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-gold-500 outline-none transition-all dark:text-white"
                                            placeholder="Ex: João Silva"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">WhatsApp / Telefone</label>
                                        <PhoneInput 
                                            value={formData.phone}
                                            onChange={(val) => setFormData({ ...formData, phone: val })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            Observações
                                        </label>
                                        <textarea 
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-gold-500 outline-none transition-all dark:text-white min-h-[120px] resize-none"
                                            placeholder="Detalhes sobre o cliente, preferências ou avisos importantes..."
                                        />
                                    </div>
                                </div>
                                <div className="pt-4 flex items-center justify-between gap-4 pb-2">
                                    <button 
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-slate-700 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        className="px-10 py-4 text-xs font-black text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl uppercase tracking-widest"
                                    >
                                        Salvar
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
                title="Excluir Cliente"
                message="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita e removerá o histórico associado."
            />

            {/* Modal de Histórico */}
            <AnimatePresence>
                {isHistoryOpen && selectedClient && (
                    <div className="fixed inset-0 bg-slate-900/60 z-[130] flex justify-center items-center p-4 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center text-slate-900 font-bold">
                                        {selectedClient.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Histórico de {selectedClient.name}</h3>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Resumo de Atividades</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-6">
                                {selectedClient.notes ? (
                                    <div className="p-6 bg-gold-50 dark:bg-gold-500/10 border border-gold-100 dark:border-gold-500/20 rounded-3xl space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gold-600 dark:text-gold-400 uppercase tracking-widest">
                                            <FileText className="w-3.5 h-3.5" />
                                            Observações Internas
                                        </div>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{selectedClient.notes}"</p>
                                    </div>
                                ) : (
                                    <p className="text-center text-xs text-slate-400 py-10">Sem observações ou histórico detalhado ainda.</p>
                                )}

                                <div className="space-y-4">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Agendamentos Recentes</p>
                                    <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl gap-3">
                                        <History className="w-8 h-8 text-slate-200" />
                                        <p className="text-xs text-slate-400">Funcionalidade de histórico completo em breve.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                                <button 
                                    onClick={() => setIsHistoryOpen(false)}
                                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl shadow-xl hover:scale-[1.02] transition-all"
                                >
                                    Fechar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ClientCard: React.FC<{ 
    client: Client, 
    onEdit: () => void, 
    onDelete: () => void, 
    onToggleStatus: () => void,
    onHistory: () => void
}> = ({ client, onEdit, onDelete, onToggleStatus, onHistory }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [stats, setStats] = useState({ services: 0, absences: 0 });
    const [loadingStats, setLoadingStats] = useState(false);
    const { isDemo, demoData } = useDemoData();

    useEffect(() => {
        if (isExpanded) {
            fetchStats();
        }
    }, [isExpanded]);

    const fetchStats = async () => {
        setLoadingStats(true);
        if (isDemo) {
            const clientAppointments = demoData.appointments.filter(a => a.client_id === client.id);
            setStats({
                services: clientAppointments.filter(a => a.status === 'completed').length,
                absences: clientAppointments.filter(a => a.status === 'no_show').length
            });
        } else {
            try {
                const { data, error } = await supabase
                    .from('appointments')
                    .select('status')
                    .eq('client_id', client.id);
                
                if (!error && data) {
                    setStats({
                        services: data.filter(a => a.status === 'completed').length,
                        absences: data.filter(a => a.status === 'no_show').length
                    });
                }
            } catch (err) {
                console.error('Error fetching client stats', err);
            }
        }
        setLoadingStats(false);
    };

    const initials = client.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
        >
            <div 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-5 sm:p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-lg sm:text-xl shrink-0">
                        {initials}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h4 className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100 truncate pr-2">{client.name}</h4>
                        <div className="flex items-center gap-2">
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-base">
                                ({client.phone.substring(0, 2)}) {client.phone.substring(2)}
                            </p>
                            <a 
                                href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} 
                                target="_blank" 
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 text-emerald-500 hover:scale-110 transition-transform"
                                title="WhatsApp"
                            >
                                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-emerald-500/10" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className={`p-2 rounded-full transition-all ${isExpanded ? 'rotate-180 text-gold-500 bg-gold-50 dark:bg-gold-500/10' : 'text-slate-300'}`}>
                    <ChevronDown className="w-6 h-6" />
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20"
                    >
                        <div className="p-6 sm:p-8 space-y-8">
                            {/* Stats Summary Area */}
                            <div className="grid grid-cols-2 gap-4">
                                <StatBox 
                                    label="Serviços" 
                                    value={loadingStats ? '...' : stats.services.toString()} 
                                    icon={<Scissors className="w-4 h-4" />}
                                    color="gold"
                                />
                                <StatBox 
                                    label="Faltas" 
                                    value={loadingStats ? '...' : stats.absences.toString()} 
                                    icon={<UserMinus className="w-4 h-4" />}
                                    color="red"
                                />
                            </div>

                            {/* Notes Area */}
                            <div className="space-y-3">
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5" />
                                    Notas e Preferências
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    {client.notes ? `"${client.notes}"` : "Nenhuma observação registrada para este cliente."}
                                </p>
                            </div>

                            {/* Action Buttons Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <ActionButton icon={<History className="w-4 h-4" />} label="Histórico" onClick={onHistory} />
                                <ActionButton icon={<Edit className="w-4 h-4" />} label="Editar" onClick={onEdit} />
                                <ActionButton 
                                    icon={client.status === 'active' ? <UserMinus className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />} 
                                    label={client.status === 'active' ? 'Desativar' : 'Ativar'} 
                                    onClick={onToggleStatus} 
                                />
                                <ActionButton 
                                    icon={<Trash2 className="w-4 h-4" />} 
                                    label="Excluir" 
                                    variant="danger" 
                                    onClick={onDelete} 
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const StatBox: React.FC<{ label: string, value: string, icon: React.ReactNode, color: 'gold' | 'red' }> = ({ label, value, icon, color }) => (
    <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color === 'gold' ? 'bg-gold-50 text-gold-600 dark:bg-gold-500/10 dark:text-gold-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{value}</p>
        </div>
    </div>
);

const ActionButton: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, variant?: 'default' | 'danger' }> = ({ icon, label, onClick, variant = 'default' }) => (
    <button 
        onClick={onClick}
        className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-bold text-xs transition-all active:scale-95 border ${
            variant === 'danger' 
                ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30 dark:hover:bg-red-900/20' 
                : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
        }`}
    >
        {icon}
        {label}
    </button>
);

const DropdownItem: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, variant?: 'default' | 'danger' }> = ({ icon, label, onClick, variant = 'default' }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
            variant === 'danger' 
                ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' 
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-950 dark:hover:text-white'
        }`}
    >
        {icon}
        {label}
    </button>
);

export default ClientsPage;

