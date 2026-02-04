import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Calendar, MapPin, User, Clock, Users, Printer, Layout, RotateCcw } from 'lucide-react';

// --- COMPOSANTS UI ---

const Button = ({ onClick, variant = 'primary', className = '', children, disabled = false }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-sm";
  const variants = {
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

const Input = ({ label, value, onChange, placeholder, type = "text", className = "" }) => (
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

const getDatesOfWeek = (weekString) => {
  if (!weekString) return [];
  const [year, week] = weekString.split('-W');
  const date = new Date(year, 0, (1 + (week - 1) * 7));
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  
  const weekDates = [];
  for (let i = 0; i < 5; i++) { // Lundi à Vendredi
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    weekDates.push(current);
  }
  return weekDates;
};

const formatDate = (date) => {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
};

const getDayName = (date) => {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(date).toUpperCase();
};

// --- DATA INITIALE ---

const initialBlock = {
  id: Date.now(),
  location: '',
  person: '',
  slots: [
    { id: Date.now() + 1, time: '13h00', group: '' },
    { id: Date.now() + 2, time: '14h00', group: '' }
  ]
};

// --- APPLICATION PRINCIPALE ---

export default function PlanningGenerator() {
  // --- STATE ---
  const [currentWeek, setCurrentWeek] = useState('2026-W05');
  const [weekLabel, setWeekLabel] = useState('Semaine A');
  const [daysData, setDaysData] = useState({});
  const [activeDayIndex, setActiveDayIndex] = useState(0); // 0 = Lundi, 4 = Vendredi

  // --- PERSISTANCE ---
  useEffect(() => {
    const saved = localStorage.getItem('btp-planning-data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentWeek(parsed.currentWeek || '2026-W05');
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
  
  const getDayKey = (date) => date.toISOString().split('T')[0];

  const handleDayToggle = (dateKey) => {
    setDaysData(prev => {
      const newData = { ...prev };
      if (newData[dateKey]) {
        // Si déjà actif, on ne fait rien (on l'édite via l'UI)
        // Ou on pourrait le supprimer si on veut un toggle strict, 
        // mais pour l'UX d'édition c'est mieux de juste "activer" l'édition
      } else {
        // Initialiser le jour
        newData[dateKey] = {
          active: true,
          blocks: [{ ...initialBlock, id: Date.now(), slots: [{ id: Date.now()+1, time: '', group: '' }] }]
        };
      }
      return newData;
    });
  };

  const removeDay = (dateKey) => {
    setDaysData(prev => {
      const newData = { ...prev };
      delete newData[dateKey];
      return newData;
    });
  };

  const updateBlock = (dateKey, blockIndex, field, value) => {
    setDaysData(prev => {
      const newData = { ...prev };
      newData[dateKey].blocks[blockIndex][field] = value;
      return newData;
    });
  };

  const addBlock = (dateKey) => {
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

  const removeBlock = (dateKey, blockIndex) => {
    setDaysData(prev => {
      const newData = { ...prev };
      newData[dateKey].blocks.splice(blockIndex, 1);
      return newData;
    });
  };

  const addSlot = (dateKey, blockIndex) => {
    setDaysData(prev => {
      const newData = { ...prev };
      newData[dateKey].blocks[blockIndex].slots.push({ id: Date.now(), time: '', group: '' });
      return newData;
    });
  };

  const updateSlot = (dateKey, blockIndex, slotIndex, field, value) => {
    setDaysData(prev => {
      const newData = { ...prev };
      newData[dateKey].blocks[blockIndex].slots[slotIndex][field] = value;
      return newData;
    });
  };

  const removeSlot = (dateKey, blockIndex, slotIndex) => {
    setDaysData(prev => {
      const newData = { ...prev };
      newData[dateKey].blocks[blockIndex].slots.splice(slotIndex, 1);
      return newData;
    });
  };

  const resetAll = () => {
    if(confirm("Tout effacer et recommencer ?")) {
        setDaysData({});
        localStorage.removeItem('btp-planning-data');
    }
  };

  // Calcul des jours actifs triés
  const activeDates = weekDates.filter(d => daysData[getDayKey(d)]?.active);
  const isLandscape = activeDates.length === 1;

  // --- RENDER ---

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
           <Button variant="ghost" onClick={resetAll}><RotateCcw size={16}/> Réinitialiser</Button>
           <Button variant="accent" onClick={() => window.print()}>
             <Printer size={18} /> Imprimer / PDF
           </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* --- SIDEBAR EDITEUR (Gauche) --- */}
        <div className="w-1/3 min-w-[400px] bg-white border-r border-slate-200 flex flex-col overflow-y-auto print:hidden">
          
          {/* 1. Configuration Semaine */}
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar size={16}/> Configuration
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Semaine du..." 
                type="week" 
                value={currentWeek} 
                onChange={setCurrentWeek} 
              />
              <Input 
                label="Libellé Semaine" 
                value={weekLabel} 
                onChange={setWeekLabel} 
                placeholder="Ex: Semaine A"
              />
            </div>
          </div>

          {/* 2. Sélecteur de Jours */}
          <div className="p-6 border-b border-slate-100">
             <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Jours actifs</h2>
             <div className="flex flex-wrap gap-2">
               {weekDates.map((date, idx) => {
                 const key = getDayKey(date);
                 const isActive = !!daysData[key];
                 return (
                   <button
                     key={idx}
                     onClick={() => isActive ? setActiveDayIndex(idx) : handleDayToggle(key)}
                     className={`px-3 py-2 rounded text-sm font-medium transition-all border ${
                       isActive 
                         ? activeDayIndex === idx 
                            ? 'bg-slate-800 text-white border-slate-800 ring-2 ring-slate-300' 
                            : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                         : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'
                     }`}
                   >
                     {new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(date).toUpperCase()}
                   </button>
                 );
               })}
             </div>
          </div>

          {/* 3. Éditeur du Jour Sélectionné */}
          <div className="flex-1 bg-slate-50 p-6 overflow-y-auto">
             {weekDates[activeDayIndex] && daysData[getDayKey(weekDates[activeDayIndex])] ? (
               <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-xl text-slate-800">
                      {getDayName(weekDates[activeDayIndex])}
                    </h3>
                    <div className="flex gap-2">
                       <Button 
                        variant="secondary" 
                        className="text-xs py-1"
                        onClick={() => addBlock(getDayKey(weekDates[activeDayIndex]))}
                        disabled={daysData[getDayKey(weekDates[activeDayIndex])].blocks.length >= 2}
                       >
                         <Plus size={14}/> Ajouter Bloc
                       </Button>
                       <Button 
                        variant="danger" 
                        className="text-xs py-1 px-2"
                        onClick={() => removeDay(getDayKey(weekDates[activeDayIndex]))}
                       >
                         <Trash2 size={14}/>
                       </Button>
                    </div>
                 </div>

                 <div className="space-y-6">
                   {daysData[getDayKey(weekDates[activeDayIndex])].blocks.map((block, bIdx) => (
                     <div key={block.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                       <div className={`p-3 border-b border-slate-100 flex justify-between items-center ${bIdx === 0 ? 'bg-blue-50/50' : 'bg-orange-50/50'}`}>
                         <span className="text-xs font-bold uppercase text-slate-500">Bloc {bIdx + 1}</span>
                         {bIdx > 0 && (
                            <button onClick={() => removeBlock(getDayKey(weekDates[activeDayIndex]), bIdx)} className="text-red-400 hover:text-red-600">
                              <Trash2 size={14}/>
                            </button>
                         )}
                       </div>
                       
                       <div className="p-4 space-y-4">
                         <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                               <MapPin className="absolute top-3 left-3 w-4 h-4 text-slate-400" />
                               <input 
                                 className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded focus:border-blue-500 outline-none"
                                 placeholder="Lieu (ex: Salle Conseil)"
                                 value={block.location}
                                 onChange={(e) => updateBlock(getDayKey(weekDates[activeDayIndex]), bIdx, 'location', e.target.value)}
                               />
                            </div>
                            <div className="relative">
                               <User className="absolute top-3 left-3 w-4 h-4 text-slate-400" />
                               <input 
                                 className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded focus:border-blue-500 outline-none"
                                 placeholder="Intervenant (ex: JPB)"
                                 value={block.person}
                                 onChange={(e) => updateBlock(getDayKey(weekDates[activeDayIndex]), bIdx, 'person', e.target.value)}
                               />
                            </div>
                         </div>

                         <div className="space-y-2">
                           <div className="flex justify-between items-end">
                              <label className="text-xs font-semibold text-slate-400 uppercase">Créneaux</label>
                           </div>
                           {block.slots.map((slot, sIdx) => (
                             <div key={slot.id} className="flex gap-2 items-center">
                               <div className="relative w-24">
                                  <Clock className="absolute top-2.5 left-2 w-3 h-3 text-slate-400" />
                                  <input 
                                    className="w-full pl-7 pr-2 py-1.5 text-sm border border-slate-200 rounded font-mono"
                                    placeholder="HH:MM"
                                    value={slot.time}
                                    onChange={(e) => updateSlot(getDayKey(weekDates[activeDayIndex]), bIdx, sIdx, 'time', e.target.value)}
                                  />
                               </div>
                               <div className="relative flex-1">
                                  <Users className="absolute top-2.5 left-2 w-3 h-3 text-slate-400" />
                                  <input 
                                    className="w-full pl-7 pr-2 py-1.5 text-sm border border-slate-200 rounded font-medium"
                                    placeholder="Groupe"
                                    value={slot.group}
                                    onChange={(e) => updateSlot(getDayKey(weekDates[activeDayIndex]), bIdx, sIdx, 'group', e.target.value)}
                                  />
                               </div>
                               <button 
                                onClick={() => removeSlot(getDayKey(weekDates[activeDayIndex]), bIdx, sIdx)}
                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded"
                               >
                                 <Trash2 size={14}/>
                               </button>
                             </div>
                           ))}
                           <Button variant="ghost" className="w-full text-xs py-1 mt-2 border-dashed border border-slate-300" onClick={() => addSlot(getDayKey(weekDates[activeDayIndex]), bIdx)}>
                             <Plus size={12}/> Ajouter un créneau
                           </Button>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-400">
                 <Calendar size={48} className="mb-4 opacity-20"/>
                 <p>Sélectionnez un jour ci-dessus pour commencer</p>
               </div>
             )}
          </div>
        </div>

        {/* --- VISUALISATION (Droite) --- */}
        <div className="flex-1 bg-slate-200 overflow-auto p-8 flex justify-center items-start print:p-0 print:bg-white print:block print:overflow-visible">
          
          <div 
            className={`bg-white shadow-2xl print:shadow-none transition-all duration-300 origin-top
              ${isLandscape ? 'w-[297mm] min-h-[210mm] print:w-full print:h-full' : 'w-[210mm] min-h-[297mm] print:w-full print:h-full'}
            `}
            style={{
              // Simulation zoom pour l'écran
              transform: 'scale(0.85)', 
              marginBottom: '-10%' 
            }}
          >
             {/* STYLE D'IMPRESSION GLOBAL */}
             <style>{`
               @media print {
                 @page {
                   size: ${isLandscape ? 'landscape' : 'portrait'};
                   margin: 0;
                 }
                 body {
                   -webkit-print-color-adjust: exact !important;
                   print-color-adjust: exact !important;
                 }
               }
             `}</style>

             <div className="w-full h-full p-[15mm] flex flex-col items-center">
                
                {/* HEADER DOCUMENT */}
                <div className="w-full max-w-[1000px] text-center mb-10 bg-white p-6 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.05)] border-b-[5px] border-[#f1c40f] relative overflow-hidden print:shadow-none print:border print:border-slate-300">
                   <div className="absolute top-0 left-0 w-full h-[5px] bg-[#2c3e50]" />
                   <img 
                      src="https://classwise-reservation.netlify.app/Logo-BTPCFA51.png"
                      alt="Logo"
                      className="h-12 mx-auto mb-4"
                   />
                   <h1 className="text-3xl font-black text-[#2c3e50] uppercase tracking-widest mb-2">Réunions Bilans</h1>
                   <div className="inline-block bg-[#2c3e50] text-white px-6 py-1.5 rounded-full text-sm font-bold mt-2">
                     {activeDates.length > 0 ? formatDate(activeDates[0]) : "Date"} - {weekLabel}
                   </div>
                </div>

                {/* CONTAINER CARTES */}
                <div className={`flex gap-10 w-full max-w-[1200px] justify-center flex-wrap ${isLandscape ? 'flex-row items-stretch' : 'flex-col items-center'}`}>
                  
                  {activeDates.length > 0 ? activeDates.map((date) => {
                    const dayData = daysData[getDayKey(date)];
                    if(!dayData) return null;

                    return (
                      <div key={getDayKey(date)} className={`w-full flex gap-8 ${isLandscape ? 'flex-1' : 'mb-8'}`}>
                         {/* Pour chaque bloc du jour */}
                         {dayData.blocks.map((block, bIdx) => {
                           // Style diff par bloc pour visibilité
                           const isPrimary = bIdx === 0; 
                           const headerGradient = isPrimary 
                              ? 'bg-gradient-to-br from-[#2c3e50] to-[#4ca1af]' 
                              : 'bg-gradient-to-br from-[#e67e22] to-[#f39c12]';

                           return (
                             <div key={block.id} className="flex-1 min-w-[350px] bg-white rounded-xl overflow-hidden shadow-[0_5px_15px_rgba(0,0,0,0.08)] print:shadow-none print:border print:border-slate-300 flex flex-col">
                               <div className={`${headerGradient} p-5 text-white text-center`}>
                                 <h2 className="text-2xl font-bold mb-1 uppercase">{getDayName(date)}</h2>
                                 <div className="text-sm opacity-90 uppercase tracking-widest font-medium mb-2">📍 {block.location || '...'}</div>
                                 <div className="inline-block bg-white/20 px-4 py-1 rounded-full text-sm font-bold">
                                   Avec {block.person || '...'}
                                 </div>
                               </div>
                               
                               <div className="flex-1 bg-white">
                                 {block.slots.map((slot) => (
                                   <div key={slot.id} className="flex justify-between items-center px-8 py-5 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                     <span className="font-black text-2xl text-[#2c3e50] tabular-nums tracking-tight">
                                       {slot.time}
                                     </span>
                                     <span className="font-medium text-lg text-slate-600 bg-[#eef2f3] px-4 py-1.5 rounded-lg border-l-4 border-[#f1c40f]">
                                       {slot.group}
                                     </span>
                                   </div>
                                 ))}
                                 {/* Remplissage vide pour équilibrer si besoin */}
                                 {block.slots.length === 0 && (
                                   <div className="p-8 text-center text-slate-300 italic">Aucun créneau</div>
                                 )}
                               </div>
                             </div>
                           );
                         })}
                      </div>
                    );
                  }) : (
                    <div className="text-center text-slate-400 py-20 italic">
                      Aucun jour sélectionné pour l'impression
                    </div>
                  )}

                </div>

                <div className="mt-12 text-sm text-slate-400 font-medium">
                  BTP CFA MARNE - Planning généré le {new Date().toLocaleDateString('fr-FR')}
                </div>

             </div>
          </div>

        </div>

      </div>
    </div>
  );
}