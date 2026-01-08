
import React, { useState, useEffect, useMemo } from 'react';
import { getProducts, saveProduct, deleteProduct, adjustStock, getStockTransactions } from '../services/db';
import { Product, StockMovementType, StockTransaction } from '../types';
import { Plus, Search, Edit2, Trash2, Tag, Box, Barcode, FileText, AlertTriangle, Calendar, Layers, TrendingUp, DollarSign, History, RefreshCcw, Package } from 'lucide-react';

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  
  // Stock Adjustment State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<StockMovementType>(StockMovementType.PURCHASE);
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
    return products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())));
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

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setName(''); setSku(''); setCategory(''); setBrand(''); setDescription(''); setBarcode(''); setPrice(''); setCost(''); setStock('');
  };

  const getStockStatus = (prod: Product) => {
    const threshold = prod.reorderLevel || 10;
    if (prod.stock <= 0) return { color: 'bg-red-50 text-red-600 border-red-100', label: 'Out of Stock' };
    if (prod.stock <= threshold) return { color: 'bg-orange-50 text-orange-600 border-orange-100', label: 'Low' };
    return { color: 'bg-green-50 text-green-600 border-green-100', label: 'Available' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-bkash-500 p-2.5 rounded-2xl">
            <Package className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 italic tracking-tighter">Stock Inventory</h2>
            <p className="text-[10px] font-black text-bkash-500 uppercase tracking-widest">Manage Products</p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="w-full md:w-auto bg-bkash-500 text-white px-6 py-4 rounded-2xl flex items-center justify-center space-x-2 hover:bg-bkash-600 shadow-xl shadow-bkash-500/20 active:scale-95 transition-all font-black uppercase text-xs tracking-widest"
        >
          <Plus size={18} />
          <span>New Product</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search products by name or SKU..." 
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-[24px] shadow-sm outline-none focus:ring-2 focus:ring-bkash-500/20 font-medium text-sm transition-all"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
        {filteredProducts.map(prod => {
          const status = getStockStatus(prod);
          return (
            <div key={prod.id} className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex flex-col justify-between mobile-card space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <span className="text-[10px] font-black text-bkash-500 uppercase tracking-widest bg-bkash-50 px-3 py-1 rounded-full">{prod.category || 'General'}</span>
                  <h3 className="text-lg font-black text-gray-900 mt-2 tracking-tight leading-tight uppercase italic">{prod.name}</h3>
                  <p className="text-xs text-slate-400 font-bold mt-1">SKU: {prod.sku || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-gray-900 tracking-tighter">৳{prod.price}</p>
                  <p className="text-[10px] text-slate-400 font-bold">Price</p>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-y border-slate-50">
                <div>
                   <p className="text-sm font-black text-gray-800">{prod.stock} <span className="text-[10px] text-slate-400 uppercase">{prod.unit}</span></p>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">In Stock</p>
                </div>
                <div className={`px-4 py-1.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${status.color}`}>
                  {status.label}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                 <button onClick={() => { setEditing(prod); setAdjustProduct(prod); setShowAdjustModal(true); }} className="flex-1 bg-slate-50 hover:bg-slate-100 p-3 rounded-2xl text-slate-600 flex justify-center active:scale-95 transition-all">
                    <RefreshCcw size={18} />
                 </button>
                 <button onClick={() => { setHistoryProduct(prod); setTransactions(getStockTransactions(prod.id)); setShowHistoryModal(true); }} className="flex-1 bg-slate-50 hover:bg-slate-100 p-3 rounded-2xl text-slate-600 flex justify-center active:scale-95 transition-all">
                    <History size={18} />
                 </button>
                 <button onClick={() => { 
                   setEditing(prod); setName(prod.name); setPrice(prod.price.toString()); setCost(prod.cost.toString()); setStock(prod.stock.toString()); 
                   setSku(prod.sku || ''); setCategory(prod.category || ''); setShowModal(true);
                 }} className="flex-1 bg-slate-50 hover:bg-slate-100 p-3 rounded-2xl text-slate-600 flex justify-center active:scale-95 transition-all">
                    <Edit2 size={18} />
                 </button>
                 <button onClick={() => { setDeleteConfirmationId(prod.id); }} className="flex-1 bg-red-50 hover:bg-red-100 p-3 rounded-2xl text-red-500 flex justify-center active:scale-95 transition-all">
                    <Trash2 size={18} />
                 </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Product Modal (Simple Version for space) */}
      {showModal && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
           <div className="bg-white w-full max-w-lg rounded-t-[40px] md:rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-500 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-900 italic tracking-tighter uppercase">{editing ? 'Edit Item' : 'New Item'}</h3>
                <button onClick={closeModal} className="p-2 bg-slate-100 rounded-full text-slate-500">
                   <Plus size={20} className="rotate-45" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4 pb-10">
                <input required placeholder="Product Name" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-none font-bold text-sm shadow-inner" value={name} onChange={e => setName(e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                   <input placeholder="SKU" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-none font-bold text-sm shadow-inner" value={sku} onChange={e => setSku(e.target.value)} />
                   <input placeholder="Category" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-none font-bold text-sm shadow-inner" value={category} onChange={e => setCategory(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Cost Price</label>
                     <input required type="number" placeholder="Cost" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-none font-bold text-sm shadow-inner" value={cost} onChange={e => setCost(e.target.value)} />
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Sale Price</label>
                     <input required type="number" placeholder="Sale" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-none font-bold text-sm shadow-inner" value={price} onChange={e => setPrice(e.target.value)} />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Stock</label>
                     <input required type="number" placeholder="Qty" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-none font-bold text-sm shadow-inner" value={stock} onChange={e => setStock(e.target.value)} />
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">Unit</label>
                     <input placeholder="e.g. pc" className="w-full p-4 bg-slate-50 rounded-2xl outline-none border-none font-bold text-sm shadow-inner" value={unit} onChange={e => setUnit(e.target.value)} />
                   </div>
                </div>
                <button type="submit" className="w-full bg-bkash-500 text-white py-5 rounded-[24px] font-black uppercase tracking-[0.2em] shadow-xl shadow-bkash-500/20 active:scale-95 transition-all">Save Changes</button>
              </form>
           </div>
         </div>
      )}
    </div>
  );
};

export default Inventory;
