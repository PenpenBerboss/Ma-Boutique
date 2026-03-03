import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowTrendUp, 
  faCalendarDays, 
  faDownload, 
  faFileLines, 
  faRotate,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { api } from '../services/api';
import { Product, Sale, Customer } from '../types';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { cn } from '../lib/utils';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Analytics() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([api.getSales(), api.getProducts(), api.getCustomers()]).then(([s, p, c]) => {
      setSales(s);
      setProducts(p);
      setCustomers(c);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReset = async () => {
    if (confirm("Voulez-vous vraiment réinitialiser toutes les données ? Cette action est irréversible.")) {
      setIsResetting(true);
      await api.resetDatabase();
      // The server will restart, so we just reload after a delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  // Simple Moving Average Prediction (3 months)
  const calculateProjections = () => {
    const last3Months = [1, 2, 3].map(i => {
      const start = startOfMonth(subMonths(new Date(), i));
      const end = endOfMonth(subMonths(new Date(), i));
      return sales
        .filter(s => isWithinInterval(new Date(s.sale_date), { start, end }))
        .reduce((acc, s) => acc + s.total_amount, 0);
    });
    
    const average = last3Months.reduce((a, b) => a + b, 0) / 3;
    return average || 0;
  };

  const projection = calculateProjections();

  const salesByMonth = [3, 2, 1, 0].map(i => {
    const date = subMonths(new Date(), i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const total = sales
      .filter(s => isWithinInterval(new Date(s.sale_date), { start, end }))
      .reduce((acc, s) => acc + s.total_amount, 0);
    
    return {
      name: format(date, 'MMM'),
      total
    };
  });

  const topCustomersData = [...customers]
    .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
    .slice(0, 5)
    .map(c => ({
      name: c.name,
      value: c.total_spent || 0
    }));

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Analyses & Prévisions</h2>
          <p className="text-slate-500">Anticipez vos besoins et suivez vos performances.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faRotate} className={cn("w-4 h-4", isResetting && "animate-spin")} />
            Réinitialiser
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors">
            <FontAwesomeIcon icon={faDownload} className="w-4 h-4" />
            Exporter PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Prediction Card */}
        <div className="lg:col-span-1 bg-gradient-to-br from-emerald-500 to-emerald-700 p-8 rounded-3xl text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-emerald-100 text-xs font-bold uppercase tracking-widest mb-4">
              <FontAwesomeIcon icon={faArrowTrendUp} className="w-4 h-4" />
              Prévision Mois Prochain
            </div>
            <div className="text-4xl font-black mb-2">{projection.toLocaleString()} FCFA</div>
            <p className="text-emerald-100/70 text-sm leading-relaxed">
              Basé sur la moyenne mobile des 3 derniers mois. Cette estimation vous aide à planifier vos achats.
            </p>
            <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
              <div className="text-xs font-bold text-emerald-100/50 uppercase">Confiance</div>
              <div className="text-sm font-bold">Modérée (75%)</div>
            </div>
          </div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* Sales Trend */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-8">Évolution du Chiffre d'Affaires</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesByMonth}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Top Customers Chart */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-8">Top 5 Clients (Dépenses)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topCustomersData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {topCustomersData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `${value.toLocaleString()} FCFA`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {topCustomersData.map((c, i) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-slate-600 font-medium">{c.name}</span>
                </div>
                <span className="font-bold text-slate-800">{c.value.toLocaleString()} F</span>
              </div>
            ))}
          </div>
        </div>

        {/* Restocking Suggestions */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Suggestions de Réapprovisionnement</h3>
            <FontAwesomeIcon icon={faRotate} className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            {products.filter(p => p.stock_quantity <= p.min_stock_level).slice(0, 4).map(product => (
              <div key={product.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div>
                  <div className="font-bold text-slate-800 text-sm">{product.name}</div>
                  <div className="text-xs text-slate-500">Stock actuel: {product.stock_quantity}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-600 uppercase">Conseil</div>
                  <div className="text-sm font-bold text-slate-800">Commander {product.min_stock_level * 2} unités</div>
                </div>
              </div>
            ))}
            {products.filter(p => p.stock_quantity <= p.min_stock_level).length === 0 && (
              <p className="text-center py-8 text-slate-400 text-sm">Aucun besoin immédiat détecté.</p>
            )}
          </div>
        </div>

        {/* Reports Section */}
        <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl">
          <h3 className="text-lg font-bold mb-6">Rapports Mensuels</h3>
          <div className="space-y-3">
            {['Février 2026', 'Janvier 2026', 'Décembre 2025'].map(month => (
              <button key={month} className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <FontAwesomeIcon icon={faFileLines} className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="font-medium text-sm">{month}</span>
                </div>
                <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
              </button>
            ))}
          </div>
          <button className="w-full mt-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold text-sm transition-colors">
            Générer Rapport Global
          </button>
        </div>
      </div>
    </div>
  );
}
