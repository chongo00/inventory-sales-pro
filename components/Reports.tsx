
import React, { useMemo, useState } from 'react';
import { Download, FileText, CheckCircle2, UserPlus, CreditCard, Banknote, History, Trash2, DollarSign } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sale, Product } from '../types';

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  onSettleFiao: (saleId: string, method: 'CASH' | 'TRANSFER') => void;
  onChangePaymentMethod: (saleId: string, method: 'CASH') => void;
  onDeleteSale: (saleId: string) => void;
  exchangeRate: number;
}

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

export const Reports: React.FC<ReportsProps> = ({ sales, products, onSettleFiao, onChangePaymentMethod, onDeleteSale, exchangeRate }) => {
  const now = new Date();
  const currentMonthKey = getMonthKey(now);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    sales.forEach(s => set.add(getMonthKey(new Date(s.timestamp))));
    set.add(currentMonthKey);
    return Array.from(set).sort().reverse();
  }, [sales, currentMonthKey]);

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(currentMonthKey);
  React.useEffect(() => {
    if (availableMonths.length && !availableMonths.includes(selectedMonthKey)) {
      setSelectedMonthKey(availableMonths[0]);
    }
  }, [availableMonths, selectedMonthKey]);
  const [pdfNotification, setPdfNotification] = useState<{ visible: boolean; fileName: string; uri?: string; closing?: boolean }>({ visible: false, fileName: '' });
  const toastTimerRef = React.useRef<any>(null);

  const filteredSales = useMemo(() => {
    return sales.filter(s => getMonthKey(new Date(s.timestamp)) === selectedMonthKey);
  }, [sales, selectedMonthKey]);

  const chartData = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredSales.forEach(s => {
      const d = new Date(s.timestamp).toLocaleDateString();
      groups[d] = (groups[d] || 0) + s.totalAmount;
    });
    return Object.entries(groups).map(([date, total]) => ({ date, total }));
  }, [filteredSales]);

  const totals = useMemo(() => {
    const res = { cash: 0, transfer: 0, fiao: 0, totalCup: 0 };
    filteredSales.forEach(s => {
      const amountInCup = s.currency === 'USD' ? s.totalAmount * exchangeRate : s.totalAmount;
      res.totalCup += amountInCup;
      if (s.paymentMethod === 'CASH') res.cash += amountInCup;
      else if (s.paymentMethod === 'TRANSFER') res.transfer += amountInCup;
      else res.fiao += amountInCup;
    });
    return res;
  }, [filteredSales, exchangeRate]);

  const cupToUsd = (cup: number) => exchangeRate > 0 ? (cup / exchangeRate) : 0;

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
      doc.text(`Generado: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' });
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
          ['Fecha', new Date(sale.timestamp).toLocaleString()],
        ];
        autoTable(doc, { startY: 60, body: tableData, theme: 'grid', headStyles: { fillColor: [79, 70, 229] } });
        
        const fileName = `Factura_${sale.id}.pdf`;
        await savePdfAndNotify(doc, fileName);
      } else {
        const isTotal = mode === 'total';
        doc.setFontSize(14); doc.text(`Resumen ${monthKeyToLabel(selectedMonthKey)}${isTotal ? ' (Agrupado)' : ' (Detallado)'}`, 20, 50);
        
        doc.setFontSize(11); doc.setTextColor(50);
        doc.text(`Ventas Efectivo: CUP ${Math.round(totals.cash).toLocaleString()} / $${cupToUsd(totals.cash).toFixed(2)} USD`, 20, 60);
        doc.text(`Ventas Transferencia: CUP ${Math.round(totals.transfer).toLocaleString()} / $${cupToUsd(totals.transfer).toFixed(2)} USD`, 20, 67);
        doc.text(`Fiao Pendiente: CUP ${Math.round(totals.fiao).toLocaleString()} / $${cupToUsd(totals.fiao).toFixed(2)} USD`, 20, 74);
        
        if (isTotal) {
          const byProduct: Record<string, { quantity: number; totalAmount: number; totalProfit: number }> = {};
          filteredSales.forEach(s => {
            const product = products.find(p => p.id === s.productId);
            const purchasePrice = product ? product.purchasePrice : 0;
            const profit = (s.unitPrice - purchasePrice) * s.quantity;
            if (!byProduct[s.productName]) {
              byProduct[s.productName] = { quantity: 0, totalAmount: 0, totalProfit: 0 };
            }
            byProduct[s.productName].quantity += s.quantity;
            byProduct[s.productName].totalAmount += s.totalAmount;
            byProduct[s.productName].totalProfit += profit;
          });
          const tableData = Object.entries(byProduct)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, data]) => [
              name,
              data.quantity.toFixed(2),
              `${data.totalAmount.toFixed(2)}`,
              `${data.totalProfit.toFixed(2)}`,
            ]);
          autoTable(doc, { startY: 82, head: [['Producto', 'Cant. total', 'Total recaudado', 'Ganancia']], body: tableData, theme: 'striped' });
        } else {
          const sorted = [...filteredSales].sort((a, b) => a.productName.localeCompare(b.productName));
          const tableData = sorted.map(s => {
            const cup = s.currency === 'USD' ? s.totalAmount * exchangeRate : s.totalAmount;
            const usd = s.currency === 'CUP' ? s.totalAmount / exchangeRate : s.totalAmount;
            return [
              new Date(s.timestamp).toLocaleString(),
              s.productName,
              `${s.quantity} ${s.unit}`,
              `CUP ${Math.round(cup).toLocaleString()}`,
              `$${usd.toFixed(2)}`,
              s.paymentMethod,
              s.customerInfo || '-'
            ];
          });
          autoTable(doc, { startY: 82, head: [['Fecha y hora', 'Producto', 'Cant', 'CUP', 'USD', 'Metodo', 'Info']], body: tableData, theme: 'striped' });
        }
        
        const fileName = `Reporte_${selectedMonthKey}_${isTotal ? 'Total' : 'Detallado'}.pdf`;
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Reportes de Rendimiento</h2>
          <p className="text-slate-500 text-sm">Resumen financiero y control de cobros.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-600">Mes:</label>
          <select
            value={selectedMonthKey}
            onChange={(e) => setSelectedMonthKey(e.target.value)}
            className="bg-white border border-slate-100 rounded-2xl px-4 py-2.5 shadow-sm text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
          >
            {availableMonths.map(key => (
              <option key={key} value={key}>{monthKeyToLabel(key)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-6">
        <SummaryCard title="Ventas Efectivo" cup={totals.cash} usd={cupToUsd(totals.cash)} icon={<Banknote />} color="emerald" />
        <SummaryCard title="Ventas Transf." cup={totals.transfer} usd={cupToUsd(totals.transfer)} icon={<CreditCard />} color="blue" />
        <SummaryCard title="Fiao Pendiente" cup={totals.fiao} usd={cupToUsd(totals.fiao)} icon={<UserPlus />} color="rose" />
        <div className="p-3 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-sm bg-white overflow-hidden">
          <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
            <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
              <DollarSign size={20} />
            </div>
            <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-wider leading-tight">Ventas total</p>
          </div>
          <div>
            <p className="text-base md:text-2xl font-black text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis">CUP {Math.round(totals.totalCup).toLocaleString()}</p>
            <p className="text-xs md:text-lg font-bold text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis">${cupToUsd(totals.totalCup).toFixed(2)} USD</p>
          </div>
        </div>
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
        <div className="p-4 md:p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-black text-slate-700 text-sm uppercase tracking-widest">Historial de Transacciones</h3>
          <History size={18} className="text-slate-300" />
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
              {filteredSales.map(s => (
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
            </tbody>
          </table>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredSales.map(s => (
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

const SummaryCard = ({ title, cup, usd, icon, color }: any) => {
  const colors: any = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };
  return (
    <div className={`p-3 md:p-6 rounded-2xl md:rounded-[2rem] border shadow-sm transition-transform hover:scale-[1.02] bg-white overflow-hidden`}>
      <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
        <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl ${colors[color]} shrink-0`}>{icon}</div>
        <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-wider leading-tight">{title}</p>
      </div>
      <div>
        <p className="text-base md:text-2xl font-black text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis">CUP {Math.round(cup).toLocaleString()}</p>
        <p className="text-xs md:text-lg font-bold text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis">${usd.toFixed(2)} USD</p>
      </div>
    </div>
  );
};
