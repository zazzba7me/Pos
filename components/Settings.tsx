import React, { useState, useEffect } from 'react';
import { exportData, importData, getBusinessInfo, saveBusinessInfo } from '../services/db';
import { BusinessInfo } from '../types';
import { Download, Upload, Cloud, Building2, Save, FileText } from 'lucide-react';

const Settings: React.FC = () => {
  const [bizInfo, setBizInfo] = useState<BusinessInfo>({
    name: '',
    address: '',
    phone: '',
    email: '',
    invoiceFooter: ''
  });

  useEffect(() => {
    setBizInfo(getBusinessInfo());
  }, []);

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    saveBusinessInfo(bizInfo);
    alert('Business information saved successfully!');
  };

  const handleBackup = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zazzba_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importData(content);
      if (success) {
        alert('Data restored successfully! The app will reload.');
        window.location.reload();
      } else {
        alert('Invalid backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 pb-10">
      <h2 className="text-2xl font-bold text-gray-800">Settings & Configuration</h2>
      
      {/* Business Information Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-bkash-50 text-bkash-600 rounded-full">
            <Building2 size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Business Profile</h3>
            <p className="text-sm text-gray-500">This information will appear on your printed invoices.</p>
          </div>
        </div>

        <form onSubmit={handleSaveInfo} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <input 
              type="text" 
              required
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-bkash-500 focus:border-bkash-500"
              value={bizInfo.name}
              onChange={(e) => setBizInfo({...bizInfo, name: e.target.value})}
              placeholder="e.g. Zazzba Enterprise"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-bkash-500 focus:border-bkash-500"
              value={bizInfo.address}
              onChange={(e) => setBizInfo({...bizInfo, address: e.target.value})}
              placeholder="Shop #12, Market Name, City"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-bkash-500 focus:border-bkash-500"
              value={bizInfo.phone}
              onChange={(e) => setBizInfo({...bizInfo, phone: e.target.value})}
              placeholder="01XXXXXXXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email / Website</label>
            <input 
              type="text" 
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-bkash-500 focus:border-bkash-500"
              value={bizInfo.email}
              onChange={(e) => setBizInfo({...bizInfo, email: e.target.value})}
              placeholder="info@business.com"
            />
          </div>

          {/* Invoice Customization */}
          <div className="md:col-span-2 pt-4 border-t border-gray-100">
             <div className="flex items-center space-x-2 mb-4">
               <FileText size={18} className="text-gray-400"/>
               <h4 className="font-bold text-gray-700 text-sm">Invoice Footer / Terms</h4>
             </div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions / Footer Note</label>
             <textarea 
               rows={4}
               className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-bkash-500 focus:border-bkash-500 text-sm"
               value={bizInfo.invoiceFooter || ''}
               onChange={(e) => setBizInfo({...bizInfo, invoiceFooter: e.target.value})}
               placeholder="Thank you for your business..."
             />
             <p className="text-xs text-gray-400 mt-1">This text will appear at the bottom of every invoice PDF/Print.</p>
          </div>

          <div className="md:col-span-2 flex justify-end mt-2">
            <button 
              type="submit" 
              className="bg-bkash-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-bkash-600 transition-colors flex items-center space-x-2"
            >
              <Save size={18} />
              <span>Save Information</span>
            </button>
          </div>
        </form>
      </div>

      {/* Backup Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-bkash-50 text-bkash-600 rounded-full">
            <Cloud size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Data Management</h3>
            <p className="text-sm text-gray-500">Backup your data to a file or restore from a previous backup.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            onClick={handleBackup}
            className="flex items-center justify-center space-x-3 p-6 border-2 border-dashed border-bkash-200 rounded-xl hover:bg-bkash-50 transition-colors group"
          >
            <Download className="text-bkash-500 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <span className="block font-bold text-gray-700">Backup Data</span>
              <span className="text-xs text-gray-500">Download JSON file</span>
            </div>
          </button>

          <label className="flex items-center justify-center space-x-3 p-6 border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
            <Upload className="text-gray-500 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <span className="block font-bold text-gray-700">Restore Data</span>
              <span className="text-xs text-gray-500">Upload JSON file</span>
            </div>
            <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};

export default Settings;