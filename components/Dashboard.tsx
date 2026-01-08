import React, { useMemo } from 'react';
import { getInvoices, getParties } from '../services/db';
import { TransactionType } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Sparkles, PieChart, ArrowUpRight } from 'lucide-react';

const Dashboard: React.FC = () => {
  const invoices = getInvoices();
  const parties = getParties();

  const stats = useMemo(() => {
    let sales = 0;
    let purchases = 0;
    let saleReturns = 0;
    let purchaseReturns = 0;
    let receivable = 0;
    let payable = 0;

    invoices.forEach(inv => {
      if (inv.type === TransactionType.SALE) {
        sales += inv.totalAmount;
      } else if (inv.type === TransactionType.PURCHASE) {
        purchases += inv.totalAmount;
      } else if (inv.type === TransactionType.SALE_RETURN) {
        saleReturns += inv.totalAmount;
      } else if (inv.type === TransactionType.PURCHASE_RETURN) {
        purchaseReturns += inv.totalAmount;
      }
    });

    parties.forEach(p => {
      if (p.balance > 0) receivable += p.balance;
      if (p.balance < 0) payable += Math.abs(p.balance);
    });

    const netSales = sales - saleReturns;
    const netPurchases = purchases - purchaseReturns;

    return { 
      sales: netSales, 
      purchases: netPurchases, 
      receivable, 
      payable, 
      profit: netSales - netPurchases 
    };
  }, [invoices, parties]);

  const chartData = [
    { name: 'Total Sales', amount: stats.sales, color: '#e2136e' },
    { name: 'Purchase', amount: stats.purchases, color: '#1e293b' },
    { name: 'Net Profit', amount: stats.profit, color: '#10b981' },
  ];

  const StatCard = ({ title, value, icon: Icon, colorClass, gradient }: any) => (
    <div className={`p-6 md:p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col justify-between mobile-card bg-white card-shadow overflow-hidden relative group`}>
      <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000">
        <Icon size={120} />
      </div>
      <div className={`p-4 rounded-2xl w-fit ${colorClass} mb-4`}>
        <Icon size={24} />
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
        <div className="flex items-end justify-between">
          <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">৳{value.toLocaleString()}</h3>
          <div className="bg-slate-50 p-2 rounded-xl">
             <ArrowUpRight size={14} className="text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="zazzba-gradient p-3 rounded-2xl shadow-xl shadow-bkash-500/30">
            <Sparkles className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter">Business Overview</h2>
            <p className="text-[10px] font-black text-bkash-500 uppercase tracking-[0.3em] mt-1">Zazzba Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-3xl border border-slate-100 shadow-sm">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Period:</span>
           <span className="text-xs font-black text-slate-900 uppercase">Lifetime</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Gross Sales" 
          value={stats.sales} 
          icon={TrendingUp} 
          colorClass="bg-bkash-50 text-bkash-500" 
        />
        <StatCard 
          title="Inventory Cost" 
          value={stats.purchases} 
          icon={TrendingDown} 
          colorClass="bg-slate-50 text-slate-900" 
        />
        <StatCard 
          title="Receivables" 
          value={stats.receivable} 
          icon={DollarSign} 
          colorClass="bg-emerald-50 text-emerald-600" 
        />
        <StatCard 
          title="Total Payable" 
          value={stats.payable} 
          icon={Wallet} 
          colorClass="bg-amber-50 text-amber-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 md:p-12 rounded-[56px] shadow-sm border border-slate-50 card-shadow">
          <div className="flex justify-between items-center mb-10">
             <div className="flex items-center gap-3">
               <div className="bg-bkash-500 w-2 h-8 rounded-full"></div>
               <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tight">Performance Matrix</h3>
             </div>
             <div className="bg-slate-50 text-slate-400 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest">Analytics</div>
          </div>
          <div className="h-72 md:h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 800, fill: '#cbd5e1'}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 800, fill: '#cbd5e1'}} 
                />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}} 
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: '900', padding: '15px'}}
                />
                <Bar dataKey="amount" radius={[18, 18, 18, 18]} barSize={45}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[56px] shadow-sm border border-slate-50 card-shadow flex flex-col items-center justify-center text-center space-y-6">
           <div className="w-48 h-48 rounded-full border-[16px] border-slate-50 flex items-center justify-center relative">
              <div className="absolute inset-0 border-[16px] border-bkash-500 rounded-full" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 0 70%)' }}></div>
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Margin</p>
                <h4 className="text-4xl font-black text-slate-900 tracking-tighter">70%</h4>
              </div>
           </div>
           <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 italic uppercase tracking-tight">Financial Health</h3>
              <p className="text-xs text-slate-400 font-bold max-w-[200px] leading-relaxed">Your business shows positive growth patterns this month.</p>
           </div>
           <button className="w-full py-5 bg-slate-900 text-white rounded-[28px] font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
             <PieChart size={18} /> Detailed Report
           </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;