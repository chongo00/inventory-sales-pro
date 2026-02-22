
import React, { useMemo, useState } from 'react';
import { Download, FileText, CheckCircle2, UserPlus, CreditCard, Banknote, History, Trash2, DollarSign, Filter } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sale, Product, PaymentMethod } from '../types';

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  onSettleFiao: (saleId: string, method: 'CASH' | 'TRANSFER') => void;
  onChangePaymentMethod: (saleId: string, method: 'CASH') => void;
  onDeleteSale: (saleId: string) => void;
  exchangeRate: number;
}

export type ReportPeriodType = 'day' | 'week' | 'month';

function getMonthKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function monthKeyToLabel(key: string): string {
  const [y, m] = key.split('-');
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const name = months[parseInt(m, 10) - 1] || m;
  return `${name} ${y}`;
}

function isSaleInPeriod(isoDate: string, periodType: ReportPeriodType, selectedMonthKey: string, now: Date): boolean {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return false;
  if (periodType === 'day') {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }
  if (periodType === 'week') {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return d >= weekAgo && d <= end;
  }
  // Mes: mismo criterio que día/semana — usar componentes de fecha en hora local de la venta
  const [y, m] = selectedMonthKey.split('-').map(Number);
  return d.getFullYear() === y && d.getMonth() === m - 1;
}

