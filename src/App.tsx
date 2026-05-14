import { ShoppingCart, User, Menu, Phone, MapPin, Clock, X, Plus, Minus, Trash2, ShieldCheck, Loader2, Navigation, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useCartStore } from './store/useCartStore';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

function OrderTrackingMap({ address }: { address: string }) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const [position, setPosition] = useState<google.maps.LatLngLiteral | null>(null);

  useEffect(() => {
    if (!placesLib || !address || !map) return;
    
    placesLib.Place.searchByText({
      textQuery: `${address}, Hlohovec, Slovakia`,
      fields: ['location', 'displayName'],
      maxResultCount: 1,
    }).then(({ places }) => {
      if (places?.[0]?.location) {
        const loc = { 
          lat: places[0].location.lat(), 
          lng: places[0].location.lng() 
        };
        setPosition(loc);
        map.setCenter(loc);
        map.setZoom(15);
      }
    });
  }, [placesLib, address, map]);

  return (
    <div className="w-full h-48 rounded-3xl overflow-hidden mb-6 border border-gastro-beige/20 shadow-inner">
      <Map
        defaultCenter={{ lat: 48.4239, lng: 17.7972 }}
        defaultZoom={13}
        mapId="DEMO_MAP_ID"
        disableDefaultUI={true}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
      >
        {position && (
          <AdvancedMarker position={position}>
            <Pin background="#D97706" glyphColor="#fff" />
          </AdvancedMarker>
        )}
      </Map>
    </div>
  );
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isPizza: boolean;
  category?: { name: string; slug: string };
  tag?: string;
  allergens?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  items: MenuItem[];
}

