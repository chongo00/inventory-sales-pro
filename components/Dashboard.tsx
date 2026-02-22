
import React, { useMemo, useState } from 'react';
import { TrendingUp, Package, ShoppingCart, Wallet, Search, Banknote, CreditCard, UserPlus, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Product, Sale, PaymentMethod } from '../types';

export type DashboardTimeFilter = 'today' | 'yesterday' | 'thisMonth';

function getMonthKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function getRange(filter: DashboardTimeFilter, monthKey?: string): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (filter === 'today') {
    return { start, end };
  }
  if (filter === 'yesterday') {
    start.setDate(start.getDate() - 1);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  // thisMonth: use monthKey (e.g. "2025-02") or current month
  const [y, m] = monthKey ? monthKey.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1];
  start.setFullYear(y);
  start.setMonth(m - 1);
  start.setDate(1);
  end.setFullYear(y);
  end.setMonth(m);
  end.setDate(0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function isInRange(isoDate: string, start: Date, end: Date): boolean {
  const d = new Date(isoDate);
  return d >= start && d <= end;
}

interface DashboardProps {
  products: Product[];
  sales: Sale[];
  onRegisterSale: (productId: string, qty: number, method: PaymentMethod, customerInfo?: string) => void;
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
function monthKeyToLabel(key: string): string {
  const [y, m] = key.split('-');
  const name = MONTH_NAMES[parseInt(m, 10) - 1] || m;
  return `${name} ${y}`;
}

export const Dashboard: React.FC<DashboardProps> = ({ products, sales, onRegisterSale }) => {
  const now = new Date();
  const currentMonthKey = getMonthKey(now);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    sales.forEach(s => set.add(getMonthKey(new Date(s.timestamp))));
    set.add(currentMonthKey);
    return Array.from(set).sort().reverse();
  }, [sales, currentMonthKey]);

  const [timeFilter, setTimeFilter] = useState<DashboardTimeFilter>('today');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(currentMonthKey);
  const [quickSearch, setQuickSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [customerInfo, setCustomerInfo] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const { start, end } = useMemo(() => 
    timeFilter === 'thisMonth' ? getRange('thisMonth', selectedMonthKey) : getRange(timeFilter),
  [timeFilter, selectedMonthKey]);

  const filteredSales = useMemo(() => 
    sales.filter(s => isInRange(s.timestamp, start, end)),
  [sales, start, end]);

  const stats = useMemo(() => {
    const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
    const totalSoldInPeriod = filteredSales.reduce((acc, s) => acc + s.quantity, 0);
    const remaining = totalStock;

    const totalProfitInPeriod = filteredSales.reduce((acc, s) => {
      const product = products.find(p => p.id === s.productId);
      if (!product) return acc;
      const margin = product.salePrice - product.purchasePrice;
      return acc + margin * s.quantity;
    }, 0);

    const totalSoldAll = products.reduce((acc, p) => acc + p.soldCount, 0);

    return { totalStock, totalSoldInPeriod, remaining, totalProfitInPeriod, totalSoldAll };
  }, [products, filteredSales]);

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    products.forEach(p => {
      cats[p.category] = (cats[p.category] || 0) + p.stock;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [products]);

  const quickProducts = useMemo(() => {
    const list = products
      .filter(p => p.stock > 0 && p.name.toLowerCase().includes(quickSearch.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, quickSearch]);

  const total = useMemo(() => 
    selectedProduct ? selectedProduct.salePrice * quantity : 0,
  [selectedProduct, quantity]);

  const handleQuickSale = () => {
    if (!selectedProduct) return;
    onRegisterSale(selectedProduct.id, quantity, paymentMethod, paymentMethod === 'FIAO' ? customerInfo : undefined);
    setSelectedProduct(null);
    setQuantity(1);
    setPaymentMethod('CASH');
    setCustomerInfo('');
    setQuickSearch('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const filterLabels: { key: DashboardTimeFilter; label: string }[] = [
    { key: 'today', label: 'Hoy' },
    { key: 'yesterday', label: 'Ayer' },
    { key: 'thisMonth', label: 'Este mes' },
  ];

  const subtitleLabel = timeFilter === 'today' ? 'Hoy' : timeFilter === 'yesterday' ? 'Ayer' : monthKeyToLabel(selectedMonthKey);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Resumen del Negocio</h2>
          <p className="text-slate-500 text-sm">Vista rápida del estado de tu inventario y ventas.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex flex-wrap gap-2 bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm">
            {filterLabels.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTimeFilter(key)}
                className={`px-3 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                  timeFilter === key ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {timeFilter === 'thisMonth' && availableMonths.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Mes:</label>
              <select
                value={selectedMonthKey}
                onChange={(e) => setSelectedMonthKey(e.target.value)}
                className="bg-white border border-slate-100 rounded-xl px-3 py-2 shadow-sm text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
              >
                {availableMonths.map(key => (
                  <option key={key} value={key}>{monthKeyToLabel(key)}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-6">
        <StatCard
          title="Stock Total"
          value={stats.totalStock}
          icon={<Package className="text-indigo-600" size={20} />}
          subtitle="Unidades disponibles"
        />
        <StatCard
          title="Total Vendidos"
          value={stats.totalSoldInPeriod}
          icon={<ShoppingCart className="text-emerald-600" size={20} />}
          subtitle={subtitleLabel}
        />
        <StatCard
          title="Ganancia Total"
          value={`$${stats.totalProfitInPeriod.toLocaleString()}`}
          icon={<TrendingUp className="text-blue-600" size={20} />}
          subtitle="Margen en el periodo"
        />
        <StatCard
          title="Faltante por Vender"
          value={stats.remaining}
          icon={<Wallet className="text-rose-600" size={20} />}
          subtitle="Unidades pendientes"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Ventas rápidas (reemplaza Proporción de inventario) */}
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col min-h-[320px] md:min-h-[380px]">
          <h3 className="font-semibold text-slate-700 mb-4">Ventas Rápidas</h3>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar producto..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
            />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 max-h-[220px] md:max-h-[260px]">
            {quickProducts.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProduct(p)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  selectedProduct?.id === p.id ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-100 hover:bg-slate-50'
                }`}
              >
                <span className="font-medium text-slate-700 text-sm truncate">{p.name}</span>
                <span className="text-xs font-bold text-indigo-600 shrink-0 ml-2">{p.stock} {p.unit}</span>
              </button>
            ))}
            {quickProducts.length === 0 && (
              <p className="text-center py-6 text-slate-400 text-sm italic">No hay productos disponibles.</p>
            )}
          </div>
          {selectedProduct && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500">Cantidad</label>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setQuantity(q => Math.max(0.1, q - 1))} className="w-9 h-9 border rounded-lg flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50">−</button>
                  <input type="number" step="0.01" min={0.1} max={selectedProduct.stock} className="w-16 text-center py-1.5 border rounded-lg text-sm font-bold" value={quantity} onChange={e => setQuantity(Math.min(selectedProduct.stock, parseFloat(e.target.value) || 0))} />
                  <button type="button" onClick={() => setQuantity(q => Math.min(selectedProduct.stock, q + 1))} className="w-9 h-9 border rounded-lg flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50">+</button>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPaymentMethod('CASH')} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold ${paymentMethod === 'CASH' ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500' : 'border border-slate-200 text-slate-500'}`}><Banknote size={14} /> Efectivo</button>
                <button type="button" onClick={() => setPaymentMethod('TRANSFER')} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold ${paymentMethod === 'TRANSFER' ? 'bg-blue-100 text-blue-700 border-2 border-blue-500' : 'border border-slate-200 text-slate-500'}`}><CreditCard size={14} /> Transf.</button>
                <button type="button" onClick={() => setPaymentMethod('FIAO')} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold ${paymentMethod === 'FIAO' ? 'bg-rose-100 text-rose-700 border-2 border-rose-500' : 'border border-slate-200 text-slate-500'}`}><UserPlus size={14} /> Fiao</button>
              </div>
              {paymentMethod === 'FIAO' && (
                <input type="text" placeholder="Cliente (deudor)" className="w-full px-3 py-2 border rounded-xl text-sm" value={customerInfo} onChange={e => setCustomerInfo(e.target.value)} />
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600">${total.toLocaleString()}</span>
                <button type="button" onClick={handleQuickSale} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold">Vender</button>
              </div>
            </div>
          )}
        </div>

        {/* Stock por Categoría */}
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col min-h-[320px] md:min-h-[380px]">
          <h3 className="font-semibold text-slate-700 mb-4">Stock por Categoría</h3>
          <div className="flex-1 min-h-[240px] md:min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed bottom-6 right-6 md:right-8 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2 z-50 animate-slideUp">
          <CheckCircle size={22} />
          <span className="font-bold text-sm">Venta registrada</span>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; subtitle: string }> = ({ title, value, icon, subtitle }) => (
  <div className="bg-white p-3 md:p-5 rounded-2xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.01]">
    <div className="flex justify-between items-start mb-2">
      <div className="p-1.5 md:p-2 bg-slate-50 rounded-lg">{icon}</div>
    </div>
    <p className="text-slate-500 text-xs md:text-sm font-medium">{title}</p>
    <h4 className="text-lg md:text-xl font-bold text-slate-800 my-0.5">{value}</h4>
    <p className="text-slate-400 text-[10px] md:text-xs">{subtitle}</p>
  </div>
);
