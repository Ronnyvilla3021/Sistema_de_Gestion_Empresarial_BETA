import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const emptyForm = { name: '', email: '', phone: '', address: '' };

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async (page = 1) => {
    const params = { page, limit: 15 };
    if (search) params.search = search;
    const { data } = await api.get('/clients', { params });
    setClients(data.data);
    setPagination({ total: data.total, page: data.page, pages: data.pages });
  }, [search]);

  useEffect(() => { const t = setTimeout(() => load(1), 300); return () => clearTimeout(t); }, [load]);

  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, email: c.email || '', phone: c.phone || '', address: c.address || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/clients/${editing.id}`, form); toast.success('Cliente actualizado'); }
      else { await api.post('/clients', form); toast.success('Cliente creado'); }
      setShowModal(false);
      load(1);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const toggleActive = async (c) => {
    try {
      await api.put(`/clients/${c.id}`, { active: !c.active });
      toast.success(c.active ? 'Cliente desactivado' : 'Cliente activado');
      load(pagination.page);
    } catch { toast.error('Error'); }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-slate-400 text-sm mt-1">{pagination.total} clientes registrados</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(emptyForm); setShowModal(true); }} className="btn-primary">+ Nuevo cliente</button>
      </div>

      <div className="mb-6">
        <input className="input max-w-xs" placeholder="🔍 Buscar por nombre, email o teléfono..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <th className="text-left p-4">Cliente</th>
              <th className="text-left p-4">Contacto</th>
              <th className="text-left p-4">Dirección</th>
              <th className="text-left p-4">Estado</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-slate-500">Sin clientes</td></tr>
            ) : clients.map(c => (
              <tr key={c.id} className="table-row">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-sm font-medium">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-white">{c.name}</span>
                  </div>
                </td>
                <td className="p-4">
                  <p className="text-xs text-slate-300">{c.email || '—'}</p>
                  <p className="text-xs text-slate-500">{c.phone || '—'}</p>
                </td>
                <td className="p-4 text-xs text-slate-400 max-w-[200px] truncate">{c.address || '—'}</td>
                <td className="p-4">
                  <span className={`badge ${c.active ? 'badge-green' : 'badge-red'}`}>{c.active ? 'Activo' : 'Inactivo'}</span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => openEdit(c)} className="text-xs btn-secondary py-1">Editar</button>
                    <button onClick={() => toggleActive(c)} className={`text-xs py-1 px-3 rounded-lg text-xs font-medium transition-colors ${c.active ? 'bg-red-900 hover:bg-red-800 text-red-300' : 'bg-green-900 hover:bg-green-800 text-green-300'}`}>
                      {c.active ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-white mb-4">{editing ? 'Editar cliente' : 'Nuevo cliente'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input className="input" placeholder="Nombre completo *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <input className="input" type="email" placeholder="Correo electrónico" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              <input className="input" placeholder="Teléfono" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <textarea className="input resize-none" rows={2} placeholder="Dirección" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
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