export default function App() {
  const [view, setView] = useState<'client' | 'admin'>('client');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('delivery');
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>('NEW');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [loyaltyData, setLoyaltyData] = useState<{ points: number, history: any[] } | null>(null);
  const [isLoyaltyOpen, setIsLoyaltyOpen] = useState(false);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [dailyMenu, setDailyMenu] = useState<any>(null);

  const [submittedAddress, setSubmittedAddress] = useState<string | null>(null);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const { items, addItem, removeItem, updateQuantity, getTotalItems, getTotalPrice, clearCart } = useCartStore();

  useEffect(() => {
    loadMenu();
    loadDailyMenu();
    loadSettings();
    // Load email from localStorage if exists
    const savedEmail = localStorage.getItem('customerEmail');
    if (savedEmail) {
      setCustomerEmail(savedEmail);
      loadLoyalty(savedEmail);
    }
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Settings fetch error:', err);
    }
  };

  const loadLoyalty = async (email: string) => {
    try {
      const res = await fetch(`/api/loyalty/${email}`);
      if (res.ok) {
        const data = await res.json();
        setLoyaltyData(data);
      }
    } catch (err) {
      console.error('Loyalty fetch error:', err);
    }
  };

  const loadDailyMenu = async () => {
    try {
      const res = await fetch('/api/daily-menu');
      if (res.ok) {
        const data = await res.json();
        setDailyMenu(data);
      }
    } catch (err) {
      console.error('Failed to fetch daily menu:', err);
    }
  };

  const validateCoupon = async () => {
    setCouponError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, total: getTotalPrice() })
      });
      const data = await res.json();
      if (res.ok) {
        setAppliedCoupon(data);
      } else {
        setCouponError(data.error);
      }
    } catch (err) {
      setCouponError('Chyba pri validácii');
    }
  };

  const getDiscountedTotal = () => {
    const baseTotal = getTotalPrice() + (deliveryType === 'delivery' ? 2 : 0);
    if (!appliedCoupon) return baseTotal;
    
    if (appliedCoupon.type === 'PERCENT') {
      return baseTotal * (1 - Number(appliedCoupon.discount) / 100);
    }
    return Math.max(0, baseTotal - Number(appliedCoupon.discount));
  };

  useEffect(() => {
    let interval: any;
    if (orderSuccess && currentOrderId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/orders/${currentOrderId}/status`);
          const data = await res.json();
          if (data.status) setOrderStatus(data.status);
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [orderSuccess, currentOrderId]);

  const loadMenu = async () => {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
        if (data.length > 0) setActiveCategory(data[0].slug);
      }
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simple form data for now
    const formData = new FormData(e.target as HTMLFormElement);
    const address = formData.get('address') as string;
    const email = formData.get('email') as string;

    const data = {
      type: deliveryType,
      items: items.map(i => ({ id: i.id, quantity: i.quantity, price: i.price })),
      total: getDiscountedTotal(),
      deliveryFee: deliveryType === 'delivery' ? 2 : 0,
      deliveryAddress: address,
      customerEmail: email,
      couponCode: appliedCoupon?.code,
    };

    if (email) {
      localStorage.setItem('customerEmail', email);
      setCustomerEmail(email);
    }
    
    if (address) {
      setSubmittedAddress(address);
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const order = await res.json();
        setCurrentOrderId(order.id);
        setOrderStatus('NEW');
        setOrderSuccess(true);
        clearCart();
        // Don't close checkout automatically, let user see status
      }
    } catch (err) {
      console.error('Order failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentItems = Array.isArray(categories) 
    ? categories.find(c => c.slug === activeCategory)?.items || []
    : [];

  const handleAddToCart = (item: MenuItem) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
    });
  };

  const handleAdminLogin = async (password: string) => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setIsAdminAuthenticated(true);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  return (
    <APIProvider apiKey={API_KEY || 'no-key'}>
      {view === 'admin' ? (
        !isAdminAuthenticated ? (
          <AdminLogin 
            onLogin={handleAdminLogin} 
            onBack={() => setView('client')} 
          />
        ) : (
          <AdminDashboard onLogout={() => {
            setIsAdminAuthenticated(false);
            setView('client');
          }} />
        )
      ) : (
        <div className="min-h-screen bg-gastro-cream selection:bg-gastro-olive selection:text-white">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gastro-beige/20">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="text-2xl font-black tracking-tighter text-gastro-dark-green uppercase">
                {settings.restaurant_name || 'Jašterka'}<span className="text-gastro-orange">.</span>
              </div>
              <div className="hidden md:flex items-center gap-6">
                {[
                  { label: 'Denné Menu', id: 'daily' },
                  { label: 'Ponuka', id: 'menu' },
                  { label: 'Pizza', action: () => { setActiveCategory('pizza'); scrollToSection('menu'); } },
                  { label: 'Rezervácie', action: () => setIsReservationOpen(true) },
                  { label: 'O Nás', id: 'about' }
                ].map((link) => (
                  <button 
                    key={link.label} 
                    onClick={() => link.id ? scrollToSection(link.id) : link.action?.()}
                    className="text-sm font-medium text-gastro-ink/70 hover:text-gastro-dark-green transition-colors uppercase tracking-widest"
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsLoyaltyOpen(true)}
                className="hidden md:flex p-2 hover:bg-gastro-beige/20 rounded-full transition-colors relative"
              >
                <User className="w-5 h-5 text-gastro-dark-green" />
                {loyaltyData && (
                  <div className="absolute -top-1 -right-1 bg-gastro-orange text-white text-[8px] font-black px-1 rounded-full border border-white">
                    {loyaltyData.points}
                  </div>
                )}
              </button>
              <button 
                onClick={() => setIsCartOpen(true)}
                className="hidden md:flex p-2 hover:bg-gastro-beige/20 rounded-full transition-colors relative"
              >
                <ShoppingCart className="w-5 h-5 text-gastro-dark-green" />
                {getTotalItems() > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    key={getTotalItems()}
                    className="absolute top-0 right-0 w-4 h-4 bg-gastro-orange text-white text-[10px] font-bold flex items-center justify-center rounded-full"
                  >
                    {getTotalItems()}
                  </motion.span>
                )}
              </button>
              <button 
                onClick={() => setIsReservationOpen(true)}
                className="bg-gastro-orange text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform"
              >
                Rezervácia
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile App Navigation (Bottom Bar) */}
        <div className="md:hidden fixed bottom-6 left-6 right-6 z-[150] h-16 bg-white/90 backdrop-blur-xl border border-gastro-beige/20 rounded-full shadow-2xl flex items-center justify-around px-4">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex flex-col items-center gap-1 text-gastro-ink/40 hover:text-gastro-dark-green transition-colors"
          >
            <Clock className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase tracking-tighter">Domov</span>
          </button>
          <button 
            onClick={() => scrollToSection('daily')}
            className="flex flex-col items-center gap-1 text-gastro-ink/40 hover:text-gastro-dark-green transition-colors"
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase tracking-tighter">Denné</span>
          </button>
          <button 
            onClick={() => { setActiveCategory('pizza'); scrollToSection('menu'); }}
            className="w-12 h-12 bg-gastro-dark-green text-white rounded-full flex items-center justify-center shadow-lg -translate-y-4 border-4 border-gastro-cream"
          >
            <Plus className="w-6 h-6 rotate-45" />
          </button>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="flex flex-col items-center gap-1 text-gastro-ink/40 hover:text-gastro-dark-green transition-colors relative"
          >
            <ShoppingCart className="w-5 h-5" />
            {getTotalItems() > 0 && (
              <span className="absolute -top-1 -right-1 bg-gastro-orange text-white text-[8px] font-black w-3 h-3 flex items-center justify-center rounded-full">
                {getTotalItems()}
              </span>
            )}
            <span className="text-[8px] font-bold uppercase tracking-tighter">Košík</span>
          </button>
          <button 
            onClick={() => setIsLoyaltyOpen(true)}
            className="flex flex-col items-center gap-1 text-gastro-ink/40 hover:text-gastro-dark-green transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase tracking-tighter">Ja</span>
          </button>
        </div>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[101] shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-gastro-beige/20 flex items-center justify-between">
                <div className="text-xl font-bold flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6 text-gastro-dark-green" />
                  Váš Košík
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gastro-beige/20 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <ShoppingCart className="w-16 h-16 mb-4" />
                    <p className="text-lg">Váš košík je momentálne prázdny.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <h4 className="font-bold text-sm">{item.name}</h4>
                            <button onClick={() => removeItem(item.id)} className="text-gastro-ink/30 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-xs text-gastro-ink/50 mb-4">{item.price.toFixed(2)} €</div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center bg-gastro-beige/10 rounded-full px-3 py-1 gap-4">
                              <button onClick={() => updateQuantity(item.id, -1)} className="hover:text-gastro-orange transition-colors">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} className="hover:text-gastro-orange transition-colors">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="ml-auto font-bold text-sm">
                              {(item.price * item.quantity).toFixed(2)} €
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <div className="p-8 border-t border-gastro-beige/20 bg-gastro-cream/10">
                  <div className="flex justify-between mb-6">
                    <span className="text-gastro-ink/60">Spolu s DPH</span>
                    <span className="text-2xl font-black text-gastro-dark-green">{getTotalPrice().toFixed(2)} €</span>
                  </div>
                  <button 
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full bg-gastro-dark-green text-white py-5 rounded-full font-bold text-lg hover:scale-[1.02] transition-transform active:scale-[0.98]"
                  >
                    Objednať Teraz
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Overlay (Phase 6) */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gastro-cream z-[200] overflow-y-auto"
          >
            <div className="max-w-4xl mx-auto px-6 py-12">
              <div className="flex items-center justify-between mb-12">
                <button 
                  onClick={() => setIsCheckoutOpen(false)}
                  className="flex items-center gap-2 text-gastro-dark-green font-bold hover:gap-4 transition-all"
                >
                  <Minus className="w-4 h-4 rotate-90" /> Späť do Menu
                </button>
                <div className="text-xl font-black tracking-tighter text-gastro-dark-green uppercase">
                  Pokladňa<span className="text-gastro-orange">.</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                {/* Form Side */}
                <div>
                  <h2 className="text-4xl mb-8 uppercase font-bold tracking-tighter">Vaše Údaje</h2>
                  
                  <form onSubmit={handlePlaceOrder} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: 'pickup', label: 'Osobný Odber' },
                        { id: 'delivery', label: 'Rozvoz' }
                      ].map((type) => (
                        <button 
                          key={type.id}
                          type="button"
                          onClick={() => setDeliveryType(type.id as any)}
                          className={`flex-1 py-4 border-2 rounded-2xl font-bold transition-all ${
                            deliveryType === type.id 
                              ? 'border-gastro-dark-green bg-gastro-dark-green text-white shadow-lg' 
                              : 'border-gastro-beige hover:border-gastro-dark-green text-gastro-dark-green'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>

                      <div className="space-y-4">
                        <input 
                          type="email" 
                          name="email"
                          required
                          defaultValue={customerEmail}
                          placeholder="Váš Email (pre vernostné body)" 
                          className="w-full bg-white border border-gastro-beige rounded-2xl px-6 py-4 focus:ring-2 focus:ring-gastro-dark-green/20 focus:border-gastro-dark-green outline-none transition-all"
                        />
                        <input 
                          type="tel" 
                          name="phone"
                        required
                        placeholder="Telefónne číslo" 
                        className="w-full bg-white border border-gastro-beige rounded-2xl px-6 py-4 focus:ring-2 focus:ring-gastro-dark-green/20 focus:border-gastro-dark-green outline-none transition-all"
                      />
                      {deliveryType === 'delivery' && (
                        <motion.input 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          type="text" 
                          name="address"
                          required
                          placeholder="Ulica a číslo domu" 
                          className="w-full bg-white border border-gastro-beige rounded-2xl px-6 py-4 focus:ring-2 focus:ring-gastro-dark-green/20 focus:border-gastro-dark-green outline-none transition-all"
                        />
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <select className="bg-white border border-gastro-beige rounded-2xl px-6 py-4 focus:ring-2 focus:ring-gastro-dark-green/20 focus:border-gastro-dark-green outline-none transition-all appearance-none cursor-pointer">
                          <option>Hlohovec</option>
                          <option>Leopoldov</option>
                          <option>Šulekovo</option>
                        </select>
                        <select className="bg-white border border-gastro-beige rounded-2xl px-6 py-4 focus:ring-2 focus:ring-gastro-dark-green/20 focus:border-gastro-dark-green outline-none transition-all appearance-none cursor-pointer">
                          <option>Čo najskôr (ASAP)</option>
                          <option>18:00</option>
                          <option>18:30</option>
                          <option>19:00</option>
                        </select>
                      </div>
                    </div>

                    <textarea 
                      name="note"
                      placeholder="Poznámka k objednávke (napr. kód od brány, poschodie...)" 
                      rows={4}
                      className="w-full bg-white border border-gastro-beige rounded-2xl px-6 py-4 focus:ring-2 focus:ring-gastro-dark-green/20 focus:border-gastro-dark-green outline-none transition-all"
                    />

                    {/* Summary Side for mobile but integrated in form logic */}
                    <div className="bg-white rounded-[40px] p-10 border border-gastro-beige/20 shadow-xl lg:hidden">
                      {/* ... mobile summary content ... */}
                    </div>

                    <div className="hidden lg:block h-20" /> {/* Spacer */}
                  </form>
                </div>

                {/* Summary Side */}
                <div className="bg-white rounded-[40px] p-10 border border-gastro-beige/20 shadow-xl h-fit">
                  <h3 className="text-2xl font-bold mb-8">Zhrnutie</h3>
                  {orderSuccess ? (
                    <div className="py-12 text-center">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors ${
                        orderStatus === 'COMPLETED' ? 'bg-green-500' : 'bg-gastro-orange animate-pulse'
                      }`}>
                        <ShieldCheck className="w-10 h-10 text-white" />
                      </div>
                      
                      {/* Tracking map disabled for now */}
                      {/* deliveryType === 'delivery' && submittedAddress && (
                        <OrderTrackingMap address={submittedAddress} />
                      ) */}

                      <h4 className="text-2xl font-bold text-gastro-dark-green mb-2">
                        {orderStatus === 'NEW' && 'Objednávka Prijatá'}
                        {orderStatus === 'PREPARING' && 'Vaše jedlo sa pripravuje'}
                        {orderStatus === 'COMPLETED' && 'Objednávka je Hotová!'}
                        {orderStatus === 'CANCELLED' && 'Objednávka bola Zrušená'}
                      </h4>
                      <p className="text-gastro-ink/50 mb-8">
                        {orderStatus === 'NEW' && 'Čakáme na potvrdenie kuchyňou.'}
                        {orderStatus === 'PREPARING' && 'Náš šéfkuchár už na tom pracuje.'}
                        {orderStatus === 'COMPLETED' && 'Prajeme vám dobrú chuť!'}
                        {orderStatus === 'CANCELLED' && 'Ospravedlňujeme sa, vašu objednávku nebolo možné spracovať.'}
                      </p>

                      <div className="flex justify-between max-w-xs mx-auto mb-10">
                        {['NEW', 'PREPARING', 'COMPLETED'].map((s, i) => {
                          const steps = ['NEW', 'PREPARING', 'COMPLETED'];
                          const currentIdx = steps.indexOf(orderStatus);
                          const active = i <= currentIdx;
                          return (
                            <div key={s} className="flex flex-col items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${active ? 'bg-gastro-dark-green' : 'bg-gastro-beige'}`} />
                              <span className={`text-[8px] font-bold uppercase tracking-widest ${active ? 'text-gastro-dark-green' : 'text-gastro-ink/20'}`}>
                                {s === 'NEW' ? 'Prijaté' : s === 'PREPARING' ? 'Príprava' : 'Hotovo'}
                              </span>
                            </div>
                          )
                        })}
                      </div>

                      <button 
                        onClick={() => {
                          setIsCheckoutOpen(false);
                          setOrderSuccess(false);
                        }}
                        className="text-sm font-bold text-gastro-dark-green/60 hover:text-gastro-dark-green underline underline-offset-4"
                      >
                        Zavrieť a pokračovať v prezeraní
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-6 mb-8">
                        {items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-sm">
                            <div className="flex gap-2">
                              <span className="font-bold text-gastro-orange">{item.quantity}x</span>
                              <span className="text-gastro-ink/70">{item.name}</span>
                            </div>
                            <span className="font-bold">{(item.price * item.quantity).toFixed(2)} €</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-6 border-t border-gastro-beige/20 space-y-4">
                        <div className="flex justify-between text-sm text-gastro-ink/60">
                          <span>Medzisúčet</span>
                          <span>{getTotalPrice().toFixed(2)} €</span>
                        </div>
                        {deliveryType === 'delivery' && (
                          <div className="flex justify-between text-sm text-gastro-ink/60">
                            <span>Doprava</span>
                            <span>2.00 €</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xl font-black text-gastro-dark-green pt-4">
                          <span>Spolu</span>
                          <span>{getDiscountedTotal().toFixed(2)} €</span>
                        </div>
                      </div>

                      {/* Coupon Input */}
                      <div className="mt-8 pt-8 border-t border-gastro-beige/10">
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="ZADAŤ KUPÓN"
                            className="flex-1 bg-gastro-cream/10 border border-gastro-beige rounded-xl px-4 py-3 text-xs font-bold focus:border-gastro-dark-green outline-none transition-all uppercase tracking-widest"
                          />
                          <button 
                            type="button"
                            onClick={validateCoupon}
                            className="px-6 bg-gastro-dark-green text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                          >
                            Použiť
                          </button>
                        </div>
                        {couponError && <p className="text-red-500 text-[10px] mt-2 font-bold uppercase tracking-widest">{couponError}</p>}
                        {appliedCoupon && (
                          <div className="mt-4 p-3 bg-gastro-olive/10 rounded-xl flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gastro-dark-green tracking-widest uppercase">
                              Kupón {appliedCoupon.code} aplikovaný
                            </span>
                            <button 
                              onClick={() => {
                                setAppliedCoupon(null);
                                setCouponCode('');
                              }} 
                              className="text-gastro-dark-green hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      <button 
                        disabled={isSubmitting}
                        onClick={(e) => {
                          const form = document.querySelector('form');
                          if (form) form.requestSubmit();
                        }}
                        className="w-full bg-gastro-orange text-white py-5 rounded-full font-bold text-xl mt-10 hover:scale-[1.02] transition-transform active:scale-[0.98] shadow-xl shadow-gastro-orange/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
                      >
                        {isSubmitting && <Loader2 className="w-6 h-6 animate-spin" />}
                        {isSubmitting ? 'Odosielam...' : 'Potvrdiť Objednávku'}
                      </button>
                    </>
                  )}
                  <p className="text-[10px] text-center text-gastro-ink/40 mt-6 uppercase tracking-widest leading-relaxed">
                    Kliknutím na tlačidlo súhlasíte so spracovaním osobných údajov a obchodnými podmienkami Jašterka Hlohovec.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-20 h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop" 
            alt="Restaurant Background" 
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-gastro-cream via-transparent to-gastro-cream" />
        </div>

        <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gastro-olive/10 rounded-full text-gastro-olive text-xs font-bold uppercase tracking-widest mb-8"
            >
              <Clock className="w-3 h-3" />
              Sme Otvorení
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-7xl md:text-8xl leading-[0.9] mb-8"
            >
              {settings.hero_title || 'Chuť tradície v'} <br />
              <span className="text-gastro-dark-green serif italic">
                {settings.hero_subtitle ? '' : 'modernom šate.'}
              </span>
              {settings.hero_title && <div className="text-gastro-dark-green serif italic">
                {settings.hero_subtitle && settings.hero_title.includes('modernom šate') ? '' : ''}
              </div>}
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-gastro-ink/60 mb-10 max-w-xl leading-relaxed"
            >
              {settings.hero_subtitle || 'Reštaurácia Jašterka v Hlohovci vám prináša poctivú slovenskú kuchyňu, legendárnu pizzu a atmosféru, ktorú si zamilujete.'}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              <button 
                onClick={() => scrollToSection('menu')}
                className="w-full sm:w-auto bg-gastro-dark-green text-white px-10 py-5 rounded-full font-bold text-lg text-center shadow-xl shadow-gastro-dark-green/20 hover:scale-105 transition-transform active:scale-95"
              >
                Objednať Jedlo
              </button>
              <button 
                onClick={() => setIsReservationOpen(true)}
                className="w-full sm:w-auto bg-white border border-gastro-beige text-gastro-dark-green px-10 py-5 rounded-full font-bold text-lg hover:bg-gastro-beige/10 transition-colors"
              >
                Rezervovať Stôl
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Daily Menu Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto" id="daily">
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
          <div className="max-w-xl">
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-gastro-orange/10 rounded-full text-gastro-orange text-[10px] font-black uppercase tracking-widest mb-4">
               <Clock className="w-3 h-3" /> Čerstvé každý deň
             </div>
             <h2 className="text-5xl mb-6">Denné Menu</h2>
             <p className="text-gastro-ink/60">
               Pripravujeme pre vás vyváženú obedovú ponuku z tých najlepších surovín.
             </p>
          </div>
          <div className="text-right">
             <div className="text-sm font-bold text-gastro-ink/40 uppercase tracking-widest mb-1">Dnes Odporúčame</div>
             <div className="text-2xl font-black text-gastro-dark-green tracking-tighter">Menu už od 7,50 €</div>
          </div>
        </div>

        {dailyMenu && dailyMenu.content ? (
          <div className="bg-white rounded-[60px] p-12 md:p-20 border border-gastro-beige/20 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gastro-beige/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-8">
                <div className="prose prose-lg max-w-none text-gastro-ink whitespace-pre-wrap font-sans leading-relaxed">
                  {dailyMenu.content}
                </div>
              </div>
              <div className="lg:col-span-4 space-y-8">
                <div className="p-8 bg-gastro-cream/10 rounded-[40px] border border-gastro-beige/10">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gastro-dark-green mb-6">Informácie</h4>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-gastro-dark-green text-white rounded-full flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest text-gastro-ink/40 mb-1">Výdaj menu</div>
                        <div className="text-sm font-bold">{settings.menu_hours || '11:00 - 14:00'}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-gastro-dark-green text-white rounded-full flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest text-gastro-ink/40 mb-1">Kontakt</div>
                        <div className="text-sm font-bold">{settings.contact_phone || '0949 401 505'}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-8 bg-gastro-dark-green rounded-[40px] text-white">
                  <h4 className="text-xs font-black uppercase tracking-widest opacity-60 mb-6">Rozvoz menu</h4>
                  <p className="text-sm leading-relaxed mb-8 opacity-80">
                    {settings.delivery_text || 'Chutný obed vám radi dovezieme priamo do firmy alebo k vám domov. Stačí zavolať!'}
                  </p>
                  <button 
                    onClick={() => scrollToSection('menu')}
                    className="w-full bg-gastro-orange text-white py-4 rounded-full font-bold text-sm hover:scale-105 transition-transform"
                  >
                    Pozrieť celú ponuku
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[40px] p-20 border border-gastro-beige/20 text-center text-gastro-ink/40 shadow-inner">
            Denné menu na dnes ešte nebolo zverejnené. Sledujte nás čoskoro!
          </div>
        )}
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6 bg-gastro-dark-green text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-white text-[10px] font-black uppercase tracking-widest mb-6">
              <ShieldCheck className="w-3 h-3" /> Naša História
            </div>
            <h2 className="text-5xl mb-8 leading-tight">Poctivá kuchyňa s rodinnou tradíciou<span className="text-gastro-orange">.</span></h2>
            <p className="text-white/60 leading-relaxed mb-8">
              {settings.about_text || 'Reštaurácia Jašterka je synonymom pre gastronómiu v Hlohovci. Už roky pre vás pripravujeme jedlá podľa tradičných receptúr s použitím lokálnych surovín. Naša legenda začala pri pizzi a dnes sme hrdým miestom pre vaše rodinné oslavy, pracovné obedy aj romantické večere.'}
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-3xl font-black text-gastro-orange mb-1">15+</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Rokov skúseností</div>
              </div>
              <div>
                <div className="text-3xl font-black text-gastro-orange mb-1">50k+</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Spokojných hostí</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] rounded-[60px] overflow-hidden">
               <img src="https://images.unsplash.com/photo-1550966841-3ee7adac1661?q=80&w=2070" className="w-full h-full object-cover" alt="Restaurant Interior" />
            </div>
            <div className="absolute -bottom-8 -left-8 bg-white text-gastro-dark-green p-10 rounded-[40px] shadow-2xl hidden md:block">
               <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gastro-orange" />
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-40">Otvorené</div>
                      <div className="text-sm font-bold whitespace-pre-wrap">{settings.opening_hours || 'Po-Pia: 10:00 - 22:00\nSo-Ne: 11:00 - 23:00'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gastro-orange" />
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-40">Nájdete nás</div>
                      <div className="text-sm font-bold">{settings.address || 'Hlohovec, Slovensko'}</div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Info Quick Bar */}
      <section className="bg-gastro-dark-green py-8 text-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-gastro-orange" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest opacity-60 font-bold mb-1">Nájdete nás</div>
              <div className="font-medium">{settings.address || 'Bernolákova 12, Hlohovec'}</div>
            </div>
          </div>
          <div className="flex items-center gap-4 border-y md:border-y-0 md:border-x border-white/10 py-6 md:py-0 md:px-8">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <Phone className="w-6 h-6 text-gastro-orange" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest opacity-60 font-bold mb-1">Zavolajte nám</div>
              <div className="font-medium">{settings.contact_phone || '+421 9xx xxx xxx'}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-gastro-orange" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest opacity-60 font-bold mb-1">Otváracie Hodiny</div>
              <div className="font-medium">{settings.opening_hours || 'Po - Ne: 10:00 - 22:00'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Section (Phase 2) */}
      <section className="py-24 px-6 max-w-7xl mx-auto" id="menu">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-xl">
            <h2 className="text-5xl mb-6">Naša Ponuka</h2>
            <p className="text-gastro-ink/60">
              Vyberte si z našej bohatej ponuky jedál pripravených z čerstvých surovín podľa tradičných receptúr.
            </p>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
            {categories.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.slug)}
                className={`whitespace-nowrap px-6 py-3 rounded-full text-sm font-bold transition-all ${
                  activeCategory === cat.slug
                  ? 'bg-gastro-dark-green text-white shadow-lg shadow-gastro-dark-green/20' 
                  : 'bg-white border border-gastro-beige text-gastro-ink/60 hover:border-gastro-dark-green/30'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Pizza Info Bar */}
        {activeCategory === 'pizza' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 p-6 bg-gastro-olive/5 rounded-[32px] border border-gastro-olive/10 flex flex-col md:flex-row items-center justify-center gap-8 text-center"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gastro-olive rounded-full flex items-center justify-center text-white">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-gastro-dark-green">Okraje automaticky potierame cesnakom</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-gastro-olive/20" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gastro-olive rounded-full flex items-center justify-center text-white">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-gastro-dark-green">Možnosť rajčinového aj smotanového základu</span>
            </div>
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-gastro-dark-green" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentItems.map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-[40px] overflow-hidden border border-gastro-beige/20 shadow-sm hover:shadow-xl hover:shadow-gastro-dark-green/5 transition-all group"
              >
                <div className="h-64 overflow-hidden relative">
                  <img 
                    src={item.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070'} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {item.tag && (
                    <div className="absolute top-6 left-6 px-4 py-1.5 bg-gastro-orange text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                      {item.tag}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                    <button 
                      onClick={() => handleAddToCart(item)}
                      className="w-full bg-white text-gastro-dark-green py-3 rounded-full font-bold text-sm active:scale-95 transition-transform"
                    >
                      Pridať do Košíka
                    </button>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold">{item.name}</h3>
                    <span className="text-lg font-black text-gastro-dark-green whitespace-nowrap ml-4">{Number(item.price).toFixed(2)} €</span>
                  </div>
                  <p className="text-sm text-gastro-ink/50 leading-relaxed mb-4">
                    {item.description}
                  </p>
                  {item.allergens && (
                    <div className="text-[9px] font-bold text-gastro-ink/30 uppercase tracking-[0.2em]">
                      Alergény: {item.allergens}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-20 text-center">
          <button 
            onClick={() => scrollToSection('menu')}
            className="bg-white border-2 border-gastro-dark-green text-gastro-dark-green px-12 py-5 rounded-full font-bold text-lg hover:bg-gastro-dark-green hover:text-white transition-all"
          >
            Zobraziť Celú Ponuku
          </button>
        </div>
      </section>

      {/* Reservation Modal */}
      <AnimatePresence>
        {isReservationOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReservationOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[250]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white z-[251] rounded-[40px] shadow-2xl p-10 overflow-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black uppercase tracking-tight">Rezervácia Stola</h3>
                <button onClick={() => setIsReservationOpen(false)} className="p-2 hover:bg-gastro-beige/20 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {reservationSuccess ? (
                <div className="text-center py-12 space-y-6">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-xl">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold text-gastro-dark-green">Požiadavka odoslaná!</h4>
                  <p className="text-gastro-ink/60 max-w-sm mx-auto">
                    Vašu rezerváciu sme prijali. Počkajte prosím na potvrdzujúci email alebo telefonát od nášho personálu.
                  </p>
                  <button 
                    onClick={() => {
                      setIsReservationOpen(false);
                      setReservationSuccess(false);
                    }}
                    className="bg-gastro-dark-green text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest shadow-xl shadow-gastro-dark-green/20"
                  >
                    Rozumiem
                  </button>
                </div>
              ) : (
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    const data = Object.fromEntries(formData);
                    try {
                      const res = await fetch('/api/reservations', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                      });
                      if (res.ok) setReservationSuccess(true);
                    } catch (err) {
                      console.error('Reservation error:', err);
                    }
                  }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gastro-ink/40 ml-4">Meno</label>
                       <input name="name" required className="w-full bg-gastro-cream/10 border border-gastro-beige rounded-2xl px-6 py-4 focus:ring-2 focus:ring-gastro-dark-green/20 focus:border-gastro-dark-green outline-none" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gastro-ink/40 ml-4">Dátum a Čas</label>
                       <input name="date" type="datetime-local" required className="w-full bg-gastro-cream/10 border border-gastro-beige rounded-2xl px-6 py-4 focus:ring-2 focus:ring-gastro-dark-green/20 focus:border-gastro-dark-green outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gastro-ink/40 ml-4">Email</label>
                       <input name="email" type="email" required className="w-full bg-gastro-cream/10 border border-gastro-beige rounded-2xl px-6 py-4 focus:ring-2 focus:ring-gastro-dark-green/20 focus:border-gastro-dark-green outline-none" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gastro-ink/40 ml-4">Telefón</label>
                       <input name="phone" type="tel" required className="w-full bg-gastro-cream/10 border border-gastro-beige rounded-2xl px-6 py-4 focus:ring-2 focus:ring-gastro-dark-green/20 focus:border-gastro-dark-green outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gastro-ink/40 ml-4">Počet Osôb</label>
                       <input name="guests" type="number" min="1" max="20" required className="w-full bg-gastro-cream/10 border border-gastro-beige rounded-2xl px-6 py-4 focus:ring-2 focus:ring-gastro-dark-green/20 focus:border-gastro-dark-green outline-none" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gastro-ink/40 ml-4">Poznámka</label>
                       <input name="note" className="w-full bg-gastro-cream/10 border border-gastro-beige rounded-2xl px-6 py-4 focus:ring-2 focus:ring-gastro-dark-green/20 focus:border-gastro-dark-green outline-none" />
                    </div>
                  </div>
                  
                  <button className="w-full bg-gastro-dark-green text-white py-5 rounded-full font-black uppercase tracking-widest shadow-2xl shadow-gastro-dark-green/20 hover:scale-[1.02] transition-transform">
                    Odoslať Rezerváciu
                  </button>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Loyalty Modal */}
      <AnimatePresence>
        {isLoyaltyOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLoyaltyOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[250]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white z-[251] rounded-[40px] shadow-2xl p-10"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black uppercase tracking-tight">Vernostný Program</h3>
                <button onClick={() => setIsLoyaltyOpen(false)} className="p-2 hover:bg-gastro-beige/20 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!loyaltyData ? (
                <div className="space-y-6">
                  <p className="text-sm text-gastro-ink/60 leading-relaxed">
                    Zadajte svoj email a sledujte svoje vernostné body. Za každé euro nákupu získate 1 bod!
                  </p>
                  <div className="flex gap-2">
                    <input 
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="vas@email.sk"
                      className="flex-1 bg-gastro-cream/10 border border-gastro-beige rounded-2xl px-6 py-4 focus:border-gastro-dark-green outline-none"
                    />
                    <button 
                      onClick={() => loadLoyalty(customerEmail)}
                      className="bg-gastro-dark-green text-white px-8 rounded-2xl font-bold"
                    >
                      Overiť
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="bg-gastro-dark-green p-8 rounded-[32px] text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Vaše Body</div>
                      <div className="text-6xl font-black tracking-tighter mb-4">{loyaltyData.points}</div>
                      <div className="text-xs font-bold opacity-80 uppercase tracking-widest">
                        {Math.floor(loyaltyData.points / 100)} € v zľavách k dispozícii
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gastro-ink/40">Posledné aktivity</h4>
                    <div className="space-y-3">
                      {loyaltyData.history.length === 0 ? (
                        <p className="text-[10px] text-gastro-ink/30 italic">Zatiaľ žiadne aktivity</p>
                      ) : loyaltyData.history.map((tx: any) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 bg-gastro-cream/10 rounded-2xl border border-gastro-beige/10">
                          <div>
                            <div className="text-[10px] font-bold text-gastro-ink/40 uppercase tracking-widest mb-1">
                              {new Date(tx.createdAt).toLocaleDateString('sk-SK')}
                            </div>
                            <div className="text-xs font-bold">{tx.type === 'EARNED' ? 'Získané body' : 'Uplatnené body'}</div>
                          </div>
                          <div className={`font-black ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-gastro-beige/20 py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-2xl font-black tracking-tighter text-gastro-dark-green uppercase">
            {settings.restaurant_name || 'Jašterka'}<span className="text-gastro-orange">.</span>
          </div>
          <p className="text-sm text-gastro-ink/40">
            © 2026 {settings.restaurant_name || 'Jašterka'} Hlohovec. Všetky práva vyhradené.
          </p>
          <button 
            onClick={() => setView('admin')}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gastro-ink/20 hover:text-gastro-dark-green transition-colors"
          >
            <ShieldCheck className="w-3 h-3" /> Admin Prístup
          </button>
        </div>
      </footer>
        </div>
      )}
    </APIProvider>
  );
}
