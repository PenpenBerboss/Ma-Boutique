import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faPlus, 
  faMinus, 
  faTrash, 
  faUserPlus, 
  faCreditCard,
  faCircleCheck,
  faXmark,
  faBagShopping,
  faCartShopping,
  faCalendarDays,
  faDollarSign,
  faClockRotateLeft
} from '@fortawesome/free-solid-svg-icons';
import { api } from '../services/api';
import { Product, Customer, SaleItem } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Sales() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [caisseSummary, setCaisseSummary] = useState<{ summary: { count: number; total: number }; recentSales: any[] } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  useEffect(() => {
    api.getProducts().then(setProducts);
    api.getCustomers().then(setCustomers);
    api.getDailyCaisse().then(setCaisseSummary);
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.stock_quantity > 0
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) return prev;
        return prev.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { 
        product_id: product.id, 
        name: product.name, 
        quantity: 1, 
        unit_price: product.selling_price 
      }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === productId) {
        const product = products.find(p => p.id === productId);
        const newQty = Math.max(1, item.quantity + delta);
        if (product && newQty > product.stock_quantity) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleQuickCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const newCustomer = await api.createCustomer({
      name: data.name as string,
      phone: data.phone as string
    });
    await api.getCustomers().then(setCustomers);
    setSelectedCustomer(newCustomer.id);
    setIsCustomerModalOpen(false);
  };

  const total = cart.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      await api.createSale({
        customer_id: selectedCustomer,
        items: cart,
        total_amount: total
      });
      setCart([]);
      setSelectedCustomer(undefined);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      // Refresh products and caisse summary
      api.getProducts().then(setProducts);
      api.getDailyCaisse().then(setCaisseSummary);
    } catch (err) {
      alert("Erreur lors de la vente");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-12rem)]">
      {/* Product Selection */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="relative">
          <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher un produit (Nom, Code...)" 
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all text-left group relative overflow-hidden"
            >
              <div className="absolute top-2 right-2 px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full">
                Stock: {product.stock_quantity}
              </div>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-800 line-clamp-1">{product.name}</h4>
              <p className="text-emerald-600 font-bold mt-1">{product.selling_price} FCFA</p>
              <p className="text-xs text-slate-400 mt-1">{product.category_name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart / Checkout */}
      <div className="w-full lg:w-96 flex flex-col gap-6">
        {/* Daily Summary Card */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Caisse du jour</h4>
            <FontAwesomeIcon icon={faCalendarDays} className="text-slate-500" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-black text-white">{(caisseSummary?.summary.total || 0).toLocaleString()} FCFA</p>
              <p className="text-xs text-slate-400 mt-1">{caisseSummary?.summary.count || 0} ventes aujourd'hui</p>
            </div>
            <div className="text-right">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <FontAwesomeIcon icon={faDollarSign} className="text-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <FontAwesomeIcon icon={faCartShopping} className="w-4 h-4 text-emerald-500" />
              Panier
            </h3>
            <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
              {cart.length} articles
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence initial={false}>
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-12">
                  <FontAwesomeIcon icon={faBagShopping} className="w-10 h-10 mb-4" />
                  <p className="text-sm font-medium">Votre panier est vide</p>
                </div>
              ) : (
                cart.map(item => (
                  <motion.div 
                    key={item.product_id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-3 group"
                  >
                    <div className="flex-1">
                      <h5 className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</h5>
                      <p className="text-xs text-slate-500">{item.unit_price} FCFA / unité</p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
                      <button 
                        onClick={() => updateQuantity(item.product_id, -1)}
                        className="p-1 hover:bg-white rounded transition-colors"
                      >
                        <FontAwesomeIcon icon={faMinus} className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product_id, 1)}
                        className="p-1 hover:bg-white rounded transition-colors"
                      >
                        <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.product_id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client (Optionnel)</label>
                <button 
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider"
                >
                  + Nouveau
                </button>
              </div>
              <select 
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                value={selectedCustomer || ''}
                onChange={(e) => setSelectedCustomer(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">Client de passage</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-500 font-medium">Total</span>
                <span className="text-2xl font-black text-emerald-600">{total.toLocaleString()} FCFA</span>
              </div>
              <button 
                disabled={cart.length === 0 || isProcessing}
                onClick={handleCheckout}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2",
                  cart.length === 0 || isProcessing 
                    ? "bg-slate-300 cursor-not-allowed" 
                    : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 active:scale-[0.98]"
                )}
              >
                {isProcessing ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCreditCard} className="w-4 h-4" />
                    Valider l'encaissement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Customer Modal */}
      <AnimatePresence>
        {isCustomerModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Nouveau Client</h3>
                <button onClick={() => setIsCustomerModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <FontAwesomeIcon icon={faXmark} className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleQuickCustomer} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Nom complet</label>
                    <input name="name" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Téléphone</label>
                    <input name="phone" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                  <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="px-6 py-2.5 text-slate-600 font-semibold">Annuler</button>
                  <button type="submit" className="px-8 py-2.5 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20">Enregistrer</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50"
          >
            <FontAwesomeIcon icon={faCircleCheck} className="w-6 h-6" />
            <span className="font-bold">Transaction validée avec succès !</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Transactions List (Optional/Coherence) */}
      <div className="fixed bottom-8 left-8 w-72 hidden xl:block">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dernières ventes</h4>
            <FontAwesomeIcon icon={faClockRotateLeft} className="text-slate-300 text-xs" />
          </div>
          <div className="p-2 max-h-48 overflow-y-auto">
            {caisseSummary?.recentSales.map((sale) => (
              <div key={sale.id} className="p-3 hover:bg-slate-50 rounded-xl transition-colors flex justify-between items-center">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{sale.customer_name || "Client de passage"}</p>
                  <p className="text-[10px] text-slate-400">{new Date(sale.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <p className="text-xs font-black text-emerald-600">{sale.total_amount.toLocaleString()} F</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
