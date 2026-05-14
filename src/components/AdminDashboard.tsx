import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Package, 
  Settings, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Loader2,
  TrendingUp,
  Users,
  Plus,
  X,
  Printer,
  Filter,
  Volume2,
  VolumeX,
  Map as MapIcon,
  Navigation,
  Calendar,
  Settings2,
  UtensilsCrossed,
  Upload
} from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import React from 'react';
import DailyMenuEditor from './DailyMenuEditor';
import { Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

interface Order {
  id: string;
  status: string;
  type: string;
  total: string | number;
  createdAt: string;
  deliveryAddress: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryCity?: string | null;
  deliveryFee?: string | number;
  items: {
    quantity: number;
    itemName?: string | null;
    menuItem: {
      name: string;
    } | null;
  }[];
}

function MenuItemModal({ categories, item, onClose, onSuccess }: { categories: any[], item?: any, onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price ? String(item.price) : '',
    image: item?.image || '',
    categoryId: item?.categoryId || categories[0]?.id || '',
    tag: item?.tag || '',
    isPizza: item?.isPizza || false,
    allergens: item?.allergens || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState('');

  const resizeImage = (file: File) => new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Vyberte obrázok vo formáte JPG, PNG alebo WebP.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSize = 1200;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.round(image.width * scale);
        const height = Math.round(image.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Obrázok sa nepodarilo spracovať.'));
          return;
        }
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      image.onerror = () => reject(new Error('Obrázok sa nepodarilo načítať.'));
      image.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Súbor sa nepodarilo načítať.'));
    reader.readAsDataURL(file);
  });

  const handleImageUpload = async (file?: File) => {
    if (!file) return;
    setImageError('');
    try {
      const image = await resizeImage(file);
      setFormData((current) => ({ ...current, image }));
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Obrázok sa nepodarilo nahrať.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = item ? `/api/admin/items/${item.id}` : '/api/admin/items';
      const method = item ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price)
        }),
      });
      if (res.ok) {
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to save item:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gastro-dark-green/20 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-gastro-beige/20 flex justify-between items-center bg-gastro-cream/10">
          <h3 className="text-xl font-bold uppercase tracking-tight">{item ? 'Upraviť Jedlo' : 'Nové Jedlo'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <X className="w-5 h-5 text-gastro-ink/40" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gastro-ink/40 ml-4">Názov</label>
              <input 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-gastro-cream/10 border border-gastro-beige rounded-2xl px-5 py-3 outline-none focus:border-gastro-dark-green transition-colors text-sm font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gastro-ink/40 ml-4">Cena (€)</label>
              <input 
                required
                type="number" step="0.01"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                className="w-full bg-gastro-cream/10 border border-gastro-beige rounded-2xl px-5 py-3 outline-none focus:border-gastro-dark-green transition-colors text-sm font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gastro-ink/40 ml-4">Kategória</label>
            <select 
              value={formData.categoryId}
              onChange={e => setFormData({...formData, categoryId: e.target.value})}
              className="w-full bg-gastro-cream/10 border border-gastro-beige rounded-2xl px-5 py-3 outline-none focus:border-gastro-dark-green transition-colors text-sm font-bold appearance-none cursor-pointer"
            >
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gastro-ink/40 ml-4">Popis</label>
            <textarea 
              rows={2}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-gastro-cream/10 border border-gastro-beige rounded-2xl px-5 py-3 outline-none focus:border-gastro-dark-green transition-colors text-sm font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gastro-ink/40 ml-4">Alergény</label>
              <input 
                value={formData.allergens}
                onChange={e => setFormData({...formData, allergens: e.target.value})}
                placeholder="napr. 1,3,7"
                className="w-full bg-gastro-cream/10 border border-gastro-beige rounded-2xl px-5 py-3 outline-none focus:border-gastro-dark-green transition-colors text-sm font-bold"
              />
            </div>
            <div className="flex items-center gap-3 pt-6 px-4">
               <input 
                 type="checkbox"
                 id="isPizza"
                 checked={formData.isPizza}
                 onChange={e => setFormData({...formData, isPizza: e.target.checked})}
                 className="w-5 h-5 accent-gastro-dark-green"
               />
               <label htmlFor="isPizza" className="text-xs font-bold uppercase tracking-widest text-gastro-ink/60 cursor-pointer">Pizza?</label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gastro-ink/40 ml-4">URL Obrázka</label>
            <input 
              value={formData.image}
              onChange={e => setFormData({...formData, image: e.target.value})}
              className="w-full bg-gastro-cream/10 border border-gastro-beige rounded-2xl px-5 py-3 outline-none focus:border-gastro-dark-green transition-colors text-sm font-bold"
            />
            {formData.image && (
              <div className="h-40 rounded-2xl overflow-hidden border border-gastro-beige bg-gastro-cream/10">
                <img src={formData.image} alt="Náhľad jedla" className="w-full h-full object-cover" />
              </div>
            )}
            <label className="bg-gastro-dark-green text-white px-5 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] transition-transform">
              <Upload className="w-4 h-4" />
              Nahrať obrázok z PC
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => handleImageUpload(event.target.files?.[0])}
              />
            </label>
            {imageError && (
              <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest ml-4">{imageError}</div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gastro-ink/40 ml-4">Tag (nepovinné)</label>
            <input 
              value={formData.tag || ''}
              onChange={e => setFormData({...formData, tag: e.target.value})}
              placeholder="napr. Populárne, Pikantné"
              className="w-full bg-gastro-cream/10 border border-gastro-beige rounded-2xl px-5 py-3 outline-none focus:border-gastro-dark-green transition-colors text-sm font-bold"
            />
          </div>

          <button 
            disabled={isSubmitting}
            className="w-full bg-gastro-dark-green text-white py-4 rounded-full font-bold text-sm shadow-xl shadow-gastro-dark-green/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : item ? 'Uložiť Zmeny' : 'Uložiť Položku'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

const LogisticsMap = ({ orders }: { orders: Order[] }) => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const routesLib = useMapsLibrary('routes');
  const [markers, setMarkers] = useState<{ id: string; pos: google.maps.LatLngLiteral; address: string }[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!placesLib || !orders.length) return;

    const deliveryOrders = orders.filter(o => o.type === 'DELIVERY' && o.deliveryAddress && o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
    
    Promise.all(deliveryOrders.map(async (order) => {
      try {
        const result = await placesLib.Place.searchByText({
          textQuery: `${order.deliveryAddress}, Hlohovec, Slovakia`,
          fields: ['location'],
          maxResultCount: 1
        });
        if (result.places?.[0]?.location) {
          return {
            id: order.id,
            address: order.deliveryAddress!,
            pos: { lat: result.places[0].location.lat(), lng: result.places[0].location.lng() }
          };
        }
      } catch (e) {
        console.error('Geocoding error:', e);
      }
      return null;
    })).then(results => {
      setMarkers(results.filter((r): r is NonNullable<typeof r> => r !== null));
    });
  }, [placesLib, orders]);

  const showRoute = async (destination: google.maps.LatLngLiteral) => {
    if (!routesLib || !map) return;

    // Jašterka Location
    const origin = { lat: 48.4239, lng: 17.7972 };

    // Clear old routes
    polylinesRef.current.forEach(p => p.setMap(null));

    try {
      const { routes } = await routesLib.Route.computeRoutes({
        origin: { location: origin },
        destination: { location: destination },
        travelMode: 'DRIVING',
        fields: ['path', 'viewport', 'distanceMeters', 'durationMillis']
      });

      if (routes?.[0]) {
        const newPolylines = routes[0].createPolylines();
        newPolylines.forEach(p => {
          p.setOptions({ strokeColor: '#2D4F1E', strokeOpacity: 0.8, strokeWeight: 5 });
          p.setMap(map);
        });
        polylinesRef.current = newPolylines;
        if (routes[0].viewport) map.fitBounds(routes[0].viewport);
      }
    } catch (e) {
      console.error('Routing error:', e);
    }
  };

  return (
    <div className="w-full h-full relative rounded-[32px] overflow-hidden border border-gastro-beige/10">
      <Map
        defaultCenter={{ lat: 48.4239, lng: 17.7972 }}
        defaultZoom={13}
        mapId="ADMIN_LOGISTICS_MAP"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Restaurant Pin */}
        <AdvancedMarker position={{ lat: 48.4239, lng: 17.7972 }}>
          <div className="bg-gastro-dark-green p-2 rounded-xl border-2 border-white shadow-xl">
            <MapIcon className="w-4 h-4 text-white" />
          </div>
        </AdvancedMarker>

        {markers.map(m => (
          <AdvancedMarker 
            key={m.id} 
            position={m.pos} 
            onClick={() => showRoute(m.pos)}
          >
            <Pin background="#D97706" borderColor="#fff" glyphColor="#fff" />
          </AdvancedMarker>
        ))}
      </Map>
      
      <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gastro-beige/20 max-w-xs">
        <h4 className="text-xs font-black uppercase tracking-widest text-gastro-ink mb-2">Aktívne Rozvozy</h4>
        <div className="space-y-2">
          {markers.length === 0 ? (
            <p className="text-[10px] text-gastro-ink/40 italic">Žiadne aktívne dovozy na mape</p>
          ) : markers.map(m => (
            <button 
              key={m.id}
              onClick={() => showRoute(m.pos)}
              className="w-full text-left p-2 rounded-lg hover:bg-gastro-dark-green/5 transition-colors group"
            >
              <div className="text-[10px] font-bold text-gastro-dark-green uppercase">#{m.id.slice(-4)}</div>
              <div className="text-[10px] text-gastro-ink/60 truncate">{m.address}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'daily' | 'stats' | 'logistics' | 'reservations' | 'settings'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Hidden internal audio element for notifications
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  const playNotification = () => {
    if (isSoundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number | string;
    image: string;
    tag?: string;
    categoryId: string;
    isPizza?: boolean;
    allergens?: string;
  }

  interface Category {
    id: string;
    name: string;
    items: MenuItem[];
  }

  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders();
    }
    if (activeTab === 'menu') {
      loadMenu();
    }
    if (activeTab === 'reservations') {
      loadReservations();
    }
    if (activeTab === 'settings') {
      loadSettings();
    }
    
    // SSE Listener for new orders
    const eventSource = new EventSource('/api/admin/orders/events');
    eventSource.onmessage = (event) => {
      const newOrder = JSON.parse(event.data);
      if (activeTab === 'orders') {
        setOrders(prev => [newOrder, ...prev]);
        playNotification();
      }
      console.log('New Order Received via SSE:', newOrder);
    };

    return () => eventSource.close();
  }, [activeTab]);

  const loadMenu = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Naozaj chcete vymazať túto položku?')) return;
    try {
      const res = await fetch(`/api/admin/items/${id}`, { method: 'DELETE' });
      if (res.ok) loadMenu();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        loadOrders();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const loadReservations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/reservations');
      const data = await res.json();
      if (Array.isArray(data)) {
        setReservations(data);
      }
    } catch (err) {
      console.error('Failed to fetch reservations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateReservationStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/reservations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        loadReservations();
      }
    } catch (err) {
      console.error('Failed to update reservation status:', err);
    }
  };

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        alert('Nastavenia boli uložené');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'preparing': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'completed': return 'bg-green-500/10 text-green-600 border-green-500/20';
      default: return 'bg-gastro-ink/5 text-gastro-ink/40 border-gastro-ink/10';
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
      const matchesType = typeFilter === 'ALL' || order.type === typeFilter;
      return matchesStatus && matchesType;
    });
  }, [orders, statusFilter, typeFilter]);

  const printOrder = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = order.items.map(i => `
      <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 4px 0;">
        <span>${i.quantity}x ${i.menuItem?.name || i.itemName || 'Položka'}</span>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Objednávka #${order.id.slice(-4)}</title>
          <style>
            body { font-family: monospace; padding: 20px; width: 300px; }
            h1 { font-size: 18px; margin-bottom: 10px; }
            .meta { font-size: 12px; color: #666; margin-bottom: 20px; }
            .total { font-weight: bold; font-size: 16px; margin-top: 20px; text-align: right; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <h1>JAS̆TERKA HLOHOVEC</h1>
          <div class="meta">
            ID: #${order.id.toUpperCase()}<br>
            C̆as: ${new Date(order.createdAt).toLocaleString('sk-SK')}<br>
            Typ: ${order.type}<br>
            Meno: ${order.customerName || '-'}<br>
            Telefón: ${order.customerPhone || '-'}<br>
            Obec: ${order.deliveryCity || '-'}<br>
            Adresa: ${order.deliveryAddress || 'Osobný Odber'}
          </div>
          <div class="items">${itemsHtml}</div>
          <div class="total">SPOLU: ${Number(order.total).toFixed(2)} €</div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex text-gastro-ink">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gastro-beige/20 flex flex-col">
        <div className="p-8 border-b border-gastro-beige/20">
          <div className="text-xl font-black tracking-tighter text-gastro-dark-green uppercase">
            Admin<span className="text-gastro-orange"> Panel</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'orders', label: 'Objednávky', icon: Package },
            { id: 'daily', label: 'Denné Menu', icon: UtensilsCrossed },
            { id: 'reservations', label: 'Rezervácie', icon: Calendar },
            { id: 'logistics', label: 'Logistika', icon: Navigation },
            { id: 'menu', label: 'Správa Menu', icon: Package },
            { id: 'stats', label: 'Štatistiky', icon: BarChart3 },
            { id: 'settings', label: 'Nastavenia', icon: Settings2 },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === item.id 
                  ? 'bg-gastro-dark-green text-white shadow-lg shadow-gastro-dark-green/20' 
                  : 'text-gastro-ink/50 hover:bg-gastro-beige/10 hover:text-gastro-dark-green'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gastro-beige/20">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Odhlásiť sa
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-24 bg-white border-b border-gastro-beige/20 px-10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-black uppercase tracking-tighter text-gastro-dark-green">
              {activeTab === 'orders' ? 'Objednávky' : 
               activeTab === 'menu' ? 'Menu' : 
               activeTab === 'daily' ? 'Denná Ponuka' : 
               activeTab === 'stats' ? 'Analytika' : 
               activeTab === 'reservations' ? 'Rezervácie' : 'Systém'}
            </h1>
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gastro-olive/5 rounded-full border border-gastro-olive/10">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gastro-dark-green">Live Sync Aktívny</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {activeTab === 'orders' && (
              <button 
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className={`p-3 rounded-2xl transition-all border ${isSoundEnabled ? 'text-gastro-dark-green bg-gastro-dark-green/5 border-gastro-dark-green/10' : 'text-gastro-ink/30 bg-white border-gastro-beige/20'}`}
                title={isSoundEnabled ? "Zvuk zapnutý" : "Zvuk vypnutý"}
              >
                {isSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            )}
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-gastro-ink/30">Dnes je</span>
              <span className="text-sm font-bold">{new Date().toLocaleDateString('sk-SK', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-10 bg-[#fbfbfb]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-40">
                  <Loader2 className="w-12 h-12 animate-spin text-gastro-dark-green" />
                </div>
              ) : (
                <>
                  {activeTab === 'orders' && (
                    <div className="space-y-10">
                      {/* Welcome Banner */}
                      <div className="bg-gradient-to-r from-gastro-dark-green to-[#2D4F1E] rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-white shadow-inner opacity-5 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                          <div>
                            <h2 className="text-3xl font-black tracking-tight mb-2">Vitajte späť, Jašterka Admin!</h2>
                            <p className="text-white/60 font-medium">Dnes máte {orders.filter(o => o.status === 'NEW').length} nových objednávok čakajúcich na vybavenie.</p>
                          </div>
                          <div className="flex gap-4">
                             <div className="px-6 py-4 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 text-center">
                               <div className="text-2xl font-black">{orders.length}</div>
                               <div className="text-[8px] font-bold uppercase tracking-widest opacity-60">Celkovo dnes</div>
                             </div>
                             <div className="px-6 py-4 bg-gastro-orange rounded-3xl text-center shadow-lg shadow-gastro-orange/20">
                               <div className="text-2xl font-black">{orders.filter(o => o.status === 'NEW').length}</div>
                               <div className="text-[8px] font-bold uppercase tracking-widest opacity-80">Nové Prírastky</div>
                             </div>
                          </div>
                        </div>
                      </div>

                      {/* Filters & Stats Bar */}
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6">
                          {[
                            { label: 'Čakajúce', value: orders.filter(o => o.status === 'NEW').length, icon: Clock, color: 'text-yellow-500' },
                            { label: 'V príprave', value: orders.filter(o => o.status === 'PREPARING').length, icon: AlertCircle, color: 'text-blue-500' },
                            { label: 'Dokončené', value: orders.filter(o => o.status === 'COMPLETED').length, icon: CheckCircle2, color: 'text-green-500' },
                            { label: 'Obrat', value: `${orders.reduce((acc, curr) => acc + Number(curr.total), 0).toFixed(2)} €`, icon: BarChart3, color: 'text-gastro-dark-green' },
                          ].map((stat) => (
                            <div key={stat.label} className="bg-white p-6 rounded-3xl border border-gastro-beige/10 shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                <span className="text-[10px] font-bold text-gastro-ink/30 uppercase tracking-widest">Dnes</span>
                              </div>
                              <div className="text-2xl font-black tracking-tighter">{stat.value}</div>
                              <div className="text-xs font-bold text-gastro-ink/50 mt-1 uppercase tracking-widest">{stat.label}</div>
                            </div>
                          ))}
                        </div>

                        <div className="lg:w-80 bg-white p-6 rounded-3xl border border-gastro-beige/10 shadow-sm space-y-4">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gastro-ink/40">
                            <Filter className="w-3 h-3" /> Filtre
                          </div>
                          <div className="space-y-3">
                            <select 
                              value={statusFilter}
                              onChange={e => setStatusFilter(e.target.value)}
                              className="w-full bg-gastro-cream/10 border border-gastro-beige/20 rounded-xl px-4 py-2 text-xs font-bold outline-none cursor-pointer"
                            >
                              <option value="ALL">Všetky Stavy</option>
                              <option value="NEW">Nové</option>
                              <option value="PREPARING">V Príprave</option>
                              <option value="COMPLETED">Hotové</option>
                              <option value="CANCELLED">Zrušené</option>
                            </select>
                            <select 
                              value={typeFilter}
                              onChange={e => setTypeFilter(e.target.value)}
                              className="w-full bg-gastro-cream/10 border border-gastro-beige/20 rounded-xl px-4 py-2 text-xs font-bold outline-none cursor-pointer"
                            >
                              <option value="ALL">Všetky Typy</option>
                              <option value="DELIVERY">Dovoz</option>
                              <option value="PICKUP">Odber</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Orders Table */}
                      <div className="bg-white rounded-[32px] border border-gastro-beige/10 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gastro-cream/10 border-b border-gastro-beige/20">
                              {['ID', 'Zákazník', 'Typ', 'Čas', 'Položky', 'Status', 'Suma', 'Akcie'].map((h) => (
                                <th key={h} className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gastro-ink/40">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredOrders.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="px-6 py-20 text-center text-xs font-bold text-gastro-ink/30 uppercase tracking-widest">
                                  Žiadne objednávky nespĺňajú filtre
                                </td>
                              </tr>
                            ) : filteredOrders.map((order) => (
                              <tr key={order.id} className="border-b border-gastro-beige/10 hover:bg-gastro-cream/5 transition-colors">
                                <td className="px-6 py-5 font-bold text-xs">#{order.id.slice(-4).toUpperCase()}</td>
                                <td className="px-6 py-5">
                                  <div className="font-bold text-sm">{order.customerName || 'Bez mena'}</div>
                                  <div className="text-[10px] text-gastro-ink/40">{order.customerPhone || ''}</div>
                                  <div className="font-bold text-sm">{order.deliveryAddress || 'Osobný Odber'}</div>
                                </td>
                                <td className="px-6 py-5">
                                  <span className={`text-[10px] font-black uppercase tracking-widest ${order.type === 'DELIVERY' ? 'text-blue-500' : 'text-gastro-orange'}`}>
                                    {order.type}
                                  </span>
                                </td>
                                <td className="px-6 py-5 text-sm font-bold text-gastro-ink/40">{formatTime(order.createdAt)}</td>
                                <td className="px-6 py-5">
                                  <div className="text-xs text-gastro-ink/60 truncate max-w-[200px]">
                                    {order.items.map(i => `${i.quantity}x ${i.menuItem?.name || i.itemName || 'Položka'}`).join(', ')}
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <select 
                                    value={order.status}
                                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                    className={`inline-flex items-center px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)} outline-none cursor-pointer`}
                                  >
                                    <option value="NEW">New</option>
                                    <option value="PREPARING">Preparing</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                  </select>
                                </td>
                                <td className="px-6 py-5 font-black text-sm">{Number(order.total).toFixed(2)} €</td>
                                <td className="px-6 py-5">
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => printOrder(order)}
                                      className="p-2 hover:bg-gastro-dark-green hover:text-white rounded-lg transition-all"
                                      title="Tlačiť objednávku"
                                    >
                                      <Printer className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 hover:bg-gastro-dark-green hover:text-white rounded-lg transition-all">
                                      <ChevronRight className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Rest of the tab content would go here ... but for now we maintain original flow */}
                  {activeTab === 'daily' && <DailyMenuEditor />}
                  {activeTab === 'reservations' && (
                    <div className="space-y-10">
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <h2 className="text-xl font-bold uppercase tracking-tight">Správa Rezervácií</h2>
                          <p className="text-[10px] text-gastro-ink/40 uppercase font-black tracking-widest mt-1">Prehľad a potvrdzovanie stolov</p>
                        </div>
                      </div>

                      <div className="bg-white rounded-[32px] border border-gastro-beige/10 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gastro-cream/10 border-b border-gastro-beige/20">
                              {['Meno', 'Kontakt', 'Dátum a Čas', 'Hostia', 'Poznámka', 'Status', 'Akcie'].map((h) => (
                                <th key={h} className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gastro-ink/40">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {reservations.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="px-6 py-20 text-center text-xs font-bold text-gastro-ink/30 uppercase tracking-widest">
                                  Žiadne rezervácie
                                </td>
                              </tr>
                            ) : reservations.map((res) => (
                              <tr key={res.id} className="border-b border-gastro-beige/10 hover:bg-gastro-cream/5 transition-colors">
                                <td className="px-6 py-5">
                                  <div className="font-bold text-sm text-gastro-dark-green uppercase">{res.name}</div>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="text-xs font-bold">{res.phone}</div>
                                  <div className="text-[10px] text-gastro-ink/40">{res.email}</div>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="text-sm font-black text-gastro-dark-green">
                                    {new Date(res.date).toLocaleDateString('sk-SK')}
                                  </div>
                                  <div className="text-[10px] font-bold text-gastro-ink/40">
                                    {new Date(res.date).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="flex items-center gap-2">
                                     <Users className="w-3 h-3 text-gastro-ink/30" />
                                     <span className="font-bold text-sm text-gastro-dark-green">{res.guests}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="text-xs text-gastro-ink/60 truncate max-w-[150px] italic">
                                    {res.note || '-'}
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <select 
                                    value={res.status}
                                    onChange={(e) => updateReservationStatus(res.id, e.target.value)}
                                    className={`inline-flex items-center px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer ${
                                      res.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                      res.status === 'CANCELLED' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                                      'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                                    }`}
                                  >
                                    <option value="PENDING">Čakajúca</option>
                                    <option value="CONFIRMED">Potvrdená</option>
                                    <option value="CANCELLED">Zrušená</option>
                                    <option value="NO_SHOW">Neprišiel</option>
                                    <option value="COMPLETED">Ukončená</option>
                                  </select>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="flex gap-2">
                                     {res.status === 'PENDING' && (
                                       <button 
                                         onClick={() => updateReservationStatus(res.id, 'CONFIRMED')}
                                         className="p-2 bg-green-500 text-white rounded-lg hover:scale-110 transition-transform"
                                       >
                                         <CheckCircle2 className="w-4 h-4" />
                                       </button>
                                     )}
                                     <button className="p-2 hover:bg-gastro-dark-green hover:text-white rounded-lg transition-all">
                                       <ChevronRight className="w-4 h-4" />
                                     </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {activeTab === 'menu' && (
                    <div className="space-y-12">
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <h2 className="text-2xl font-black uppercase tracking-tight">Správa Ponuky</h2>
                          <p className="text-sm text-gastro-ink/40">Upravujte kategórie a jednotlivé jedlá</p>
                        </div>
                        <button 
                          onClick={() => setIsAddingItem(true)}
                          className="bg-gastro-dark-green text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg shadow-gastro-dark-green/20 flex items-center gap-2 hover:scale-105 transition-all"
                        >
                          <Plus className="w-4 h-4" /> Pridať Jedlo
                        </button>
                      </div>

                      {categories.map((cat) => (
                        <div key={cat.id} className="space-y-6">
                          <div className="flex items-center gap-4">
                            <h3 className="text-lg font-black uppercase tracking-widest text-gastro-dark-green">{cat.name}</h3>
                            <div className="flex-1 h-px bg-gastro-beige/20" />
                            <span className="text-[10px] font-bold text-gastro-ink/30 uppercase tracking-[0.2em]">{cat.items.length} Položiek</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {cat.items.map((item) => (
                              <div key={item.id} className="bg-white rounded-3xl border border-gastro-beige/10 p-5 group hover:shadow-xl transition-all">
                                <div className="flex gap-4">
                                  <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                                    <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                      <h4 className="font-bold text-sm truncate">{item.name}</h4>
                                      <span className="font-black text-xs text-gastro-dark-green">{Number(item.price).toFixed(2)}€</span>
                                    </div>
                                    <p className="text-[10px] text-gastro-ink/50 line-clamp-2 leading-relaxed mb-3">
                                      {item.description}
                                    </p>
                                    <div className="flex gap-2">
                                      <button 
                                        onClick={() => setEditingItem(item)}
                                        className="text-[9px] font-bold uppercase tracking-widest text-gastro-dark-green/40 hover:text-gastro-dark-green transition-colors"
                                      >
                                        Upraviť
                                      </button>
                                      <button 
                                        onClick={() => deleteItem(item.id)}
                                        className="text-[9px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors"
                                      >
                                        Vymazať
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            <button 
                              onClick={() => setIsAddingItem(true)}
                              className="border-2 border-dashed border-gastro-beige/20 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 hover:border-gastro-dark-green/20 hover:bg-white transition-all text-gastro-ink/20 hover:text-gastro-dark-green/40"
                            >
                              <Plus className="w-8 h-8" />
                              <span className="text-xs font-bold uppercase tracking-widest">Nové v {cat.name}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'stats' && (
                    <div className="space-y-8 pb-12">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                          { label: 'Priemerná Objednávka', value: '18.40 €', icon: TrendingUp, color: 'text-green-500' },
                          { label: 'Unikátni Hostia', value: '142', icon: Users, color: 'text-blue-500' },
                          { label: 'Pozitívne Recenzie', value: '98%', icon: CheckCircle2, color: 'text-orange-500' },
                        ].map((stat) => (
                          <div key={stat.label} className="bg-white p-8 rounded-[32px] border border-gastro-beige/10 shadow-sm">
                            <stat.icon className={`w-6 h-6 ${stat.color} mb-4`} />
                            <div className="text-3xl font-black tracking-tight">{stat.value}</div>
                            <div className="text-[10px] font-bold text-gastro-ink/30 uppercase tracking-[0.2em] mt-1">{stat.label}</div>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-[40px] border border-gastro-beige/10 shadow-sm h-[450px]">
                          <div className="flex items-center justify-between mb-8">
                            <div>
                              <h3 className="text-lg font-bold">Týždenný Obrat</h3>
                              <p className="text-xs text-gastro-ink/40">Sledovanie tržieb za posledných 7 dní</p>
                            </div>
                            <div className="text-2xl font-black text-gastro-dark-green">1,240 €</div>
                          </div>
                          <ResponsiveContainer width="100%" height="80%">
                            <AreaChart 
                              data={[
                                { name: 'Pon', value: 120 },
                                { name: 'Uto', value: 210 },
                                { name: 'Str', value: 180 },
                                { name: 'Štv', value: 340 },
                                { name: 'Pia', value: 420 },
                                { name: 'Sob', value: 580 },
                                { name: 'Ned', value: 450 },
                              ]}
                            >
                              <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#2D4F1E" stopOpacity={0.1}/>
                                  <stop offset="95%" stopColor="#2D4F1E" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                              <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 10, fontWeight: 'bold', fill: '#9ca3af'}} 
                              />
                              <YAxis hide />
                              <Tooltip 
                                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                itemStyle={{fontWeight: 'bold', color: '#2D4F1E'}}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#2D4F1E" 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill="url(#colorValue)" 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="bg-white p-8 rounded-[40px] border border-gastro-beige/10 shadow-sm h-[450px]">
                          <div className="flex items-center justify-between mb-8">
                            <div>
                              <h3 className="text-lg font-bold">Najpredávanejšie</h3>
                              <p className="text-xs text-gastro-ink/40">Najpopulárnejšie kategórie dňa</p>
                            </div>
                          </div>
                          <ResponsiveContainer width="100%" height="80%">
                            <BarChart 
                              data={[
                                { name: 'Pizza', value: 85 },
                                { name: 'Menu', value: 65 },
                                { name: 'Šaláty', value: 35 },
                                { name: 'Pivo', value: 50 },
                                { name: 'Dezerty', value: 25 },
                              ]}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                              <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 10, fontWeight: 'bold', fill: '#9ca3af'}} 
                              />
                              <YAxis hide />
                              <Tooltip 
                                cursor={{fill: '#f8f9fa'}}
                                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                              />
                              <Bar 
                                dataKey="value" 
                                fill="#D97706" 
                                radius={[8, 8, 0, 0]} 
                                barSize={40}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === 'logistics' && (
                    <div className="h-full flex flex-col gap-6">
                      <div className="bg-white p-6 rounded-[32px] border border-gastro-beige/10 shadow-sm shrink-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-xl font-bold uppercase tracking-tight">Mapa Rozvozov</h2>
                            <p className="text-[10px] text-gastro-ink/40 uppercase font-black tracking-widest mt-1">Sledovanie aktívnych doručení v reálnom čase</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-h-[500px]">
                        <LogisticsMap orders={orders} />
                      </div>
                    </div>
                  )}

                  {activeTab === 'settings' && (
                    <div className="max-w-4xl space-y-8 pb-20">
                      <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-gastro-dark-green text-shadow-sm shadow-gastro-dark-green/10">Nastavenia & CMS</h2>
                        <p className="text-[10px] text-gastro-ink/40 uppercase font-black tracking-widest mt-1">Správa obsahu a konfigurácia systému</p>
                      </div>

                      <form onSubmit={saveSettings} className="space-y-8">
                        <div className="bg-white rounded-[40px] p-10 border border-gastro-beige/20 shadow-xl shadow-gastro-beige/5 space-y-6">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 bg-gastro-dark-green/5 rounded-xl flex items-center justify-center">
                              <Settings2 className="w-5 h-5 text-gastro-dark-green" />
                            </div>
                            <h3 className="text-lg font-bold uppercase tracking-tight">Identita Reštaurácie</h3>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <input 
                              value={settings.restaurant_name || ''}
                              onChange={e => setSettings({...settings, restaurant_name: e.target.value})}
                              placeholder="Názov"
                              className="w-full bg-gastro-cream/10 border border-gastro-beige rounded-2xl px-6 py-4 focus:border-gastro-dark-green outline-none font-bold placeholder:text-gastro-ink/20"
                            />
                            <input 
                              value={settings.address || ''}
                              onChange={e => setSettings({...settings, address: e.target.value})}
                              placeholder="Adresa"
                              className="w-full bg-gastro-cream/10 border border-gastro-beige rounded-2xl px-6 py-4 focus:border-gastro-dark-green outline-none font-bold placeholder:text-gastro-ink/20"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button 
                            disabled={isSavingSettings}
                            className="bg-gastro-dark-green text-white px-10 py-5 rounded-full font-black uppercase tracking-widest shadow-2xl shadow-gastro-dark-green/30 hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-3"
                          >
                            {isSavingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                            Uložiť Všetky Zmeny
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {(isAddingItem || editingItem) && (
            <MenuItemModal 
              categories={categories}
              item={editingItem}
              onClose={() => {
                setIsAddingItem(false);
                setEditingItem(null);
              }}
              onSuccess={() => {
                loadMenu();
                setIsAddingItem(false);
                setEditingItem(null);
              }}
            />
          )}
        </section>
      </main>
    </div>
  );
}
