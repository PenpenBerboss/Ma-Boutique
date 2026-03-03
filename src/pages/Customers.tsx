import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserPlus, 
  faSearch, 
  faPhone, 
  faEnvelope, 
  faClockRotateLeft, 
  faStar,
  faChevronRight,
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import { api } from '../services/api';
import { Customer } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyModal, setHistoryModal] = useState<{ open: boolean; customer: Customer | null; history: any[] }>({
    open: false,
    customer: null,
    history: []
  });

  useEffect(() => {
    api.getCustomers().then(setCustomers);
  }, []);

  const viewHistory = async (customer: Customer) => {
    const history = await api.getCustomerHistory(customer.id);
    setHistoryModal({ open: true, customer, history });
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  const sortedCustomers = [...filteredCustomers].sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0));

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    await api.createCustomer({
      name: data.name as string,
      phone: data.phone as string,
      email: data.email as string
    });
    
    setIsModalOpen(false);
    api.getCustomers().then(setCustomers);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher un client (Nom, Téléphone...)" 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors shadow-sm"
        >
          <FontAwesomeIcon icon={faUserPlus} className="w-4 h-4" />
          Nouveau Client
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Customers List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FontAwesomeIcon icon={faStar} className="w-4 h-4 text-amber-500" />
            Classement des Clients
          </h3>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {sortedCustomers.map((customer, index) => (
                <div key={customer.id} className="p-6 flex items-center gap-6 hover:bg-slate-50 transition-colors group">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                    index === 0 ? "bg-amber-100 text-amber-600" : 
                    index === 1 ? "bg-slate-100 text-slate-600" :
                    index === 2 ? "bg-orange-100 text-orange-600" : "bg-slate-50 text-slate-400"
                  )}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800">{customer.name}</h4>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <FontAwesomeIcon icon={faPhone} className="w-3 h-3" />
                        {customer.phone || 'N/A'}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <FontAwesomeIcon icon={faClockRotateLeft} className="w-3 h-3" />
                        {customer.total_orders || 0} commandes
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-emerald-600">{(customer.total_spent || 0).toLocaleString()} FCFA</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Dépensé</div>
                  </div>
                  <button 
                    onClick={() => viewHistory(customer)}
                    className="p-2 text-slate-300 hover:text-emerald-500 transition-colors"
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <div className="bg-emerald-600 p-8 rounded-3xl text-white shadow-xl shadow-emerald-600/20">
            <h3 className="text-emerald-100 text-sm font-bold uppercase tracking-widest mb-2">Total Clients</h3>
            <div className="text-4xl font-black">{customers.length}</div>
            <p className="text-emerald-100/60 text-xs mt-4">
              +3 nouveaux clients cette semaine
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-slate-800 font-bold mb-4">Fidélisation</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Taux de retour</span>
                <span className="text-sm font-bold text-emerald-600">64%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[64%]"></div>
              </div>
              <p className="text-xs text-slate-400 italic">
                Basé sur les clients ayant commandé plus d'une fois.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {historyModal.open && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Historique des achats</h3>
                  <p className="text-sm text-slate-500">{historyModal.customer?.name}</p>
                </div>
                <button 
                  onClick={() => setHistoryModal({ ...historyModal, open: false })} 
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <FontAwesomeIcon icon={faXmark} className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                {historyModal.history.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    Aucun achat enregistré pour ce client.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {historyModal.history.map((sale) => (
                      <div key={sale.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {new Date(sale.sale_date).toLocaleDateString()} à {new Date(sale.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {sale.items_summary}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-emerald-600">{sale.total_amount.toLocaleString()} FCFA</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Nouveau Client</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <FontAwesomeIcon icon={faXmark} className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Nom complet</label>
                  <input name="name" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Téléphone</label>
                  <input name="phone" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Email</label>
                  <input type="email" name="email" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-slate-600 font-semibold">Annuler</button>
                <button type="submit" className="px-8 py-2.5 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20">Enregistrer</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
}

function X(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
}
