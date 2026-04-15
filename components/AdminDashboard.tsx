
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { StatCard, DollarSign, Users, LogOut, Check, X, Briefcase, Scissors, ChartBar, ConfirmationModal, Edit, Sun, Moon, Smartphone, Bell, CreditCard, Activity, LineChart, DonutChart, PhoneInput, Star, Shield, Search, Filter, TrendingUp, User, ExternalLink } from '../constants';
import { useToast, useTheme } from '../App';
import { supabase } from '../supabaseClient';
import { SubscribedClient } from '../adminConstants';
import { mockSubscribedClients } from '../mockData';

// --- Client Edit Modal ---
type ClientEditModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (client: SubscribedClient) => void;
    client: SubscribedClient | null;
};

const ClientEditModal: React.FC<ClientEditModalProps> = ({ isOpen, onClose, onSave, client }) => {
    const [formData, setFormData] = useState<SubscribedClient | null>(null);

    useEffect(() => {
        if (client) {
            setFormData(client);
        }
    }, [client]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (formData) {
            setFormData({ ...formData, [name]: value });
        }
    };
    
    const handleToggleExempt = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (formData) {
            setFormData({ ...formData, isExempt: e.target.checked });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData) {
            onSave(formData);
        }
    };

    if (!isOpen || !formData) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-end sm:items-center p-0 sm:p-4 backdrop-blur-sm overflow-hidden">
            <div className="bg-white dark:bg-slate-800 w-full sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-w-2xl animate-slide-up rounded-t-3xl border border-slate-100 dark:border-slate-700">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 rounded-t-2xl sticky top-0 z-10 shrink-0">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">Editar Cliente</h2>
                    <button onClick={onClose} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-full text-slate-500 hover:text-slate-800 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/50">
                    <form id="edit-client-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Nome do Negócio</label>
                            <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Proprietário</label>
                            <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm" />
                        </div>
                         <div>
                            <PhoneInput
                                label="WhatsApp"
                                value={formData.phone || ''}
                                onChange={(val) => setFormData(prev => prev ? {...prev, phone: val} : null)}
                            />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Cidade</label>
                           <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full p-3 bg-white border border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm" />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Estado (UF)</label>
                           <input type="text" name="state" value={formData.state} onChange={handleChange} maxLength={2} className="w-full p-3 bg-white border border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm" />
                        </div>
                        
                        <div className="sm:col-span-2 bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl border border-primary-100 dark:border-primary-800/50">
                             <div className="flex items-center justify-between gap-4">
                                 <div>
                                    <p className="text-sm font-bold text-primary-900 dark:text-primary-200">Acesso VIP (Isento)</p>
                                    <p className="text-xs text-primary-700 dark:text-primary-400 mt-1 leading-snug">O cliente terá acesso total sem necessidade de assinatura.</p>
                                 </div>
                                 <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input type="checkbox" className="sr-only peer" checked={formData.isExempt} onChange={handleToggleExempt} />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                                </label>
                             </div>
                        </div>
                    </form>
                </div>

                <div className="p-5 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col-reverse sm:flex-row gap-3 rounded-b-2xl pb-safe shrink-0">
                    <button type="button" onClick={onClose} className="w-full py-3.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 transition-colors">Cancelar</button>
                    <button type="submit" form="edit-client-form" className="w-full py-3.5 text-sm font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-colors">Salvar Alterações</button>
                </div>
            </div>
        </div>
    );
};

// --- Sub-components for Tabs ---

