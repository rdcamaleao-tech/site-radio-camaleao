import React, { useState } from 'react';
import { supabaseService } from '../services/supabaseService';
import { 
  Megaphone, 
  ExternalLink, 
  X, 
  Building2,
  Award,
  Mail,
  Send,
  CheckCircle2,
  Phone,
  User,
  MessageSquare,
  Copy,
  Sparkles
} from 'lucide-react';

const advImg1 = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&h=600&q=80';
const advImg2 = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&h=600&q=80';
const advImg3 = 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&h=600&q=80';

export interface AdvertiserItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  targetUrl?: string;
  tag?: string;
}

export const DEFAULT_ADVERTISERS: AdvertiserItem[] = [
  {
    id: 'adv-1',
    title: 'Tech Extreme Computers',
    subtitle: 'Hardware, Notebooks & Setup Gamer',
    imageUrl: advImg1,
    targetUrl: 'https://whatsapp.com',
    tag: 'Patrocinador Master',
  },
  {
    id: 'adv-2',
    title: 'Arena Fitness Gym',
    subtitle: 'A melhor estrutura e treinos da cidade',
    imageUrl: advImg2,
    targetUrl: 'https://whatsapp.com',
    tag: 'Parceiro Oficial',
  },
  {
    id: 'adv-3',
    title: 'Burger Master & Craft Beer',
    subtitle: 'Hambúrgueres artesanais e chopp trincando',
    imageUrl: advImg3,
    targetUrl: 'https://whatsapp.com',
    tag: 'Anunciante Destaque',
  },
];

const PRODUCTION_EMAIL = 'ayrtoncamaleao@gmail.com';
const STORAGE_KEY = 'camaleao_advertisers_v1';

