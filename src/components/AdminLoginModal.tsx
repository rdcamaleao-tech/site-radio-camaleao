import React, { useState } from 'react';
import { useRadio } from '../context/RadioContext';
import { Lock, User, KeyRound, X, AlertCircle, ShieldCheck } from 'lucide-react';

export const AdminLoginModal: React.FC = () => {
  const { 
    isAdminLoginOpen, 
    setIsAdminLoginOpen, 
    setIsAdminDashboardOpen, 
    setIsAuthenticated 
  } = useRadio();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isAdminLoginOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Credenciais: login "rdcamaleao", senha "@camaleao2026"
    if (username.trim() === 'rdcamaleao' && password === '@camaleao2026') {
      setIsAuthenticated(true);
      setIsAdminLoginOpen(false);
      setIsAdminDashboardOpen(true);
      setUsername('');
      setPassword('');
    } else {
      setError('Credenciais incorretas. Verifique o usuário e a senha.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#12141a] border border-[#232633] rounded-3xl shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="p-6 border-b border-[#232633] flex items-center justify-between bg-[#0d0e12]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Painel Administrativo</h3>
              <p className="text-xs text-slate-400">Acesso restrito da Rádio Camaleão</p>
            </div>
          </div>
          <button
            onClick={() => setIsAdminLoginOpen(false)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              Usuário / Login
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Digite seu usuário..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              Senha
            </label>
            <input
              type="password"
              required
              placeholder="Digite sua senha..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#0a0b0e] border border-[#232633] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all hover:scale-[1.02]"
            >
              <Lock className="w-4 h-4" />
              <span>Acessar Painel ADM</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
