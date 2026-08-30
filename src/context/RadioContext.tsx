import React, { createContext, useContext, useState, useEffect } from 'react';
import { SiteSettings } from '../types/radio';
import { supabaseService, safeSetLocalStorage } from '../services/supabaseService';

const defaultBannerImg = 'https://scontent.fpoa27-1.fna.fbcdn.net/v/t39.30808-6/787761292_1053892700730747_2791346406042096703_n.jpg?stp=dst-jpg_tt6&cstp=mx1900x905&ctp=s1900x905&_nc_cat=100&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeEwj4LTtetRbgl91QrXcsFj_TawH9aGbWT9NrAf1oZtZMVrJ-Eu04rsptONd6S5cA2hMcScUxEO3X_E20jePQhx&_nc_ohc=9o_wGWyb5TQQ7kNvwHhpjKM&_nc_oc=AdqX2EM7SOVX0Mcucz3-8Y88ZDp5tlP0dqzgreGEPg06jfQcnthhTS4gGD58Ndyr_TIPZ-G4ci40mvpT7msJP35J&_nc_zt=23&_nc_ht=scontent.fpoa27-1.fna&_nc_gid=aWvpeqOu69K6Ggx5wVyHdA&_nc_ss=7b2a8&oh=00_AQK88c1102i8JsBVDVmEvyM3XA-AYENijd1JCpPcgM2b4g&oe=6A97F482';
const defaultStripBannerImg = 'https://scontent.fpoa27-1.fna.fbcdn.net/v/t39.30808-6/786779086_1053893097397374_6972132793688185098_n.jpg?stp=dst-jpg_tt6&cstp=mx2160x403&ctp=s2160x403&_nc_cat=109&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeEXnGK9aYgoK1n4hTmAi4THKrwSJjNo7HwqvBImM2jsfHoJhZWkcCQy-5bRfnYu0Bu92I_SAudQHE-9Y3dbxXt2&_nc_ohc=miwZ_AWl_V0Q7kNvwFAmLQR&_nc_oc=AdoJTU4lOwwfElXVt1sjzlBaF0U8C9_P0C0d8SiTgCwIVK8gOR55mrWhX0L1ph0JjLhkY3IFiWOjeoYRfyoCJzyc&_nc_zt=23&_nc_ht=scontent.fpoa27-1.fna&_nc_gid=wZ1zCf3QtfwAGVRqBUoHXg&_nc_ss=7b2a8&oh=00_AQKF7PhuPEM9rEZOdt9GN-bfjHjVecTOy90yGEIazpwA3w&oe=6A97E379';

const DEFAULT_SETTINGS: SiteSettings = {
  radio: {
    name: 'RÁDIO CAMALEÃO',
    slogan: 'A Sua Melhor Companhia 24H',
    frequency: '98.5 FM',
    audioStreamUrl: 'https://stm18.voxhd.com.br:12892/;',
    audioQuality: '128 KBPS Stereo',
    audioServer: 'VoxHD Live Server',
    genre: 'Eclético / MPB / Pop / Brasil',
    currentProgram: 'Camaleão Groove (Ao Vivo)',
    currentArtist: 'Camaleão Sound System',
  },
  contacts: {
    address: 'João Antonio da Silveira 2003, Restinga - Porto Alegre - RS',
    phoneComercial: '(51) 98948-8590',
    whatsappOuvinte: '(51) 98948-8590',
    whatsappNumberClean: '5551989488590',
    emailOfficial: 'ayrtoncamaleao@gmail.com',
    businessHours: '24 Horas no Ar • Seg a Dom',
  },
  social: {
    instagramUrl: 'https://www.instagram.com/radio.camaleao/',
    facebookUrl: 'https://www.facebook.com/radio.camaleao',
    youtubeUrl: 'https://www.youtube.com/@radiocamaleao1038',
  },
  images: {
    mainBannerUrl: defaultBannerImg,
    stripBannerUrl: defaultStripBannerImg,
  },
  appearance: {
    bgType: 'color',
    bgColor: '#0a0b0e',
    bgImageUrl: '',
    bgOverlayOpacity: 40,
  },
};

const STORAGE_KEY = 'camaleao_site_global_settings_v2';

