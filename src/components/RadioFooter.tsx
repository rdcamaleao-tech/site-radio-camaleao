import React, { useState } from 'react';
import { 
  Radio, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  MessageCircle, 
  Headphones, 
  Music, 
  Heart, 
  ShieldCheck, 
  Globe 
} from 'lucide-react';
import { useRadio } from '../context/RadioContext';
import { SecretTrigger } from './SecretTrigger';

const InstagramIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const YoutubeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <polygon points="10 15 15 12 10 9 10 15" fill="currentColor" />
  </svg>
);

export const RadioFooter: React.FC = () => {
  const { settings } = useRadio();
  const [songRequest, setSongRequest] = useState('');
  const [listenerName, setListenerName] = useState('');

  const handleSendSongRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!songRequest.trim()) return;

    const text = encodeURIComponent(
      `📻 *PEDIDO DE MÚSICA - ${settings.radio.name}*\n\n` +
      `👤 *Ouvinte:* ${listenerName || 'Ouvinte Camaleão'}\n` +
      `🎵 *Música/Artista:* ${songRequest}\n\n` +
      `Enviado pelo site da rádio!`
    );

    const targetNumber = settings.contacts.whatsappNumberClean || '5551989488590';
    window.open(`https://api.whatsapp.com/send?phone=${targetNumber}&text=${text}`, '_blank');
  };

  return (
    <footer className="w-full bg-[#0d0e12] border-t border-[#232633] text-white pt-12 pb-8 mt-12">
      <div className="w-full max-w-[1900px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* BANNER DE INTERAÇÃO RÁPIDA / PEDIR MÚSICA */}
        <div className="rounded-3xl bg-gradient-to-r from-[#12141a] via-[#1a1d26] to-[#12141a] border border-[#232633] p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-5 space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold text-xs sm:text-sm uppercase tracking-wider">
                <Music className="w-4 h-4" />
                <span>Interação Ao Vivo</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Peça Sua Música no Ar!
              </h3>
              <p className="text-sm sm:text-base text-slate-200 font-medium leading-relaxed">
                Mande seu nome e sua música favorita direto para o estúdio da {settings.radio.name}. Nosso locutor vai mandar aquele alô especial para você!
              </p>
            </div>

            <form onSubmit={handleSendSongRequest} className="lg:col-span-7 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Seu nome"
                value={listenerName}
                onChange={(e) => setListenerName(e.target.value)}
                className="px-4 py-3.5 rounded-2xl bg-[#0a0b0e] border border-[#232633] text-base text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 sm:w-1/3"
              />
              <input
                type="text"
                required
                placeholder="Nome da música / Artista"
                value={songRequest}
                onChange={(e) => setSongRequest(e.target.value)}
                className="px-4 py-3.5 rounded-2xl bg-[#0a0b0e] border border-[#232633] text-base text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 flex-1"
              />
              <button
                type="submit"
                className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/20 cursor-pointer transition-all hover:scale-105 whitespace-nowrap"
              >
                <Send className="w-4 h-4 fill-black" />
                <span>Enviar no Ar</span>
              </button>
            </form>
          </div>
        </div>

        {/* GRADE PRINCIPAL DE INFORMAÇÕES DA RÁDIO */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* COLUNA 1: SOBRE A RÁDIO */}
          <div className="space-y-4">
            <SecretTrigger holdTimeMs={5000} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-black font-black shadow-lg shadow-amber-500/20">
                <Radio className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">{settings.radio.name}</h3>
                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">{settings.radio.slogan}</p>
              </div>
            </SecretTrigger>

            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              Transmitindo a melhor programação musical, notícias locais, promoções exclusivas e muita energia para milhares de ouvintes diariamente.
            </p>

            <div className="pt-2 flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-emerald-400">Transmissão HD Ao Vivo Ativa</span>
            </div>
          </div>

          {/* COLUNA 2: ENDEREÇO E ESTÚDIO */}
          <div className="space-y-4">
            <h4 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#232633] pb-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              Estúdio & Endereço
            </h4>

            <ul className="space-y-3 text-sm text-slate-200 font-medium">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white block font-bold text-sm">Estúdios Principais:</strong>
                  {settings.contacts.address}
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white block font-bold text-sm">Atendimento Comercial:</strong>
                  {settings.contacts.businessHours}
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <Headphones className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white block font-bold text-sm">Transmissão:</strong>
                  24 Horas no Ar / 7 dias por semana
                </span>
              </li>
            </ul>
          </div>

          {/* COLUNA 3: CONTATOS OFICIAIS */}
          <div className="space-y-4">
            <h4 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#232633] pb-2">
              <Phone className="w-5 h-5 text-amber-400" />
              Contatos & Atendimento
            </h4>

            <ul className="space-y-3 text-sm text-slate-200">
              <li>
                <a 
                  href={`https://api.whatsapp.com/send?phone=${settings.contacts.whatsappNumberClean || '5551989488590'}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-[#12141a] hover:bg-emerald-500/10 border border-[#232633] hover:border-emerald-500/40 text-slate-200 hover:text-emerald-400 transition-all group"
                >
                  <MessageCircle className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                  <div>
                    <span className="block font-bold text-white text-xs sm:text-sm">WhatsApp do Ouvinte</span>
                    <span className="font-semibold text-sm">{settings.contacts.whatsappOuvinte}</span>
                  </div>
                </a>
              </li>

              <li>
                <a 
                  href={`tel:${settings.contacts.phoneComercial}`} 
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-[#12141a] hover:bg-amber-500/10 border border-[#232633] hover:border-amber-500/40 text-slate-200 hover:text-amber-400 transition-all group"
                >
                  <Phone className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                  <div>
                    <span className="block font-bold text-white text-xs sm:text-sm">Telefone Comercial / Anúncios</span>
                    <span className="font-semibold text-sm">{settings.contacts.phoneComercial}</span>
                  </div>
                </a>
              </li>

              <li>
                <a 
                  href={`mailto:${settings.contacts.emailOfficial}`} 
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-[#12141a] hover:bg-sky-500/10 border border-[#232633] hover:border-sky-500/40 text-slate-200 hover:text-sky-400 transition-all group"
                >
                  <Mail className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform shrink-0" />
                  <div>
                    <span className="block font-bold text-white text-xs sm:text-sm">E-mail Oficial</span>
                    <span className="truncate font-semibold text-sm block">{settings.contacts.emailOfficial}</span>
                  </div>
                </a>
              </li>
            </ul>
          </div>

          {/* COLUNA 4: REDES SOCIAIS */}
          <div className="space-y-4">
            <h4 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#232633] pb-2">
              <Globe className="w-5 h-5 text-amber-400" />
              Redes Sociais
            </h4>

            <p className="text-sm text-slate-200 font-medium">
              Siga a {settings.radio.name} nas redes sociais e acompanhe os bastidores do estúdio em tempo real:
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={settings.social.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-[#12141a] hover:bg-rose-500/20 border border-[#232633] hover:border-rose-500/50 text-slate-200 hover:text-rose-400 font-bold text-sm flex items-center gap-2 transition-all"
              >
                <InstagramIcon className="w-4 h-4 text-rose-400" />
                <span>Instagram</span>
              </a>

              <a
                href={settings.social.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-[#12141a] hover:bg-blue-600/20 border border-[#232633] hover:border-blue-500/50 text-slate-200 hover:text-blue-400 font-bold text-sm flex items-center gap-2 transition-all"
              >
                <FacebookIcon className="w-4 h-4 text-blue-400" />
                <span>Facebook</span>
              </a>

              <a
                href={settings.social.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-[#12141a] hover:bg-red-600/20 border border-[#232633] hover:border-red-500/50 text-slate-200 hover:text-red-400 font-bold text-sm flex items-center gap-2 transition-all"
              >
                <YoutubeIcon className="w-4 h-4 text-red-500" />
                <span>YouTube</span>
              </a>

              <a
                href={`https://api.whatsapp.com/send?phone=${settings.contacts.whatsappNumberClean || '5551989488590'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-[#12141a] hover:bg-emerald-500/20 border border-[#232633] hover:border-emerald-500/50 text-slate-200 hover:text-emerald-400 font-bold text-sm flex items-center gap-2 transition-all"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp</span>
              </a>
            </div>

            <div className="pt-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">COMO OUVIR:</span>
              <p className="text-sm text-slate-300 font-medium">
                Acesse pelo nosso site oficial ou procure no seu reprodutor por "{settings.radio.name}".
              </p>
            </div>
          </div>

        </div>

        {/* RODAPÉ INFERIOR / COPYRIGHT */}
        <div className="pt-8 border-t border-[#232633] flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-300 font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span>© {new Date().getFullYear()} {settings.radio.name}. Todos os direitos reservados.</span>
          </div>

          <div className="flex items-center gap-4 text-xs sm:text-sm font-bold">
            <a href="#termos" className="hover:text-amber-400 transition-colors">Termos de Uso</a>
            <span>•</span>
            <a href="#privacidade" className="hover:text-amber-400 transition-colors">Política de Privacidade</a>
            <span>•</span>
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              Desenvolvido com <Heart className="w-4 h-4 text-rose-500 fill-rose-500 inline" /> para os ouvintes
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