export const AdvertisersGrid: React.FC = () => {
  const [advertisers, setAdvertisers] = useState<AdvertiserItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Erro ao ler anunciantes do localStorage:', e);
    }
    return DEFAULT_ADVERTISERS;
  });

  React.useEffect(() => {
    let isMounted = true;
    async function loadSupabaseAdvertisers() {
      const dbAdvertisers = await supabaseService.fetchAdvertisers();
      if (dbAdvertisers !== null && isMounted) {
        setAdvertisers(dbAdvertisers);
      }
    }
    loadSupabaseAdvertisers();
    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setAdvertisers(parsed);
          }
        }
      } catch (e) {
        console.error('Erro ao atualizar anunciantes:', e);
      }
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('camaleao_advertisers_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('camaleao_advertisers_updated', handleUpdate);
    };
  }, []);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formCompany, setFormCompany] = useState('');
  const [formContactName, setFormContactName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formType, setFormType] = useState('Banner Web & Mídia no Ar');
  const [formMessage, setFormMessage] = useState('');
  
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [mailtoUrl, setMailtoUrl] = useState('');
  const [gmailUrl, setGmailUrl] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');

  const handleOpenForm = () => {
    setFormCompany('');
    setFormContactName('');
    setFormPhone('');
    setFormEmail('');
    setFormType('Banner Web & Mídia no Ar');
    setFormMessage('');
    setFormSubmitted(false);
    setCopiedSuccess(false);
    setIsFormOpen(true);
  };

  const generateMailBody = () => {
    return (
      `PROPOSTA DE ANÚNCIO - RÁDIO CAMALEÃO\n\n` +
      `Empresa/Marca: ${formCompany}\n` +
      `Responsável/Contato: ${formContactName}\n` +
      `Telefone/WhatsApp: ${formPhone}\n` +
      `E-mail: ${formEmail}\n` +
      `Formato de Interesse: ${formType}\n\n` +
      `Detalhes / Proposta:\n${formMessage || 'Gostaria de receber a tabela de valores e opções de divulgação na Rádio Camaleão.'}\n\n` +
      `Enviado através do site da Rádio Camaleão`
    );
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    const subjectText = `Proposta de Anúncio - ${formCompany || 'Nova Marca'}`;
    const bodyText = generateMailBody();

    const subjectEncoded = encodeURIComponent(subjectText);
    const bodyEncoded = encodeURIComponent(bodyText);

    const mailto = `mailto:${PRODUCTION_EMAIL}?subject=${subjectEncoded}&body=${bodyEncoded}`;
    const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${PRODUCTION_EMAIL}&su=${subjectEncoded}&body=${bodyEncoded}`;
    const whatsapp = `https://api.whatsapp.com/send?phone=5551989488590&text=${encodeURIComponent(`*FICHA DE ANÚNCIO - RÁDIO CAMALEÃO*\n\nE-mail de Destino: ${PRODUCTION_EMAIL}\n\n` + bodyText)}`;

    setMailtoUrl(mailto);
    setGmailUrl(gmail);
    setWhatsappUrl(whatsapp);
    setFormSubmitted(true);

    window.location.href = mailto;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateMailBody());
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  return (
    <section className="w-full max-w-[1900px] my-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 px-2 sm:px-0">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              NOSSOS ANUNCIANTES
              <span className="text-xs sm:text-sm px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black">
                {advertisers.length} PARCEIROS
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-300 font-medium">
              Marcas e patrocinadores oficiais da Rádio Camaleão
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenForm}
          className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm flex items-center gap-2.5 transition-all cursor-pointer shadow-lg shadow-amber-500/20 hover:scale-105"
        >
          <Sparkles className="w-5 h-5 fill-black" />
          <span>Anuncie na Rádio</span>
        </button>
      </div>

      {/* GRADE EM 3 COLUNAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {advertisers.length > 0 && advertisers.map((adv) => {
          const ContentWrapper = adv.targetUrl ? 'a' : 'div';
          const linkProps = adv.targetUrl
            ? {
                href: adv.targetUrl,
                target: '_blank',
                rel: 'noopener noreferrer',
              }
            : {};

          return (
            <div
              key={adv.id}
              className="group relative rounded-2xl border border-[#232633] hover:border-amber-500/60 bg-[#12141a] overflow-hidden transition-all duration-300 flex flex-col shadow-lg"
            >
              <ContentWrapper {...linkProps} className="relative w-full aspect-[4/3] overflow-hidden bg-black/40 block cursor-pointer">
                <img
                  src={adv.imageUrl}
                  alt={adv.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                />

                {adv.tag && (
                  <div className="absolute top-3 left-3 bg-amber-500 text-black font-black text-xs uppercase px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-md tracking-wider">
                    <Award className="w-3.5 h-3.5" />
                    <span>{adv.tag}</span>
                  </div>
                )}

                {adv.targetUrl && (
                  <div className="absolute top-3 right-3 p-2.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-amber-400 opacity-80 group-hover:opacity-100 transition-all shadow-md">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                )}
              </ContentWrapper>

              <div className="p-5 flex-1 flex flex-col justify-between gap-3 min-h-[120px]">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                    {adv.title}
                  </h3>
                  <p className="text-sm text-slate-300 font-medium mt-1.5 line-clamp-2 h-10 leading-snug">
                    {adv.subtitle || 'Parceiro oficial da Rádio Camaleão'}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#232633]/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-amber-500" />
                    Anunciante Verificado
                  </span>

                  {adv.targetUrl && (
                    <a
                      href={adv.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm font-black text-amber-400 hover:text-amber-300 flex items-center gap-1.5 hover:underline"
                    >
                      <span>Visitar</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <button
          onClick={handleOpenForm}
          className="group rounded-2xl border border-dashed border-amber-500/50 hover:border-amber-400 bg-[#12141a]/80 hover:bg-[#12141a] transition-all duration-300 h-full min-h-[320px] flex flex-col items-center justify-center p-6 text-center cursor-pointer relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-all flex items-center justify-center mb-4 shadow-lg">
            <Megaphone className="w-8 h-8" />
          </div>

          <h4 className="text-lg sm:text-xl font-black text-white group-hover:text-amber-400 transition-colors mb-2">
            Anuncie Sua Marca Aqui
          </h4>

          <p className="text-sm text-slate-300 max-w-[280px] font-medium leading-relaxed mb-5">
            Divulgue sua empresa para milhares de ouvintes diários na Rádio Camaleão.
          </p>

          <span className="px-5 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black text-xs sm:text-sm flex items-center gap-2 group-hover:bg-amber-500 group-hover:text-black transition-all">
            <Mail className="w-4 h-4" />
            <span>Falar com a Produção</span>
          </span>
        </button>
      </div>

      {/* MODAL DE PROPOSTA DE ANÚNCIO / ENVIO DE EMAIL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#12141a] border border-[#232633] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-white">
            <div className="p-5 border-b border-[#232633] flex items-center justify-between bg-[#0d0e12]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    Anuncie na Rádio Camaleão
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ficha de contato enviada para a produção da rádio.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {!formSubmitted ? (
                <form onSubmit={handleSubmitForm} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-amber-400" />
                        Nome da Empresa *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Sua Marca / Empresa"
                        value={formCompany}
                        onChange={(e) => setFormCompany(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-amber-400" />
                        Nome de Contato *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Seu Nome"
                        value={formContactName}
                        onChange={(e) => setFormContactName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-amber-400" />
                        WhatsApp / Telefone *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="(00) 90000-0000"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-amber-400" />
                        Seu E-mail *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="contato@suaempresa.com"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Formato de Anúncio Desejado
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="Banner Web & Mídia no Ar">Banner Web no Site + Chamadas no Ar</option>
                      <option value="Banner Destaque no Site">Banner Destaque no Site (3 Colunas)</option>
                      <option value="Comercial Mídia Falada / Vinheta">Comercial de Voz / Vinheta da Rádio</option>
                      <option value="Patrocínio de Programa Específico">Patrocínio Master de Programa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                      Proposta ou Dúvidas
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Descreva brevemente o que sua empresa busca divulgar..."
                      value={formMessage}
                      onChange={(e) => setFormMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 bg-black/40 p-3 rounded-xl border border-white/5">
                    💡 Ao clicar abaixo, será aberta sua caixa de e-mail pré-preenchida com os dados para envio à equipe de produção da Rádio Camaleão.
                  </p>

                  <div className="pt-3 border-t border-[#232633] flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Gerar E-mail para Produção</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-4 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-white">Ficha de Anúncio Gerada!</h4>
                    <p className="text-xs text-slate-300 max-w-sm mx-auto mt-1 leading-relaxed">
                      Sua proposta para a empresa <strong className="text-amber-400">{formCompany}</strong> está pronta para envio à produção.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-bold flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Destino de envio: <strong className="text-white underline">{PRODUCTION_EMAIL}</strong></span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#0a0b0e] border border-[#232633] text-left text-xs font-mono text-slate-300 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-500 font-sans uppercase tracking-wider mb-2">
                      Resumo da Proposta:
                    </div>
                    <div><span className="text-slate-500">Empresa:</span> {formCompany}</div>
                    <div><span className="text-slate-500">Contato:</span> {formContactName} ({formPhone})</div>
                    <div><span className="text-slate-500">E-mail:</span> {formEmail}</div>
                    <div><span className="text-slate-500">Formato:</span> {formType}</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <a
                      href={mailtoUrl}
                      className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Abrir App de E-mail</span>
                    </a>

                    <a
                      href={gmailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                    >
                      <Send className="w-4 h-4" />
                      <span>Enviar via Gmail Web</span>
                    </a>

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3 px-4 rounded-xl bg-[#00d856] hover:bg-[#00c24d] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                    >
                      <MessageSquare className="w-4 h-4 fill-current" />
                      <span>Enviar no WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleCopyText}
                      className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 cursor-pointer transition-all"
                    >
                      <Copy className="w-4 h-4 text-amber-400" />
                      <span>{copiedSuccess ? 'Ficha Copiada!' : 'Copiar Ficha'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="text-xs text-slate-400 hover:text-white underline block mx-auto pt-2 cursor-pointer"
                  >
                    Fechar Janela
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
