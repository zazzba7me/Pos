import React, { useState, useEffect, useMemo } from 'react';
import { getParties, saveParty, getInvoices, deleteParty } from '../services/db';
import { Party, Invoice } from '../types';
import { Plus, User, Phone, Mail, MapPin, Hash, ArrowLeft, ArrowUpRight, ArrowDownLeft, Edit, Clock, Search, Filter, Trash2, Building2, Wallet } from 'lucide-react';

const Parties: React.FC = () => {
  const [parties, setParties] = useState<Party[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [viewing, setViewing] = useState<Party | null>(null);
  const [history, setHistory] = useState<Invoice[]>([]);
  const [editing, setEditing] = useState<Party | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'CUSTOMER' | 'SUPPLIER'>('ALL');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [referenceCode, setReferenceCode] = useState('');
  const [type, setType] = useState<'CUSTOMER' | 'SUPPLIER'>('CUSTOMER');

  useEffect(() => {
    setParties(getParties());
  }, []);

  useEffect(() => {
    if (viewing) {
      const allInvoices = getInvoices();
      const partyInvoices = allInvoices.filter(i => i.partyId === viewing.id);
      setHistory(partyInvoices);
    }
  }, [viewing]);

  const filteredParties = useMemo(() => {
    return parties.filter(p => {
       const matchesType = filterType === 'ALL' || p.type === filterType;
       const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             p.phone.includes(searchTerm) ||
                             (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()));
       return matchesType && matchesSearch;
    });
  }, [parties, searchTerm, filterType]);

  const stats = useMemo(() => {
     const receivable = parties.filter(p => p.balance > 0).reduce((sum, p) => sum + p.balance, 0);
     const payable = parties.filter(p => p.balance < 0).reduce((sum, p) => sum + Math.abs(p.balance), 0);
     return { receivable, payable };
  }, [parties]);

  const openModal = (party?: Party) => {
    if (party) {
      setEditing(party);
      setName(party.name);
      setPhone(party.phone);
      setEmail(party.email || '');
      setAddress(party.address || '');
      setReferenceCode(party.referenceCode || '');
      setType(party.type);
    } else {
      setEditing(null);
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setReferenceCode('');
      setType(filterType === 'SUPPLIER' ? 'SUPPLIER' : 'CUSTOMER');
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParty: Party = {
      id: editing ? editing.id : `PARTY-${Date.now()}`,
      name,
      phone,
      email,
      address,
      referenceCode,
      type,
      balance: editing ? editing.balance : 0
    };
    saveParty(newParty);
    setParties(getParties());
    setShowModal(false);
    
    // If we were editing the currently viewed party, update the view
    if (viewing && editing && viewing.id === editing.id) {
       setViewing(newParty);
    }
  };

  const confirmDelete = () => {
    if (deleteId) {
       deleteParty(deleteId);
       setParties(getParties());
       if (viewing?.id === deleteId) setViewing(null);
       setDeleteId(null);
    }
  };

  if (viewing) {
    // Determine Ledger Stats
    const totalBilled = history.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPaid = history.reduce((sum, inv) => sum + inv.receivedAmount, 0);
    const lastTrx = history.length > 0 ? new Date(history[0].date).toLocaleDateString() : 'Never';

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setViewing(null)} 
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{viewing.name}</h2>
            <div className="flex items-center gap-2">
               <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide ${viewing.type === 'CUSTOMER' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                   {viewing.type}
               </span>
               <span className="text-sm text-gray-500">ID: {viewing.id}</span>
            </div>
          </div>
        </div>

        {/* Ledger Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
               <p className="text-xs text-gray-400 font-bold uppercase mb-1">Current Balance</p>
               <h3 className={`text-2xl font-bold ${viewing.balance > 0 ? 'text-green-600' : (viewing.balance < 0 ? 'text-red-500' : 'text-gray-800')}`}>
                   ${Math.abs(viewing.balance).toFixed(2)}
               </h3>
               <p className="text-xs text-gray-500 mt-1">{viewing.balance > 0 ? 'To Receive' : (viewing.balance < 0 ? 'To Pay' : 'Settled')}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
               <p className="text-xs text-gray-400 font-bold uppercase mb-1">Total Invoiced</p>
               <h3 className="text-xl font-bold text-gray-800">${totalBilled.toFixed(2)}</h3>
               <p className="text-xs text-gray-500 mt-1">{history.length} Transactions</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
               <p className="text-xs text-gray-400 font-bold uppercase mb-1">Total Received/Paid</p>
               <h3 className="text-xl font-bold text-bkash-600">${totalPaid.toFixed(2)}</h3>
               <p className="text-xs text-gray-500 mt-1">Lifetime</p>
            </div>
             <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
               <p className="text-xs text-gray-400 font-bold uppercase mb-1">Last Activity</p>
               <h3 className="text-xl font-bold text-gray-800">{lastTrx}</h3>
               <p className="text-xs text-gray-500 mt-1">Date</p>
            </div>
        </div>

        {/* Party Details & Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between gap-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-gray-100 rounded-full text-gray-500"><Phone size={16} /></div>
                 <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Phone</p>
                    <p className="font-medium text-gray-800">{viewing.phone}</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-gray-100 rounded-full text-gray-500"><Mail size={16} /></div>
                 <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Email</p>
                    <p className="font-medium text-gray-800">{viewing.email || 'N/A'}</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-gray-100 rounded-full text-gray-500"><MapPin size={16} /></div>
                 <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Address</p>
                    <p className="font-medium text-gray-800">{viewing.address || 'N/A'}</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-gray-100 rounded-full text-gray-500"><Hash size={16} /></div>
                 <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Ref Code</p>
                    <p className="font-medium text-gray-800">{viewing.referenceCode || 'N/A'}</p>
                 </div>
              </div>
           </div>
           
           <div className="flex flex-col gap-2 justify-center border-l border-gray-100 pl-6">
              <button 
                 onClick={() => openModal(viewing)}
                 className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium transition-colors text-sm"
              >
                 <Edit size={16} /> Edit Profile
              </button>
              <button 
                 onClick={() => setDeleteId(viewing.id)}
                 className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium transition-colors text-sm"
              >
                 <Trash2 size={16} /> Delete Party
              </button>
           </div>
        </div>

        {/* Transaction History Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <Clock size={18} /> Transaction History
              </h3>
           </div>
           <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                 <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Received</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Due</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                 </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                 {history.length === 0 && (
                    <tr>
                       <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">No transactions found for this party.</td>
                    </tr>
                 )}
                 {history.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(inv.date).toLocaleDateString()}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {inv.id.split('-')[1]}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                          {inv.type === 'SALE' ? (
                             <span className="flex items-center gap-1 text-[10px] font-bold text-pink-700 bg-pink-50 px-2 py-1 rounded-full w-fit">
                                <ArrowUpRight size={10} /> SALE
                             </span>
                          ) : (
                             <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-full w-fit">
                                <ArrowDownLeft size={10} /> PURCHASE
                             </span>
                          )}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-bold">
                          ${inv.totalAmount.toFixed(2)}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                          ${inv.receivedAmount.toFixed(2)}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-500 font-bold">
                          {inv.dueAmount > 0 ? `$${inv.dueAmount.toFixed(2)}` : '-'}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`text-[10px] uppercase px-2 py-1 rounded-full font-bold ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : (inv.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')}`}>
                             {inv.status}
                          </span>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Parties & Ledger</h2>
           <p className="text-sm text-gray-500">Manage customers, suppliers, and their accounts</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-bkash-500 text-white px-5 py-2.5 rounded-lg flex items-center space-x-2 hover:bg-bkash-600 transition shadow-sm font-medium"
        >
          <Plus size={18} />
          <span>Add New Party</span>
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-4">
         <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 flex items-center justify-between">
            <div>
               <p className="text-xs text-green-700 font-bold uppercase mb-1">Total Receivable</p>
               <h3 className="text-2xl font-bold text-green-800">${stats.receivable.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-white bg-opacity-60 rounded-full text-green-600">
               <ArrowDownLeft size={24} />
            </div>
         </div>
         <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200 flex items-center justify-between">
            <div>
               <p className="text-xs text-orange-700 font-bold uppercase mb-1">Total Payable</p>
               <h3 className="text-2xl font-bold text-orange-800">${stats.payable.toFixed(2)}</h3>
            </div>
             <div className="p-3 bg-white bg-opacity-60 rounded-full text-orange-600">
               <ArrowUpRight size={24} />
            </div>
         </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
         <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
            <button 
              onClick={() => setFilterType('ALL')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filterType === 'ALL' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilterType('CUSTOMER')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filterType === 'CUSTOMER' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Customers
            </button>
            <button 
              onClick={() => setFilterType('SUPPLIER')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filterType === 'SUPPLIER' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Suppliers
            </button>
         </div>

         <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <Search size={18} className="text-gray-400" />
            </div>
            <input 
               type="text" 
               className="w-full border border-gray-200 rounded-lg pl-10 p-2.5 focus:ring-bkash-500 focus:border-bkash-500 bg-gray-50"
               placeholder="Search by name, phone or email..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      {/* Parties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredParties.map(party => (
          <div key={party.id} className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow group">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2 ${party.type === 'CUSTOMER' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                      {party.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg leading-tight">{party.name}</h3>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${party.type === 'CUSTOMER' ? 'text-blue-500' : 'text-orange-500'}`}>{party.type}</p>
                    </div>
                </div>
                {/* Balance Badge */}
                <div className="text-right">
                   <p className="text-[10px] text-gray-400 font-bold uppercase">Balance</p>
                   <p className={`font-bold text-lg ${party.balance > 0 ? 'text-green-600' : (party.balance < 0 ? 'text-red-500' : 'text-gray-400')}`}>
                      ${Math.abs(party.balance).toFixed(0)}
                   </p>
                </div>
              </div>
              
              <div className="space-y-2.5 mt-2">
                 <div className="flex items-center text-gray-600 text-sm gap-2.5">
                    <Phone size={14} className="text-gray-400" />
                    <span>{party.phone}</span>
                 </div>
                 {party.email && (
                    <div className="flex items-center text-gray-600 text-sm gap-2.5">
                       <Mail size={14} className="text-gray-400" />
                       <span className="truncate">{party.email}</span>
                    </div>
                 )}
                 {party.address && (
                    <div className="flex items-center text-gray-600 text-sm gap-2.5">
                       <MapPin size={14} className="text-gray-400" />
                       <span className="truncate max-w-[200px]">{party.address}</span>
                    </div>
                 )}
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-b-xl border-t border-gray-100 flex gap-2">
               <button 
                 onClick={() => setViewing(party)}
                 className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold hover:bg-bkash-50 hover:text-bkash-600 hover:border-bkash-200 transition-colors"
               >
                 <Wallet size={16} /> Ledger
               </button>
               <a 
                 href={`tel:${party.phone}`}
                 className="flex-none flex items-center justify-center w-10 bg-white border border-gray-200 text-gray-600 rounded-lg hover:text-green-600 hover:border-green-200 transition-colors"
                 title="Call"
               >
                 <Phone size={16} />
               </a>
               <button
                 onClick={() => openModal(party)} 
                 className="flex-none flex items-center justify-center w-10 bg-white border border-gray-200 text-gray-600 rounded-lg hover:text-blue-600 hover:border-blue-200 transition-colors"
                 title="Edit"
               >
                 <Edit size={16} />
               </button>
            </div>
          </div>
        ))}
        
        {filteredParties.length === 0 && (
           <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400">
              <User size={48} className="mb-4 text-gray-300" />
              <p className="text-lg font-medium">No parties found</p>
              <p className="text-sm">Try adjusting your filters or search terms</p>
           </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
              <div className="flex flex-col items-center text-center">
                 <div className="bg-red-100 p-3 rounded-full mb-4">
                    <Trash2 className="text-red-600" size={32} />
                 </div>
                 <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Party?</h3>
                 <p className="text-gray-500 text-sm mb-6">
                   Are you sure you want to remove this party? Invoices associated with this party will remain but will be unlinked.
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
               <h3 className="text-xl font-bold text-gray-800">{editing ? 'Edit Party Details' : 'Add New Party'}</h3>
               <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><Trash2 size={0} className="hidden" /><ArrowLeft size={0} className="hidden" />X</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Party Type</label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${type === 'CUSTOMER' ? 'bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500 ring-opacity-20' : 'border-gray-200 hover:bg-gray-50 text-gray-500'}`}>
                    <input type="radio" name="type" className="hidden" checked={type === 'CUSTOMER'} onChange={() => setType('CUSTOMER')} />
                    <User size={18} />
                    <span className="font-bold text-sm">Customer</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${type === 'SUPPLIER' ? 'bg-orange-50 border-orange-200 text-orange-700 ring-2 ring-orange-500 ring-opacity-20' : 'border-gray-200 hover:bg-gray-50 text-gray-500'}`}>
                    <input type="radio" name="type" className="hidden" checked={type === 'SUPPLIER'} onChange={() => setType('SUPPLIER')} />
                    <Building2 size={18} />
                    <span className="font-bold text-sm">Supplier</span>
                  </label>
                </div>
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                   <input required type="text" className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-bkash-500 focus:border-bkash-500" value={name} onChange={e => setName(e.target.value)} placeholder="Company or Person Name" />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone *</label>
                      <input required type="tel" className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-bkash-500 focus:border-bkash-500" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-700">Ref Code</label>
                       <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 mt-1 focus:ring-bkash-500 focus:border-bkash-500" value={referenceCode} onChange={e => setReferenceCode(e.target.value)} placeholder="e.g. CUST-01" />
                    </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700">Email Address</label>
                   <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <Mail size={16} className="text-gray-400" />
                      </div>
                      <input type="email" className="w-full border border-gray-300 rounded-lg pl-9 p-2.5 focus:ring-bkash-500 focus:border-bkash-500" value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@email.com" />
                   </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700">Address / Location</label>
                    <div className="relative mt-1">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPin size={16} className="text-gray-400" />
                       </div>
                       <input type="text" className="w-full border border-gray-300 rounded-lg pl-9 p-2.5 focus:ring-bkash-500 focus:border-bkash-500" value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, City, Area" />
                    </div>
                 </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-bkash-500 text-white rounded-lg hover:bg-bkash-600 font-medium shadow-sm">
                  {editing ? 'Update Party' : 'Create Party'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Parties;