const AdminNotifications: React.FC<{ clients: SubscribedClient[] }> = ({ clients }) => {
    const notifications = useMemo(() => {
        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);

        return clients
            .filter(c => new Date(c.joinDate) >= sevenDaysAgo)
            .sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime())
            .map(c => ({
                id: c.id,
                title: 'Novo Cadastro',
                message: `${c.businessName} se cadastrou na plataforma.`,
                date: c.joinDate,
                type: 'signup'
            }));
    }, [clients]);

    if (notifications.length === 0) {
        return (
            <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                Nenhuma notificação recente.
            </div>
        );
    }

    return (
        <div className="max-h-80 overflow-y-auto">
            {notifications.map((notif, idx) => (
                <div key={idx} className="p-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-start gap-3">
                    <div className="mt-1 p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full shrink-0">
                        <User className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex justify-between items-start mb-0.5 w-full">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate pr-2">
                                {notif.title}
                            </span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                                {new Date(notif.date).toLocaleDateString('pt-BR')}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">{notif.message}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const AdminFinancial: React.FC<{ clients: SubscribedClient[] }> = ({ clients }) => {
    // Cálculo do MRR Real: Apenas clientes ATIVOS que NÃO SÃO ISENTOS
    const payingClients = useMemo(() => 
        clients.filter(c => c.status === 'active' && !c.isExempt), 
    [clients]);

    const totalMRR = payingClients.reduce((acc, curr) => acc + 14.99, 0); // Preço fixo simulado

    return (
        <div className="space-y-6 animate-fade-in-down">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">MRR (Recorrente)</p>
                        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">R$ {totalMRR.toFixed(2)}</h3>
                        <p className="text-xs text-emerald-500 font-bold mt-1">+ R$ 14,99 / cliente</p>
                    </div>
                    <div className="p-3 sm:p-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                        <DollarSign className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">Assinantes Pagantes</p>
                        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{payingClients.length}</h3>
                        <p className="text-xs text-slate-400 mt-1">Exclui VIPs e Inativos</p>
                    </div>
                    <div className="p-3 sm:p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                        <CreditCard className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">Faturas Recentes</h3>
                    <span className="text-xs font-medium text-slate-400">Ativos</span>
                </div>
                
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3 font-bold">Cliente</th>
                                <th className="px-6 py-3 font-bold">Plano</th>
                                <th className="px-6 py-3 font-bold">Valor</th>
                                <th className="px-6 py-3 font-bold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {payingClients.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Nenhum assinante pagante ativo.</td>
                                </tr>
                            ) : (
                                payingClients.map(client => (
                                    <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                                            {client.businessName}
                                            <span className="block text-xs text-slate-500 font-normal">{client.email}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">Standard Mensal</td>
                                        <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">R$ 14,99</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                Pago
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile List View */}
                <div className="sm:hidden p-4 space-y-3">
                    {payingClients.length === 0 ? (
                        <p className="text-center text-slate-500 text-sm py-4">Nenhum assinante pagante ativo.</p>
                    ) : (
                        payingClients.map(client => (
                            <div key={client.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-600">
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-0.5">{client.businessName}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Standard Mensal</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mb-1">R$ 14,99</p>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 uppercase">
                                        Pago
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const AdminActivityLog: React.FC<{ clients: SubscribedClient[] }> = ({ clients }) => {
    const activities = useMemo(() => {
        return [...clients]
            .sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime())
            .map(c => ({
                id: c.id,
                date: c.joinDate,
                business: c.businessName,
                owner: c.ownerName,
                action: 'Conta Criada'
            }));
    }, [clients]);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden animate-fade-in-down h-full max-h-[600px] flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary-500" /> Timeline de Atividades
                </h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700 overflow-y-auto flex-1 p-2">
                {activities.map((act, i) => (
                    <div key={i} className="p-4 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors rounded-xl relative group">
                        {/* Connector Line */}
                        {i !== activities.length - 1 && (
                            <div className="absolute left-[27px] top-10 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700 -z-10 group-hover:bg-slate-300 dark:group-hover:bg-slate-600 transition-colors"></div>
                        )}
                        
                        <div className="mt-1 relative z-10">
                            <div className="w-6 h-6 rounded-full bg-blue-500 border-4 border-white dark:border-slate-800 shadow-sm ring-2 ring-blue-100 dark:ring-blue-900/30"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate pr-2">
                                    {act.business}
                                </p>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                                    {new Date(act.date).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                                {act.action} por <span className="text-primary-600 dark:text-primary-400 font-medium">{act.owner}</span>
                            </p>
                        </div>
                    </div>
                ))}
                {activities.length === 0 && (
                    <div className="p-8 text-center text-slate-500 text-sm">Nenhuma atividade registrada ainda.</div>
                )}
            </div>
        </div>
    );
};

// --- Admin Overview with Manual Controls ---

const AdminOverview: React.FC<{ 
    clients: SubscribedClient[], 
    setFilter: (f: 'all' | 'active' | 'inactive') => void, 
    filter: 'all' | 'active' | 'inactive',
    searchQuery: string,
    setSearchQuery: (s: string) => void,
    onEdit: (c: SubscribedClient) => void,
    onToggleStatus: (c: SubscribedClient) => void,
    onToggleVIP: (c: SubscribedClient) => void
}> = ({ clients, setFilter, filter, searchQuery, setSearchQuery, onEdit, onToggleStatus, onToggleVIP }) => {
    
    const keyMetrics = useMemo(() => {
        const activeClients = clients.filter(c => c.status === 'active');
        const payingClients = activeClients.filter(c => !c.isExempt);
        const vipClients = activeClients.filter(c => c.isExempt);
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newClients = clients.filter(c => new Date(c.joinDate) >= startOfMonth).length;

        return {
            totalClients: clients.length,
            activeClients: activeClients.length,
            newClients,
            vipCount: vipClients.length,
        };
    }, [clients]);

    const filteredClients = useMemo(() => {
        return clients
            .filter(c => filter === 'all' || c.status === filter)
            .filter(c =>
                (c.businessName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.ownerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.email || '').toLowerCase().includes(searchQuery.toLowerCase())
            );
    }, [clients, filter, searchQuery]);

    return (
        <div className="space-y-6 animate-fade-in-down">
            {/* KPI Cards: Grid on mobile for symmetry, Flex on desktop */}
            <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4 sm:overflow-x-auto sm:pb-2">
                <div className="sm:min-w-[200px] sm:flex-1 h-full">
                    <StatCard icon={<Users className="w-5 h-5 sm:w-6 sm:h-6"/>} title="Total Clientes" value={keyMetrics.totalClients} color="primary" />
                </div>
                <div className="sm:min-w-[200px] sm:flex-1 h-full">
                    <StatCard icon={<Check className="w-5 h-5 sm:w-6 sm:h-6"/>} title="Ativos" value={keyMetrics.activeClients} color="emerald" />
                </div>
                <div className="sm:min-w-[200px] sm:flex-1 h-full">
                    <StatCard icon={<Shield className="w-5 h-5 sm:w-6 sm:h-6"/>} title="VIPs" value={keyMetrics.vipCount} color="gold" />
                </div>
                <div className="sm:min-w-[200px] sm:flex-1 h-full">
                    <StatCard icon={<ChartBar className="w-5 h-5 sm:w-6 sm:h-6"/>} title="Novos (Mês)" value={keyMetrics.newClients} color="primary" />
                </div>
            </div>
            
            {/* Client Management */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                
                {/* Filters Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">Gerenciar Clientes</h3>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="search"
                                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white transition-all shadow-sm"
                                placeholder="Buscar nome, email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl shrink-0 overflow-x-auto">
                            {['all', 'active', 'inactive'].map(f => (
                                <button 
                                    key={f}
                                    onClick={() => setFilter(f as any)} 
                                    className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg capitalize transition-all whitespace-nowrap ${filter === f ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-600 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    {f === 'all' ? 'Todos' : f === 'active' ? 'Ativos' : 'Inativos'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-0">
                    {/* Header for Desktop */}
                    <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-700/50 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                        <div className="col-span-4">Cliente</div>
                        <div className="col-span-3">Contato</div>
                        <div className="col-span-2">Acesso</div>
                        <div className="col-span-3 text-right">Controles</div>
                    </div>

                    <div className="space-y-4 sm:space-y-0">
                        {filteredClients.map(client => (
                            <div key={client.id} className="group flex flex-col sm:grid sm:grid-cols-12 gap-4 sm:items-center bg-white dark:bg-slate-800 sm:px-6 sm:py-4 transition-all sm:hover:bg-slate-50 dark:sm:hover:bg-slate-700/30 sm:border-b sm:border-slate-100 dark:sm:border-slate-700 rounded-2xl sm:rounded-none border border-slate-100 dark:border-slate-700 p-4 shadow-sm sm:shadow-none hover:shadow-md sm:hover:shadow-none">
                                
                                {/* Info (Mobile: Card Header / Desktop: Col 1) */}
                                <div className="sm:col-span-4 flex items-center justify-between sm:justify-start gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-12 h-12 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 shadow-sm ${client.isExempt ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'}`}>
                                            {(client.businessName || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-sm truncate flex items-center gap-1">
                                                {client.businessName}
                                            </h4>
                                            <p className="text-sm sm:text-xs text-slate-500 dark:text-slate-400 truncate">{client.ownerName}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Mobile Only: Status Indicator Top Right */}
                                    <div className="sm:hidden flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-600">
                                         {client.isExempt && <Shield className="w-3.5 h-3.5 text-amber-500" />}
                                         <div className={`w-2.5 h-2.5 rounded-full ${client.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                    </div>
                                </div>

                                {/* Contact (Desktop: Col 2 / Mobile: Body) */}
                                <div className="sm:col-span-3 text-sm text-slate-600 dark:text-slate-300 sm:pl-0 border-t border-slate-100 dark:border-slate-700 sm:border-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
                                    <div className="flex items-center gap-2 mb-1 sm:mb-0">
                                        <span className="truncate font-medium">{client.email}</span>
                                    </div>
                                    <div className="text-xs text-slate-400 font-mono">{client.phone}</div>
                                </div>

                                {/* Status Tags (Desktop Only) */}
                                <div className="col-span-2 hidden sm:flex flex-wrap gap-2">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${client.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                        {client.status === 'active' ? 'Liberado' : 'Bloqueado'}
                                    </span>
                                    {client.isExempt && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                            VIP
                                        </span>
                                    )}
                                </div>

                                {/* Control Buttons (Desktop: Col 4 / Mobile: Footer Grid) */}
                                <div className="sm:col-span-3 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t border-slate-100 dark:border-slate-700 sm:border-0">
                                    <div className="grid grid-cols-4 sm:flex sm:justify-end gap-2">
                                        {/* WhatsApp */}
                                        <a href={`https://wa.me/${(client.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="h-10 sm:h-auto sm:p-2 bg-green-50 text-green-600 sm:bg-transparent sm:text-slate-400 sm:hover:text-green-600 sm:hover:bg-green-50 rounded-xl transition-colors flex items-center justify-center border border-slate-100 sm:border-0 dark:border-slate-600 dark:bg-slate-700/50 sm:dark:bg-transparent" title="WhatsApp">
                                            <Smartphone className="w-5 h-5 sm:w-4 sm:h-4"/>
                                        </a>
                                        
                                        {/* Edit */}
                                        <button onClick={() => onEdit(client)} className="h-10 sm:h-auto sm:p-2 bg-slate-50 text-slate-600 sm:bg-transparent sm:text-slate-400 sm:hover:text-blue-600 sm:hover:bg-blue-50 rounded-xl transition-colors flex items-center justify-center border border-slate-100 sm:border-0 dark:border-slate-600 dark:bg-slate-700/50 sm:dark:bg-transparent" title="Editar">
                                            <Edit className="w-5 h-5 sm:w-4 sm:h-4" />
                                        </button>

                                        <div className="hidden sm:block w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1 self-center"></div>

                                        {/* Toggle VIP */}
                                        <button 
                                            onClick={() => onToggleVIP(client)}
                                            className={`h-10 sm:h-auto sm:p-2 rounded-xl transition-colors flex items-center justify-center border border-slate-100 sm:border-0 dark:border-slate-600 dark:bg-slate-700/50 sm:dark:bg-transparent ${client.isExempt ? 'bg-amber-50 text-amber-600 sm:bg-amber-50 sm:hover:bg-amber-100' : 'bg-slate-50 text-slate-400 sm:bg-transparent sm:hover:text-amber-500 sm:hover:bg-amber-50'}`}
                                            title={client.isExempt ? "Remover VIP" : "Tornar VIP"}
                                        >
                                            <Shield className="w-5 h-5 sm:w-4 sm:h-4" />
                                        </button>

                                        {/* Toggle Access */}
                                        <button 
                                            onClick={() => onToggleStatus(client)}
                                            className={`h-10 sm:h-auto sm:p-2 rounded-xl transition-colors flex items-center justify-center gap-1 font-bold text-xs border border-slate-100 sm:border-0 dark:border-slate-600 dark:bg-slate-700/50 sm:dark:bg-transparent ${client.status === 'active' ? 'bg-red-50 text-red-600 sm:bg-transparent sm:text-red-500 sm:hover:bg-red-50' : 'bg-emerald-100 text-emerald-700 sm:bg-emerald-50 sm:text-emerald-600 sm:hover:bg-emerald-100'}`}
                                            title={client.status === 'active' ? "Bloquear Acesso" : "Liberar Acesso"}
                                        >
                                            {client.status === 'active' ? <X className="w-5 h-5 sm:w-4 sm:h-4" /> : <Check className="w-5 h-5 sm:w-4 sm:h-4" />}
                                            {client.status !== 'active' && <span className="hidden sm:inline">Liberar</span>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredClients.length === 0 && (
                            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                                Nenhum cliente encontrado.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Main Component ---

const AdminDashboard: React.FC<{ onLogout: () => void; isDemo?: boolean }> = ({ onLogout, isDemo }) => {
    const [activeView, setActiveView] = useState('overview');
    const { theme, toggleTheme } = useTheme();
    const { addToast } = useToast();
    
    // Data State
    const [clients, setClients] = useState<SubscribedClient[]>([]);
    const [loading, setLoading] = useState(true);
    
    // UI States
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [clientToEdit, setClientToEdit] = useState<SubscribedClient | null>(null);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    
    // Confirmation Modals
    const [confirmAction, setConfirmAction] = useState<{
        isOpen: boolean;
        type: 'status' | 'vip';
        client: SubscribedClient | null;
    }>({ isOpen: false, type: 'status', client: null });

    const fetchClients = useCallback(async () => {
        if (isDemo) {
            setClients(mockSubscribedClients);
            setLoading(false);
            return;
        }
        setLoading(true);
        const { data: businesses, error } = await supabase.from('businesses').select('*').order('created_at', { ascending: false });

        if (error) {
            addToast('Erro ao carregar clientes.', 'error');
            setLoading(false);
            return;
        }

        // Safe mapping to prevent crashes on null values
        const mappedClients: SubscribedClient[] = (businesses || []).map((b: any) => {
            return {
                id: b.id,
                businessName: b.business_name || 'Sem Nome',
                ownerName: b.full_name || 'Desconhecido',
                email: b.contact_email || b.email || 'N/A', 
                phone: b.phone || '',
                city: b.city || '',
                state: b.state || '',
                status: b.status || 'inactive',
                joinDate: b.created_at ? new Date(b.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                plan: 'Standard',
                monthlyRevenue: b.is_exempt ? 0 : 14.99,
                isExempt: b.is_exempt === true,
            };
        });

        setClients(mappedClients);
        setLoading(false);
    }, [addToast]);
    
    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    // Notification Logic
    const notificationCount = useMemo(() => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(new Date().getDate() - 7);
        return clients.filter(c => new Date(c.joinDate) >= sevenDaysAgo).length;
    }, [clients]);

    // Action Handlers
    const handleSaveClient = async (updatedClient: SubscribedClient) => {
        const { error } = await supabase
            .from('businesses')
            .update({
                business_name: updatedClient.businessName,
                full_name: updatedClient.ownerName,
                phone: updatedClient.phone,
                city: updatedClient.city,
                state: updatedClient.state,
                contact_email: updatedClient.email,
                is_exempt: updatedClient.isExempt,
            })
            .eq('id', updatedClient.id);

        if (error) addToast(`Erro: ${error.message}`, 'error');
        else {
            addToast('Dados atualizados!', 'success');
            fetchClients();
        }
        setIsEditModalOpen(false);
        setClientToEdit(null);
    };

    const executeToggleStatus = async () => {
        if (!confirmAction.client) return;
        const newStatus = confirmAction.client.status === 'active' ? 'inactive' : 'active';
        const payload: any = { status: newStatus };
        
        // If activating, ensure subscription status matches to prevent "Restricted View" on client side
        if (newStatus === 'active') {
            payload.subscription_status = 'active'; 
        } else {
            payload.subscription_status = 'canceled'; // or inactive
        }

        const { error } = await supabase.from('businesses').update(payload).eq('id', confirmAction.client.id);

        if (error) addToast('Erro ao alterar status.', 'error');
        else {
            addToast(`Acesso ${newStatus === 'active' ? 'LIBERADO' : 'BLOQUEADO'} com sucesso.`, newStatus === 'active' ? 'success' : 'info');
            fetchClients();
        }
        setConfirmAction({ isOpen: false, type: 'status', client: null });
    };

    const executeToggleVIP = async () => {
        if (!confirmAction.client) return;
        const newVipStatus = !confirmAction.client.isExempt;
        
        const { error } = await supabase.from('businesses').update({ is_exempt: newVipStatus }).eq('id', confirmAction.client.id);

        if (error) addToast('Erro ao alterar VIP.', 'error');
        else {
            addToast(`Cliente agora é ${newVipStatus ? 'VIP (Isento)' : 'Normal (Pagante)'}.`, 'success');
            fetchClients();
        }
        setConfirmAction({ isOpen: false, type: 'vip', client: null });
    };

    const navItems = [
        { id: 'overview', label: 'Gestão de Clientes', icon: Users },
        { id: 'financial', label: 'Financeiro', icon: DollarSign },
        { id: 'activity', label: 'Atividades', icon: Activity },
    ];

    const activeLabel = navItems.find(item => item.id === activeView)?.label || 'Painel';

    return (
        <div className="flex flex-col h-screen font-sans overflow-hidden transition-colors duration-300">
            {/* Demo Mode Banner */}
            {isDemo && (
                <div className="bg-primary-600 text-white px-4 py-2 flex justify-between items-center z-50 shadow-md">
                    <div className="flex items-center gap-2">
                        <div className="bg-white/20 p-1 rounded">
                            <Scissors className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs sm:text-sm font-bold">Modo de Demonstração: Painel Administrativo</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => window.location.hash = '#'}
                            className="bg-white text-primary-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors"
                        >
                            Sair da Demo
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-20">
                <div className="h-20 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/20 text-white">
                            <Scissors className="w-5 h-5"/>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Agenda<span className="text-primary-600 dark:text-primary-400">Visual</span></h1>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                                    activeView === item.id
                                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 shadow-sm'
                                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700/50'
                            }`}
                        >
                            <item.icon className={`w-5 h-5 mr-3 ${activeView === item.id ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}`} />
                            {item.label}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <button onClick={onLogout} className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors">
                        <LogOut className="w-5 h-5 mr-3" />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header */}
                <header className="h-16 sm:h-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-2 sm:px-8 z-20 shrink-0">
                     <div className="flex items-center gap-1 sm:gap-3 min-w-0 flex-1">
                        <div className="md:hidden w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white">
                            <Scissors className="w-4 h-4"/>
                        </div>
                        <h2 className="text-base sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">{activeLabel}</h2>
                     </div>

                     <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                        {/* Notification Center */}
                        <div className="relative">
                            <button 
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} 
                                className="p-2.5 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 relative"
                            >
                                <Bell className="w-5 h-5" />
                                {notificationCount > 0 && (
                                    <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
                                )}
                            </button>
                            {isNotificationsOpen && (
                                <div className="absolute right-[-3rem] sm:right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-fade-in-down origin-top-right">
                                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800">
                                        Últimos Cadastros (7 dias)
                                    </div>
                                    <AdminNotifications clients={clients} />
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => window.open(window.location.origin, '_blank')}
                            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gold-500 text-slate-900 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-gold-500/30 hover:bg-gold-400 transition-all whitespace-nowrap" 
                            title="Ver Landing Page"
                        >
                           <span>Meu Site</span>
                        </button>

                        <button onClick={toggleTheme} className="p-2.5 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                             {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </button>
                        <button onClick={onLogout} className="md:hidden p-2.5 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 transition-colors bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                             <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 dark:bg-slate-900 pb-24 md:pb-8">
                    <div className="max-w-7xl mx-auto p-4 sm:p-8">
                        {activeView === 'overview' && (
                            <AdminOverview 
                                clients={clients}
                                filter={filter}
                                setFilter={setFilter}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                onEdit={(c) => { setClientToEdit(c); setIsEditModalOpen(true); }}
                                onToggleStatus={(c) => setConfirmAction({ isOpen: true, type: 'status', client: c })}
                                onToggleVIP={(c) => setConfirmAction({ isOpen: true, type: 'vip', client: c })}
                            />
                        )}
                        {activeView === 'financial' && <AdminFinancial clients={clients} />}
                        {activeView === 'activity' && <AdminActivityLog clients={clients} />}
                    </div>
                </main>

                {/* Mobile Bottom Nav */}
                <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-2xl z-50 h-16 px-6 flex items-center justify-between border border-slate-800 dark:border-slate-200">
                    {navItems.map(item => {
                        const isActive = activeView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveView(item.id)}
                                className={`flex flex-col items-center justify-center gap-1 transition-all ${isActive ? 'text-primary-400 dark:text-primary-600 scale-110' : 'text-slate-400 dark:text-slate-500 hover:text-slate-200'}`}
                            >
                                <item.icon className="w-6 h-6" />
                            </button>
                        )
                    })}
                </nav>
            </div>

            {/* Modals */}
            <ClientEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveClient}
                client={clientToEdit}
            />
            
            <ConfirmationModal
                isOpen={confirmAction.isOpen}
                onClose={() => setConfirmAction({ ...confirmAction, isOpen: false })}
                onConfirm={confirmAction.type === 'status' ? executeToggleStatus : executeToggleVIP}
                title={
                    confirmAction.type === 'status' 
                    ? `${confirmAction.client?.status === 'active' ? 'Bloquear' : 'Liberar'} Acesso`
                    : `${confirmAction.client?.isExempt ? 'Remover' : 'Conceder'} VIP`
                }
                message={
                    confirmAction.type === 'status'
                    ? `Tem certeza que deseja ${confirmAction.client?.status === 'active' ? 'BLOQUEAR' : 'LIBERAR'} o acesso de ${confirmAction.client?.businessName}?`
                    : `Tem certeza que deseja ${confirmAction.client?.isExempt ? 'remover o status VIP' : 'conceder status VIP (Isento de Pagamento)'} para ${confirmAction.client?.businessName}?`
                }
                confirmButtonText="Confirmar"
            />

             <style>{`
                .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
            `}</style>
            </div>
        </div>
    );
};

export default AdminDashboard;
