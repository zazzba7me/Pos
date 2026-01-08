
import React, { useState, useEffect, useRef } from 'react';
import { getProducts, getParties, saveInvoice, getInvoices, deleteInvoice } from '../services/db';
import { Product, Party, InvoiceItem, TransactionType, PaymentStatus, Invoice } from '../types';
import { Plus, Trash2, Printer, Search, User, Phone, ShoppingBag, X, Save, CheckCircle2 } from 'lucide-react';

interface Props {
  onPreview: (inv: Invoice) => void;
}

const InvoiceGenerator: React.FC<Props> = ({ onPreview }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [type, setType] = useState<TransactionType>(TransactionType.SALE);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [history, setHistory] = useState<Invoice[]>([]);
  
  // Party Search
  const [partySearch, setPartySearch] = useState('');
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [showPartyResults, setShowPartyResults] = useState(false);

  // Product Search
  const [prodSearch, setProdSearch] = useState('');
  const [showProdResults, setShowProdResults] = useState(false);
  const [selectedProd, setSelectedProd] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState<number>(0);

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    setProducts(getProducts());
    setParties(getParties());
    setHistory(getInvoices());
  }, [activeTab]);

  const filteredParties = parties.filter(p => 
    p.name.toLowerCase().includes(partySearch.toLowerCase()) || 
    p.phone.includes(partySearch)
  ).slice(0, 5);

  const filteredProds = products.filter(p => 
    p.name.toLowerCase().includes(prodSearch.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(prodSearch.toLowerCase()))
  ).slice(0, 5);

  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  const total = Math.max(0, subtotal - discount);
  const due = Math.max(0, total - paidAmount);

  const addToCart = () => {
    if (!selectedProd) return;
    const newItem: InvoiceItem = {
      productId: selectedProd.id,
      productName: selectedProd.name,
      quantity: qty,
      price: price,
      discount: 0,
      total: price * qty
    };
    setItems([...items, newItem]);
    setSelectedProd(null);
    setProdSearch('');
    setQty(1);
    setPrice(0);
  };

  const handleSave = (print: boolean) => {
    if (items.length === 0 || !selectedParty) {
      alert("Please select a party and add items.");
      return;
    }
    const inv: Invoice = {
      id: `INV-${Date.now()}`,
      date: new Date().toISOString(),
      partyId: selectedParty.id,
      partyName: selectedParty.name,
      type, items, subtotal, discount, totalAmount: total,
      receivedAmount: paidAmount,
      dueAmount: due,
      status: due === 0 ? PaymentStatus.PAID : (paidAmount > 0 ? PaymentStatus.PARTIAL : PaymentStatus.UNPAID)
    };
    saveInvoice(inv);
    if (print) onPreview(inv);
    setItems([]);
    setSelectedParty(null);
    setPartySearch('');
    setPaidAmount(0);
    setDiscount(0);
    alert("Transaction saved successfully.");
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex bg-white p-2 rounded-3xl shadow-sm border border-slate-100 max-w-sm mx-auto">
        <button onClick={() => setActiveTab('create')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'create' ? 'bg-bkash-500 text-white' : 'text-slate-400'}`}>New Invoice</button>
        <button onClick={() => setActiveTab('list')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'list' ? 'bg-bkash-500 text-white' : 'text-slate-400'}`}>Order History</button>
      </div>

      {activeTab === 'create' ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Party Selector */}
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50 relative z-30">
            <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
              <button onClick={() => setType(TransactionType.SALE)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${type === TransactionType.SALE ? 'bg-white text-bkash-500 shadow-sm' : 'text-slate-400'}`}>Sale</button>
              <button onClick={() => setType(TransactionType.PURCHASE)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${type === TransactionType.PURCHASE ? 'bg-white text-blue-500 shadow-sm' : 'text-slate-400'}`}>Purchase</button>
            </div>
            
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Customer / Supplier</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                placeholder="Search by name or phone..." 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm"
                value={selectedParty ? selectedParty.name : partySearch}
                onChange={e => { setPartySearch(e.target.value); setSelectedParty(null); setShowPartyResults(true); }}
                onFocus={() => setShowPartyResults(true)}
              />
              {selectedParty && <X className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 cursor-pointer" size={18} onClick={() => {setSelectedParty(null); setPartySearch('');}} />}
            </div>

            {showPartyResults && partySearch && !selectedParty && (
              <div className="absolute left-6 right-6 top-[100%] mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                {filteredParties.map(p => (
                  <button key={p.id} className="w-full text-left px-5 py-4 hover:bg-slate-50 flex justify-between items-center border-b border-slate-50 last:border-0" onClick={() => { setSelectedParty(p); setShowPartyResults(false); }}>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                      <p className="text-[10px] text-slate-400">{p.phone}</p>
                    </div>
                    <span className="text-[10px] font-black uppercase text-bkash-500">{p.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Entry */}
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50 relative z-20">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Item Details</label>
            <div className="space-y-4">
              <div className="relative">
                <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  placeholder="Search products..." 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm"
                  value={selectedProd ? selectedProd.name : prodSearch}
                  onChange={e => { setProdSearch(e.target.value); setSelectedProd(null); setShowProdResults(true); }}
                  onFocus={() => setShowProdResults(true)}
                />
              </div>

              {showProdResults && prodSearch && !selectedProd && (
                <div className="absolute left-0 right-0 top-[60px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-40">
                  {filteredProds.map(p => (
                    <button key={p.id} className="w-full text-left px-5 py-4 hover:bg-slate-50 flex justify-between items-center border-b border-slate-50" onClick={() => { setSelectedProd(p); setPrice(p.price); setShowProdResults(false); }}>
                      <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                      <p className="text-xs font-black text-bkash-500">৳{p.price}</p>
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <input type="number" placeholder="Price" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm" value={price || ''} onChange={e => setPrice(Number(e.target.value))} />
                </div>
                <div>
                   <input type="number" placeholder="Qty" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm" value={qty} onChange={e => setQty(Number(e.target.value))} />
                </div>
              </div>
              <button onClick={addToCart} className="w-full zazzba-gradient text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">Add to Cart</button>
            </div>
          </div>

          {/* Cart Table */}
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50 space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Current Cart ({items.length})</h3>
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex-1">
                  <h4 className="text-sm font-black text-slate-800 uppercase italic tracking-tight">{item.productName}</h4>
                  <p className="text-[10px] font-bold text-slate-400">{item.quantity} x ৳{item.price}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-black text-slate-900 tracking-tighter">৳{item.total}</span>
                  <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-400 p-2"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout Sticky-style Summary */}
          <div className="bg-white p-8 rounded-[48px] shadow-2xl card-shadow border border-slate-100 space-y-6">
             <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest"><span>Subtotal</span><span>৳{subtotal}</span></div>
                <div className="flex justify-between items-center">
                   <span className="text-xs font-black text-red-500 uppercase tracking-widest">Global Discount</span>
                   <input type="number" className="w-24 bg-red-50 p-2 rounded-xl text-right font-black text-red-600 outline-none" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} />
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                   <span className="text-xl font-black text-slate-900 uppercase italic">Net Total</span>
                   <span className="text-3xl font-black text-bkash-500 tracking-tighter">৳{total}</span>
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 block">Paid Amount</label>
                <input type="number" className="w-full p-6 bg-emerald-50 rounded-[32px] text-center text-4xl font-black text-emerald-700 outline-none shadow-inner border-2 border-emerald-100" value={paidAmount || ''} onChange={e => setPaidAmount(Number(e.target.value))} />
                {due > 0 && <p className="text-center text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse">Outstanding Due: ৳{due}</p>}
             </div>

             <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleSave(false)} className="bg-slate-900 text-white py-5 rounded-[28px] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-slate-200">
                  <Save size={18}/> Draft
                </button>
                <button onClick={() => handleSave(true)} className="zazzba-gradient text-white py-5 rounded-[28px] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-bkash-500/20">
                  <Printer size={18}/> Print
                </button>
             </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {history.length === 0 && <div className="text-center py-20 text-slate-300 font-black uppercase text-xs tracking-widest">No orders found</div>}
          {history.map(inv => (
            <div key={inv.id} className="bg-white p-6 rounded-[36px] border border-slate-50 shadow-sm flex justify-between items-center mobile-card">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                   <div className={`w-2 h-2 rounded-full ${inv.type === TransactionType.SALE ? 'bg-bkash-500' : 'bg-blue-500'}`}></div>
                   <h4 className="text-sm font-black text-slate-800 uppercase italic tracking-tight">{inv.partyName}</h4>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Inv #{inv.id.split('-')[1]} • {new Date(inv.date).toLocaleDateString()}</p>
              </div>
              <div className="text-right flex items-center gap-6">
                 <div>
                   <p className="text-xl font-black text-slate-900 tracking-tighter">৳{inv.totalAmount}</p>
                   <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${inv.status === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{inv.status}</span>
                 </div>
                 <div className="flex flex-col gap-2">
                    <button onClick={() => onPreview(inv)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-bkash-500 transition-all"><Printer size={18}/></button>
                    <button onClick={() => { deleteInvoice(inv.id); setHistory(getInvoices()); }} className="p-3 bg-red-50 text-red-400 rounded-2xl hover:text-red-600 transition-all"><Trash2 size={18}/></button>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoiceGenerator;
