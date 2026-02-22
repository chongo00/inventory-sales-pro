
import React, { useState } from 'react';
import { X, Tag } from 'lucide-react';
import { Product, UnitType, CurrencyType } from '../types';

interface ProductFormProps {
  initialData?: Product;
  onClose: () => void;
  onSubmit: (data: Omit<Product, 'id' | 'soldCount' | 'initialStock'>) => void;
  existingCategories: string[];
  exchangeRate: number;
}

export const ProductForm: React.FC<ProductFormProps> = ({ initialData, onClose, onSubmit, existingCategories, exchangeRate }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || '',
    purchasePrice: initialData?.purchasePrice || 0,
    salePrice: initialData?.salePrice || 0,
    currency: initialData?.currency || 'CUP' as CurrencyType,
    stock: initialData?.stock || 0,
    unit: initialData?.unit || 'UND' as UnitType,
  });

  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(existingCategories.length === 0);

  const profit = formData.salePrice - formData.purchasePrice;
  const totalMargin = profit * formData.stock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = exchangeRate > 0 ? exchangeRate : 495;
    let finalData: Omit<Product, 'id' | 'soldCount' | 'initialStock'> = {
      ...formData,
      category: showNewCategory && newCategory ? newCategory : formData.category
    };
    if (finalData.currency === 'USD') {
      finalData = {
        ...finalData,
        currency: 'CUP',
        purchasePrice: Math.round(finalData.purchasePrice * rate),
        salePrice: Math.round(finalData.salePrice * rate),
        purchasePriceUsd: finalData.purchasePrice,
        salePriceUsd: finalData.salePrice,
      };
    } else {
      finalData = { ...finalData, purchasePriceUsd: undefined, salePriceUsd: undefined };
    }
    onSubmit(finalData);
  };

  const handleNumChange = (field: string, val: string) => {
    // If input is empty, set to 0 to avoid showing '0' while typing
    const num = val === '' ? 0 : parseFloat(val);
    setFormData({ ...formData, [field]: isNaN(num) ? 0 : num });
  };

  const inputClasses = "w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-slate-700 font-bold placeholder:text-slate-300 outline-none transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-slideUp border border-slate-100 max-h-[95vh] flex flex-col">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white z-20">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              {initialData ? 'Actualizar Producto' : 'Nuevo Producto'}
            </h3>
            <p className="text-slate-400 text-sm font-medium">Define los detalles del artículo.</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nombre del Producto</label>
            <input 
              required 
              className={inputClasses}
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              placeholder="Ej: Camisa de Seda"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Categoría</label>
              {showNewCategory ? (
                <div className="space-y-2">
                  <input 
                    required
                    className={inputClasses}
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    placeholder="Nombre de la categoría..."
                  />
                  {existingCategories.length > 0 && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowNewCategory(false);
                        setNewCategory('');
                        setFormData({ ...formData, category: '' });
                      }}
                      className="text-indigo-600 text-xs font-bold hover:underline"
                    >
                      o seleccionar existente
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <select 
                    required
                    className={inputClasses}
                    value={formData.category}
                    onChange={e => {
                      if (e.target.value === '__NEW__') {
                        setShowNewCategory(true);
                        setFormData({ ...formData, category: '' });
                      } else {
                        setFormData({ ...formData, category: e.target.value });
                      }
                    }}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="__NEW__">✚ Crear nueva categoría</option>
                    {existingCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Medida</label>
              <select 
                className={inputClasses}
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value as UnitType })}
              >
                <option value="UND">Unidades (UND)</option>
                <option value="LB">Libras (LB)</option>
              </select>
            </div>
          </div>

          {formData.unit === 'LB' && (
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Cantidad de Libras por Unidad</label>
              <input 
                type="number" 
                step="0.01" 
                className={inputClasses}
                value={formData.stock === 0 ? '' : formData.stock} 
                onChange={e => handleNumChange('stock', e.target.value)} 
                placeholder="Ej: 2.5"
              />
              <p className="text-[10px] text-slate-400">Especifica cuántas libras contiene cada unidad</p>
            </div>
          )}

          {initialData?.salePriceUsd != null && (
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-800">
              <strong>Producto con origen en USD.</strong> Los valores abajo están en CUP (actualizados con la tasa de cambio). Al cambiar la tasa en Moneda, este producto se actualizará.
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Moneda</label>
              <select 
                className={inputClasses}
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value as CurrencyType })}
              >
                <option value="CUP">CUP</option>
                <option value="USD">USD (se convierte a CUP al guardar)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">P. Compra</label>
              <input 
                required 
                type="number" 
                step="0.01" 
                className={inputClasses}
                value={formData.purchasePrice === 0 ? '' : formData.purchasePrice} 
                onChange={e => handleNumChange('purchasePrice', e.target.value)} 
                placeholder="0.00"
              />
              {initialData?.purchasePriceUsd != null && (
                <p className="text-[10px] text-slate-400">Origen: $ {initialData.purchasePriceUsd.toFixed(2)} USD</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">P. Venta</label>
              <input 
                required 
                type="number" 
                step="0.01" 
                className={inputClasses}
                value={formData.salePrice === 0 ? '' : formData.salePrice} 
                onChange={e => handleNumChange('salePrice', e.target.value)} 
                placeholder="0.00"
              />
              {initialData?.salePriceUsd != null && (
                <p className="text-[10px] text-slate-400">Origen: $ {initialData.salePriceUsd.toFixed(2)} USD</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Stock Disponible ({formData.unit})
            </label>
            <input 
              required 
              type="number" 
              step="0.01" 
              className={inputClasses}
              value={formData.stock === 0 ? '' : formData.stock} 
              onChange={e => handleNumChange('stock', e.target.value)} 
              placeholder={formData.unit === 'LB' ? "Ej: 15.5" : "Ej: 50"} 
            />
          </div>

          <div className="space-y-3">
            <div className="p-5 bg-indigo-600 rounded-3xl flex items-center justify-between text-white shadow-xl shadow-indigo-100">
              <div>
                <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Margen por unidad</p>
                <p className="text-xl font-black">${profit.toLocaleString()} {formData.currency}</p>
              </div>
              <Tag size={24} className="opacity-40" />
            </div>
            <div className="p-5 bg-slate-100 rounded-3xl flex items-center justify-between border border-slate-200">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Margen ganancia total (con stock)</p>
                <p className="text-lg font-black text-slate-800">${totalMargin.toLocaleString()} {formData.currency}</p>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-3xl font-black shadow-2xl transition-all active:scale-95 mt-4">
            {initialData ? 'Guardar Cambios' : 'Confirmar Registro'}
          </button>
        </form>
      </div>
    </div>
  );
};
