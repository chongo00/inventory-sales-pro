
import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, TrendingUp, Filter } from 'lucide-react';
import { Product } from '../types';
import { ProductForm } from './ProductForm';

interface InventoryProps {
  products: Product[];
  addProduct: (p: Omit<Product, 'id' | 'soldCount' | 'initialStock'>) => void;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ products, addProduct, updateProduct, deleteProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category)));
    return ['all', ...cats];
  }, [products]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setShowProductModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Inventario</h2>
          <p className="text-slate-500 text-sm">Administra productos, categorías y tipos de moneda.</p>
        </div>
        <button 
          onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-xl active:scale-95"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar por nombre o categoría..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative min-w-[180px]">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-bold appearance-none cursor-pointer"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? 'Todas las Categorías' : cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] uppercase tracking-widest font-black">
                <th className="px-6 py-5">Producto</th>
                <th className="px-6 py-5">Unidad</th>
                <th className="px-6 py-5 text-center">Stock</th>
                <th className="px-6 py-5">P. Compra</th>
                <th className="px-6 py-5">P. Venta</th>
                <th className="px-6 py-5 text-emerald-600">Margen</th>
                <th className="px-6 py-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => {
                const profit = product.salePrice - product.purchasePrice;
                return (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-700">{product.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{product.category}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-black px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg">
                        {product.unit}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-black ${
                        product.stock <= 5 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-400 text-sm font-medium">
                      {product.currency === 'USD' ? '$' : 'CUP '}{product.purchasePrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-5 text-indigo-600 font-black text-sm">
                      {product.currency === 'USD' ? '$' : 'CUP '}{product.salePrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1.5 text-emerald-600 font-black text-sm">
                        <TrendingUp size={14} />
                        {product.currency === 'USD' ? '$' : ''}{profit.toFixed(2)}{product.currency === 'CUP' ? ' CUP' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEdit(product)}
                          className="p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => { if(confirm('¿Seguro?')) deleteProduct(product.id) }}
                          className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-300 italic font-medium">
                    No se encontraron productos disponibles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showProductModal && (
        <ProductForm 
          onClose={() => { setShowProductModal(false); setEditingProduct(null); }} 
          onSubmit={(data) => {
            if (editingProduct) {
              updateProduct({ ...editingProduct, ...data });
            } else {
              addProduct(data);
            }
            setShowProductModal(false);
          }}
          initialData={editingProduct || undefined}
          existingCategories={categories.filter(c => c !== 'all')}
        />
      )}
    </div>
  );
};
