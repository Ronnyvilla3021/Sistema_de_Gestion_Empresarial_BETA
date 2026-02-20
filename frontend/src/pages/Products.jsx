import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', description: '', sku: '', buyPrice: '', sellPrice: '', stock: '', minStock: '5', categoryId: '' };

export default function Products() {
  const { isSupervisor, isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (catFilter) params.categoryId = catFilter;
      const { data } = await api.get('/products', { params });
      setProducts(data.data);
      setPagination({ total: data.total, page: data.page, pages: data.pages });
    } catch { toast.error('Error al cargar productos'); }
    finally { setLoading(false); }
  }, [search, catFilter]);

  useEffect(() => { api.get('/categories').then(r => setCategories(r.data)); }, []);
  useEffect(() => { const t = setTimeout(() => load(1), 300); return () => clearTimeout(t); }, [load]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description || '', sku: p.sku || '', buyPrice: p.buyPrice, sellPrice: p.sellPrice, stock: p.stock, minStock: p.minStock, categoryId: p.categoryId || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, form);
        toast.success('Producto actualizado');
      } else {
        await api.post('/products', form);
        toast.success('Producto creado');
      }
      setShowModal(false);
      load(pagination.page);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return;
    try { await api.delete(`/products/${id}`); toast.success('Producto eliminado'); load(1); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Productos</h1>
          <p className="text-slate-400 text-sm mt-1">{pagination.total} productos en total</p>
        </div>
        {isSupervisor && <button onClick={openCreate} className="btn-primary">+ Nuevo producto</button>}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input className="input max-w-xs" placeholder="🔍 Buscar productos..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input max-w-[180px]" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <th className="text-left p-4">Producto</th>
              <th className="text-left p-4">SKU</th>
              <th className="text-left p-4">Categoría</th>
              <th className="text-right p-4">Compra</th>
              <th className="text-right p-4">Venta</th>
              <th className="text-right p-4">Stock</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="p-8 text-center text-slate-500">Cargando...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan="7" className="p-8 text-center text-slate-500">Sin productos</td></tr>
            ) : products.map(p => (
              <tr key={p.id} className="table-row">
                <td className="p-4">
                  <p className="font-medium text-white text-sm">{p.name}</p>
                  {p.description && <p className="text-xs text-slate-500 truncate max-w-[200px]">{p.description}</p>}
                </td>
                <td className="p-4 font-mono text-xs text-slate-400">{p.sku || '—'}</td>
                <td className="p-4"><span className="badge badge-blue">{p.Category?.name || '—'}</span></td>
                <td className="p-4 text-right text-slate-400 text-sm">${parseFloat(p.buyPrice).toFixed(2)}</td>
                <td className="p-4 text-right text-green-400 font-medium text-sm">${parseFloat(p.sellPrice).toFixed(2)}</td>
                <td className="p-4 text-right">
                  <span className={`badge ${p.stock <= p.minStock ? 'badge-red' : 'badge-green'}`}>
                    {p.stock}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2 justify-end">
                    {isSupervisor && <button onClick={() => openEdit(p)} className="text-xs btn-secondary py-1">Editar</button>}
                    {isAdmin && <button onClick={() => handleDelete(p.id, p.name)} className="text-xs btn-danger py-1">Eliminar</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => load(p)}
              className={`w-8 h-8 rounded-lg text-sm ${p === pagination.page ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">{editing ? 'Editar producto' : 'Nuevo producto'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input className="input" placeholder="Nombre *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <textarea className="input resize-none" rows={2} placeholder="Descripción" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <input className="input" placeholder="SKU" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} />
                <select className="input" value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})}>
                  <option value="">Sin categoría</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="input" type="number" min="0" step="0.01" placeholder="Precio compra *" value={form.buyPrice} onChange={e => setForm({...form, buyPrice: e.target.value})} required />
                <input className="input" type="number" min="0" step="0.01" placeholder="Precio venta *" value={form.sellPrice} onChange={e => setForm({...form, sellPrice: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="input" type="number" min="0" placeholder="Stock actual" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
                <input className="input" type="number" min="0" placeholder="Stock mínimo" value={form.minStock} onChange={e => setForm({...form, minStock: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}