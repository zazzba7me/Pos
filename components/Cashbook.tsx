import React, { useState, useEffect, useMemo } from 'react';
import { getCashTransactions, saveCashTransaction, deleteCashTransaction, getParties, getInvoices, getProducts } from '../services/db';
import { CashTransaction, Party } from '../types';
import { Plus, ArrowDownLeft, ArrowUpRight, TrendingUp, Calendar, Trash2, Filter, Wallet, DollarSign, PieChart, Search, X, AlertTriangle, ArrowLeft, ArrowRight, Receipt, ExternalLink, Lock } from 'lucide-react';

const Cashbook: React.FC = () => {
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);

  // UI State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'IN' | 'OUT'>('ALL');

  // Form State
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [selectedPartyId, setSelectedPartyId] = useState('');

  // Daily Profit Stats
  const [dailySalesProfit, setDailySalesProfit] = useState(0);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setTransactions(getCashTransactions());
    setParties(getParties());
    calculateDailyProfit(viewDate);
  };

  useEffect(() => {
    calculateDailyProfit(viewDate);
  }, [viewDate]);

  const calculateDailyProfit = (dateStr: string) => {
    // 1. Calculate Gross Profit from Sales Invoices on this date
    const invoices = getInvoices().filter(inv => inv.date.startsWith(dateStr) && inv.type === 'SALE');
    const products = getProducts();
    
    let grossProfit = 0;
    invoices.forEach(inv => {
       inv.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          if (product) {
             const cost = product.cost * item.quantity;
             const revenue = item.total; // already includes item discount
             grossProfit += (revenue - cost);
          }
       });
       // Subtract invoice level discount from profit
       grossProfit -= inv.discount;
    });

    setDailySalesProfit(grossProfit);
  };

  const todayTransactions = useMemo(() => {
    return transactions
      .filter(t => t.date.startsWith(viewDate))
      .filter(t => filterType === 'ALL' || t.type === filterType);
  }, [transactions, viewDate, filterType]);

  const stats = useMemo(() => {
    const rawToday = transactions.filter(t => t.date.startsWith(viewDate));
    const cashIn = rawToday.filter(t => t.type === 'IN').reduce((sum, t) => sum + t.amount, 0);
    const cashOut = rawToday.filter(t => t.type === 'OUT').reduce((sum, t) => sum + t.amount, 0);
    const netCash = cashIn - cashOut;
    return { cashIn, cashOut, netCash };
  }, [transactions, viewDate]); // Dependency on transactions list, not filtered view

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const party = parties.find(p => p.id === selectedPartyId);
    
    const newTrx: CashTransaction = {
      id: `CASH-${Date.now()}`,
      date: new Date().toISOString(), // Use current time for sorting
      type,
      amount: Number(amount),
      category,
      description,
      partyId: party?.id,
      partyName: party?.name
    };

    saveCashTransaction(newTrx);
    refreshData();
    setShowModal(false);
    
    // Reset Form
    setAmount('');
    setDescription('');
    setCategory('General');
    setSelectedPartyId('');
  };

  const confirmDelete = () => {
    if (deleteId) {
       deleteCashTransaction(deleteId);
       refreshData();
       setDeleteId(null);
    }
  };

  const changeDate = (days: number) => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() + days);
    setViewDate(d.toISOString().split('T')[0]);
  };

  const categories = [
    'General', 'Sales', 'Purchase', 'Expense', 'Salary', 'Rent', 'Utilities', 'Transportation', 'Food', 'Other'
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Cashbook & Expenses</h2>
           <p className="text-sm text-gray-500">Track daily cash flow and profitability</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
             <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 rounded-md text-gray-600"><ArrowLeft size={16}/></button>
             <input 
               type="date" 
               className="border-none outline-none text-sm text-center w-32 font-medium text-gray-700 bg-transparent"
               value={viewDate}
               onChange={(e) => setViewDate(e.target.value)}
             />
             <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 rounded-md text-gray-600"><ArrowRight size={16}/></button>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-bkash-500 text-white px-5 py-2.5 rounded-lg flex items-center space-x-2 hover:bg-bkash-600 transition shadow-sm font-medium"
          >
            <Plus size={18} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-xs text-green-600 font-bold uppercase mb-1">Today's Cash In</p>
               <h3 className="text-2xl font-bold text-gray-800">${stats.cashIn.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-full">
               <ArrowDownLeft size={24} />
            </div>
         </div>
         <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-xs text-red-500 font-bold uppercase mb-1">Today's Cash Out</p>
               <h3 className="text-2xl font-bold text-gray-800">${stats.cashOut.toFixed(2)}</h3>
            </div>
             <div className="p-3 bg-red-50 text-red-500 rounded-full">
               <ArrowUpRight size={24} />
            </div>
         </div>
         <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-xs text-blue-500 font-bold uppercase mb-1">Net Cash Balance</p>
               <h3 className={`text-2xl font-bold ${stats.netCash >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  ${stats.netCash.toFixed(2)}
               </h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
               <Wallet size={24} />
            </div>
         </div>
         
         <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-xs text-purple-700 font-bold uppercase mb-1">Est. Sales Profit</p>
               <h3 className="text-2xl font-bold text-purple-800">${dailySalesProfit.toFixed(2)}</h3>
               <p className="text-[10px] text-purple-600">Based on Item Cost</p>
            </div>
            <div className="p-3 bg-white bg-opacity-60 text-purple-600 rounded-full">
               <TrendingUp size={24} />
            </div>
         </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
               <Calendar size={18} /> Transactions for {new Date(viewDate).toDateString()}
            </h3>
            
            {/* Filter Tabs */}
            <div className="flex bg-gray-200 p-1 rounded-lg">
                <button 
                  onClick={() => setFilterType('ALL')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${filterType === 'ALL' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  ALL
                </button>
                <button 
                  onClick={() => setFilterType('IN')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${filterType === 'IN' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  IN
                </button>
                <button 
                  onClick={() => setFilterType('OUT')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${filterType === 'OUT' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  OUT
                </button>
            </div>
         </div>
         
         <div className="divide-y divide-gray-100">
            {todayTransactions.length === 0 && (
               <div className="p-12 text-center text-gray-400">
                  <Wallet size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No transactions found.</p>
               </div>
            )}
            {todayTransactions.map(trx => (
               <div key={trx.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-4">
                     <div className={`p-3 rounded-full flex-shrink-0 ${trx.type === 'IN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {trx.type === 'IN' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                     </div>
                     <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-800">{trx.description || trx.category}</h4>
                            {trx.linkedInvoiceId && (
                                <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 font-medium" title="Auto-generated from Invoice">
                                    <Receipt size={10} /> Inv #{trx.linkedInvoiceId.split('-')[1]}
                                </span>
                            )}
                        </div>
                        <div className="text-xs text-gray-500 flex flex-wrap gap-2 mt-0.5">
                           <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">{trx.category}</span>
                           {trx.partyName && <span>• {trx.partyName}</span>}
                           <span>• {new Date(trx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className={`font-bold text-lg ${trx.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                        {trx.type === 'IN' ? '+' : '-'}${trx.amount.toFixed(2)}
                     </span>
                     {trx.linkedInvoiceId ? (
                        <div className="p-2 text-gray-300 opacity-0 group-hover:opacity-100 cursor-not-allowed" title="Managed by Invoice">
                           <Lock size={16} />
                        </div>
                     ) : (
                        <button 
                           onClick={() => setDeleteId(trx.id)}
                           className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        >
                           <Trash2 size={16} />
                        </button>
                     )}
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
              <div className="flex flex-col items-center text-center">
                 <div className="bg-red-100 p-3 rounded-full mb-4">
                    <Trash2 className="text-red-600" size={32} />
                 </div>
                 <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Transaction?</h3>
                 <p className="text-gray-500 text-sm mb-6">
                   Are you sure you want to delete this entry? This action will revert any party balance updates.
                 </p>
                 <div className="flex gap-3 w-full">
                    <button 
                      onClick={() => setDeleteId(null)}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={confirmDelete}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 shadow-sm"
                    >
                      Delete
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
               <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 text-lg">New Cash Entry</h3>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
               </div>
               <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  
                  {/* Type Toggle */}
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                     <button
                        type="button"
                        onClick={() => setType('IN')}
                        className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${type === 'IN' ? 'bg-white shadow text-green-600' : 'text-gray-500'}`}
                     >
                        <ArrowDownLeft size={16} /> Cash IN (Receive)
                     </button>
                     <button
                        type="button"
                        onClick={() => setType('OUT')}
                        className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${type === 'OUT' ? 'bg-white shadow text-red-600' : 'text-gray-500'}`}
                     >
                        <ArrowUpRight size={16} /> Cash OUT (Pay)
                     </button>
                  </div>

                  {/* Amount */}
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <DollarSign size={16} className="text-gray-400" />
                        </div>
                        <input 
                           type="number" 
                           required 
                           min="0"
                           step="0.01"
                           className="w-full border border-gray-300 rounded-lg pl-9 p-2.5 font-bold text-gray-800 focus:ring-bkash-500 focus:border-bkash-500"
                           placeholder="0.00"
                           value={amount}
                           onChange={e => setAmount(e.target.value)}
                        />
                     </div>
                  </div>

                  {/* Party Selection (Optional) */}
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Party (Optional)</label>
                     <select 
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                        value={selectedPartyId}
                        onChange={e => setSelectedPartyId(e.target.value)}
                     >
                        <option value="">-- No Party --</option>
                        {parties.map(p => (
                           <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                        ))}
                     </select>
                     <p className="text-[10px] text-gray-400 mt-1">
                        Linking a party will update their ledger balance automatically.
                     </p>
                  </div>

                  {/* Category & Desc */}
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select 
                           className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                           value={category}
                           onChange={e => setCategory(e.target.value)}
                        >
                           {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input 
                           type="text" 
                           className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                           placeholder="Details..."
                           value={description}
                           onChange={e => setDescription(e.target.value)}
                        />
                     </div>
                  </div>

                  <button 
                     type="submit" 
                     className={`w-full py-3 rounded-lg font-bold text-white shadow-sm mt-4 ${type === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                     Save Transaction
                  </button>

               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default Cashbook;