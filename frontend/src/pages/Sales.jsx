import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [cart, setCart] = useState([]);
  const [clientId, setClientId] = useState('');
  const [notes, setNotes] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [filters, setFilters] = useState({ from: '', to: '' });

  const load = useCallback(async (page = 1) => {
    const params = { page, limit: 15, ...filters };
    const { data } = await api.get('/sales', { params });
    setSales(data.data);
    setPagination({ total: data.total, page: data.page, pages: data.pages });
  }, [filters]);

  useEffect(() => { load(1); }, [load]);

  const openNew = async () => {
    const [p, c] = await Promise.all([api.get('/products', { params: { limit: 100 } }), api.get('/clients', { params: { limit: 100 } })]);
    setProducts(p.data.data);
    setClients(c.data.data);
    setCart([]);
    setClientId('');
    setNotes('');
    setShowModal(true);
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice } : i);
      return [...prev, { productId: product.id, name: product.name, unitPrice: parseFloat(product.sellPrice), quantity: 1, subtotal: parseFloat(product.sellPrice), stock: product.stock }];
    });
  };

  const updateQty = (productId, qty) => {
    if (qty < 1) return;
    const item = cart.find(i => i.productId === productId);
    if (qty > item.stock) { toast.error('Sin stock suficiente'); return; }
    setCart(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty, subtotal: qty * i.unitPrice } : i));
  };

  const removeItem = (productId) => setCart(prev => prev.filter(i => i.productId !== productId));

  const total = cart.reduce((s, i) => s + i.subtotal, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) { toast.error('Agrega productos a la venta'); return; }
    try {
      await api.post('/sales', { clientId: clientId || null, items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })), notes });
      toast.success('Venta registrada exitosamente');
      setShowModal(false);
      load(1);
    } catch (err) { toast.error(err.response?.data?.message || 'Error al registrar venta'); }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) && p.stock > 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Ventas</h1>
          <p className="text-slate-400 text-sm mt-1">{pagination.total} transacciones</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ Nueva venta</button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input className="input max-w-[160px]" type="date" value={filters.from} onChange={e => setFilters({...filters, from: e.target.value})} />
        <input className="input max-w-[160px]" type="date" value={filters.to} onChange={e => setFilters({...filters, to: e.target.value})} />
        {(filters.from || filters.to) && <button onClick={() => setFilters({from: '', to: ''})} className="btn-secondary">Limpiar</button>}
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <th className="text-left p-4">#</th>
              <th className="text-left p-4">Fecha</th>
              <th className="text-left p-4">Cliente</th>
              <th className="text-left p-4">Vendedor</th>
              <th className="text-left p-4">Productos</th>
              <th className="text-right p-4">Total</th>
              <th className="text-left p-4">Estado</th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr><td colSpan="7" className="p-8 text-center text-slate-500">Sin ventas registradas</td></tr>
            ) : sales.map(s => (
              <tr key={s.id} className="table-row">
                <td className="p-4 font-mono text-xs text-slate-400">#{s.id}</td>
                <td className="p-4 text-sm text-slate-300">{format(new Date(s.createdAt), 'dd MMM yyyy HH:mm', { locale: es })}</td>
                <td className="p-4 text-sm text-slate-300">{s.Client?.name || <span className="text-slate-600">Sin cliente</span>}</td>
                <td className="p-4 text-sm text-slate-400">{s.User?.name}</td>
                <td className="p-4 text-xs text-slate-500">{s.details?.length || 0} ítem(s)</td>
                <td className="p-4 text-right font-medium text-green-400">${parseFloat(s.total).toFixed(2)}</td>
                <td className="p-4"><span className={`badge ${s.status === 'completed' ? 'badge-green' : 'badge-red'}`}>{s.status === 'completed' ? 'Completada' : 'Cancelada'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Nueva venta modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Nueva Venta</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="flex flex-1 overflow-hidden">
              {/* Productos */}
              <div className="flex-1 p-4 border-r border-slate-800 overflow-y-auto">
                <input className="input mb-3" placeholder="Buscar producto..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                <div className="space-y-2">
                  {filteredProducts.map(p => (
                    <div key={p.id} onClick={() => addToCart(p)}
                      className="flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors">
                      <div>
                        <p className="text-sm font-medium text-white">{p.name}</p>
                        <p className="text-xs text-slate-400">Stock: {p.stock}</p>
                      </div>
                      <span className="text-green-400 font-medium text-sm">${parseFloat(p.sellPrice).toFixed(2)}</span>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Sin productos disponibles</p>}
                </div>
              </div>

              {/* Carrito */}
              <div className="w-80 p-4 flex flex-col">
                <select className="input mb-3" value={clientId} onChange={e => setClientId(e.target.value)}>
                  <option value="">Sin cliente asignado</option>
                  {clients.filter(c => c.active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                  {cart.length === 0 && <p className="text-slate-500 text-sm text-center py-8">Selecciona productos →</p>}
                  {cart.map(item => (
                    <div key={item.productId} className="bg-slate-800 rounded-lg p-3">
                      <p className="text-sm text-white truncate">{item.name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-6 h-6 bg-slate-700 rounded text-white text-xs hover:bg-slate-600">-</button>
                          <span className="text-sm text-white w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-6 h-6 bg-slate-700 rounded text-white text-xs hover:bg-slate-600">+</button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-400 text-sm">${item.subtotal.toFixed(2)}</span>
                          <button onClick={() => removeItem(item.productId)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <textarea className="input resize-none text-xs mb-3" rows={2} placeholder="Notas..." value={notes} onChange={e => setNotes(e.target.value)} />

                <div className="border-t border-slate-800 pt-3">
                  <div className="flex justify-between text-lg font-bold text-white mb-3">
                    <span>Total</span>
                    <span className="text-green-400">${total.toFixed(2)}</span>
                  </div>
                  <button onClick={handleSubmit} disabled={cart.length === 0} className="btn-primary w-full py-3 text-base">
                    Registrar venta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}