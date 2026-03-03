import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowTrendUp, 
  faArrowTrendDown, 
  faTriangleExclamation, 
  faDollarSign, 
  faCartShopping,
  faArrowUpRightDots,
  faBox,
  faPlay,
  faRotate,
  faCalendarDays,
  faClock,
  faChartSimple,
  faClockRotateLeft
} from '@fortawesome/free-solid-svg-icons';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeChart, setActiveChart] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const loadStats = () => {
    api.getStats().then(data => {
      setStats(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulate = async () => {
    setIsSimulating(true);
    await api.simulateSale();
    await loadStats();
    setIsSimulating(false);
  };

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100"></div>)}
    </div>
    <div className="h-96 bg-white rounded-2xl border border-slate-100"></div>
  </div>;

  const cards = [
    {
      label: "Chiffre d'Affaires (Jour)",
      value: `${stats?.dailyRevenue.toLocaleString()} FCFA`,
      icon: faDollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      trend: "+12%",
      trendUp: true
    },
    {
      label: "Projection (Mois Prochain)",
      value: `${Math.round(stats?.weightedProjection || 0).toLocaleString()} FCFA`,
      icon: faArrowTrendUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
      trend: "Moyenne Pondérée",
      trendUp: true
    },
    {
      label: "Alertes Stock",
      value: stats?.lowStockCount.toString(),
      icon: faTriangleExclamation,
      color: "text-amber-600",
      bg: "bg-amber-50",
      trend: stats?.lowStockCount && stats.lowStockCount > 0 ? "Action requise" : "Tout va bien",
      trendUp: false
    },
    {
      label: "Profit (Mois)",
      value: `${stats?.monthlyProfit.toLocaleString()} FCFA`,
      icon: faCartShopping,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      trend: "Marge brute",
      trendUp: true
    }
  ];

  const chartData = activeChart === 'daily' 
    ? stats?.dailyHistory.map(d => ({ name: d.date, total: d.total }))
    : activeChart === 'weekly'
    ? stats?.weeklyHistory.map(w => ({ name: `Sem ${w.week.split('-')[1]}`, total: w.total }))
    : stats?.monthlyHistory.map(m => ({ name: m.month, total: m.total }));

  return (
    <div className="space-y-8">
      {/* Header with Simulation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tableau de bord</h2>
          <p className="text-slate-500">Aperçu en temps réel de votre activité.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadStats}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
            title="Rafraîchir"
          >
            <FontAwesomeIcon icon={faRotate} className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
          <button 
            onClick={handleSimulate}
            disabled={isSimulating}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faPlay} className={cn("w-4 h-4", isSimulating && "animate-pulse")} />
            {isSimulating ? "Simulation..." : "Simuler une vente"}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-xl", card.bg)}>
                <FontAwesomeIcon icon={card.icon} className={cn("w-6 h-6", card.color)} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                card.trendUp ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-500"
              )}>
                {card.trendUp ? <FontAwesomeIcon icon={faArrowTrendUp} className="w-3 h-3" /> : <FontAwesomeIcon icon={faArrowTrendDown} className="w-3 h-3" />}
                {card.trend}
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">{card.label}</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{card.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Revenue Chart */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Performance des Ventes</h3>
                <p className="text-slate-500 text-sm">Évolution du chiffre d'affaires</p>
              </div>
              <div className="flex bg-slate-50 p-1 rounded-xl">
                {(['daily', 'weekly', 'monthly'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setActiveChart(type)}
                    className={cn(
                      "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                      activeChart === type 
                        ? "bg-white text-indigo-600 shadow-sm" 
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {type === 'daily' ? 'Jour' : type === 'weekly' ? 'Semaine' : 'Mois'}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorTotal)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Low Rotation Products */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Produits à Faible Rotation</h3>
                <p className="text-slate-500 text-sm">Articles vendus moins de 5 fois en 30 jours</p>
              </div>
              <FontAwesomeIcon icon={faClockRotateLeft} className="w-5 h-5 text-slate-400" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stats?.lowRotationProducts.map((product, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                      <FontAwesomeIcon icon={faBox} className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{product.name}</p>
                      <p className="text-[10px] text-slate-500">Stock: {product.stock_quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-amber-600">{product.total_sold} vendus</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">30 derniers jours</p>
                  </div>
                </div>
              ))}
              {stats?.lowRotationProducts.length === 0 && (
                <div className="col-span-2 py-8 text-center text-slate-400 text-sm">
                  Tous vos produits tournent bien !
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Low Stock List */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Alertes de Stock</h3>
            <div className="space-y-4 mb-8">
              {stats?.lowStockCount === 0 ? (
                <div className="text-center py-4">
                  <p className="text-slate-500 text-sm">Stock suffisant.</p>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-red-50 text-red-600 rounded-xl">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="w-5 h-5" />
                  <span className="text-sm font-bold">{stats?.lowStockCount} alertes</span>
                </div>
              )}
              <Link 
                to="/inventory" 
                className="block w-full text-center py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium rounded-xl transition-colors text-sm"
              >
                Gérer le stock
              </Link>
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-6">Flux en direct</h3>
            <div className="space-y-4">
              {loading ? (
                <div className="animate-pulse space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-50 rounded-xl"></div>)}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Dernières ventes</p>
                  {stats?.recentSales.map((sale, idx) => (
                    <div key={sale.id} className={cn(
                      "p-3 border rounded-xl transition-all",
                      idx === 0 ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100 opacity-80"
                    )}>
                      <div className="flex justify-between items-center">
                        <span className={cn("text-xs font-bold", idx === 0 ? "text-emerald-700" : "text-slate-700")}>
                          {sale.customer_name || "Client de passage"}
                        </span>
                        <span className={cn("text-[10px] font-medium", idx === 0 ? "text-emerald-500" : "text-slate-400")}>
                          {new Date(sale.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={cn("text-[10px] font-bold mt-1", idx === 0 ? "text-emerald-600" : "text-slate-500")}>
                        {sale.total_amount.toLocaleString()} FCFA
                      </p>
                    </div>
                  ))}
                  {stats?.recentSales.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">Aucune vente récente.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Top Products Mini List */}
          <div className="bg-slate-900 p-8 rounded-2xl text-white shadow-xl">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <FontAwesomeIcon icon={faChartSimple} className="w-5 h-5 text-indigo-400" />
              Top 5 Produits
            </h3>
            <div className="space-y-4">
              {stats?.topProducts.map((product, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500">0{i+1}</span>
                    <span className="text-sm font-medium text-slate-300">{product.name}</span>
                  </div>
                  <span className="text-xs font-bold text-indigo-400">{product.total_sold}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

