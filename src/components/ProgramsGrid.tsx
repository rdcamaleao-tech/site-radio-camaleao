import React, { useState, useEffect, useRef } from 'react';
import { supabaseService, safeSetLocalStorage } from '../services/supabaseService';
import { useRadio } from '../context/RadioContext';
import { 
  Radio, 
  Clock, 
  User, 
  Trash2, 
  X, 
  Upload, 
  Edit3,
  Calendar
} from 'lucide-react';

const progImg1 = 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&h=450&q=80';
const progImg2 = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&h=450&q=80';
const progImg3 = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&h=450&q=80';
const progImg4 = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&h=450&q=80';

export interface RadioProgram {
  id: string;
  title: string;
  locutor: string;
  horario: string;
  dias?: string;
  imageUrl: string;
  isLive?: boolean;
}

export function checkIsProgramLive(prog: RadioProgram, now: Date = new Date()): boolean {
  if (!prog || !prog.horario) return false;

  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const diasStr = (prog.dias || 'Segunda a Sexta').toLowerCase().trim();
  let dayMatches = false;

  if (
    diasStr.includes('todos') || 
    diasStr.includes('diari') || 
    diasStr.includes('diári') || 
    diasStr.includes('24h') ||
    diasStr.includes('24 h')
  ) {
    dayMatches = true;
  } else if (
    diasStr.includes('segunda a sexta') || 
    diasStr.includes('seg a sex') || 
    diasStr.includes('segunda à sexta') || 
    diasStr.includes('segunda - sexta') ||
    diasStr.includes('seg - sex') ||
    diasStr.includes('seg a sext')
  ) {
    dayMatches = currentDay >= 1 && currentDay <= 5;
  } else if (
    diasStr.includes('sábado e domingo') || 
    diasStr.includes('sabado e domingo') || 
    diasStr.includes('fim de semana') || 
    diasStr.includes('finais de semana') ||
    diasStr.includes('sab e dom') || 
    diasStr.includes('sáb e dom') ||
    diasStr.includes('sábado a domingo') ||
    diasStr.includes('sabado a domingo')
  ) {
    dayMatches = currentDay === 0 || currentDay === 6;
  } else {
    const dayMap: { [key: string]: number } = {
      'domingo': 0, 'dom': 0,
      'segunda': 1, 'seg': 1,
      'terça': 2, 'terca': 2, 'ter': 2,
      'quarta': 3, 'qua': 3,
      'quinta': 4, 'qui': 4,
      'sexta': 5, 'sex': 5,
      'sábado': 6, 'sabado': 6, 'sáb': 6, 'sab': 6,
    };

    const matchedDays: number[] = [];
    Object.entries(dayMap).forEach(([word, dayNum]) => {
      if (diasStr.includes(word) && !matchedDays.includes(dayNum)) {
        matchedDays.push(dayNum);
      }
    });

    if (matchedDays.length > 0) {
      dayMatches = matchedDays.includes(currentDay);
    } else {
      dayMatches = currentDay >= 1 && currentDay <= 5;
    }
  }

  if (!dayMatches) return false;

  const horarioStr = prog.horario.toLowerCase().trim();

  if (horarioStr.includes('24h') || horarioStr.includes('24 horas') || horarioStr.includes('24 hs')) {
    return true;
  }

  const cleanedHorario = horarioStr
    .replace(/\b(às|as|ate|até|a|-)\b/g, ' ')
    .replace(/\s+/g, ' ');

  const times: number[] = [];
  const timeRegex = /(\d{1,2})(?::(\d{2})|h(\d{2})?|h)?/g;
  let match;

  while ((match = timeRegex.exec(cleanedHorario)) !== null) {
    const hourVal = parseInt(match[1], 10);
    const minVal = parseInt(match[2] || match[3] || '0', 10);

    if (!isNaN(hourVal) && hourVal >= 0 && hourVal <= 24) {
      const totalMinutes = (hourVal === 24 ? 0 : hourVal) * 60 + (minVal >= 0 && minVal < 60 ? minVal : 0);
      times.push(totalMinutes);
    }
  }

  if (times.length >= 2) {
    const startMins = times[0];
    const endMins = times[1];

    if (startMins < endMins) {
      return currentMinutes >= startMins && currentMinutes < endMins;
    } else if (startMins > endMins) {
      return currentMinutes >= startMins || currentMinutes < endMins;
    } else {
      return false;
    }
  } else if (times.length === 1) {
    const startMins = times[0];
    const endMins = startMins + 60;
    return currentMinutes >= startMins && currentMinutes < endMins;
  }

  return false;
}

