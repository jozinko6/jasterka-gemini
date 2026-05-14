import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Loader2, Calendar } from 'lucide-react';

export default function DailyMenuEditor() {
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/daily-menu');
      if (res.ok) {
        const data = await res.json();
        if (data && data.content) {
          setContent(data.content);
          if (data.date) setDate(new Date(data.date).toISOString().split('T')[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load daily menu:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/daily-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, date }),
      });
      if (res.ok) {
        alert('Denné menu bolo uložené');
      }
    } catch (err) {
      console.error('Failed to save daily menu:', err);
      alert('Chyba pri ukladaní');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-gastro-dark-green" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-gastro-dark-green">Denné Menu</h2>
          <p className="text-[10px] text-gastro-ink/40 uppercase font-black tracking-widest mt-1">Správa týždennej ponuky</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gastro-beige/20">
            <Calendar className="w-4 h-4 text-gastro-ink/40" />
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-xs font-bold outline-none bg-transparent"
            />
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gastro-dark-green text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg shadow-gastro-dark-green/20 flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Uložiť Menu
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] p-8 border border-gastro-beige/20 shadow-sm space-y-4">
        <div className="flex items-center justify-between mb-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-gastro-ink/40">Obsah Menu (Textový formát)</label>
          <span className="text-[10px] text-gastro-ink/20 italic">Tip: Používajte hviezdičky (*) pre tučné písmo</span>
        </div>
        <textarea 
          rows={25}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Napr.:
Jedálny lístok 4.5.-10.5.2026
Denné menu 7,50€

Pondelok:
- Polievka: Demikát s krutónmi
- 1. Mletý rezeň so syrom...
- 2. Bravčový plátok..."
          className="w-full bg-gastro-cream/5 border border-gastro-beige rounded-2xl px-6 py-6 focus:border-gastro-dark-green outline-none font-mono text-sm leading-relaxed"
        />
      </div>

      <div className="bg-gastro-olive/5 rounded-3xl p-6 border border-gastro-olive/10">
        <h4 className="text-xs font-bold uppercase tracking-widest text-gastro-dark-green mb-4">Náhľad obsahu</h4>
        <div className="prose prose-sm max-w-none text-gastro-ink whitespace-pre-wrap font-sans">
          {content || 'Žiadny obsah zatiaľ nie je zadaný.'}
        </div>
      </div>
    </div>
  );
}
