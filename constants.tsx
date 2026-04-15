
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Settings, 
  ExternalLink, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronDown, 
  Check, 
  Users, 
  Bell, 
  BarChart3, 
  TrendingUp, 
  Globe, 
  Home, 
  Store, 
  Scissors, 
  Briefcase, 
  DollarSign, 
  Clock, 
  Plus, 
  Edit, 
  X, 
  Menu, 
  Ban, 
  Download, 
  MessageSquare, 
  Share2, 
  Sun, 
  Moon, 
  AlertTriangle, 
  MapPin, 
  Phone, 
  Camera, 
  Activity, 
  CreditCard, 
  List, 
  Star, 
  User, 
  UserX, 
  Info, 
  Trash2, 
  Search, 
  Filter, 
  MoreVertical, 
  Copy, 
  Save, 
  Shield, 
  ShieldCheck,
  Smartphone, 
  Loader2,
  LayoutDashboard,
  Palette,
  Link as LinkIcon
} from 'lucide-react';

// SHARED UTILITY FUNCTIONS
export const timeToMinutes = (time: string): number => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

// ICONS (Re-exporting from lucide-react for consistency)
export { 
  Calendar, 
  Settings, 
  ExternalLink, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronDown, 
  Check, 
  Users, 
  Bell, 
  BarChart3, 
  TrendingUp, 
  Globe, 
  Home, 
  Store, 
  Scissors, 
  Briefcase, 
  DollarSign, 
  Clock, 
  Plus, 
  Edit, 
  X, 
  Menu, 
  Ban, 
  Download, 
  MessageSquare, 
  Share2, 
  Sun, 
  Moon, 
  AlertTriangle, 
  MapPin, 
  Phone, 
  Camera, 
  Activity, 
  CreditCard, 
  List, 
  Star, 
  User, 
  UserX, 
  Info, 
  Trash2 as Trash, 
  Search, 
  Filter, 
  MoreVertical, 
  Copy, 
  Save, 
  Shield, 
  ShieldCheck,
  Smartphone, 
  Loader2,
  LayoutDashboard,
  Palette,
  LinkIcon as Link,
  BarChart3 as ChartBar
};

export const WhatsApp = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" /></svg>
);

// LEGACY EXPORTS (for backward compatibility)
export const IconCalendar = Calendar;
export const IconSettings = Settings;
export const IconExternalLink = ExternalLink;
export const IconLogout = LogOut;
export const IconChevronLeft = ChevronLeft;
export const IconChevronRight = ChevronRight;
export const IconChevronsLeft = ChevronsLeft;
export const IconChevronDown = ChevronDown;
export const IconCheck = Check;
export const IconUsers = Users;
export const IconBell = Bell;
export const IconChart = BarChart3;
export const IconTrendingUp = TrendingUp;
export const IconGlobe = Globe;
export const IconHome = Home;
export const IconStore = Store;
export const IconScissors = Scissors;
export const IconBriefcase = Briefcase;
export const IconDollarSign = DollarSign;
export const IconClock = Clock;
export const IconPlus = Plus;
export const IconEdit = Edit;
export const IconX = X;
export const IconMenu = Menu;
export const IconBlock = Ban;
export const IconDownload = Download;
export const IconMessageSquare = MessageSquare;
export const IconShare = Share2;
export const IconSun = Sun;
export const IconMoon = Moon;
export const IconWhatsApp = WhatsApp;
export const IconAlertTriangle = AlertTriangle;
export const IconMapPin = MapPin;
export const IconPhone = Phone;
export const IconCamera = Camera;
export const IconActivity = Activity;
export const IconCreditCard = CreditCard;
export const IconList = List;
export const IconStar = Star;
export const IconUser = User;
export const IconUserX = UserX;
export const IconInfo = Info;
export const IconTrash = Trash2;
export const IconSearch = Search;
export const IconFilter = Filter;
export const IconMoreVertical = MoreVertical;
export const IconCopy = Copy;
export const IconSave = Save;
export const IconShield = Shield;
export const IconSmartphone = Smartphone;
export const IconLink = LinkIcon;

// PHONE INPUT COMPONENT
const COUNTRY_CODES = [
    { code: '+55', country: 'BR', flag: '🇧🇷', mask: '(##) #####-####' },
    { code: '+1', country: 'US', flag: '🇺🇸', mask: '(###) ###-####' },
    { code: '+351', country: 'PT', flag: '🇵🇹', mask: '### ### ###' },
    { code: '+44', country: 'UK', flag: '🇬🇧', mask: '#### ###### ' },
    { code: '+34', country: 'ES', flag: '🇪🇸', mask: '### ### ###' },
    { code: '+33', country: 'FR', flag: '🇫🇷', mask: '## ## ## ## ##' },
    { code: '+49', country: 'DE', flag: '🇩🇪', mask: '#### #######' },
    { code: '+39', country: 'IT', flag: '🇮🇹', mask: '### #######' },
    { code: '+81', country: 'JP', flag: '🇯🇵', mask: '## #### ####' },
    { code: '+86', country: 'CN', flag: '🇨🇳', mask: '### #### ####' },
];

interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    id?: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({ value, onChange, id, label, placeholder, required = false }) => {
    const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
    const [localNumber, setLocalNumber] = useState('');

    // Initialize state from incoming value
    useEffect(() => {
        if (!value) {
            setLocalNumber('');
            return;
        }

        // Try to find the country code in the value
        const foundCountry = COUNTRY_CODES.find(c => value.startsWith(c.code));
        if (foundCountry) {
            setSelectedCountry(foundCountry);
            setLocalNumber(value.replace(foundCountry.code, '').trim());
        } else {
             // If no known code found, try to remove +55 default or just show as is
             // This handles potential legacy data or user entered formats
             const cleanVal = value.replace('+55', '').replace(selectedCountry.code, '').trim();
             setLocalNumber(cleanVal);
        }
    }, [value]); 

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCode = e.target.value;
        const country = COUNTRY_CODES.find(c => c.code === newCode) || COUNTRY_CODES[0];
        setSelectedCountry(country);
        onChange(`${country.code} ${localNumber}`);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let input = e.target.value;
        setLocalNumber(input);
        onChange(`${selectedCountry.code} ${input}`);
    };
    
    const currentPlaceholder = placeholder || selectedCountry.mask || 'Digite o número';

    return (
        <div className="w-full">
            {label && <label htmlFor={id} className="block text-sm font-bold text-slate-800 dark:text-slate-300 mb-1">{label}</label>}
            
            <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-gold-500 focus-within:border-gold-500 focus-within:ring-offset-0 overflow-hidden transition-all">
                
                {/* Country Select Area */}
                <div className="relative flex items-center border-r border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 min-w-[90px] sm:min-w-[100px]">
                    <select
                        id={`${id}-country`}
                        name="country"
                        className="w-full appearance-none bg-transparent py-3 pl-3 pr-8 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer z-10 relative"
                        value={selectedCountry.code}
                        onChange={handleCountryChange}
                    >
                        {COUNTRY_CODES.map((country) => (
                            <option key={country.code} value={country.code} className="text-slate-950 bg-white dark:bg-slate-800 dark:text-slate-100">
                                {country.flag} {country.code}
                            </option>
                        ))}
                    </select>
                    {/* Custom Chevron to replace native select arrow */}
                    <div className="absolute right-2 pointer-events-none text-slate-400 z-0">
                        <IconChevronDown className="w-3 h-3" />
                    </div>
                </div>

                {/* Number Input Area */}
                <input
                    type="tel"
                    name={id}
                    id={id}
                    className="flex-1 appearance-none border-none bg-transparent py-3 px-3 text-slate-950 placeholder-slate-500 focus:ring-0 sm:text-sm font-medium dark:text-slate-100 w-full min-w-0"
                    placeholder={currentPlaceholder}
                    value={localNumber}
                    onChange={handleNumberChange}
                    required={required}
                />
            </div>
             <p className="mt-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 pl-1">
                Ex: {selectedCountry.mask}
             </p>
        </div>
    );
};


// SHARED COMPONENTS
type ConfirmationModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmButtonText?: string;
};

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, confirmButtonText = 'Confirmar' }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-sm transform transition-all scale-100 animate-fade-in-down border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100 mb-2">{title}</h3>
                <p className="text-slate-800 dark:text-slate-400 mb-6 text-sm font-medium leading-relaxed">{message}</p>
                <div className="flex justify-end space-x-3">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-sm font-bold text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-lg shadow-red-600/20 transition-colors"
                    >
                        {confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    change?: string;
    isPositive?: boolean;
    color?: 'gold' | 'primary' | 'emerald';
}

export const StatCard: React.FC<StatCardProps> = ({ icon, title, value, change, isPositive, color = 'gold' }) => {
    const colorClasses = {
        gold: 'bg-gold-100 text-gold-600 dark:bg-gold-900/20 dark:text-gold-400',
        primary: 'bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400',
        emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between transition-all hover:shadow-md">
            <div className="flex items-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
                    {icon}
                </div>
                <div className="ml-4">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{title}</p>
                    <p className="text-2xl font-bold text-slate-950 dark:text-slate-100 font-serif mt-0.5">{value}</p>
                </div>
            </div>
             {change && (
                <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {isPositive ? '↑' : '↓'} {change}
                </div>
            )}
        </div>
    );
};

// --- CHARTS ---

