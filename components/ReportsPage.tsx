
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar as CalendarIcon,
  Loader2,
  DollarSign,
  Briefcase,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area
} from 'recharts';
import { supabase } from '../supabaseClient';
import { useToast, useDemoData } from '../App';
import { Appointment, Service, Professional } from '../types';
import { motion } from 'motion/react';

const ReportsPage: React.FC = () => {
    const { isDemo, demoData } = useDemoData();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('7d');
    const { addToast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            if (isDemo) {
                setAppointments(demoData.appointments);
                setServices(demoData.services);
                setProfessionals(demoData.professionals);
                setLoading(false);
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const [apptsRes, servRes, profRes] = await Promise.all([
                supabase.from('appointments').select('*').eq('business_id', user.id),
                supabase.from('services').select('*').eq('business_id', user.id),
                supabase.from('professionals').select('*').eq('business_id', user.id)
            ]);

            if (apptsRes.error || servRes.error || profRes.error) {
                addToast('Erro ao carregar dados dos relatórios.', 'error');
            } else {
                setAppointments(apptsRes.data || []);
                setServices(servRes.data || []);
                setProfessionals(profRes.data || []);
            }
            setLoading(false);
        };

        fetchData();
    }, [addToast, isDemo, demoData]);

    // Cálculos para os gráficos
    const stats = useMemo(() => {
        const confirmedAppts = appointments.filter(a => a.status === 'confirmed');
        
        const totalRevenue = confirmedAppts.reduce((acc, curr) => {
            const service = services.find(s => s.id === curr.service_id);
            return acc + (service?.price || 0);
        }, 0);

        // Agrupamento por dia para o gráfico de área
        const revenueByDay = confirmedAppts.reduce((acc: any, curr) => {
            const date = new Date(curr.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
            const service = services.find(s => s.id === curr.service_id);
            acc[date] = (acc[date] || 0) + (service?.price || 0);
            return acc;
        }, {});

        const areaChartData = Object.entries(revenueByDay).map(([name, value]) => ({ name, value }));

        const revenueByService = services.map(service => {
            const count = appointments.filter(a => a.service_id === service.id && a.status === 'confirmed').length;
            return {
                name: service.name,
                value: count * service.price
            };
        }).filter(s => s.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);

        const apptsByProfessional = professionals.map(prof => ({
            name: prof.name,
            value: appointments.filter(a => a.professional_id === prof.id).length
        })).filter(p => p.value > 0);

        // Insights lógicos
        const busiestDay = Object.entries(revenueByDay).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'N/A';
        const avgTicket = confirmedAppts.length > 0 ? totalRevenue / confirmedAppts.length : 0;

        return {
            totalRevenue,
            totalAppointments: appointments.length,
            confirmedAppointments: confirmedAppts.length,
            areaChartData,
            revenueByService,
            apptsByProfessional,
            busiestDay,
            avgTicket
        };
    }, [appointments, services, professionals]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Consolidando métricas...</p>
            </div>
        );
    }

    const COLORS = ['#EAB308', '#6366F1', '#10B981', '#F43F5E', '#8B5CF6'];

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-10 animate-fade-in">
            {/* Grid de KPIs Premium */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard 
                    title="Receita Estimada" 
                    value={`R$ ${stats.totalRevenue.toLocaleString()}`} 
                    icon={<DollarSign className="w-5 h-5" />} 
                    trend="+12.5%"
                    isPositive={true}
                    color="gold"
                />
                <KPICard 
                    title="Agendamentos" 
                    value={stats.totalAppointments.toString()} 
                    icon={<CalendarIcon className="w-5 h-5" />} 
                    trend="+4.2%"
                    isPositive={true}
                    color="blue"
                />
                <KPICard 
                    title="Ticket Médio" 
                    value={`R$ ${stats.avgTicket.toFixed(2)}`} 
                    icon={<TrendingUp className="w-5 h-5" />} 
                    trend="-1.5%"
                    isPositive={false}
                    color="emerald"
                />
                <KPICard 
                    title="Taxa de Conversão" 
                    value={`${stats.totalAppointments > 0 ? Math.round((stats.confirmedAppointments / stats.totalAppointments) * 100) : 0}%`} 
                    icon={<Zap className="w-5 h-5" />} 
                    trend="+0.8%"
                    isPositive={true}
                    color="purple"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Gráfico de Receita (Principal) */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900/50 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Fluxo de Receita</h3>
                            <p className="text-xs text-slate-500">Evolução do faturamento diário confirmado.</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
                            <ArrowUpRight className="w-3 h-3" />
                            Crescente
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.areaChartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EAB308" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#EAB308" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#0f172a', 
                                        borderRadius: '16px', 
                                        border: 'none', 
                                        color: '#fff',
                                        fontSize: '12px',
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                                    }}
                                    itemStyle={{ color: '#EAB308' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="#EAB308" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorRevenue)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Insights Side Card */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 opacity-10">
                            <Zap className="w-32 h-32" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <h3 className="text-xl font-bold">Insights Rápidos</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                        <CalendarIcon className="w-5 h-5 text-gold-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Dia de Pico</p>
                                        <p className="text-sm font-bold">{stats.busiestDay}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                        <Users className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Profissional em Alta</p>
                                        <p className="text-sm font-bold">{stats.apptsByProfessional[0]?.name || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            <button className="w-full py-3 bg-white text-slate-900 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-colors">
                                Ver Detalhes
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Serviços Mais Lucrativos</h3>
                        <div className="space-y-4">
                            {stats.revenueByService.map((service, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{service.name}</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">R$ {service.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const KPICard: React.FC<{ title: string, value: string, icon: React.ReactNode, trend: string, isPositive: boolean, color: string }> = ({ title, value, icon, trend, isPositive, color }) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
    >
        <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400`}>
                {icon}
            </div>
            <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {trend}
            </div>
        </div>
        <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{value}</h4>
        </div>
    </motion.div>
);

export default ReportsPage;

