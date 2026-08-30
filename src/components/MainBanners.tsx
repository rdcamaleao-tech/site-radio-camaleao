import React from 'react';
import { useRadio } from '../context/RadioContext';

const defaultBannerImg = 'https://scontent.fpoa27-1.fna.fbcdn.net/v/t39.30808-6/787761292_1053892700730747_2791346406042096703_n.jpg?stp=dst-jpg_tt6&cstp=mx1900x905&ctp=s1900x905&_nc_cat=100&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeEwj4LTtetRbgl91QrXcsFj_TawH9aGbWT9NrAf1oZtZMVrJ-Eu04rsptONd6S5cA2hMcScUxEO3X_E20jePQhx&_nc_ohc=9o_wGWyb5TQQ7kNvwHhpjKM&_nc_oc=AdqX2EM7SOVX0Mcucz3-8Y88ZDp5tlP0dqzgreGEPg06jfQcnthhTS4gGD58Ndyr_TIPZ-G4ci40mvpT7msJP35J&_nc_zt=23&_nc_ht=scontent.fpoa27-1.fna&_nc_gid=aWvpeqOu69K6Ggx5wVyHdA&_nc_ss=7b2a8&oh=00_AQK88c1102i8JsBVDVmEvyM3XA-AYENijd1JCpPcgM2b4g&oe=6A97F482';
const defaultStripBannerImg = 'https://scontent.fpoa27-1.fna.fbcdn.net/v/t39.30808-6/786779086_1053893097397374_6972132793688185098_n.jpg?stp=dst-jpg_tt6&cstp=mx2160x403&ctp=s2160x403&_nc_cat=109&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeEXnGK9aYgoK1n4hTmAi4THKrwSJjNo7HwqvBImM2jsfHoJhZWkcCQy-5bRfnYu0Bu92I_SAudQHE-9Y3dbxXt2&_nc_ohc=miwZ_AWl_V0Q7kNvwFAmLQR&_nc_oc=AdoJTU4lOwwfElXVt1sjzlBaF0U8C9_P0C0d8SiTgCwIVK8gOR55mrWhX0L1ph0JjLhkY3IFiWOjeoYRfyoCJzyc&_nc_zt=23&_nc_ht=scontent.fpoa27-1.fna&_nc_gid=wZ1zCf3QtfwAGVRqBUoHXg&_nc_ss=7b2a8&oh=00_AQKF7PhuPEM9rEZOdt9GN-bfjHjVecTOy90yGEIazpwA3w&oe=6A97E379';

export const MainBanners: React.FC = () => {
  const { settings } = useRadio();

  const banner1Url = settings.images?.mainBannerUrl || defaultBannerImg;
  const banner2Url = settings.images?.stripBannerUrl || defaultStripBannerImg;

  return (
    <div className="w-full max-w-[1900px] flex flex-col gap-6">
      {/* BANNER 1 (1900x900) */}
      <div className="w-full overflow-hidden rounded-2xl border border-[#232633] shadow-[0_15px_40px_rgba(0,0,0,0.8)] relative bg-[#12141a]">
        <div className="relative w-full aspect-[1900/900] max-h-[900px] overflow-hidden">
          <img
            src={banner1Url}
            alt={`${settings.radio.name} Banner Principal`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center transition-all duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
        </div>
      </div>

      {/* BANNER 2 (2160x403 / 1900x350) */}
      <div className="w-full overflow-hidden rounded-2xl border border-[#232633] shadow-[0_10px_30px_rgba(0,0,0,0.7)] relative bg-[#12141a]">
        <div className="relative w-full aspect-[2160/403] max-h-[400px] overflow-hidden">
          <img
            src={banner2Url}
            alt={`${settings.radio.name} Banner Secundário`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
          />
        </div>
      </div>
    </div>
  );
};
