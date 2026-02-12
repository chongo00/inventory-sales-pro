
import React, { useMemo } from 'react';
import { TrendingUp, Package, ShoppingCart, DollarSign, Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Product, Sale } from '../types';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
}

export const Dashboard: React.FC<DashboardProps> = ({ products, sales }) => {
  const stats = useMemo(() => {
    const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
    const totalSold = products.reduce((acc, p) => acc + p.soldCount, 0);
    const initialStockSum = products.reduce((acc, p) => acc + p.initialStock, 0);
    const remaining = totalStock; // As per user request: Stock actual
    
    // Profit = (SalePrice - PurchasePrice) * quantity_sold
    const totalProfit = products.reduce((acc, p) => 
      acc + ((p.salePrice - p.purchasePrice) * p.soldCount), 0
    );
    
    const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);

    return { totalStock, totalSold, remaining, totalProfit, totalRevenue };
  }, [products, sales]);

  const pieData = [
    { name: 'Vendidos', value: stats.totalSold, color: '#6366f1' },
    { name: 'En Stock', value: stats.totalStock, color: '#f43f5e' },
  ];

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    products.forEach(p => {
      cats[p.category] = (cats[p.category] || 0) + p.stock;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [products]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Resumen del Negocio</h2>
        <p className="text-slate-500">Vista rápida del estado de tu inventario y ventas.</p>
      </div>

      {/* Stats Grid - 2x2 Layout */}
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        <StatCard 
          title="Stock Total" 
          value={stats.totalStock} 
          icon={<Package className="text-indigo-600" />} 
          subtitle="Unidades disponibles"
        />
        <StatCard 
          title="Total Vendidos" 
          value={stats.totalSold} 
          icon={<ShoppingCart className="text-emerald-600" />} 
          subtitle="Unidades facturadas"
        />
        <StatCard 
          title="Ganancia Total" 
          value={`$${stats.totalProfit.toLocaleString()}`} 
          icon={<TrendingUp className="text-blue-600" />} 
          subtitle="Utilidad neta acumulada"
        />
        <StatCard 
          title="Faltante por Vender" 
          value={stats.remaining} 
          icon={<Wallet className="text-rose-600" />} 
          subtitle="Unidades pendientes"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales vs Stock Chart */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm h-96 flex flex-col">
          <h3 className="font-semibold text-slate-700 mb-6">Proporción de Inventario</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm h-96 flex flex-col">
          <h3 className="font-semibold text-slate-700 mb-6">Stock por Categoría</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; subtitle: string }> = ({ title, value, icon, subtitle }) => (
  <div className="bg-white p-3 md:p-6 rounded-2xl border shadow-sm transition-transform hover:scale-[1.02]">
    <div className="flex justify-between items-start mb-2 md:mb-4">
      <div className="p-1.5 md:p-2 bg-slate-50 rounded-lg text-sm md:text-base">{icon}</div>
    </div>
    <div>
      <p className="text-slate-500 text-xs md:text-sm font-medium">{title}</p>
      <h4 className="text-xl md:text-2xl font-bold text-slate-800 my-0.5 md:my-1">{value}</h4>
      <p className="text-slate-400 text-[10px] md:text-xs">{subtitle}</p>
    </div>
  </div>
);
