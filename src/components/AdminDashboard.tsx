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
  Upload,
  Truck,
  Wifi,
  WifiOff,
  Trash2,
  Award,
  Star,
  Medal,
  Trophy,
  ChefHat,
  Timer,
  CookingPot,
  Beer,
  Pizza,
  Bell
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
  courierId?: string | null;
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
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'daily' | 'stats' | 'logistics' | 'reservations' | 'settings' | 'couriers' | 'dispatch' | 'leaderboard' | 'kitchen' | 'coupons'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [kitchenStationFilter, setKitchenStationFilter] = useState<string>('ALL');
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

  // Coupon state
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState('');
  const [newCouponType, setNewCouponType] = useState('FIXED');
  const [newCouponMinOrder, setNewCouponMinOrder] = useState('');
  const [newCouponExpires, setNewCouponExpires] = useState('');
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);

  const loadCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons');
      if (res.ok) setCoupons(await res.json());
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingCoupon(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCouponCode,
          discount: Number(newCouponDiscount),
          type: newCouponType,
          minOrder: newCouponMinOrder ? Number(newCouponMinOrder) : null,
          expiresAt: newCouponExpires || null,
        }),
      });
      if (res.ok) {
        setNewCouponCode('');
        setNewCouponDiscount('');
        setNewCouponType('FIXED');
        setNewCouponMinOrder('');
        setNewCouponExpires('');
        loadCoupons();
      } else {
        const data = await res.json();
        alert(data.error || 'Chyba pri vytváraní kupónu');
      }
    } catch (err) {
      console.error('Failed to create coupon:', err);
    } finally {
      setIsCreatingCoupon(false);
    }
  };

  const toggleCouponStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}/toggle`, { method: 'PATCH' });
      if (res.ok) loadCoupons();
    } catch (err) {
      console.error('Failed to toggle coupon:', err);
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('Naozaj chcete odstrániť tento kupón?')) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) loadCoupons();
    } catch (err) {
      console.error('Failed to delete coupon:', err);
    }
  };

  // Courier state
  interface Courier {
    id: string;
    name: string;
    phone: string;
    vehicleType: string;
    isOnline: boolean;
    activeOrdersCount: number;
  }
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [isAddingCourier, setIsAddingCourier] = useState(false);
  const [isAddingCourierSubmitting, setIsAddingCourierSubmitting] = useState(false);
  const [newCourierName, setNewCourierName] = useState('');
  const [newCourierPhone, setNewCourierPhone] = useState('');
  const [newCourierVehicle, setNewCourierVehicle] = useState('CAR');

  // Shifts state
  const [courierShifts, setCourierShifts] = useState<any[]>([]);
  const [selectedShiftCourier, setSelectedShiftCourier] = useState<string>('');
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);
  const [showAddShift, setShowAddShift] = useState(false);
  const [newShiftStart, setNewShiftStart] = useState('');
  const [newShiftEnd, setNewShiftEnd] = useState('');
  const [newShiftIsPeak, setNewShiftIsPeak] = useState(false);
  const [isAddingShift, setIsAddingShift] = useState(false);
  const [courierEarnings, setCourierEarnings] = useState<any[]>([]);
  const [selectedEarningsCourier, setSelectedEarningsCourier] = useState<string>('');
  const [isLoadingEarnings, setIsLoadingEarnings] = useState(false);

  // Leaderboard state
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [courierAnalytics, setCourierAnalytics] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  const loadLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try {
      const res = await fetch('/api/admin/couriers/leaderboard');
      if (res.ok) setLeaderboardData(await res.json());
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  const loadCourierAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const res = await fetch('/api/admin/couriers/analytics');
      if (res.ok) setCourierAnalytics(await res.json());
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const getCourierLevel = (rating: number, completedDeliveries: number) => {
    if (rating >= 4.8 && completedDeliveries >= 100) return { name: 'Elite', icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-50 border-yellow-200/30' };
    if (rating >= 4.5 && completedDeliveries >= 50) return { name: 'Gold', icon: Medal, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200/30' };
    if (rating >= 4.0 && completedDeliveries >= 20) return { name: 'Silver', icon: Star, color: 'text-gray-400', bg: 'bg-gray-50 border-gray-200/30' };
    return { name: 'Bronze', icon: Award, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200/30' };
  };

  // Courier API functions
  const loadCouriers = async () => {
    try {
      const res = await fetch('/api/admin/couriers');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCouriers(data);
      }
    } catch (err) {
      console.error('Failed to fetch couriers:', err);
    }
  };

  const toggleCourierStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/couriers/${id}/toggle`, { method: 'PATCH' });
      if (res.ok) {
        loadCouriers();
      }
    } catch (err) {
      console.error('Failed to toggle courier status:', err);
    }
  };

  const deleteCourier = async (id: string) => {
    if (!confirm('Naozaj chcete odstrániť tohto kuriéra?')) return;
    try {
      const res = await fetch(`/api/admin/couriers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadCouriers();
      }
    } catch (err) {
      console.error('Failed to delete courier:', err);
    }
  };

  const handleAddCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingCourierSubmitting(true);
    try {
      const res = await fetch('/api/admin/couriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCourierName,
          phone: newCourierPhone,
          vehicleType: newCourierVehicle,
        }),
      });
      if (res.ok) {
        setNewCourierName('');
        setNewCourierPhone('');
        setNewCourierVehicle('CAR');
        setIsAddingCourier(false);
        loadCouriers();
      }
    } catch (err) {
      console.error('Failed to add courier:', err);
    } finally {
      setIsAddingCourierSubmitting(false);
    }
  };

  const assignCourierToOrder = async (orderId: string, courierId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/assign-courier`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courierId: courierId || null }),
      });
      if (res.ok) {
        loadOrders();
        loadCouriers();
      }
    } catch (err) {
      console.error('Failed to assign courier:', err);
    }
  };

  // Shift management functions
  const loadShifts = async (courierId: string) => {
    if (!courierId) return;
    setIsLoadingShifts(true);
    try {
      const res = await fetch(`/api/admin/couriers/${courierId}/shifts`);
      if (res.ok) setCourierShifts(await res.json());
    } catch (err) {
      console.error('Failed to fetch shifts:', err);
    } finally {
      setIsLoadingShifts(false);
    }
  };

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShiftCourier || !newShiftStart || !newShiftEnd) return;
    setIsAddingShift(true);
    try {
      const res = await fetch(`/api/admin/couriers/${selectedShiftCourier}/shifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: newShiftStart,
          endTime: newShiftEnd,
          isPeak: newShiftIsPeak,
        }),
      });
      if (res.ok) {
        setShowAddShift(false);
        setNewShiftStart('');
        setNewShiftEnd('');
        setNewShiftIsPeak(false);
        loadShifts(selectedShiftCourier);
      }
    } catch (err) {
      console.error('Failed to add shift:', err);
    } finally {
      setIsAddingShift(false);
    }
  };

  const updateShiftStatus = async (shiftId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/shifts/${shiftId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok && selectedShiftCourier) {
        loadShifts(selectedShiftCourier);
      }
    } catch (err) {
      console.error('Failed to update shift status:', err);
    }
  };

  // Earnings management functions
  const loadEarnings = async (courierId: string) => {
    if (!courierId) return;
    setIsLoadingEarnings(true);
    try {
      const res = await fetch(`/api/admin/couriers/${courierId}/earnings`);
      if (res.ok) setCourierEarnings(await res.json());
    } catch (err) {
      console.error('Failed to fetch earnings:', err);
    } finally {
      setIsLoadingEarnings(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'couriers' || activeTab === 'dispatch') {
      loadCouriers();
    }
  }, [activeTab]);

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
    if (activeTab === 'coupons') {
      loadCoupons();
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

  const getElapsedTime = (createdAt: string): number => {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    return Math.floor((now - created) / 60000);
  };

  const getOrderStation = (order: Order): string => {
    const items = order.items || [];
    const itemNames = items.map(i => (i.menuItem?.name || i.itemName || '').toLowerCase());
    
    // Check if any item is a pizza
    if (itemNames.some(name => name.includes('pizza') || name.includes('calzone'))) return 'PIZZA';
    // Check if any item is a drink
    if (itemNames.some(name => ['pivo', 'kofola', 'coca-cola', 'fanta', 'sprite', 'voda', 'džús', 'čaj', 'káva', 'kava', 'limonáda', 'malinovka', 'sódovka'].some(drink => name.includes(drink)))) return 'BAR';
    // Check if it's a delivery order
    if (order.type === 'DELIVERY') return 'DELIVERY';
    // Default to kitchen
    return 'KITCHEN';
  };

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
            { id: 'kitchen', label: 'Kuchyňa', icon: ChefHat },
            { id: 'daily', label: 'Denné Menu', icon: UtensilsCrossed },
            { id: 'reservations', label: 'Rezervácie', icon: Calendar },
            { id: 'couriers', label: 'Kuriéri', icon: Truck },
            { id: 'dispatch', label: 'Dispatch', icon: Navigation },
            { id: 'leaderboard', label: 'Rebríček', icon: Award },
            { id: 'logistics', label: 'Logistika', icon: MapIcon },
            { id: 'menu', label: 'Správa Menu', icon: Package },
            { id: 'stats', label: 'Štatistiky', icon: BarChart3 },
            { id: 'coupons', label: 'Kupóny', icon: Award },
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
               activeTab === 'kitchen' ? 'Kuchyňa' : 
               activeTab === 'menu' ? 'Menu' : 
               activeTab === 'daily' ? 'Denná Ponuka' : 
               activeTab === 'stats' ? 'Analytika' : 
               activeTab === 'reservations' ? 'Rezervácie' : 
               activeTab === 'couriers' ? 'Kuriéri' : 
               activeTab === 'dispatch' ? 'Dispatch Engine' : 
               activeTab === 'leaderboard' ? 'Rebríček Kuriérov' : 'Systém'}
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
                  {activeTab === 'kitchen' && (
                    <div className="space-y-10">
                      {/* Kitchen Header */}
                      <div className="bg-gradient-to-r from-gastro-dark-green to-[#2D4F1E] rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-white shadow-inner opacity-5 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                          <div>
                            <h2 className="text-3xl font-black tracking-tight mb-2">Kuchynský Panel</h2>
                            <p className="text-white/60 font-medium">Prehľad objednávok podľa staníc a stavov.</p>
                          </div>
                          <div className="flex gap-4">
                            <div className="px-6 py-4 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 text-center">
                              <div className="text-2xl font-black">{orders.filter(o => o.status === 'NEW').length}</div>
                              <div className="text-[8px] font-bold uppercase tracking-widest opacity-60">Nové</div>
                            </div>
                            <div className="px-6 py-4 bg-gastro-orange rounded-3xl text-center shadow-lg shadow-gastro-orange/20">
                              <div className="text-2xl font-black">{orders.filter(o => o.status === 'PREPARING').length}</div>
                              <div className="text-[8px] font-bold uppercase tracking-widest opacity-80">V Príprave</div>
                            </div>
                            <div className="px-6 py-4 bg-green-500/20 backdrop-blur-md rounded-3xl border border-white/10 text-center">
                              <div className="text-2xl font-black">{orders.filter(o => o.status === 'READY_FOR_PICKUP').length}</div>
                              <div className="text-[8px] font-bold uppercase tracking-widest opacity-60">Ready</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Station Filter */}
                      <div className="flex flex-wrap gap-3">
                        {[
                          { id: 'ALL', label: 'Všetky Stanice', icon: ChefHat },
                          { id: 'KITCHEN', label: 'Kuchyňa', icon: CookingPot },
                          { id: 'PIZZA', label: 'Pizza', icon: Pizza },
                          { id: 'BAR', label: 'Bar', icon: Beer },
                          { id: 'DELIVERY', label: 'Dovoz', icon: Truck },
                        ].map((station) => {
                          const StationIcon = station.icon;
                          return (
                            <button
                              key={station.id}
                              onClick={() => setKitchenStationFilter(station.id)}
                              className={`px-5 py-3 rounded-full font-bold text-xs flex items-center gap-2 transition-all ${
                                kitchenStationFilter === station.id
                                  ? 'bg-gastro-dark-green text-white shadow-lg shadow-gastro-dark-green/20'
                                  : 'bg-white border border-gastro-beige/20 text-gastro-ink/50 hover:border-gastro-dark-green/30'
                              }`}
                            >
                              <StationIcon className="w-4 h-4" />
                              {station.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Kitchen Columns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                          { title: 'Nové', status: 'NEW', icon: Bell, color: 'bg-yellow-500', bg: 'bg-yellow-50/50 border-yellow-200/30', textColor: 'text-yellow-700' },
                          { title: 'Prijaté', status: 'ACCEPTED', icon: CheckCircle2, color: 'bg-blue-500', bg: 'bg-blue-50/50 border-blue-200/30', textColor: 'text-blue-700' },
                          { title: 'Pripravuje sa', status: 'PREPARING', icon: Timer, color: 'bg-orange-500', bg: 'bg-orange-50/50 border-orange-200/30', textColor: 'text-orange-700' },
                          { title: 'Ready', status: 'READY_FOR_PICKUP', icon: CheckCircle2, color: 'bg-green-500', bg: 'bg-green-50/50 border-green-200/30', textColor: 'text-green-700' },
                        ].map((column) => {
                          const ColIcon = column.icon;
                          const columnOrders = orders.filter(o => {
                            const matchesStatus = o.status === column.status;
                            const matchesStation = kitchenStationFilter === 'ALL' || getOrderStation(o) === kitchenStationFilter;
                            return matchesStatus && matchesStation;
                          });

                          return (
                            <div key={column.status} className={`rounded-[32px] border ${column.bg} p-6 min-h-[500px]`}>
                              <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${column.color} ${column.status === 'NEW' ? 'animate-pulse' : ''}`} />
                                  <h3 className="font-black text-sm uppercase tracking-wider">{column.title}</h3>
                                </div>
                                <div className={`px-3 py-1 rounded-full ${column.color}/10 ${column.textColor} text-[10px] font-black`}>
                                  {columnOrders.length}
                                </div>
                              </div>

                              <div className="space-y-4">
                                {columnOrders.length === 0 ? (
                                  <div className="text-center py-12">
                                    <div className="text-4xl mb-3 opacity-30">🍽️</div>
                                    <p className="text-xs font-bold text-gastro-ink/30 uppercase tracking-widest">Žiadne objednávky</p>
                                  </div>
                                ) : columnOrders.map(order => {
                                  const elapsed = getElapsedTime(order.createdAt);
                                  const isUrgent = elapsed > 15;
                                  const station = getOrderStation(order);
                                  const stationLabel = station === 'KITCHEN' ? 'Kuchyňa' : station === 'PIZZA' ? 'Pizza' : station === 'BAR' ? 'Bar' : 'Dovoz';
                                  const stationIcon = station === 'KITCHEN' ? CookingPot : station === 'PIZZA' ? Pizza : station === 'BAR' ? Beer : Truck;
                                  const StationIcon = stationIcon;

                                  return (
                                    <motion.div
                                      key={order.id}
                                      layout
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      className={`bg-white rounded-3xl p-5 border shadow-sm transition-all hover:shadow-md ${
                                        isUrgent ? 'border-red-300/50 ring-2 ring-red-200/30' : 'border-gastro-beige/10'
                                      }`}
                                    >
                                      {/* Order Header */}
                                      <div className="flex items-start justify-between mb-3">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-black text-sm">#{order.id.slice(-4).toUpperCase()}</span>
                                            {isUrgent && (
                                              <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[8px] font-black uppercase tracking-wider animate-pulse">
                                                <AlertCircle className="w-2.5 h-2.5" />
                                                {elapsed} min
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2 mt-1">
                                            <StationIcon className="w-3 h-3 text-gastro-ink/30" />
                                            <span className="text-[10px] font-bold text-gastro-ink/40 uppercase tracking-wider">{stationLabel}</span>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="font-black text-sm text-gastro-dark-green">{Number(order.total).toFixed(2)} €</div>
                                          <div className="text-[9px] font-bold text-gastro-ink/30 uppercase tracking-wider">
                                            {order.type === 'DELIVERY' ? 'Dovoz' : 'Odber'}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Timer */}
                                      <div className="flex items-center gap-2 mb-3 p-2 rounded-xl bg-gastro-cream/20">
                                        <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-red-500 animate-pulse' : 'text-gastro-ink/30'}`} />
                                        <span className={`text-[10px] font-bold ${isUrgent ? 'text-red-500' : 'text-gastro-ink/40'}`}>
                                          {elapsed} min od objednania
                                        </span>
                                      </div>

                                      {/* Customer Info */}
                                      <div className="mb-3">
                                        <div className="text-xs font-bold">{order.customerName || 'Bez mena'}</div>
                                        {order.deliveryAddress && (
                                          <div className="text-[10px] text-gastro-ink/40">{order.deliveryAddress}</div>
                                        )}
                                      </div>

                                      {/* Items */}
                                      <div className="space-y-1.5 mb-4">
                                        {order.items.map((item, idx) => (
                                          <div key={idx} className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-gastro-ink/70">
                                              {item.quantity}x {item.menuItem?.name || item.itemName || 'Položka'}
                                            </span>
                                          </div>
                                        ))}
                                      </div>

                                      {/* Actions */}
                                      <div className="flex gap-2">
                                        {order.status === 'NEW' && (
                                          <button
                                            onClick={() => updateOrderStatus(order.id, 'ACCEPTED')}
                                            className="flex-1 bg-gastro-dark-green text-white py-2.5 rounded-full font-bold text-[10px] uppercase tracking-wider hover:scale-[1.02] transition-transform flex items-center justify-center gap-1.5"
                                          >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Prijať
                                          </button>
                                        )}
                                        {order.status === 'ACCEPTED' && (
                                          <button
                                            onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                                            className="flex-1 bg-gastro-orange text-white py-2.5 rounded-full font-bold text-[10px] uppercase tracking-wider hover:scale-[1.02] transition-transform flex items-center justify-center gap-1.5"
                                          >
                                            <Timer className="w-3.5 h-3.5" />
                                            Začať Prípravu
                                          </button>
                                        )}
                                        {order.status === 'PREPARING' && (
                                          <button
                                            onClick={() => updateOrderStatus(order.id, 'READY_FOR_PICKUP')}
                                            className="flex-1 bg-green-500 text-white py-2.5 rounded-full font-bold text-[10px] uppercase tracking-wider hover:scale-[1.02] transition-transform flex items-center justify-center gap-1.5"
                                          >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Hotovo
                                          </button>
                                        )}
                                        {order.status === 'READY_FOR_PICKUP' && order.type === 'DELIVERY' && (
                                          <button
                                            onClick={() => updateOrderStatus(order.id, 'OUT_FOR_DELIVERY')}
                                            className="flex-1 bg-blue-500 text-white py-2.5 rounded-full font-bold text-[10px] uppercase tracking-wider hover:scale-[1.02] transition-transform flex items-center justify-center gap-1.5"
                                          >
                                            <Truck className="w-3.5 h-3.5" />
                                            Na Cestu
                                          </button>
                                        )}
                                        <button
                                          onClick={() => printOrder(order)}
                                          className="p-2.5 bg-gastro-ink/5 rounded-full hover:bg-gastro-dark-green hover:text-white transition-all"
                                          title="Tlačiť lístok"
                                        >
                                          <Printer className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
                  {activeTab === 'couriers' && (
                    <div className="space-y-10">
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <h2 className="text-xl font-bold uppercase tracking-tight">Správa Kuriérov</h2>
                          <p className="text-[10px] text-gastro-ink/40 uppercase font-black tracking-widest mt-1">Pridávanie, priraďovanie a sledovanie doručovateľov</p>
                        </div>
                        <button 
                          onClick={() => setIsAddingCourier(true)}
                          className="bg-gastro-dark-green text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg shadow-gastro-dark-green/20 flex items-center gap-2 hover:scale-105 transition-all"
                        >
                          <Plus className="w-4 h-4" /> Pridať Kuriéra
                        </button>
                      </div>

                      {/* Courier Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                          { label: 'Celkom Kuriérov', value: couriers.length, icon: Truck, color: 'text-gastro-dark-green' },
                          { label: 'Online', value: couriers.filter(c => c.isOnline).length, icon: Wifi, color: 'text-green-500' },
                          { label: 'Offline', value: couriers.filter(c => !c.isOnline).length, icon: WifiOff, color: 'text-red-400' },
                          { label: 'Aktívne Dovozy', value: couriers.reduce((sum, c) => sum + c.activeOrdersCount, 0), icon: Navigation, color: 'text-blue-500' },
                        ].map((stat) => (
                          <div key={stat.label} className="bg-white p-6 rounded-3xl border border-gastro-beige/10 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <div className="text-2xl font-black tracking-tighter">{stat.value}</div>
                            <div className="text-xs font-bold text-gastro-ink/50 mt-1 uppercase tracking-widest">{stat.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Courier List */}
                      <div className="bg-white rounded-[32px] border border-gastro-beige/10 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gastro-cream/10 border-b border-gastro-beige/20">
                              {['Meno', 'Telefón', 'Vozidlo', 'Status', 'Aktívne Dovozy', 'Akcie'].map((h) => (
                                <th key={h} className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gastro-ink/40">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {couriers.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-6 py-20 text-center text-xs font-bold text-gastro-ink/30 uppercase tracking-widest">
                                  Žiadni kuriéri. Pridajte prvého kuriéra.
                                </td>
                              </tr>
                            ) : couriers.map((courier) => (
                              <tr key={courier.id} className="border-b border-gastro-beige/10 hover:bg-gastro-cream/5 transition-colors">
                                <td className="px-6 py-5">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${courier.isOnline ? 'bg-green-100 text-green-700' : 'bg-gastro-ink/5 text-gastro-ink/30'}`}>
                                      {courier.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-bold text-sm">{courier.name}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-5 text-sm font-bold text-gastro-ink/60">{courier.phone}</td>
                                <td className="px-6 py-5">
                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest bg-gastro-ink/5 border-gastro-ink/10 text-gastro-ink/50">
                                    {courier.vehicleType === 'CAR' ? '🚗 Auto' : courier.vehicleType === 'SCOOTER' ? '🛵 Skúter' : '🚲 Bicykel'}
                                  </span>
                                </td>
                                <td className="px-6 py-5">
                                  <button
                                    onClick={() => toggleCourierStatus(courier.id)}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${
                                      courier.isOnline 
                                        ? 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20' 
                                        : 'bg-red-500/5 text-red-400 border-red-500/10 hover:bg-red-500/10'
                                    }`}
                                  >
                                    {courier.isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                                    {courier.isOnline ? 'Online' : 'Offline'}
                                  </button>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${courier.activeOrdersCount > 0 ? 'bg-gastro-orange animate-pulse' : 'bg-gastro-ink/20'}`} />
                                    <span className="font-bold text-sm">{courier.activeOrdersCount}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => deleteCourier(courier.id)}
                                      className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all text-gastro-ink/30"
                                      title="Odstrániť kuriéra"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Assign Courier to Orders Section */}
                      <div className="bg-white rounded-[32px] border border-gastro-beige/10 shadow-sm p-8">
                        <h3 className="text-lg font-bold uppercase tracking-tight mb-6">Priradiť Kuriéra k Objednávke</h3>
                        <div className="space-y-4">
                          {orders.filter(o => o.type === 'DELIVERY' && o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length === 0 ? (
                            <p className="text-sm text-gastro-ink/40 italic">Žiadne aktívne objednávky na doručenie.</p>
                          ) : orders.filter(o => o.type === 'DELIVERY' && o.status !== 'COMPLETED' && o.status !== 'CANCELLED').map(order => (
                            <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl bg-gastro-cream/10 border border-gastro-beige/10">
                              <div>
                                <div className="font-bold text-sm">#{order.id.slice(-4).toUpperCase()}</div>
                                <div className="text-[10px] text-gastro-ink/40">{order.deliveryAddress}</div>
                              </div>
                              <div className="flex items-center gap-3">
                                <select
                                  value={order.courierId || ''}
                                  onChange={(e) => assignCourierToOrder(order.id, e.target.value)}
                                  className="bg-white border border-gastro-beige/20 rounded-xl px-4 py-2 text-xs font-bold outline-none cursor-pointer"
                                >
                                  <option value="">Bez kuriéra</option>
                                  {couriers.filter(c => c.isOnline).map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shifts & Earnings Management */}
                      <div className="bg-white rounded-[32px] border border-gastro-beige/10 shadow-sm p-8">
                        <h3 className="text-lg font-bold uppercase tracking-tight mb-6 flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-gastro-orange" />
                          Smeny a Výplaty Kuriérov
                        </h3>

                        {/* Courier Selector */}
                        <div className="flex items-center gap-4 mb-8">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gastro-ink/40">Vybrať kuriéra:</label>
                          <select
                            value={selectedShiftCourier}
                            onChange={(e) => {
                              setSelectedShiftCourier(e.target.value);
                              if (e.target.value) {
                                loadShifts(e.target.value);
                                loadEarnings(e.target.value);
                              } else {
                                setCourierShifts([]);
                                setCourierEarnings([]);
                              }
                            }}
                            className="bg-white border border-gastro-beige/20 rounded-xl px-4 py-2 text-xs font-bold outline-none cursor-pointer min-w-[200px]"
                          >
                            <option value="">-- Vyberte kuriéra --</option>
                            {couriers.map(c => (
                              <option key={c.id} value={c.id}>{c.name} ({c.vehicleType})</option>
                            ))}
                          </select>
                          {selectedShiftCourier && (
                            <button
                              onClick={() => setShowAddShift(true)}
                              className="bg-gastro-dark-green text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:scale-105 transition-all"
                            >
                              <Plus className="w-3 h-3" /> Nová Smena
                            </button>
                          )}
                        </div>

                        {selectedShiftCourier && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Shifts List */}
                            <div>
                              <h4 className="text-sm font-bold uppercase tracking-wider text-gastro-ink/50 mb-4 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Smeny
                              </h4>
                              {isLoadingShifts ? (
                                <div className="flex items-center justify-center py-10">
                                  <Loader2 className="w-6 h-6 animate-spin text-gastro-dark-green" />
                                </div>
                              ) : courierShifts.length === 0 ? (
                                <p className="text-xs text-gastro-ink/40 italic">Žiadne smeny pre tohto kuriéra.</p>
                              ) : (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                  {courierShifts.map((shift: any) => (
                                    <div key={shift.id} className="flex items-center justify-between p-4 rounded-2xl bg-gastro-cream/10 border border-gastro-beige/10">
                                      <div>
                                        <div className="text-xs font-bold text-gastro-dark-green">
                                          {new Date(shift.startTime).toLocaleDateString('sk-SK', { weekday: 'short', day: 'numeric', month: 'short' })}
                                        </div>
                                        <div className="text-[10px] text-gastro-ink/40">
                                          {new Date(shift.startTime).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}
                                          {' → '}
                                          {new Date(shift.endTime).toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}
                                          {shift.isPeak && <span className="ml-2 text-gastro-orange">★ Peak</span>}
                                        </div>
                                        <div className="text-[10px] font-bold text-gastro-dark-green mt-1">
                                          {Number(shift.earnings).toFixed(2)} €
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase ${
                                          shift.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                          shift.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                                          shift.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                          'bg-yellow-100 text-yellow-700'
                                        }`}>
                                          {shift.status === 'ACTIVE' ? 'Aktívna' : 
                                           shift.status === 'COMPLETED' ? 'Dokončená' : 
                                           shift.status === 'CANCELLED' ? 'Zrušená' : 'Naplánovaná'}
                                        </span>
                                        {shift.status === 'SCHEDULED' && (
                                          <div className="flex gap-1">
                                            <button
                                              onClick={() => updateShiftStatus(shift.id, 'ACTIVE')}
                                              className="p-1.5 bg-green-500 text-white rounded-lg hover:scale-110 transition-transform text-[10px]"
                                              title="Spustiť smenu"
                                            >
                                              ▶
                                            </button>
                                            <button
                                              onClick={() => updateShiftStatus(shift.id, 'CANCELLED')}
                                              className="p-1.5 bg-red-400 text-white rounded-lg hover:scale-110 transition-transform text-[10px]"
                                              title="Zrušiť smenu"
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        )}
                                        {shift.status === 'ACTIVE' && (
                                          <button
                                            onClick={() => updateShiftStatus(shift.id, 'COMPLETED')}
                                            className="p-1.5 bg-blue-500 text-white rounded-lg hover:scale-110 transition-transform text-[10px]"
                                            title="Ukončiť smenu"
                                          >
                                            ✓
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Earnings List */}
                            <div>
                              <h4 className="text-sm font-bold uppercase tracking-wider text-gastro-ink/50 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Výplaty
                              </h4>
                              {isLoadingEarnings ? (
                                <div className="flex items-center justify-center py-10">
                                  <Loader2 className="w-6 h-6 animate-spin text-gastro-dark-green" />
                                </div>
                              ) : courierEarnings.length === 0 ? (
                                <p className="text-xs text-gastro-ink/40 italic">Zatiaľ žiadne výplaty.</p>
                              ) : (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                  {courierEarnings.map((earning: any) => (
                                    <div key={earning.id} className="p-4 rounded-2xl bg-gastro-cream/10 border border-gastro-beige/10">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="text-xs font-bold text-gastro-dark-green">
                                          {Number(earning.total).toFixed(2)} €
                                        </div>
                                        <div className="text-[10px] text-gastro-ink/40">
                                          {new Date(earning.createdAt).toLocaleDateString('sk-SK')}
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {Number(earning.baseFee) > 0 && (
                                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-gastro-dark-green/10 text-gastro-dark-green font-bold">
                                            Základ {Number(earning.baseFee).toFixed(2)}€
                                          </span>
                                        )}
                                        {Number(earning.distanceBonus) > 0 && (
                                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                                            Vzdialenosť {Number(earning.distanceBonus).toFixed(2)}€
                                          </span>
                                        )}
                                        {Number(earning.batchBonus) > 0 && (
                                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">
                                            Batch {Number(earning.batchBonus).toFixed(2)}€
                                          </span>
                                        )}
                                        {Number(earning.peakHourBonus) > 0 && (
                                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold">
                                            Peak {Number(earning.peakHourBonus).toFixed(2)}€
                                          </span>
                                        )}
                                        {Number(earning.performanceBonus) > 0 && (
                                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">
                                            Výkon {Number(earning.performanceBonus).toFixed(2)}€
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Add Shift Modal */}
                      {showAddShift && selectedShiftCourier && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gastro-dark-green/20 backdrop-blur-sm">
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden"
                          >
                            <div className="p-8 border-b border-gastro-beige/20 flex justify-between items-center bg-gastro-cream/10">
                              <h3 className="text-xl font-bold uppercase tracking-tight">Nová Smena</h3>
                              <button onClick={() => setShowAddShift(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                                <X className="w-5 h-5 text-gastro-ink/40" />
                              </button>
                            </div>
                            <form onSubmit={handleAddShift} className="p-8 space-y-5">
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gastro-ink/40 ml-4">Začiatok smeny</label>
                                <input 
                                  required
                                  type="datetime-local"
                                  value={newShiftStart}
                                  onChange={e => setNewShiftStart(e.target.value)}
                                  className="w-full bg-gastro-cream/10 border border-gastro-beige rounded-2xl px-5 py-3 outline-none focus:border-gastro-dark-green transition-colors text-sm font-bold"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gastro-ink/40 ml-4">Koniec smeny</label>
                                <input 
                                  required
                                  type="datetime-local"
                                  value={newShiftEnd}
                                  onChange={e => setNewShiftEnd(e.target.value)}
                                  className="w-full bg-gastro-cream/10 border border-gastro-beige rounded-2xl px-5 py-3 outline-none focus:border-gastro-dark-green transition-colors text-sm font-bold"
                                />
                              </div>
                              <div className="flex items-center gap-3 px-4">
                                <input 
                                  type="checkbox"
                                  id="isPeak"
                                  checked={newShiftIsPeak}
                                  onChange={e => setNewShiftIsPeak(e.target.checked)}
                                  className="w-5 h-5 accent-gastro-dark-green"
                                />
                                <label htmlFor="isPeak" className="text-xs font-bold uppercase tracking-widest text-gastro-ink/60 cursor-pointer">
                                  Peak hodina (vyšší bonus)
                                </label>
                              </div>
                              <button 
                                disabled={isAddingShift}
                                className="w-full bg-gastro-dark-green text-white py-4 rounded-full font-bold text-sm shadow-xl shadow-gastro-dark-green/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50"
                              >
                                {isAddingShift ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Vytvoriť Smenu'}
                              </button>
                            </form>
                          </motion.div>
                        </div>
                      )}

                      {/* Add Courier Modal */}
                      {isAddingCourier && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gastro-dark-green/20 backdrop-blur-sm">
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden"
                          >
                            <div className="p-8 border-b border-gastro-beige/20 flex justify-between items-center bg-gastro-cream/10">
                              <h3 className="text-xl font-bold uppercase tracking-tight">Nový Kuriér</h3>
                              <button onClick={() => setIsAddingCourier(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                                <X className="w-5 h-5 text-gastro-ink/40" />
                              </button>
                            </div>
                            <form onSubmit={handleAddCourier} className="p-8 space-y-5">
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gastro-ink/40 ml-4">Meno</label>
                                <input 
                                  required
                                  value={newCourierName}
                                  onChange={e => setNewCourierName(e.target.value)}
                                  placeholder="Meno a priezvisko"
                                  className="w-full bg-gastro-cream/10 border border-gastro-beige rounded-2xl px-5 py-3 outline-none focus:border-gastro-dark-green transition-colors text-sm font-bold"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gastro-ink/40 ml-4">Telefón</label>
                                <input 
                                  required
                                  value={newCourierPhone}
                                  onChange={e => setNewCourierPhone(e.target.value)}
                                  placeholder="0900 000 000"
                                  className="w-full bg-gastro-cream/10 border border-gastro-beige rounded-2xl px-5 py-3 outline-none focus:border-gastro-dark-green transition-colors text-sm font-bold"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gastro-ink/40 ml-4">Typ Vozidla</label>
                                <select
                                  value={newCourierVehicle}
                                  onChange={e => setNewCourierVehicle(e.target.value)}
                                  className="w-full bg-gastro-cream/10 border border-gastro-beige rounded-2xl px-5 py-3 outline-none focus:border-gastro-dark-green transition-colors text-sm font-bold appearance-none cursor-pointer"
                                >
                                  <option value="CAR">🚗 Auto</option>
                                  <option value="SCOOTER">🛵 Skúter</option>
                                  <option value="BICYCLE">🚲 Bicykel</option>
                                </select>
                              </div>
                              <button 
                                disabled={isAddingCourierSubmitting}
                                className="w-full bg-gastro-dark-green text-white py-4 rounded-full font-bold text-sm shadow-xl shadow-gastro-dark-green/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50"
                              >
                                {isAddingCourierSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pridať Kuriéra'}
                              </button>
                            </form>
                          </motion.div>
                        </div>
                      )}
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
                      {/* Top-level KPI Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                          { label: 'Priemerná Objednávka', value: '18.40 €', icon: TrendingUp, color: 'text-green-500' },
                          { label: 'Unikátni Hostia', value: '142', icon: Users, color: 'text-blue-500' },
                          { label: 'Pozitívne Recenzie', value: '98%', icon: CheckCircle2, color: 'text-orange-500' },
                          { label: 'Delivery Cost', value: '8.2 %', icon: Truck, color: 'text-gastro-dark-green' },
                        ].map((stat) => (
                          <div key={stat.label} className="bg-white p-6 rounded-[32px] border border-gastro-beige/10 shadow-sm">
                            <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
                            <div className="text-2xl font-black tracking-tight">{stat.value}</div>
                            <div className="text-[10px] font-bold text-gastro-ink/30 uppercase tracking-[0.2em] mt-1">{stat.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Charts Row */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-[40px] border border-gastro-beige/10 shadow-sm h-[400px]">
                          <div className="flex items-center justify-between mb-6">
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

                        <div className="bg-white p-8 rounded-[40px] border border-gastro-beige/10 shadow-sm h-[400px]">
                          <div className="flex items-center justify-between mb-6">
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

                      {/* Delivery Analytics Section */}
                      <div className="bg-white rounded-[40px] border border-gastro-beige/10 shadow-sm p-8">
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <h3 className="text-lg font-bold">📦 Delivery Analytics</h3>
                            <p className="text-xs text-gastro-ink/40">Štatistiky doručení a výkonnosť kuriérov</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                          {[
                            { label: 'Doručení Dnes', value: '24', sub: 'z toho 18 včas', icon: CheckCircle2, color: 'text-green-500' },
                            { label: 'Priem. Čas', value: '18 min', sub: 'o 2 min rýchlejšie', icon: Clock, color: 'text-blue-500' },
                            { label: 'Aktívni Kuriéri', value: '4', sub: '2 bicykel, 2 auto', icon: Truck, color: 'text-gastro-dark-green' },
                            { label: 'Batch Efektivita', value: '34 %', sub: 'o 5 % viac ako včera', icon: TrendingUp, color: 'text-orange-500' },
                          ].map((stat) => (
                            <div key={stat.label} className="p-5 rounded-2xl bg-gastro-cream/10 border border-gastro-beige/10">
                              <div className="flex items-center justify-between mb-2">
                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                              </div>
                              <div className="text-xl font-black tracking-tight">{stat.value}</div>
                              <div className="text-[10px] font-bold text-gastro-ink/30 uppercase tracking-[0.2em] mt-1">{stat.label}</div>
                              <div className="text-[9px] text-gastro-ink/40 mt-0.5">{stat.sub}</div>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="h-[250px]">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-gastro-ink/40 mb-4">Doručenia podľa hodiny</h4>
                            <ResponsiveContainer width="100%" height="85%">
                              <BarChart data={[
                                { time: '10h', count: 2 }, { time: '11h', count: 5 }, { time: '12h', count: 12 },
                                { time: '13h', count: 8 }, { time: '14h', count: 4 }, { time: '15h', count: 3 },
                                { time: '16h', count: 6 }, { time: '17h', count: 14 }, { time: '18h', count: 18 },
                                { time: '19h', count: 15 }, { time: '20h', count: 9 }, { time: '21h', count: 4 },
                              ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold', fill: '#9ca3af'}} />
                                <YAxis hide />
                                <Tooltip cursor={{fill: '#f8f9fa'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                <Bar dataKey="count" fill="#2D4F1E" radius={[6, 6, 0, 0]} barSize={24} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="h-[250px]">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-gastro-ink/40 mb-4">Doručenia podľa zóny</h4>
                            <ResponsiveContainer width="100%" height="85%">
                              <BarChart data={[
                                { name: 'Hlohovec', value: 42 }, { name: 'Šulekovo', value: 18 },
                                { name: 'Leopoldov', value: 12 }, { name: 'Madunice', value: 8 },
                                { name: 'Červeník', value: 5 }, { name: 'Koplotovce', value: 3 },
                              ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold', fill: '#9ca3af'}} />
                                <YAxis hide />
                                <Tooltip cursor={{fill: '#f8f9fa'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                <Bar dataKey="value" fill="#D97706" radius={[6, 6, 0, 0]} barSize={32} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      {/* Peak Hours Analysis */}
                      <div className="bg-white rounded-[40px] border border-gastro-beige/10 shadow-sm p-8">
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <h3 className="text-lg font-bold">⏰ Peak Hour Analýza</h3>
                            <p className="text-xs text-gastro-ink/40">Vytíženie počas špičkových hodín</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="h-[250px]">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-gastro-ink/40 mb-4">Objednávky počas dňa</h4>
                            <ResponsiveContainer width="100%" height="85%">
                              <AreaChart data={[
                                { time: '08', orders: 0 }, { time: '09', orders: 2 }, { time: '10', orders: 5 },
                                { time: '11', orders: 15 }, { time: '12', orders: 28 }, { time: '13', orders: 22 },
                                { time: '14', orders: 10 }, { time: '15', orders: 8 }, { time: '16', orders: 12 },
                                { time: '17', orders: 25 }, { time: '18', orders: 35 }, { time: '19', orders: 30 },
                                { time: '20', orders: 18 }, { time: '21', orders: 8 }, { time: '22', orders: 3 },
                              ]}>
                                <defs>
                                  <linearGradient id="peakGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.15}/>
                                    <stop offset="95%" stopColor="#D97706" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold', fill: '#9ca3af'}} />
                                <YAxis hide />
                                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                <Area type="monotone" dataKey="orders" stroke="#D97706" strokeWidth={2} fillOpacity={1} fill="url(#peakGradient)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-gastro-ink/40 mb-4">Štatistiky špičky</h4>
                            <div className="grid grid-cols-2 gap-4">
                              {[
                                { label: 'Ranná Špička', value: '11:00–14:00', detail: 'Ø 22 obj./hod', color: 'bg-orange-100 text-orange-700' },
                                { label: 'Večerná Špička', value: '17:00–20:00', detail: 'Ø 30 obj./hod', color: 'bg-orange-100 text-orange-700' },
                                { label: 'Najvyťaženejšia', value: '18:00–19:00', detail: '35 objednávok', color: 'bg-red-100 text-red-700' },
                                { label: 'Mimo Špičky', value: '14:00–17:00', detail: 'Ø 8 obj./hod', color: 'bg-green-100 text-green-700' },
                              ].map((item) => (
                                <div key={item.label} className="p-4 rounded-2xl bg-gastro-cream/10 border border-gastro-beige/10">
                                  <div className="text-[9px] font-bold uppercase tracking-widest text-gastro-ink/40 mb-1">{item.label}</div>
                                  <div className="text-sm font-black text-gastro-dark-green">{item.value}</div>
                                  <div className="text-[10px] text-gastro-ink/50 mt-0.5">{item.detail}</div>
                                </div>
                              ))}
                            </div>
                            <div className="p-4 rounded-2xl bg-gastro-cream/20 border border-gastro-beige/10">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-[9px] font-bold uppercase tracking-widest text-gastro-ink/40">Peak Bonus (kuriéri)</div>
                                  <div className="text-lg font-black text-gastro-orange mt-1">+15 %</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-[9px] font-bold uppercase tracking-widest text-gastro-ink/40">Aktuálny stav</div>
                                  <div className="text-xs font-bold text-gastro-dark-green mt-1">V špičke</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Profitability & Marketplace Comparison */}
                      <div className="bg-white rounded-[40px] border border-gastro-beige/10 shadow-sm p-8">
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <h3 className="text-lg font-bold">💰 Profitability & Marketplace Comparison</h3>
                            <p className="text-xs text-gastro-ink/40">Porovnanie nákladov s Wolt/Bolt</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Cost Comparison */}
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-gastro-ink/40 mb-4">Náklady na doručenie</h4>
                            <div className="space-y-4">
                              {[
                                { platform: 'Jašterka Delivery', cost: '8.2 %', color: 'bg-gastro-dark-green', barWidth: '30%' },
                                { platform: 'Wolt', cost: '25–30 %', color: 'bg-blue-500', barWidth: '100%' },
                                { platform: 'Bolt Food', cost: '22–28 %', color: 'bg-green-500', barWidth: '95%' },
                              ].map((item) => (
                                <div key={item.platform} className="space-y-1.5">
                                  <div className="flex justify-between text-xs">
                                    <span className="font-bold">{item.platform}</span>
                                    <span className="font-black text-gastro-dark-green">{item.cost}</span>
                                  </div>
                                  <div className="h-3 bg-gastro-ink/5 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${item.color} opacity-80`} style={{ width: item.barWidth }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-6 p-4 rounded-2xl bg-green-50 border border-green-200">
                              <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                <div>
                                  <div className="text-sm font-bold text-green-800">Úspora oproti Wolt/Bolt</div>
                                  <div className="text-xs text-green-600 mt-1">Pri 100 objednávkach/mesiac ušetríte približne 1 200–2 500 € na províziách.</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Efficiency Metrics */}
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-gastro-ink/40 mb-4">Delivery Efficiency</h4>
                            <div className="space-y-5">
                              {[
                                { label: 'Priem. km/objednávka', value: '2.4 km', target: '< 3 km', status: '✅', color: 'text-green-600' },
                                { label: 'Využitie kuriérov', value: '68 %', target: '> 70 %', status: '⚠️', color: 'text-yellow-600' },
                                { label: 'Batch úspešnosť', value: '34 %', target: '> 40 %', status: '📈', color: 'text-blue-600' },
                                { label: 'Náklad/doručenie', value: '1.85 €', target: '< 2.00 €', status: '✅', color: 'text-green-600' },
                                { label: 'Včasné doručenie', value: '92 %', target: '> 90 %', status: '✅', color: 'text-green-600' },
                                { label: 'Akceptácia kuriérmi', value: '85 %', target: '> 80 %', status: '✅', color: 'text-green-600' },
                              ].map((metric) => (
                                <div key={metric.label} className="flex items-center justify-between p-3 rounded-xl bg-gastro-cream/10 border border-gastro-beige/10">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm">{metric.status}</span>
                                    <div>
                                      <div className="text-[10px] font-bold uppercase tracking-widest text-gastro-ink/40">{metric.label}</div>
                                      <div className="text-xs font-bold text-gastro-dark-green">{metric.value}</div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-[9px] text-gastro-ink/30">Cieľ</div>
                                    <div className={`text-[10px] font-bold ${metric.color}`}>{metric.target}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Courier Leaderboard */}
                      <div className="bg-white rounded-[40px] border border-gastro-beige/10 shadow-sm p-8">
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <h3 className="text-lg font-bold">🏆 Courier Leaderboard</h3>
                            <p className="text-xs text-gastro-ink/40">Najlepší kuriéri podľa výkonnosti</p>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-gastro-beige/20">
                                {['#', 'Meno', 'Doručenia', 'Ø Čas', 'Hodnotenie', 'Vzdialenosť', 'Zárobok'].map((h) => (
                                  <th key={h} className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-gastro-ink/30">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {[
                                { rank: 1, name: 'Peter K.', deliveries: 42, avgTime: '14 min', rating: 4.9, distance: '68 km', earnings: '186.50 €', badge: '🥇' },
                                { rank: 2, name: 'Ján M.', deliveries: 38, avgTime: '16 min', rating: 4.8, distance: '72 km', earnings: '172.30 €', badge: '🥈' },
                                { rank: 3, name: 'Mária Z.', deliveries: 35, avgTime: '15 min', rating: 4.7, distance: '55 km', earnings: '158.20 €', badge: '🥉' },
                                { rank: 4, name: 'Tomáš H.', deliveries: 28, avgTime: '19 min', rating: 4.5, distance: '48 km', earnings: '134.80 €', badge: '' },
                                { rank: 5, name: 'Lucia B.', deliveries: 22, avgTime: '17 min', rating: 4.6, distance: '42 km', earnings: '112.40 €', badge: '' },
                              ].map((courier) => (
                                <tr key={courier.rank} className="border-b border-gastro-beige/5 hover:bg-gastro-cream/5 transition-colors">
                                  <td className="px-4 py-4">
                                    <span className="text-lg font-black">{courier.badge || `#${courier.rank}`}</span>
                                  </td>
                                  <td className="px-4 py-4 font-bold text-sm">{courier.name}</td>
                                  <td className="px-4 py-4 font-bold text-sm">{courier.deliveries}</td>
                                  <td className="px-4 py-4 text-sm text-gastro-ink/60">{courier.avgTime}</td>
                                  <td className="px-4 py-4">
                                    <span className="inline-flex items-center gap-1 text-sm font-bold text-yellow-600">
                                      <Star className="w-3 h-3 fill-yellow-500" /> {courier.rating}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 text-sm text-gastro-ink/60">{courier.distance}</td>
                                  <td className="px-4 py-4 font-black text-gastro-dark-green">{courier.earnings}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
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

                  {activeTab === 'dispatch' && (
                    <div className="space-y-10">
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <h2 className="text-xl font-bold uppercase tracking-tight">Dispatch Engine</h2>
                          <p className="text-[10px] text-gastro-ink/40 uppercase font-black tracking-widest mt-1">Smart priraďovanie objednávok kuriérom</p>
                        </div>
                      </div>

                      {/* Dispatch Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                          { label: 'Čaká na Dispatch', value: orders.filter(o => o.type === 'DELIVERY' && o.status === 'NEW' && !o.courierId).length, icon: Clock, color: 'text-yellow-500' },
                          { label: 'Online Kuriéri', value: couriers.filter(c => c.isOnline).length, icon: Wifi, color: 'text-green-500' },
                          { label: 'Aktívne Dovozy', value: orders.filter(o => o.type === 'DELIVERY' && o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length, icon: Navigation, color: 'text-blue-500' },
                          { label: 'Doručené Dnes', value: orders.filter(o => o.type === 'DELIVERY' && o.status === 'COMPLETED').length, icon: CheckCircle2, color: 'text-gastro-dark-green' },
                        ].map((stat) => (
                          <div key={stat.label} className="bg-white p-6 rounded-3xl border border-gastro-beige/10 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <div className="text-2xl font-black tracking-tighter">{stat.value}</div>
                            <div className="text-xs font-bold text-gastro-ink/50 mt-1 uppercase tracking-widest">{stat.label}</div>
                          </div>
                        ))}
                      </div>

                       {/* Smart Assignment Section */}
                       <div className="bg-white rounded-[32px] border border-gastro-beige/10 shadow-sm p-8">
                         <h3 className="text-lg font-bold uppercase tracking-tight mb-6 flex items-center gap-3">
                           <Navigation className="w-5 h-5 text-gastro-orange" />
                           Smart Priradenie
                         </h3>

                         {/* Auto-Dispatch Controls */}
                         <div className="flex flex-wrap gap-3 mb-6 p-4 rounded-2xl bg-gastro-cream/20 border border-gastro-beige/10">
                           <button
                             onClick={async () => {
                               const pendingOrders = orders.filter(o => o.type === 'DELIVERY' && o.status === 'NEW' && !o.courierId);
                               if (pendingOrders.length === 0) return;
                               const order = pendingOrders[0];
                               try {
                                 const res = await fetch('/api/admin/dispatch/auto-assign', {
                                   method: 'POST',
                                   headers: { 'Content-Type': 'application/json' },
                                   body: JSON.stringify({ orderId: order.id, orderCity: order.deliveryCity || 'Hlohovec', orderAddress: order.deliveryAddress }),
                                 });
                                 if (res.ok) {
                                   const data = await res.json();
                                   if (data.success) {
                                     alert(`✅ Auto-priradené: ${data.assignedCourier.name} (skóre: ${data.assignedCourier.score})`);
                                     loadOrders();
                                     loadCouriers();
                                   } else {
                                     alert(`⚠️ ${data.error}`);
                                   }
                                 }
                               } catch (err) {
                                 console.error('Auto-dispatch failed:', err);
                               }
                             }}
                             className="bg-gastro-dark-green text-white px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-gastro-dark-green/20"
                           >
                             <Navigation className="w-4 h-4" />
                             Auto-Priradiť (1)
                           </button>
                           <button
                             onClick={async () => {
                               const pendingOrders = orders.filter(o => o.type === 'DELIVERY' && o.status === 'NEW' && !o.courierId);
                               if (pendingOrders.length === 0) return;
                               try {
                                 const res = await fetch('/api/admin/dispatch/batch-assign', {
                                   method: 'POST',
                                   headers: { 'Content-Type': 'application/json' },
                                   body: JSON.stringify({ orderIds: pendingOrders.map(o => o.id) }),
                                 });
                                 if (res.ok) {
                                   const data = await res.json();
                                   if (data.success && data.assignments.length > 0) {
                                     alert(`✅ Batch priradené: ${data.assignments.length} objednávok kuriérom`);
                                     loadOrders();
                                     loadCouriers();
                                   } else {
                                     alert(`⚠️ ${data.message || data.error || 'Batch zlyhal'}`);
                                   }
                                 }
                               } catch (err) {
                                 console.error('Batch dispatch failed:', err);
                               }
                             }}
                             className="bg-gastro-orange text-white px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-gastro-orange/20"
                           >
                             <Loader2 className="w-4 h-4" />
                             Batch Priradiť ({orders.filter(o => o.type === 'DELIVERY' && o.status === 'NEW' && !o.courierId).length})
                           </button>
                           <button
                             onClick={async () => {
                               const pendingOrders = orders.filter(o => o.type === 'DELIVERY' && o.status === 'NEW' && !o.courierId);
                               if (pendingOrders.length === 0) return;
                               const order = pendingOrders[0];
                               try {
                                 const res = await fetch('/api/admin/dispatch/suggestions', {
                                   method: 'POST',
                                   headers: { 'Content-Type': 'application/json' },
                                   body: JSON.stringify({ orderCity: order.deliveryCity || 'Hlohovec' }),
                                 });
                                 if (res.ok) {
                                   const data = await res.json();
                                   if (data.suggestions && data.suggestions.length > 0) {
                                     const top = data.suggestions.filter((s: any) => s.suitability === 'high');
                                     alert(`💡 Návrhy: ${top.length} vysoko vhodných kuriérov\n${data.suggestions.map((s: any) => `• ${s.name} (${s.vehicleType}) - ${s.suitability}`).join('\n')}`);
                                   } else {
                                     alert('⚠️ Žiadni vhodní kuriéri');
                                   }
                                 }
                               } catch (err) {
                                 console.error('Suggestions failed:', err);
                               }
                             }}
                             className="bg-white border border-gastro-beige/20 text-gastro-ink px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 hover:bg-gastro-cream/10 transition-all"
                           >
                             <Users className="w-4 h-4" />
                             Návrhy
                           </button>
                         </div>
                         
                         {/* Pending Dispatch Orders */}
                         <div className="space-y-4">
                           {orders.filter(o => o.type === 'DELIVERY' && o.status === 'NEW' && !o.courierId).length === 0 ? (
                             <p className="text-sm text-gastro-ink/40 italic">Všetky objednávky sú priradené.</p>
                           ) : (
                             orders.filter(o => o.type === 'DELIVERY' && o.status === 'NEW' && !o.courierId).map(order => (
                               <div key={order.id} className="flex items-center justify-between p-5 rounded-2xl bg-yellow-50/50 border border-yellow-200/30">
                                 <div className="flex-1">
                                   <div className="flex items-center gap-3 mb-1">
                                     <span className="font-bold text-sm">#{order.id.slice(-4).toUpperCase()}</span>
                                     <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-bold uppercase tracking-wider">Čaká</span>
                                   </div>
                                   <div className="text-xs text-gastro-ink/60">{order.deliveryAddress}</div>
                                   <div className="text-[10px] text-gastro-ink/40 mt-1">{order.customerName} • {Number(order.total).toFixed(2)} €</div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                   <select
                                     value={order.courierId || ''}
                                     onChange={(e) => assignCourierToOrder(order.id, e.target.value)}
                                     className="bg-white border border-gastro-beige/20 rounded-xl px-4 py-2 text-xs font-bold outline-none cursor-pointer"
                                   >
                                     <option value="">Vybrať kuriéra</option>
                                     {couriers.filter(c => c.isOnline).map(c => (
                                       <option key={c.id} value={c.id}>
                                         {c.name} ({c.vehicleType === 'CAR' ? '🚗' : c.vehicleType === 'SCOOTER' ? '🛵' : '🚲'})
                                       </option>
                                     ))}
                                   </select>
                                 </div>
                               </div>
                             ))
                           )}
                         </div>
                       </div>

                      {/* Active Deliveries */}
                      <div className="bg-white rounded-[32px] border border-gastro-beige/10 shadow-sm p-8">
                        <h3 className="text-lg font-bold uppercase tracking-tight mb-6 flex items-center gap-3">
                          <Truck className="w-5 h-5 text-gastro-dark-green" />
                          Aktívne Dovozy
                        </h3>
                        <div className="space-y-4">
                          {orders.filter(o => o.type === 'DELIVERY' && o.courierId && o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length === 0 ? (
                            <p className="text-sm text-gastro-ink/40 italic">Žiadne aktívne dovozy.</p>
                          ) : (
                            orders.filter(o => o.type === 'DELIVERY' && o.courierId && o.status !== 'COMPLETED' && o.status !== 'CANCELLED').map(order => {
                              const assignedCourier = couriers.find(c => c.id === order.courierId);
                              return (
                                <div key={order.id} className="flex items-center justify-between p-5 rounded-2xl bg-gastro-cream/10 border border-gastro-beige/10">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                      <span className="font-bold text-sm">#{order.id.slice(-4).toUpperCase()}</span>
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                        order.status === 'DELIVERING' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                                      }`}>
                                        {order.status === 'DELIVERING' ? 'Na ceste' : 'Pripravené'}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gastro-ink/60">{order.deliveryAddress}</div>
                                    <div className="text-[10px] text-gastro-ink/40 mt-1">
                                      Kuriér: {assignedCourier?.name || 'Neznámy'} • {Number(order.total).toFixed(2)} €
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <select
                                      value={order.courierId || ''}
                                      onChange={(e) => assignCourierToOrder(order.id, e.target.value)}
                                      className="bg-white border border-gastro-beige/20 rounded-xl px-3 py-1.5 text-[10px] font-bold outline-none cursor-pointer"
                                    >
                                      <option value="">Bez kuriéra</option>
                                      {couriers.filter(c => c.isOnline).map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Courier Availability */}
                      <div className="bg-white rounded-[32px] border border-gastro-beige/10 shadow-sm p-8">
                        <h3 className="text-lg font-bold uppercase tracking-tight mb-6 flex items-center gap-3">
                          <Wifi className="w-5 h-5 text-green-500" />
                          Dostupnosť Kuriérov
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {couriers.length === 0 ? (
                            <p className="text-sm text-gastro-ink/40 italic col-span-full">Žiadni kuriéri v systéme.</p>
                          ) : couriers.map(courier => (
                            <div key={courier.id} className={`p-5 rounded-2xl border transition-all ${
                              courier.isOnline ? 'bg-green-50/50 border-green-200/30' : 'bg-gastro-ink/5 border-gastro-beige/10'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${courier.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gastro-ink/20'}`} />
                                  <span className="font-bold text-sm">{courier.name}</span>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gastro-ink/40">
                                  {courier.vehicleType === 'CAR' ? '🚗' : courier.vehicleType === 'SCOOTER' ? '🛵' : '🚲'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gastro-ink/40">{courier.activeOrdersCount} aktívnych</span>
                                <button
                                  onClick={() => toggleCourierStatus(courier.id)}
                                  className={`text-[10px] font-bold uppercase tracking-wider ${
                                    courier.isOnline ? 'text-green-600' : 'text-red-400'
                                  }`}
                                >
                                  {courier.isOnline ? 'Online' : 'Offline'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Smart Batching Section */}
                      <div className="bg-white rounded-[32px] border border-gastro-beige/10 shadow-sm p-8">
                        <h3 className="text-lg font-bold uppercase tracking-tight mb-6 flex items-center gap-3">
                          <Loader2 className="w-5 h-5 text-gastro-orange" />
                          Smart Batching
                        </h3>
                        <p className="text-xs text-gastro-ink/40 mb-6">Automatické zoskupenie objednávok podľa smeru (mesta) pre optimálne doručenie.</p>

                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch('/api/admin/dispatch/smart-batch', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                              });
                              if (res.ok) {
                                const data = await res.json();
                                if (data.success && data.batches.length > 0) {
                                  let msg = `🧠 Smart Batching Výsledok\n\n`;
                                  msg += `Algoritmus: ${data.algorithm}\n`;
                                  msg += `Spracovaných: ${data.totalPendingOrders} objednávok\n`;
                                  msg += `Vytvorených: ${data.totalBatches} batchov\n\n`;
                                  
                                  for (const batch of data.batches) {
                                    msg += `📦 Batch: ${batch.clusterName}\n`;
                                    msg += `   Objednávky: ${batch.orders.length}\n`;
                                    msg += `   Vzdialenosť: ${batch.totalDistanceKm} km\n`;
                                    msg += `   Čas: ${batch.totalEstimatedMin} min\n`;
                                    msg += `   Batch Bonus: ${batch.batchBonus} €\n`;
                                    if (batch.assignedCourier) {
                                      msg += `   Kuriér: ${batch.assignedCourier.name} (${batch.assignedCourier.vehicleType})\n`;
                                    }
                                    msg += `   Zákazníci: ${batch.orders.map((o: any) => o.customerName || 'Neznámy').join(', ')}\n\n`;
                                  }
                                  
                                  alert(msg);
                                  loadOrders();
                                } else {
                                  alert(`⚠️ ${data.message || data.error || 'Žiadne batche na vytvorenie'}`);
                                }
                              }
                            } catch (err) {
                              console.error('Smart batching failed:', err);
                            }
                          }}
                          className="bg-gradient-to-r from-gastro-dark-green to-gastro-orange text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl shadow-gastro-dark-green/20 flex items-center gap-2 hover:scale-105 transition-all mb-6"
                        >
                          <Loader2 className="w-4 h-4" />
                          Analyzovať a Vytvoriť Batche
                        </button>

                        <div className="p-4 rounded-2xl bg-gastro-cream/20 border border-gastro-beige/10">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gastro-ink/50 mb-3">Ako to funguje:</h4>
                          <ul className="space-y-2 text-[11px] text-gastro-ink/60">
                            <li className="flex items-start gap-2">
                              <span className="text-gastro-dark-green font-bold mt-0.5">1.</span>
                              <span>Systém zoskupí nepriradené objednávky podľa mesta (Hlohovec, Šulekovo, Leopoldov...)</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-gastro-dark-green font-bold mt-0.5">2.</span>
                              <span>Objednávky v rovnakom smere (napr. Šulekovo + Koplotovce) sa spoja do jedného batchu</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-gastro-dark-green font-bold mt-0.5">3.</span>
                              <span>Každý batch dostane najvhodnejšieho kuriéra (auto pre diaľku, bicykel pre mesto)</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-gastro-dark-green font-bold mt-0.5">4.</span>
                              <span>Kuriér dostane batch bonus (1.5€ - 4€) podľa počtu objednávok v batche</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* Route Optimization Section */}
                      <div className="bg-white rounded-[32px] border border-gastro-beige/10 shadow-sm p-8">
                        <h3 className="text-lg font-bold uppercase tracking-tight mb-6 flex items-center gap-3">
                          <MapIcon className="w-5 h-5 text-gastro-orange" />
                          Optimalizácia Trás
                        </h3>
                        <p className="text-xs text-gastro-ink/40 mb-6">Optimalizuj poradie doručenia pre každého kuriéra pomocou Google Maps Distance Matrix.</p>

                        <div className="space-y-4">
                          {couriers.filter(c => c.isOnline).length === 0 ? (
                            <p className="text-sm text-gastro-ink/40 italic">Žiadni online kuriéri na optimalizáciu.</p>
                          ) : (
                            couriers.filter(c => c.isOnline).map(courier => {
                              const activeDeliveries = orders.filter(o => o.type === 'DELIVERY' && o.courierId === courier.id && o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
                              return (
                                <div key={courier.id} className="p-5 rounded-2xl bg-gastro-cream/10 border border-gastro-beige/10">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                                      <span className="font-bold text-sm">{courier.name}</span>
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-gastro-ink/40">
                                        {courier.vehicleType === 'CAR' ? '🚗' : courier.vehicleType === 'SCOOTER' ? '🛵' : '🚲'}
                                      </span>
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                                        {activeDeliveries.length} doručení
                                      </span>
                                    </div>
                                    <button
                                      onClick={async () => {
                                        try {
                                          const res = await fetch('/api/admin/dispatch/optimize-route', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ courierId: courier.id }),
                                          });
                                          if (res.ok) {
                                            const data = await res.json();
                                            if (data.optimized) {
                                              alert(`✅ Trasa optimalizovaná!\n\nCelková vzdialenosť: ${data.totalDistanceKm} km\nCelkový čas: ${data.totalDurationMin} min\nZastávky: ${data.stops}\n\n${data.route.map((s: any) => `📍 ${s.stop}. ${s.customerName} - ${s.address} (${s.distanceKm} km, ${s.estimatedMinutes} min)`).join('\n')}`);
                                              loadOrders();
                                            } else {
                                              alert(`⚠️ ${data.message || 'Optimalizácia zlyhala'}`);
                                            }
                                          }
                                        } catch (err) {
                                          console.error('Route optimization failed:', err);
                                        }
                                      }}
                                      disabled={activeDeliveries.length === 0}
                                      className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 transition-all ${
                                        activeDeliveries.length > 0
                                          ? 'bg-gastro-orange text-white hover:scale-105 shadow-lg shadow-gastro-orange/20'
                                          : 'bg-gastro-ink/5 text-gastro-ink/30 cursor-not-allowed'
                                      }`}
                                    >
                                      <MapIcon className="w-3.5 h-3.5" />
                                      Optimalizovať ({activeDeliveries.length})
                                    </button>
                                  </div>
                                  {activeDeliveries.length > 0 && (
                                    <div className="space-y-2 mt-3 pl-4 border-l-2 border-gastro-orange/30">
                                      {activeDeliveries.map((order, idx) => (
                                        <div key={order.id} className="flex items-center gap-3 text-xs">
                                          <span className="w-5 h-5 rounded-full bg-gastro-orange/10 text-gastro-orange font-bold flex items-center justify-center text-[10px]">{idx + 1}</span>
                                          <span className="font-medium">#{order.id.slice(-4).toUpperCase()}</span>
                                          <span className="text-gastro-ink/40">{order.deliveryAddress}</span>
                                          <span className="text-gastro-ink/40">{Number(order.total).toFixed(2)} €</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'leaderboard' && (
                    <div className="space-y-10">
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <h2 className="text-xl font-bold uppercase tracking-tight">Rebríček Kuriérov</h2>
                          <p className="text-[10px] text-gastro-ink/40 uppercase font-black tracking-widest mt-1">Gamifikácia, levely a výkonnostné štatistiky</p>
                        </div>
                        <button 
                          onClick={() => { loadLeaderboard(); loadCourierAnalytics(); }}
                          className="bg-gastro-dark-green text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg shadow-gastro-dark-green/20 flex items-center gap-2 hover:scale-105 transition-all"
                        >
                          <Loader2 className={`w-4 h-4 ${isLoadingLeaderboard ? 'animate-spin' : ''}`} />
                          Obnoviť
                        </button>
                      </div>

                      {/* Analytics Cards */}
                      {courierAnalytics && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          {[
                            { label: 'Celkom Kuriérov', value: courierAnalytics.totalCouriers, icon: Users, color: 'text-gastro-dark-green' },
                            { label: 'Aktívnych', value: courierAnalytics.activeCouriers, icon: Wifi, color: 'text-green-500' },
                            { label: 'Doručení', value: courierAnalytics.totalDeliveries, icon: CheckCircle2, color: 'text-blue-500' },
                            { label: 'Celkové Výplaty', value: `${Number(courierAnalytics.totalEarnings).toFixed(2)} €`, icon: TrendingUp, color: 'text-gastro-orange' },
                          ].map((stat) => (
                            <div key={stat.label} className="bg-white p-6 rounded-3xl border border-gastro-beige/10 shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                              </div>
                              <div className="text-2xl font-black tracking-tighter">{stat.value}</div>
                              <div className="text-xs font-bold text-gastro-ink/50 mt-1 uppercase tracking-widest">{stat.label}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Leaderboard Table */}
                      <div className="bg-white rounded-[32px] border border-gastro-beige/10 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gastro-cream/10 border-b border-gastro-beige/20">
                              {['#', 'Kuriér', 'Level', 'Vozidlo', 'Rating', 'Mesačne', 'Doručenia', 'Smeny', 'Najazdené km', 'Status'].map((h) => (
                                <th key={h} className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gastro-ink/40">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {isLoadingLeaderboard ? (
                              <tr>
                                <td colSpan={10} className="px-6 py-20 text-center">
                                  <Loader2 className="w-8 h-8 animate-spin text-gastro-dark-green mx-auto" />
                                </td>
                              </tr>
                            ) : leaderboardData.length === 0 ? (
                              <tr>
                                <td colSpan={10} className="px-6 py-20 text-center text-xs font-bold text-gastro-ink/30 uppercase tracking-widest">
                                  Žiadne dáta pre rebríček. Pridajte kuriérov a začnite doručovať.
                                </td>
                              </tr>
                            ) : leaderboardData.map((courier, index) => {
                              const level = getCourierLevel(courier.rating, courier.completedDeliveries);
                              const LevelIcon = level.icon;
                              return (
                                <tr key={courier.id} className={`border-b border-gastro-beige/10 hover:bg-gastro-cream/5 transition-colors ${index < 3 ? 'bg-gradient-to-r from-yellow-50/30 via-transparent to-transparent' : ''}`}>
                                  <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                      {index === 0 && <Trophy className="w-5 h-5 text-yellow-500" />}
                                      {index === 1 && <Medal className="w-5 h-5 text-gray-400" />}
                                      {index === 2 && <Medal className="w-5 h-5 text-amber-600" />}
                                      {index >= 3 && <span className="font-bold text-sm text-gastro-ink/30 w-5 text-center">{index + 1}</span>}
                                    </div>
                                  </td>
                                  <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${
                                        courier.isOnline ? 'bg-green-100 text-green-700' : 'bg-gastro-ink/5 text-gastro-ink/30'
                                      }`}>
                                        {courier.name.charAt(0).toUpperCase()}
                                      </div>
                                      <span className="font-bold text-sm">{courier.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-5">
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${level.bg} ${level.color}`}>
                                      <LevelIcon className="w-3 h-3" />
                                      {level.name}
                                    </div>
                                  </td>
                                  <td className="px-6 py-5">
                                    <span className="text-xs font-bold text-gastro-ink/50">
                                      {courier.vehicleType === 'CAR' ? '🚗 Auto' : courier.vehicleType === 'SCOOTER' ? '🛵 Skúter' : '🚲 Bicykel'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-5">
                                    <div className="flex items-center gap-1">
                                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                      <span className="font-bold text-sm">{Number(courier.rating).toFixed(1)}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-5">
                                    <span className="font-black text-sm text-gastro-dark-green">{Number(courier.monthlyEarnings).toFixed(2)} €</span>
                                  </td>
                                  <td className="px-6 py-5">
                                    <span className="font-bold text-sm">{courier.completedDeliveries}</span>
                                  </td>
                                  <td className="px-6 py-5">
                                    <span className="font-bold text-sm">{courier.completedShifts}</span>
                                  </td>
                                  <td className="px-6 py-5">
                                    <span className="font-bold text-sm">{Number(courier.totalDistanceKm).toFixed(1)} km</span>
                                  </td>
                                  <td className="px-6 py-5">
                                    <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${
                                      courier.isOnline ? 'text-green-600' : 'text-gastro-ink/30'
                                    }`}>
                                      <div className={`w-2 h-2 rounded-full ${courier.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gastro-ink/20'}`} />
                                      {courier.isOnline ? 'Online' : 'Offline'}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Level Legend */}
                      <div className="bg-white rounded-[32px] border border-gastro-beige/10 shadow-sm p-8">
                        <h3 className="text-lg font-bold uppercase tracking-tight mb-6 flex items-center gap-3">
                          <Award className="w-5 h-5 text-gastro-orange" />
                          Level Systém
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          {[
                            { name: 'Bronze', icon: Award, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200/30', req: 'Rating ≥ 4.0 • 20+ doručení', desc: 'Začiatočník' },
                            { name: 'Silver', icon: Star, color: 'text-gray-400', bg: 'bg-gray-50 border-gray-200/30', req: 'Rating ≥ 4.5 • 50+ doručení', desc: 'Stabilný kuriér' },
                            { name: 'Gold', icon: Medal, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200/30', req: 'Rating ≥ 4.5 • 50+ doručení', desc: 'Vyššie bonusy' },
                            { name: 'Elite', icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-50 border-yellow-200/30', req: 'Rating ≥ 4.8 • 100+ doručení', desc: 'Top kuriéri • Priority dispatch' },
                          ].map((lvl) => {
                            const LvlIcon = lvl.icon;
                            return (
                              <div key={lvl.name} className={`p-6 rounded-3xl border ${lvl.bg}`}>
                                <LvlIcon className={`w-8 h-8 ${lvl.color} mb-3`} />
                                <div className={`text-sm font-black uppercase tracking-wider ${lvl.color}`}>{lvl.name}</div>
                                <div className="text-[10px] font-bold text-gastro-ink/40 mt-1">{lvl.desc}</div>
                                <div className="text-[9px] font-bold text-gastro-ink/30 mt-2 uppercase tracking-wider">{lvl.req}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'coupons' && (
                    <div className="space-y-10">
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <h2 className="text-xl font-bold uppercase tracking-tight">Správa Kupónov</h2>
                          <p className="text-[10px] text-gastro-ink/40 uppercase font-black tracking-widest mt-1">Vytváranie a správa zľavových kódov</p>
                        </div>
                      </div>

                      {/* Coupon Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          { label: 'Aktívne Kupóny', value: coupons.filter(c => c.isActive).length, icon: Award, color: 'text-green-500' },
                          { label: 'Neaktívne', value: coupons.filter(c => !c.isActive).length, icon: X, color: 'text-red-400' },
                          { label: 'Celkom', value: coupons.length, icon: Package, color: 'text-gastro-dark-green' },
                        ].map((stat) => (
                          <div key={stat.label} className="bg-white p-6 rounded-3xl border border-gastro-beige/10 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <div className="text-2xl font-black tracking-tighter">{stat.value}</div>
                            <div className="text-xs font-bold text-gastro-ink/50 mt-1 uppercase tracking-widest">{stat.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Create Coupon Form */}
                      <div className="bg-white rounded-[32px] border border-gastro-beige/10 shadow-sm p-8">
                        <h3 className="text-lg font-bold uppercase tracking-tight mb-6 flex items-center gap-3">
                          <Plus className="w-5 h-5 text-gastro-orange" />
                          Vytvoriť Nový Kupón
                        </h3>
                        <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gastro-ink/40 ml-4">Kód kupónu</label>
                            <input 
                              required
                              value={newCouponCode}
                              onChange={e => setNewCouponCode(e.target.value.toUpperCase())}
                              placeholder="napr. ZLAVA10"
                              className="w-full bg-gastro-cream/10 border border-gastro-beige rounded-2xl px-5 py-3 outline-none focus:border-gastro-dark-green transition-colors text-sm font-bold"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gastro-ink/40 ml-4">Zľava</label>
                            <input 
                              required
                              type="number" step="0.01" min="0.01"
                              value={newCouponDiscount}
                              onChange={e => setNewCouponDiscount(e.target.value)}
                              placeholder="napr. 10"
                              className="w-full bg-gastro-cream/10 border border-gastro-beige rounded-2xl px-5 py-3 outline-none focus:border-gastro-dark-green transition-colors text-sm font-bold"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gastro-ink/40 ml-4">Typ</label>
                            <select
                              value={newCouponType}
                              onChange={e => setNewCouponType(e.target.value)}
                              className="w-full bg-gastro-cream/10 border border-gastro-beige rounded-2xl px-5 py-3 outline-none focus:border-gastro-dark-green transition-colors text-sm font-bold appearance-none cursor-pointer"
                            >
                              <option value="FIXED">Fixná suma (€)</option>
                              <option value="PERCENT">Percentuálna (%)</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gastro-ink/40 ml-4">Min. objednávka</label>
                            <input 
                              type="number" step="0.01" min="0"
                              value={newCouponMinOrder}
                              onChange={e => setNewCouponMinOrder(e.target.value)}
                              placeholder="0 = bez limitu"
                              className="w-full bg-gastro-cream/10 border border-gastro-beige rounded-2xl px-5 py-3 outline-none focus:border-gastro-dark-green transition-colors text-sm font-bold"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gastro-ink/40 ml-4">Expirácia</label>
                            <input 
                              type="date"
                              value={newCouponExpires}
                              onChange={e => setNewCouponExpires(e.target.value)}
                              className="w-full bg-gastro-cream/10 border border-gastro-beige rounded-2xl px-5 py-3 outline-none focus:border-gastro-dark-green transition-colors text-sm font-bold"
                            />
                          </div>
                          <div className="md:col-span-2 lg:col-span-5 flex justify-end mt-2">
                            <button 
                              disabled={isCreatingCoupon}
                              className="bg-gastro-dark-green text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-gastro-dark-green/20 flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50"
                            >
                              {isCreatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                              Vytvoriť Kupón
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Coupons List */}
                      <div className="bg-white rounded-[32px] border border-gastro-beige/10 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gastro-cream/10 border-b border-gastro-beige/20">
                              {['Kód', 'Zľava', 'Typ', 'Min. Objednávka', 'Expirácia', 'Status', 'Vytvorený', 'Akcie'].map((h) => (
                                <th key={h} className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gastro-ink/40">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {coupons.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="px-6 py-20 text-center text-xs font-bold text-gastro-ink/30 uppercase tracking-widest">
                                  Žiadne kupóny. Vytvorte prvý kupón.
                                </td>
                              </tr>
                            ) : coupons.map((coupon) => (
                              <tr key={coupon.id} className="border-b border-gastro-beige/10 hover:bg-gastro-cream/5 transition-colors">
                                <td className="px-6 py-5">
                                  <span className="font-black text-sm text-gastro-dark-green uppercase">{coupon.code}</span>
                                </td>
                                <td className="px-6 py-5">
                                  <span className="font-black text-sm">
                                    {coupon.type === 'PERCENT' ? `${Number(coupon.discount)}%` : `${Number(coupon.discount).toFixed(2)} €`}
                                  </span>
                                </td>
                                <td className="px-6 py-5">
                                  <span className="text-[10px] px-2 py-1 rounded-full bg-gastro-ink/5 text-gastro-ink/50 font-bold uppercase tracking-wider">
                                    {coupon.type === 'PERCENT' ? 'Percentuálna' : 'Fixná'}
                                  </span>
                                </td>
                                <td className="px-6 py-5 text-sm font-bold text-gastro-ink/60">
                                  {coupon.minOrder ? `${Number(coupon.minOrder).toFixed(2)} €` : 'Bez limitu'}
                                </td>
                                <td className="px-6 py-5">
                                  <span className={`text-sm font-bold ${coupon.expiresAt && new Date(coupon.expiresAt) < new Date() ? 'text-red-500' : 'text-gastro-ink/60'}`}>
                                    {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('sk-SK') : 'Bez expirácie'}
                                  </span>
                                </td>
                                <td className="px-6 py-5">
                                  <button
                                    onClick={() => toggleCouponStatus(coupon.id)}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${
                                      coupon.isActive 
                                        ? 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20' 
                                        : 'bg-red-500/5 text-red-400 border-red-500/10 hover:bg-red-500/10'
                                    }`}
                                  >
                                    {coupon.isActive ? 'Aktívny' : 'Neaktívny'}
                                  </button>
                                </td>
                                <td className="px-6 py-5 text-sm font-bold text-gastro-ink/40">
                                  {new Date(coupon.createdAt).toLocaleDateString('sk-SK')}
                                </td>
                                <td className="px-6 py-5">
                                  <button 
                                    onClick={() => deleteCoupon(coupon.id)}
                                    className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all text-gastro-ink/30"
                                    title="Odstrániť kupón"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
