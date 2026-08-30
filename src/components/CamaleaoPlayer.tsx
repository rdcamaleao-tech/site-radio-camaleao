import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Volume1, Info, Share2, AlertCircle, Loader2, X, Copy, Check } from 'lucide-react';
import { useRadio } from '../context/RadioContext';
import { SecretTrigger } from './SecretTrigger';

export const CamaleaoPlayer: React.FC = () => {
  const { settings } = useRadio();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'CONECTADO' | 'CONECTANDO...' | 'DESCONECTADO'>('DESCONECTADO');
  const [hasError, setHasError] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  const barCount = 30;
  const [barHeights, setBarHeights] = useState<number[]>(
    Array.from({ length: barCount }, (_, i) => 25 + (i % 3) * 5)
  );

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    let animId: number;
    const updateBars = () => {
      if (isPlaying) {
        setBarHeights((prev) =>
          prev.map((_, i) => {
            const wave = Math.sin(Date.now() / 180 + i * 0.35) * 40 + 55;
            const noise = Math.random() * 45;
            return Math.min(100, Math.max(20, wave + noise - 15));
          })
        );
      } else {
        setBarHeights(Array.from({ length: barCount }, (_, i) => 25 + (i % 3) * 5));
      }
      animId = requestAnimationFrame(updateBars);
    };

    if (isPlaying) {
      animId = requestAnimationFrame(updateBars);
    } else {
      setBarHeights(Array.from({ length: barCount }, (_, i) => 25 + (i % 3) * 5));
    }

    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  const handlePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    setHasError(false);
    setIsLoading(true);
    setConnectionStatus('CONECTANDO...');

    audio.src = settings.radio.audioStreamUrl || 'https://stm18.voxhd.com.br:12892/;';

    const promise = audio.play();
    playPromiseRef.current = promise;

    if (promise !== undefined) {
      promise
        .then(() => {
          playPromiseRef.current = null;
          setIsPlaying(true);
          setIsLoading(false);
          setConnectionStatus('CONECTADO');
        })
        .catch((err) => {
          playPromiseRef.current = null;
          if (err?.name === 'AbortError' || err?.message?.includes('interrupted')) {
            setIsLoading(false);
            setIsPlaying(false);
            setConnectionStatus('DESCONECTADO');
            return;
          }
          console.warn('Erro ao iniciar rádio:', err);
          setIsPlaying(false);
          setIsLoading(false);
          setConnectionStatus('DESCONECTADO');
          setHasError(true);
        });
    }
  };

  const handleStop = () => {
    const audio = audioRef.current;
    if (audio) {
      if (playPromiseRef.current) {
        playPromiseRef.current
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
          })
          .catch(() => {
            // ignore aborted play promise
          });
      } else {
        audio.pause();
        audio.currentTime = 0;
      }
    }
    setIsPlaying(false);
    setIsLoading(false);
    setConnectionStatus('DESCONECTADO');
    setElapsedSeconds(0);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://rdcamaleao.com.br');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBarColor = (index: number, total: number) => {
    const ratio = index / total;
    if (ratio < 0.2) return '#00f0ff';
    if (ratio < 0.4) return '#00ff66';
    if (ratio < 0.6) return '#ffea00';
    if (ratio < 0.75) return '#ff6600';
    if (ratio < 0.9) return '#ff00aa';
    return '#a822ff';
  };

  return (
    <div className="w-full flex flex-col items-center select-none font-sans">
      {/* HEADER RADIO TOP BAR */}
      <div className="w-full max-w-7xl px-2 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-3 bg-[#0d0e12] border-b border-[#1a1c24]">
        
        {/* ROW / CONTAINER OF ALL MODULES */}
        <div className="w-full flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-between gap-2.5 sm:gap-3">

          {/* COMBINED CONTAINER FOR MODULE 1 (PLAY/STOP) & MODULE 2 (EQUALIZER) */}
          <div className="w-full sm:w-auto flex items-center justify-center gap-2 sm:gap-3">

            {/* MODULE 1: PLAY & STOP PILL CAPSULE + INFO BUTTON */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <div className="bg-[#12141a] border border-[#232633] rounded-full p-1 sm:p-1.5 px-1.5 sm:px-2 flex items-center gap-1.5 sm:gap-2 shadow-lg">
                <button
                  onClick={handlePlay}
                  disabled={isLoading}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#fff8ed] hover:bg-white text-[#ff5700] flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-md focus:outline-none flex-shrink-0 cursor-pointer"
                  title="Tocar Rádio (Ao Vivo)"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-[#ff5700]" />
                  ) : (
                    <svg width="20" height="20" className="sm:w-[22px] sm:h-[22px]" viewBox="0 0 24 24" fill="#ff5700">
                      <polygon points="6 3 20 12 6 21 6 3"></polygon>
                    </svg>
                  )}
                </button>

                <button
                  onClick={handleStop}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#ff5700] hover:bg-[#ff6714] text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-md focus:outline-none flex-shrink-0 cursor-pointer"
                  title="Parar Rádio"
                >
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white rounded-[2px]" />
                </button>
              </div>

              <button
                onClick={() => setShowInfoModal(true)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-slate-700/60 bg-[#12141a] text-slate-400 hover:text-white hover:border-slate-500 flex items-center justify-center transition-all focus:outline-none flex-shrink-0 cursor-pointer"
                title="Informações da Emissora"
              >
                <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* MODULE 2: SINTONIA & AUDIO EQUALIZER SPECTRUM */}
            <SecretTrigger holdTimeMs={5000} className="bg-[#12141a] border border-[#232633] rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 flex flex-col justify-between flex-1 sm:flex-initial min-w-0 sm:min-w-[340px] h-[76px] sm:h-[84px] shadow-lg">
              <div className="flex items-center justify-between text-[11px] sm:text-sm font-mono tracking-wider">
                <div className="flex items-center gap-1 sm:gap-1.5 text-slate-300 font-bold">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#ff5700] inline-block animate-pulse" />
                  <span>SINTONIA</span>
                </div>
                <div className="font-extrabold text-[#ff7700] text-[11px] sm:text-sm truncate">
                  {connectionStatus}
                </div>
              </div>

              <div className="flex items-end justify-between gap-[2px] sm:gap-[3px] h-8 sm:h-11 my-0.5 px-0.5 sm:px-1">
                {barHeights.map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-full transition-all duration-75"
                    style={{
                      height: `${height}%`,
                      backgroundColor: getBarColor(i, barCount),
                      opacity: isPlaying ? 1 : 0.45,
                      boxShadow: isPlaying ? `0 0 8px ${getBarColor(i, barCount)}aa` : 'none',
                    }}
                  />
                ))}
              </div>

              <div className="flex justify-end items-center gap-1 sm:gap-1.5 text-[11px] sm:text-sm font-mono">
                <span className="text-slate-400 font-bold">TEMPO</span>
                <span className="font-extrabold text-[#ff7700] tracking-widest">
                  {formatTime(elapsedSeconds)}
                </span>
              </div>
            </SecretTrigger>

          </div>

          {/* MODULE 3: VOLUME CONTROL BOX */}
          <div className="hidden sm:flex bg-[#12141a] border border-[#232633] rounded-2xl px-4 py-2.5 items-center gap-3 h-[84px] min-w-[170px] shadow-lg">
            <button
              onClick={toggleMute}
              className="text-slate-300 hover:text-[#ff5700] transition-colors focus:outline-none cursor-pointer"
              title={isMuted ? "Ativar Áudio" : "Mutar Áudio"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-6 h-6 text-rose-500" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-6 h-6" />
              ) : (
                <Volume2 className="w-6 h-6" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 sm:w-24 h-2 bg-[#1f2230] appearance-none rounded-lg cursor-pointer accent-[#ff5700] focus:outline-none"
            />

            <span className="text-sm font-mono font-black text-[#ff7700] min-w-[36px] text-right">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>

          {/* MODULE 4: REDES SOCIAIS & COMPARTILHAMENTO */}
          <div className="bg-[#12141a] border border-[#232633] rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-center gap-2 sm:gap-2.5 h-[56px] sm:h-[84px] w-full sm:w-auto shadow-lg">
            {/* WhatsApp */}
            <a
              href={`https://api.whatsapp.com/send?phone=${settings.contacts.whatsappNumberClean || '5551989488590'}&text=Estou%20ouvindo%20a%20${encodeURIComponent(settings.radio.name)}!`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#00d856] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md focus:outline-none"
              title="Compartilhar no WhatsApp"
            >
              <svg width="18" height="18" className="sm:w-[22px] sm:h-[22px]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.99c-.002 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href={settings.social.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md focus:outline-none"
              title="Instagram Oficial"
            >
              <svg width="18" height="18" className="sm:w-[22px] sm:h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>

            {/* Facebook */}
            <a
              href={settings.social.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#1877f2] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md focus:outline-none"
              title="Facebook Oficial"
            >
              <svg width="18" height="18" className="sm:w-[22px] sm:h-[22px]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>

            {/* YouTube */}
            <a
              href={settings.social.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#ff0000] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md focus:outline-none"
              title="Canal do YouTube"
            >
              <svg width="18" height="18" className="sm:w-[22px] sm:h-[22px]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>

            {/* Share */}
            <button
              onClick={() => setShowShareModal(true)}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#ff5700] hover:bg-[#ff6714] text-[#ffffff] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md focus:outline-none cursor-pointer"
              title="Compartilhar Rádio"
            >
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

        </div>

        {/* Audio Element */}
        <audio
          ref={audioRef}
          id="rc-audio-element"
          src="https://stm18.voxhd.com.br:12892/;"
          preload="none"
          onWaiting={() => {
            setIsLoading(true);
            setConnectionStatus('CONECTANDO...');
          }}
          onPlaying={() => {
            setIsLoading(false);
            setIsPlaying(true);
            setConnectionStatus('CONECTADO');
            setHasError(false);
          }}
          onError={() => {
            if (isPlaying || isLoading) {
              setIsLoading(false);
              setIsPlaying(false);
              setConnectionStatus('DESCONECTADO');
              setHasError(true);
            }
          }}
        />
      </div>

      {hasError && (
        <div className="mt-2 flex items-center gap-2 text-xs text-rose-400 bg-rose-950/60 border border-rose-500/30 px-4 py-2 rounded-lg max-w-md w-full justify-center">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Erro na conexão ao vivo. Clique no Play para tentar novamente.</span>
        </div>
      )}

      {/* INFO MODAL */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141a] border border-[#232633] rounded-2xl p-6 max-w-sm w-full text-slate-100 shadow-2xl relative">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#ff5700] flex items-center justify-center text-white font-bold text-lg">
                📻
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">{settings.radio.name}</h3>
                <p className="text-xs text-[#ff7700] font-semibold">{settings.radio.frequency} • {settings.radio.slogan}</p>
              </div>
            </div>
            <div className="space-y-2.5 text-xs text-slate-300 border-t border-[#232633] pt-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Programa Atual:</span>
                <span className="font-semibold text-white">{settings.radio.currentProgram}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Qualidade de Áudio:</span>
                <span className="font-semibold text-[#ff7700]">{settings.radio.audioQuality}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Servidor de Stream:</span>
                <span className="font-semibold text-white">{settings.radio.audioServer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estilo:</span>
                <span className="font-semibold text-white">{settings.radio.genre}</span>
              </div>
            </div>
            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full mt-6 bg-[#ff5700] hover:bg-[#ff6714] text-white font-semibold py-2.5 rounded-xl transition-all cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141a] border border-[#232633] rounded-2xl p-6 max-w-sm w-full text-slate-100 shadow-2xl relative">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-lg text-white mb-2">Compartilhar Rádio</h3>
            <p className="text-xs text-slate-400 mb-4">
              Copie o link da transmissão e compartilhe com os seus amigos!
            </p>
            <div className="flex items-center gap-2 bg-[#090a0d] border border-[#232633] rounded-xl p-2.5 mb-4">
              <input
                type="text"
                readOnly
                value="rdcamaleao.com.br"
                className="bg-transparent text-xs text-[#ff7700] font-mono font-bold w-full outline-none select-all"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-[#ff5700] hover:bg-[#ff6714] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 flex-shrink-0 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full bg-[#1e2230] hover:bg-[#282d3e] text-slate-200 font-semibold py-2 rounded-xl text-xs transition-all cursor-pointer"
            >
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