function sanitizeSettings(input: Partial<SiteSettings>): SiteSettings {
  const contacts = { ...DEFAULT_SETTINGS.contacts, ...(input.contacts || {}) };
  if (!contacts.emailOfficial || contacts.emailOfficial.includes('contato@radiocamaleao.com.br')) {
    contacts.emailOfficial = DEFAULT_SETTINGS.contacts.emailOfficial;
  }
  if (!contacts.address || contacts.address.includes('Paulista') || contacts.address.includes('Bela Vista')) {
    contacts.address = DEFAULT_SETTINGS.contacts.address;
  }
  if (!contacts.phoneComercial || contacts.phoneComercial.includes('(11) 3333')) {
    contacts.phoneComercial = DEFAULT_SETTINGS.contacts.phoneComercial;
  }
  if (!contacts.whatsappOuvinte || contacts.whatsappOuvinte.includes('(11) 9999')) {
    contacts.whatsappOuvinte = DEFAULT_SETTINGS.contacts.whatsappOuvinte;
  }
  if (!contacts.whatsappNumberClean || contacts.whatsappNumberClean === '5511999998888') {
    contacts.whatsappNumberClean = DEFAULT_SETTINGS.contacts.whatsappNumberClean;
  }

  const social = { ...DEFAULT_SETTINGS.social, ...(input.social || {}) };
  if (!social.instagramUrl || !social.instagramUrl.includes('radio.camaleao')) {
    social.instagramUrl = DEFAULT_SETTINGS.social.instagramUrl;
  }
  if (!social.facebookUrl || !social.facebookUrl.includes('radio.camaleao')) {
    social.facebookUrl = DEFAULT_SETTINGS.social.facebookUrl;
  }
  if (!social.youtubeUrl || !social.youtubeUrl.includes('radiocamaleao1038')) {
    social.youtubeUrl = DEFAULT_SETTINGS.social.youtubeUrl;
  }

  const appearance = {
    bgType: (input.appearance?.bgType === 'image' ? 'image' : 'color') as 'color' | 'image',
    bgColor: input.appearance?.bgColor || DEFAULT_SETTINGS.appearance.bgColor,
    bgImageUrl: input.appearance?.bgImageUrl ?? DEFAULT_SETTINGS.appearance.bgImageUrl,
    bgOverlayOpacity: typeof input.appearance?.bgOverlayOpacity === 'number' ? input.appearance.bgOverlayOpacity : DEFAULT_SETTINGS.appearance.bgOverlayOpacity,
  };

  const images = { ...DEFAULT_SETTINGS.images, ...(input.images || {}) };
  if (!images.mainBannerUrl || images.mainBannerUrl.includes('photo-1514525253161-7a46d19cd819')) {
    images.mainBannerUrl = DEFAULT_SETTINGS.images.mainBannerUrl;
  }
  if (!images.stripBannerUrl || images.stripBannerUrl.includes('photo-1598488035139-bdbb2231ce04')) {
    images.stripBannerUrl = DEFAULT_SETTINGS.images.stripBannerUrl;
  }

  return {
    ...DEFAULT_SETTINGS,
    ...input,
    radio: { ...DEFAULT_SETTINGS.radio, ...(input.radio || {}) },
    contacts,
    social,
    images,
    appearance,
  };
}

interface RadioContextType {
  settings: SiteSettings;
  updateSettings: (newSettings: SiteSettings) => void;
  resetSettings: () => void;
  isAdminLoginOpen: boolean;
  setIsAdminLoginOpen: (open: boolean) => void;
  isAdminDashboardOpen: boolean;
  setIsAdminDashboardOpen: (open: boolean) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  triggerSecretLogin: () => void;
}

const RadioContext = createContext<RadioContextType | undefined>(undefined);

export const RadioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          return sanitizeSettings(parsed);
        }
      }
    } catch (e) {
      console.error('Erro ao ler configurações do localStorage:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Tenta carregar as configurações do Supabase ao iniciar
  useEffect(() => {
    let isMounted = true;
    async function loadSupabaseSettings() {
      const dbSettings = await supabaseService.fetchSettings();
      if (dbSettings && isMounted) {
        const sanitized = sanitizeSettings(dbSettings);
        setSettings(sanitized);
        supabaseService.saveSettings(sanitized);
      } else if (!dbSettings && isMounted) {
        supabaseService.saveSettings(DEFAULT_SETTINGS);
      }
    }
    loadSupabaseSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      safeSetLocalStorage(STORAGE_KEY, settings);
    } catch (e) {
      console.warn('Erro ao salvar configurações globais:', e);
    }
  }, [settings]);

  const updateSettings = (newSettings: SiteSettings) => {
    setSettings(newSettings);
    supabaseService.saveSettings(newSettings);
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    supabaseService.saveSettings(DEFAULT_SETTINGS);
  };

  const triggerSecretLogin = () => {
    if (isAuthenticated) {
      setIsAdminDashboardOpen(true);
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  return (
    <RadioContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        isAdminLoginOpen,
        setIsAdminLoginOpen,
        isAdminDashboardOpen,
        setIsAdminDashboardOpen,
        isAuthenticated,
        setIsAuthenticated,
        triggerSecretLogin,
      }}
    >
      {children}
    </RadioContext.Provider>
  );
};

export const useRadio = () => {
  const context = useContext(RadioContext);
  if (!context) {
    throw new Error('useRadio precisa ser usado dentro de um RadioProvider');
  }
  return context;
};
