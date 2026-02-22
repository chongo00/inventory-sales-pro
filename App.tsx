
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { Reports } from './components/Reports';
import { PosView } from './components/PosView';
import { Product, Sale, ViewType, PaymentMethod, CurrencyType } from './types';
import { CurrencySettings } from './components/CurrencySettings';
import { Settings, AutoResetPeriod } from './components/Settings';

const INITIAL_PRODUCTS: Product[] = [];

const STORAGE_VERSION = 'v4';
const STORAGE_VERSION_KEY = 'app_storage_version';
const PRODUCTS_KEY = 'app_products_v4';
const SALES_KEY = 'app_sales_v4';
const EXCHANGE_RATE_KEY = 'app_exchange_rate';
const AUTO_RESET_PERIOD_KEY = 'app_auto_reset_period';
const LAST_RESET_DATE_KEY = 'app_last_reset_date';
const LEGACY_KEYS = ['app_products_v3', 'app_sales_v3'];

let storageVersionChecked = false;
const ensureStorageVersion = () => {
  if (storageVersionChecked) return;
  storageVersionChecked = true;

  const currentVersion = localStorage.getItem(STORAGE_VERSION_KEY);
  if (currentVersion !== STORAGE_VERSION) {
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem(PRODUCTS_KEY);
    localStorage.removeItem(SALES_KEY);
    localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
  }
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('dashboard');
  
  const [products, setProducts] = useState<Product[]>(() => {
    ensureStorageVersion();
    const saved = localStorage.getItem(PRODUCTS_KEY);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    ensureStorageVersion();
    const saved = localStorage.getItem(SALES_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [exchangeRate, setExchangeRate] = useState<number>(() => {
    const saved = localStorage.getItem(EXCHANGE_RATE_KEY);
    return saved ? parseFloat(saved) : 495;
  });

  const [autoResetPeriod, setAutoResetPeriod] = useState<AutoResetPeriod>(() => {
    const saved = localStorage.getItem(AUTO_RESET_PERIOD_KEY);
    return (saved as AutoResetPeriod) || 'never';
  });

  const [lastResetDate, setLastResetDate] = useState<string | null>(() => {
    return localStorage.getItem(LAST_RESET_DATE_KEY);
  });

  useEffect(() => {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    localStorage.setItem(SALES_KEY, JSON.stringify(sales));
  }, [products, sales]);

  useEffect(() => {
    localStorage.setItem(EXCHANGE_RATE_KEY, exchangeRate.toString());
  }, [exchangeRate]);

  useEffect(() => {
    localStorage.setItem(AUTO_RESET_PERIOD_KEY, autoResetPeriod);
  }, [autoResetPeriod]);

  useEffect(() => {
    if (lastResetDate) {
      localStorage.setItem(LAST_RESET_DATE_KEY, lastResetDate);
    }
  }, [lastResetDate]);

  // Auto-reset check on mount and periodically
  useEffect(() => {
    const checkAutoReset = () => {
      if (autoResetPeriod === 'never' || !lastResetDate) return;

      const last = new Date(lastResetDate);
      const now = new Date();
      let shouldReset = false;

      switch (autoResetPeriod) {
        case 'weekly':
          shouldReset = now.getTime() - last.getTime() >= 7 * 24 * 60 * 60 * 1000;
          break;
        case 'monthly':
          shouldReset = now.getTime() - last.getTime() >= 30 * 24 * 60 * 60 * 1000;
          break;
        case 'quarterly':
          shouldReset = now.getTime() - last.getTime() >= 90 * 24 * 60 * 60 * 1000;
          break;
      }

      if (shouldReset) {
        handleResetData(true);
      }
    };

    checkAutoReset();
    const interval = setInterval(checkAutoReset, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, [autoResetPeriod, lastResetDate]);

  const addProduct = (product: Omit<Product, 'id' | 'soldCount' | 'initialStock'>) => {
    const newProduct: Product = {
      ...product,
      id: Math.random().toString(36).substr(2, 9),
      initialStock: product.stock,
      soldCount: 0,
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const registerSale = (productId: string, quantity: number, paymentMethod: PaymentMethod, customerInfo?: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock < quantity) return;

    const newSale: Sale = {
      id: Math.random().toString(36).substr(2, 9),
      productId,
      productName: product.name,
      quantity,
      unit: product.unit,
      unitPrice: product.salePrice,
      totalAmount: product.salePrice * quantity,
      currency: product.currency,
      paymentMethod,
      customerInfo,
      isPaid: paymentMethod !== 'FIAO',
      timestamp: new Date().toISOString(),
    };

    setSales(prev => [...prev, newSale]);
    setProducts(prev => prev.map(p => 
      p.id === productId 
        ? { ...p, stock: p.stock - quantity, soldCount: p.soldCount + quantity } 
        : p
    ));
  };

  const settleFiao = (saleId: string, finalMethod: 'CASH' | 'TRANSFER') => {
    setSales(prev => prev.map(s => 
      s.id === saleId 
        ? { ...s, paymentMethod: finalMethod, isPaid: true, customerInfo: (s.customerInfo || '') + ' (PAGADO)' } 
        : s
    ));
  };

  const onChangePaymentMethod = (saleId: string, method: 'CASH') => {
    setSales(prev => prev.map(s => 
      s.id === saleId && s.paymentMethod === 'TRANSFER' ? { ...s, paymentMethod: method } : s
    ));
  };

  const onDeleteSale = (saleId: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;
    setSales(prev => prev.filter(s => s.id !== saleId));
    setProducts(prev => prev.map(p => 
      p.id === sale.productId 
        ? { ...p, stock: p.stock + sale.quantity, soldCount: Math.max(0, p.soldCount - sale.quantity) } 
        : p
    ));
  };

  const [resetNotification, setResetNotification] = useState<{ visible: boolean; auto: boolean; closing: boolean }>({ visible: false, auto: false, closing: false });

  const handleResetData = (isAuto = false) => {
    // Only clear sales - products and reports are preserved
    setSales([]);
    // Reset product soldCount and restore stock to initialStock
    setProducts(prev => prev.map(p => ({ ...p, soldCount: 0, stock: p.initialStock })));
    setLastResetDate(new Date().toISOString());
    localStorage.removeItem(SALES_KEY);
    // Show notification
    setResetNotification({ visible: true, auto: isAuto, closing: false });
    setTimeout(() => {
      setResetNotification(prev => prev.visible ? { ...prev, closing: true } : prev);
      setTimeout(() => setResetNotification({ visible: false, auto: false, closing: false }), 400);
    }, 5000);
  };

  const handleUpdateAutoReset = (period: AutoResetPeriod) => {
    setAutoResetPeriod(period);
    if (!lastResetDate) {
      setLastResetDate(new Date().toISOString());
    }
  };

  return (
    <Layout currentView={view} setView={setView}>
      <main className="p-4 md:p-8 max-w-7xl mx-auto animate-fadeIn min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-0px)]">
        {view === 'dashboard' && <Dashboard products={products} sales={sales} onRegisterSale={registerSale} />}
        {view === 'inventory' && (
          <Inventory 
            products={products} 
            addProduct={addProduct} 
            updateProduct={updateProduct} 
            deleteProduct={deleteProduct}
          />
        )}
        {view === 'pos' && <PosView products={products} onRegisterSale={registerSale} />}
        {view === 'reports' && <Reports sales={sales} products={products} onSettleFiao={settleFiao} onChangePaymentMethod={onChangePaymentMethod} onDeleteSale={onDeleteSale} exchangeRate={exchangeRate} />}
        {view === 'currency' && <CurrencySettings exchangeRate={exchangeRate} onUpdateRate={setExchangeRate} />}
        {view === 'settings' && (
          <Settings 
            autoResetPeriod={autoResetPeriod}
            lastResetDate={lastResetDate}
            onUpdateAutoReset={handleUpdateAutoReset}
            onResetData={() => handleResetData(false)}
          />
        )}
      </main>

      {/* Reset Notification Toast */}
      {resetNotification.visible && (
        <div 
          className={`fixed top-4 right-4 left-4 md:right-6 md:left-auto md:w-96 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 z-50 transition-all duration-400 ${
            resetNotification.closing 
              ? 'translate-x-[110%] opacity-0' 
              : 'translate-x-0 opacity-100'
          }`}
          style={{ transition: 'transform 0.4s ease-out, opacity 0.4s ease-out' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-800 text-sm">
                {resetNotification.auto ? 'Reset Automático Completado' : 'Datos Reseteados'}
              </h4>
              <p className="text-slate-500 text-xs">
                {resetNotification.auto 
                  ? 'Las ventas fueron reseteadas según la configuración programada.' 
                  : 'Las ventas han sido eliminadas. Los productos e inventario se mantienen.'}
              </p>
            </div>
            <button 
              onClick={() => {
                setResetNotification(prev => ({ ...prev, closing: true }));
                setTimeout(() => setResetNotification({ visible: false, auto: false, closing: false }), 400);
              }}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