export function parseStartMinutes(horario: string): number {
  if (!horario) return 9999;
  const h = horario.toLowerCase().trim();
  if (h.includes('24h') || h.includes('24 horas') || h.includes('24 hs')) return 0;

  const timeRegex = /(\d{1,2})(?::(\d{2})|h(\d{2})?|h)?/g;
  const match = timeRegex.exec(h);

  if (match) {
    const hourVal = parseInt(match[1], 10);
    const minVal = parseInt(match[2] || match[3] || '0', 10);

    if (!isNaN(hourVal) && hourVal >= 0 && hourVal <= 24) {
      return (hourVal === 24 ? 0 : hourVal) * 60 + (minVal >= 0 && minVal < 60 ? minVal : 0);
    }
  }

  return 9999;
}

export const DEFAULT_PROGRAMS: RadioProgram[] = [
  {
    id: 'prog-1',
    title: 'Manhã Camaleão',
    locutor: 'Lucas Andrade',
    horario: '08:00 - 10:00',
    dias: 'Segunda a Sexta',
    imageUrl: progImg1,
    isLive: false,
  },
  {
    id: 'prog-2',
    title: 'Camaleão Club DJ',
    locutor: 'DJ Maya Novaes',
    horario: '10:00 - 12:00',
    dias: 'Segunda a Sexta',
    imageUrl: progImg2,
    isLive: false,
  },
  {
    id: 'prog-3',
    title: 'Pop Hits & Trends',
    locutor: 'Carla Silveira',
    horario: '12:00 - 15:00',
    dias: 'Segunda a Sexta',
    imageUrl: progImg3,
    isLive: false,
  },
  {
    id: 'prog-4',
    title: 'Night Vibes Synth',
    locutor: 'Bruno Camargo',
    horario: '15:00 - 18:00',
    dias: 'Segunda a Sexta',
    imageUrl: progImg4,
    isLive: false,
  },
  {
    id: 'prog-5',
    title: 'Na Onda do Som',
    locutor: 'Gabriel Mendes',
    horario: '18:00 - 20:00',
    dias: 'Segunda a Sexta',
    imageUrl: progImg1,
    isLive: false,
  },
  {
    id: 'prog-6',
    title: 'Sessão Eletro Beats',
    locutor: 'DJ Renato Vianna',
    horario: '20:00 - 22:00',
    dias: 'Sábado e Domingo',
    imageUrl: progImg2,
    isLive: false,
  },
  {
    id: 'prog-7',
    title: 'Madrugada Camaleão',
    locutor: 'Seleção Automática',
    horario: '22:00 - 02:00',
    dias: 'Todos os Dias',
    imageUrl: progImg4,
    isLive: false,
  },
  {
    id: 'prog-8',
    title: 'Top 20 Mais Pedidas',
    locutor: 'Vanessa Costa',
    horario: '02:00 - 08:00',
    dias: 'Todos os Dias',
    imageUrl: progImg3,
    isLive: false,
  },
];

const STORAGE_KEY = 'camaleao_radio_programs_v2';
const MAX_PROGRAMS = 16;

