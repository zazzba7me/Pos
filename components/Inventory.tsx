import React, { useState, useEffect, useMemo } from 'react';
import { getProducts, saveProduct, deleteProduct, adjustStock, getStockTransactions } from '../services/db';
import { Product, StockMovementType, StockTransaction } from '../types';
import { Plus, Search, Edit2, Trash2, Tag, Box, Barcode, FileText, AlertTriangle, Calendar, Layers, TrendingUp, DollarSign, History, RefreshCcw, Package, X, CheckCircle2 } from 'lucide-react';

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  
  // Stock Adjustment State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<StockMovementType>(StockMovementType.ADJUSTMENT);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNote, setAdjustNote] = useState('');

  // Stock History State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);

  // Delete Confirmation State
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [barcode, setBarcode] = useState('');
  const [unit, setUnit] = useState('pc');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('');
  const [discount, setDiscount] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    setProducts(getProducts());
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
    );
  }, [products, search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: editing ? editing.id : `PROD-${Date.now()}`,
      name, sku, category, brand, description, barcode, unit,
      price: Number(price), cost: Number(cost), stock: Number(stock),
      discount: discount ? Number(discount) : 0,
      reorderLevel: reorderLevel ? Number(reorderLevel) : undefined,
      expiryDate,
    };
    saveProduct(newProduct);
    setProducts(getProducts());
    closeModal();
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProduct) return;
    adjustStock(adjustProduct.id, adjustType, Number(adjustQty), adjustNote);
    setProducts(getProducts());
    setShowAdjustModal(false);
    setAdjustQty('');
    setAdjustNote('');
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setName(''); setSku(''); setCategory(''); setBrand(''); setDescription(''); setBarcode(''); setPrice(''); setCost(''); setStock('');
  };

  const getStockStatus = (prod: Product) => {
    const threshold = prod.reorderLevel || 10;
    if (prod.stock <= 0) return { color: 'bg-red-50 text-red-600 border-red-100', label: 'Out of Stock' };
    if (prod.stock <= threshold) return { color: 'bg-orange-50 text-orange-600 border-orange-100', label: 'Low Stock' };
    return { color: 'bg-green-50 text-green-600 border-green-100', label: 'Healthy' };
  };

  return (
    <div className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="zazzba-gradient p-2.5 rounded-2xl shadow-lg shadow-bkash-500/20">
            <Package className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter">Inventory Hub</h2>
            <p className="text-[10px] font-black text-bkash-500 uppercase tracking-widest">Store Management</p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="w-full md:w-auto zazzba-gradient text-white px-8 py-4 rounded-3xl flex items-center justify-center space-x-2 shadow-xl shadow-bkash-500/30 active:scale-95 transition-all font-black uppercase text-xs tracking-widest"
        >
          <Plus size={18} />
          <span>New Product</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search items by name or SKU code..." 
          className="w-full pl-16 pr-6 py-5 bg-white border border-slate-100 rounded-[32px] shadow-sm outline-none focus:ring-4 focus:ring-bkash-500/10 font-bold text-sm transition-all"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(prod => {
          const status = getStockStatus(prod);
          return (
            <div key={prod.id} className="bg-white p-6 rounded-[40px] border border-slate-50 shadow-sm flex flex-col justify-between card-shadow hover:scale-[1.02] transition-transform duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="bg-slate-50 p-2 rounded-xl text-slate-300">
                    <Box size={14} />
                 </div>
              </div>

              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 pr-4">
                  <span className="text-[9px] font-black text-bkash-500 uppercase tracking-[0.2em] bg-bkash-50 px-3 py-1.5 rounded-full inline-block mb-3">{prod.category || 'Untagged'}</span>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight uppercase italic">{prod.name}</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">SKU: {prod.sku || '---'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-slate-900 tracking-tighter">৳{prod.price}</p>
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Sale Price</p>
                </div>
              </div>

              <div className="flex items-center justify-between py-4 border-y border-slate-50 mb-4">
                <div>
                   <p className="text-xl font-black text-slate-900 tracking-tighter">{prod.stock} <span className="text-[10px] text-slate-400 uppercase tracking-tight font-black">{prod.unit}</span></p>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Physical Stock</p>
                </div>
                <div className={`px-4 py-2 rounded-2xl border text-[9px] font-black uppercase tracking-widest shadow-sm ${status.color}`}>
                  {status.label}
                </div>
              </div>

              <div className="flex items-center gap-2">
                 <button onClick={() => { setAdjustProduct(prod); setShowAdjustModal(true); }} title="Quick Adjust" className="flex-1 bg-slate-50 hover:bg-bkash-50 hover:text-bkash-500 p-4 rounded-2xl text-slate-500 flex justify-center active:scale-95 transition-all">
                    <RefreshCcw size={18} />
                 </button>
                 <button onClick={() => { setHistoryProduct(prod); setTransactions(getStockTransactions(prod.id)); setShowHistoryModal(true); }} title="Audit Trail" className="flex-1 bg-slate-50 hover:bg-slate-100 p-4 rounded-2xl text-slate-500 flex justify-center active:scale-95 transition-all">
                    <History size={18} />
                 </button>
                 <button onClick={() => { 
                   setEditing(prod); setName(prod.name); setPrice(prod.price.toString()); setCost(prod.cost.toString()); setStock(prod.stock.toString()); 
                   setSku(prod.sku || ''); setCategory(prod.category || ''); setShowModal(true);
                 }} className="flex-1 bg-slate-50 hover:bg-slate-100 p-4 rounded-2xl text-slate-500 flex justify-center active:scale-95 transition-all">
                    <Edit2 size={18} />
                 </button>
                 <button onClick={() => setDeleteConfirmationId(prod.id)} className="flex-1 bg-red-50 hover:bg-red-100 p-4 rounded-2xl text-red-400 flex justify-center active:scale-95 transition-all">
                    <Trash2 size={18} />
                 </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Product Edit/Create Modal */}
      {showModal && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-xl rounded-t-[56px] md:rounded-[56px] p-8 md:p-12 shadow-2xl animate-in slide-in-from-bottom-full duration-500 overflow-y-auto max-h-[95vh]">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">{editing ? 'Edit Inventory' : 'Add New Item'}</h3>
                  <p className="text-[10px] font-black text-bkash-500 uppercase tracking-widest">Product Catalog</p>
                </div>
                <button onClick={closeModal} className="p-4 bg-slate-100 rounded-3xl text-slate-500 active:scale-75 transition-all">
                   <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6 pb-12">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Basic Information</label>
                   <input required placeholder="Product Display Name" className="w-full p-6 bg-slate-50 rounded-[32px] outline-none border-2 border-transparent focus:border-bkash-500/20 font-bold text-sm shadow-inner transition-all" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <input placeholder="SKU Code" className="w-full p-5 bg-slate-50 rounded-[28px] outline-none font-bold text-sm shadow-inner" value={sku} onChange={e => setSku(e.target.value)} />
                   <input placeholder="Category" className="w-full p-5 bg-slate-50 rounded-[28px] outline-none font-bold text-sm shadow-inner" value={category} onChange={e => setCategory(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Cost Price</label>
                     <input required type="number" placeholder="৳" className="w-full p-5 bg-slate-50 rounded-[28px] outline-none font-bold text-sm shadow-inner" value={cost} onChange={e => setCost(e.target.value)} />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Sale Price</label>
                     <input required type="number" placeholder="৳" className="w-full p-5 bg-slate-50 rounded-[28px] outline-none font-bold text-sm shadow-inner" value={price} onChange={e => setPrice(e.target.value)} />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Stock Quantity</label>
                     <input required type="number" placeholder="Qty" className="w-full p-5 bg-slate-50 rounded-[28px] outline-none font-bold text-sm shadow-inner" value={stock} onChange={e => setStock(e.target.value)} />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Unit Type</label>
                     <input placeholder="e.g. PCS, BOX" className="w-full p-5 bg-slate-50 rounded-[28px] outline-none font-bold text-sm shadow-inner" value={unit} onChange={e => setUnit(e.target.value)} />
                   </div>
                </div>
                <button type="submit" className="w-full zazzba-gradient text-white py-6 rounded-[32px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-bkash-500/40 active:scale-95 transition-all text-xs">Save Master Product</button>
              </form>
           </div>
         </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustModal && adjustProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-t-[56px] md:rounded-[56px] p-8 md:p-12 shadow-2xl animate-in slide-in-from-bottom-full duration-500">
             <div className="flex justify-between items-center mb-8">
               <div>
                 <h3 className="text-xl font-black text-slate-900 italic tracking-tighter uppercase">Quick Adjustment</h3>
                 <p className="text-[10px] font-black text-bkash-500 uppercase tracking-widest mt-1">{adjustProduct.name}</p>
               </div>
               <button onClick={() => setShowAdjustModal(false)} className="p-4 bg-slate-100 rounded-3xl text-slate-500 active:scale-75 transition-all">
                  <X size={18} />
               </button>
             </div>
             
             <form onSubmit={handleAdjustSubmit} className="space-y-6">
                <div className="flex bg-slate-100 p-1.5 rounded-[24px]">
                   <button 
                     type="button" 
                     onClick={() => setAdjustType(StockMovementType.ADJUSTMENT)}
                     className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${adjustType === StockMovementType.ADJUSTMENT ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                   >Manual Correction</button>
                   <button 
                     type="button" 
                     onClick={() => setAdjustType(StockMovementType.DAMAGE)}
                     className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${adjustType === StockMovementType.DAMAGE ? 'bg-white text-red-500 shadow-sm' : 'text-slate-400'}`}
                   >Damage/Loss</button>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block">Adjustment Value (+/-)</label>
                   <input required type="number" placeholder="Enter difference..." className="w-full p-6 bg-slate-50 rounded-[32px] text-center text-3xl font-black text-slate-900 outline-none shadow-inner" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} />
                </div>

                <input placeholder="Reason for change..." className="w-full p-5 bg-slate-50 rounded-[24px] outline-none font-bold text-sm shadow-inner" value={adjustNote} onChange={e => setAdjustNote(e.target.value)} />

                <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all text-[10px]">Confirm Stock Shift</button>
             </form>
          </div>
        </div>
      )}

      {/* Audit History Modal */}
      {showHistoryModal && historyProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl rounded-t-[56px] md:rounded-[56px] p-8 md:p-12 shadow-2xl animate-in slide-in-from-bottom-full duration-500 max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-10 shrink-0">
                 <div>
                   <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">Audit Trail</h3>
                   <p className="text-[10px] font-black text-bkash-500 uppercase tracking-widest mt-1">{historyProduct.name}</p>
                 </div>
                 <button onClick={() => setShowHistoryModal(false)} className="p-4 bg-slate-100 rounded-3xl text-slate-500 active:scale-75 transition-all">
                    <X size={20} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pb-10">
                 {transactions.length === 0 && <div className="text-center py-20 text-slate-300 font-black uppercase text-xs tracking-[0.3em]">No movement history found</div>}
                 {transactions.map(t => (
                   <div key={t.id} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-5">
                         <div className={`p-4 rounded-2xl ${t.quantity > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {t.quantity > 0 ? <TrendingUp size={18}/> : <TrendingUp size={18} className="rotate-180"/>}
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.type} • {new Date(t.date).toLocaleDateString()}</p>
                            <h4 className="font-bold text-slate-800 text-sm italic">{t.note || 'Regular Stock Update'}</h4>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className={`text-xl font-black tracking-tighter ${t.quantity > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {t.quantity > 0 ? '+' : ''}{t.quantity}
                         </p>
                         <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Balance: {t.newStock}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in zoom-in-95 duration-200">
           <div className="bg-white p-10 rounded-[48px] shadow-2xl max-w-sm w-full text-center space-y-6">
              <div className="mx-auto w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center animate-bounce">
                 <AlertTriangle size={48} />
              </div>
              <div className="space-y-2">
                 <h3 className="text-xl font-black text-slate-900 italic uppercase">Erase Product?</h3>
                 <p className="text-xs text-slate-400 font-bold leading-relaxed">This will permanently remove the item from your digital shelves. Sales data will be preserved.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => setDeleteConfirmationId(null)} className="py-5 bg-slate-100 rounded-3xl font-black uppercase text-[10px] tracking-widest text-slate-500 active:scale-95 transition-all">Cancel</button>
                 <button onClick={() => { deleteProduct(deleteConfirmationId); setProducts(getProducts()); setDeleteConfirmationId(null); }} className="py-5 bg-red-500 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all">Delete</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;