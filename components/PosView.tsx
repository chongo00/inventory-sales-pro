
import React, { useState, useMemo } from 'react';
import { Search, ShoppingCart, Banknote, CreditCard, UserPlus, CheckCircle } from 'lucide-react';
import { Product, PaymentMethod } from '../types';

interface PosViewProps {
  products: Product[];
  onRegisterSale: (productId: string, qty: number, method: PaymentMethod, customerInfo?: string) => void;
}

export const PosView: React.FC<PosViewProps> = ({ products, onRegisterSale }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [customerInfo, setCustomerInfo] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const filteredProducts = useMemo(() => 
    products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.stock > 0),
  [products, searchTerm]);

  const total = useMemo(() => 
    selectedProduct ? selectedProduct.salePrice * quantity : 0,
  [selectedProduct, quantity]);

  const handleRegister = () => {
    if (!selectedProduct) return;
    onRegisterSale(selectedProduct.id, quantity, paymentMethod, paymentMethod === 'FIAO' ? customerInfo : undefined);
    
    // Reset form
    setSelectedProduct(null);
    setQuantity(1);
    setPaymentMethod('CASH');
    setCustomerInfo('');
    setSearchTerm('');
    
    // Show feedback
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Product Selection */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Nueva Venta</h2>
        <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar producto disponible..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
            {filteredProducts.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProduct(p)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  selectedProduct?.id === p.id ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-100 hover:bg-slate-50'
                }`}
              >
                <div className="text-left">
                  <p className="font-bold text-slate-700">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.category} • ${p.salePrice}/{p.unit}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-indigo-600">{p.stock} {p.unit} disponibles</p>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <p className="text-center py-8 text-slate-400 italic">No hay productos disponibles.</p>
            )}
          </div>
        </div>
      </div>

      {/* Sale Confirmation */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Detalles de Venta</h2>
        <div className="bg-white p-4 md:p-6 rounded-3xl border shadow-lg space-y-4 md:space-y-6 min-h-[350px] md:min-h-[500px] flex flex-col">
          {!selectedProduct ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
              <ShoppingCart size={64} className="mb-4 opacity-20" />
              <p className="font-medium">Seleccione un producto para continuar</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg md:text-xl font-black text-slate-800 truncate">{selectedProduct.name}</h3>
                  <p className="text-xs md:text-sm text-slate-400 font-medium">Precio: ${selectedProduct.salePrice.toFixed(2)} por {selectedProduct.unit}</p>
                </div>
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase shrink-0">
                  Venta en {selectedProduct.unit}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Cantidad a vender ({selectedProduct.unit})</label>
                <div className="flex items-center gap-2 md:gap-4">
                  <button 
                    onClick={() => setQuantity(q => Math.max(0.1, q - 1))} 
                    className="w-14 h-14 md:w-12 md:h-12 border-2 rounded-xl flex items-center justify-center hover:bg-slate-50 text-2xl font-bold active:scale-95 transition-transform shrink-0"
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    step="0.01"
                    className="flex-1 text-center font-black text-xl md:text-2xl py-2 outline-none border rounded-xl min-w-0"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(selectedProduct.stock, parseFloat(e.target.value) || 0))}
                  />
                  <button 
                    onClick={() => setQuantity(q => Math.min(selectedProduct.stock, q + 1))} 
                    className="w-14 h-14 md:w-12 md:h-12 border-2 rounded-xl flex items-center justify-center hover:bg-slate-50 text-2xl font-bold active:scale-95 transition-transform shrink-0"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-600">Forma de Pago</label>
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  <button onClick={() => setPaymentMethod('CASH')} className={`flex flex-col items-center gap-1 p-2 md:p-3 border-2 rounded-2xl transition-all ${paymentMethod === 'CASH' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-400'}`}>
                    <Banknote size={20} /><span className="text-[10px] font-bold uppercase">Efectivo</span>
                  </button>
                  <button onClick={() => setPaymentMethod('TRANSFER')} className={`flex flex-col items-center gap-1 p-2 md:p-3 border-2 rounded-2xl transition-all ${paymentMethod === 'TRANSFER' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-400'}`}>
                    <CreditCard size={20} /><span className="text-[10px] font-bold uppercase">Transf.</span>
                  </button>
                  <button onClick={() => setPaymentMethod('FIAO')} className={`flex flex-col items-center gap-1 p-2 md:p-3 border-2 rounded-2xl transition-all ${paymentMethod === 'FIAO' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-100 text-slate-400'}`}>
                    <UserPlus size={20} /><span className="text-[10px] font-bold uppercase">Fiao</span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'FIAO' && (
                <div className="space-y-2 animate-fadeIn">
                  <label className="text-sm font-bold text-slate-600">Descripción del Cliente (Deudor)</label>
                  <textarea 
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-rose-500 min-h-[60px] md:min-h-[80px]"
                    placeholder="Nombre del cliente y detalles de la deuda..."
                    value={customerInfo}
                    onChange={(e) => setCustomerInfo(e.target.value)}
                  />
                </div>
              )}

              <div className="mt-auto pt-4 md:pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-slate-500 text-sm font-medium">Subtotal Venta</p>
                  <p className="text-2xl md:text-3xl font-black text-slate-900">${total.toLocaleString()}</p>
                </div>
                <button 
                  onClick={handleRegister}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-bold shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Procesar Pago
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showSuccess && (
        <div className="fixed bottom-10 right-10 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slideUp">
          <CheckCircle size={24} />
          <span className="font-bold">¡Venta registrada con éxito!</span>
        </div>
      )}
    </div>
  );
};
