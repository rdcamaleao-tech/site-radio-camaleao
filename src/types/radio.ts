export interface SiteSettings {
  radio: {
    name: string;
    slogan: string;
    frequency: string;
    audioStreamUrl: string;
    audioQuality: string;
    audioServer: string;
    genre: string;
    currentProgram: string;
    currentArtist: string;
  };
  contacts: {
    address: string;
    phoneComercial: string;
    whatsappOuvinte: string;
    whatsappNumberClean: string;
    emailOfficial: string;
    businessHours: string;
  };
  social: {
    instagramUrl: string;
    facebookUrl: string;
    youtubeUrl: string;
  };
  images: {
    mainBannerUrl: string;
    stripBannerUrl: string;
  };
  appearance: {
    bgType: 'color' | 'image';
    bgColor: string;
    bgImageUrl: string;
    bgOverlayOpacity: number;
  };
}

export interface SlideItem {
  id: string;
  url: string;
  title?: string;
  caption?: string;
}

export interface RadioProgram {
  id: string;
  title: string;
  locutor: string;
  horario: string;
  dias?: string;
  imageUrl: string;
  isLive?: boolean;
}

export interface AdvertiserItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  targetUrl?: string;
  tag?: string;
}
