
import React, { useState, useEffect, useRef } from 'react';
import { 
  Palette, 
  Clock,
  Calendar, 
  Bell, 
  ShieldCheck, 
  Save, 
  Loader2,
  Globe,
  Copy,
  Check,
  ExternalLink,
  MapPin,
  Smartphone,
  Trash2,
  Plus,
  ChevronRight,
  AlertCircle,
  Mail,
  Lock,
  Camera,
  Link as LinkIcon,
  ChevronDown,
  CreditCard,
  Building
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast, useDemoData } from '../App';
import { BusinessInfo } from '../types';
import { PhoneInput } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

type TabType = 'perfil' | 'endereco' | 'horarios' | 'notificacoes' | 'assinatura';

const SettingsPage: React.FC = () => {
    const { isDemo, demoData, setDemoData } = useDemoData();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('perfil');
    const [copied, setCopied] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        const fetchBusinessInfo = async () => {
            setLoading(true);

            if (isDemo) {
                setBusinessInfo(demoData.business);
                setLoading(false);
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('businesses')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (error) {
                addToast('Erro ao carregar configurações.', 'error');
            } else {
                if (data) {
                    setBusinessInfo(data);
                } else {
                    // Initialize with defaults if no record exists
                    setBusinessInfo({
                        id: user.id,
                        email: user.email,
                        name: '',
                        full_name: user.user_metadata?.full_name || '',
                        slug: '',
                        created_at: new Date().toISOString(),
                        subscription_status: 'trial',
                        is_exempt: false,
                        work_hours: {},
                        reminder_time: 60,
                        reminder_message: 'Olá {nome}, passando para lembrar do seu agendamento hoje às {horario}.'
                    } as BusinessInfo);
                }
            }
            setLoading(false);
        };

        fetchBusinessInfo();
    }, [addToast, isDemo, demoData.business]);

    const handleSave = async () => {
        if (!businessInfo) return;

        // --- VALIDATION: PERFIL ---
        if (!businessInfo.name?.trim()) {
            addToast('O Nome do Negócio é obrigatório.', 'error');
            setActiveTab('perfil');
            return;
        }
        if (!businessInfo.full_name?.trim()) {
            addToast('O Nome do Proprietário é obrigatório.', 'error');
            setActiveTab('perfil');
            return;
        }
        if (!businessInfo.whatsapp_phone?.trim()) {
            addToast('O Telefone/WhatsApp é obrigatório.', 'error');
            setActiveTab('perfil');
            return;
        }
        if (!businessInfo.slug?.trim()) {
            addToast('O Link Personalizado é obrigatório.', 'error');
            setActiveTab('perfil');
            return;
        }

        // --- VALIDATION: ENDEREÇO ---
        if (!businessInfo.street?.trim()) {
            addToast('A Rua é obrigatória.', 'error');
            setActiveTab('endereco');
            return;
        }
        if (!businessInfo.number?.trim()) {
            addToast('O Número é obrigatório.', 'error');
            setActiveTab('endereco');
            return;
        }
        if (!businessInfo.neighborhood?.trim()) {
            addToast('O Bairro é obrigatório.', 'error');
            setActiveTab('endereco');
            return;
        }
        if (!businessInfo.city?.trim()) {
            addToast('A Cidade é obrigatória.', 'error');
            setActiveTab('endereco');
            return;
        }
        if (!businessInfo.state?.trim()) {
            addToast('O Estado (UF) é obrigatório.', 'error');
            setActiveTab('endereco');
            return;
        }

        // --- VALIDATION: HORÁRIOS ---
        const hasWorkHours = Object.values(businessInfo.work_hours || {}).some((intervals: any) => intervals && intervals.length > 0);
        if (!hasWorkHours) {
            addToast('Configure ao menos um dia de atendimento.', 'error');
            setActiveTab('horarios');
            return;
        }

        // Validate each day's intervals
        for (const [day, intervals] of Object.entries(businessInfo.work_hours || {})) {
            if (Array.isArray(intervals)) {
                for (const interval of intervals) {
                    if (!interval.start || !interval.end) {
                        addToast(`Horário incompleto em ${day}.`, 'error');
                        setActiveTab('horarios');
                        return;
                    }
                    if (interval.start >= interval.end) {
                        addToast(`Horário inválido em ${day} (Início deve ser antes do fim).`, 'error');
                        setActiveTab('horarios');
                        return;
                    }
                }
            }
        }

        setSaving(true);
        
        if (isDemo) {
            setDemoData(prev => ({
                ...prev,
                business: businessInfo
            }));
            addToast('Configurações salvas (Modo Demo)!', 'success');
            setSaving(false);
            return;
        }

        const payloadToSave = {
            ...businessInfo,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('businesses')
            .upsert(payloadToSave);

        if (error) {
            console.error('Erro ao salvar:', error);
            addToast('Erro ao salvar: ' + error.message, 'error');
        } else {
            addToast('Configurações salvas com sucesso!', 'success');
            window.dispatchEvent(new CustomEvent('businessInfoUpdated'));
        }
        setSaving(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        addToast('Link copiado!', 'success');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) { // 1MB limit for base64 performance
                addToast('A imagem deve ter menos de 1MB', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setBusinessInfo(prev => ({
                    ...(prev || {} as BusinessInfo),
                    logo_url: reader.result as string
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const updateWorkHours = (day: string, intervals: { start: string, end: string }[] | null) => {
        if (!businessInfo) return;
        setBusinessInfo({
            ...businessInfo,
            work_hours: {
                ...businessInfo.work_hours,
                [day]: intervals
            }
        });
    };

    const addInterval = (day: string) => {
        if (!businessInfo) return;
        const current = businessInfo.work_hours[day] || [];
        updateWorkHours(day, [...current, { start: '09:00', end: '18:00' }]);
    };

    const removeInterval = (day: string, index: number) => {
        if (!businessInfo) return;
        const current = [...(businessInfo.work_hours[day] || [])];
        current.splice(index, 1);
        updateWorkHours(day, current.length > 0 ? current : null);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-6 h-6 text-gold-500 animate-spin" />
                <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Carregando</p>
            </div>
        );
    }

    const tabs = [
        { id: 'perfil', label: 'Perfil', icon: Globe, desc: 'Identidade e marca' },
        { id: 'endereco', label: 'Endereço', icon: MapPin, desc: 'Localização física' },
        { id: 'horarios', label: 'Horários', icon: Clock, desc: 'Sua disponibilidade' },
        { id: 'notificacoes', label: 'Notificações', icon: Bell, desc: 'Lembretes e avisos' },
        { id: 'assinatura', label: 'Assinatura', icon: CreditCard, desc: 'Seu plano e faturas' },
    ];

    const daysOfWeek = [
        { id: 'monday', label: 'Segunda' },
        { id: 'tuesday', label: 'Terça' },
        { id: 'wednesday', label: 'Quarta' },
        { id: 'thursday', label: 'Quinta' },
        { id: 'friday', label: 'Sexta' },
        { id: 'saturday', label: 'Sábado' },
        { id: 'sunday', label: 'Domingo' },
    ];

    const publicUrl = `https://agendios.com.br/#/${businessInfo?.slug}`;

    const activeTabLabel = tabs.find(t => t.id === activeTab)?.label;
    const ActiveTabIcon = tabs.find(t => t.id === activeTab)?.icon;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
            {/* Header Section */}
            <div className="flex items-center justify-between gap-6 mb-12">
                <div className="space-y-1">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Gerencie as preferências do seu estabelecimento.
                    </p>
                </div>
            </div>

            {/* Navigation Tabs (Responsive) */}
            <div className="mb-10 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id as TabType);
                                }}
                                className={`
                                    flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap outline-none flex-shrink-0
                                    ${isActive 
                                        ? 'bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 shadow-md' 
                                        : 'bg-slate-100/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80'}
                                `}
                            >
                                <tab.icon className={`w-4 h-4 ${isActive ? 'text-white dark:text-slate-900' : 'text-slate-500'}`} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <main className="block">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="space-y-10"
                    >
                        {activeTab === 'perfil' && (
                            <div className="space-y-12">
                                <section className="space-y-8">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 italic">Informações Básicas</h3>
                                        <p className="text-xs text-slate-500">Gerencie a identidade visual e dados do negócio.</p>
                                    </div>

                                    {/* Logo Section */}
                                    <div className="flex items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800/50">
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            onChange={handleFileChange} 
                                            accept="image/*" 
                                            className="hidden" 
                                        />
                                        <div 
                                            className="relative group cursor-pointer"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden transition-all group-hover:border-gold-500/50">
                                                {businessInfo?.logo_url ? (
                                                    <img 
                                                        src={businessInfo.logo_url} 
                                                        alt="Logo" 
                                                        className="w-full h-full object-cover"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                ) : (
                                                    <span className="text-3xl font-black text-slate-300 dark:text-slate-700">
                                                        {businessInfo?.name 
                                                            ? businessInfo.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                                                            : 'BN'}
                                                    </span>
                                                )}
                                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <Camera className="w-6 h-6 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Logo do Negócio</label>
                                            <div className="flex flex-col gap-2">
                                                <button 
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="w-fit px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    Selecionar Imagem
                                                </button>
                                                <p className="text-[10px] text-slate-400 italic">Clique na imagem ou no botão para alterar a logo.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Negócio</label>
                                            <input 
                                                type="text" 
                                                value={businessInfo?.name || ''}
                                                onChange={(e) => setBusinessInfo(prev => ({ ...(prev || {} as BusinessInfo), name: e.target.value }))}
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-gold-500/20 outline-none transition-all dark:text-slate-200 font-medium"
                                                placeholder="Sua Barbearia"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Proprietário</label>
                                            <input 
                                                type="text" 
                                                value={businessInfo?.full_name || ''}
                                                onChange={(e) => setBusinessInfo(prev => ({ ...(prev || {} as BusinessInfo), full_name: e.target.value }))}
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-gold-500/20 outline-none transition-all dark:text-slate-200 font-medium"
                                                placeholder="Nome completo"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <PhoneInput 
                                                label="Telefone / WhatsApp"
                                                value={businessInfo?.whatsapp_phone || ''}
                                                onChange={(val) => setBusinessInfo(prev => ({ ...(prev || {} as BusinessInfo), whatsapp_phone: val }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Link Personalizado</label>
                                            <div className="flex">
                                                <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-400 text-[11px] font-mono">
                                                    agendios.com.br/#/
                                                </span>
                                                <input 
                                                    type="text" 
                                                    value={businessInfo?.slug || ''}
                                                    onChange={(e) => setBusinessInfo(prev => ({ ...(prev || {} as BusinessInfo), slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                                                    className="flex-1 min-w-0 px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-r-xl text-sm focus:ring-2 focus:ring-gold-500/20 outline-none transition-all dark:text-slate-200 font-mono"
                                                    placeholder="slug"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                        <Globe className="w-32 h-32 text-gold-500" />
                                    </div>
                                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-1">
                                            <h4 className="text-white font-bold italic">Seu endereço na web</h4>
                                            <p className="text-xs text-slate-500">Compartilhe este link para receber agendamentos.</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-400 max-w-[240px] truncate">
                                                {publicUrl}
                                            </div>
                                            <button 
                                                onClick={() => copyToClipboard(publicUrl)}
                                                className="p-2.5 bg-white text-slate-950 rounded-lg hover:bg-slate-100 transition-all active:scale-95 shadow-sm"
                                            >
                                                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'endereco' && (
                            <div className="space-y-10">
                                <div className="space-y-6">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 italic">Localização</h3>
                                        <p className="text-xs text-slate-500">Onde seus clientes devem comparecer.</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        <div className="md:col-span-12 space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Logradouro (Rua)</label>
                                            <input 
                                                type="text" 
                                                value={businessInfo?.street || ''}
                                                onChange={(e) => setBusinessInfo(prev => ({ ...(prev || {} as BusinessInfo), street: e.target.value }))}
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-gold-500/20 outline-none dark:text-slate-200 font-medium"
                                                placeholder="Ex: Avenida das Flores"
                                            />
                                        </div>
                                        <div className="md:col-span-4 space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Número</label>
                                            <input 
                                                type="text" 
                                                value={businessInfo?.number || ''}
                                                onChange={(e) => setBusinessInfo(prev => ({ ...(prev || {} as BusinessInfo), number: e.target.value }))}
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-gold-500/20 outline-none dark:text-slate-200 font-medium"
                                                placeholder="123"
                                            />
                                        </div>
                                        <div className="md:col-span-8 space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Complemento</label>
                                            <input 
                                                type="text" 
                                                value={businessInfo?.complement || ''}
                                                onChange={(e) => setBusinessInfo(prev => ({ ...(prev || {} as BusinessInfo), complement: e.target.value }))}
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-gold-500/20 outline-none dark:text-slate-200 font-medium"
                                                placeholder="Sala, Andar, Referência"
                                            />
                                        </div>
                                        <div className="md:col-span-4 space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Bairro</label>
                                            <input 
                                                type="text" 
                                                value={businessInfo?.neighborhood || ''}
                                                onChange={(e) => setBusinessInfo(prev => ({ ...(prev || {} as BusinessInfo), neighborhood: e.target.value }))}
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-gold-500/20 outline-none dark:text-slate-200 font-medium"
                                                placeholder="Centro"
                                            />
                                        </div>
                                        <div className="md:col-span-4 space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cidade</label>
                                            <input 
                                                type="text" 
                                                value={businessInfo?.city || ''}
                                                onChange={(e) => setBusinessInfo(prev => ({ ...(prev || {} as BusinessInfo), city: e.target.value }))}
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-gold-500/20 outline-none dark:text-slate-200 font-medium"
                                                placeholder="Cidade"
                                            />
                                        </div>
                                        <div className="md:col-span-4 space-y-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Estado</label>
                                            <input 
                                                type="text" 
                                                value={businessInfo?.state || ''}
                                                onChange={(e) => setBusinessInfo(prev => ({ ...(prev || {} as BusinessInfo), state: e.target.value }))}
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-gold-500/20 outline-none dark:text-slate-200 font-medium"
                                                placeholder="UF"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'horarios' && (
                            <div className="space-y-10">
                                <section className="space-y-6">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 italic">Expediente</h3>
                                        <p className="text-xs text-slate-500">Ative os dias da semana clicando nas chaves seletoras e defina os horários de abertura e fechamento.</p>
                                    </div>

                                    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/50 shadow-sm">
                                        {daysOfWeek.map((day) => {
                                            const intervals = businessInfo?.work_hours[day.id] || [];
                                            const isOpen = intervals.length > 0;

                                            return (
                                                <div key={day.id} className="p-5 flex flex-col md:flex-row md:items-start gap-6 relative group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                                                    <div className="w-32 flex items-center gap-4 shrink-0">
                                                        <button 
                                                            onClick={() => updateWorkHours(day.id, isOpen ? null : [{ start: '09:00', end: '18:00' }])}
                                                            className={`w-9 h-5 rounded-full relative transition-all duration-300 ${isOpen ? 'bg-gold-500' : 'bg-slate-200 dark:bg-slate-800'}`}
                                                        >
                                                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${isOpen ? 'left-[1.125rem]' : 'left-0.5'}`} />
                                                        </button>
                                                        <span className={`text-[11px] font-bold uppercase tracking-widest ${isOpen ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
                                                            {day.label}
                                                        </span>
                                                    </div>

                                                    <div className="flex-1">
                                                        {isOpen ? (
                                                            <div className="flex flex-wrap gap-2.5">
                                                                {intervals.map((interval: any, idx: number) => (
                                                                    <div key={idx} className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 pl-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                                                                        <input 
                                                                            type="time" 
                                                                            value={interval.start}
                                                                            onChange={(e) => {
                                                                                const newInts = [...intervals];
                                                                                newInts[idx].start = e.target.value;
                                                                                updateWorkHours(day.id, newInts);
                                                                            }}
                                                                            className="bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none flex-shrink-0"
                                                                        />
                                                                        <span className="text-[10px] font-bold text-slate-300">/</span>
                                                                        <input 
                                                                            type="time" 
                                                                            value={interval.end}
                                                                            onChange={(e) => {
                                                                                const newInts = [...intervals];
                                                                                newInts[idx].end = e.target.value;
                                                                                updateWorkHours(day.id, newInts);
                                                                            }}
                                                                            className="bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none flex-shrink-0"
                                                                        />
                                                                        <button 
                                                                            onClick={() => removeInterval(day.id, idx)}
                                                                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                <button 
                                                                    onClick={() => addInterval(day.id)}
                                                                    className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-slate-300 dark:border-slate-800 rounded-lg text-slate-400 hover:text-gold-500 hover:border-gold-500 transition-all text-[10px] font-bold uppercase"
                                                                >
                                                                    <Plus className="w-3 h-3" />
                                                                    Add Turno (Intervalo)
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[11px] text-slate-400 italic">Fechado para atendimentos</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'notificacoes' && (
                            <div className="space-y-12">
                                <section className="space-y-6">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 italic">Central de Alertas</h3>
                                        <p className="text-xs text-slate-500">Controle como você recebe avisos do sistema.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { id: 'notify_new_appointments', label: 'Novas Reservas', desc: 'Avisar quando houver novo agendamento.' },
                                            { id: 'notify_cancellations', label: 'Cancelamentos', desc: 'Notificar desistências em tempo real.' },
                                            { id: 'notify_daily_summary', label: 'Resumo da Agenda', desc: 'Receber agenda do dia por e-mail.' },
                                            { id: 'whatsapp_confirmation', label: 'Sincronizar WhatsApp', desc: 'Confirmação automática via API.' }
                                        ].map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
                                                <div className="space-y-1">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.label}</span>
                                                    <p className="text-[11px] text-slate-500">{item.desc}</p>
                                                </div>
                                                <button 
                                                    onClick={() => setBusinessInfo(prev => ({ ...(prev || {} as BusinessInfo), [item.id]: !businessInfo?.[item.id as keyof BusinessInfo] }))}
                                                    className={`w-10 h-5.5 rounded-full relative transition-all duration-300 ${businessInfo?.[item.id as keyof BusinessInfo] ? 'bg-gold-500' : 'bg-slate-200 dark:bg-slate-800'}`}
                                                >
                                                    <div className={`absolute top-0.75 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${businessInfo?.[item.id as keyof BusinessInfo] ? 'left-[1.375rem]' : 'left-0.75'}`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 italic">Lembretes Automáticos</h3>
                                        <p className="text-xs text-slate-500">Configurações de avisos para seus clientes.</p>
                                    </div>
                                    <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Antecedência do Lembrete</label>
                                            <div className="flex items-center gap-4">
                                                <input 
                                                    type="number" 
                                                    value={businessInfo?.reminder_time || 60}
                                                    onChange={(e) => setBusinessInfo(prev => ({ ...(prev || {} as BusinessInfo), reminder_time: parseInt(e.target.value) || 0 }))}
                                                    className="w-24 px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:ring-2 focus:ring-gold-500/20 outline-none text-center dark:text-white"
                                                />
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Minutos antes do horário</span>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mensagem de Lembrete</label>
                                            <textarea 
                                                value={businessInfo?.reminder_message || ''}
                                                onChange={(e) => setBusinessInfo(prev => ({ ...(prev || {} as BusinessInfo), reminder_message: e.target.value }))}
                                                rows={4}
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm italic font-medium focus:ring-2 focus:ring-gold-500/20 outline-none resize-none dark:text-white"
                                                placeholder="Olá {nome}, confirmamos seu agendamento..."
                                            />
                                            <div className="flex flex-wrap gap-2">
                                                {['{nome}', '{horario}', '{servico}', '{data}'].map(tag => (
                                                    <span key={tag} className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-[10px] font-mono text-slate-400 lowercase">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'assinatura' && (
                            <div className="space-y-10">
                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 italic">Seu Plano Atual</h3>
                                    <div className="bg-slate-950 rounded-2xl p-8 border border-slate-800 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-8 opacity-10">
                                            <CreditCard className="w-32 h-32 text-gold-500" />
                                        </div>
                                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl font-bold text-white uppercase tracking-tighter">Premium Yearly</span>
                                                    <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Ativo</span>
                                                </div>
                                                <p className="text-sm text-slate-400">Sua assinatura foi renovada em Dezembro de 2025.</p>
                                            </div>
                                            <button className="px-6 py-2.5 bg-white text-slate-950 rounded-lg font-bold text-sm hover:bg-slate-100 transition-all active:scale-95">
                                                Gerenciar Faturas
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 italic">Segurança e Acesso</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                                                    <Mail className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">E-mail</span>
                                                    <p className="text-xs text-slate-500">{businessInfo?.full_name ? 'anildo.gomes@aluno.ufca.edu.br' : 'vazio'}</p>
                                                </div>
                                            </div>
                                            <button className="text-[10px] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors uppercase tracking-widest">Alterar</button>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                                                    <Lock className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Senha</span>
                                                    <p className="text-xs text-slate-500">••••••••••••</p>
                                                </div>
                                            </div>
                                            <button className="text-[10px] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors uppercase tracking-widest">Redefinir</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-10 border-t border-slate-100 dark:border-slate-800">
                                    <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 flex flex-col sm:flex-row items-center justify-between gap-6">
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-bold text-red-600 dark:text-red-400 italic">Zona Crítica</h4>
                                            <p className="text-xs text-slate-500 max-w-sm">A exclusão da conta é irreversível e removerá todos os seus dados e histórico de agendamentos.</p>
                                        </div>
                                        <button className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-bold text-[11px] uppercase tracking-widest hover:bg-red-700 transition-all active:scale-95 shadow-sm">
                                            Excluir Conta
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Bottom Save Button - Sticky to stay accessible but allow viewing footer */}
            {activeTab !== 'assinatura' && (
                <div className="sticky bottom-0 p-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex justify-center z-40 -mx-4">
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full max-w-sm flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-2xl font-bold text-base hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 shadow-xl"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
