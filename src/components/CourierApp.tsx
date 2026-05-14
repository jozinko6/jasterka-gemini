import { motion, AnimatePresence } from 'motion/react';
import { 
  Truck, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Wifi, 
  WifiOff,
  LogOut,
  ChevronRight,
  Package,
  AlertCircle,
  Loader2,
  X,
  ArrowLeft,
  DollarSign,
  Calendar,
  TrendingUp,
  Star,
  BarChart3,
  List,
  Plus,
  Route,
  MapIcon,
  Bell,
  BellRing,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import React from 'react';

interface CourierOrder {
  id: string;
  status: string;
  type: string;
  total: number;
  deliveryFee: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  createdAt: string;
  items: { quantity: number; price: number; menuItem?: { name: string }; itemName?: string }[];
}

interface CourierProfile {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  isOnline: boolean;
  activeOrdersCount: number;
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nová',
  CONFIRMED: 'Potvrdená',
  PREPARING: 'Pripravuje sa',
  READY: 'Pripravená',
  DELIVERING: 'Na ceste',
  COMPLETED: 'Doručená',
  REJECTED: 'Zrušená',
};

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-purple-100 text-purple-700',
  PREPARING: 'bg-yellow-100 text-yellow-700',
  READY: 'bg-orange-100 text-orange-700',
  DELIVERING: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function CourierApp({ onLogout }: { onLogout: () => void }) {
  const [courier, setCourier] = useState<CourierProfile | null>(null);
  const [orders, setOrders] = useState<CourierOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<CourierOrder | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [showLogin, setShowLogin] = useState(true);
  const [loginName, setLoginName] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'earnings' | 'shifts'>('orders');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Earnings & Shifts state
  const [earningsSummary, setEarningsSummary] = useState<{ totalEarnings: number; thisWeek: number; today: number; deliveriesCount: number } | null>(null);
  const [earningsHistory, setEarningsHistory] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [deliveryTasks, setDeliveryTasks] = useState<any[]>([]);
  const [isLoadingEarnings, setIsLoadingEarnings] = useState(false);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Load courier from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('courierSession');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setCourier(data);
        setShowLogin(false);
        setIsOnline(data.isOnline);
      } catch {
        localStorage.removeItem('courierSession');
      }
    }
    setIsLoading(false);
  }, []);

  // Fetch earnings data
  const fetchEarnings = async () => {
    if (!courier) return;
    setIsLoadingEarnings(true);
    try {
      const [summaryRes, historyRes, tasksRes] = await Promise.all([
        fetch(`/api/admin/couriers/${courier.id}/earnings/summary`),
        fetch(`/api/admin/couriers/${courier.id}/earnings`),
        fetch(`/api/admin/couriers/${courier.id}/tasks`),
      ]);
      if (summaryRes.ok) setEarningsSummary(await summaryRes.json());
      if (historyRes.ok) setEarningsHistory(await historyRes.json());
      if (tasksRes.ok) setDeliveryTasks(await tasksRes.json());
    } catch (err) {
      console.error('Failed to fetch earnings:', err);
    } finally {
      setIsLoadingEarnings(false);
    }
  };

  // Fetch shifts data
  const fetchShifts = async () => {
    if (!courier) return;
    setIsLoadingShifts(true);
    try {
      const res = await fetch(`/api/admin/couriers/${courier.id}/shifts`);
      if (res.ok) setShifts(await res.json());
    } catch (err) {
      console.error('Failed to fetch shifts:', err);
    } finally {
      setIsLoadingShifts(false);
    }
  };

  // Fetch data when tab changes
  useEffect(() => {
    if (!courier) return;
    if (activeTab === 'earnings') fetchEarnings();
    if (activeTab === 'shifts') fetchShifts();
  }, [activeTab, courier]);

  // Poll orders when courier is logged in
  useEffect(() => {
    if (!courier) return;

    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/admin/orders');
        if (res.ok) {
          const data = await res.json();
          // Filter orders that are assigned to this courier or are delivery orders ready for pickup
          const courierOrders = data.filter((o: CourierOrder) => {
            const isDelivery = o.type === 'DELIVERY';
            const isActive = ['NEW', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERING'].includes(o.status);
            return isDelivery && isActive;
          });
          setOrders(courierOrders);
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      }
    };

    fetchOrders();
    pollingRef.current = setInterval(fetchOrders, 10000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [courier]);

  const handleLogin = async () => {
    setLoginError('');
    if (!loginName.trim()) {
      setLoginError('Zadajte svoje meno');
      return;
    }

    try {
      const res = await fetch('/api/admin/couriers');
      if (res.ok) {
        const couriers: CourierProfile[] = await res.json();
        const found = couriers.find(
          (c) => c.name.toLowerCase() === loginName.trim().toLowerCase()
        );
        if (found) {
          setCourier(found);
          setIsOnline(found.isOnline);
          setShowLogin(false);
          localStorage.setItem('courierSession', JSON.stringify(found));
        } else {
          setLoginError('Kuriér s týmto menom neexistuje. Kontaktujte administrátora.');
        }
      } else {
        setLoginError('Chyba pri načítaní kuriérov');
      }
    } catch {
      setLoginError('Chyba pri pripájaní na server');
    }
  };

  const handleToggleOnline = async () => {
    if (!courier) return;
    try {
      const res = await fetch(`/api/admin/couriers/${courier.id}/toggle`, {
        method: 'PATCH',
      });
      if (res.ok) {
        const updated = await res.json();
        setCourier((prev) => prev ? { ...prev, isOnline: updated.isOnline } : null);
        setIsOnline(updated.isOnline);
        localStorage.setItem('courierSession', JSON.stringify({ ...courier, isOnline: updated.isOnline }));
      }
    } catch {
      setError('Chyba pri zmene stavu');
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setIsUpdating(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : null);
        }
      } else {
        setError('Chyba pri aktualizácii stavu');
      }
    } catch {
      setError('Chyba pri komunikácii so serverom');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('courierSession');
    setCourier(null);
    setShowLogin(true);
    setSelectedOrder(null);
    setOrders([]);
    onLogout();
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  };

  // Login Screen
  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gastro-cream to-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gastro-dark-green rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Truck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-black text-gastro-dark-green">Kuriér</h1>
            <p className="text-gastro-ink/50 mt-2 text-sm">Reštaurácia Jašterka Hlohovec</p>
          </div>

          <div className="bg-white rounded-[32px] p-8 shadow-xl border border-gastro-beige/20">
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gastro-ink/50 mb-2 block">Meno kuriéra</label>
                <input
                  type="text"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Napríklad: Ján Kuriér"
                  className="w-full bg-gastro-cream/30 border border-gastro-beige rounded-2xl px-5 py-4 outline-none focus:border-gastro-dark-green text-lg"
                  autoFocus
                />
              </div>

              {loginError && (
                <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-medium flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {loginError}
                </div>
              )}

              <button
                onClick={handleLogin}
                className="w-full bg-gastro-dark-green text-white py-4 rounded-full font-black text-lg hover:bg-gastro-orange transition-colors"
              >
                Prihlásiť sa
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gastro-beige/20">
              <button
                onClick={onLogout}
                className="w-full text-center text-sm text-gastro-ink/40 hover:text-gastro-orange transition-colors"
              >
                ← Späť na hlavnú stránku
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main Courier Dashboard
  return (
    <div className="min-h-screen bg-gastro-cream">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gastro-beige/20">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gastro-dark-green rounded-full flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-black text-sm text-gastro-dark-green">{courier?.name}</div>
              <div className="text-[10px] text-gastro-ink/40 uppercase tracking-wider">{courier?.vehicleType}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleOnline}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-colors ${
                isOnline
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {isOnline ? (
                <><Wifi className="w-3 h-3" /> Online</>
              ) : (
                <><WifiOff className="w-3 h-3" /> Offline</>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gastro-beige/20 rounded-full transition-colors"
            >
              <LogOut className="w-5 h-5 text-gastro-ink/50" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6 pb-28">
        {/* Error */}
        {error && (
          <div className="mb-4 p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-medium flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
            <button onClick={() => setError('')} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-2xl p-5 border border-gastro-beige/20 shadow-sm">
                <div className="text-3xl font-black text-gastro-dark-green">{orders.length}</div>
                <div className="text-xs text-gastro-ink/40 uppercase tracking-wider mt-1">Aktívne objednávky</div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gastro-beige/20 shadow-sm">
                <div className="text-3xl font-black text-gastro-dark-green">
                  {orders.filter((o) => o.status === 'DELIVERING').length}
                </div>
                <div className="text-xs text-gastro-ink/40 uppercase tracking-wider mt-1">Práve na ceste</div>
              </div>
            </div>

            {/* Orders List */}
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-16 h-16 mx-auto text-gastro-ink/20 mb-4" />
                <h2 className="text-xl font-black text-gastro-ink/40">Žiadne aktívne objednávky</h2>
                <p className="text-sm text-gastro-ink/30 mt-2">Počkajte na priradenie objednávky administrátorom.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <motion.button
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedOrder(order)}
                    className="w-full text-left bg-white rounded-2xl p-5 border border-gastro-beige/20 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-xs text-gastro-ink/40 uppercase tracking-wider">
                          #{order.id.slice(-6)} • {formatTime(order.createdAt)}
                        </div>
                        <div className="font-black text-gastro-dark-green mt-1">{order.customerName}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>

                    {order.deliveryAddress && (
                      <div className="flex items-start gap-2 text-sm text-gastro-ink/60 mb-3">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-gastro-orange" />
                        <span>{order.deliveryAddress}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-gastro-beige/20">
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4 text-gastro-ink/40" />
                        <span className="text-gastro-ink/60">{order.items?.length || 0} položiek</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-black text-gastro-dark-green">{Number(order.total).toFixed(2)} €</span>
                        <ChevronRight className="w-4 h-4 text-gastro-ink/30" />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </>
        )}

        {/* EARNINGS TAB */}
        {activeTab === 'earnings' && (
          <>
            {isLoadingEarnings ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-gastro-dark-green" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Earnings Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-gastro-beige/20 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gastro-ink/40">Dnes</span>
                    </div>
                    <div className="text-2xl font-black text-gastro-dark-green">
                      {earningsSummary?.today?.toFixed(2) || '0.00'} €
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-gastro-beige/20 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gastro-ink/40">Tento Týždeň</span>
                    </div>
                    <div className="text-2xl font-black text-gastro-dark-green">
                      {earningsSummary?.thisWeek?.toFixed(2) || '0.00'} €
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-gastro-beige/20 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-gastro-orange" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gastro-ink/40">Celkovo</span>
                    </div>
                    <div className="text-2xl font-black text-gastro-dark-green">
                      {earningsSummary?.totalEarnings?.toFixed(2) || '0.00'} €
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-gastro-beige/20 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-gastro-ink/40" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gastro-ink/40">Doručení</span>
                    </div>
                    <div className="text-2xl font-black text-gastro-dark-green">
                      {earningsSummary?.deliveriesCount || 0}
                    </div>
                  </div>
                </div>

                {/* Delivery Tasks History */}
                <div className="bg-white rounded-2xl p-5 border border-gastro-beige/20 shadow-sm">
                  <h3 className="text-sm font-bold text-gastro-dark-green mb-4 flex items-center gap-2">
                    <List className="w-4 h-4" />
                    História doručení
                  </h3>
                  {deliveryTasks.length === 0 ? (
                    <p className="text-xs text-gastro-ink/40 italic text-center py-6">Zatiaľ žiadne doručenia</p>
                  ) : (
                    <div className="space-y-3">
                      {deliveryTasks.map((task: any) => (
                        <div key={task.id} className="flex items-center justify-between py-2 border-b border-gastro-beige/10 last:border-0">
                          <div>
                            <div className="text-xs font-bold text-gastro-dark-green">
                              #{task.orderId?.slice(-6) || 'N/A'}
                            </div>
                            <div className="text-[10px] text-gastro-ink/40">
                              {task.status === 'DELIVERED' ? '✅ Doručené' : task.status === 'PICKED_UP' ? '📦 Vyzdvihnuté' : '📋 Priradené'}
                            </div>
                          </div>
                          <div className="text-xs text-gastro-ink/40">
                            {task.createdAt ? formatDate(task.createdAt) : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Earnings History */}
                <div className="bg-white rounded-2xl p-5 border border-gastro-beige/20 shadow-sm">
                  <h3 className="text-sm font-bold text-gastro-dark-green mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Výplaty
                  </h3>
                  {earningsHistory.length === 0 ? (
                    <p className="text-xs text-gastro-ink/40 italic text-center py-6">Zatiaľ žiadne výplaty</p>
                  ) : (
                    <div className="space-y-3">
                      {earningsHistory.map((earning: any) => (
                        <div key={earning.id} className="flex items-center justify-between py-2 border-b border-gastro-beige/10 last:border-0">
                          <div>
                            <div className="text-xs font-bold text-gastro-dark-green">
                              {Number(earning.totalAmount).toFixed(2)} €
                            </div>
                            <div className="text-[10px] text-gastro-ink/40">
                              {earning.baseFee > 0 && `Základ ${Number(earning.baseFee).toFixed(2)}€`}
                              {earning.distanceBonus > 0 && ` + Vzdialenosť ${Number(earning.distanceBonus).toFixed(2)}€`}
                              {earning.batchBonus > 0 && ` + Batch ${Number(earning.batchBonus).toFixed(2)}€`}
                              {earning.peakHourBonus > 0 && ` + Peak ${Number(earning.peakHourBonus).toFixed(2)}€`}
                              {earning.performanceBonus > 0 && ` + Výkon ${Number(earning.performanceBonus).toFixed(2)}€`}
                            </div>
                          </div>
                          <div className="text-[10px] text-gastro-ink/40">
                            {earning.createdAt ? formatDate(earning.createdAt) : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* SHIFTS TAB */}
        {activeTab === 'shifts' && (
          <>
            {isLoadingShifts ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-gastro-dark-green" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-5 border border-gastro-beige/20 shadow-sm">
                  <h3 className="text-sm font-bold text-gastro-dark-green mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Moje smeny
                  </h3>
                  {shifts.length === 0 ? (
                    <p className="text-xs text-gastro-ink/40 italic text-center py-6">Zatiaľ žiadne smeny</p>
                  ) : (
                    <div className="space-y-3">
                      {shifts.map((shift: any) => (
                        <div key={shift.id} className="flex items-center justify-between py-3 border-b border-gastro-beige/10 last:border-0">
                          <div>
                            <div className="text-xs font-bold text-gastro-dark-green">
                              {shift.startTime ? formatDate(shift.startTime) : 'N/A'}
                            </div>
                            <div className="text-[10px] text-gastro-ink/40">
                              {shift.endTime ? `Do ${formatTime(shift.endTime)}` : 'Prebieha'}
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                            shift.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                            shift.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {shift.status === 'ACTIVE' ? 'Aktívna' : shift.status === 'COMPLETED' ? 'Dokončená' : 'Naplánovaná'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Tab Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gastro-beige/20">
        <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-4">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'orders' ? 'text-gastro-dark-green' : 'text-gastro-ink/30'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-wider">Objednávky</span>
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'earnings' ? 'text-gastro-dark-green' : 'text-gastro-ink/30'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-wider">Zárobok</span>
          </button>
          <button
            onClick={() => setActiveTab('shifts')}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'shifts' ? 'text-gastro-dark-green' : 'text-gastro-ink/30'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-wider">Smeny</span>
          </button>
        </div>
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white z-[101] rounded-t-[32px] shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-gastro-beige/40 rounded-full" />
              </div>

              <div className="px-6 pb-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="text-xs text-gastro-ink/40 uppercase tracking-wider mb-1">
                      Objednávka #{selectedOrder.id.slice(-6)}
                    </div>
                    <h2 className="text-2xl font-black text-gastro-dark-green">{selectedOrder.customerName}</h2>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 hover:bg-gastro-beige/20 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Status Badge */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-6 ${STATUS_COLORS[selectedOrder.status] || 'bg-gray-100 text-gray-600'}`}>
                  <Clock className="w-4 h-4" />
                  {STATUS_LABELS[selectedOrder.status] || selectedOrder.status}
                </div>

                {/* Delivery Info */}
                {selectedOrder.deliveryAddress && (
                  <div className="bg-gastro-cream/50 rounded-2xl p-5 mb-6 border border-gastro-beige/20">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gastro-orange shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-sm text-gastro-dark-green mb-1">Adresa doručenia</div>
                        <div className="text-sm text-gastro-ink/60">{selectedOrder.deliveryAddress}</div>
                        <div className="text-xs text-gastro-ink/40 mt-1">{selectedOrder.deliveryCity}</div>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedOrder.deliveryAddress + ', ' + selectedOrder.deliveryCity)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 flex items-center justify-center gap-2 w-full bg-gastro-dark-green text-white py-3 rounded-full text-sm font-bold hover:bg-gastro-orange transition-colors"
                    >
                      <Navigation className="w-4 h-4" />
                      Navigovať
                    </a>
                  </div>
                )}

                {/* Customer Contact */}
                <div className="flex gap-3 mb-6">
                  <a
                    href={`tel:${selectedOrder.customerPhone}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-white border border-gastro-beige/30 py-3 rounded-full text-sm font-bold hover:border-gastro-orange transition-colors"
                  >
                    <Phone className="w-4 h-4 text-gastro-dark-green" />
                    Zavolať
                  </a>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gastro-ink/50 uppercase tracking-wider mb-3">Položky objednávky</h3>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-gastro-beige/20 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-gastro-dark-green/10 rounded-full flex items-center justify-center text-xs font-bold text-gastro-dark-green">
                            {item.quantity}
                          </span>
                          <span className="text-sm font-medium">{item.menuItem?.name || item.itemName || 'Položka'}</span>
                        </div>
                        <span className="text-sm font-bold">{(Number(item.price) * item.quantity).toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="bg-gastro-dark-green/5 rounded-2xl p-5 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gastro-dark-green">Celková suma</span>
                    <span className="text-2xl font-black text-gastro-dark-green">{Number(selectedOrder.total).toFixed(2)} €</span>
                  </div>
                  {Number(selectedOrder.deliveryFee) > 0 && (
                    <div className="flex justify-between text-sm text-gastro-ink/50 mt-2">
                      <span>Doprava</span>
                      <span>{Number(selectedOrder.deliveryFee).toFixed(2)} €</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {selectedOrder.status === 'READY' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERING')}
                      disabled={isUpdating}
                      className="w-full bg-gastro-orange text-white py-4 rounded-full font-black text-lg hover:bg-gastro-dark-green transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isUpdating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <><Navigation className="w-5 h-5" /> Prevziať na doručenie</>
                      )}
                    </button>
                  )}

                  {selectedOrder.status === 'DELIVERING' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'COMPLETED')}
                      disabled={isUpdating}
                      className="w-full bg-green-600 text-white py-4 rounded-full font-black text-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isUpdating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <><CheckCircle2 className="w-5 h-5" /> Doručené</>
                      )}
                    </button>
                  )}

                  {selectedOrder.status === 'NEW' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'CONFIRMED')}
                      disabled={isUpdating}
                      className="w-full bg-gastro-dark-green text-white py-4 rounded-full font-black text-lg hover:bg-gastro-orange transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isUpdating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <><CheckCircle2 className="w-5 h-5" /> Potvrdiť objednávku</>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="w-full text-center text-sm text-gastro-ink/40 hover:text-gastro-orange transition-colors py-2"
                  >
                    Zavrieť
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
