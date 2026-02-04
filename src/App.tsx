import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, MapPin, User, Printer, Layout, RotateCcw, ChevronLeft, ChevronRight, X, ChevronDown, Clock, Users } from 'lucide-react';

// --- TYPES ---
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

// --- COMPOSANTS UI ---
const Button = ({ onClick, variant = 'primary', className = '', children, disabled = false }: any) => {
  const variants: any = {
    primary: "bg-slate-800 text-white hover:bg-slate-700",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100",
    accent: "bg-amber-400 text-slate-900 hover:bg-amber-500 font-bold",
    ghost: "text-slate-500 hover:text-slate-800 hover:bg-slate-100 bg-transparent shadow-none"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`px-3 py-1.5 rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-95 text-xs ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, placeholder = '', type = "text" }: any) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>}
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="px-2 py-1.5 rounded border border-slate-300 focus:border-blue-500 outline-none text-sm w-full" />
  </div>
);

// --- HELPERS ---
const getISOWeekString = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
};

const getDatesOfWeek = (weekString: string) => {
  if (!weekString) return [];
  const parts = weekString.split('-W');
  if (parts.length < 2) return [];
  const year = parseInt(parts[0], 10);
  const week = parseInt(parts[1], 10);
  const date = new Date(year, 0, (1 + (week - 1) * 7));
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  const weekDates = [];
  for (let i = 0; i < 5; i++) { 
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    weekDates.push(current);
  }
  return weekDates;
};

const formatDate = (date: Date) => new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
const getDayName = (date: Date) => new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(date).toUpperCase();
const getWeekRangeLabel = (dates: Date[]) => {
  if (dates.length === 0) return "";
  const start = dates[0];
  const end = dates[dates.length - 1];
  const options: any = { day: 'numeric', month: 'long' };
  return `Du Lundi ${new Intl.DateTimeFormat('fr-FR', options).format(start)} au Vendredi ${new Intl.DateTimeFormat('fr-FR', { ...options, year: 'numeric' }).format(end)}`;
};

// --- APP ---
export default function PlanningGenerator() {
  const [currentWeek, setCurrentWeek] = useState<string>(() => getISOWeekString(new Date()));
  const [weekLabel, setWeekLabel] = useState<string>('Semaine A');
  const [daysData, setDaysData] = useState<DaysData>({});
  const [viewDate, setViewDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('btp-planning-data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if(parsed.currentWeek) {
            setCurrentWeek(parsed.currentWeek);
            const dates = getDatesOfWeek(parsed.currentWeek);
            if(dates.length > 0) setViewDate(dates[0]);
        }
        setWeekLabel(parsed.weekLabel || 'Semaine A');
        setDaysData(parsed.daysData || {});
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('btp-planning-data', JSON.stringify({ currentWeek, weekLabel, daysData }));
  }, [currentWeek, weekLabel, daysData]);

  const weekDates = getDatesOfWeek(currentWeek);
  const getDayKey = (date: Date) => date.toISOString().split('T')[0];

  const handleDayToggle = (dateKey: string) => {
    setDaysData(prev => {
      const newData = { ...prev };
      if (newData[dateKey]) delete newData[dateKey];
      else newData[dateKey] = { active: true, blocks: [{ id: Date.now(), location: '', person: '', slots: [{ id: Date.now()+1, time: '08h00', group: '' }] }] };
      return newData;
    });
  };

  const updateBlock = (d: string, b: number, f: string, v: string) => setDaysData(p => { const n={...p}; (n[d].blocks[b] as any)[f]=v; return n; });
  const addBlock = (d: string) => setDaysData(p => { const n={...p}; if(n[d].blocks.length<2) n[d].blocks.push({id:Date.now(), location:'', person:'', slots:[{id:Date.now(), time:'', group:''}]}); return n; });
  const removeBlock = (d: string, b: number) => setDaysData(p => { const n={...p}; n[d].blocks.splice(b,1); return n; });
  const addSlot = (d: string, b: number) => setDaysData(p => { const n={...p}; n[d].blocks[b].slots.push({id:Date.now(), time:'', group:''}); return n; });
  const updateSlot = (d: string, b: number, s: number, f: string, v: string) => setDaysData(p => { const n={...p}; (n[d].blocks[b].slots[s] as any)[f]=v; return n; });
  const removeSlot = (d: string, b: number, s: number) => setDaysData(p => { const n={...p}; n[d].blocks[b].slots.splice(s,1); return n; });

  const activeDates = weekDates.filter(d => daysData[getDayKey(d)]?.active);
  const activeCount = activeDates.length;
  
  // --- INTELLIGENCE DE MISE EN PAGE ---
  const maxSlotsInDay = activeDates.reduce((max, date) => {
      const dayBlocks = daysData[getDayKey(date)]?.blocks || [];
      const dayMax = Math.max(...dayBlocks.map(b => b.slots.length));
      return Math.max(max, dayMax);
  }, 0);

  const isLandscape = activeCount === 1 && maxSlotsInDay < 7;

  // STYLES DYNAMIQUES
  const styles = {
    headerMb: activeCount > 3 ? 'mb-4' : 'mb-8',
    headerTitleSize: activeCount > 3 ? 'text-xl' : 'text-3xl',
    headerLogoH: activeCount > 3 ? 'h-8' : 'h-12',
    daysGap: isLandscape ? 'gap-0' : (activeCount > 3 ? 'gap-4' : 'gap-8'),
    dayHeaderP: activeCount > 3 ? 'py-1.5 px-3' : 'py-3 px-5',
    dayTitleSize: activeCount > 3 ? 'text-base' : 'text-xl',
    subHeaderBg: 'bg-slate-50',
    subHeaderP: activeCount > 3 ? 'py-1 px-2' : 'py-2 px-4',
    subHeaderText: activeCount > 3 ? 'text-[10px]' : 'text-xs',
    slotHeight: activeCount > 3 ? 'py-1' : 'py-3',
    slotTextSize: activeCount > 3 ? 'text-xs' : 'text-base',
    slotTimeWidth: activeCount > 3 ? 'w-16' : 'w-24',
  };

  const monthDays = [];
  const y = viewDate.getFullYear(), m = viewDate.getMonth();
  const first = new Date(y,m,1).getDay() || 7;
  for(let i=1; i<first; i++) monthDays.push(null);
  for(let i=1; i<=new Date(y,m+1,0).getDate(); i++) monthDays.push(new Date(y,m,i));

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans overflow-hidden">
      {/* HEADER ÉCRAN */}
      <header className="bg-white border-b p-3 flex justify-between items-center shadow-sm print:hidden z-20">
        <div className="flex items-center gap-2 font-bold text-slate-800"><Layout size={20} className="text-amber-500"/> Générateur Planning</div>
        <div className="flex gap-2">
            <Button variant="ghost" onClick={() => { if(confirm('Reset?')) { localStorage.removeItem('btp-planning-data'); window.location.reload(); } }}><RotateCcw size={14}/> Reset</Button>
            <Button variant="accent" onClick={() => window.print()}><Printer size={16}/> Imprimer</Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR EDITEUR */}
        <div className="w-[400px] bg-white border-r flex flex-col print:hidden overflow-y-auto z-10 shadow-xl">
            <div className="p-4 border-b bg-slate-50">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase text-slate-400">Période</span>
                  <button onClick={() => setIsCalendarOpen(!isCalendarOpen)} className="text-blue-600 text-xs font-bold flex items-center gap-1">
                      {isCalendarOpen ? 'Fermer' : 'Changer semaine'} <ChevronDown size={12}/>
                  </button>
               </div>
               
               {isCalendarOpen && (
                   <div className="bg-white border rounded-lg p-3 mb-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                       <div className="flex justify-between mb-2">
                           <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth()-1)))}><ChevronLeft size={16}/></button>
                           <span className="font-bold text-sm capitalize">{new Intl.DateTimeFormat('fr-FR', {month:'long', year:'numeric'}).format(viewDate)}</span>
                           <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth()+1)))}><ChevronRight size={16}/></button>
                       </div>
                       <div className="grid grid-cols-7 gap-1 text-center">
                           {['L','M','M','J','V','S','D'].map(d=><span key={d} className="text-[10px] text-slate-400">{d}</span>)}
                           {monthDays.map((d,i) => !d ? <span key={i}/> : (
                               <button key={i} onClick={() => { setCurrentWeek(getISOWeekString(d)); setIsCalendarOpen(false); }} className={`text-xs p-1 rounded ${getISOWeekString(d)===currentWeek ? 'bg-blue-600 text-white':'hover:bg-slate-100'}`}>{d.getDate()}</button>
                           ))}
                       </div>
                   </div>
               )}
               <div className="font-bold text-slate-800 text-sm mb-2">{getWeekRangeLabel(weekDates)}</div>
               <Input label="Libellé" value={weekLabel} onChange={setWeekLabel} placeholder="Semaine A"/>
               <div className="mt-4 flex gap-1">
                   {weekDates.map((d,i) => {
                       const k = getDayKey(d);
                       return <button key={i} onClick={()=>handleDayToggle(k)} className={`flex-1 py-1 text-xs font-bold rounded border ${daysData[k] ? 'bg-slate-800 text-white border-slate-800':'bg-white text-slate-400'}`}>{new Intl.DateTimeFormat('fr-FR',{weekday:'narrow'}).format(d).toUpperCase()}</button>
                   })}
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100">
                {activeDates.map(d => {
                    const k = getDayKey(d);
                    const data = daysData[k];
                    return (
                        <div key={k} className="bg-white rounded-lg border shadow-sm p-3">
                            <div className="flex justify-between items-center mb-3 border-b pb-2">
                                <span className="font-black text-slate-700">{formatDate(d)}</span>
                                <Button variant="secondary" onClick={()=>addBlock(k)} disabled={data.blocks.length>=2}><Plus size={12}/></Button>
                            </div>
                            <div className="space-y-4">
                                {data.blocks.map((b, bi) => (
                                    <div key={b.id} className="bg-slate-50 rounded border p-2 relative">
                                        {bi>0 && <button onClick={()=>removeBlock(k, bi)} className="absolute top-1 right-1 text-red-400"><Trash2 size={12}/></button>}
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            <Input placeholder="Lieu" value={b.location} onChange={(v:string)=>updateBlock(k,bi,'location',v)} />
                                            <Input placeholder="Intervenant" value={b.person} onChange={(v:string)=>updateBlock(k,bi,'person',v)} />
                                        </div>
                                        <div className="space-y-1">
                                            {b.slots.map((s, si) => (
                                                <div key={s.id} className="flex gap-1 items-center">
                                                    <input className="w-16 text-xs p-1.5 border rounded text-center font-mono" value={s.time} onChange={e=>updateSlot(k,bi,si,'time',e.target.value)} placeholder="00h00" />
                                                    {/* FORCE MAJUSCULE */}
                                                    <input className="flex-1 text-xs p-1.5 border rounded font-bold uppercase" value={s.group} onChange={e=>updateSlot(k,bi,si,'group',e.target.value.toUpperCase())} placeholder="GROUPE" />
                                                    <button onClick={()=>removeSlot(k,bi,si)} className="text-slate-300 hover:text-red-500"><X size={12}/></button>
                                                </div>
                                            ))}
                                            <button onClick={()=>addSlot(k,bi)} className="w-full text-[10px] text-slate-400 border border-dashed rounded hover:bg-white py-1">+ Slot</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
                {activeDates.length===0 && <div className="text-center text-slate-400 text-sm mt-10">Sélectionnez un jour...</div>}
            </div>
        </div>

        {/* VISUALISATION / PRINT */}
        <div className="flex-1 bg-slate-200 overflow-auto flex justify-center p-8 print:p-0 print:bg-white print:block no-scrollbar">
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                @media print {
                    @page { size: ${isLandscape ? 'landscape' : 'portrait'}; margin: 5mm; }
                    body, html { height: 100%; margin: 0; padding: 0; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    #print-area { height: 100vh !important; width: 100% !important; overflow: hidden !important; display: flex !important; flex-direction: column !important; }
                }
            `}</style>

            <div id="print-area" 
                 className={`bg-white shadow-2xl print:shadow-none flex flex-col items-center overflow-hidden
                 ${isLandscape ? 'w-[297mm] h-[210mm]' : 'w-[210mm] h-[297mm]'}
                 `}
                 style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}
            >
                {/* HEADER DOCUMENT */}
                <div className={`w-full max-w-[95%] text-center border-b-[5px] border-[#f1c40f] bg-white relative shrink-0 ${styles.headerMb} pt-6 pb-4 rounded-b-2xl shadow-sm print:shadow-none`}>
                    <img src="https://classwise-reservation.netlify.app/Logo-BTPCFA51.png" alt="Logo" className={`${styles.headerLogoH} mx-auto mb-3 mt-2 object-contain`}/>
                    <h1 className={`${styles.headerTitleSize} font-black text-[#2c3e50] uppercase tracking-widest leading-none mb-2`}>Réunions Bilans</h1>
                    <div className="inline-block bg-[#2c3e50] text-white px-6 py-1.5 rounded-full text-xs font-bold uppercase shadow-sm">
                        {getWeekRangeLabel(weekDates)} - {weekLabel}
                    </div>
                </div>

                {/* CONTAINER JOURS */}
                <div className={`flex-1 w-full max-w-[95%] flex flex-col ${styles.daysGap} min-h-0 ${isLandscape ? 'justify-center max-w-[80%]' : ''}`}>
                    {activeDates.length > 0 ? activeDates.map(date => {
                        const dayData = daysData[getDayKey(date)];
                        if(!dayData) return null;
                        const hasTwoBlocks = dayData.blocks.length > 1;

                        return (
                            <div key={getDayKey(date)} className="flex flex-col bg-white rounded-xl overflow-hidden shadow border border-slate-200 print:shadow-none print:border-slate-300 min-h-0 shrink-0">
                                
                                {/* HEADER JOUR */}
                                <div className={`bg-gradient-to-r from-[#2c3e50] to-[#34495e] text-white flex items-center justify-between ${styles.dayHeaderP}`}>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={18} className="text-white/80" />
                                        <h2 className={`${styles.dayTitleSize} font-black uppercase tracking-wide`}>{getDayName(date)}</h2>
                                    </div>
                                    {!hasTwoBlocks && dayData.blocks[0] && (
                                        <div className="flex items-center gap-3 text-xs opacity-90 font-medium">
                                            {dayData.blocks[0].location && <span className="flex items-center gap-1 uppercase tracking-wide"><MapPin size={14} className="text-rose-500" /> {dayData.blocks[0].location}</span>}
                                            {dayData.blocks[0].person && <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full"><User size={12}/> {dayData.blocks[0].person}</span>}
                                        </div>
                                    )}
                                </div>

                                {/* CONTENU BLOCS */}
                                <div className={`flex-1 flex ${hasTwoBlocks ? 'divide-x divide-slate-200' : ''}`}>
                                    {dayData.blocks.map((block) => (
                                        <div key={block.id} className="flex-1 flex flex-col min-w-0">
                                            {/* Sub-Header si 2 blocs */}
                                            {hasTwoBlocks && (
                                                <div className={`${styles.subHeaderBg} ${styles.subHeaderP} border-b border-slate-100 flex justify-between items-center ${styles.subHeaderText} font-bold text-slate-600 uppercase tracking-tight`}>
                                                    {/* PIN ROUGE ICI AUSSI */}
                                                    <span className="flex items-center gap-1 truncate"><MapPin size={12} className="text-rose-500"/> {block.location || '-'}</span>
                                                    <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-full border shadow-sm normal-case text-slate-800"><User size={10}/> {block.person || '-'}</span>
                                                </div>
                                            )}

                                            {/* LISTE DES SLOTS */}
                                            <div className="flex-1 flex flex-col">
                                                {block.slots.map((slot) => (
                                                    <div key={slot.id} className={`flex items-center border-b border-slate-100 last:border-0 ${styles.slotHeight} px-4 hover:bg-yellow-50 odd:bg-white even:bg-slate-50/50 print:even:bg-slate-50`}>
                                                        <div className={`${styles.slotTimeWidth} shrink-0 flex items-center gap-2 border-r-2 border-[#f1c40f] mr-4`}>
                                                            <Clock size={12} className="text-slate-400"/>
                                                            <span className={`${styles.slotTextSize} font-bold text-slate-700 tabular-nums`}>{slot.time}</span>
                                                        </div>
                                                        <div className="flex-1 flex items-center gap-2 min-w-0">
                                                            <Users size={12} className="text-slate-300"/>
                                                            <span className={`${styles.slotTextSize} font-bold text-slate-800 truncate uppercase`}>{slot.group}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {block.slots.length === 0 && <div className="p-3 text-center text-slate-300 italic text-xs">Aucun créneau</div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="flex-1 flex items-center justify-center text-slate-300 italic">Aucune journée sélectionnée</div>
                    )}
                </div>
                
                {/* FOOTER */}
                <div className="text-[10px] text-slate-400 font-medium py-3 shrink-0">
                  BTP CFA MARNE - Généré le {new Date().toLocaleDateString('fr-FR')}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}