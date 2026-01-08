
import React, { useState, useEffect, useRef } from 'react';
import { getProducts, getParties, saveInvoice, getInvoices, deleteInvoice, saveProduct, saveParty, updateInvoice, getBusinessInfo, addInvoicePayment } from '../services/db';
import { Product, Party, InvoiceItem, TransactionType, PaymentStatus, Invoice, BusinessInfo } from '../types';
import { Plus, Trash2, Printer, MessageCircle, AlertCircle, Calculator, Save, Search, X, User, Phone, ArrowUpRight, ArrowDownLeft, Clock, FileText, Eye, Edit, Edit2, RefreshCw, ArrowLeft, Calendar, Mail, RotateCcw, CreditCard, ShoppingBag } from 'lucide-react';

interface Props {
  onPreview: (inv: Invoice) => void;
}

const InvoiceGenerator: React.FC<Props> = ({ onPreview }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [type, setType] = useState<TransactionType>(TransactionType.SALE);
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [history, setHistory] = useState<Invoice[]>([]);
  
  // Form State
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [partySearchTerm, setPartySearchTerm] = useState('');
  const [partyPhone, setPartyPhone] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Product Entry State
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [qty, setQty] = useState(1);
  const [itemDiscount, setItemDiscount] = useState<number | ''>(''); 
  const [paidAmount, setPaidAmount] = useState(0);
  const [discount, setDiscount] = useState(0); 

  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setProducts(getProducts());
    setParties(getParties());
    setHistory(getInvoices());
  }, [activeTab]);

  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  const totalAmount = Math.max(0, subtotal - discount);
  const dueAmount = Math.max(0, totalAmount - paidAmount);

  const addItem = () => {
    if (!searchTerm.trim() || Number(unitPrice) < 0) return;
    const prod = products.find(p => p.name.toLowerCase() === searchTerm.toLowerCase()) || { id: `TEMP-${Date.now()}`, name: searchTerm };
    const newItem: InvoiceItem = {
      productId: prod.id,
      productName: prod.name,
      quantity: qty,
      price: Number(unitPrice),
      discount: Number(itemDiscount) || 0,
      total: (Number(unitPrice) * qty) - (Number(itemDiscount) || 0)
    };
    setItems([...items, newItem]);
    setSearchTerm(''); setUnitPrice(''); setQty(1); setItemDiscount('');
  };

  const handleSave = (print: boolean) => {
    if (items.length === 0 || !partySearchTerm) return;
    const inv: Invoice = {
      id: editingId || `INV-${Date.now()}`,
      date: new Date(invoiceDate).toISOString(),
      partyId: selectedPartyId || `PARTY-${Date.now()}`,
      partyName: partySearchTerm,
      type, items, subtotal, discount, totalAmount,
      receivedAmount: paidAmount,
      dueAmount,
      status: paidAmount >= totalAmount ? PaymentStatus.PAID : PaymentStatus.PARTIAL
    };
    if (editingId) updateInvoice(inv); else saveInvoice(inv);
    if (print) onPreview(inv);
    setItems([]); setPartySearchTerm(''); setPaidAmount(0); setDiscount(0); setEditingId(null);
    alert('Invoice Processed Successfully');
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-slate-50">
        <div className="flex gap-4">
           <button onClick={() => setActiveTab('create')} className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'create' ? 'bg-bkash-500 text-white' : 'text-slate-400'}`}>POS</button>
           <button onClick={() => setActiveTab('list')} className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'list' ? 'bg-bkash-500 text-white' : 'text-slate-400'}`}>History</button>
        </div>
        {editingId && <button onClick={() => { setEditingId(null); setItems([]); }} className="text-[10px] font-black uppercase text-red-500 tracking-widest">Cancel Edit</button>}
      </div>

      {activeTab === 'create' ? (
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-6">
            <div className="flex bg-slate-100 p-1 rounded-2xl">
               <button onClick={() => setType(TransactionType.SALE)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${type === TransactionType.SALE ? 'bg-white text-bkash-500 shadow-sm' : 'text-slate-500'}`}>Sale</button>
               <button onClick={() => setType(TransactionType.PURCHASE)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${type === TransactionType.PURCHASE ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Purchase</button>
            </div>

            <div className="space-y-4">
               <div className="relative">
                 <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                 <input placeholder="Party Name" className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm shadow-inner" value={partySearchTerm} onChange={e => setPartySearchTerm(e.target.value)} />
               </div>
               <div className="relative">
                 <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                 <input placeholder="Phone Number" className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm shadow-inner" value={partyPhone} onChange={e => setPartyPhone(e.target.value)} />
               </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-[24px] space-y-4 shadow-inner">
               <div className="relative">
                 <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                 <input placeholder="Product Name" className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl outline-none font-bold text-sm shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Price" className="w-full p-4 bg-white rounded-2xl outline-none font-bold text-sm shadow-sm" value={unitPrice} onChange={e => setUnitPrice(Number(e.target.value))} />
                  <input type="number" placeholder="Qty" className="w-full p-4 bg-white rounded-2xl outline-none font-bold text-sm shadow-sm" value={qty} onChange={e => setQty(Number(e.target.value))} />
               </div>
               <button onClick={addItem} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg active:scale-95 transition-all">+ Add To Cart</button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Cart Items ({items.length})</h3>
             {items.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                   <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase italic tracking-tight">{item.productName}</h4>
                      <p className="text-[10px] font-bold text-slate-400">{item.quantity} x ৳{item.price}</p>
                   </div>
                   <div className="text-right flex items-center gap-4">
                      <span className="text-sm font-black text-slate-900 tracking-tighter">৳{item.total}</span>
                      <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-red-400"><Trash2 size={16}/></button>
                   </div>
                </div>
             ))}
             {items.length === 0 && <div className="text-center py-10 text-slate-300 font-black uppercase text-[10px] tracking-widest">Cart is empty</div>}
          </div>

          <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 space-y-6">
             <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest"><span>Subtotal</span><span>৳{subtotal}</span></div>
                <div className="flex justify-between items-center">
                   <span className="text-xs font-black text-red-500 uppercase tracking-widest">Discount</span>
                   <input type="number" className="w-24 bg-red-50 p-2 rounded-xl text-right font-black text-red-600 outline-none" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                   <span className="text-xl font-black text-slate-900 italic uppercase tracking-tighter">Net Total</span>
                   <span className="text-3xl font-black text-bkash-500 tracking-tighter">৳{totalAmount}</span>
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 block">Cash Paid</label>
                <input type="number" className="w-full p-6 bg-green-50 rounded-[32px] text-center text-3xl font-black text-green-700 outline-none shadow-inner border-2 border-green-100" value={paidAmount} onChange={e => setPaidAmount(Number(e.target.value))} />
                {dueAmount > 0 && <p className="text-center text-xs font-black text-red-500 uppercase tracking-widest animate-pulse">Due: ৳{dueAmount}</p>}
             </div>

             <div className="grid grid-cols-2 gap-4 pt-4">
                <button onClick={() => handleSave(false)} className="bg-slate-800 text-white py-5 rounded-[28px] font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-200 active:scale-95 transition-all">Save Only</button>
                <button onClick={() => handleSave(true)} className="bg-bkash-500 text-white py-5 rounded-[28px] font-black uppercase text-xs tracking-widest shadow-xl shadow-bkash-500/20 active:scale-95 transition-all">Save & Print</button>
             </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
           {history.map(inv => (
              <div key={inv.id} className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex justify-between items-center mobile-card">
                 <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${inv.type === TransactionType.SALE ? 'bg-bkash-500' : 'bg-blue-500'}`}></span>
                      <h4 className="text-sm font-black text-slate-800 uppercase italic tracking-tight">{inv.partyName}</h4>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Inv #{inv.id.split('-')[1]} • {new Date(inv.date).toLocaleDateString()}</p>
                 </div>
                 <div className="text-right flex items-center gap-6">
                    <div>
                       <p className="text-lg font-black text-slate-900 tracking-tighter">৳{inv.totalAmount}</p>
                       <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${inv.status === PaymentStatus.PAID ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{inv.status}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                       <button onClick={() => onPreview(inv)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-bkash-500"><Printer size={18}/></button>
                       <button onClick={() => deleteInvoice(inv.id)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500"><Trash2 size={18}/></button>
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
