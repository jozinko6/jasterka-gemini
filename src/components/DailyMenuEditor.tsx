import { useState, useEffect } from 'react';
import { Save, Loader2, Calendar, Plus, Trash2 } from 'lucide-react';

interface DailyMenuItem {
  id?: string;
  name: string;
  description: string;
  price: string;
  isActive?: boolean;
}

const emptyItem = (): DailyMenuItem => ({
  name: '',
  description: '',
  price: '7.50',
  isActive: true,
});

export default function DailyMenuEditor() {
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<DailyMenuItem[]>([emptyItem()]);
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
        if (data) {
          setContent(data.content || '');
          if (data.date) setDate(new Date(data.date).toISOString().split('T')[0]);
          if (Array.isArray(data.items) && data.items.length > 0) {
            setItems(data.items.map((item: any) => ({
              id: item.id,
              name: item.name || '',
              description: item.description || '',
              price: String(item.price || '7.50'),
              isActive: item.isActive !== false,
            })));
          }
        }
      }
    } catch (err) {
      console.error('Failed to load daily menu:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateItem = (index: number, data: Partial<DailyMenuItem>) => {
    setItems((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, ...data } : item
    )));
  };

  const removeItem = (index: number) => {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/daily-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          date,
          items: items
            .filter((item) => item.name.trim())
            .map((item) => ({
              ...item,
              price: Number(item.price || 0),
            })),
        }),
      });
      if (res.ok) {
        alert('Denné menu bolo uložené');
        loadMenu();
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
    <div className="max-w-5xl space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-gastro-dark-green">Denné Menu</h2>
          <p className="text-[10px] text-gastro-ink/40 uppercase font-black tracking-widest mt-1">Text, položky, ceny a objednávanie cez košík</p>
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

      <div className="bg-white rounded-[32px] p-8 border border-gastro-beige/20 shadow-sm space-y-4">
        <label className="text-[10px] font-black uppercase tracking-widest text-gastro-ink/40">Text nad položkami</label>
        <textarea
          rows={8}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Polievka:\n- Slepačí vývar s rezancami\n- Fazuľová so zeleninou"
          className="w-full bg-gastro-cream/5 border border-gastro-beige rounded-2xl px-6 py-6 focus:border-gastro-dark-green outline-none font-mono text-sm leading-relaxed"
        />
      </div>

      <div className="bg-white rounded-[32px] p-8 border border-gastro-beige/20 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black uppercase tracking-tight text-gastro-dark-green">Objednateľné menučká</h3>
          <button
            onClick={() => setItems((current) => [...current, emptyItem()])}
            className="bg-gastro-orange text-white px-5 py-3 rounded-full font-bold text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Pridať
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id || index} className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr_120px_44px] gap-3 items-center bg-gastro-cream/10 border border-gastro-beige/20 rounded-2xl p-4">
              <input
                value={item.name}
                onChange={(e) => updateItem(index, { name: e.target.value })}
                placeholder="Názov menučka"
                className="bg-white border border-gastro-beige rounded-xl px-4 py-3 outline-none focus:border-gastro-dark-green font-bold"
              />
              <input
                value={item.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                placeholder="Príloha / popis"
                className="bg-white border border-gastro-beige rounded-xl px-4 py-3 outline-none focus:border-gastro-dark-green"
              />
              <input
                type="number"
                step="0.01"
                value={item.price}
                onChange={(e) => updateItem(index, { price: e.target.value })}
                className="bg-white border border-gastro-beige rounded-xl px-4 py-3 outline-none focus:border-gastro-dark-green font-bold"
              />
              <button
                onClick={() => removeItem(index)}
                className="w-11 h-11 rounded-xl text-red-400 hover:bg-red-50 flex items-center justify-center"
                type="button"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
