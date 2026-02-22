
import React from 'react';
import { LayoutDashboard, Package, BarChart3, ShoppingCart, Menu, X, Box, DollarSign, Settings } from 'lucide-react';
import { ViewType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewType;
  setView: (view: ViewType) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', name: 'Ventas', icon: ShoppingCart },
    { id: 'inventory', name: 'Inventario', icon: Package },
    { id: 'reports', name: 'Reportes', icon: BarChart3 },
    { id: 'currency', name: 'Moneda', icon: DollarSign },
    { id: 'settings', name: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
        <button 
          onClick={() => setIsOpen(true)} 
          className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-600 transition-all duration-200"
          aria-label="Open menu"
        >
          <Menu size={24} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-2">
          <Box size={28} className="text-indigo-600" strokeWidth={2.5} />
          <h1 className="font-black text-indigo-600 text-lg tracking-tighter">SalesPro</h1>
        </div>
      </header>

      {/* Sidebar / Mobile Menu */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-white border-r w-72 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Box size={32} className="text-indigo-600" strokeWidth={2} />
              <h1 className="font-black text-indigo-600 text-2xl tracking-tighter">SalesPro</h1>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="md:hidden p-2 hover:bg-slate-50 rounded-xl text-slate-400"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>
          
          <nav className="space-y-2 flex-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setView(item.id as ViewType);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-bold transition-all duration-200 ease-out active:scale-[0.98]
                    ${currentView === item.id 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  <Icon size={20} />
                  {item.name}
                </button>
              );
            })}
          </nav>
          
          <div className="mt-auto pt-6 border-t border-slate-100 text-[10px] text-slate-400 font-medium uppercase tracking-widest text-center">
            Pro Version 1.3
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-slate-50">
        {children}
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
