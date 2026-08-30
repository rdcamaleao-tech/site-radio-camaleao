import React, { useState, useEffect, useRef } from 'react';
import { supabaseService, compressImageFile, safeSetLocalStorage } from '../services/supabaseService';
import { 
  Plus, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  Image as ImageIcon, 
  X, 
  Upload, 
  Link as LinkIcon,
  Maximize2
} from 'lucide-react';

const OFFICIAL_DEFAULT_BANNER = 'https://scontent.fpoa27-1.fna.fbcdn.net/v/t39.30808-6/787761292_1053892700730747_2791346406042096703_n.jpg?stp=dst-jpg_tt6&cstp=mx1900x905&ctp=s1900x905&_nc_cat=100&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeEwj4LTtetRbgl91QrXcsFj_TawH9aGbWT9NrAf1oZtZMVrJ-Eu04rsptONd6S5cA2hMcScUxEO3X_E20jePQhx&_nc_ohc=9o_wGWyb5TQQ7kNvwHhpjKM&_nc_oc=AdqX2EM7SOVX0Mcucz3-8Y88ZDp5tlP0dqzgreGEPg06jfQcnthhTS4gGD58Ndyr_TIPZ-G4ci40mvpT7msJP35J&_nc_zt=23&_nc_ht=scontent.fpoa27-1.fna&_nc_gid=aWvpeqOu69K6Ggx5wVyHdA&_nc_ss=7b2a8&oh=00_AQK88c1102i8JsBVDVmEvyM3XA-AYENijd1JCpPcgM2b4g&oe=6A97F482';

export interface SlideItem {
  id: string;
  url: string;
  title?: string;
  caption?: string;
}

export const DEFAULT_SLIDES: SlideItem[] = [
  {
    id: 'camaleao-slide-1',
    url: OFFICIAL_DEFAULT_BANNER,
    title: 'RÁDIO CAMALEÃO 98.5 FM',
    caption: 'A trilha sonora oficial da sua energia diária'
  }
];

export function sanitizeSlideList(rawList: any[]): SlideItem[] {
  if (!Array.isArray(rawList)) return DEFAULT_SLIDES;
  // Remove imagens genéricas antigas do Unsplash para garantir que apenas as cadastradas apareçam
  const filtered = rawList.filter(
    (item) => item && typeof item.url === 'string' && item.url.trim() !== '' && !item.url.includes('unsplash.com')
  );
  return filtered.length > 0 ? filtered : DEFAULT_SLIDES;
}

const LOCAL_STORAGE_KEY = 'camaleao_banner_slides_v1';
const MAX_SLIDES = 100;
const AUTO_PLAY_INTERVAL_MS = 5000;

