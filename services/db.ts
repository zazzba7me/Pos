
import { Invoice, Party, Product, TransactionType, BusinessInfo, PaymentStatus, StockTransaction, StockMovementType, CashTransaction, InvoicePayment } from '../types';

// Keys
const KEYS = {
  PRODUCTS: 'zazzba_products',
  PARTIES: 'zazzba_parties',
  INVOICES: 'zazzba_invoices',
  STOCK_HISTORY: 'zazzba_stock_history',
  BUSINESS_INFO: 'zazzba_business_info',
  CASHBOOK: 'zazzba_cashbook',
};

// Helpers
const get = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error('Storage Error', e);
    return defaultValue;
  }
};

const set = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Initialization
export const initializeDefaults = () => {
  const products = get<Product[]>(KEYS.PRODUCTS, []);
  if (products.length === 0) {
    const demos: Product[] = [
      { id: 'PROD-001', name: 'Original Display (iPhone 11)', sku: 'DISP-I11', category: 'Display', price: 4500, cost: 3200, stock: 15, unit: 'pc' },
      { id: 'PROD-002', name: 'Premium Battery (iPhone X)', sku: 'BATT-IX', category: 'Battery', price: 1800, cost: 1100, stock: 25, unit: 'pc' },
      { id: 'PROD-003', name: 'Fast Charger 20W', sku: 'CHRG-20W', category: 'Accessories', price: 950, cost: 450, stock: 50, unit: 'pc' }
    ];
    set(KEYS.PRODUCTS, demos);
  }

  const parties = get<Party[]>(KEYS.PARTIES, []);
  if (parties.length === 0) {
    set(KEYS.PARTIES, [
      { id: 'WALK_IN', name: 'Walk-in Customer', phone: '0000', type: 'CUSTOMER', balance: 0 }
    ]);
  }
};

export const getBusinessInfo = (): BusinessInfo => get(KEYS.BUSINESS_INFO, {
  name: 'Zazzba POS',
  address: 'Dhaka, Bangladesh',
  phone: '01700000000',
  email: 'info@zazzba.com',
  invoiceFooter: 'Thank you for choosing Zazzba. Quality guaranteed.'
});

export const saveBusinessInfo = (info: BusinessInfo) => set(KEYS.BUSINESS_INFO, info);
export const getProducts = (): Product[] => get(KEYS.PRODUCTS, []);

export const saveProduct = (product: Product) => {
  const products = getProducts();
  const index = products.findIndex(p => p.id === product.id);
  if (index >= 0) products[index] = product;
  else products.push(product);
  set(KEYS.PRODUCTS, products);
};

export const deleteProduct = (id: string) => {
  const products = getProducts().filter(p => p.id !== id);
  set(KEYS.PRODUCTS, products);
};

export const getParties = (): Party[] => get(KEYS.PARTIES, []);

// Fix: Added deleteParty which was used in Parties.tsx but not exported here
export const deleteParty = (id: string) => {
  const parties = getParties().filter(p => p.id !== id);
  set(KEYS.PARTIES, parties);
};

export const saveParty = (party: Party) => {
  const parties = getParties();
  const index = parties.findIndex(p => p.id === party.id);
  if (index >= 0) parties[index] = party;
  else parties.push(party);
  set(KEYS.PARTIES, parties);
};

export const getInvoices = (): Invoice[] => get(KEYS.INVOICES, []);
export const saveInvoice = (invoice: Invoice) => {
  const invoices = getInvoices();
  invoices.unshift(invoice);
  set(KEYS.INVOICES, invoices);

  // Update Stock
  const products = getProducts();
  invoice.items.forEach(item => {
    const p = products.find(prod => prod.id === item.productId);
    if (p) {
      if (invoice.type === TransactionType.SALE) p.stock -= item.quantity;
      if (invoice.type === TransactionType.PURCHASE) p.stock += item.quantity;
    }
  });
  set(KEYS.PRODUCTS, products);

  // Update Party Balance
  const parties = getParties();
  const party = parties.find(p => p.id === invoice.partyId);
  if (party) {
    if (invoice.type === TransactionType.SALE) party.balance += invoice.dueAmount;
    if (invoice.type === TransactionType.PURCHASE) party.balance -= invoice.dueAmount;
    set(KEYS.PARTIES, parties);
  }
};

export const deleteInvoice = (id: string) => {
  const invoices = getInvoices();
  const filtered = invoices.filter(inv => inv.id !== id);
  set(KEYS.INVOICES, filtered);
};

export const getCashTransactions = (): CashTransaction[] => get(KEYS.CASHBOOK, []);
export const saveCashTransaction = (trx: CashTransaction) => {
  const trxs = getCashTransactions();
  trxs.unshift(trx);
  set(KEYS.CASHBOOK, trxs);
};

export const deleteCashTransaction = (id: string) => {
  const trxs = getCashTransactions().filter(t => t.id !== id);
  set(KEYS.CASHBOOK, trxs);
};

export const getStockTransactions = (productId?: string): StockTransaction[] => [];
export const adjustStock = (pId: string, type: StockMovementType, qty: number, note: string) => {};
export const exportData = () => JSON.stringify(localStorage);
export const importData = (data: string) => {
  try {
    const parsed = JSON.parse(data);
    Object.keys(parsed).forEach(k => localStorage.setItem(k, parsed[k]));
    return true;
  } catch(e) { return false; }
};
