
import React, { useState } from 'react';
import { DollarSign, RefreshCw, Check, Info } from 'lucide-react';

interface CurrencySettingsProps {
  exchangeRate: number;
  onUpdateRate: (rate: number) => void;
}

export const CurrencySettings: React.FC<CurrencySettingsProps> = ({ exchangeRate, onUpdateRate }) => {
  const [inputRate, setInputRate] = useState<string>(exchangeRate.toString());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const rate = parseFloat(inputRate);
    if (isNaN(rate) || rate <= 0) {
      alert('Ingresa un valor válido mayor a 0');
      return;
    }
    onUpdateRate(rate);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Configuración de Moneda</h2>
        <p className="text-slate-500 text-sm">Ajusta la tasa de cambio entre CUP y USD.</p>
      </div>

      {/* Current Rate Display */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Tasa Actual</p>
            <p className="text-3xl font-black">1 USD = {exchangeRate} CUP</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-white/10 p-3 rounded-xl">
            <p className="text-indigo-200 text-xs font-bold">$1 USD equivale a</p>
            <p className="text-xl font-black">{exchangeRate} CUP</p>
          </div>
          <div className="bg-white/10 p-3 rounded-xl">
            <p className="text-indigo-200 text-xs font-bold">1,000 CUP equivale a</p>
            <p className="text-xl font-black">${(1000 / exchangeRate).toFixed(2)} USD</p>
          </div>
        </div>
      </div>

      {/* Edit Rate */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <RefreshCw size={18} className="text-indigo-600" />
          Actualizar Tasa de Cambio
        </h3>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-600">
            1 USD = ¿Cuántos CUP?
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="number"
              value={inputRate}
              onChange={(e) => setInputRate(e.target.value)}
              className="flex-1 px-4 py-3 border-2 rounded-xl text-lg font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none min-w-0"
              placeholder="495"
              min="1"
              step="1"
            />
            <button
              onClick={handleSave}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0 ${
                saved 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {saved ? <><Check size={16} /> Guardado</> : 'Guardar'}
            </button>
          </div>
        </div>

      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3">
        <Info size={20} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-bold mb-1">¿Cómo se usa esta tasa?</p>
          <ul className="space-y-1 text-amber-700 text-xs">
            <li>• En <strong>Reportes</strong>: Los cards muestran CUP y su equivalencia en USD calculada automáticamente.</li>
            <li>• En <strong>PDFs</strong>: Los reportes y facturas incluyen ambas monedas con la tasa configurada.</li>
            <li>• Los productos agregados en USD se guardan en CUP; al <strong>cambiar la tasa</strong>, sus precios en inventario se actualizan automáticamente.</li>
          </ul>
        </div>
      </div>

      {/* Conversion Calculator */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800">Calculadora Rápida</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">CUP</label>
            <ConversionInput exchangeRate={exchangeRate} from="CUP" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400">USD</label>
            <ConversionInput exchangeRate={exchangeRate} from="USD" />
          </div>
        </div>
      </div>
    </div>
  );
};

const ConversionInput: React.FC<{ exchangeRate: number; from: 'CUP' | 'USD' }> = ({ exchangeRate, from }) => {
  const [value, setValue] = useState<string>('');
  
  const converted = value ? (
    from === 'CUP' 
      ? `$${(parseFloat(value) / exchangeRate).toFixed(2)} USD`
      : `CUP ${Math.round(parseFloat(value) * exchangeRate).toLocaleString()}`
  ) : '';

  return (
    <div>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full px-4 py-3 border-2 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        placeholder={from === 'CUP' ? '14000' : '28.28'}
      />
      {converted && (
        <p className="text-sm font-bold text-indigo-600 mt-2 px-1">= {converted}</p>
      )}
    </div>
  );
};
