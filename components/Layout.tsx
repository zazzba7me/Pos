import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Package, 
  Settings, 
  BookOpen,
  Barcode,
  MoreHorizontal,
  Plus
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const NavItem = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => (
    <button
      onClick={() => {
        onTabChange(id);
        setMobileMenuOpen(false);
      }}
      className={`w-full flex items-center space-x-3 px-5 py-4 rounded-3xl transition-all active:scale-95 ${
        activeTab === id 
          ? 'zazzba-gradient text-white shadow-xl shadow-bkash-500/30' 
          : 'text-slate-500 hover:bg-slate-50'
      }`}
    >
      <Icon size={20} strokeWidth={activeTab === id ? 3 : 2} />
      <span className="font-bold text-sm tracking-tight">{label}</span>
    </button>
  );

  const BottomTab = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => (
    <button
      onClick={() => onTabChange(id)}
      className={`flex flex-col items-center justify-center flex-1 py-2 transition-all active:scale-75 ${
        activeTab === id ? 'text-bkash-500' : 'text-slate-400'
      }`}
    >
      <div className={`p-1 rounded-xl mb-1 ${activeTab === id ? 'bg-bkash-50' : ''}`}>
        <Icon size={22} strokeWidth={activeTab === id ? 3 : 2} />
      </div>
      <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row no-print pb-24 md:pb-0 overflow-x-hidden">
      {/* Premium App Header (Mobile Only) */}
      <div className="md:hidden glass px-6 py-5 flex justify-between items-center sticky top-0 z-[40] border-b border-white/40">
        <div className="flex items-center gap-3">
          <div className="zazzba-gradient p-2 rounded-2xl shadow-lg">
            <Package size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black italic tracking-tighter text-slate-900 leading-none">Zazzba POS</h1>
            <p className="text-[8px] font-black text-bkash-500 uppercase tracking-[0.2em] mt-1">Smart Business</p>
          </div>
        </div>
        <button onClick={() => onTabChange('settings')} className="p-3 bg-slate-50 text-slate-400 rounded-2xl active:scale-90 transition-all">
          <Settings size={20} />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 transition duration-500 ease-in-out
        w-80 bg-white z-50 flex flex-col border-r border-slate-100/60
      `}>
        <div className="p-10 hidden md:block">
          <h1 className="text-3xl font-black text-bkash-500 italic tracking-tighter">Zazzba POS</h1>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mt-1">Enterprise Edition</p>
        </div>

        <nav className="flex-1 p-6 space-y-3">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem id="invoice" icon={ShoppingCart} label="Point of Sale" />
          <NavItem id="inventory" icon={Package} label="Inventory Hub" />
          <NavItem id="cashbook" icon={BookOpen} label="Accounts & Cash" />
          <NavItem id="parties" icon={Users} label="Parties Ledger" />
          <NavItem id="barcodes" icon={Barcode} label="Barcode Studio" />
          <NavItem id="settings" icon={Settings} label="App Settings" />
        </nav>

        <div className="p-8">
           <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100 flex items-center gap-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/20"></div>
              <div>
                <p className="text-[10px] text-slate-900 font-black uppercase tracking-widest">Local Mode</p>
                <p className="text-[9px] text-slate-400 font-bold">Secure Storage Active</p>
              </div>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:overflow-y-auto p-4 md:p-12 lg:p-16">
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
          {children}
        </div>
      </main>

      {/* Premium Glass Bottom Navigation */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 glass border border-white/60 rounded-[32px] flex items-center justify-around px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-50 animate-in slide-in-from-bottom-10 duration-1000">
        <BottomTab id="dashboard" icon={LayoutDashboard} label="Home" />
        <BottomTab id="invoice" icon={ShoppingCart} label="POS" />
        <div className="relative -top-1">
          <button 
            onClick={() => onTabChange('inventory')}
            className="zazzba-gradient p-4 rounded-full text-white shadow-xl shadow-bkash-500/40 active:scale-75 transition-all"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
        <BottomTab id="cashbook" icon={BookOpen} label="Cash" />
        <button onClick={() => setMobileMenuOpen(true)} className="flex flex-col items-center justify-center flex-1 py-2 text-slate-400 active:scale-75">
           <div className="p-1 rounded-xl mb-1">
             <MoreHorizontal size={22} />
           </div>
           <span className="text-[10px] font-black uppercase tracking-tighter">More</span>
        </button>
      </div>
      
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] md:hidden animate-in fade-in duration-500"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;