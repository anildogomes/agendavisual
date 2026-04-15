
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
  Filter
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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [formData, setFormData] = useState({ name: '', phone: '' });
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
                    status: 'active'
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
                .update({ name: formData.name, phone: formData.phone })
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
        setFormData(client ? { name: client.name, phone: client.phone } : { name: '', phone: '' });
        setIsModalOpen(true);
    };

    const filteredClients = useMemo(() => {
        return clients.filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            c.phone.includes(searchTerm)
        );
    }, [clients, searchTerm]);

    const stats = useMemo(() => ({
        total: clients.length,
        active: clients.filter(c => c.status === 'active').length,
        new: clients.length > 5 ? 2 : 0 // Simulado
    }), [clients]);

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-10 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard title="Total de Clientes" value={stats.total.toString()} icon={<Users className="w-5 h-5" />} color="gold" />
                <StatCard title="Clientes Ativos" value={stats.active.toString()} icon={<UserCheck className="w-5 h-5" />} color="emerald" />
                <StatCard title="Novos (Mês)" value={stats.new.toString()} icon={<UserPlus className="w-5 h-5" />} color="blue" />
            </div>

            {/* Toolbar de Busca */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nome ou telefone..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                    />
                </div>
                <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-colors">
                    <Filter className="w-4 h-4" />
                    Filtros
                </button>
            </div>

            {/* Lista de Clientes */}
            <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Sincronizando base de clientes...</p>
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                            <Users className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Nenhum cliente encontrado</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">Não encontramos resultados para sua busca ou sua base ainda está vazia.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contato</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {filteredClients.map((client) => (
                                    <motion.tr 
                                        layout
                                        key={client.id} 
                                        className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-100 to-gold-200 dark:from-gold-900/40 dark:to-gold-800/20 flex items-center justify-center text-gold-700 dark:text-gold-400 font-bold text-lg shadow-sm">
                                                    {client.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 dark:text-slate-100">{client.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium">Cadastrado recentemente</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <a 
                                                    href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all"
                                                >
                                                    <MessageCircle className="w-3.5 h-3.5" />
                                                    {client.phone}
                                                </a>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${client.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                {client.status === 'active' ? 'Fiel' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openModal(client)} className="p-2.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => { setSelectedClient(client); setIsDeleteModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
                                <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-slate-100">
                                    {selectedClient ? 'Editar Perfil' : 'Novo Cliente'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSave} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome Completo</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                                        placeholder="Ex: João Silva"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <PhoneInput 
                                        label="WhatsApp"
                                        value={formData.phone}
                                        onChange={(val) => setFormData({ ...formData, phone: val })}
                                        required
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
                                        {selectedClient ? 'Atualizar' : 'Cadastrar'}
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

export default ClientsPage;

