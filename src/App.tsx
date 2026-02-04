import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar as CalendarIcon, MapPin, User, Printer, Layout, RotateCcw, ChevronLeft, ChevronRight, X, ChevronDown, Clock, Users } from 'lucide-react';

// --- TYPES & INTERFACES ---

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'accent' | 'ghost';

interface ButtonProps {
  onClick: () => void;
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

interface InputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}

interface Slot {
  id: number;
  time: string;
  group: string;
}

interface Block {
  id: number;
  location: string;
  person: string;
  slots: Slot[];
}

interface DayData {
  active: boolean;
  blocks: Block[];
}

type DaysData = Record<string, DayData>;

interface StoredData {
  currentWeek: string;
  weekLabel: string;
  daysData: DaysData;
}

// --- COMPOSANTS UI ---

const Button = ({ onClick, variant = 'primary', className = '', children, disabled = false }: ButtonProps) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-95 text-sm";
  
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-slate-800 text-white hover:bg-slate-700",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100",
    accent: "bg-amber-400 text-slate-900 hover:bg-amber-500 font-bold",
    ghost: "text-slate-500 hover:text-slate-800 hover:bg-slate-100 bg-transparent shadow-none"
  };
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, placeholder = '', type = "text", className = "" }: InputProps) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="px-3 py-2 rounded border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-sm"
    />
  </div>
);

// --- FONCTIONS UTILITAIRES ---

const getISOWeekString = (date: Date): string => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
};

const getDatesOfWeek = (weekString: string): Date[] => {
  if (!weekString) return [];
  const parts = weekString.split('-W');
  if (parts.length < 2) return [];
  
  const year = parseInt(parts[0], 10);
  const week = parseInt(parts[1], 10);
  
  const date = new Date(year, 0, (1 + (week - 1) * 7));
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  
  const weekDates: Date[] = [];
  for (let i = 0; i < 5; i++) { 
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    weekDates.push(current);
  }
  return weekDates;
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
};

const getWeekRangeLabel = (dates: Date[]): string => {
  if (dates.length === 0) return "";
  const start = dates[0];
  const end = dates[dates.length - 1];
  
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  const startStr = new Intl.DateTimeFormat('fr-FR', options).format(start);
  const endStr = new Intl.DateTimeFormat('fr-FR', { ...options, year: 'numeric' }).format(end);
  
  return `Du Lundi ${startStr} au Vendredi ${endStr}`;
};

const getDayName = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(date).toUpperCase();
};

// --- DATA INITIALE ---

const initialBlock: Block = {
  id: 0, 
  location: '',
  person: '',
  slots: [
    { id: 1, time: '13h00', group: '' },
    { id: 2, time: '14h00', group: '' }
  ]
};

// --- APPLICATION PRINCIPALE ---

