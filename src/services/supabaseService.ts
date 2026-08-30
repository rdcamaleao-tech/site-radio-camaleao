import { supabase } from '../lib/supabase';
import { SiteSettings, SlideItem, RadioProgram, AdvertiserItem } from '../types/radio';

// Helper para garantir UUID válido para colunas UUID no Supabase PostgreSQL
export function ensureUuid(id?: string): string {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // ignore
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Helper para salvar no localStorage sem estourar quota do navegador (QuotaExceededError)
export function safeSetLocalStorage(key: string, data: any): boolean {
  try {
    const stringified = typeof data === 'string' ? data : JSON.stringify(data);
    localStorage.setItem(key, stringified);
    return true;
  } catch (e) {
    console.warn(`[safeSetLocalStorage] Quota do localStorage excedida para a chave "${key}". Continuaremos gravando no Supabase:`, e);
    return false;
  }
}

// Helper para comprimir imagem enviada por arquivo local antes de salvar no Supabase
export function compressImageFile(file: File, maxWidth = 1000, maxHeight = 600, quality = 0.65): Promise<string> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } else {
          resolve((e.target?.result as string) || '');
        }
      };
      img.onerror = () => {
        resolve((e.target?.result as string) || '');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const supabaseService = {
  // Sync Status Check
  async checkConnection(): Promise<boolean> {
    try {
      const { error } = await supabase.from('site_settings').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        console.warn('Supabase status check notice:', error.message);
      }
      return true;
    } catch (err) {
      console.warn('Supabase status check warning:', err);
      return false;
    }
  },

  // --- SITE SETTINGS ---
  async fetchSettings(): Promise<SiteSettings | null> {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('data')
        .eq('id', 'global')
        .single();

      if (data && data.data) {
        return data.data as SiteSettings;
      }
      if (error) {
        console.info('Supabase site_settings info:', error.message);
      }
    } catch (e) {
      console.warn('Erro ao carregar do Supabase:', e);
    }
    return null;
  },

  async saveSettings(settings: SiteSettings): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ id: 'global', data: settings, updated_at: new Date().toISOString() });

      if (error) {
        console.warn('Erro Supabase ao salvar settings:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Exceção ao salvar settings no Supabase:', e);
      return false;
    }
  },

  // --- SLIDES ---
  async fetchSlides(): Promise<SlideItem[] | null> {
    try {
      // 1. Tenta carregar da tabela site_settings (row id: 'banner_slides')
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('data')
        .eq('id', 'banner_slides')
        .maybeSingle();

      if (settingsData && settingsData.data && Array.isArray(settingsData.data) && settingsData.data.length > 0) {
        const clean = (settingsData.data as SlideItem[]).filter(item => item && item.url && !item.url.includes('unsplash.com'));
        if (clean.length > 0) return clean;
      }

      // 2. Tenta carregar da tabela dedicada 'banner_slides'
      const { data: tableData } = await supabase
        .from('banner_slides')
        .select('*');

      if (tableData && tableData.length > 0) {
        const sorted = [...tableData]
          .filter(item => item && item.url && !item.url.includes('unsplash.com'))
          .sort((a, b) => {
            if (typeof a.position === 'number' && typeof b.position === 'number') {
              return a.position - b.position;
            }
            return 0;
          });

        if (sorted.length > 0) {
          return sorted.map((item) => ({
            id: item.id,
            url: item.url,
            title: item.title || '',
            caption: item.caption || '',
          }));
        }
      }

      // 3. Fallback: localStorage
      try {
        const local = localStorage.getItem('camaleao_banner_slides_v1');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const clean = (parsed as SlideItem[]).filter(item => item && item.url && !item.url.includes('unsplash.com'));
            if (clean.length > 0) return clean;
          }
        }
      } catch (e) {
        // ignore
      }
    } catch (e) {
      console.warn('Erro ao carregar slides do Supabase:', e);
    }

    return null;
  },

  async saveSlides(slides: SlideItem[]): Promise<boolean> {
    let success = false;
    try {
      if (!slides || slides.length === 0) return true;

      const usedIds = new Set<string>();
      const sanitizedSlides = slides.map((s) => {
        let validId = ensureUuid(s.id);
        while (usedIds.has(validId)) {
          validId = ensureUuid();
        }
        usedIds.add(validId);
        return {
          ...s,
          id: validId,
        };
      });

      safeSetLocalStorage('camaleao_banner_slides_v1', sanitizedSlides);

      try {
        await supabase
          .from('site_settings')
          .upsert({ id: 'banner_slides', data: sanitizedSlides, updated_at: new Date().toISOString() });
        success = true;
      } catch (e) {
        console.warn('Exceção ao salvar slides em site_settings:', e);
      }

      try {
        const activeIds = Array.from(usedIds);
        if (activeIds.length > 0) {
          await supabase
            .from('banner_slides')
            .delete()
            .not('id', 'in', `(${activeIds.map(id => `"${id}"`).join(',')})`);
        }
      } catch (e) {
        console.warn('Aviso ao sincronizar exclusões na tabela banner_slides:', e);
      }

      let savedCount = 0;
      for (let i = 0; i < sanitizedSlides.length; i++) {
        const s = sanitizedSlides[i];
        const itemPayload = {
          id: s.id,
          url: s.url,
          title: s.title || '',
          caption: s.caption || '',
          position: i,
          updated_at: new Date().toISOString(),
        };

        const { error: singleErr } = await supabase.from('banner_slides').upsert(itemPayload);
        if (!singleErr) {
          savedCount++;
        } else {
          const { error: minErr } = await supabase.from('banner_slides').upsert({
            id: s.id,
            url: s.url,
            title: s.title || '',
            position: i
          });
          if (!minErr) savedCount++;
        }
      }

      if (savedCount > 0) {
        success = true;
      }

      return success || true;
    } catch (e) {
      console.error('Exceção geral ao salvar slides no Supabase:', e);
      return true;
    }
  },

  // --- PROGRAMAS ---
  async fetchPrograms(): Promise<RadioProgram[] | null> {
    try {
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('data')
        .eq('id', 'radio_programs')
        .maybeSingle();

      if (settingsData && settingsData.data && Array.isArray(settingsData.data)) {
        return settingsData.data as RadioProgram[];
      }

      const { data, error } = await supabase
        .from('radio_programs')
        .select('*');

      if (data && !error) {
        const sorted = [...data].sort((a, b) => {
          if (typeof a.position === 'number' && typeof b.position === 'number') {
            return a.position - b.position;
          }
          return 0;
        });

        return sorted.map((item) => ({
          id: item.id,
          title: item.title,
          locutor: item.locutor,
          horario: item.horario,
          dias: item.dias || 'Segunda a Sexta',
          imageUrl: item.image_url,
          isLive: item.is_live ?? false,
        }));
      }

      try {
        const local = localStorage.getItem('camaleao_radio_programs_v2');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) {
            return parsed as RadioProgram[];
          }
        }
      } catch (e) {
        // ignore
      }

      if (error) {
        console.info('Supabase programs info:', error.message);
      }
    } catch (e) {
      console.warn('Erro ao carregar programas do Supabase:', e);
    }
    return null;
  },

  async savePrograms(programs: RadioProgram[]): Promise<boolean> {
    try {
      const safeProgs = programs || [];

      await supabase
        .from('site_settings')
        .upsert({ id: 'radio_programs', data: safeProgs, updated_at: new Date().toISOString() });

      safeSetLocalStorage('camaleao_radio_programs_v2', safeProgs);

      const { error: deleteError } = await supabase
        .from('radio_programs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deleteError) {
        console.info('Aviso ao deletar programas antigos no Supabase:', deleteError.message);
      }

      if (safeProgs.length > 0) {
        const usedIds = new Set<string>();
        const payload = safeProgs.map((p, index) => {
          let validId = ensureUuid(p.id);
          while (usedIds.has(validId)) {
            validId = ensureUuid();
          }
          usedIds.add(validId);
          return {
            id: validId,
            title: p.title,
            locutor: p.locutor,
            horario: p.horario,
            dias: p.dias || 'Segunda a Sexta',
            image_url: p.imageUrl,
            is_live: p.isLive || false,
            position: index,
            updated_at: new Date().toISOString(),
          };
        });

        const { error: upsertError } = await supabase.from('radio_programs').upsert(payload);
        if (upsertError) {
          console.warn('Erro primário ao salvar programas no Supabase:', upsertError.message);
        }
      }
      return true;
    } catch (e) {
      console.error('Exceção ao salvar programas no Supabase:', e);
      return false;
    }
  },

  // --- ANUNCIANTES ---
  async fetchAdvertisers(): Promise<AdvertiserItem[] | null> {
    try {
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('data')
        .eq('id', 'advertisers')
        .maybeSingle();

      if (settingsData && settingsData.data && Array.isArray(settingsData.data)) {
        return settingsData.data as AdvertiserItem[];
      }

      const { data, error } = await supabase
        .from('advertisers')
        .select('*');

      if (data && !error) {
        const sorted = [...data].sort((a, b) => {
          if (typeof a.position === 'number' && typeof b.position === 'number') {
            return a.position - b.position;
          }
          return 0;
        });

        return sorted.map((item) => ({
          id: item.id,
          title: item.title,
          subtitle: item.subtitle,
          tag: item.tag,
          imageUrl: item.image_url,
          targetUrl: item.target_url,
        }));
      }

      try {
        const local = localStorage.getItem('camaleao_advertisers_v1');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) {
            return parsed as AdvertiserItem[];
          }
        }
      } catch (e) {
        // ignore
      }

      if (error) {
        console.info('Supabase advertisers info:', error.message);
      }
    } catch (e) {
      console.warn('Erro ao carregar anunciantes do Supabase:', e);
    }
    return null;
  },

  async saveAdvertisers(advertisers: AdvertiserItem[]): Promise<boolean> {
    try {
      const safeAdv = advertisers || [];

      await supabase
        .from('site_settings')
        .upsert({ id: 'advertisers', data: safeAdv, updated_at: new Date().toISOString() });

      safeSetLocalStorage('camaleao_advertisers_v1', safeAdv);

      const { error: deleteError } = await supabase
        .from('advertisers')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (deleteError) {
        console.info('Aviso ao deletar anunciantes antigos no Supabase:', deleteError.message);
      }

      if (safeAdv.length > 0) {
        const usedIds = new Set<string>();
        const payload = safeAdv.map((a, index) => {
          let validId = ensureUuid(a.id);
          while (usedIds.has(validId)) {
            validId = ensureUuid();
          }
          usedIds.add(validId);
          return {
            id: validId,
            title: a.title,
            subtitle: a.subtitle || '',
            tag: a.tag || '',
            image_url: a.imageUrl,
            target_url: a.targetUrl || '',
            position: index,
            updated_at: new Date().toISOString(),
          };
        });

        const { error: upsertError } = await supabase.from('advertisers').upsert(payload);
        if (upsertError) {
          console.warn('Erro primário ao salvar anunciantes no Supabase:', upsertError.message);
        }
      }
      return true;
    } catch (e) {
      console.error('Exceção ao salvar anunciantes no Supabase:', e);
      return false;
    }
  },
};