export const ProgramsGrid: React.FC = () => {
  const [programs, setPrograms] = useState<RadioProgram[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, MAX_PROGRAMS);
        }
      }
    } catch (e) {
      console.error('Erro ao ler programas do localStorage:', e);
    }
    return DEFAULT_PROGRAMS;
  });

  useEffect(() => {
    let isMounted = true;
    async function loadSupabasePrograms() {
      const dbPrograms = await supabaseService.fetchPrograms();
      if (dbPrograms && dbPrograms.length > 0 && isMounted) {
        setPrograms(dbPrograms.slice(0, MAX_PROGRAMS));
      }
    }
    loadSupabasePrograms();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPrograms(parsed.slice(0, MAX_PROGRAMS));
          }
        }
      } catch (e) {
        console.error('Erro ao atualizar programas:', e);
      }
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('camaleao_programs_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('camaleao_programs_updated', handleUpdate);
    };
  }, []);

  const { settings, updateSettings } = useRadio();
  const [now, setNow] = useState<Date>(new Date());
  const [manualLiveId] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const liveProg = programs.find((p) => {
      if (manualLiveId !== null) return p.id === manualLiveId;
      return checkIsProgramLive(p, now);
    });

    if (liveProg) {
      const newProgramTitle = `${liveProg.title} (Ao Vivo)`;
      if (
        settings.radio.currentProgram !== newProgramTitle ||
        settings.radio.currentArtist !== liveProg.locutor
      ) {
        updateSettings({
          ...settings,
          radio: {
            ...settings.radio,
            currentProgram: newProgramTitle,
            currentArtist: liveProg.locutor,
          },
        });
      }
    }
  }, [now, programs, manualLiveId]);

  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<RadioProgram | null>(null);
  
  const [formTitle, setFormTitle] = useState('');
  const [formLocutor, setFormLocutor] = useState('');
  const [formHorario, setFormHorario] = useState('');
  const [formDias, setFormDias] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formIsLive, setFormIsLive] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      safeSetLocalStorage(STORAGE_KEY, programs);
    } catch (e) {
      console.warn('Erro ao salvar no localStorage:', e);
    }
  }, [programs]);

  const handleOpenEdit = (prog: RadioProgram) => {
    setFormError(null);
    setEditingProgram(prog);
    setFormTitle(prog.title);
    setFormLocutor(prog.locutor);
    setFormHorario(prog.horario);
    setFormDias(prog.dias || 'Segunda a Sexta');
    setFormUrl(prog.imageUrl);
    setFormIsLive(!!prog.isLive);
    setIsManagerOpen(true);
  };

  const handleSaveProgram = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formTitle.trim()) {
      setFormError('O título do programa é obrigatório.');
      return;
    }
    if (!formUrl.trim()) {
      setFormError('A imagem do programa é obrigatória.');
      return;
    }

    if (formIsLive) {
      setPrograms((prev) => prev.map((p) => ({ ...p, isLive: false })));
    }

    if (editingProgram) {
      setPrograms((prev) =>
        prev.map((p) =>
          p.id === editingProgram.id
            ? {
                ...p,
                title: formTitle.trim(),
                locutor: formLocutor.trim() || 'Locutor Camaleão',
                horario: formHorario.trim() || 'Ao Vivo',
                dias: formDias.trim() || 'Segunda a Sexta',
                imageUrl: formUrl.trim(),
                isLive: formIsLive,
              }
            : p
        )
      );
    } else {
      if (programs.length >= MAX_PROGRAMS) {
        setFormError(`Limite de ${MAX_PROGRAMS} programas atingido.`);
        return;
      }

      const newProg: RadioProgram = {
        id: `prog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: formTitle.trim(),
        locutor: formLocutor.trim() || 'Locutor Camaleão',
        horario: formHorario.trim() || 'Ao Vivo',
        dias: formDias.trim() || 'Segunda a Sexta',
        imageUrl: formUrl.trim(),
        isLive: formIsLive,
      };

      setPrograms((prev) => [...prev, newProg]);
    }

    setIsManagerOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Envie apenas arquivos de imagem.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setFormUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProgram = (id: string) => {
    setPrograms((prev) => prev.filter((p) => p.id !== id));
  };

  const handleResetDefaults = () => {
    if (window.confirm('Restaurar a programação padrão com 8 programas?')) {
      setPrograms(DEFAULT_PROGRAMS);
      setIsManagerOpen(false);
    }
  };

  return (
    <section className="w-full max-w-[1900px] my-4">
      {/* SEÇÃO CABEÇALHO DA PROGRAMAÇÃO */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 px-2 sm:px-0">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#ff5700]/10 border border-[#ff5700]/30 flex items-center justify-center text-[#ff5700]">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              PROGRAMAÇÃO AO VIVO
            </h2>
            <p className="text-sm sm:text-base text-slate-300 font-medium">
              Destaques e horários das atrações da Rádio Camaleão
            </p>
          </div>
        </div>
      </div>

      {/* GRADE DE COLUNAS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
        {[...programs]
          .sort((a, b) => parseStartMinutes(a.horario) - parseStartMinutes(b.horario))
          .map((prog) => {
            const isAutoLive = checkIsProgramLive(prog, now);
            const isLive = manualLiveId !== null ? manualLiveId === prog.id : isAutoLive;

            return (
              <div
                key={prog.id}
                className={`group relative rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col bg-[#12141a] ${
                  isLive
                    ? 'border-[#ff5700] shadow-[0_0_25px_rgba(255,87,0,0.3)] ring-1 ring-[#ff5700]'
                    : 'border-[#232633] hover:border-[#ff5700]/50 hover:shadow-xl'
                }`}
              >
                <div className="relative w-full aspect-[4/3] overflow-hidden bg-black/40">
                  <img
                    src={prog.imageUrl}
                    alt={prog.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />

                  {isLive && (
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-[#ff5700] text-white px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-black flex items-center gap-1 sm:gap-1.5 shadow-lg animate-pulse">
                      <span className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-white animate-ping" />
                      <span>AO VIVO</span>
                    </div>
                  )}
                </div>

                <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between gap-2 sm:gap-3">
                  <div>
                    <h3 className="text-xs sm:text-lg font-black text-white group-hover:text-[#ff5700] transition-colors leading-tight break-words">
                      {prog.title}
                    </h3>
                    
                    <div className="flex items-start gap-1.5 text-xs sm:text-sm text-slate-200 font-semibold mt-1 sm:mt-1.5">
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ff5700] shrink-0 mt-0.5" />
                      <span className="leading-tight break-words">{prog.locutor}</span>
                    </div>

                    <div className="flex items-start gap-1.5 text-[11px] sm:text-sm text-amber-300 font-bold mt-0.5 sm:mt-1">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span className="leading-tight break-words">{prog.dias || 'Segunda a Sexta'}</span>
                    </div>
                  </div>

                  <div className="pt-2 sm:pt-3 border-t border-[#232633]/80 flex items-center justify-between text-[11px] sm:text-sm">
                    <span className="text-slate-300 font-mono font-bold text-[11px] sm:text-sm flex items-center gap-1 sm:gap-1.5">
                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#ff5700]" />
                      <span>{prog.horario}</span>
                    </span>
                    
                    {isLive && (
                      <span className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl bg-[#ff5700]/20 text-[#ff5700] border border-[#ff5700]/40 font-black text-[10px] sm:text-xs flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#ff5700]" />
                        <span>NO AR</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {isManagerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#12141a] border border-[#232633] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-5 border-b border-[#232633] flex items-center justify-between bg-[#0d0e12]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#ff5700]/10 border border-[#ff5700]/30 text-[#ff5700]">
                  <Radio className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingProgram ? 'Editar Programa' : 'Adicionar Novo Programa'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sua grade suporta até {MAX_PROGRAMS} programas em 4 colunas.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsManagerOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="p-5 overflow-y-auto flex-1 space-y-4">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                  <span>{formError}</span>
                  <button type="button" onClick={() => setFormError(null)} className="text-rose-400 hover:text-white">✕</button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nome do Programa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Manhã Camaleão"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ff5700]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Locutor / Apresentador
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Lucas Andrade"
                    value={formLocutor}
                    onChange={(e) => setFormLocutor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ff5700]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Horário de Exibição
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 08:00 - 10:00"
                    value={formHorario}
                    onChange={(e) => setFormHorario(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ff5700]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Dias de Transmissão
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Segunda a Sexta"
                    value={formDias}
                    onChange={(e) => setFormDias(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ff5700]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Imagem do Programa (URL ou Upload) *
                </label>
                
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    required
                    placeholder="https://link-da-sua-imagem.jpg"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#ff5700]"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="program-file-input"
                  />
                  <label
                    htmlFor="program-file-input"
                    className="px-4 py-2.5 rounded-xl bg-[#232633] hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4 text-[#ff5700]" />
                    <span>Upload</span>
                  </label>
                </div>

                {formUrl && (
                  <div className="relative w-full aspect-[16/9] max-h-36 rounded-xl overflow-hidden border border-[#232633] bg-black/50">
                    <img src={formUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0a0b0e] border border-[#232633]">
                <div>
                  <span className="text-sm font-bold text-white block">Marcar como AO VIVO AGORA</span>
                  <span className="text-xs text-slate-400">Destaca o programa com brilho e tag pulsante</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsLive(!formIsLive)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    formIsLive ? 'bg-[#ff5700]' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      formIsLive ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-4 border-t border-[#232633]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400">
                    Programas na Grade ({programs.length}/{MAX_PROGRAMS})
                  </span>
                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="text-xs text-slate-400 hover:text-[#ff5700] underline cursor-pointer"
                  >
                    Restaurar Padrão (8)
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {programs.map((p) => (
                    <div
                      key={p.id}
                      className="p-2 rounded-xl bg-[#0a0b0e] border border-[#232633] flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <img src={p.imageUrl} alt={p.title} className="w-8 h-8 rounded object-cover" />
                        <span className="font-bold text-white truncate">{p.title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveProgram(p.id)}
                          className="p-1 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#232633] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManagerOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#ff5700] hover:bg-[#e04d00] text-white font-bold text-xs shadow-lg cursor-pointer"
                >
                  {editingProgram ? 'Salvar Alterações' : 'Adicionar Programa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
