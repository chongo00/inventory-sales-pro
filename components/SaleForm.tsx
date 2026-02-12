
import React, { useState } from 'react';
import { X, CreditCard, Banknote } from 'lucide-react';
import { Product, PaymentMethod } from '../types';

interface SaleFormProps {
  product: Product;
  onClose: () => void;
  onSubmit: (quantity: number, method: PaymentMethod) => void;
}

export const SaleForm: React.FC<SaleFormProps> = ({ product, onClose, onSubmit }) => {
  const [quantity, setQuantity] = useState(1);
  const [method, setMethod] = useState<PaymentMethod>('CASH');

  const total = quantity * product.salePrice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-slideUp">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Registrar Venta</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-slate-500 text-sm">Estás vendiendo:</p>
            <h4 className="text-xl font-bold text-indigo-600">{product.name}</h4>
            <p className="text-xs text-slate-400 mt-1">Precio Unitario: ${product.salePrice}</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Cantidad</label>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border rounded-xl flex items-center justify-center hover:bg-slate-50 font-bold"
                >-</button>
                <input 
                  type="number"
                  className="flex-1 text-center font-bold text-xl py-2 outline-none"
                  value={quantity}
                  readOnly
                />
                <button 
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-10 h-10 border rounded-xl flex items-center justify-center hover:bg-slate-50 font-bold"
                >+</button>
              </div>
              <p className="text-[10px] text-right text-slate-400">Disponible: {product.stock} un.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Método de Pago</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setMethod('CASH')}
                  className={`flex flex-col items-center gap-1 p-3 border-2 rounded-2xl transition-all ${
                    method === 'CASH' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-400'
                  }`}
                >
                  <Banknote size={24} />
                  <span className="text-xs font-bold uppercase tracking-tight">Efectivo</span>
                </button>
                <button 
                  onClick={() => setMethod('TRANSFER')}
                  className={`flex flex-col items-center gap-1 p-3 border-2 rounded-2xl transition-all ${
                    method === 'TRANSFER' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-400'
                  }`}
                >
                  <CreditCard size={24} />
                  <span className="text-xs font-bold uppercase tracking-tight">Transfer</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-6">
              <span className="text-slate-600 font-medium">Total a Pagar:</span>
              <span className="text-2xl font-black text-slate-900">${total.toLocaleString()}</span>
            </div>
            <button 
              onClick={() => onSubmit(quantity, method)}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg transition-transform active:scale-95"
            >
              Confirmar Venta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
