import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Loader2,
  DollarSign,
  Download,
  Zap,
  Scissors,
  Calendar,
  UserCheck,
  UserPlus,
  ArrowUpRight,
  Clock,
  ChevronRight
} from 'lucide-react';
import { 
  XAxis, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import { supabase } from '../supabaseClient';
import { useToast, useDemoData } from '../App';
import { Appointment, Service, Professional, Client } from '../types';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ReportsPage: React.FC = () => {
    const { isDemo, demoData } = useDemoData();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();
    
    // Refs for specific report sections
    const kpiRef = useRef<HTMLDivElement>(null);
    const cashFlowRef = useRef<HTMLDivElement>(null);
    const staffReportRef = useRef<HTMLDivElement>(null);
    const clientReportRef = useRef<HTMLDivElement>(null);
    const upcomingRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            if (isDemo) {
                setAppointments(demoData.appointments);
                setServices(demoData.services);
                setProfessionals(demoData.professionals);
                setClients(demoData.clients);
                setLoading(false);
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const [apptsRes, servRes, profRes, clientRes] = await Promise.all([
                supabase.from('appointments').select('*').eq('business_id', user.id),
                supabase.from('services').select('*').eq('business_id', user.id),
                supabase.from('professionals').select('*').eq('business_id', user.id),
                supabase.from('clients').select('*').eq('business_id', user.id)
            ]);

            if (apptsRes.error || servRes.error || profRes.error || clientRes.error) {
                addToast('Erro ao carregar dados.', 'error');
            } else {
                setAppointments(apptsRes.data || []);
                setServices(servRes.data || []);
                setProfessionals(profRes.data || []);
                setClients(clientRes.data || []);
            }
            setLoading(false);
        };

        fetchData();
    }, [addToast, isDemo, demoData]);

    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const todayApps = appointments.filter(a => a.date === today);
        const completedToday = todayApps.filter(a => a.status === 'completed');
        const completedAll = appointments.filter(a => a.status === 'completed');
        
        const totalRevenue = completedAll.reduce((acc, curr) => {
            const service = services.find(s => s.id === curr.service_id);
            return acc + (service?.price || 0);
        }, 0);

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

        // Fluxo de Caixa (FlowData)
        const revenueByDay = completedAll.reduce((acc: any, curr) => {
            const date = new Date(curr.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
            const service = services.find(s => s.id === curr.service_id);
            acc[date] = (acc[date] || 0) + (service?.price || 0);
            return acc;
        }, {});
        const flowData = Object.entries(revenueByDay).map(([name, value]) => ({ name, value }));

        // Atendimento por Vendedor (StaffData)
        const staffData = professionals.map(p => {
            const count = appointments.filter(a => a.professional_id === p.id && a.status === 'completed').length;
            return { name: p.name.split(' ')[0], atendimentos: count };
        }).sort((a, b) => b.atendimentos - a.atendimentos);

        // Relatório de Clientes
        const clientFrequency = appointments.reduce((acc: any, curr) => {
            if (curr.client_id) {
                acc[curr.client_id] = (acc[curr.client_id] || 0) + 1;
            }
            return acc;
        }, {});
        const uniqueClientsCount = Object.keys(clientFrequency).length;

        return {
            totalRevenue,
            revenueToday,
            todayCount: todayApps.length,
            totalClients: clients.length,
            activeClients,
            newClients,
            flowData,
            staffData,
            uniqueClientsCount,
            totalCompleted: completedAll.length,
            upcoming: todayApps
                .filter(a => a.status !== 'cancelled')
                .sort((a, b) => a.time.localeCompare(b.time))
                .slice(0, 5)
        };
    }, [appointments, services, professionals, clients]);

    const exportSectionToPDF = async (ref: React.RefObject<HTMLDivElement>, fileName: string) => {
        if (!ref.current) return;
        
        try {
            addToast(`Gerando arquivo...`, 'info');
            const canvas = await html2canvas(ref.current, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, Math.min(pdfHeight, 280));
            pdf.save(`${fileName}-${new Date().toLocaleDateString()}.pdf`);
            addToast('Relatório salvo!', 'success');
        } catch (error) {
            addToast('Erro ao salvar PDF.', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Sincronizando...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-10 py-6 sm:py-12 space-y-12 sm:space-y-24 mb-40 animate-fade-in font-sans selection:bg-slate-900 selection:text-white">
            
            {/* 0. Resumo de Indicadores */}
            <ReportSection 
                reportRef={kpiRef}
                title="Resumo de Indicadores"
                description="Visão geral do desempenho do seu negócio."
                onDownload={() => exportSectionToPDF(kpiRef, 'resumo-indicadores')}
            >
                <div className="grid grid-cols-2 gap-3 sm:gap-6">
                    <MiniStat icon={<Calendar className="w-4 h-4" />} label="Hoje" value={stats.todayCount.toString()} trend="+5%" />
                    <MiniStat icon={<DollarSign className="w-4 h-4" />} label="Receita Hoje" value={`R$ ${stats.revenueToday.toFixed(0)}`} trend="+8%" />
                    <MiniStat icon={<Users className="w-4 h-4" />} label="Total Clientes" value={stats.totalClients.toString()} trend="+3%" />
                    <MiniStat icon={<UserPlus className="w-4 h-4" />} label="Novos (30d)" value={stats.newClients.toString()} trend="+12%" />
                </div>
            </ReportSection>

            {/* 1. Fluxo de Caixa */}
            <ReportSection 
                reportRef={cashFlowRef}
                title="Fluxo de Caixa"
                description="Seu faturamento detalhado por dia."
                onDownload={() => exportSectionToPDF(cashFlowRef, 'fluxo-de-caixa')}
            >
                <div className="h-44 sm:h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.flowData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" hide />
                            <Tooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: '900' }}
                                labelStyle={{ display: 'none' }}
                                formatter={(value: number) => [`R$ ${value.toLocaleString()}`, 'Ganhos']}
                            />
                            <Area type="monotone" dataKey="value" stroke="#0f172a" strokeWidth={4} fill="url(#colorValue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-between items-end pt-4">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ganhos Reais (Total)</p>
                        <h4 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">R$ {stats.totalRevenue.toLocaleString('pt-BR')}</h4>
                    </div>
                    <div className="p-3 bg-slate-100 text-slate-900 rounded-2xl">
                        <DollarSign className="w-5 h-5" />
                    </div>
                </div>
            </ReportSection>

            {/* 2. Atendimento por Vendedor */}
            <ReportSection 
                reportRef={staffReportRef}
                title="Atendimento por Profissional"
                description="Quem mais trabalhou neste período."
                onDownload={() => exportSectionToPDF(staffReportRef, 'atendimento-vendedor')}
            >
                <div className="space-y-4">
                    {stats.staffData.length > 0 ? stats.staffData.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400">
                                {idx + 1}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between text-xs font-black text-slate-900 uppercase">
                                    <span>{item.name}</span>
                                    <span>{item.atendimentos} atendimentos</span>
                                </div>
                                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(item.atendimentos / (stats.totalCompleted || 1)) * 100}%` }}
                                        className="h-full bg-slate-900 rounded-full"
                                    />
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center py-6 text-slate-400 text-sm">Nenhum atendimento registrado.</p>
                    )}
                </div>
            </ReportSection>

            {/* 3. Relatório de Clientes */}
            <ReportSection 
                reportRef={clientReportRef}
                title="Relatório de Clientes"
                description="Total de pessoas atendidas."
                onDownload={() => exportSectionToPDF(clientReportRef, 'relatorio-clientes')}
            >
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-slate-50 rounded-[28px] space-y-2">
                        <Users className="w-5 h-5 text-slate-900 mb-2" />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Clientes Únicos</p>
                        <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{stats.uniqueClientsCount}</h4>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-[28px] space-y-2">
                        <Scissors className="w-5 h-5 text-slate-900 mb-2" />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Serviços</p>
                        <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{stats.totalCompleted}</h4>
                    </div>
                </div>
                <div className="mt-4 p-5 bg-slate-900 text-white rounded-[28px] flex items-center justify-between">
                    <div className="space-y-0.5">
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-50">Desempenho Geral</p>
                        <p className="text-xs font-bold italic">"Seu negócio está crescendo de forma constante."</p>
                    </div>
                    <Zap className="w-5 h-5 text-white opacity-40 shrink-0" />
                </div>
            </ReportSection>

            {/* 4. Próximos Agendamentos (Moved from Overview) */}
            <ReportSection 
                reportRef={upcomingRef}
                title="Próximos Agendamentos"
                description="Agenda de hoje em uma visão rápida."
                onDownload={() => exportSectionToPDF(upcomingRef, 'proximos-agendamentos')}
            >
                <div className="space-y-3">
                    {stats.upcoming.length > 0 ? stats.upcoming.map((app) => (
                        <div key={app.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-100/50">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-900 font-bold text-xs shadow-sm border border-slate-100">
                                {app.time}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">
                                    Cliente #{app.client_id?.toString().substring(0, 4)}
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    {services.find(s => s.id === app.service_id)?.name || 'Serviço'}
                                </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                        </div>
                    )) : (
                        <div className="py-10 text-center space-y-2">
                            <Clock className="w-8 h-8 text-slate-200 mx-auto" />
                            <p className="text-xs text-slate-400">Sem agendamentos próximos.</p>
                        </div>
                    )}
                </div>
            </ReportSection>

        </div>
    );
};

// Componentes Auxiliares
const MiniStat: React.FC<{ icon: React.ReactNode, label: string, value: string, trend: string }> = ({ icon, label, value, trend }) => (
    <div className="p-4 sm:p-6 bg-slate-50 rounded-[28px] space-y-3 border border-slate-100/50">
        <div className="flex items-center justify-between">
            <div className="p-2 bg-white rounded-xl text-slate-900 shadow-sm">
                {icon}
            </div>
            <span className="flex items-center gap-0.5 text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                <ArrowUpRight className="w-2 h-2" />
                {trend}
            </span>
        </div>
        <div className="space-y-0.5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</p>
            <h4 className="text-xl font-black text-slate-900 tracking-tighter">{value}</h4>
        </div>
    </div>
);

const ReportSection: React.FC<{ 
    title: string, 
    description: string, 
    onDownload: () => void,
    reportRef: React.RefObject<HTMLDivElement>,
    children: React.ReactNode 
}> = ({ title, description, onDownload, reportRef, children }) => (
    <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
            <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter">{title}</h2>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400">{description}</p>
            </div>
            <button 
                onClick={onDownload}
                className="p-3 sm:p-4 bg-slate-100 hover:bg-slate-900 text-slate-900 hover:text-white rounded-[20px] transition-all active:scale-90"
                title="Salvar PDF"
            >
                <Download className="w-4 h-4" />
            </button>
        </div>
        <div ref={reportRef} className="bg-white p-6 sm:p-10 rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
            {children}
        </div>
    </div>
);

export default ReportsPage;
