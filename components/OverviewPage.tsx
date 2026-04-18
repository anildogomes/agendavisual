import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  Plus, 
  ChevronRight, 
  ArrowUpRight,
  Clock,
  Scissors,
  User,
  MessageCircle,
  LayoutDashboard,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Appointment, Service, Client } from '../types';
import { motion } from 'motion/react';
import { useDemoData } from '../App';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const OverviewPage: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const { isDemo, demoData } = useDemoData();

    useEffect(() => {
        const fetchData = async () => {
            if (isDemo) {
                setAppointments(demoData.appointments);
                setClients(demoData.clients);
                setServices(demoData.services);
                setUserName('Usuário Demo');
                setLoading(false);
                return;
            }

            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            setUserName(user.user_metadata?.full_name || 'Parceiro');

            const [appRes, clientRes, serviceRes] = await Promise.all([
                supabase.from('appointments').select('*').eq('business_id', user.id),
                supabase.from('clients').select('*').eq('business_id', user.id),
                supabase.from('services').select('*').eq('business_id', user.id)
            ]);

            if (appRes.data) setAppointments(appRes.data);
            if (clientRes.data) setClients(clientRes.data);
            if (serviceRes.data) setServices(serviceRes.data);
            setLoading(false);
        };

        fetchData();
    }, []);

    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const todayApps = appointments.filter(a => a.date === today);
        const completedToday = todayApps.filter(a => a.status === 'completed');
        const reservedToday = todayApps.filter(a => a.status === 'reserved');
        
        const revenueToday = completedToday.reduce((acc, curr) => {
            const service = services.find(s => s.id === curr.service_id);
            return acc + (service?.price || 0);
        }, 0);

        // Clientes Novos (Mês)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newClients = clients.filter(c => {
            if (!c.created_at) return false;
            return new Date(c.created_at) >= thirtyDaysAgo;
        }).length;

        const activeClients = clients.filter(c => c.status === 'active').length;

        return {
            todayCount: todayApps.length,
            totalClients: clients.length,
            activeClients,
            newClients,
            revenueToday,
            upcoming: todayApps
                .filter(a => a.status !== 'cancelled')
                .sort((a, b) => a.time.localeCompare(b.time))
                .slice(0, 3)
        };
    }, [appointments, clients, services]);

    // Mock data for the chart
    const chartData = [
        { name: 'Seg', value: 400 },
        { name: 'Ter', value: 300 },
        { name: 'Qua', value: 600 },
        { name: 'Qui', value: 800 },
        { name: 'Sex', value: 500 },
        { name: 'Sáb', value: 900 },
        { name: 'Dom', value: 200 },
    ];

    return (
        <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in">
            {/* KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                <StatCard 
                    title="Agendamentos" 
                    value={stats.todayCount.toString()} 
                    trend="+12%" 
                    icon={<Calendar className="w-5 h-5" />} 
                />
                <StatCard 
                    title="Receita" 
                    value={`R$ ${stats.revenueToday.toFixed(0)}`} 
                    trend="+8%" 
                    icon={<DollarSign className="w-5 h-5" />} 
                />
                <StatCard 
                    title="Clientes" 
                    value={stats.totalClients.toString()} 
                    trend="+5%" 
                    icon={<Users className="w-5 h-5" />} 
                />
                <StatCard 
                    title="Ativos" 
                    value={stats.activeClients.toString()} 
                    trend="+3%" 
                    icon={<UserCheck className="w-5 h-5" />} 
                />
                <StatCard 
                    title="Novos" 
                    value={stats.newClients.toString()} 
                    trend="+15%" 
                    icon={<UserPlus className="w-5 h-5" />} 
                />
                <StatCard 
                    title="Ocupação" 
                    value="84%" 
                    trend="+2%" 
                    icon={<TrendingUp className="w-5 h-5" />} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Desempenho Semanal</h3>
                        <select className="bg-transparent text-xs font-bold text-slate-400 outline-none cursor-pointer">
                            <option>Últimos 7 dias</option>
                            <option>Últimos 30 dias</option>
                        </select>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EAB308" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#EAB308" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis hide />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#0f172a', 
                                        border: 'none', 
                                        borderRadius: '12px',
                                        color: '#f8fafc'
                                    }}
                                    itemStyle={{ color: '#EAB308' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="#EAB308" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorValue)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Upcoming Appointments */}
                <div className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Próximos Clientes</h3>
                        <button onClick={() => window.location.hash = 'inicio'} className="text-xs font-bold text-gold-500 hover:underline">Ver todos</button>
                    </div>
                    <div className="space-y-4">
                        {stats.upcoming.length > 0 ? (
                            stats.upcoming.map((app) => (
                                <div key={app.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-slate-900 dark:text-white font-bold text-xs shadow-sm">
                                        {app.time}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                            {/* We'd normally find the client name here, but for the preview we'll use a placeholder or the ID if not found */}
                                            Cliente X{app.client_id?.substring(0, 4) || '....'}
                                        </p>
                                        <p className="text-[10px] text-slate-700 dark:text-slate-400 font-bold uppercase tracking-wider">
                                            Confirmado
                                        </p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                </div>
                            ))
                        ) : (
                            <div className="py-10 text-center space-y-2">
                                <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                                <p className="text-xs text-slate-500">Sem agendamentos próximos.</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ações Rápidas</p>
                        <div className="grid grid-cols-2 gap-3">
                            <QuickActionBtn icon={<Plus className="w-4 h-4" />} label="Agendar" onClick={() => window.location.hash = 'inicio'} />
                            <QuickActionBtn icon={<Users className="w-4 h-4" />} label="Cliente" onClick={() => window.location.hash = 'clients'} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string, value: string, trend: string, icon: React.ReactNode }> = ({ title, value, trend, icon }) => (
    <div className="bg-white dark:bg-slate-900/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 sm:space-y-4">
        <div className="flex items-center justify-between">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 scale-90 sm:scale-100">
                {icon}
            </div>
            <span className="flex items-center gap-1 text-[8px] sm:text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                {trend}
            </span>
        </div>
        <div className="space-y-0.5 sm:space-y-1">
            <p className="text-[9px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider truncate">{title}</p>
            <h4 className="text-lg sm:text-2xl font-bold text-slate-950 dark:text-slate-50 truncate">{value}</h4>
        </div>
    </div>
);

const QuickActionBtn: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
    <button 
        onClick={onClick}
        className="flex items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 hover:bg-gold-500 hover:text-slate-900 dark:hover:bg-gold-500 dark:hover:text-slate-900 transition-all rounded-xl text-xs font-bold text-slate-800 dark:text-slate-400 border border-slate-100 dark:border-slate-700"
    >
        {icon}
        {label}
    </button>
);

export default OverviewPage;
