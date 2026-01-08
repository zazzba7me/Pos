import React, { useEffect, useState } from 'react';
import { Invoice, TransactionType } from '../types';
import { getBusinessInfo, getParties } from '../services/db';
import { Phone, Mail, MapPin, X, Printer, FileDown, Loader, Globe } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface Props {
  invoice: Invoice | null;
  onClose: () => void;
}

const PrintTemplate: React.FC<Props> = ({ invoice, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Auto-trigger print logic if needed
    if (invoice) {
      // setTimeout(() => window.print(), 500);
    }
  }, [invoice]);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-print-area');
    if (!element || !invoice) return;

    setIsGenerating(true);

    try {
      // Use Scale 4 for high definition text
      const canvas = await html2canvas(element, {
        scale: 4, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98); // High quality JPEG
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Simple multi-page support if invoice is extremely long
      while (heightLeft > 0) {
        position = heightLeft - imgHeight; 
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, -pdfHeight, imgWidth, imgHeight); 
        heightLeft -= pdfHeight;
      }

      pdf.save(`Invoice-${invoice.id}.pdf`);

    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('Failed to generate PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!invoice) return null;

  const bizInfo = getBusinessInfo();
  const parties = getParties();
  const party = parties.find(p => p.id === invoice.partyId);

  const getTitle = () => {
     switch(invoice.type) {
         case TransactionType.SALE: return 'INVOICE';
         case TransactionType.PURCHASE: return 'PURCHASE ORDER';
         case TransactionType.SALE_RETURN: return 'CREDIT NOTE';
         case TransactionType.PURCHASE_RETURN: return 'DEBIT NOTE';
         default: return 'INVOICE';
     }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-gray-900/90 overflow-y-auto flex justify-center print:bg-white print:inset-auto print:static print:block backdrop-blur-sm">
      
      {/* Controls (Hidden when printing) */}
      <div className="fixed top-6 right-6 flex flex-col md:flex-row gap-3 no-print z-50">
        <button 
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="bg-white hover:bg-gray-50 text-gray-800 px-5 py-2.5 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-all hover:-translate-y-1 disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {isGenerating ? <Loader size={18} className="animate-spin text-bkash-600"/> : <FileDown size={18} className="text-bkash-600" />}
          <span>Download PDF</span>
        </button>
        <button 
          onClick={() => window.print()}
          className="bg-bkash-600 hover:bg-bkash-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-all hover:-translate-y-1"
        >
          <Printer size={18} /> Print
        </button>
        <button 
          onClick={onClose}
          className="bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 px-5 py-2.5 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-all hover:-translate-y-1"
        >
          <X size={18} /> Close
        </button>
      </div>

      {/* Invoice Paper A4 */}
      <div 
        id="invoice-print-area"
        className="bg-white w-[210mm] min-h-[297mm] mx-auto my-8 print:my-0 shadow-2xl print:shadow-none relative flex flex-col overflow-hidden box-border"
      >
        {/* Top Branding Strip */}
        <div className="h-4 w-full bg-gray-900"></div>

        {/* Content Container */}
        <div className="p-12 flex-grow flex flex-col relative z-10">
            
            {/* Header Section */}
            <div className="flex justify-between items-start mb-12 pb-8 border-b border-gray-200">
               {/* Company Info */}
               <div className="space-y-2 max-w-[50%]">
                  <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none">{bizInfo.name}</h1>
                  <div className="text-sm text-gray-600 space-y-1 pt-2">
                     <p className="flex items-start gap-2">
                       <MapPin size={16} className="shrink-0 mt-0.5 text-gray-400"/>
                       <span className="whitespace-pre-wrap">{bizInfo.address}</span>
                     </p>
                     <p className="flex items-center gap-2">
                       <Phone size={16} className="shrink-0 text-gray-400"/>
                       <span>{bizInfo.phone}</span>
                     </p>
                     {bizInfo.email && (
                       <p className="flex items-center gap-2">
                         <Mail size={16} className="shrink-0 text-gray-400"/>
                         <span>{bizInfo.email}</span>
                       </p>
                     )}
                  </div>
               </div>

               {/* Invoice Info */}
               <div className="text-right">
                  <h2 className="text-3xl font-bold text-gray-800 uppercase tracking-wide text-bkash-600 mb-2">{getTitle()}</h2>
                  <div className="text-right space-y-1">
                      <p className="text-gray-500 font-medium text-sm uppercase tracking-wider">Invoice #</p>
                      <p className="text-xl font-bold text-gray-900">{invoice.id.split('-')[1]}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-4 text-right">
                      <div>
                        <p className="text-xs text-gray-400 uppercase font-bold">Date Issued</p>
                        <p className="text-sm font-bold text-gray-800">{new Date(invoice.date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase font-bold">Due Date</p>
                        <p className="text-sm font-bold text-gray-800">{new Date(invoice.date).toLocaleDateString()}</p>
                      </div>
                  </div>
               </div>
            </div>

            {/* Bill To Section */}
            <div className="mb-10">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Bill To</h3>
               <div className="text-gray-800">
                  <p className="font-bold text-xl">{invoice.partyName}</p>
                  {party && (
                    <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                       {party.address && <p>{party.address}</p>}
                       {party.phone && <p>Tel: {party.phone}</p>}
                       {party.email && <p>Email: {party.email}</p>}
                    </div>
                  )}
                  {!party && <p className="text-sm text-gray-500 italic">Walk-in Customer</p>}
               </div>
            </div>

            {/* Table */}
            <div className="flex-grow mb-8">
               <table className="w-full table-fixed border-collapse">
                  <thead>
                     <tr className="bg-gray-100 border-b border-gray-200">
                        <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-[40%]">Description</th>
                        <th className="py-3 px-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider w-[15%]">Rate</th>
                        <th className="py-3 px-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider w-[10%]">Qty</th>
                        <th className="py-3 px-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider w-[15%]">Disc.</th>
                        <th className="py-3 px-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider w-[20%]">Amount</th>
                     </tr>
                  </thead>
                  <tbody className="text-sm">
                     {invoice.items.map((item, i) => (
                        <tr key={i} className="border-b border-gray-100">
                           <td className="py-3 px-4 text-gray-800 font-medium align-top break-words">
                              {item.productName}
                              {/* Optional: Add SKU if needed */}
                           </td>
                           <td className="py-3 px-4 text-right text-gray-600 align-top">${item.price.toFixed(2)}</td>
                           <td className="py-3 px-4 text-right text-gray-600 align-top">{item.quantity}</td>
                           <td className="py-3 px-4 text-right text-red-500 align-top">{item.discount > 0 ? `-${item.discount}` : '-'}</td>
                           <td className="py-3 px-4 text-right font-bold text-gray-900 align-top">${item.total.toFixed(2)}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end mb-16 break-inside-avoid">
               <div className="w-5/12 space-y-3">
                  <div className="flex justify-between text-gray-600 text-sm">
                     <span className="font-medium">Subtotal</span>
                     <span>${invoice.subtotal.toFixed(2)}</span>
                  </div>
                  {invoice.discount > 0 && (
                     <div className="flex justify-between text-red-500 text-sm">
                        <span className="font-medium">Discount</span>
                        <span>-${invoice.discount.toFixed(2)}</span>
                     </div>
                  )}
                  
                  <div className="my-2 border-t border-gray-200"></div>

                  <div className="flex justify-between text-gray-900 text-xl font-bold items-center">
                     <span>Total</span>
                     <span>${invoice.totalAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="pt-2 space-y-1">
                     <div className="flex justify-between text-green-700 text-sm font-bold">
                        <span>Paid</span>
                        <span>${invoice.receivedAmount.toFixed(2)}</span>
                     </div>
                     {invoice.dueAmount > 0 && (
                        <div className="flex justify-between text-red-600 text-sm font-bold">
                           <span>Balance Due</span>
                           <span>${invoice.dueAmount.toFixed(2)}</span>
                        </div>
                     )}
                  </div>
                  
                  {invoice.dueAmount === 0 && (
                      <div className="mt-4 text-right">
                          <span className="inline-block px-4 py-1 border-2 border-green-600 text-green-700 font-bold uppercase tracking-widest text-xs rounded opacity-80 transform -rotate-2">
                              PAID IN FULL
                          </span>
                      </div>
                  )}
               </div>
            </div>

            {/* Footer / Terms */}
            <div className="mt-auto break-inside-avoid">
               <div className="grid grid-cols-2 gap-8 items-end pb-8">
                  {/* Terms Text */}
                  <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Terms & Notes</h4>
                      <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap">
                          {bizInfo.invoiceFooter || 'Thank you for your business.'}
                      </p>
                  </div>
                  
                  {/* Signature */}
                  <div className="text-right">
                     <div className="inline-block text-center">
                        <div className="w-48 border-b border-gray-300 mb-2"></div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Authorized Signature</p>
                     </div>
                  </div>
               </div>
            </div>

        </div>

        {/* Bottom Stripe */}
        <div className="h-2 w-full bg-bkash-600"></div>
      </div>
    </div>
  );
};

export default PrintTemplate;