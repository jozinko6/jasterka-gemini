import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Lock, ArrowRight, Loader2, Eye, EyeOff, X } from 'lucide-react';

export default function AdminLogin({ onLogin, onBack }: { onLogin: (pass: string) => Promise<boolean>, onBack: () => void }) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);
    
    // Tiny delay to make UI feel solid
    setTimeout(async () => {
      const success = await onLogin(password.trim());
      if (!success) {
        setError(true);
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gastro-cream flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gastro-olive/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gastro-orange/5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-[50px] p-12 border border-gastro-beige/20 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-12">
          <motion.div 
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="w-20 h-20 bg-gastro-dark-green rounded-[30px] flex items-center justify-center mb-8 shadow-2xl shadow-gastro-dark-green/30"
          >
            <ShieldCheck className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-gastro-dark-green mb-3">
            Admin Prístup<span className="text-gastro-orange">.</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gastro-ink/30">Vstup do systému Jašterka</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gastro-ink/40 ml-6">Prístupové Heslo</label>
            <div className="relative group">
              <Lock className={`absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${error ? 'text-red-400' : 'text-gastro-ink/20 group-focus-within:text-gastro-dark-green'}`} />
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Vložte heslo..."
                autoFocus
                className={`w-full bg-white border-2 ${error ? 'border-red-100 bg-red-50/30' : 'border-gastro-beige/30 focus:border-gastro-dark-green'} rounded-[24px] pl-16 pr-14 py-5 outline-none transition-all font-bold text-lg text-gastro-dark-green shadow-sm`}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-gastro-ink/20 hover:text-gastro-dark-green transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3"
              >
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shrink-0">
                  <X className="w-3 h-3 text-white" />
                </div>
                <p className="text-[10px] text-red-600 font-black uppercase tracking-widest leading-none">
                  Heslo nie je správne.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <button 
              disabled={isLoading}
              className="w-full bg-gastro-dark-green text-white py-5 rounded-full font-black text-xs uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 shadow-xl shadow-gastro-dark-green/20 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Prihlásiť sa'}
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>

            <button 
              type="button"
              onClick={onBack}
              className="w-full py-2 text-[10px] font-black text-gastro-ink/30 uppercase tracking-[0.3em] hover:text-gastro-dark-green transition-colors"
            >
              Návrat na stránku
            </button>
          </div>
        </form>
      </motion.div>

      {/* Footer Info */}
      <div className="absolute bottom-8 left-0 right-0 text-center opacity-20">
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Jasterka Admin v-1.5.0</p>
      </div>
    </div>
  );
}