export default function PlanningGenerator() {
  // --- STATE ---
  const [currentWeek, setCurrentWeek] = useState<string>(() => getISOWeekString(new Date()));
  const [weekLabel, setWeekLabel] = useState<string>('Semaine A');
  const [daysData, setDaysData] = useState<DaysData>({});
  const [viewDate, setViewDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // --- PERSISTANCE ---
  useEffect(() => {
    const saved = localStorage.getItem('btp-planning-data');
    if (saved) {
      try {
        const parsed: StoredData = JSON.parse(saved);
        if (parsed.currentWeek) {
            setCurrentWeek(parsed.currentWeek);
            const dates = getDatesOfWeek(parsed.currentWeek);
            if(dates.length > 0) setViewDate(dates[0]);
        }
        setWeekLabel(parsed.weekLabel || 'Semaine A');
        setDaysData(parsed.daysData || {});
      } catch (e) {
        console.error("Erreur de chargement", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('btp-planning-data', JSON.stringify({ currentWeek, weekLabel, daysData }));
  }, [currentWeek, weekLabel, daysData]);

  // --- LOGIQUE METIER ---

  const weekDates = getDatesOfWeek(currentWeek);
  const getDayKey = (date: Date): string => date.toISOString().split('T')[0];

  const handleDayToggle = (dateKey: string) => {
    setDaysData(prev => {
      const newData = { ...prev };
      if (newData[dateKey]) {
        delete newData[dateKey];
      } else {
        newData[dateKey] = {
          active: true,
          blocks: [{ 
            ...initialBlock, 
            id: Date.now(), 
            slots: [{ id: Date.now() + 1, time: '', group: '' }] 
          }]
        };
      }
      return newData;
    });
  };

  const updateBlock = (dateKey: string, blockIndex: number, field: keyof Block, value: string) => {
    setDaysData(prev => {
      const newData = { ...prev };
      if(newData[dateKey] && newData[dateKey].blocks[blockIndex]) {
        (newData[dateKey].blocks[blockIndex] as any)[field] = value;
      }
      return newData;
    });
  };

  const addBlock = (dateKey: string) => {
    setDaysData(prev => {
      const newData = { ...prev };
      if (newData[dateKey].blocks.length < 2) {
        newData[dateKey].blocks.push({
          id: Date.now(),
          location: '',
          person: '',
          slots: [{ id: Date.now(), time: '', group: '' }]
        });
      }
      return newData;
    });
  };

  const removeBlock = (dateKey: string, blockIndex: number) => {
    setDaysData(prev => {
      const newData = { ...prev };
      if(newData[dateKey]) {
        newData[dateKey].blocks.splice(blockIndex, 1);
      }
      return newData;
    });
  };

  const addSlot = (dateKey: string, blockIndex: number) => {
    setDaysData(prev => {
      const newData = { ...prev };
      if(newData[dateKey]) {
        newData[dateKey].blocks[blockIndex].slots.push({ id: Date.now(), time: '', group: '' });
      }
      return newData;
    });
  };

  const updateSlot = (dateKey: string, blockIndex: number, slotIndex: number, field: keyof Slot, value: string) => {
    setDaysData(prev => {
      const newData = { ...prev };
      if(newData[dateKey]) {
        (newData[dateKey].blocks[blockIndex].slots[slotIndex] as any)[field] = value;
      }
      return newData;
    });
  };

  const removeSlot = (dateKey: string, blockIndex: number, slotIndex: number) => {
    setDaysData(prev => {
      const newData = { ...prev };
      if(newData[dateKey]) {
        newData[dateKey].blocks[blockIndex].slots.splice(slotIndex, 1);
      }
      return newData;
    });
  };

  const resetAll = () => {
    if(window.confirm("Tout effacer et revenir à la semaine actuelle ?")) {
        setDaysData({});
        localStorage.removeItem('btp-planning-data');
        const now = new Date();
        setCurrentWeek(getISOWeekString(now));
        setViewDate(now);
        setWeekLabel('Semaine A');
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let startDay = firstDay.getDay() || 7; 
    const days = [];
    for (let i = 1; i < startDay; i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
    return days;
  };

  const selectWeekFromDate = (date: Date) => {
      const weekString = getISOWeekString(date);
      setCurrentWeek(weekString);
      setIsCalendarOpen(false);
  };

  const changeMonth = (offset: number) => {
      const newDate = new Date(viewDate);
      newDate.setMonth(newDate.getMonth() + offset);
      setViewDate(newDate);
  };

  // --- LOGIQUE DE DENSITÉ ET STYLE ---
  const activeDates = weekDates.filter(d => daysData[getDayKey(d)]?.active);
  const activeCount = activeDates.length;
  const isLandscape = activeCount === 1;

  // Configuration dynamique des styles
  const getLayoutConfig = () => {
    if (activeCount <= 1) {
      return {
        // Mode 1 Jour (Paysage - Aéré mais équilibré)
        isHeaderHorizontal: false,
        containerGap: 'gap-8',
        cardHeaderP: 'p-5',
        cardTitleSize: 'text-2xl',
        cardMetaSize: 'text-sm',
        headerMb: 'mb-10',
        headerTitle: 'text-3xl',
        
        // Slot Styling - Style "Meeting"
        slotContainerMb: 'mb-4',
        slotContainerP: 'p-4',
        slotHeight: 'min-h-[80px]', // Hauteur min pour consistance
        timeWidth: 'w-48', // Largeur fixe pour l'heure
        slotTimeSize: 'text-3xl', // Taille réduite (était 4xl)
        slotGroupSize: 'text-2xl', // Taille augmentée (était xl)
        slotIconSize: 'w-6 h-6'
      };
    } else if (activeCount <= 3) {
      return {
        // Mode 2-3 Jours
        isHeaderHorizontal: false,
        containerGap: 'gap-4',
        cardHeaderP: 'p-3',
        cardTitleSize: 'text-lg',
        cardMetaSize: 'text-xs',
        headerMb: 'mb-4',
        headerTitle: 'text-xl',

        // Slot Styling
        slotContainerMb: 'mb-3',
        slotContainerP: 'p-3',
        slotHeight: 'min-h-[60px]',
        timeWidth: 'w-32',
        slotTimeSize: 'text-xl',
        slotGroupSize: 'text-lg',
        slotIconSize: 'w-5 h-5'
      };
    } else {
      // Mode 4-5 Jours (Compact)
      return {
        isHeaderHorizontal: true,
        containerGap: 'gap-2',
        cardHeaderP: 'px-3 py-1.5',
        cardTitleSize: 'text-base',
        cardMetaSize: 'text-[10px]',
        headerMb: 'mb-2',
        headerTitle: 'text-lg',

        // Slot Styling
        slotContainerMb: 'mb-1.5',
        slotContainerP: 'px-3 py-2',
        slotHeight: 'min-h-[45px]',
        timeWidth: 'w-24',
        slotTimeSize: 'text-base',
        slotGroupSize: 'text-base', // Même taille que l'heure
        slotIconSize: 'w-4 h-4'
      };
    }
  };

  const layout = getLayoutConfig();
  const monthDays = getDaysInMonth(viewDate);

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans overflow-hidden">
      
      {/* HEADER APP */}
      <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="bg-amber-400 p-2 rounded-lg">
            <Layout className="w-5 h-5 text-slate-900" />
          </div>
          <h1 className="font-bold text-slate-800 text-lg">Générateur Planning Bilans</h1>
        </div>
        <div className="flex items-center gap-4">
           <Button variant="ghost" onClick={resetAll}><RotateCcw size={16}/> Reset</Button>
           <Button variant="accent" onClick={() => window.print()}>
             <Printer size={18} /> Imprimer
           </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* --- SIDEBAR EDITEUR (Gauche) --- */}
        <div className="w-1/3 min-w-[420px] bg-white border-r border-slate-200 flex flex-col print:hidden">
          
          <div className="p-6 border-b border-slate-100 bg-white z-20 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <CalendarIcon size={14}/> Période
              </h2>
            </div>
            
            {!isCalendarOpen ? (
                <div 
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 cursor-pointer hover:bg-slate-100 transition-colors group"
                  onClick={() => setIsCalendarOpen(true)}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Semaine sélectionnée</div>
                            <div className="font-bold text-slate-700 text-sm">
                                {getWeekRangeLabel(weekDates)}
                            </div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-200 text-slate-500 group-hover:text-blue-600 group-hover:border-blue-200 transition-colors">
                            <ChevronDown size={16} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                        <span className="text-xs font-bold text-slate-500 uppercase">Choisir une semaine</span>
                        <button onClick={() => setIsCalendarOpen(false)} className="text-slate-400 hover:text-slate-700">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-200 rounded"><ChevronLeft size={16}/></button>
                        <span className="font-bold text-slate-700 capitalize">
                            {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(viewDate)}
                        </span>
                        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-200 rounded"><ChevronRight size={16}/></button>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => (
                            <span key={d} className="text-[10px] font-bold text-slate-400">{d}</span>
                        ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1">
                        {monthDays.map((day, idx) => {
                            if(!day) return <div key={`empty-${idx}`} />;
                            const isSelectedWeek = getISOWeekString(day) === currentWeek;
                            return (
                                <button 
                                    key={idx}
                                    onClick={() => selectWeekFromDate(day)}
                                    className={`
                                        h-8 rounded-md text-sm flex items-center justify-center transition-all
                                        ${isSelectedWeek 
                                            ? 'bg-blue-600 text-white font-bold shadow-md' 
                                            : 'bg-white border border-slate-100 hover:border-blue-300 hover:text-blue-600 text-slate-600'}
                                    `}
                                >
                                    {day.getDate()}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className="mb-6">
                 <Input 
                    label="Libellé personnalisé" 
                    value={weekLabel} 
                    onChange={setWeekLabel} 
                    placeholder="Ex: Semaine A"
                />
            </div>
            
            <div>
               <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Jours Actifs (Clic pour activer)</label>
               <div className="flex justify-between gap-1">
                 {weekDates.map((date, idx) => {
                   const key = getDayKey(date);
                   const isActive = !!daysData[key];
                   const dayLetter = new Intl.DateTimeFormat('fr-FR', { weekday: 'narrow' }).format(date).toUpperCase();
                   
                   return (
                     <button
                       key={idx}
                       onClick={() => handleDayToggle(key)}
                       className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all border flex flex-col items-center gap-1 ${
                         isActive 
                              ? 'bg-slate-800 text-white border-slate-800 shadow-md transform -translate-y-0.5' 
                              : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50'
                       }`}
                     >
                       <span>{dayLetter}</span>
                       <span className="text-[10px] font-normal opacity-70">{date.getDate()}</span>
                     </button>
                   );
                 })}
               </div>
            </div>
          </div>

          <div className="flex-1 bg-slate-50 overflow-y-auto p-4 space-y-6">
             {activeDates.length > 0 ? activeDates.map((date) => {
               const dateKey = getDayKey(date);
               const dayData = daysData[dateKey];
               return (
                 <div key={dateKey} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
                        <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
                          <span className="text-amber-500 text-xs">●</span> {formatDate(date)}
                        </h3>
                        <div className="flex gap-2">
                           <Button 
                            variant="secondary" 
                            className="text-xs py-1 h-8"
                            onClick={() => addBlock(dateKey)}
                            disabled={dayData.blocks.length >= 2}
                           >
                             <Plus size={14}/> Bloc
                           </Button>
                        </div>
                    </div>
                    <div className="p-4 space-y-6">
                       {dayData.blocks.map((block, bIdx) => (
                         <div key={block.id} className="bg-slate-50/50 rounded-lg border border-slate-200 overflow-hidden">
                           <div className={`p-2 border-b border-slate-100 flex justify-between items-center ${bIdx === 0 ? 'bg-blue-100/30' : 'bg-orange-100/30'}`}>
                             <span className="text-xs font-bold uppercase text-slate-500 ml-2">Bloc {bIdx + 1}</span>
                             {bIdx > 0 && (
                                <button onClick={() => removeBlock(dateKey, bIdx)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded">
                                  <Trash2 size={14}/>
                                </button>
                             )}
                           </div>
                           <div className="p-3 space-y-3">
                             <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                   <MapPin className="absolute top-2.5 left-2 w-3.5 h-3.5 text-slate-400" />
                                   <input 
                                     className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-200 rounded focus:border-blue-500 outline-none bg-white"
                                     placeholder="Lieu"
                                     value={block.location}
                                     onChange={(e) => updateBlock(dateKey, bIdx, 'location', e.target.value)}
                                   />
                                </div>
                                <div className="relative">
                                   <User className="absolute top-2.5 left-2 w-3.5 h-3.5 text-slate-400" />
                                   <input 
                                     className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-200 rounded focus:border-blue-500 outline-none bg-white"
                                     placeholder="Intervenant"
                                     value={block.person}
                                     onChange={(e) => updateBlock(dateKey, bIdx, 'person', e.target.value)}
                                   />
                                </div>
                             </div>
                             <div className="space-y-2 pt-2 border-t border-slate-100">
                               {block.slots.map((slot, sIdx) => (
                                 <div key={slot.id} className="flex gap-2 items-center">
                                   <div className="relative w-20">
                                      <input 
                                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-mono text-center"
                                        placeholder="HH:MM"
                                        value={slot.time}
                                        onChange={(e) => updateSlot(dateKey, bIdx, sIdx, 'time', e.target.value)}
                                      />
                                   </div>
                                   <div className="relative flex-1">
                                      <input 
                                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-medium"
                                        placeholder="Groupe"
                                        value={slot.group}
                                        onChange={(e) => updateSlot(dateKey, bIdx, sIdx, 'group', e.target.value)}
                                      />
                                   </div>
                                   <button 
                                    onClick={() => removeSlot(dateKey, bIdx, sIdx)}
                                    className="text-slate-300 hover:text-red-500"
                                   >
                                     <Trash2 size={14}/>
                                   </button>
                                 </div>
                               ))}
                               <Button variant="ghost" className="w-full text-xs py-1 border-dashed border border-slate-300 text-slate-400" onClick={() => addSlot(dateKey, bIdx)}>
                                 <Plus size={12}/> Créneau
                               </Button>
                             </div>
                           </div>
                         </div>
                       ))}
                    </div>
                 </div>
               );
             }) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 min-h-[300px]">
                 <CalendarIcon size={48} className="mb-4 opacity-20"/>
                 <p className="text-center text-sm">Sélectionnez les jours ci-dessus<br/>pour les ajouter au planning</p>
               </div>
             )}
          </div>
        </div>

        {/* --- VISUALISATION (Droite) --- */}
        <div className="flex-1 bg-slate-200 overflow-auto p-8 flex justify-center items-start print:p-0 print:bg-white print:block print:overflow-visible">
          
          {/* CONTENEUR PAPIER */}
          <div 
            id="print-container"
            className={`bg-white shadow-2xl print:shadow-none transition-all duration-300 origin-top
              ${isLandscape ? 'w-[297mm] min-h-[210mm]' : 'w-[210mm] min-h-[297mm]'}
              print:w-full print:h-full print:flex print:flex-col
            `}
            style={{
              transform: 'scale(0.85)', 
              marginBottom: '-10%' 
            }}
          >
             {/* STYLE D'IMPRESSION GLOBAL */}
             <style>{`
               @media print {
                 @page {
                   size: ${isLandscape ? 'landscape' : 'portrait'};
                   margin: 5mm;
                 }
                 body, html {
                   height: 100%;
                   margin: 0;
                   padding: 0;
                 }
                 /* FORCE L'IMPRESSION DES COULEURS ET DEGRADÉS */
                 * {
                   -webkit-print-color-adjust: exact !important;
                   print-color-adjust: exact !important;
                 }
                 #print-container {
                    height: 100vh !important;
                    overflow: hidden !important;
                    display: flex !important;
                    flex-direction: column !important;
                 }
               }
             `}</style>

             <div className="w-full h-full p-[10mm] flex flex-col items-center print:p-0">
                
                {/* HEADER DOCUMENT */}
                <div className={`w-full max-w-[1000px] text-center bg-white rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.05)] border-b-[5px] border-[#f1c40f] relative overflow-hidden print:shadow-none print:border print:border-slate-300 shrink-0 ${layout.headerMb} p-4`}>
                   <div className="absolute top-0 left-0 w-full h-[5px] bg-[#2c3e50]" />
                   <img 
                      src="https://classwise-reservation.netlify.app/Logo-BTPCFA51.png"
                      alt="Logo"
                      className="h-10 mx-auto mb-2"
                   />
                   <h1 className={`${layout.headerTitle} font-black text-[#2c3e50] uppercase tracking-widest mb-1`}>Réunions Bilans</h1>
                   <div className="inline-block bg-[#2c3e50] text-white px-4 py-1 rounded-full text-xs font-bold mt-1">
                     {getWeekRangeLabel(weekDates)} - {weekLabel}
                   </div>
                </div>

                {/* CONTAINER CARTES */}
                <div className={`w-full max-w-[1200px] flex ${isLandscape ? 'flex-row items-stretch' : 'flex-col items-center'} ${layout.containerGap} flex-1 min-h-0`}>
                  
                  {activeDates.length > 0 ? activeDates.map((date) => {
                    const dayData = daysData[getDayKey(date)];
                    if(!dayData) return null;

                    return (
                      <div key={getDayKey(date)} className={`w-full flex ${layout.containerGap} ${isLandscape ? 'flex-1' : 'flex-1 min-h-0'}`}>
                         {/* Pour chaque bloc du jour */}
                         {dayData.blocks.map((block, bIdx) => {
                           const isPrimary = bIdx === 0; 
                           const headerGradient = isPrimary 
                              ? 'bg-gradient-to-br from-[#2c3e50] to-[#4ca1af]' 
                              : 'bg-gradient-to-br from-[#e67e22] to-[#f39c12]';

                           return (
                             <div key={block.id} className="flex-1 min-w-[200px] bg-white rounded-xl overflow-hidden shadow-[0_5px_15px_rgba(0,0,0,0.08)] print:shadow-none print:border print:border-slate-300 flex flex-col">
                               
                               {/* HEADER CARTE */}
                               <div className={`${headerGradient} ${layout.cardHeaderP} text-white shrink-0 flex ${layout.isHeaderHorizontal ? 'flex-row items-center justify-between' : 'flex-col text-center'}`}>
                                 <h2 className={`${layout.cardTitleSize} font-bold uppercase leading-none`}>{getDayName(date)}</h2>
                                 
                                 {/* Infos Lieu/Pers */}
                                 <div className={`flex ${layout.isHeaderHorizontal ? 'items-center gap-3' : 'flex-col items-center mt-1'}`}>
                                     {block.location && (
                                         <div className={`${layout.cardMetaSize} opacity-90 uppercase tracking-widest font-medium truncate flex items-center gap-1`}>
                                             {!layout.isHeaderHorizontal && <span>📍</span>} {block.location}
                                         </div>
                                     )}
                                     {block.person && (
                                         <div className={`inline-block bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold ${!layout.isHeaderHorizontal && 'mt-1'}`}>
                                           Avec {block.person}
                                         </div>
                                     )}
                                 </div>
                               </div>
                               
                               {/* SLOTS AMELIORÉS (Style Meeting Outlook) */}
                               <div className="flex-1 bg-white flex flex-col justify-center min-h-0 p-3">
                                 {block.slots.map((slot) => (
                                   <div key={slot.id} className={`flex items-center ${layout.slotContainerMb} ${layout.slotContainerP} bg-slate-50 border-l-[6px] border-[#f1c40f] rounded-r-md print:bg-slate-50 ${layout.slotHeight}`}>
                                     
                                     {/* Partie Heure (Largeur fixe) */}
                                     <div className={`${layout.timeWidth} flex items-center gap-2 border-r border-slate-200 pr-4 mr-4`}>
                                         <Clock className={`text-slate-400 ${layout.slotIconSize}`} />
                                         <span className={`font-black ${layout.slotTimeSize} text-slate-700 tabular-nums tracking-tight`}>
                                           {slot.time}
                                         </span>
                                     </div>

                                     {/* Partie Groupe (Flexible) */}
                                     <div className="flex items-center gap-2 flex-1">
                                       <Users className={`text-slate-400 ${layout.slotIconSize}`} />
                                       <div className={`font-bold ${layout.slotGroupSize} text-slate-800`}>
                                         {slot.group}
                                       </div>
                                     </div>
                                   </div>
                                 ))}
                                 
                                 {block.slots.length === 0 && (
                                   <div className="p-4 text-center text-slate-300 italic text-xs">Aucun créneau</div>
                                 )}
                               </div>
                             </div>
                           );
                         })}
                      </div>
                    );
                  }) : (
                    <div className="text-center text-slate-400 py-20 italic">
                      Aucun jour sélectionné
                    </div>
                  )}

                </div>

                <div className="mt-4 text-[10px] text-slate-400 font-medium shrink-0">
                  BTP CFA MARNE - Planning généré le {new Date().toLocaleDateString('fr-FR')}
                </div>

             </div>
          </div>

        </div>

      </div>
    </div>
  );
}