import { RadioProvider, useRadio } from './context/RadioContext';
import { CamaleaoPlayer } from './components/CamaleaoPlayer';
import { MainBanners } from './components/MainBanners';
import { BannerSlider } from './components/BannerSlider';
import { ProgramsGrid } from './components/ProgramsGrid';
import { AdvertisersGrid } from './components/AdvertisersGrid';
import { RadioFooter } from './components/RadioFooter';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';

function RadioAppContent() {
  const { settings } = useRadio();

  const isImageBg = settings.appearance?.bgType === 'image' && !!settings.appearance?.bgImageUrl;
  const bgColor = settings.appearance?.bgColor || '#0a0b0e';
  const overlayOpacity = (settings.appearance?.bgOverlayOpacity ?? 40) / 100;

  return (
    <div 
      className="min-h-screen text-slate-100 flex flex-col items-center justify-between relative selection:bg-[#ff5700] selection:text-white transition-colors duration-500"
      style={{ backgroundColor: bgColor }}
    >
      {/* BACKGROUND IMAGE & OVERLAY */}
      {isImageBg && (
        <>
          <div 
            className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-all duration-700 z-0"
            style={{ backgroundImage: `url("${settings.appearance.bgImageUrl}")` }}
          />
          <div 
            className="fixed inset-0 bg-black pointer-events-none transition-opacity duration-500 z-0"
            style={{ opacity: overlayOpacity }}
          />
        </>
      )}

      {/* AMBIENT GLOW BACKDROP */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#ff5700]/10 via-[#ff5700]/5 to-transparent blur-3xl pointer-events-none z-0" />

      {/* MAIN CONTAINER */}
      <div className="w-full max-w-[1900px] mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6 flex flex-col gap-6 relative z-10 flex-1">
        {/* PLAYER AO VIVO FIXO / TOPO */}
        <CamaleaoPlayer />

        {/* BANNERS PRINCIPAIS (1900x900 e 1900x300) */}
        <MainBanners />

        {/* CARROSSEL SLIDER DINÂMICO */}
        <BannerSlider />

        {/* GRADE DE PROGRAMAÇÃO DA RÁDIO (COM VERIFICAÇÃO AUTOMÁTICA AO VIVO) */}
        <ProgramsGrid />

        {/* SEÇÃO DE ANUNCIANTES & FORMULÁRIO DE PROPOSTA */}
        <AdvertisersGrid />
      </div>

      {/* RODAPÉ COMPLETO COM INFORMAÇÕES, CONTATOS & GATILHO SECRETO */}
      <div className="w-full relative z-10">
        <RadioFooter />
      </div>

      {/* MODAIS ADMINISTRATIVOS */}
      <AdminLoginModal />
      <AdminDashboardModal />
    </div>
  );
}

export default function App() {
  return (
    <RadioProvider>
      <RadioAppContent />
    </RadioProvider>
  );
}
