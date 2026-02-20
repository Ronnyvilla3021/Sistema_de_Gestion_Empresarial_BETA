import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import api from '../lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

function KPICard({ title, value, sub, icon, color = 'blue' }) {
  const colors = { blue: 'text-blue-400 bg-blue-900/30', green: 'text-green-400 bg-green-900/30', yellow: 'text-yellow-400 bg-yellow-900/30', red: 'text-red-400 bg-red-900/30' };
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
        </div>
        <span className={`text-2xl p-2 rounded-lg ${colors[color]}`}>{icon}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-slate-400 animate-pulse">Cargando dashboard...</div>;
  if (!data) return <div className="p-8 text-red-400">Error al cargar datos</div>;

  const { kpis, topProducts, monthlyRevenue, salesByCategory } = data;

  const monthlyData = monthlyRevenue.map(m => ({
    month: format(new Date(m.month), 'MMM', { locale: es }),
    ingresos: parseFloat(m.revenue),
    ventas: parseInt(m.sales)
  }));

  const pieData = salesByCategory.slice(0, 5).map((s, i) => ({
    name: s.categoryName || `Cat ${i+1}`,
    value: parseFloat(s.revenue)
  }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Resumen ejecutivo del negocio</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard title="Ventas del mes" value={`$${parseFloat(kpis.monthSales).toLocaleString()}`} sub={`${kpis.monthSalesCount} transacciones`} icon="💰" color="blue" />
        <KPICard title="Clientes activos" value={kpis.activeClients} sub="Total registrados" icon="👥" color="green" />
        <KPICard title="Stock crítico" value={kpis.lowStockProducts} sub="Productos bajo mínimo" icon="⚠️" color="yellow" />
        <KPICard title="Pedidos del mes" value={kpis.monthSalesCount} sub="Este mes" icon="🛒" color="blue" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h2 className="font-semibold text-white mb-4">Ingresos mensuales</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }} formatter={v => [`$${v.toLocaleString()}`, 'Ingresos']} />
              <Bar dataKey="ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="font-semibold text-white mb-4">Ventas por categoría</h2>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }} formatter={v => [`$${parseFloat(v).toLocaleString()}`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-slate-300 truncate max-w-[100px]">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-slate-500 text-sm">Sin datos aún</p>}
        </div>
      </div>

      {/* Productos top */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">Productos más vendidos</h2>
        <div className="space-y-3">
          {topProducts.length === 0 && <p className="text-slate-500 text-sm">Sin ventas registradas aún</p>}
          {topProducts.map((p, i) => (
            <div key={p.productId} className="flex items-center gap-4">
              <span className="text-slate-600 font-mono text-sm w-5">{i + 1}</span>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-slate-300">{p.productName}</span>
                  <span className="text-sm text-slate-400">{p.totalSold} uds.</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full">
                  <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${(p.totalSold / (topProducts[0]?.totalSold || 1)) * 100}%` }} />
                </div>
              </div>
              <span className="text-sm font-medium text-green-400">${parseFloat(p.revenue).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}