export const Reports: React.FC<ReportsProps> = ({ sales, products, onSettleFiao, onChangePaymentMethod, onDeleteSale, exchangeRate }) => {
  const now = new Date();
  const currentMonthKey = getMonthKey(now);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    sales.forEach(s => set.add(getMonthKey(new Date(s.timestamp))));
    set.add(currentMonthKey);
    return Array.from(set).sort().reverse();
  }, [sales, currentMonthKey]);

  const [periodType, setPeriodType] = useState<ReportPeriodType>('day');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(currentMonthKey);
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentMethod>('all');
  const [showHistoryFilter, setShowHistoryFilter] = useState(false);
  const [pdfNotification, setPdfNotification] = useState<{ visible: boolean; fileName: string; uri?: string; closing?: boolean }>({ visible: false, fileName: '' });
  const toastTimerRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (periodType === 'month' && availableMonths.length && !availableMonths.includes(selectedMonthKey)) {
      setSelectedMonthKey(availableMonths[0]);
    }
  }, [periodType, availableMonths, selectedMonthKey]);

  const filteredSales = useMemo(() => {
    const today = new Date();
    return sales.filter(s => isSaleInPeriod(s.timestamp, periodType, selectedMonthKey, today));
  }, [sales, periodType, selectedMonthKey]);

  const historySales = useMemo(() => {
    if (paymentFilter === 'all') return filteredSales;
    return filteredSales.filter(s => s.paymentMethod === paymentFilter);
  }, [filteredSales, paymentFilter]);

  const chartData = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredSales.forEach(s => {
      const d = new Date(s.timestamp).toLocaleDateString();
      groups[d] = (groups[d] || 0) + s.totalAmount;
    });
    return Object.entries(groups).map(([date, total]) => ({ date, total }));
  }, [filteredSales]);

  const totals = useMemo(() => {
    const res = {
      cashCup: 0, cashUsd: 0,
      transferCup: 0, transferUsd: 0,
      fiaoCup: 0, fiaoUsd: 0,
      totalCobradoCup: 0, totalCobradoUsd: 0,
    };
    filteredSales.forEach(s => {
      const isCup = s.currency !== 'USD';
      const amt = s.totalAmount;
      if (s.paymentMethod === 'CASH') {
        if (isCup) { res.cashCup += amt; res.totalCobradoCup += amt; }
        else       { res.cashUsd += amt; res.totalCobradoUsd += amt; }
      } else if (s.paymentMethod === 'TRANSFER') {
        if (isCup) { res.transferCup += amt; res.totalCobradoCup += amt; }
        else       { res.transferUsd += amt; res.totalCobradoUsd += amt; }
      } else {
        if (isCup) res.fiaoCup += amt;
        else       res.fiaoUsd += amt;
      }
    });
    return res;
  }, [filteredSales]);

  const generatePDF = async (sale?: Sale, mode?: 'detailed' | 'total') => {
    try {
      // Dynamic imports (async import() works in ESM/Vite, require() does not)
      const jsPDFMod = await import('jspdf');
      const autoTableMod = await import('jspdf-autotable');
      
      const JsPDF = (jsPDFMod as any).jsPDF || (jsPDFMod as any).default || jsPDFMod;
      const autoTable = (autoTableMod as any).default || autoTableMod;
      
      const doc = new JsPDF();

      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229);
      doc.text('REPORTE DE VENTAS - SALESPRO', 105, 20, { align: 'center' });
      doc.setFontSize(10); doc.setTextColor(100);
      const _now = new Date();
      const genDate = (_now.getMonth()+1) + '/' + _now.getDate() + '/' + _now.getFullYear() + ' ' + _now.toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'});
      doc.text('Generado: ' + genDate, 105, 28, { align: 'center' });
      doc.text(`Tasa de cambio: 1 USD = ${exchangeRate} CUP`, 105, 34, { align: 'center' });

      if (sale) {
        doc.setFontSize(14); doc.setTextColor(30);
        doc.text(`Factura de Venta #${sale.id}`, 20, 50);
        const amountCUP = sale.currency === 'USD' ? sale.totalAmount * exchangeRate : sale.totalAmount;
        const amountUSD = sale.currency === 'CUP' ? sale.totalAmount / exchangeRate : sale.totalAmount;
        const tableData = [
          ['Producto', sale.productName],
          ['Cantidad', `${sale.quantity} ${sale.unit}`],
          ['Precio Unit.', `${sale.currency === 'USD' ? '$' : 'CUP '}${sale.unitPrice.toFixed(2)}`],
          ['Total', `${sale.currency === 'USD' ? '$' : 'CUP '}${sale.totalAmount.toFixed(2)}`],
          ['Total en CUP', `CUP ${amountCUP.toFixed(2)}`],
          ['Total en USD', `$${amountUSD.toFixed(2)}`],
          ['Metodo Pago', sale.paymentMethod === 'CASH' ? 'EFECTIVO (CASH)' : sale.paymentMethod === 'TRANSFER' ? 'TRANSFERENCIA' : 'FIAO (DEUDA)'],
          ['Cliente/Info', sale.customerInfo || 'N/A'],
          ['Fecha', (() => { const _d = new Date(sale.timestamp); return (_d.getMonth()+1)+'/'+_d.getDate()+'/'+_d.getFullYear()+' '+_d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}); })()],
        ];
        autoTable(doc, { startY: 60, body: tableData, theme: 'grid', headStyles: { fillColor: [79, 70, 229] } });
        
        const fileName = `Factura_${sale.id}.pdf`;
        await savePdfAndNotify(doc, fileName);
      } else {
        const isTotal = mode === 'total';
        const periodTitle = periodType === 'day' ? 'Hoy' : periodType === 'week' ? 'Esta semana' : monthKeyToLabel(selectedMonthKey);
        doc.setFontSize(14); doc.text(`Resumen ${periodTitle}${isTotal ? ' (Agrupado)' : ' (Detallado)'}`, 20, 50);
        
        doc.setFontSize(11); doc.setTextColor(50);
        const rate = exchangeRate || 1;
        const fmtNum = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        const fmtDual = (label: string, cup: number, usd: number) => {
          const parts: string[] = [];
          if (cup > 0) parts.push('CUP ' + fmtNum(cup) + ' (~$' + (cup / rate).toFixed(2) + ')');
          if (usd > 0) parts.push('$' + usd.toFixed(2) + ' USD (~CUP ' + fmtNum(usd * rate) + ')');
          return label + ': ' + (parts.length ? parts.join(' + ') : '--');
        };
        doc.text(fmtDual('Ventas Efectivo', totals.cashCup, totals.cashUsd), 20, 60);
        doc.text(fmtDual('Ventas Transferencia', totals.transferCup, totals.transferUsd), 20, 67);
        doc.text(fmtDual('Fiao Pendiente', totals.fiaoCup, totals.fiaoUsd), 20, 74);
        
        if (isTotal) {
          const byProduct: Record<string, { quantity: number; totalCup: number; totalUsd: number; totalProfit: number }> = {};
          filteredSales.forEach(s => {
            const product = products.find(p => p.id === s.productId);
            const purchasePrice = product ? product.purchasePrice : 0;
            const profit = (s.unitPrice - purchasePrice) * s.quantity;
            if (!byProduct[s.productName]) {
              byProduct[s.productName] = { quantity: 0, totalCup: 0, totalUsd: 0, totalProfit: 0 };
            }
            byProduct[s.productName].quantity += s.quantity;
            if (s.currency === 'USD') byProduct[s.productName].totalUsd += s.totalAmount;
            else                      byProduct[s.productName].totalCup += s.totalAmount;
            byProduct[s.productName].totalProfit += profit;
          });
          const tableData = Object.entries(byProduct)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, data]) => {
              const equivUsd = data.totalCup > 0 ? '$' + (data.totalCup / rate).toFixed(2) : '--';
              const equivCup = data.totalUsd > 0 ? 'CUP ' + fmtNum(data.totalUsd * rate) : '--';
              const recaudado = [
                data.totalCup > 0 ? 'CUP ' + fmtNum(data.totalCup) : '',
                data.totalUsd > 0 ? '$' + data.totalUsd.toFixed(2) : '',
              ].filter(Boolean).join(' + ') || '--';
              const equiv = [
                data.totalCup > 0 ? '~' + equivUsd : '',
                data.totalUsd > 0 ? '~' + equivCup : '',
              ].filter(Boolean).join(' / ') || '--';
              return [name, data.quantity.toFixed(2), recaudado, equiv, data.totalProfit.toFixed(2)];
            });
          autoTable(doc, { startY: 82, head: [['Producto', 'Cant.', 'Recaudado', 'Equiv.', 'Ganancia']], body: tableData, theme: 'striped' });
        } else {
          const sorted = [...filteredSales].sort((a, b) => a.productName.localeCompare(b.productName));
          const tableData = sorted.map(s => {
            const original = s.currency === 'USD' ? '$' + s.totalAmount.toFixed(2) : 'CUP ' + fmtNum(s.totalAmount);
            const equiv = s.currency === 'USD'
              ? '~CUP ' + fmtNum(s.totalAmount * rate)
              : '~$' + (s.totalAmount / rate).toFixed(2);
            const d = new Date(s.timestamp);
            const fecha = (d.getMonth()+1) + '/' + d.getDate() + '/' + d.getFullYear() + ' ' + d.toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'});
            return [
              fecha,
              s.productName,
              s.quantity + ' ' + s.unit,
              original,
              equiv,
              s.paymentMethod,
              s.customerInfo || '-'
            ];
          });
          autoTable(doc, { startY: 82, head: [['Fecha/hora', 'Producto', 'Cant', 'Monto', 'Equiv.', 'Metodo', 'Info']], body: tableData, theme: 'striped', styles: { fontSize: 8 } });
        }
        
        const filePeriod = periodType === 'day' ? 'dia' : periodType === 'week' ? 'semana' : selectedMonthKey;
        const fileName = `Reporte_${filePeriod}_${isTotal ? 'Total' : 'Detallado'}.pdf`;
        await savePdfAndNotify(doc, fileName);
      }
    } catch (error) {
      alert('Error generando PDF: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const savePdfAndNotify = async (doc: any, fileName: string) => {
    try {
      const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
      
      if (isNative) {
        // Android: Save with Filesystem, open with FileOpener
        const pdfBlob = doc.output('blob');
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            resolve(dataUrl.replace(/^data:application\/pdf;base64,/, ''));
          };
          reader.onerror = reject;
          reader.readAsDataURL(pdfBlob);
        });
        
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        
        // Save to public Downloads folder
        let savedUri = '';
        let savedPath = '';
        
        try {
          // Try writing directly to /storage/emulated/0/Download/ (public Downloads)
          await Filesystem.writeFile({
            path: `/storage/emulated/0/Download/${cleanName}`,
            data: base64,
          });
          savedUri = `file:///storage/emulated/0/Download/${cleanName}`;
          savedPath = `/storage/emulated/0/Download/${cleanName}`;
        } catch (firstError) {
          // Fallback: use ExternalStorage directory
          try {
            await Filesystem.writeFile({
              path: cleanName,
              data: base64,
              directory: Directory.ExternalStorage,
              recursive: true,
            });
            const uriResult = await Filesystem.getUri({ path: cleanName, directory: Directory.ExternalStorage });
            savedUri = uriResult.uri;
            savedPath = `ExternalStorage/${cleanName}`;
          } catch (secondError) {
            // Last fallback: Documents/Cache
            try {
              await Filesystem.writeFile({
                path: cleanName,
                data: base64,
                directory: Directory.Documents,
                recursive: true,
              });
              const uriResult = await Filesystem.getUri({ path: cleanName, directory: Directory.Documents });
              savedUri = uriResult.uri;
              savedPath = `Documents/${cleanName}`;
            } catch (thirdError) {
              await Filesystem.writeFile({
                path: cleanName,
                data: base64,
                directory: Directory.Cache,
                recursive: true,
              });
              const uriResult = await Filesystem.getUri({ path: cleanName, directory: Directory.Cache });
              savedUri = uriResult.uri;
              savedPath = `Cache/${cleanName}`;
            }
          }
        }
        
        // Show toast notification with path
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setPdfNotification({ visible: true, fileName: savedPath, uri: savedUri, closing: false });
        toastTimerRef.current = setTimeout(() => {
          setPdfNotification(prev => prev.visible ? { ...prev, closing: true } : prev);
          setTimeout(() => setPdfNotification({ visible: false, fileName: '' }), 400);
        }, 7000);
      } else {
        // Web: direct download
        doc.save(fileName);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setPdfNotification({ visible: true, fileName, closing: false });
        toastTimerRef.current = setTimeout(() => {
          setPdfNotification(prev => prev.visible ? { ...prev, closing: true } : prev);
          setTimeout(() => setPdfNotification({ visible: false, fileName: '' }), 400);
        }, 7000);
      }
    } catch (error) {
      // Fallback
      try { doc.save(fileName); } catch (_) {}
      alert('PDF guardado (modo fallback): ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const openPDF = async (uri: string) => {
    try {
      const { FileOpener } = await import('@capacitor-community/file-opener');
      await FileOpener.open({
        filePath: uri,
        contentType: 'application/pdf',
        openWithDefault: true,
      });
    } catch (error) {
      alert('Error abriendo PDF: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const dismissNotification = () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setPdfNotification(prev => ({ ...prev, closing: true }));
    setTimeout(() => setPdfNotification({ visible: false, fileName: '' }), 400);
  };

  const periodLabel = periodType === 'day' ? 'Hoy' : periodType === 'week' ? 'Esta semana' : monthKeyToLabel(selectedMonthKey);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Reportes de Rendimiento</h2>
          <p className="text-slate-500 text-sm">Resumen financiero y control de cobros.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as ReportPeriodType)}
              className="appearance-none bg-white border border-slate-200 rounded-2xl pl-4 pr-10 py-2.5 shadow-sm text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[140px]"
            >
              <option value="day">Día</option>
              <option value="week">Semana</option>
              <option value="month">Mes</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▼</span>
          </div>
          {periodType === 'month' && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-slate-600 whitespace-nowrap">Mes:</label>
              <select
                value={selectedMonthKey}
                onChange={(e) => setSelectedMonthKey(e.target.value)}
                className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 min-w-[120px]"
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
        <SummaryCard title="Ventas Efectivo" cup={totals.cashCup} usd={totals.cashUsd} icon={<Banknote />} color="emerald" exchangeRate={exchangeRate} />
        <SummaryCard title="Ventas Transf." cup={totals.transferCup} usd={totals.transferUsd} icon={<CreditCard />} color="blue" exchangeRate={exchangeRate} />
        <SummaryCard title="Fiao Pendiente" cup={totals.fiaoCup} usd={totals.fiaoUsd} icon={<UserPlus />} color="rose" exchangeRate={exchangeRate} />
        <SummaryCard title="Total cobrado" cup={totals.totalCobradoCup} usd={totals.totalCobradoUsd} icon={<DollarSign />} color="indigo" subtitle="Efectivo + Transf. Sin Fiao." exchangeRate={exchangeRate} />
      </div>

      <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-slate-700 uppercase text-[10px] md:text-xs tracking-widest">Actividad de Ventas</h3>
          <div className="flex gap-2">
            <button onClick={() => generatePDF(undefined, 'detailed')} className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-2 rounded-xl font-bold text-xs hover:bg-indigo-700 transition-colors active:scale-95">
              <Download size={12} /> Detallado
            </button>
            <button onClick={() => generatePDF(undefined, 'total')} className="flex items-center gap-1.5 bg-slate-600 text-white px-3 py-2 rounded-xl font-bold text-xs hover:bg-slate-700 transition-colors active:scale-95">
              <Download size={12} /> Total
            </button>
          </div>
        </div>
        <div className="h-[160px] md:h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} fontStyle="bold" />
              <YAxis fontSize={10} axisLine={false} tickLine={false} fontStyle="bold" />
              <Tooltip />
              <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fill="#6366f120" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-50">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest">Historial de Transacciones</h3>
            <button
              type="button"
              onClick={() => setShowHistoryFilter(prev => !prev)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                showHistoryFilter ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Filter size={16} />
              Filtro método
              <span className="text-slate-400 font-normal">({paymentFilter === 'all' ? 'Todos' : paymentFilter === 'CASH' ? 'Efectivo' : paymentFilter === 'TRANSFER' ? 'Transf.' : 'Fiao'})</span>
            </button>
          </div>
          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-out overflow-hidden`}
            style={{ gridTemplateRows: showHistoryFilter ? '1fr' : '0fr' }}
          >
            <div className="min-h-0">
              <div className="pt-3 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Método:</span>
                {(['all', 'CASH', 'TRANSFER', 'FIAO'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentFilter(m)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                      paymentFilter === m
                        ? m === 'all' ? 'bg-slate-200 text-slate-800' : m === 'CASH' ? 'bg-emerald-500 text-white' : m === 'TRANSFER' ? 'bg-blue-500 text-white' : 'bg-rose-500 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {m === 'all' ? 'Todos' : m === 'CASH' ? 'Efectivo' : m === 'TRANSFER' ? 'Transf.' : 'Fiao'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Desktop Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left hidden md:table">
            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
              <tr>
                <th className="px-6 py-5">Producto</th>
                <th className="px-6 py-5">Cant.</th>
                <th className="px-6 py-5">Método</th>
                <th className="px-6 py-5">Monto</th>
                <th className="px-6 py-5">Cliente</th>
                <th className="px-6 py-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historySales.map(s => (
                <tr key={s.id} className="text-sm hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-5 font-bold text-slate-700">{s.productName}</td>
                  <td className="px-6 py-5 text-slate-500">{s.quantity} {s.unit}</td>
                  <td className="px-6 py-5">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                      s.paymentMethod === 'CASH' ? 'bg-emerald-100 text-emerald-700' : 
                      s.paymentMethod === 'TRANSFER' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {s.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-black text-slate-900">
                    {s.currency === 'USD' ? '$' : 'CUP '}{s.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-5 text-xs text-slate-400 font-medium max-w-[200px] truncate" title={s.customerInfo}>
                    {s.customerInfo || '-'}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      {s.paymentMethod === 'FIAO' && (
                        <>
                          <button onClick={() => onSettleFiao(s.id, 'CASH')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl" title="Pagar Efectivo">
                            <Banknote size={18} />
                          </button>
                          <button onClick={() => onSettleFiao(s.id, 'TRANSFER')} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl" title="Pagar Transf.">
                            <CreditCard size={18} />
                          </button>
                        </>
                      )}
                      {s.paymentMethod === 'TRANSFER' && (
                        <button onClick={() => onChangePaymentMethod(s.id, 'CASH')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl" title="Cambiar a efectivo">
                          <Banknote size={18} />
                        </button>
                      )}
                      <button onClick={() => generatePDF(s)} className="p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl" title="PDF">
                        <FileText size={18} />
                      </button>
                      <button onClick={() => confirm('¿Eliminar esta transacción? Se devolverá el producto al stock.') && onDeleteSale(s.id)} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl" title="Eliminar">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {historySales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-sm">
                    {paymentFilter === 'all' ? 'No hay transacciones en este periodo.' : `No hay transacciones por ${paymentFilter === 'CASH' ? 'efectivo' : paymentFilter === 'TRANSFER' ? 'transferencia' : 'fiao'} en este periodo.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-slate-100">
            {historySales.length === 0 && (
              <div className="p-6 text-center text-slate-400 text-sm">
                {paymentFilter === 'all' ? 'No hay transacciones en este periodo.' : `No hay transacciones por ${paymentFilter === 'CASH' ? 'efectivo' : paymentFilter === 'TRANSFER' ? 'transferencia' : 'fiao'} en este periodo.`}
              </div>
            )}
            {historySales.map(s => (
              <div key={s.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800">{s.productName}</h4>
                    <p className="text-xs text-slate-400 font-medium">{new Date(s.timestamp).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900">{s.currency === 'USD' ? '$' : 'CUP '}{s.totalAmount.toLocaleString()}</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      s.paymentMethod === 'CASH' ? 'bg-emerald-100 text-emerald-700' : 
                      s.paymentMethod === 'TRANSFER' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {s.paymentMethod}
                    </span>
                  </div>
                </div>
                
                {s.customerInfo && (
                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 font-medium leading-relaxed">
                    <span className="font-black uppercase text-[9px] text-slate-300 block mb-1 tracking-widest">Información Deuda</span>
                    {s.customerInfo}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {s.paymentMethod === 'FIAO' && (
                    <>
                      <button onClick={() => onSettleFiao(s.id, 'CASH')} className="flex-1 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                        <Banknote size={14} /> Cobrar Cash
                      </button>
                      <button onClick={() => onSettleFiao(s.id, 'TRANSFER')} className="flex-1 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                        <CreditCard size={14} /> Cobrar Transf.
                      </button>
                    </>
                  )}
                  {s.paymentMethod === 'TRANSFER' && (
                    <button onClick={() => onChangePaymentMethod(s.id, 'CASH')} className="py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 px-3">
                      <Banknote size={14} /> Cambiar a efectivo
                    </button>
                  )}
                  <button onClick={() => generatePDF(s)} className="p-2 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center">
                    <FileText size={18} />
                  </button>
                  <button onClick={() => confirm('¿Eliminar esta transacción? Se devolverá el producto al stock.') && onDeleteSale(s.id)} className="p-2 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PDF Notification Toast */}
      {pdfNotification.visible && (
        <div 
          className={`fixed top-4 right-4 left-4 md:right-6 md:left-auto md:w-96 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 z-50 transition-all duration-400 ${
            pdfNotification.closing 
              ? 'translate-x-[110%] opacity-0' 
              : 'translate-x-0 opacity-100'
          }`}
          style={{ transition: 'transform 0.4s ease-out, opacity 0.4s ease-out' }}
          onTouchStart={(e) => {
            const startX = e.touches[0].clientX;
            const el = e.currentTarget;
            const handleMove = (ev: TouchEvent) => {
              const diff = ev.touches[0].clientX - startX;
              if (diff > 0) el.style.transform = `translateX(${diff}px)`;
            };
            const handleEnd = (ev: TouchEvent) => {
              const diff = ev.changedTouches[0].clientX - startX;
              el.removeEventListener('touchmove', handleMove);
              el.removeEventListener('touchend', handleEnd);
              if (diff > 80) {
                dismissNotification();
              } else {
                el.style.transform = '';
              }
            };
            el.addEventListener('touchmove', handleMove);
            el.addEventListener('touchend', handleEnd);
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 size={18} className="text-emerald-500" />
                <h4 className="font-bold text-slate-800 text-sm">PDF Generado</h4>
              </div>
              <p className="text-slate-500 text-xs mb-3">{pdfNotification.fileName}</p>
              <div className="flex gap-2">
                {pdfNotification.uri && (
                  <button
                    onClick={() => openPDF(pdfNotification.uri!)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors active:scale-95"
                  >
                    Abrir
                  </button>
                )}
                <button
                  onClick={dismissNotification}
                  className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ title, cup, usd, icon, color, subtitle, exchangeRate }: any) => {
  const colors: any = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  };
  const rate = exchangeRate || 1;
  // Mostrar solo lo cobrado en CUP; el equivalente debajo es cup/rate (no mezclar USD convertido para evitar inflar en Mes)
  const totalCup = cup;
  const equivUsd = totalCup > 0 ? totalCup / rate : 0;
  return (
    <div className={`p-3 md:p-6 rounded-2xl md:rounded-[2rem] border shadow-sm transition-transform hover:scale-[1.02] bg-white overflow-hidden`}>
      <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
        <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl ${colors[color]} shrink-0`}>{icon}</div>
        <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-wider leading-tight">{title}</p>
      </div>
      <div>
        {totalCup > 0 || usd > 0 ? (
          <>
            {totalCup > 0 && (
              <>
                <p className="text-base md:text-2xl font-black text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis">CUP {Math.round(totalCup).toLocaleString()}</p>
                <p className="text-[11px] md:text-sm font-semibold text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis">≈ ${equivUsd.toFixed(2)} USD</p>
              </>
            )}
            {usd > 0 && totalCup === 0 && (
              <>
                <p className="text-base md:text-2xl font-black text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis">$ {usd.toFixed(2)} USD</p>
                <p className="text-[11px] md:text-sm font-semibold text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis">≈ CUP {Math.round(usd * rate).toLocaleString()}</p>
              </>
            )}
          </>
        ) : (
          <p className="text-base md:text-2xl font-black text-slate-800">—</p>
        )}
        {subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};
