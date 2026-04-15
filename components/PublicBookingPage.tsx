
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Service, Professional, BusinessInfo, Appointment, Client } from '../types';
import { 
    Calendar, Clock, User, 
    PhoneInput, ChevronLeft, timeToMinutes, MapPin, Check, X, Search, Smartphone, Trash, Info, Sun, Moon, Store, Scissors, AlertTriangle, WhatsApp
} from '../constants';
import { useTheme, useDemoData } from '../App';

// --- UTILS ---
const getNextDays = (days: number) => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date);
    }
    return dates;
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const weekDaysPT: { [key: string]: string } = {
    sunday: 'Domingo', monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta',
    thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado',
};

// --- COMPONENT ---
const PublicBookingPage: React.FC = () => {
    // Business Data
    const [business, setBusiness] = useState<BusinessInfo | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    
    // View State
    const [view, setView] = useState<'booking' | 'lookup'>('booking');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { theme, toggleTheme } = useTheme();
    const isDarkMode = theme === 'dark';

    // Booking Wizard State
    const [step, setStep] = useState<number>(1);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSuccessData, setBookingSuccessData] = useState<any | null>(null);
    const [busySlots, setBusySlots] = useState<string[]>([]);

    // Lookup State
    const [lookupPhone, setLookupPhone] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);
    const [myAppointments, setMyAppointments] = useState<(Appointment & { service: Service, professional: Professional })[]>([]);
    
    // Cancellation State
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [apptToCancel, setApptToCancel] = useState<any>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancellationSuccess, setCancellationSuccess] = useState<boolean>(false);
    const { isDemo, demoData, setDemoData } = useDemoData();

    // 1. Fetch Business Data
    useEffect(() => {
        const fetchBusiness = async () => {
            const hash = window.location.hash; 
            const slug = hash.replace(/^#\//, '').split('?')[0]; 

            if (!slug) {
                setError('Loja não encontrada.');
                setLoading(false);
                return;
            }

            // Handle Demo Mode
            if (slug === 'demonstracao' || isDemo) {
                setBusiness(demoData.business);
                setServices(demoData.services);
                setProfessionals(demoData.professionals);
                setLoading(false);
                return;
            }

            const { data: bizData, error: bizError } = await supabase
                .from('businesses')
                .select('*')
                .eq('slug', slug)
                .single();

            if (bizError || !bizData) {
                setError('Barbearia não encontrada.');
                setLoading(false);
                return;
            }

            setBusiness(bizData as BusinessInfo);

            const [sRes, pRes] = await Promise.all([
                supabase.from('services').select('*').eq('business_id', bizData.id).order('name'),
                supabase.from('professionals').select('*').eq('business_id', bizData.id).order('name')
            ]);

            if (sRes.data) setServices(sRes.data as Service[]);
            if (pRes.data) setProfessionals(pRes.data as Professional[]);
            
            setLoading(false);
        };
        fetchBusiness();
    }, []);

    // 2. Fetch Availability
    useEffect(() => {
        const fetchAvailability = async () => {
            if (!business || !selectedProfessional || !selectedDate) return;
            
            // Skip fetching for demo mode
            if (isDemo || window.location.hash.includes('demonstracao')) {
                setBusySlots([]);
                return;
            }

            const dateStr = selectedDate.toISOString().split('T')[0];
            
            const [appRes, blockRes] = await Promise.all([
                supabase.from('appointments')
                    .select('time, service_id, status')
                    .eq('business_id', business.id)
                    .eq('professional_id', selectedProfessional.id)
                    .eq('date', dateStr)
                    .neq('status', 'cancelled')
                    .neq('status', 'declined'),
                supabase.from('blocks')
                    .select('start_time, end_time')
                    .eq('business_id', business.id)
                    .eq('professional_id', selectedProfessional.id)
                    .eq('date', dateStr)
            ]);

            const busy: string[] = [];
            
            if (appRes.data) {
                appRes.data.forEach((app: any) => {
                    const srv = services.find(s => s.id === app.service_id);
                    const duration = srv ? srv.duration : 30;
                    let start = timeToMinutes(app.time);
                    let end = start + duration;
                    for(let t = start; t < end; t += 30) {
                         const h = Math.floor(t / 60).toString().padStart(2, '0');
                         const m = (t % 60).toString().padStart(2, '0');
                         busy.push(`${h}:${m}`);
                    }
                });
            }

            if (blockRes.data) {
                blockRes.data.forEach((block: any) => {
                    let start = timeToMinutes(block.start_time);
                    let end = timeToMinutes(block.end_time);
                    for(let t = start; t < end; t += 30) {
                         const h = Math.floor(t / 60).toString().padStart(2, '0');
                         const m = (t % 60).toString().padStart(2, '0');
                         busy.push(`${h}:${m}`);
                    }
                });
            }
            setBusySlots(busy);
        };
        fetchAvailability();
    }, [business, selectedProfessional, selectedDate, services]);

    // Computed Data
    const availableDates = useMemo(() => getNextDays(30), []);
    const availableProfessionals = useMemo(() => {
        if (!selectedService) return [];
        return professionals.filter(p => p.service_ids && p.service_ids.includes(selectedService.id));
    }, [selectedService, professionals]);

    const timeSlots = useMemo(() => {
        if (!selectedProfessional || !selectedDate) return [];
        const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][selectedDate.getDay()];
        const schedule = Array.isArray(selectedProfessional.work_hours?.[dayKey]) ? selectedProfessional.work_hours[dayKey] : [];
        const bizSchedule = Array.isArray(business?.work_hours?.[dayKey]) ? business.work_hours[dayKey] : [];

        if (schedule.length === 0) return [];
        if (bizSchedule.length === 0) return [];

        const slots: string[] = [];
        schedule.forEach(shift => {
            let start = timeToMinutes(shift.start);
            let end = timeToMinutes(shift.end);
            while (start < end) {
                const h = Math.floor(start / 60).toString().padStart(2, '0');
                const m = (start % 60).toString().padStart(2, '0');
                const timeStr = `${h}:${m}`;
                const now = new Date();
                const isToday = selectedDate.getDate() === now.getDate() && selectedDate.getMonth() === now.getMonth();
                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                const isPast = isToday && start < currentMinutes;
                
                // Duration Check: Check if booking duration fits
                const duration = selectedService?.duration || 30;
                const slotEnd = start + duration;
                
                // Check collision for the full duration of the service
                let collision = false;
                for(let t = start; t < slotEnd; t+=30) {
                    const hC = Math.floor(t / 60).toString().padStart(2, '0');
                    const mC = (t % 60).toString().padStart(2, '0');
                    if (busySlots.includes(`${hC}:${mC}`)) collision = true;
                }

                // Ensure slot + duration doesn't exceed shift end
                const fitsInShift = slotEnd <= end;

                if (!isPast && !collision && fitsInShift) {
                    slots.push(timeStr);
                }
                start += 30;
            }
        });
        return slots;
    }, [selectedProfessional, selectedDate, business, busySlots, selectedService]);

    // --- Header Logic ---
    const getBusinessStatusInfo = useMemo(() => {
        if (!business) return { isOpen: false, statusText: 'Fechado', nextOpenText: '' };

        const now = new Date();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDayIndex = now.getDay();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        // 1. Check if Open NOW
        const todayKey = days[currentDayIndex];
        const todaySlots = Array.isArray(business.work_hours?.[todayKey]) ? business.work_hours[todayKey] : [];
        let isOpenNow = false;
        
        for (const slot of todaySlots) {
            const start = timeToMinutes(slot.start);
            const end = timeToMinutes(slot.end);
            if (currentMinutes >= start && currentMinutes < end) {
                isOpenNow = true;
                break;
            }
        }

        // 2. Logic for Display Text
        let displayText = '';
        
        if (isOpenNow) {
             const sorted = [...todaySlots].sort((a,b) => timeToMinutes(a.end) - timeToMinutes(b.end));
             displayText = `Até às ${sorted[sorted.length-1].end}`;
        } else if (todaySlots.length > 0) {
             // Closed but might open later today
             const sorted = [...todaySlots].sort((a,b) => timeToMinutes(a.start) - timeToMinutes(b.start));
             const nextSlot = sorted.find(s => timeToMinutes(s.start) > currentMinutes);
             if (nextSlot) {
                 displayText = `Reabre hoje às ${nextSlot.start}`;
             }
        }

        if (!displayText) {
            // Check Tomorrow
            const tomorrowIndex = (currentDayIndex + 1) % 7;
            const tomorrowKey = days[tomorrowIndex];
            const tomorrowSlots = Array.isArray(business.work_hours?.[tomorrowKey]) ? business.work_hours[tomorrowKey] : [];

            if (tomorrowSlots.length > 0) {
                const sorted = [...tomorrowSlots].sort((a,b) => timeToMinutes(a.start) - timeToMinutes(b.start));
                displayText = `Abre Amanhã às ${sorted[0].start}`;
            } else {
                // Check Next Days
                let foundNext = false;
                for (let i = 2; i <= 7; i++) {
                    const checkIndex = (currentDayIndex + i) % 7;
                    const checkKey = days[checkIndex];
                    const slots = Array.isArray(business.work_hours?.[checkKey]) ? business.work_hours[checkKey] : [];
                    
                    if (slots.length > 0) {
                        const sorted = [...slots].sort((a,b) => timeToMinutes(a.start) - timeToMinutes(b.start));
                        const dayName = weekDaysPT[checkKey];
                        displayText = `Abre ${dayName} às ${sorted[0].start}`;
                        foundNext = true;
                        break;
                    }
                }
                if (!foundNext) displayText = 'Sem horários definidos';
            }
        }

        return {
            isOpen: isOpenNow,
            statusText: isOpenNow ? 'Aberto' : 'Fechado',
            nextOpenText: displayText
        };

    }, [business]);

    // --- HANDLERS: BOOKING FLOW ---

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedService || !selectedProfessional || !selectedDate || !selectedTime || !business) return;
        if (!clientName || !clientPhone) return alert('Preencha seus dados.');

        setBookingLoading(true);

        // Handle Demo Mode Success
        if (isDemo || window.location.hash.includes('demonstracao')) {
            const newApp: Appointment = {
                id: Math.random().toString(36).substr(2, 9),
                business_id: business.id,
                client_id: 'demo-client',
                service_id: selectedService.id,
                professional_id: selectedProfessional.id,
                date: selectedDate.toISOString().split('T')[0],
                time: selectedTime,
                status: 'confirmed'
            };

            setDemoData(prev => ({
                ...prev,
                appointments: [...prev.appointments, newApp]
            }));

            setTimeout(() => {
                setBookingSuccessData({
                    ...newApp,
                    service: selectedService,
                    professional: selectedProfessional,
                    date: selectedDate.toISOString().split('T')[0],
                    time: selectedTime
                });
                setBookingLoading(false);
                setStep(5); // Success Step
            }, 1500);
            return;
        }

        try {
            // 1. Find or Create Client
            let clientId: number;
            const { data: existingClient } = await supabase
                .from('clients')
                .select('id')
                .eq('business_id', business.id)
                .eq('phone', clientPhone)
                .maybeSingle();

            if (existingClient) {
                clientId = existingClient.id;
            } else {
                const { data: newClient, error: clientError } = await supabase
                    .from('clients')
                    .insert({ name: clientName, phone: clientPhone, business_id: business.id, status: 'active' })
                    .select().single();
                if (clientError) throw clientError;
                clientId = newClient.id;
            }

            // 2. Create Appointment - STATUS ALWAYS CONFIRMED
            const dateStr = selectedDate.toISOString().split('T')[0];
            const { data: appointment, error: appError } = await supabase
                .from('appointments')
                .insert({
                    business_id: business.id,
                    client_id: clientId,
                    professional_id: selectedProfessional.id,
                    service_id: selectedService.id,
                    date: dateStr,
                    time: selectedTime,
                    status: 'confirmed'
                })
                .select().single();

            if (appError) throw appError;

            setBookingSuccessData({ appointment, service: selectedService, professional: selectedProfessional, date: dateStr, time: selectedTime });
            setStep(5); // Success Step

        } catch (err: any) {
            console.error(err);
            alert('Erro ao realizar agendamento. Tente novamente.');
        } finally {
            setBookingLoading(false);
        }
    };

    const generateWhatsAppNotifyLink = () => {
        if (!bookingSuccessData || !bookingSuccessData.professional.whatsapp_phone) return null;
        
        const { professional, service, date, time } = bookingSuccessData;
        const dateFormatted = new Date(date).toLocaleDateString('pt-BR');
        
        // Assertive confirmation message
        const message = `Olá ${professional.name}! 👋\nAcabei de agendar pelo site:\n\n✂️ *${service.name}*\n📅 *${dateFormatted}* às *${time}*\n👤 Cliente: *${clientName}*\n\nEstarei lá! 👍`;
        
        const phone = professional.whatsapp_phone.replace(/\D/g, '');
        return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    };

    const resetBooking = () => {
        setStep(1);
        setSelectedService(null);
        setSelectedProfessional(null);
        setSelectedTime('');
        setBookingSuccessData(null);
    };

    // --- HANDLERS: LOOKUP & CANCEL ---

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lookupPhone || !business) return;
        setLookupLoading(true);

        // Handle Demo Mode
        if (isDemo || window.location.hash.includes('demonstracao')) {
            setTimeout(() => {
                const apps = demoData.appointments.map(app => ({
                    ...app,
                    service: demoData.services.find(s => s.id === app.service_id)!,
                    professional: demoData.professionals.find(p => p.id === app.professional_id)!
                }));
                setMyAppointments(apps as any);
                setLookupLoading(false);
            }, 1000);
            return;
        }

        // 1. Find Client
        const { data: client } = await supabase.from('clients').select('id').eq('business_id', business.id).eq('phone', lookupPhone).maybeSingle();
        
        if (!client) {
            setMyAppointments([]);
            setLookupLoading(false);
            alert('Nenhum cliente encontrado com este telefone.');
            return;
        }

        // 2. Fetch Appointments
        const today = new Date().toISOString().split('T')[0];
        const { data: apps } = await supabase
            .from('appointments')
            .select(`
                *,
                service:services(*),
                professional:professionals(*)
            `)
            .eq('client_id', client.id)
            .gte('date', today)
            .neq('status', 'cancelled')
            .order('date', { ascending: true })
            .order('time', { ascending: true });

        if (apps) setMyAppointments(apps as any);
        else setMyAppointments([]);
        
        setLookupLoading(false);
    };

    const openCancelModal = (appt: any) => {
        // Check 10 minute rule
        const apptDateTime = new Date(`${appt.date}T${appt.time}`);
        const now = new Date();
        const diffMs = apptDateTime.getTime() - now.getTime();
        const diffMins = diffMs / 60000;

        if (diffMins < 10 && diffMins > 0) {
            alert("Não é possível desistir com menos de 10 minutos de antecedência.");
            return;
        }
        if (diffMins <= 0) {
             alert("Não é possível desistir de um agendamento passado.");
             return;
        }

        setApptToCancel(appt);
        setCancelModalOpen(true);
        setCancelReason('');
        setCancellationSuccess(false); // Reset status
    };

    const confirmCancellation = async () => {
        if (!apptToCancel) return;
        
        const { error } = await supabase
            .from('appointments')
            .update({ status: 'cancelled', cancellation_reason: cancelReason })
            .eq('id', apptToCancel.id);

        if (error) {
            alert('Erro ao processar desistência. Tente novamente.');
        } else {
            // Update local list
            setMyAppointments(prev => prev.filter(a => a.id !== apptToCancel.id));
            // Show success screen within modal
            setCancellationSuccess(true);
        }
    };

    const getCancelWhatsAppLink = () => {
        if(!apptToCancel || !apptToCancel.professional.whatsapp_phone) return null;
        
        const phone = apptToCancel.professional.whatsapp_phone.replace(/\D/g, '');
        const dateF = new Date(apptToCancel.date).toLocaleDateString('pt-BR');
        const msg = `Olá ${apptToCancel.professional.name}. Precisei desistir do meu agendamento de *${dateF}* às *${apptToCancel.time}*.${cancelReason ? `\nMotivo: ${cancelReason}` : ''}\n\nDesculpe o transtorno.`;
        
        return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-slate-500 animate-pulse dark:bg-slate-900 dark:text-slate-400">Carregando...</div>;
    if (error) return <div className="flex h-screen items-center justify-center text-red-500 dark:bg-slate-900">{error}</div>;
    if (!business) return null;

    // Full Address String Construction (Single Line)
    const fullAddress = [
        business.street,
        business.number,
        business.neighborhood,
        business.city,
        business.state
    ].filter(Boolean).join(', ');

    return (
        <div className="min-h-screen text-slate-900 dark:text-slate-100 font-sans pb-24 md:pb-0 transition-colors duration-300 relative overflow-hidden flex flex-col">
            {/* Demo Mode Banner */}
            {(isDemo || window.location.hash.includes('demonstracao')) && (
                <div className="bg-slate-900 text-white px-4 py-2 flex justify-between items-center z-50 shadow-md shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-70">Modo Demo</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => {
                                window.location.hash = '#signup';
                            }}
                            className="bg-white text-slate-900 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold hover:bg-slate-100 transition-colors"
                        >
                            Começar Grátis
                        </button>
                        <button 
                            onClick={() => window.location.hash = '#'}
                            className="text-white/60 hover:text-white text-[10px] sm:text-xs font-medium"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 relative overflow-hidden">
            {/* --- COMPACT HEADER --- */}
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md sticky top-0 z-30 shadow-sm border-b border-slate-100 dark:border-slate-700/50 transition-colors duration-300 rounded-b-2xl">
                <div className="max-w-xl mx-auto px-3 sm:px-4 pt-3 pb-1.5 relative">
                    
                    {/* Absolute Theme Toggle (Top Right) */}
                    <button 
                        onClick={toggleTheme} 
                        className="absolute top-4 right-3 sm:right-4 p-2 rounded-full bg-slate-50 dark:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors z-10"
                    >
                        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>

                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 animate-fade-in-down">
                        
                        {/* Compact Logo */}
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0.5 bg-gradient-to-tr from-gold-300 to-gold-500 shadow-md shrink-0">
                            <div className="w-full h-full rounded-full bg-white dark:bg-slate-800 overflow-hidden relative border-2 border-white dark:border-slate-800">
                                {business.logo_url ? (
                                    <img src={business.logo_url} alt="Logo" className="w-full h-full object-cover"/>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-400">
                                        <Store className="w-6 h-6" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info Block - Left Aligned & Compact */}
                        <div className="flex-1 min-w-0 pr-10 sm:pr-8"> {/* Right padding prevents text hitting the theme toggle */}
                            <h1 className="text-lg sm:text-xl font-serif font-bold tracking-tight leading-tight transition-colors duration-300">
                                <span className="text-slate-900 dark:text-white">Agenda</span>
                                <span className="text-gold-600 dark:text-gold-400">Visual</span>
                            </h1>
                            
                            <p className={`text-[10px] sm:text-xs w-full flex items-center gap-1 mt-0.5 transition-colors duration-300 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{fullAddress}</span>
                            </p>

                            {/* Combined Status Line */}
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                                <div className="flex items-center gap-1.5">
                                    <span className="relative flex h-2 w-2 shrink-0">
                                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getBusinessStatusInfo.isOpen ? 'bg-emerald-400' : 'bg-rose-400 opacity-0'}`}></span>
                                      <span className={`relative inline-flex rounded-full h-2 w-2 ${getBusinessStatusInfo.isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                    </span>
                                    <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${getBusinessStatusInfo.isOpen ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600') : (isDarkMode ? 'text-rose-400' : 'text-rose-600')}`}>
                                        {getBusinessStatusInfo.statusText}
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-400 hidden sm:inline">•</span>
                                <span className={`text-[9px] sm:text-[10px] font-medium flex items-center gap-1 transition-colors duration-300 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    <Clock className="w-3 h-3 text-gold-500" />
                                    {getBusinessStatusInfo.nextOpenText}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compact Navigation Tabs */}
                <div className="flex border-t border-slate-100 dark:border-slate-700/50 max-w-xl mx-auto mt-2">
                    <button 
                        onClick={() => setView('booking')} 
                        className={`flex-1 py-2.5 text-xs sm:text-sm font-bold text-center transition-colors relative ${view === 'booking' ? (isDarkMode ? 'text-primary-400' : 'text-primary-600') : (isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50')}`}
                    >
                        Agendar
                        {view === 'booking' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 mx-auto w-8 rounded-t-full"></div>}
                    </button>
                    <button 
                        onClick={() => setView('lookup')} 
                        className={`flex-1 py-2.5 text-xs sm:text-sm font-bold text-center transition-colors relative ${view === 'lookup' ? (isDarkMode ? 'text-primary-400' : 'text-primary-600') : (isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50')}`}
                    >
                        Meus Agendamentos
                        {view === 'lookup' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 mx-auto w-8 rounded-t-full"></div>}
                    </button>
                </div>
            </div>

            <div className="max-w-xl mx-auto p-3 sm:p-5">
                
                {/* === VIEW: BOOKING WIZARD === */}
                {view === 'booking' && (
                    <div className="animate-fade-in-down space-y-5">
                        {step === 5 ? (
                            // SUCCESS SCREEN (Refined UI for Auto-Confirm)
                            <div className="space-y-6 animate-fade-in-down">
                                {/* Header Sentiment */}
                                <div className="text-center pt-2">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Agendamento Realizado!</h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Seu horário já consta em nosso sistema.</p>
                                </div>

                                {/* Summary Ticket Card */}
                                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative">
                                    {/* Decorative Top Border */}
                                    <div className="h-2 w-full bg-emerald-500"></div>
                                    
                                    <div className="p-6 space-y-4">
                                        <div className="flex justify-between items-center pb-4 border-b border-dashed border-slate-200 dark:border-slate-700">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Serviço</p>
                                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{bookingSuccessData?.service.name}</h3>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded">RESERVADO</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 items-center">
                                            <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600">
                                                {bookingSuccessData?.professional.avatar_url ? (
                                                    <img 
                                                        src={bookingSuccessData.professional.avatar_url} 
                                                        className="w-full h-full object-cover rounded-xl" 
                                                        alt="Profissional" 
                                                        referrerPolicy="no-referrer"
                                                    />
                                                ) : (
                                                    <User className="w-6 h-6 text-slate-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profissional</p>
                                                <p className="font-bold text-slate-800 dark:text-slate-200">{bookingSuccessData?.professional.name}</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="w-5 h-5 text-slate-400" />
                                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                                    {new Date(bookingSuccessData?.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long' })}
                                                </span>
                                            </div>
                                            <div className="h-8 w-px bg-slate-200 dark:bg-slate-600"></div>
                                            <div className="flex items-center gap-3">
                                                <Clock className="w-5 h-5 text-slate-400" />
                                                <span className="font-bold text-lg text-slate-900 dark:text-white">
                                                    {bookingSuccessData?.time}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Decorative circles mimicking ticket cutouts */}
                                    <div className="absolute top-[88px] -left-3 w-6 h-6 bg-slate-50 dark:bg-slate-900 rounded-full"></div>
                                    <div className="absolute top-[88px] -right-3 w-6 h-6 bg-slate-50 dark:bg-slate-900 rounded-full"></div>
                                </div>

                                {/* Warning / Notice */}
                                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-800/30 flex gap-3 items-start">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
                                        Importante: Chegue com <strong>10 minutos de antecedência</strong> para garantir seu atendimento no horário.
                                    </p>
                                </div>

                                {/* Primary Action */}
                                <div className="pt-2 space-y-4">
                                    {generateWhatsAppNotifyLink() && (
                                        <a 
                                            href={generateWhatsAppNotifyLink()!}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full py-4 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-3"
                                        >
                                            <Smartphone className="w-6 h-6" />
                                            Avisar Profissional
                                        </a>
                                    )}
                                    <p className="text-center text-[10px] text-slate-400 px-4">
                                        Ao clicar, você enviará o comprovante ao WhatsApp do profissional.
                                    </p>
                                </div>
                                
                                <button onClick={resetBooking} className="w-full text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 py-2">
                                    Voltar ao início
                                </button>
                            </div>
                        ) : (
                            // STEPS
                            <>
                                {/* Step Indicator */}
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <div className="flex items-center gap-2">
                                        {step > 1 && (
                                            <button onClick={() => setStep(step - 1)} className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500"><ChevronLeft className="w-4 h-4"/></button>
                                        )}
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Passo {step} de 4</span>
                                    </div>
                                    <div className="flex gap-1">
                                        {[1,2,3,4].map(i => <div key={i} className={`h-1 w-6 rounded-full transition-colors ${i <= step ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'}`}></div>)}
                                    </div>
                                </div>

                                {/* Step 1: Services */}
                                {step === 1 && (
                                    <div className="space-y-4 animate-slide-up">
                                        <h2 className="text-xl font-bold transition-colors duration-300 text-slate-950 dark:text-slate-100">Selecione o Serviço</h2>
                                        <div className="grid gap-3">
                                            {services.map(srv => (
                                                <button 
                                                    key={srv.id} 
                                                    onClick={() => { setSelectedService(srv); setStep(2); }}
                                                    className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center hover:border-primary-500 dark:hover:border-primary-500 transition-all text-left group"
                                                >
                                                    <div>
                                                        <h3 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary-700 dark:group-hover:text-primary-400">{srv.name}</h3>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                                            <Clock className="w-3 h-3"/> {srv.duration} min
                                                        </p>
                                                    </div>
                                                    <span className="font-bold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-700 px-3 py-1.5 rounded-lg">{formatCurrency(srv.price)}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Professionals */}
                                {step === 2 && (
                                    <div className="space-y-4 animate-slide-up">
                                        <h2 className="text-xl font-bold transition-colors duration-300 text-slate-950 dark:text-slate-100">Escolha o Profissional</h2>
                                        <div className="grid grid-cols-2 gap-3">
                                            {availableProfessionals.map(prof => (
                                                <button 
                                                    key={prof.id} 
                                                    onClick={() => { setSelectedProfessional(prof); setStep(3); }}
                                                    className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center gap-2 hover:border-primary-500 dark:hover:border-primary-500 transition-all text-center"
                                                >
                                                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden shadow-sm">
                                                        {prof.avatar_url ? (
                                                            <img 
                                                                src={prof.avatar_url} 
                                                                className="w-full h-full object-cover" 
                                                                referrerPolicy="no-referrer"
                                                                alt={prof.name}
                                                            />
                                                        ) : (
                                                            <User className="w-full h-full p-4 text-slate-300"/>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">{prof.name}</h3>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Date & Time */}
                                {step === 3 && (
                                    <div className="space-y-6 animate-slide-up">
                                        <div>
                                            <h2 className="text-xl font-bold mb-4 transition-colors duration-300 text-slate-950 dark:text-slate-100">Escolha a Data</h2>
                                            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                                                {availableDates.map((d, i) => {
                                                    const isSel = d.toDateString() === selectedDate.toDateString();
                                                    return (
                                                        <button 
                                                            key={i} 
                                                            onClick={() => { setSelectedDate(d); setSelectedTime(''); }}
                                                            className={`flex-shrink-0 w-14 h-16 rounded-2xl flex flex-col items-center justify-center border transition-all ${isSel ? 'bg-slate-900 text-white border-slate-900 shadow-md dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}
                                                        >
                                                            <span className="text-[10px] font-bold uppercase">{d.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                                                            <span className="text-xl font-bold">{d.getDate()}</span>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold mb-4 transition-colors duration-300 text-slate-950 dark:text-slate-100">Escolha o Horário</h2>
                                            {timeSlots.length > 0 ? (
                                                <div className="grid grid-cols-4 gap-2">
                                                    {timeSlots.map(t => (
                                                        <button 
                                                            key={t} 
                                                            onClick={() => { setSelectedTime(t); setStep(4); }}
                                                            className="py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-primary-500 dark:hover:border-primary-500 hover:text-primary-700 dark:hover:text-primary-400 transition-colors"
                                                        >
                                                            {t}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-2xl text-center text-slate-500 dark:text-slate-400 text-sm">
                                                    Sem horários disponíveis para esta data.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Step 4: Confirmation & Form */}
                                {step === 4 && (
                                    <form onSubmit={handleBooking} className="space-y-6 animate-slide-up">
                                        <div className="text-center">
                                            <h2 className="text-2xl font-bold transition-colors duration-300 text-slate-950 dark:text-slate-100">Finalizar Dados</h2>
                                            <p className="text-sm font-bold transition-colors duration-300 text-slate-800 dark:text-slate-400">Informe seus dados para continuar.</p>
                                        </div>

                                        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-primary-500"></div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-xs text-slate-400 font-bold uppercase">Serviço</p>
                                                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedService?.name}</h3>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{formatCurrency(selectedService?.price || 0)}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-700 pt-4">
                                                <div>
                                                    <p className="text-xs text-slate-400 font-bold uppercase">Profissional</p>
                                                    <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{selectedProfessional?.name}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-slate-400 font-bold uppercase">Data & Hora</p>
                                                    <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{selectedDate.toLocaleDateString('pt-BR')} - {selectedTime}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase ml-1 mb-1">Seu Nome</label>
                                                <input 
                                                    type="text" 
                                                    required
                                                    value={clientName}
                                                    onChange={e => setClientName(e.target.value)}
                                                    className="w-full px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-slate-950 dark:text-slate-100 font-medium placeholder-slate-500"
                                                    placeholder="Ex: João da Silva"
                                                />
                                            </div>
                                            <div>
                                                <PhoneInput 
                                                    label="Seu WhatsApp"
                                                    value={clientPhone}
                                                    onChange={setClientPhone}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <button 
                                                type="submit" 
                                                disabled={bookingLoading}
                                                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-lg hover:bg-slate-800 transition-transform active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 dark:bg-white dark:text-slate-900"
                                            >
                                                {bookingLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'CONFIRMAR RESERVA'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* === VIEW: LOOKUP (MEUS AGENDAMENTOS) === */}
                {view === 'lookup' && (
                    <div className="animate-fade-in-down space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 text-center">
                            <h2 className="text-xl font-bold mb-2 transition-colors duration-300 text-slate-950 dark:text-slate-100">Consultar Agendamentos</h2>
                            <p className="text-sm font-bold mb-4 transition-colors duration-300 text-slate-800 dark:text-slate-400">Digite seu número para ver seus horários futuros.</p>
                            
                            <form onSubmit={handleLookup} className="space-y-4">
                                <PhoneInput 
                                    value={lookupPhone}
                                    onChange={setLookupPhone}
                                    placeholder="Seu número de celular"
                                />
                                <button 
                                    type="submit" 
                                    disabled={lookupLoading}
                                    className="w-full py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors flex justify-center items-center gap-2"
                                >
                                    {lookupLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Search className="w-5 h-5"/> Buscar</>}
                                </button>
                            </form>
                        </div>

                        <div className="space-y-4">
                            {myAppointments.length > 0 && (
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Seus Horários</h3>
                            )}
                            {myAppointments.map(app => (
                                <div key={app.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col gap-3 group transition-all hover:shadow-md">
                                    <div className="flex gap-4">
                                        {/* Date Box - Aesthetic Change */}
                                        <div className="flex flex-col items-center justify-center w-14 h-16 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl shrink-0 shadow-md">
                                            <span className="text-[10px] font-bold uppercase opacity-80">{new Date(app.date).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span>
                                            <span className="text-xl font-bold">{new Date(app.date).getDate()}</span>
                                        </div>

                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{app.service.name}</h4>
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                                                    app.status === 'confirmed'
                                                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' 
                                                    : app.status === 'completed' 
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    : app.status === 'cancelled'
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                                }`}>
                                                    {app.status === 'confirmed' ? 'Reservado' : app.status === 'cancelled' ? 'Desistiu' : app.status}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-3 mt-2">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {app.time}
                                                </div>
                                                
                                                <div className="flex items-center gap-1.5">
                                                    {/* Improved Avatar */}
                                                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 border border-slate-100 dark:border-slate-600">
                                                        {app.professional.avatar_url ? (
                                                            <img 
                                                                src={app.professional.avatar_url} 
                                                                className="w-full h-full object-cover"
                                                                referrerPolicy="no-referrer"
                                                                alt={app.professional.name}
                                                            />
                                                        ) : (
                                                            <User className="w-full h-full p-1 text-slate-400"/>
                                                        )}
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[100px]">{app.professional.name.split(' ')[0]}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Action */}
                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50 flex justify-end">
                                        <button 
                                            onClick={() => openCancelModal(app)}
                                            className="text-red-500 text-xs font-bold flex items-center gap-1 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            <Trash className="w-3.5 h-3.5"/> Desistir
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {lookupPhone && !lookupLoading && myAppointments.length === 0 && (
                                <div className="text-center py-10 text-slate-400">
                                    <Info className="w-10 h-10 mx-auto mb-2 opacity-50"/>
                                    <p>Nenhum agendamento futuro encontrado.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* Cancel Modal */}
            {cancelModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in-down">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
                        {cancellationSuccess ? (
                            // SUCCESS STATE
                            <div className="text-center space-y-6">
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                                    <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Desistência Confirmada</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Seu horário foi liberado no sistema.</p>
                                </div>
                                
                                {getCancelWhatsAppLink() && (
                                    <a 
                                        href={getCancelWhatsAppLink()!}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full py-4 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <WhatsApp className="w-5 h-5" />
                                        Enviar Comprovante ao Profissional
                                    </a>
                                )}
                                
                                <button 
                                    onClick={() => setCancelModalOpen(false)}
                                    className="text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    Fechar
                                </button>
                            </div>
                        ) : (
                            // CONFIRMATION STATE
                            <>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Desistir do Agendamento?</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Deseja realmente desistir? Se possível, informe o motivo abaixo.</p>
                                
                                <textarea 
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900 outline-none resize-none mb-4 text-slate-900 dark:text-white"
                                    rows={3}
                                    placeholder="Motivo (Opcional)..."
                                    value={cancelReason}
                                    onChange={e => setCancelReason(e.target.value)}
                                ></textarea>

                                <div className="flex gap-3">
                                    <button onClick={() => setCancelModalOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600">Voltar</button>
                                    <button onClick={confirmCancellation} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/30">Confirmar</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Footer Brand */}
            <div className="fixed bottom-0 w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-700 p-3 text-center z-20 pb-safe">
                <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <Scissors className="w-3 h-3" />
                    <strong>AgendaVisual</strong> by <strong>AG Sistemas</strong>
                </p>
            </div>

            <style>{`
                .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
                @keyframes fade-in-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-down { animation: fade-in-down 0.3s ease-out forwards; }
            `}</style>
            </div>
        </div>
    );
};

export default PublicBookingPage;