export const BannerSlider: React.FC = () => {
  const [slides, setSlides] = useState<SlideItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sanitizeSlideList(parsed).slice(0, MAX_SLIDES);
        }
      }
    } catch (e) {
      console.error('Erro ao carregar slides do localStorage:', e);
    }
    return DEFAULT_SLIDES;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying] = useState(true);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [, setIsFullscreen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    async function loadSupabaseSlides() {
      const dbSlides = await supabaseService.fetchSlides();
      if (isMounted) {
        if (dbSlides && dbSlides.length > 0) {
          const sanitized = sanitizeSlideList(dbSlides).slice(0, MAX_SLIDES);
          setSlides(sanitized);
          safeSetLocalStorage(LOCAL_STORAGE_KEY, sanitized);
        } else {
          // Salva os slides sanitizados atuais se banco ainda não tinha
          const currentSanitized = sanitizeSlideList(slides);
          safeSetLocalStorage(LOCAL_STORAGE_KEY, currentSanitized);
          supabaseService.saveSlides(currentSanitized);
        }
      }
    }
    loadSupabaseSlides();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      safeSetLocalStorage(LOCAL_STORAGE_KEY, slides);
    } catch (e) {
      console.warn('Não foi possível salvar no localStorage:', e);
    }
  }, [slides]);

  // Listen for admin panel updates
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSlides(sanitizeSlideList(parsed).slice(0, MAX_SLIDES));
          }
        } else {
          supabaseService.fetchSlides().then((dbSlides) => {
            if (dbSlides && dbSlides.length > 0) {
              setSlides(sanitizeSlideList(dbSlides).slice(0, MAX_SLIDES));
            }
          });
        }
      } catch (e) {
        console.error('Erro ao atualizar slides:', e);
      }
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('camaleao_slides_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('camaleao_slides_updated', handleUpdate);
    };
  }, []);

  // Autoplay timer
  useEffect(() => {
    if (!isPlaying || slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, AUTO_PLAY_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isPlaying, slides.length]);

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!urlInput.trim()) {
      setUploadError('Digite uma URL de imagem válida.');
      return;
    }

    if (slides.length >= MAX_SLIDES) {
      setUploadError(`Limite máximo de ${MAX_SLIDES} imagens atingido.`);
      return;
    }

    const newSlide: SlideItem = {
      id: `url-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      url: urlInput.trim(),
      title: titleInput.trim() || `Imagem ${slides.length + 1}`,
    };

    const updated = [...slides, newSlide];
    setSlides(updated);
    supabaseService.saveSlides(updated);
    setUrlInput('');
    setTitleInput('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (slides.length + files.length > MAX_SLIDES) {
      setUploadError(`Você só pode armazenar até ${MAX_SLIDES} imagens no total. Atualmente tem ${slides.length}.`);
      return;
    }

    const newSlidesList: SlideItem[] = [];

    for (const file of Array.from(files) as File[]) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Selecione apenas arquivos de imagem.');
        continue;
      }

      try {
        const compressedDataUrl = await compressImageFile(file, 1920, 1080, 0.85);
        if (compressedDataUrl) {
          newSlidesList.push({
            id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            url: compressedDataUrl,
            title: file.name.replace(/\.[^/.]+$/, ''),
          });
        }
      } catch (err) {
        console.error('Erro ao processar imagem:', err);
      }
    }

    if (newSlidesList.length > 0) {
      setSlides((prev) => {
        const updated = [...prev, ...newSlidesList].slice(0, MAX_SLIDES);
        supabaseService.saveSlides(updated);
        return updated;
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveSlide = (id: string) => {
    const updated = slides.filter((s) => s.id !== id);
    setSlides(updated);
    safeSetLocalStorage(LOCAL_STORAGE_KEY, updated);
    supabaseService.saveSlides(updated);
    window.dispatchEvent(new Event('camaleao_slides_updated'));
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const copy = [...slides];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    setSlides(copy);
    safeSetLocalStorage(LOCAL_STORAGE_KEY, copy);
    supabaseService.saveSlides(copy);
    window.dispatchEvent(new Event('camaleao_slides_updated'));
  };

  const handleResetDefaults = () => {
    if (window.confirm('Deseja restaurar as imagens padrão da Rádio Camaleão?')) {
      setSlides(DEFAULT_SLIDES);
      setCurrentIndex(0);
      setUploadError(null);
      safeSetLocalStorage(LOCAL_STORAGE_KEY, DEFAULT_SLIDES);
      supabaseService.saveSlides(DEFAULT_SLIDES);
      window.dispatchEvent(new Event('camaleao_slides_updated'));
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  const activeSlide = slides[currentIndex];

  return (
    <div 
      ref={containerRef}
      className="w-full max-w-[1900px] overflow-hidden rounded-2xl border border-[#232633] shadow-[0_15px_40px_rgba(0,0,0,0.8)] relative bg-[#12141a] group text-white"
    >
      {/* AREA DO SLIDER (1900x900 ASPECT RATIO) */}
      <div className="relative w-full aspect-[1900/900] max-h-[900px] overflow-hidden bg-black/40 select-none">
        {slides.length > 0 && activeSlide ? (
          <div className="relative w-full h-full">
            <img
              src={activeSlide.url}
              alt={activeSlide.title || `Slide ${currentIndex + 1}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center transition-opacity duration-700 ease-in-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#12141a] text-slate-400">
            <ImageIcon className="w-16 h-16 text-slate-600 mb-4 animate-bounce" />
            <h4 className="text-xl font-bold text-white mb-2">Nenhum slide disponível</h4>
            <p className="text-sm max-w-md mb-6 text-slate-400">
              Adicione até 25 imagens personalizadas para exibir no seu carrossel 1900x900.
            </p>
            <button
              onClick={() => setIsManagerOpen(true)}
              className="px-6 py-3 rounded-xl bg-[#ff5700] hover:bg-[#e04d00] text-white font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>Adicionar Imagens</span>
            </button>
          </div>
        )}

        {/* CONTROLES SUPERIORES */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={toggleFullscreen}
            title="Alternar Tela Cheia"
            className="p-2 rounded-xl bg-[#0d0e12]/80 backdrop-blur-md border border-[#232633] text-white hover:text-[#ff5700] transition-all cursor-pointer shadow-lg"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* SLIDE INDICATORS / THUMBNAILS AT BOTTOM */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-20 max-w-[90vw] overflow-x-auto py-1 px-3 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => setCurrentIndex(index)}
              title={slide.title || `Slide ${index + 1}`}
              className={`transition-all rounded-full cursor-pointer ${
                index === currentIndex
                  ? 'w-8 sm:w-10 h-2.5 bg-[#ff5700]'
                  : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/80'
              }`}
            />
          ))}
        </div>

        {/* PROGRESS BAR DO AUTOPLAY */}
        {isPlaying && slides.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40 overflow-hidden z-20">
            <div 
              key={currentIndex}
              className="h-full bg-gradient-to-r from-[#ff5700] to-amber-400 animate-slider-progress"
              style={{ animationDuration: `${AUTO_PLAY_INTERVAL_MS}ms` }}
            />
          </div>
        )}
      </div>

      {/* PAINEL DE GERENCIAMENTO DE IMAGENS */}
      {isManagerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#12141a] border border-[#232633] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-[#232633] flex items-center justify-between bg-[#0d0e12]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#ff5700]/10 border border-[#ff5700]/30 text-[#ff5700]">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Gerenciador de Sliders (1900x900)</h3>
                  <p className="text-xs text-slate-400">
                    Armazene até {MAX_SLIDES} imagens no seu carrossel personalizado. ({slides.length}/{MAX_SLIDES} ocupados)
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

            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
              {uploadError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
                  <span>{uploadError}</span>
                  <button onClick={() => setUploadError(null)} className="text-rose-400 hover:text-white font-bold ml-2">✕</button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#0a0b0e] border border-[#232633] flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-[#ff5700]" />
                      Upload de Arquivo Local
                    </h4>
                    <p className="text-xs text-slate-400 mb-4">
                      Selecione imagens do seu computador para adicionar diretamente ao navegador.
                    </p>
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="slide-file-upload"
                      disabled={slides.length >= MAX_SLIDES}
                    />
                    <label
                      htmlFor="slide-file-upload"
                      className={`w-full py-3 px-4 rounded-xl border border-dashed flex items-center justify-center gap-2 font-bold text-sm cursor-pointer transition-all ${
                        slides.length >= MAX_SLIDES
                          ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                          : 'border-[#ff5700]/40 bg-[#ff5700]/10 hover:bg-[#ff5700]/20 text-[#ff5700]'
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      <span>{slides.length >= MAX_SLIDES ? 'Limite Atingido' : 'Escolher Imagem (Upload)'}</span>
                    </label>
                  </div>
                </div>

                <form onSubmit={handleAddUrl} className="p-4 rounded-2xl bg-[#0a0b0e] border border-[#232633] flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-cyan-400" />
                      Adicionar por URL na Web
                    </h4>
                    <p className="text-xs text-slate-400 mb-3">
                      Cole o link direto de uma imagem na internet.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="url"
                      placeholder="https://exemplo.com/imagem.jpg"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      disabled={slides.length >= MAX_SLIDES}
                      className="w-full px-3 py-2 rounded-xl bg-[#12141a] border border-[#232633] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Título opcional"
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        disabled={slides.length >= MAX_SLIDES}
                        className="flex-1 px-3 py-2 rounded-xl bg-[#12141a] border border-[#232633] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="submit"
                        disabled={slides.length >= MAX_SLIDES}
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-300">
                    Imagens Cadastradas ({slides.length} de {MAX_SLIDES})
                  </h4>
                  <button
                    onClick={handleResetDefaults}
                    className="text-xs text-slate-400 hover:text-[#ff5700] transition-colors underline cursor-pointer"
                  >
                    Restaurar Imagens Padrão
                  </button>
                </div>

                {slides.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-[#232633] rounded-2xl text-slate-500 text-sm">
                    Nenhuma imagem cadastrada no momento.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {slides.map((slide, index) => (
                      <div
                        key={slide.id}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                          index === currentIndex
                            ? 'bg-[#ff5700]/10 border-[#ff5700]/50'
                            : 'bg-[#0a0b0e] border-[#232633] hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="text-xs font-mono font-bold text-slate-500 w-6 text-center">
                            #{index + 1}
                          </span>
                          <img
                            src={slide.url}
                            alt={slide.title || `Slide ${index + 1}`}
                            className="w-16 h-10 object-cover rounded-lg border border-slate-700 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {slide.title || `Slide ${index + 1}`}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate max-w-xs">
                              {slide.url.startsWith('data:') ? 'Arquivo de imagem enviado' : slide.url}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setCurrentIndex(index)}
                            title="Visualizar este slide agora"
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              index === currentIndex
                                ? 'bg-[#ff5700] text-white'
                                : 'bg-slate-800 text-slate-300 hover:text-white'
                            }`}
                          >
                            {index === currentIndex ? 'Exibindo' : 'Ver'}
                          </button>

                          <button
                            onClick={() => handleMoveSlide(index, 'up')}
                            disabled={index === 0}
                            title="Mover para cima"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 cursor-pointer"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleMoveSlide(index, 'down')}
                            disabled={index === slides.length - 1}
                            title="Mover para baixo"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 cursor-pointer"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleRemoveSlide(slide.id)}
                            title="Excluir slide"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 hover:text-rose-200 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-[#232633] bg-[#0d0e12] flex items-center justify-between text-xs text-slate-400">
              <span>* As imagens são salvas automaticamente no armazenamento local do seu navegador.</span>
              <button
                onClick={() => setIsManagerOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-[#ff5700] hover:bg-[#e04d00] text-white font-bold transition-all cursor-pointer"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
