import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import InvoiceGenerator from './components/InvoiceGenerator';
import Inventory from './components/Inventory';
import Parties from './components/Parties';
import Settings from './components/Settings';
import Cashbook from './components/Cashbook';
import BarcodeTools from './components/BarcodeTools';
import PrintTemplate from './components/PrintTemplate';
import { Invoice } from './types';
import { initializeDefaults } from './services/db';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    // Initialize default data (Walk-in Customer, Demo Products) if DB is empty
    initializeDefaults();
  }, []);

  const handlePrintPreview = (inv: Invoice) => {
    // Just set the invoice, the PrintTemplate component will handle the window.print() call on mount
    setPrintInvoice(inv);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'invoice': return <InvoiceGenerator onPreview={handlePrintPreview} />;
      case 'inventory': return <Inventory />;
      case 'barcodes': return <BarcodeTools />;
      case 'parties': return <Parties />;
      case 'settings': return <Settings />;
      case 'cashbook': return <Cashbook />;
      default: return <Dashboard />;
    }
  };

  // Logic to mount the Print Template into the separate #print-mount div
  const printMountNode = document.getElementById('print-mount');

  return (
    <>
      <div className="no-print">
        <Layout activeTab={activeTab} onTabChange={setActiveTab}>
          {renderContent()}
        </Layout>
      </div>
      
      {/* 
        Render the Print Template into the #print-mount div outside the root.
        This ensures CSS isolation and better print behavior.
      */}
      {printInvoice && printMountNode && ReactDOM.createPortal(
        <PrintTemplate 
          invoice={printInvoice} 
          onClose={() => setPrintInvoice(null)} 
        />,
        printMountNode
      )}
    </>
  );
};

export default App;