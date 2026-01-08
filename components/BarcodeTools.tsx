import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { getProducts, getBusinessInfo } from '../services/db';
import { Product, BusinessInfo } from '../types';
import { Search, Printer, Plus, X, Barcode as BarcodeIcon, Settings, Trash2, RotateCcw, FileDown, Loader, LayoutGrid, Type } from 'lucide-react';

interface PrintItem {
  id: string; // Unique ID for queue item
  productId: string;
  name: string;
  code: string; // SKU or Barcode
  price: number;
  quantity: number;
}

const BarcodeTools: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [queue, setQueue] = useState<PrintItem[]>([]);
  const [bizInfo, setBizInfo] = useState<BusinessInfo | null>(null);

  // --- Settings State ---
  const [showPrice, setShowPrice] = useState(true);
  const [showName, setShowName] = useState(true);
  const [showStoreName, setShowStoreName] = useState(true);
  const [showCode, setShowCode] = useState(true);
  const [showBorders, setShowBorders] = useState(true);
  
  // Dimensions (in mm)
  const [labelWidth, setLabelWidth] = useState(48); 
  const [labelHeight, setLabelHeight] = useState(25);
  const [gap, setGap] = useState(2); // Gap between labels
  const [fontSize, setFontSize] = useState(10);
  
  const [isGenerating, setIsGenerating] = useState(false);

  // A4 Constants (mm)
  const PAGE_WIDTH = 210;
  const PAGE_HEIGHT = 297;
  const PAGE_PAD = 10;

  useEffect(() => {
    setProducts(getProducts());
    setBizInfo(getBusinessInfo());
  }, []);

  // --- Layout Calculations ---
  const layout = useMemo(() => {
    const usableWidth = PAGE_WIDTH - (PAGE_PAD * 2);
    const usableHeight = PAGE_HEIGHT - (PAGE_PAD * 2);
    
    // Calculate how many fit
    const cols = Math.floor((usableWidth + gap) / (labelWidth + gap));
    const rows = Math.floor((usableHeight + gap) / (labelHeight + gap));
    const itemsPerPage = cols * rows;

    return { cols, rows, itemsPerPage, usableWidth };
  }, [labelWidth, labelHeight, gap]);

  const addToQueue = (product: Product) => {
    const code = product.barcode || product.sku;
    if (!code) {
      alert(`Product "${product.name}" has no Barcode or SKU set.`);
      return;
    }

    const newItem: PrintItem = {
      id: `Q-${Date.now()}`,
      productId: product.id,
      name: product.name,
      code: code,
      price: product.price,
      quantity: 1
    };
    setQueue([...queue, newItem]);
    setSearchTerm(''); 
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty < 1) return;
    setQueue(queue.map(item => item.id === id ? { ...item, quantity: qty } : item));
  };

  const removeFromQueue = (id: string) => {
    setQueue(queue.filter(item => item.id !== id));
  };

  const clearQueue = () => {
    if(confirm('Clear all items from print queue?')) {
        setQueue([]);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.barcode && p.barcode.includes(searchTerm))
  ).slice(0, 8); 

  // --- Sub-Component: The Label ---
  // Using Image approach for better PDF resolution compatibility than inline SVG
  const BarcodeLabel = ({ item }: { item: PrintItem }) => {
    const [imgSrc, setImgSrc] = useState<string>('');

    useEffect(() => {
        try {
            const canvas = document.createElement('canvas');
            // Generate barcode with explicit white background to prevent transparency issues
            JsBarcode(canvas, item.code, {
                format: "CODE128",
                width: 4, // Higher width for better scaling
                height: 100, // Higher height for better scaling
                displayValue: false,
                margin: 0,
                background: '#ffffff',
                lineColor: '#000000'
            });
            setImgSrc(canvas.toDataURL('image/png'));
        } catch (e) {
            console.error("Barcode generation failed", e);
        }
    }, [item.code]);

    return (
      <div 
        className={`flex flex-col items-center justify-between text-center overflow-hidden h-full w-full bg-white relative ${showBorders ? 'border border-dashed border-gray-300' : ''}`}
        style={{ 
            padding: '2mm',
        }}
      >
          {/* Top Content */}
          <div className="w-full relative z-10 px-0.5 pointer-events-none">
            {showStoreName && (
                <p className="font-bold text-gray-900 uppercase tracking-tight truncate w-full leading-tight" style={{ fontSize: `${fontSize * 0.9}px` }}>
                    {bizInfo?.name || 'STORE'}
                </p>
            )}
            {showName && (
                <p className="font-semibold text-gray-800 leading-tight line-clamp-2 w-full mt-0.5 break-words" style={{ fontSize: `${fontSize}px` }}>
                    {item.name}
                </p>
            )}
          </div>

          {/* Barcode Image Container */}
          <div className="flex-1 w-full flex items-center justify-center py-1 overflow-hidden min-h-0 z-0">
              {imgSrc ? (
                  <img 
                      src={imgSrc} 
                      alt={item.code}
                      className="object-contain max-w-full max-h-full" 
                  />
              ) : (
                  <div className="w-full h-full bg-gray-50 animate-pulse rounded"></div>
              )}
          </div>

          {/* Bottom Content */}
          <div className="w-full relative z-10 px-0.5 pointer-events-none">
             {showCode && (
                <p className="font-mono text-gray-600 tracking-wider leading-none" style={{ fontSize: `${fontSize * 0.8}px` }}>
                    {item.code}
                </p>
             )}
             {showPrice && (
                <p className="font-black text-gray-900 mt-0.5 leading-none" style={{ fontSize: `${fontSize * 1.2}px` }}>
                    ${item.price.toFixed(2)}
                </p>
             )}
          </div>
      </div>
    );
  };

  // --- Pagination Logic ---
  const getPages = () => {
    const flatList: PrintItem[] = [];
    queue.forEach(item => {
      for(let i=0; i<item.quantity; i++) flatList.push(item);
    });

    const pages = [];
    for (let i = 0; i < flatList.length; i += layout.itemsPerPage) {
        pages.push(flatList.slice(i, i + layout.itemsPerPage));
    }
    return pages;
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const pages = document.querySelectorAll('.print-page-container');
    if (pages.length === 0) return;
    
    setIsGenerating(true);
    
    try {
      // Initialize PDF (A4)
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        if (i > 0) pdf.addPage();
        
        // Use high scale for crisp text and barcode lines
        const canvas = await html2canvas(page, {
           scale: 4, 
           useCORS: true,
           logging: false,
           backgroundColor: '#ffffff', // Force white background
           allowTaint: true
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
      }
      
      pdf.save(`Labels_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error("PDF Generation Error", e);
      alert("Failed to generate PDF. Check console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  const printMountNode = document.getElementById('print-mount');
  
  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header & Controls */}
      <div className="no-print space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <BarcodeIcon className="text-bkash-500" /> Barcode Generator
            </h2>
            <p className="text-sm text-gray-500">Create auto-sized PDF labels</p>
          </div>
          <div className="flex gap-3">
             <button 
                onClick={clearQueue}
                disabled={queue.length === 0}
                className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium disabled:opacity-50 transition"
                title="Clear Queue"
             >
                <RotateCcw size={18} />
             </button>
             <button 
                onClick={handleDownloadPDF}
                disabled={queue.length === 0 || isGenerating}
                className="bg-bkash-600 text-white px-5 py-2.5 rounded-lg flex items-center space-x-2 hover:bg-bkash-700 transition shadow-sm font-bold disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0"
             >
                {isGenerating ? <Loader size={18} className="animate-spin"/> : <FileDown size={18} />}
                <span>Download PDF</span>
             </button>
             <button 
                onClick={handleBrowserPrint}
                disabled={queue.length === 0}
                className="bg-gray-800 text-white px-5 py-2.5 rounded-lg flex items-center space-x-2 hover:bg-gray-900 transition shadow-sm font-bold disabled:opacity-50"
             >
                <Printer size={18} />
                <span>Quick Print</span>
             </button>
          </div>
        </div>

        {/* Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: Settings & Search (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
             
             {/* 1. Add Product */}
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative z-20">
               <label className="block text-sm font-bold text-gray-700 mb-2">1. Add Products</label>
               <div className="relative">
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg pl-9 p-3 focus:ring-bkash-500 focus:border-bkash-500"
                    placeholder="Scan code or search name..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                  <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"><X size={16}/></button>
                  )}
               </div>

               {searchTerm && (
                 <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {filteredProducts.map(p => (
                       <button
                         key={p.id}
                         onClick={() => addToQueue(p)}
                         className="w-full text-left px-4 py-3 hover:bg-bkash-50 border-b border-gray-50 flex justify-between group"
                       >
                          <div>
                             <p className="font-bold text-gray-800">{p.name}</p>
                             <p className="text-xs text-gray-500">SKU: {p.sku || 'N/A'}</p>
                          </div>
                          <div className="text-right">
                             <span className="text-bkash-600 font-bold">${p.price}</span>
                          </div>
                       </button>
                    ))}
                    {filteredProducts.length === 0 && <div className="p-4 text-center text-gray-400 text-sm">No results</div>}
                 </div>
               )}
            </div>

            {/* 2. Layout Settings */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
               <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                  <LayoutGrid size={18} className="text-bkash-500" /> Layout & Dimensions
               </h3>
               
               <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Width (mm)</label>
                    <input type="number" value={labelWidth} onChange={e => setLabelWidth(Number(e.target.value))} className="w-full border rounded p-2 mt-1"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Height (mm)</label>
                    <input type="number" value={labelHeight} onChange={e => setLabelHeight(Number(e.target.value))} className="w-full border rounded p-2 mt-1"/>
                  </div>
               </div>
               
               <div className="mb-4">
                   <label className="text-xs font-bold text-gray-500 uppercase flex justify-between">
                     Gap Spacing <span className="text-gray-800">{gap}mm</span>
                   </label>
                   <input type="range" min="0" max="10" step="0.5" value={gap} onChange={e => setGap(Number(e.target.value))} className="w-full accent-bkash-500 mt-1"/>
               </div>

               <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-1">
                  <div className="flex justify-between"><span>Page Size:</span> <span className="font-bold">A4 (210x297mm)</span></div>
                  <div className="flex justify-between"><span>Columns:</span> <span className="font-bold">{layout.cols}</span></div>
                  <div className="flex justify-between"><span>Rows:</span> <span className="font-bold">{layout.rows}</span></div>
                  <div className="flex justify-between text-bkash-600"><span>Total per Page:</span> <span className="font-bold">{layout.itemsPerPage}</span></div>
               </div>
            </div>

            {/* 3. Style Settings */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
               <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                  <Type size={18} className="text-bkash-500" /> Content & Style
               </h3>
               <div className="space-y-2">
                  {[
                    { label: 'Store Name', state: showStoreName, set: setShowStoreName },
                    { label: 'Product Name', state: showName, set: setShowName },
                    { label: 'Price', state: showPrice, set: setShowPrice },
                    { label: 'Code Text', state: showCode, set: setShowCode },
                    { label: 'Cutting Borders', state: showBorders, set: setShowBorders },
                  ].map((opt, i) => (
                    <label key={i} className="flex items-center justify-between cursor-pointer p-2 hover:bg-gray-50 rounded">
                       <span className="text-sm text-gray-700">{opt.label}</span>
                       <div className={`w-10 h-5 rounded-full relative transition-colors ${opt.state ? 'bg-bkash-500' : 'bg-gray-300'}`}>
                          <input type="checkbox" checked={opt.state} onChange={e => opt.set(e.target.checked)} className="opacity-0 w-full h-full absolute cursor-pointer" />
                          <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${opt.state ? 'left-6' : 'left-1'}`} />
                       </div>
                    </label>
                  ))}
               </div>
               <div className="mt-4 pt-4 border-t border-gray-100">
                   <label className="text-xs font-bold text-gray-500 uppercase flex justify-between">
                     Font Size <span className="text-gray-800">{fontSize}px</span>
                   </label>
                   <input type="range" min="8" max="16" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full accent-bkash-500 mt-1"/>
               </div>
            </div>

            {/* Queue List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col max-h-80">
               <div className="p-3 bg-gray-50 border-b border-gray-100 font-bold text-gray-700 text-sm">
                  Print Queue ({queue.reduce((a,b)=>a+b.quantity,0)})
               </div>
               <div className="overflow-y-auto p-2 space-y-2">
                   {queue.length === 0 && <p className="text-center text-gray-400 py-4 text-sm">Empty</p>}
                   {queue.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-white border border-gray-100 rounded text-sm">
                         <div className="truncate flex-1 pr-2">
                            <div className="font-bold truncate">{item.name}</div>
                            <div className="text-xs text-gray-500">${item.price}</div>
                         </div>
                         <div className="flex items-center gap-2">
                            <input type="number" className="w-10 border rounded text-center p-1" value={item.quantity} onChange={e=>updateQuantity(item.id, Number(e.target.value))} />
                            <button onClick={()=>removeFromQueue(item.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                         </div>
                      </div>
                   ))}
               </div>
            </div>

          </div>

          {/* Right: Live Preview (8 Cols) */}
          <div className="lg:col-span-8 bg-gray-200 p-8 rounded-xl min-h-[600px] flex justify-center overflow-auto shadow-inner relative">
             <div className="absolute top-4 left-4 bg-gray-800 text-white px-3 py-1 rounded text-xs opacity-70">Live Preview (Scale fit)</div>
             
             {/* A4 Sheet Preview */}
             <div 
                className="bg-white shadow-2xl relative transition-all duration-300"
                style={{ 
                    width: `${PAGE_WIDTH}mm`, 
                    minHeight: `${PAGE_HEIGHT}mm`, // Visual only
                    padding: `${PAGE_PAD}mm`,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${layout.cols}, ${labelWidth}mm)`,
                    gridAutoRows: `${labelHeight}mm`,
                    gap: `${gap}mm`,
                    justifyContent: 'start', // Keep grid tight to left
                    alignContent: 'start'
                }}
             >
                {/* Render Labels */}
                {queue.map((item) => (
                    Array.from({ length: item.quantity }).map((_, idx) => (
                       <div key={`${item.id}-${idx}-prev`} className="w-full h-full overflow-hidden hover:ring-2 hover:ring-bkash-500 rounded-sm transition-all">
                          <BarcodeLabel item={item} />
                       </div>
                    ))
                ))}
                
                {/* Placeholder Grid to show capacity */}
                {queue.length === 0 && Array.from({ length: layout.itemsPerPage }).map((_, i) => (
                    <div key={`placeholder-${i}`} className="border border-dashed border-gray-200 rounded flex items-center justify-center text-gray-100 text-xs select-none">
                       Label {i+1}
                    </div>
                ))}
             </div>
          </div>

        </div>
      </div>

      {/* --- HIDDEN PRINT AREA (RENDERED FOR PDF/PRINT) --- */}
      {printMountNode && ReactDOM.createPortal(
        <div id="print-mount-content">
          {getPages().map((pageItems, pageIdx) => (
            <div 
                key={pageIdx} 
                className="print-page-container bg-white"
                style={{
                    width: `${PAGE_WIDTH}mm`,
                    height: `${PAGE_HEIGHT}mm`,
                    padding: `${PAGE_PAD}mm`,
                    margin: 0,
                    pageBreakAfter: 'always',
                    display: 'grid',
                    gridTemplateColumns: `repeat(${layout.cols}, ${labelWidth}mm)`,
                    gridAutoRows: `${labelHeight}mm`,
                    gap: `${gap}mm`,
                    alignContent: 'start',
                    boxSizing: 'border-box'
                }}
            >
              {pageItems.map((item, idx) => (
                 <div key={`${pageIdx}-${idx}`} className="w-full h-full overflow-hidden">
                    <BarcodeLabel item={item} />
                 </div>
              ))}
            </div>
          ))}
        </div>,
        printMountNode
      )}
    </div>
  );
};

export default BarcodeTools;