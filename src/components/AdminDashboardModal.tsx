import React, { useState, useEffect, useRef } from 'react';
import { useRadio } from '../context/RadioContext';
import { SiteSettings, SlideItem, RadioProgram, AdvertiserItem } from '../types/radio';
import { DEFAULT_SLIDES, sanitizeSlideList } from './BannerSlider';
import { DEFAULT_PROGRAMS } from './ProgramsGrid';
import { DEFAULT_ADVERTISERS } from './AdvertisersGrid';
import { supabaseService, compressImageFile, ensureUuid, safeSetLocalStorage } from '../services/supabaseService';
import { 
  Radio, 
  MapPin, 
  Globe, 
  Music, 
  Save, 
  RotateCcw, 
  X, 
  Check, 
  Image as ImageIcon,
  Upload,
  Plus,
  Trash2,
  LogOut,
  Layers,
  Tv,
  Megaphone,
  Palette
} from 'lucide-react';

export const AdminDashboardModal: React.FC = () => {
  const { 
    isAdminDashboardOpen, 
    setIsAdminDashboardOpen, 
    settings, 
    updateSettings, 
    resetSettings,
    setIsAuthenticated 
  } = useRadio();

  const [activeTab, setActiveTab] = useState<'radio' | 'contacts' | 'social' | 'images' | 'appearance'>('appearance');
  const [formData, setFormData] = useState<SiteSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [programs, setPrograms] = useState<RadioProgram[]>([]);
  const [advertisers, setAdvertisers] = useState<AdvertiserItem[]>([]);

  const [imageSubTab, setImageSubTab] = useState<'banners' | 'slides' | 'programs' | 'advertisers'>('banners');

  const mainBannerFileRef = useRef<HTMLInputElement>(null);
  const stripBannerFileRef = useRef<HTMLInputElement>(null);
  const bgImageFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdminDashboardOpen) {
      setActiveTab('appearance');
    }
    setFormData(settings);

    supabaseService.fetchSlides().then((dbSlides) => {
      if (dbSlides && dbSlides.length > 0) {
        setSlides(sanitizeSlideList(dbSlides));
      } else {
        try {
          const savedSlides = localStorage.getItem('camaleao_banner_slides_v1');
          if (savedSlides) {
            const parsed = JSON.parse(savedSlides);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSlides(sanitizeSlideList(parsed));
            } else {
              setSlides(DEFAULT_SLIDES);
            }
          } else {
            setSlides(DEFAULT_SLIDES);
          }
        } catch {
          setSlides(DEFAULT_SLIDES);
        }
      }
    });

    supabaseService.fetchPrograms().then((dbProg) => {
      if (dbProg !== null) {
        setPrograms(dbProg);
        safeSetLocalStorage('camaleao_radio_programs_v2', dbProg);
      } else {
        try {
          const savedProg = localStorage.getItem('camaleao_radio_programs_v2');
          if (savedProg !== null) {
            const parsed = JSON.parse(savedProg);
            if (Array.isArray(parsed)) {
              setPrograms(parsed);
              supabaseService.savePrograms(parsed);
            } else {
              setPrograms(DEFAULT_PROGRAMS);
            }
          } else {
            setPrograms(DEFAULT_PROGRAMS);
          }
        } catch (e) {
          console.error('Erro ao ler programas:', e);
          setPrograms(DEFAULT_PROGRAMS);
        }
      }
    });

    supabaseService.fetchAdvertisers().then((dbAdv) => {
      if (dbAdv !== null) {
        setAdvertisers(dbAdv);
        safeSetLocalStorage('camaleao_advertisers_v1', dbAdv);
      } else {
        try {
          const savedAdv = localStorage.getItem('camaleao_advertisers_v1');
          if (savedAdv !== null) {
            const parsed = JSON.parse(savedAdv);
            if (Array.isArray(parsed)) {
              setAdvertisers(parsed);
              supabaseService.saveAdvertisers(parsed);
            } else {
              setAdvertisers(DEFAULT_ADVERTISERS);
            }
          } else {
            setAdvertisers(DEFAULT_ADVERTISERS);
          }
        } catch (e) {
          console.error('Erro ao ler anunciantes:', e);
          setAdvertisers(DEFAULT_ADVERTISERS);
        }
      }
    });
  }, [settings, isAdminDashboardOpen]);

  if (!isAdminDashboardOpen) return null;

  const handleInputChange = (section: keyof SiteSettings, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleAppearanceChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      appearance: {
        ...(prev.appearance || {
          bgType: 'color',
          bgColor: '#0a0b0e',
          bgImageUrl: '',
          bgOverlayOpacity: 40,
        }),
        [field]: value,
      },
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP, GIF).');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      alert('A imagem é muito grande. Escolha uma imagem de até 12MB.');
      return;
    }

    try {
      const compressedDataUrl = await compressImageFile(file, 1280, 720, 0.75);
      if (compressedDataUrl) {
        callback(compressedDataUrl);
      }
    } catch (err) {
      console.error('Erro ao comprimir imagem:', err);
    }
  };

  const handleSaveSlidesOnly = async () => {
    try {
      safeSetLocalStorage('camaleao_banner_slides_v1', slides);
      await supabaseService.saveSlides(slides);
      window.dispatchEvent(new Event('camaleao_slides_updated'));
      alert('✅ Slides salvos com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar slides:', err);
      alert('Erro ao salvar slides.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    updateSettings(formData);
    supabaseService.saveSettings(formData);

    try {
      safeSetLocalStorage('camaleao_banner_slides_v1', slides);
      await supabaseService.saveSlides(slides);
      window.dispatchEvent(new Event('camaleao_slides_updated'));
    } catch (e) {
      console.error('Erro ao salvar slides:', e);
    }

    try {
      safeSetLocalStorage('camaleao_radio_programs_v2', programs);
      await supabaseService.savePrograms(programs);
      window.dispatchEvent(new Event('camaleao_programs_updated'));
    } catch (e) {
      console.error('Erro ao salvar programas:', e);
    }

    try {
      safeSetLocalStorage('camaleao_advertisers_v1', advertisers);
      await supabaseService.saveAdvertisers(advertisers);
      window.dispatchEvent(new Event('camaleao_advertisers_updated'));
    } catch (e) {
      console.error('Erro ao salvar anunciantes:', e);
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja restaurar todas as informações e imagens padrão do site da rádio?')) {
      resetSettings();
      localStorage.removeItem('camaleao_banner_slides_v1');
      localStorage.removeItem('camaleao_radio_programs_v2');
      localStorage.removeItem('camaleao_advertisers_v1');
      
      setSlides(DEFAULT_SLIDES);
      setPrograms(DEFAULT_PROGRAMS);
      setAdvertisers(DEFAULT_ADVERTISERS);

      window.dispatchEvent(new Event('camaleao_slides_updated'));
      window.dispatchEvent(new Event('camaleao_programs_updated'));
      window.dispatchEvent(new Event('camaleao_advertisers_updated'));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsAdminDashboardOpen(false);
  };

  const handleUpdateSlideImage = (index: number, newUrl: string) => {
    const updated = [...slides];
    updated[index] = { ...updated[index], url: newUrl };
    setSlides(updated);
  };

  const handleUpdateSlideTitle = (index: number, newTitle: string) => {
    const updated = [...slides];
    updated[index] = { ...updated[index], title: newTitle };
    setSlides(updated);
  };

  const handleUpdateSlideCaption = (index: number, newCaption: string) => {
    const updated = [...slides];
    updated[index] = { ...updated[index], caption: newCaption };
    setSlides(updated);
  };

  const handleAddSlide = () => {
    const newSlide: SlideItem = {
      id: ensureUuid(),
      url: formData.images?.mainBannerUrl || DEFAULT_SLIDES[0]?.url || '',
      title: 'NOVA ATRAÇÃO DA RÁDIO',
      caption: 'A melhor música ao vivo 24 horas',
    };
    setSlides([...slides, newSlide]);
  };

  const handleDeleteSlide = (index: number) => {
    setSlides(slides.filter((_, i) => i !== index));
  };

  const handleUpdateProgramImage = (index: number, newUrl: string) => {
    const updated = [...programs];
    updated[index] = { ...updated[index], imageUrl: newUrl };
    setPrograms(updated);
  };

  const handleUpdateProgramTitle = (index: number, newTitle: string) => {
    const updated = [...programs];
    updated[index] = { ...updated[index], title: newTitle };
    setPrograms(updated);
  };

  const handleUpdateProgramLocutor = (index: number, newLocutor: string) => {
    const updated = [...programs];
    updated[index] = { ...updated[index], locutor: newLocutor };
    setPrograms(updated);
  };

  const handleUpdateProgramHorario = (index: number, newHorario: string) => {
    const updated = [...programs];
    updated[index] = { ...updated[index], horario: newHorario };
    setPrograms(updated);
  };

  const handleUpdateProgramDias = (index: number, newDias: string) => {
    const updated = [...programs];
    updated[index] = { ...updated[index], dias: newDias };
    setPrograms(updated);
  };

  const handleAddProgram = () => {
    if (programs.length >= 16) {
      alert('A grade suporta no máximo 16 programas.');
      return;
    }
    const newProg: RadioProgram = {
      id: 'prog-' + Date.now(),
      title: 'Novo Programa',
      locutor: 'Nome do Locutor',
      horario: '12:00 - 14:00',
      dias: 'Segunda a Sexta',
      imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=600',
      isLive: false,
    };
    setPrograms([...programs, newProg]);
  };

  const handleDeleteProgram = (index: number) => {
    setPrograms(programs.filter((_, i) => i !== index));
  };

  const handleUpdateAdvertiserImage = (index: number, newUrl: string) => {
    const updated = [...advertisers];
    updated[index] = { ...updated[index], imageUrl: newUrl };
    setAdvertisers(updated);
  };

  const handleUpdateAdvertiserTitle = (index: number, newTitle: string) => {
    const updated = [...advertisers];
    updated[index] = { ...updated[index], title: newTitle };
    setAdvertisers(updated);
  };

  const handleUpdateAdvertiserSubtitle = (index: number, newSubtitle: string) => {
    const updated = [...advertisers];
    updated[index] = { ...updated[index], subtitle: newSubtitle };
    setAdvertisers(updated);
  };

  const handleUpdateAdvertiserTag = (index: number, newTag: string) => {
    const updated = [...advertisers];
    updated[index] = { ...updated[index], tag: newTag };
    setAdvertisers(updated);
  };

  const handleUpdateAdvertiserTargetUrl = (index: number, newTargetUrl: string) => {
    const updated = [...advertisers];
    updated[index] = { ...updated[index], targetUrl: newTargetUrl };
    setAdvertisers(updated);
  };

  const handleAddAdvertiser = () => {
    const newAdv: AdvertiserItem = {
      id: 'adv-' + Date.now(),
      title: 'Novo Anunciante',
      subtitle: 'Parceiro comercial da Rádio Camaleão',
      tag: 'ANUNCIANTE',
      imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=800',
      targetUrl: 'https://wa.me/5511999998888',
    };
    setAdvertisers([...advertisers, newAdv]);
  };

  const handleDeleteAdvertiser = (index: number) => {
    setAdvertisers(advertisers.filter((_, i) => i !== index));
  };

  const handleSaveAdvertisersOnly = async () => {
    try {
      safeSetLocalStorage('camaleao_advertisers_v1', advertisers);
      const ok = await supabaseService.saveAdvertisers(advertisers);
      window.dispatchEvent(new Event('camaleao_advertisers_updated'));
      if (ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Anunciantes salvos no navegador local.');
      }
    } catch (e) {
      console.error('Erro ao salvar anunciantes:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-5xl bg-[#12141a] border border-[#232633] rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[92vh]">
        
        {/* HEADER DO PAINEL */}
        <div className="p-5 sm:p-6 border-b border-[#232633] flex flex-wrap items-center justify-between gap-4 bg-[#0d0e12]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-black font-black shadow-lg shadow-amber-500/20">
              <Radio className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white tracking-tight">PAINEL DE CONTROLE ADM</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Supabase Ativo
                </span>
              </div>
              <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">Gestão Completa e Imagens do Site</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
            <button
              onClick={() => setIsAdminDashboardOpen(false)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 px-6 py-3 text-emerald-300 font-bold text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Alterações e imagens salvas com sucesso! O site foi atualizado em tempo real.</span>
          </div>
        )}

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex border-b border-[#232633] bg-[#090a0d] px-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'appearance'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4 text-amber-500" />
            <span>Aparência & Fundo</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black font-extrabold text-[9px]">
              NOVO
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('images')}
            className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'images'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Imagens & Banners do Site</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('radio')}
            className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'radio'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Dados da Rádio & Stream</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contacts')}
            className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'contacts'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Contatos & Estúdio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('social')}
            className={`px-5 py-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'social'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Redes Sociais</span>
          </button>
        </div>

        {/* CORPO / FORMULÁRIO */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* ABA: APARÊNCIA & FUNDO DO SITE */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#0d0e12] border border-[#232633] space-y-5">
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-amber-500" />
                    <span>Personalização do Fundo do Site</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Escolha se deseja utilizar uma Cor Sólida ou uma Imagem de Fundo personalizada em todo o site.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleAppearanceChange('bgType', 'color')}
                    className={`p-4 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-black uppercase transition-all cursor-pointer ${
                      formData.appearance?.bgType === 'color'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10'
                        : 'bg-[#0a0b0e] border-[#232633] text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full border border-current bg-amber-500" />
                    <span>Usar Cor Sólida</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAppearanceChange('bgType', 'image')}
                    className={`p-4 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-black uppercase transition-all cursor-pointer ${
                      formData.appearance?.bgType === 'image'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10'
                        : 'bg-[#0a0b0e] border-[#232633] text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Usar Imagem de Fundo</span>
                  </button>
                </div>

                {formData.appearance?.bgType === 'color' && (
                  <div className="space-y-4 pt-4 border-t border-[#232633]">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">
                        Selecione a Cor do Fundo
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="color"
                          value={formData.appearance?.bgColor || '#0a0b0e'}
                          onChange={(e) => handleAppearanceChange('bgColor', e.target.value)}
                          className="w-12 h-12 rounded-xl border-2 border-[#232633] bg-[#0a0b0e] cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={formData.appearance?.bgColor || '#0a0b0e'}
                          onChange={(e) => handleAppearanceChange('bgColor', e.target.value)}
                          placeholder="#0a0b0e"
                          className="px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white font-mono uppercase focus:border-amber-500 focus:outline-none w-40"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2">
                        Paleta de Cores Recomendadas para Rádio
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { name: 'Escuro Padrão', hex: '#0a0b0e' },
                          { name: 'Preto Absoluto', hex: '#000000' },
                          { name: 'Grafite Noturno', hex: '#12141a' },
                          { name: 'Azul Marinho', hex: '#0b1329' },
                          { name: 'Âmbar Profundo', hex: '#1a0e05' },
                          { name: 'Verde Rádio', hex: '#051b11' },
                          { name: 'Vinho Noturno', hex: '#16081e' },
                        ].map((color) => (
                          <button
                            key={color.hex}
                            type="button"
                            onClick={() => handleAppearanceChange('bgColor', color.hex)}
                            className="px-3 py-1.5 rounded-xl border border-[#232633] text-[11px] font-bold text-slate-300 hover:border-amber-500 flex items-center gap-2 transition-all bg-[#0a0b0e] cursor-pointer"
                          >
                            <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: color.hex }} />
                            <span>{color.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {formData.appearance?.bgType === 'image' && (
                  <div className="space-y-4 pt-4 border-t border-[#232633]">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        URL da Imagem de Fundo ou Upload Local
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={formData.appearance?.bgImageUrl || ''}
                          onChange={(e) => handleAppearanceChange('bgImageUrl', e.target.value)}
                          placeholder="Cole a URL da imagem aqui..."
                          className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white focus:border-amber-500 focus:outline-none"
                        />
                        <input
                          type="file"
                          ref={bgImageFileRef}
                          onChange={(e) => handleFileUpload(e, (url) => handleAppearanceChange('bgImageUrl', url))}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => bgImageFileRef.current?.click()}
                          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Enviar do Computador</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">
                        Cor de Fundo Base (Fallback)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={formData.appearance?.bgColor || '#0a0b0e'}
                          onChange={(e) => handleAppearanceChange('bgColor', e.target.value)}
                          className="w-9 h-9 rounded-lg border border-[#232633] bg-[#0a0b0e] cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={formData.appearance?.bgColor || '#0a0b0e'}
                          onChange={(e) => handleAppearanceChange('bgColor', e.target.value)}
                          className="px-3 py-1.5 rounded-lg bg-[#0a0b0e] border border-[#232633] text-xs text-white font-mono uppercase focus:border-amber-500 focus:outline-none w-32"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-slate-300">
                          Filtro Escuro de Contraste (Legibilidade)
                        </label>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {formData.appearance?.bgOverlayOpacity ?? 40}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="90"
                        step="5"
                        value={formData.appearance?.bgOverlayOpacity ?? 40}
                        onChange={(e) => handleAppearanceChange('bgOverlayOpacity', Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Ajuste para garantir que todo o texto e os banners continuem visíveis e legíveis sobre a imagem de fundo.
                      </p>
                    </div>

                    {formData.appearance?.bgImageUrl && (
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2">
                          Pré-visualização do Fundo Escolhido
                        </label>
                        <div className="relative rounded-2xl overflow-hidden border border-[#232633] h-48 bg-[#0a0b0e] flex items-center justify-center">
                          <img
                            src={formData.appearance.bgImageUrl}
                            alt="Preview Fundo"
                            className="w-full h-full object-cover"
                          />
                          <div 
                            className="absolute inset-0 bg-black pointer-events-none transition-opacity"
                            style={{ opacity: (formData.appearance.bgOverlayOpacity ?? 40) / 100 }}
                          />
                          <div className="absolute z-10 px-4 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-white font-bold text-xs shadow-2xl flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Visão Prévia do Fundo no Site</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABA 0: IMAGENS & BANNERS DO SITE */}
          {activeTab === 'images' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0d0e12] border border-[#232633] overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setImageSubTab('banners')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    imageSubTab === 'banners' 
                      ? 'bg-amber-500 text-black shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Banners Principais (Topo)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImageSubTab('slides')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    imageSubTab === 'slides' 
                      ? 'bg-amber-500 text-black shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Slides do Carrossel ({slides.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImageSubTab('programs')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    imageSubTab === 'programs' 
                      ? 'bg-amber-500 text-black shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Fotos da Programação ({programs.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImageSubTab('advertisers')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    imageSubTab === 'advertisers' 
                      ? 'bg-amber-500 text-black shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>Anunciantes & Marcas ({advertisers.length})</span>
                </button>
              </div>

              {imageSubTab === 'banners' && (
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-[#0a0b0e] border border-[#232633] space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          Banner Principal Superior (1900 x 900)
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Exibido diretamente abaixo do player topo com máxima nitidez em telas grandes.
                        </p>
                      </div>
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
                        Destaque Topo
                      </span>
                    </div>

                    <div className="relative w-full aspect-[1900/500] rounded-xl overflow-hidden border border-[#232633] bg-[#12141a]">
                      <img
                        src={formData.images.mainBannerUrl}
                        alt="Preview Banner Principal"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1900';
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Link URL da Imagem do Banner
                        </label>
                        <input
                          type="text"
                          value={formData.images.mainBannerUrl}
                          onChange={(e) => handleInputChange('images', 'mainBannerUrl', e.target.value)}
                          placeholder="https://sua-imagem.com/banner.jpg"
                          className="w-full px-3.5 py-2 rounded-xl bg-[#12141a] border border-[#232633] text-xs text-amber-300 font-mono focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col justify-end">
                        <input
                          type="file"
                          ref={mainBannerFileRef}
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, (url) => handleInputChange('images', 'mainBannerUrl', url))}
                        />
                        <button
                          type="button"
                          onClick={() => mainBannerFileRef.current?.click()}
                          className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Enviar Imagem (Computador)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#0a0b0e] border border-[#232633] space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                          <Layers className="w-4 h-4" />
                          Banner Faixa Secundário (1900 x 300)
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Banner estreito de chamada publicitária ou institucional fixo.
                        </p>
                      </div>
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-bold">
                        Strip Banner
                      </span>
                    </div>

                    <div className="relative w-full aspect-[1900/300] rounded-xl overflow-hidden border border-[#232633] bg-[#12141a]">
                      <img
                        src={formData.images.stripBannerUrl}
                        alt="Preview Banner Faixa"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1900';
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Link URL da Imagem da Faixa
                        </label>
                        <input
                          type="text"
                          value={formData.images.stripBannerUrl}
                          onChange={(e) => handleInputChange('images', 'stripBannerUrl', e.target.value)}
                          placeholder="https://sua-imagem.com/faixa.jpg..."
                          className="w-full px-3.5 py-2 rounded-xl bg-[#12141a] border border-[#232633] text-xs text-amber-300 font-mono focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col justify-end">
                        <input
                          type="file"
                          ref={stripBannerFileRef}
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, (url) => handleInputChange('images', 'stripBannerUrl', url))}
                        />
                        <button
                          type="button"
                          onClick={() => stripBannerFileRef.current?.click()}
                          className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Enviar Imagem (Computador)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {imageSubTab === 'slides' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a0b0e] p-4 rounded-2xl border border-[#232633]">
                    <div>
                      <h4 className="text-sm font-black text-amber-400 uppercase tracking-wider">
                        Gerenciar Banners do Carrossel Slide
                      </h4>
                      <p className="text-xs text-slate-400">
                        Altere, adicione ou faça upload de novas imagens para o carrossel da rádio.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddSlide}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-amber-400" />
                        <span>Adicionar Slide</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveSlidesOnly}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Salvar Slides Agora</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {slides.map((slide, idx) => (
                      <div key={slide.id || idx} className="p-4 rounded-2xl bg-[#0a0b0e] border border-[#232633] flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-full sm:w-48 aspect-video rounded-xl overflow-hidden bg-black shrink-0 border border-[#232633]">
                          <img 
                            src={slide.url} 
                            alt={slide.title || 'Slide'} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover" 
                          />
                        </div>

                        <div className="flex-1 w-full space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase">
                                Título do Slide #{idx + 1}
                              </label>
                              <input
                                type="text"
                                value={slide.title || ''}
                                onChange={(e) => handleUpdateSlideTitle(idx, e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg bg-[#12141a] border border-[#232633] text-xs text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase">
                                Subtítulo / Descrição
                              </label>
                              <input
                                type="text"
                                value={slide.caption || ''}
                                onChange={(e) => handleUpdateSlideCaption(idx, e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg bg-[#12141a] border border-[#232633] text-xs text-slate-300"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase">
                              URL da Imagem
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={slide.url}
                                onChange={(e) => handleUpdateSlideImage(idx, e.target.value)}
                                className="flex-1 px-3 py-1.5 rounded-lg bg-[#12141a] border border-[#232633] text-xs text-amber-300 font-mono"
                              />

                              <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer">
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleFileUpload(e, (url) => handleUpdateSlideImage(idx, url))}
                                />
                              </label>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteSlide(idx)}
                          className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all border border-rose-500/30 cursor-pointer"
                          title="Excluir Slide"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {imageSubTab === 'programs' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-black text-amber-400 uppercase tracking-wider">
                        Edição da Grade de Programação ({programs.length}/16)
                      </h4>
                      <p className="text-xs text-slate-400">
                        Edite os programas, apresentadores, horários e imagens. Suporta até 16 programas publicados na grade do site.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddProgram}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs flex items-center gap-1.5 transition-all hover:bg-amber-400 shadow-md cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar Programa</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {programs.map((prog, idx) => (
                      <div key={prog.id || idx} className="p-4 rounded-2xl bg-[#0a0b0e] border border-[#232633] space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-black shrink-0 border border-[#232633]">
                            <img 
                              src={prog.imageUrl} 
                              alt={prog.title} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=600';
                              }}
                            />
                          </div>

                          <div className="flex-1 space-y-2 min-w-0">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                                Nome do Programa #{idx + 1}
                              </label>
                              <input
                                type="text"
                                value={prog.title}
                                onChange={(e) => handleUpdateProgramTitle(idx, e.target.value)}
                                placeholder="Ex: Manhã Camaleão"
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#12141a] border border-[#232633] text-xs font-bold text-white focus:border-amber-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                                Locutor / Apresentador
                              </label>
                              <input
                                type="text"
                                value={prog.locutor}
                                onChange={(e) => handleUpdateProgramLocutor(idx, e.target.value)}
                                placeholder="Ex: Lucas Andrade"
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#12141a] border border-[#232633] text-xs font-medium text-slate-200 focus:border-amber-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteProgram(idx)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all border border-rose-500/30 shrink-0 cursor-pointer"
                            title="Excluir Programa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#1a1d26]">
                          <div>
                            <label className="block text-[10px] font-bold text-amber-400 uppercase mb-0.5">
                              Horário
                            </label>
                            <input
                              type="text"
                              value={prog.horario}
                              onChange={(e) => handleUpdateProgramHorario(idx, e.target.value)}
                              placeholder="Ex: 08:00 - 10:00"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#12141a] border border-[#232633] text-xs font-mono font-bold text-amber-300 focus:border-amber-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-amber-400 uppercase mb-0.5">
                              Dias
                            </label>
                            <input
                              type="text"
                              value={prog.dias || 'Segunda a Sexta'}
                              onChange={(e) => handleUpdateProgramDias(idx, e.target.value)}
                              placeholder="Ex: Segunda a Sexta"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#12141a] border border-[#232633] text-xs font-bold text-amber-300 focus:border-amber-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                              Foto / Capa
                            </label>
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={prog.imageUrl}
                                onChange={(e) => handleUpdateProgramImage(idx, e.target.value)}
                                className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#12141a] border border-[#232633] text-[11px] text-amber-300 font-mono truncate focus:border-amber-500 focus:outline-none"
                              />
                              <label className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center cursor-pointer shrink-0">
                                <Upload className="w-3.5 h-3.5" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleFileUpload(e, (url) => handleUpdateProgramImage(idx, url))}
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {imageSubTab === 'advertisers' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-black text-amber-400 uppercase tracking-wider">
                        Banners, Logos e Informações dos Anunciantes
                      </h4>
                      <p className="text-xs text-slate-400">
                        Adicione, edite ou remova os anunciantes e marcas parceiras exibidas no site da rádio.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddAdvertiser}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs flex items-center gap-1.5 transition-all hover:bg-amber-400 shadow-md cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Adicionar Anunciante</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveAdvertisersOnly}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs flex items-center gap-1.5 transition-all hover:bg-emerald-400 shadow-md cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Salvar Anunciantes</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {advertisers.map((adv, idx) => (
                      <div key={adv.id || idx} className="p-4 rounded-2xl bg-[#0a0b0e] border border-[#232633] space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-24 h-20 rounded-xl overflow-hidden bg-black shrink-0 border border-[#232633] relative">
                            <img 
                              src={adv.imageUrl} 
                              alt={adv.title} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=800';
                              }}
                            />
                          </div>

                          <div className="flex-1 space-y-2 min-w-0">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                                Nome da Empresa / Anunciante #{idx + 1}
                              </label>
                              <input
                                type="text"
                                value={adv.title}
                                onChange={(e) => handleUpdateAdvertiserTitle(idx, e.target.value)}
                                placeholder="Ex: Auto Peças Camaleão"
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#12141a] border border-[#232633] text-xs font-bold text-white focus:border-amber-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                                Subtítulo / Descrição Rápida
                              </label>
                              <input
                                type="text"
                                value={adv.subtitle || ''}
                                onChange={(e) => handleUpdateAdvertiserSubtitle(idx, e.target.value)}
                                placeholder="Ex: Peças e Acessórios com Desconto"
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#12141a] border border-[#232633] text-xs font-medium text-slate-200 focus:border-amber-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteAdvertiser(idx)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all border border-rose-500/30 shrink-0 cursor-pointer"
                            title="Excluir Anunciante"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#1a1d26]">
                          <div>
                            <label className="block text-[10px] font-bold text-amber-400 uppercase mb-0.5">
                              Tag / Categoria (Destaque)
                            </label>
                            <input
                              type="text"
                              value={adv.tag || ''}
                              onChange={(e) => handleUpdateAdvertiserTag(idx, e.target.value)}
                              placeholder="Ex: PATROCINADOR MASTER"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#12141a] border border-[#232633] text-xs font-mono font-bold text-amber-300 focus:border-amber-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                              Link (Site / WhatsApp)
                            </label>
                            <input
                              type="text"
                              value={adv.targetUrl || ''}
                              onChange={(e) => handleUpdateAdvertiserTargetUrl(idx, e.target.value)}
                              placeholder="Ex: https://wa.me/5511999998888"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#12141a] border border-[#232633] text-xs font-mono text-slate-200 focus:border-amber-500 focus:outline-none truncate"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                            Imagem / Banner do Anunciante
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={adv.imageUrl}
                              onChange={(e) => handleUpdateAdvertiserImage(idx, e.target.value)}
                              placeholder="URL da imagem..."
                              className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#12141a] border border-[#232633] text-[11px] text-amber-300 font-mono truncate focus:border-amber-500 focus:outline-none"
                            />
                            <label className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center cursor-pointer shrink-0">
                              <Upload className="w-3.5 h-3.5" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, (url) => handleUpdateAdvertiserImage(idx, url))}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ABA 1: DADOS DA RÁDIO & STREAM */}
          {activeTab === 'radio' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nome da Emissora / Rádio
                  </label>
                  <input
                    type="text"
                    value={formData.radio.name}
                    onChange={(e) => handleInputChange('radio', 'name', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Slogan da Rádio
                  </label>
                  <input
                    type="text"
                    value={formData.radio.slogan}
                    onChange={(e) => handleInputChange('radio', 'slogan', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Frequência FM / Destaque
                  </label>
                  <input
                    type="text"
                    value={formData.radio.frequency}
                    onChange={(e) => handleInputChange('radio', 'frequency', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Estilo / Gênero Musical
                  </label>
                  <input
                    type="text"
                    value={formData.radio.genre}
                    onChange={(e) => handleInputChange('radio', 'genre', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0a0b0e] border border-[#232633] space-y-3">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  Link da Transmissão de Áudio (Stream URL)
                </h4>
                <p className="text-xs text-slate-400">
                  Insira a URL do servidor de streaming Shoutcast ou Icecast da rádio ao vivo.
                </p>
                <input
                  type="text"
                  value={formData.radio.audioStreamUrl}
                  onChange={(e) => handleInputChange('radio', 'audioStreamUrl', e.target.value)}
                  placeholder="https://stm18.voxhd.com.br:12892/;"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#12141a] border border-[#232633] text-sm text-amber-300 font-mono focus:border-amber-500 focus:outline-none"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Servidor de Stream
                    </label>
                    <input
                      type="text"
                      value={formData.radio.audioServer}
                      onChange={(e) => handleInputChange('radio', 'audioServer', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#12141a] border border-[#232633] text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Qualidade da Transmissão
                    </label>
                    <input
                      type="text"
                      value={formData.radio.audioQuality}
                      onChange={(e) => handleInputChange('radio', 'audioQuality', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#12141a] border border-[#232633] text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Programa no Ar Agora (Exibido no Player)
                  </label>
                  <input
                    type="text"
                    value={formData.radio.currentProgram}
                    onChange={(e) => handleInputChange('radio', 'currentProgram', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Locutor / Artista no Ar Agora
                  </label>
                  <input
                    type="text"
                    value={formData.radio.currentArtist}
                    onChange={(e) => handleInputChange('radio', 'currentArtist', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: CONTATOS & ESTÚDIO */}
          {activeTab === 'contacts' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Endereço Completo do Estúdio
                </label>
                <input
                  type="text"
                  value={formData.contacts.address}
                  onChange={(e) => handleInputChange('contacts', 'address', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    WhatsApp do Ouvinte (Exibição Formatada)
                  </label>
                  <input
                    type="text"
                    value={formData.contacts.whatsappOuvinte}
                    onChange={(e) => handleInputChange('contacts', 'whatsappOuvinte', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Número do WhatsApp (Apenas Números com DDD)
                  </label>
                  <input
                    type="text"
                    value={formData.contacts.whatsappNumberClean}
                    onChange={(e) => handleInputChange('contacts', 'whatsappNumberClean', e.target.value)}
                    placeholder="Ex: 5511999998888"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Telefone Comercial / Anúncios
                  </label>
                  <input
                    type="text"
                    value={formData.contacts.phoneComercial}
                    onChange={(e) => handleInputChange('contacts', 'phoneComercial', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    E-mail Oficial
                  </label>
                  <input
                    type="email"
                    value={formData.contacts.emailOfficial}
                    onChange={(e) => handleInputChange('contacts', 'emailOfficial', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Horário de Atendimento Comercial
                </label>
                <input
                  type="text"
                  value={formData.contacts.businessHours}
                  onChange={(e) => handleInputChange('contacts', 'businessHours', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* ABA 3: REDES SOCIAIS */}
          {activeTab === 'social' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  URL do Instagram Oficial
                </label>
                <input
                  type="url"
                  value={formData.social.instagramUrl}
                  onChange={(e) => handleInputChange('social', 'instagramUrl', e.target.value)}
                  placeholder="https://instagram.com/radiocamaleao"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  URL do Facebook Oficial
                </label>
                <input
                  type="url"
                  value={formData.social.facebookUrl}
                  onChange={(e) => handleInputChange('social', 'facebookUrl', e.target.value)}
                  placeholder="https://facebook.com/radiocamaleao"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  URL do Canal no YouTube
                </label>
                <input
                  type="url"
                  value={formData.social.youtubeUrl}
                  onChange={(e) => handleInputChange('social', 'youtubeUrl', e.target.value)}
                  placeholder="https://youtube.com/radiocamaleao"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="pt-6 border-t border-[#232633] flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Informações e Imagens Padrão</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsAdminDashboardOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