export const BarChart: React.FC<{
    data: { label: string; value: number }[];
    barColorClass?: string;
    labelValue?: (value: number) => string;
    height?: number;
}> = ({ data, barColorClass = 'bg-primary-500 dark:bg-primary-400', labelValue = (v) => v.toString(), height = 64 }) => {
    if (!data || data.length === 0) {
        return <div className={`text-center h-${height} flex items-center justify-center text-slate-500 dark:text-slate-400`}>Nenhum dado para exibir.</div>;
    }
    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
        <div className={`h-${height} flex items-end justify-around gap-2 sm:gap-3 pt-6 pb-2`}>
            {data.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                    <div className="relative w-full flex items-end h-full justify-center">
                         {/* Tooltip */}
                         <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            {item.label}: {labelValue(item.value)}
                        </div>
                        <div
                            className={`w-full max-w-[40px] ${barColorClass} rounded-t-sm opacity-80 group-hover:opacity-100 transition-all duration-500 ease-out`}
                            style={{ height: `${(item.value / maxValue) * 100}%`, minHeight: '4px' }}
                        />
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate w-full text-center">{item.label}</span>
                </div>
            ))}
        </div>
    );
};

export const LineChart: React.FC<{
    data: { label: string; value: number }[];
    color?: string;
    height?: number;
}> = ({ data, color = '#6366f1', height = 64 }) => {
    if (!data || data.length < 2) return null;

    const maxValue = Math.max(...data.map(d => d.value)) * 1.1; // +10% padding
    const minValue = 0;
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((d.value - minValue) / (maxValue - minValue)) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className={`h-${height} w-full relative pt-4`}>
             <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                {/* Grid lines */}
                <line x1="0" y1="0" x2="100" y2="0" stroke="currentColor" className="text-slate-100 dark:text-slate-700" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" className="text-slate-100 dark:text-slate-700" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                <line x1="0" y1="100" x2="100" y2="100" stroke="currentColor" className="text-slate-100 dark:text-slate-700" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                
                {/* The Line */}
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    points={points}
                    vectorEffect="non-scaling-stroke"
                    className="drop-shadow-md"
                />
                
                {/* Area under line (optional, simplistic) */}
                <polygon
                    fill={color}
                    fillOpacity="0.1"
                    points={`0,100 ${points} 100,100`}
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
             <div className="flex justify-between mt-2 text-[10px] text-slate-400">
                {data.filter((_, i) => i % Math.ceil(data.length / 6) === 0).map((d, i) => (
                    <span key={i}>{d.label}</span>
                ))}
            </div>
        </div>
    );
};

export const DonutChart: React.FC<{
    data: { label: string; value: number; color: string }[];
    size?: number;
}> = ({ data, size = 120 }) => {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    let currentAngle = 0;

    if (total === 0) return <div className="w-full text-center text-xs text-slate-400">Sem dados</div>;

    return (
        <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
                <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                    {data.map((slice, i) => {
                        const percentage = slice.value / total;
                        const dashArray = percentage * 100 * Math.PI; // Circumference is ~314
                        const dashOffset = 0; // We rotate the circle instead
                        
                        // Calculation for path drawing is complex in raw SVG without path commands. 
                        // Using stroke-dasharray on circles is easier.
                        // C = 2 * PI * r. Let r = 15.9155 => C = 100.
                        
                        const r = 15.9155;
                        const cx = 50;
                        const cy = 50;
                        
                        const segment = (
                            <circle
                                key={i}
                                r={r}
                                cx={cx}
                                cy={cy}
                                fill="transparent"
                                stroke={slice.color}
                                strokeWidth="10" // Thickness
                                strokeDasharray={`${slice.value / total * 100} 100`}
                                strokeDashoffset={-currentAngle}
                                className="transition-all duration-500"
                            />
                        );
                        currentAngle += (slice.value / total) * 100;
                        return segment;
                    })}
                    {/* Inner circle for donut effect */}
                    <circle r="10" cx="50" cy="50" fill="transparent" /> 
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{total}</span>
                    <span className="text-[8px] text-slate-500 uppercase">Total</span>
                </div>
            </div>
            <div className="flex flex-col gap-2">
                {data.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span className="text-slate-600 dark:text-slate-300">{item.label}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100 ml-auto">
                            {Math.round((item.value / total) * 100)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};


export const Pagination: React.FC<{
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
}> = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 sm:px-6 mt-auto">
            <div className="flex-1 flex justify-between sm:hidden">
                <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">Anterior</button>
                <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">Próximo</button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                        Mostrando <span className="font-medium">{startItem}</span> a <span className="font-medium">{endItem}</span> de <span className="font-medium">{totalItems}</span> resultados
                    </p>
                </div>
                <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                            <span className="sr-only">Anterior</span>
                            <IconChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200">
                            Página {currentPage} de {totalPages}
                        </span>
                        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                            <span className="sr-only">Próximo</span>
                            <IconChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    );
};