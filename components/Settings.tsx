
import React, { useState } from 'react';
import { Settings as SettingsIcon, Trash2, RefreshCw, Clock, AlertTriangle, Info } from 'lucide-react';

export type AutoResetPeriod = 'never' | 'weekly' | 'monthly' | 'quarterly';

interface SettingsProps {
  autoResetPeriod: AutoResetPeriod;
  lastResetDate: string | null;
  onUpdateAutoReset: (period: AutoResetPeriod) => void;
  onResetData: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  autoResetPeriod,
  lastResetDate,
  onUpdateAutoReset,
  onResetData,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleResetData = () => {
    setShowConfirm(false);
    onResetData();
  };

  const getNextResetDate = (): string | null => {
    if (autoResetPeriod === 'never' || !lastResetDate) return null;
    
    const last = new Date(lastResetDate);
    const next = new Date(last);
    
    switch (autoResetPeriod) {
      case 'weekly':
        next.setDate(last.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(last.getMonth() + 1);
        break;
      case 'quarterly':
        next.setMonth(last.getMonth() + 3);
        break;
    }
    
    return next.toLocaleDateString();
  };

  const periods = [
    { value: 'never', label: 'Nunca', desc: 'Las ventas nunca se resetean automáticamente' },
    { value: 'weekly', label: 'Semanal', desc: 'Resetea ventas cada 7 días' },
    { value: 'monthly', label: 'Mensual', desc: 'Resetea ventas cada mes' },
    { value: 'quarterly', label: 'Trimestral', desc: 'Resetea ventas cada 3 meses' },
  ];

  const nextReset = getNextResetDate();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Ajustes</h2>
        <p className="text-slate-500 text-sm">Configuración de la aplicación y gestión de datos.</p>
      </div>

      {/* Auto Reset Configuration */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <Clock size={20} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Auto-Reset de Datos</h3>
            <p className="text-xs text-slate-500">Las ventas se resetearán automáticamente según el período elegido</p>
          </div>
        </div>

        <div className="space-y-2">
          {periods.map((period) => (
            <button
              key={period.value}
              onClick={() => onUpdateAutoReset(period.value as AutoResetPeriod)}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all active:scale-[0.98] ${
                autoResetPeriod === period.value
                  ? 'bg-indigo-50 border-indigo-600'
                  : 'bg-white border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-bold ${autoResetPeriod === period.value ? 'text-indigo-900' : 'text-slate-800'}`}>
                    {period.label}
                  </p>
                  <p className={`text-xs ${autoResetPeriod === period.value ? 'text-indigo-600' : 'text-slate-500'}`}>
                    {period.desc}
                  </p>
                </div>
                {autoResetPeriod === period.value && (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {lastResetDate && (
          <div className="bg-slate-50 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Info size={14} />
              <span className="font-bold">Información de Reset</span>
            </div>
            <div className="text-sm space-y-1">
              <p className="text-slate-600">
                <span className="font-bold">Último reset:</span> {new Date(lastResetDate).toLocaleString()}
              </p>
              {nextReset && autoResetPeriod !== 'never' && (
                <p className="text-slate-600">
                  <span className="font-bold">Próximo reset:</span> {nextReset}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Manual Reset */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 rounded-xl">
            <Trash2 size={20} className="text-rose-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Reset Manual de Ventas</h3>
            <p className="text-xs text-slate-500">Elimina todas las ventas y resetea contadores</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <p className="font-bold mb-1">⚠️ Esta acción no se puede deshacer</p>
            <ul className="space-y-1 text-amber-700">
              <li>• Se eliminarán todas las ventas registradas</li>
              <li>• Los contadores de productos se resetearán (stock vuelve al inicial)</li>
              <li>• Los productos del inventario se mantienen intactos</li>
              <li>• Los ajustes de moneda y configuración se mantendrán</li>
            </ul>
          </div>
        </div>

        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors active:scale-95 flex items-center justify-center gap-2"
          >
            <Trash2 size={18} />
            Resetear Ventas
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-center text-sm font-bold text-slate-700">
              ¿Estás seguro? Se eliminarán todas las ventas.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetData}
                className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors active:scale-95"
              >
                Sí, Eliminar Todo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* App Info */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border space-y-2">
        <div className="flex items-center gap-2">
          <SettingsIcon size={18} className="text-slate-400" />
          <h3 className="font-bold text-slate-700 text-sm">Inventory & Sales Pro</h3>
        </div>
        <p className="text-xs text-slate-500">Versión 1.0.0</p>
        <p className="text-xs text-slate-400">Sistema de gestión de inventario y ventas offline-first</p>
      </div>
    </div>
  );
};
