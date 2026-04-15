
import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Clock, 
  Palette, 
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
  ChevronDown
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast } from '../App';
import { BusinessInfo } from '../types';
import { PhoneInput } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

type TabType = 'perfil' | 'horarios' | 'aparencia' | 'agendamento' | 'notificacoes' | 'seguranca';

const SettingsPage: React.FC = () => {
    const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('perfil');
    const [showMobileMenu, setShowMobileMenu] = useState(true);
    const [copied, setCopied] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        const fetchBusinessInfo = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('businesses')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (error) {
                addToast('Erro ao carregar configurações.', 'error');
            } else {
                setBusinessInfo(data);
            }
            setLoading(false);
        };

        fetchBusinessInfo();
    }, [addToast]);

    const handleSave = async () => {
        if (!businessInfo) return;

        setSaving(true);
        
        const { error } = await supabase
            .from('businesses')
            .update(businessInfo)
            .eq('id', businessInfo.id);

        if (error) {
            console.error('Erro ao salvar:', error);
            addToast('Erro ao salvar alterações: ' + error.message, 'error');
        } else {
            addToast('Configurações salvas com sucesso!', 'success');
        }
        setSaving(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        addToast('Link copiado!', 'success');
        setTimeout(() => setCopied(false), 2000);
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
                <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Carregando preferências</p>
            </div>
        );
    }

    const tabs = [
        { id: 'perfil', label: 'Perfil', icon: Building2, desc: 'Informações básicas e contato' },
        { id: 'horarios', label: 'Horários', icon: Clock, desc: 'Disponibilidade de atendimento' },
        { id: 'aparencia', label: 'Aparência', icon: Palette, desc: 'Personalização visual e marca' },
        { id: 'agendamento', label: 'Agendamento', icon: Calendar, desc: 'Regras e políticas' },
        { id: 'notificacoes', label: 'Notificações', icon: Bell, desc: 'Alertas e comunicações' },
        { id: 'seguranca', label: 'Segurança', icon: ShieldCheck, desc: 'Conta e privacidade' },
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

    const publicUrl = `https://agendavisual.com.br/#/${businessInfo?.slug}`;

    const activeTabLabel = tabs.find(t => t.id === activeTab)?.label;
    const ActiveTabIcon = tabs.find(t => t.id === activeTab)?.icon;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
            {/* Header Section */}
            <div className="flex items-center justify-between gap-6 mb-12">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        {!showMobileMenu && (
                            <button 
                                onClick={() => setShowMobileMenu(true)}
                                className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                            >
                                <ChevronRight className="w-5 h-5 rotate-180" />
                            </button>
                        )}
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                            {(!showMobileMenu && activeTabLabel) ? activeTabLabel : 'Configurações'}
                        </h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {showMobileMenu ? 'Gerencie as preferências do seu estabelecimento.' : 'Ajuste os detalhes desta seção.'}
                    </p>
                </div>
                {!showMobileMenu && (
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-xl font-semibold text-sm hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span className="hidden sm:inline">{saving ? 'Salvando...' : 'Salvar'}</span>
                        <span className="sm:hidden">{saving ? '...' : 'Salvar'}</span>
                    </button>
                )}
            </div>

            {/* Mobile Menu (Drill-down pattern) */}
            <AnimatePresence mode="wait">
                {showMobileMenu ? (
                    <motion.div 
                        key="mobile-menu"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="md:hidden space-y-3"
                    >
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id as TabType);
                                    setShowMobileMenu(false);
                                }}
                                className="w-full flex items-center gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm active:scale-[0.98] transition-all text-left"
                            >
                                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                                    <tab.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 space-y-0.5">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{tab.label}</h3>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{tab.desc}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300" />
                            </button>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="mobile-content"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="md:hidden"
                    >
                        {/* Content rendered below in main */}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop Pill Tabs */}
            <div className="hidden md:flex mb-10 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl items-center gap-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id as TabType);
                            setShowMobileMenu(false); // Sync state even if hidden
                        }}
                        className={`
                            flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap
                            ${activeTab === tab.id 
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}
                        `}
                    >
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-gold-500' : 'text-slate-400'}`} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <main className={`${showMobileMenu ? 'hidden md:block' : 'block'}`}>
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
                            <div className="space-y-10">
                                {/* Link Section - The "Special Object" */}
                                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-2.5 bg-gold-500/10 rounded-xl">
                                            <LinkIcon className="w-5 h-5 text-gold-600 dark:text-gold-400" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Link de Agendamento</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Compartilhe este endereço com seus clientes.</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 truncate">
                                            {publicUrl}
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => copyToClipboard(publicUrl)}
                                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                                            >
                                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                <span>{copied ? 'Copiado' : 'Copiar'}</span>
                                            </button>
                                            <a 
                                                href={publicUrl} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="p-3 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-xl hover:opacity-90 transition-all active:scale-95"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Basic Info Form */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nome do Negócio</label>
                                        <input 
                                            type="text" 
                                            value={businessInfo?.business_name || ''}
                                            onChange={(e) => setBusinessInfo(prev => prev ? { ...prev, business_name: e.target.value } : null)}
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all dark:text-slate-200"
                                            placeholder="Ex: Barbearia Premium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <PhoneInput 
                                            label="WhatsApp de Contato"
                                            value={businessInfo?.whatsapp_phone || ''}
                                            onChange={(val) => setBusinessInfo(prev => prev ? { ...prev, whatsapp_phone: val } : null)}
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Endereço</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input 
                                                type="text" 
                                                value={businessInfo?.address || ''}
                                                onChange={(e) => setBusinessInfo(prev => prev ? { ...prev, address: e.target.value } : null)}
                                                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all dark:text-slate-200"
                                                placeholder="Rua, Número, Bairro, Cidade"
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Sobre o Negócio</label>
                                        <textarea 
                                            value={businessInfo?.description || ''}
                                            onChange={(e) => setBusinessInfo(prev => prev ? { ...prev, description: e.target.value } : null)}
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-none transition-all min-h-[120px] resize-none dark:text-slate-200"
                                            placeholder="Descreva brevemente seus serviços e diferenciais..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'horarios' && (
                            <div className="space-y-8">
                                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl p-4 flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                                    <p className="text-xs text-amber-700 dark:text-amber-400/80 leading-relaxed">
                                        Defina os horários em que sua agenda estará aberta. Você pode adicionar múltiplos turnos para o mesmo dia.
                                    </p>
                                </div>

                                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                                    {daysOfWeek.map((day) => {
                                        const intervals = businessInfo?.work_hours[day.id] || [];
                                        const isOpen = intervals.length > 0;

                                        return (
                                            <div key={day.id} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-start gap-6 group">
                                                <div className="w-32 shrink-0 flex items-center gap-3">
                                                    <button 
                                                        onClick={() => updateWorkHours(day.id, isOpen ? null : [{ start: '09:00', end: '18:00' }])}
                                                        className={`w-9 h-5 rounded-full relative transition-all ${isOpen ? 'bg-gold-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                                                    >
                                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isOpen ? 'left-4.5' : 'left-0.5'}`} />
                                                    </button>
                                                    <span className={`text-sm font-bold ${isOpen ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
                                                        {day.label}
                                                    </span>
                                                </div>

                                                <div className="flex-1 space-y-3">
                                                    {isOpen ? (
                                                        <div className="flex flex-wrap gap-3">
                                                            {intervals.map((interval: any, idx: number) => (
                                                                <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
                                                                    <input 
                                                                        type="time" 
                                                                        value={interval.start}
                                                                        onChange={(e) => {
                                                                            const newInts = [...intervals];
                                                                            newInts[idx].start = e.target.value;
                                                                            updateWorkHours(day.id, newInts);
                                                                        }}
                                                                        className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
                                                                    />
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">às</span>
                                                                    <input 
                                                                        type="time" 
                                                                        value={interval.end}
                                                                        onChange={(e) => {
                                                                            const newInts = [...intervals];
                                                                            newInts[idx].end = e.target.value;
                                                                            updateWorkHours(day.id, newInts);
                                                                        }}
                                                                        className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
                                                                    />
                                                                    <button 
                                                                        onClick={() => removeInterval(day.id, idx)}
                                                                        className="ml-1 p-1 text-slate-400 hover:text-red-500 transition-colors"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button 
                                                                onClick={() => addInterval(day.id)}
                                                                className="flex items-center gap-1.5 px-3 py-2 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-gold-500 hover:border-gold-500 transition-all text-[10px] font-bold uppercase"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" />
                                                                Turno
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">Fechado para agendamentos</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === 'aparencia' && (
                            <div className="space-y-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    {/* Logo Upload */}
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Logo</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Sua marca principal no topo da página.</p>
                                        </div>
                                        <div className="relative group aspect-square max-w-[140px] bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden flex items-center justify-center">
                                            {businessInfo?.logo_url ? (
                                                <img 
                                                    src={businessInfo.logo_url} 
                                                    alt="Logo" 
                                                    className="w-full h-full object-cover"
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <Camera className="w-7 h-7 text-slate-300" />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                                <span className="text-white text-[10px] font-bold uppercase tracking-widest">Alterar</span>
                                            </div>
                                        </div>
                                        <input 
                                            type="text" 
                                            value={businessInfo?.logo_url || ''}
                                            onChange={(e) => setBusinessInfo(prev => prev ? { ...prev, logo_url: e.target.value } : null)}
                                            placeholder="URL da imagem da logo"
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-mono outline-none focus:ring-2 focus:ring-gold-500/20 dark:text-slate-300"
                                        />
                                    </div>

                                    {/* Banner Upload */}
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Banner</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Imagem de destaque no fundo da página.</p>
                                        </div>
                                        <div className="relative group h-[140px] bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden flex items-center justify-center">
                                            {businessInfo?.banner_url ? (
                                                <img 
                                                    src={businessInfo.banner_url} 
                                                    alt="Banner" 
                                                    className="w-full h-full object-cover"
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <Camera className="w-7 h-7 text-slate-300" />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                                <span className="text-white text-[10px] font-bold uppercase tracking-widest">Alterar</span>
                                            </div>
                                        </div>
                                        <input 
                                            type="text" 
                                            value={businessInfo?.banner_url || ''}
                                            onChange={(e) => setBusinessInfo(prev => prev ? { ...prev, banner_url: e.target.value } : null)}
                                            placeholder="URL da imagem do banner"
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-mono outline-none focus:ring-2 focus:ring-gold-500/20 dark:text-slate-300"
                                        />
                                    </div>
                                </div>

                                {/* Social Links */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Redes Sociais</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Globe className="w-4 h-4" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Instagram</span>
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">@</span>
                                                <input 
                                                    type="text" 
                                                    value={businessInfo?.instagram_url || ''}
                                                    onChange={(e) => setBusinessInfo(prev => prev ? { ...prev, instagram_url: e.target.value } : null)}
                                                    className="w-full pl-9 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-gold-500/20 outline-none font-bold dark:text-slate-200"
                                                    placeholder="seu_perfil"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Globe className="w-4 h-4" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Facebook</span>
                                            </div>
                                            <input 
                                                type="text" 
                                                value={businessInfo?.facebook_url || ''}
                                                onChange={(e) => setBusinessInfo(prev => prev ? { ...prev, facebook_url: e.target.value } : null)}
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-gold-500/20 outline-none font-bold dark:text-slate-200"
                                                placeholder="facebook.com/seu_negocio"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'agendamento' && (
                            <div className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Antecedência Mínima</label>
                                            <span className="text-[10px] font-bold text-gold-600 bg-gold-500/10 px-2 py-0.5 rounded-full">Horas</span>
                                        </div>
                                        <input 
                                            type="number" 
                                            value={(businessInfo as any)?.min_advance_hours || ''}
                                            onChange={(e) => setBusinessInfo(prev => prev ? { ...prev, min_advance_hours: parseInt(e.target.value) } : null)}
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold-500/20 font-bold dark:text-slate-200"
                                            placeholder="Ex: 2"
                                        />
                                        <p className="text-[10px] text-slate-400 italic">Tempo mínimo antes do horário para permitir agendamento.</p>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Janela de Visualização</label>
                                            <span className="text-[10px] font-bold text-gold-600 bg-gold-500/10 px-2 py-0.5 rounded-full">Dias</span>
                                        </div>
                                        <input 
                                            type="number" 
                                            value={(businessInfo as any)?.view_window_days || ''}
                                            onChange={(e) => setBusinessInfo(prev => prev ? { ...prev, view_window_days: parseInt(e.target.value) } : null)}
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold-500/20 font-bold dark:text-slate-200"
                                            placeholder="Ex: 30"
                                        />
                                        <p className="text-[10px] text-slate-400 italic">Quantos dias no futuro o cliente pode ver horários.</p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Políticas Adicionais</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                            <div className="space-y-0.5">
                                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Aprovação Manual</span>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400">Exigir sua confirmação para cada vaga.</p>
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                checked={(businessInfo as any)?.manual_approval || false}
                                                onChange={(e) => setBusinessInfo(prev => prev ? { ...prev, manual_approval: e.target.checked } : null)}
                                                className="w-4 h-4 rounded border-slate-300 text-gold-500 focus:ring-gold-500" 
                                            />
                                        </label>
                                        <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                            <div className="space-y-0.5">
                                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Cancelamento Online</span>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400">Permitir que o cliente cancele sozinho.</p>
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                checked={(businessInfo as any)?.online_cancellation !== false}
                                                onChange={(e) => setBusinessInfo(prev => prev ? { ...prev, online_cancellation: e.target.checked } : null)}
                                                className="w-4 h-4 rounded border-slate-300 text-gold-500 focus:ring-gold-500" 
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notificacoes' && (
                            <div className="space-y-10">
                                <div className="space-y-6">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Alertas Internos</h3>
                                    <div className="space-y-3">
                                        {[
                                            { id: 'notify_new_appointments', label: 'Novos Agendamentos', desc: 'Aviso imediato de novas reservas.', icon: Smartphone },
                                            { id: 'notify_cancellations', label: 'Cancelamentos', desc: 'Notificar quando um horário for liberado.', icon: Trash2 },
                                            { id: 'notify_daily_summary', label: 'Resumo Diário', desc: 'Agenda do dia seguinte enviada à noite.', icon: Calendar }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-9 h-9 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                                                        <item.icon className="w-4.5 h-4.5" />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.label}</span>
                                                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.desc}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => setBusinessInfo(prev => prev ? { ...prev, [item.id]: !(prev as any)[item.id] } : null)}
                                                    className={`w-9 h-5 rounded-full relative transition-all ${(businessInfo as any)?.[item.id] ? 'bg-gold-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                                                >
                                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${(businessInfo as any)?.[item.id] ? 'left-4.5' : 'left-0.5'}`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-900 dark:bg-slate-50 rounded-2xl text-white dark:text-slate-900 flex gap-4 shadow-sm">
                                    <div className="p-3 bg-white/10 dark:bg-slate-900/5 rounded-xl shrink-0">
                                        <Bell className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-bold uppercase tracking-widest">Confirmação via WhatsApp</h4>
                                            <button 
                                                onClick={() => setBusinessInfo(prev => prev ? { ...prev, whatsapp_confirmation: !(prev as any).whatsapp_confirmation } : null)}
                                                className={`w-9 h-5 rounded-full relative transition-all ${(businessInfo as any)?.whatsapp_confirmation ? 'bg-gold-500' : 'bg-white/20 dark:bg-slate-200'}`}
                                            >
                                                <div className={`absolute top-0.5 w-4 h-4 bg-white dark:bg-slate-900 rounded-full shadow-sm transition-all ${(businessInfo as any)?.whatsapp_confirmation ? 'left-4.5' : 'left-0.5'}`} />
                                            </button>
                                        </div>
                                        <p className="text-xs opacity-70 leading-relaxed">
                                            Seus clientes recebem automaticamente os detalhes do agendamento no WhatsApp assim que você confirma o horário.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'seguranca' && (
                            <div className="space-y-12">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Acesso</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                                                    <Mail className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">E-mail</span>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">anildo.gomes@aluno.ufca.edu.br</p>
                                                </div>
                                            </div>
                                            <button className="text-[11px] font-bold uppercase text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">Alterar</button>
                                        </div>
                                        <div className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                                                    <Lock className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Senha</span>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">••••••••••••</p>
                                                </div>
                                            </div>
                                            <button className="text-[11px] font-bold uppercase text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">Redefinir</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-12 border-t border-slate-100 dark:border-slate-800">
                                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                                        <div className="space-y-1 text-center sm:text-left">
                                            <h4 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Zona de Perigo</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                                                A exclusão da conta é permanente e removerá todos os seus dados e histórico.
                                            </p>
                                        </div>
                                        <button className="px-6 py-3 bg-red-600 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all active:scale-95 shadow-sm">
                                            Excluir Unidade
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default SettingsPage;
