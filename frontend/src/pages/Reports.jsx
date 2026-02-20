import { useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('sales');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [salesData, setSalesData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadSales = async () => {
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (from) params.from = from;
      if (to) params.to = to;
      const { data } = await api.get('/sales', { params });
      setSalesData(data);
    } catch { toast.error('Error al cargar reporte'); }
    finally { setLoading(false); }
  };

  const loadInventory = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reports/inventory');
      setInventoryData(data);
    } catch { toast.error('Error al cargar inventario'); }
    finally { setLoading(false); }
  };

  const exportCSV = (data, filename) => {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportSalesCSV = () => {
    if (!salesData) return;
    const headers = 'ID,Fecha,Cliente,Vendedor,Total,Estado\n';
    const rows = salesData.data.map(s =>
      `${s.id},"${format(new Date(s.createdAt), 'dd/MM/yyyy HH:mm')}","${s.Client?.name || 'Sin cliente'}","${s.User?.name}",${s.total},${s.status}`
    ).join('\n');
    exportCSV(headers + rows, `ventas_${from || 'todo'}_${to || 'todo'}.csv`);
  };

  const exportInventoryCSV = () => {
    if (!inventoryData) return;
    const headers = 'ID,Nombre,SKU,Categoría,Stock,Stock Min,Precio Compra,Precio Venta,Valor Total\n';
    const rows = inventoryData.products.map(p =>
      `${p.id},"${p.name}","${p.sku || ''}","${p.Category?.name || ''}",${p.stock},${p.minStock},${p.buyPrice},${p.sellPrice},${(p.stock * p.buyPrice).toFixed(2)}`
    ).join('\n');
    exportCSV(headers + rows, 'inventario.csv');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Reportes</h1>
      <p className="text-slate-400 text-sm mb-6">Exporta datos del sistema</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[['sales', 'Ventas'], ['inventory', 'Inventario']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === key ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'sales' && (
        <div>
          <div className="card mb-6">
            <h2 className="font-semibold text-white mb-4">Reporte de ventas por período</h2>
            <div className="flex gap-3 items-end flex-wrap">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Desde</label>
                <input type="date" className="input w-44" value={from} onChange={e => setFrom(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Hasta</label>
                <input type="date" className="input w-44" value={to} onChange={e => setTo(e.target.value)} />
              </div>
              <button onClick={loadSales} disabled={loading} className="btn-primary">
                {loading ? 'Cargando...' : 'Generar reporte'}
              </button>
              {salesData && <button onClick={exportSalesCSV} className="btn-secondary">↓ Exportar CSV</button>}
            </div>
          </div>

          {salesData && (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="card text-center">
                  <p className="text-3xl font-bold text-white">{salesData.total}</p>
                  <p className="text-slate-400 text-sm mt-1">Ventas totales</p>
                </div>
                <div className="card text-center">
                  <p className="text-3xl font-bold text-green-400">
                    ${salesData.data.reduce((s, v) => s + parseFloat(v.total), 0).toFixed(2)}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">Ingresos totales</p>
                </div>
                <div className="card text-center">
                  <p className="text-3xl font-bold text-blue-400">
                    ${salesData.total > 0 ? (salesData.data.reduce((s, v) => s + parseFloat(v.total), 0) / salesData.total).toFixed(2) : '0.00'}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">Ticket promedio</p>
                </div>
              </div>

              <div className="card p-0 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase">
                      <th className="text-left p-4">#</th>
                      <th className="text-left p-4">Fecha</th>
                      <th className="text-left p-4">Cliente</th>
                      <th className="text-left p-4">Vendedor</th>
                      <th className="text-right p-4">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.data.map(s => (
                      <tr key={s.id} className="table-row">
                        <td className="p-4 font-mono text-xs text-slate-400">#{s.id}</td>
                        <td className="p-4 text-sm text-slate-300">{format(new Date(s.createdAt), 'dd/MM/yyyy HH:mm')}</td>
                        <td className="p-4 text-sm text-slate-300">{s.Client?.name || '—'}</td>
                        <td className="p-4 text-sm text-slate-400">{s.User?.name}</td>
                        <td className="p-4 text-right text-green-400 font-medium">${parseFloat(s.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'inventory' && (
        <div>
          <div className="card mb-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Reporte de inventario</h2>
              <div className="flex gap-2">
                <button onClick={loadInventory} disabled={loading} className="btn-primary">
                  {loading ? 'Cargando...' : 'Cargar reporte'}
                </button>
                {inventoryData && <button onClick={exportInventoryCSV} className="btn-secondary">↓ Exportar CSV</button>}
              </div>
            </div>
          </div>

          {inventoryData && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="card text-center">
                  <p className="text-3xl font-bold text-white">{inventoryData.products.length}</p>
                  <p className="text-slate-400 text-sm mt-1">Productos activos</p>
                </div>
                <div className="card text-center">
                  <p className="text-3xl font-bold text-blue-400">${parseFloat(inventoryData.totalValue).toLocaleString()}</p>
                  <p className="text-slate-400 text-sm mt-1">Valor total en inventario</p>
                </div>
              </div>

              <div className="card p-0 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase">
                      <th className="text-left p-4">Producto</th>
                      <th className="text-left p-4">Categoría</th>
                      <th className="text-right p-4">Stock</th>
                      <th className="text-right p-4">Precio Venta</th>
                      <th className="text-right p-4">Valor</th>
                      <th className="text-left p-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryData.products.map(p => (
                      <tr key={p.id} className="table-row">
                        <td className="p-4">
                          <p className="text-sm font-medium text-white">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.sku}</p>
                        </td>
                        <td className="p-4"><span className="badge badge-blue">{p.Category?.name || '—'}</span></td>
                        <td className="p-4 text-right text-sm text-slate-300">{p.stock}</td>
                        <td className="p-4 text-right text-sm text-green-400">${parseFloat(p.sellPrice).toFixed(2)}</td>
                        <td className="p-4 text-right text-sm text-blue-400">${(p.stock * p.buyPrice).toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`badge ${p.stock <= p.minStock ? 'badge-red' : 'badge-green'}`}>
                            {p.stock <= p.minStock ? '⚠ Bajo' : 'OK'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}