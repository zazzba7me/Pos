export enum TransactionType {
  SALE = 'SALE',
  PURCHASE = 'PURCHASE',
  SALE_RETURN = 'SALE_RETURN',
  PURCHASE_RETURN = 'PURCHASE_RETURN'
}

export enum PaymentStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL'
}

export enum StockMovementType {
  OPENING = 'OPENING',
  SALE = 'SALE',          // Out
  PURCHASE = 'PURCHASE',  // In
  RETURN_IN = 'RETURN_IN', // Customer returned item (In)
  RETURN_OUT = 'RETURN_OUT', // We returned to supplier (Out)
  DAMAGE = 'DAMAGE',      // Lost/Broken (Out)
  ADJUSTMENT = 'ADJUSTMENT', // Manual Correction (+/-)
  TRANSFER = 'TRANSFER'   // Stock Transfer (Out/In)
}

export interface StockTransaction {
  id: string;
  productId: string;
  date: string; // ISO String
  type: StockMovementType;
  quantity: number; // Positive for IN, Negative for OUT (usually)
  previousStock: number;
  newStock: number;
  note?: string; // Reason for adjustment
  referenceId?: string; // Invoice ID or other ref
}

export interface Product {
  id: string;
  name: string;
  sku?: string;         // Stock Keeping Unit
  category?: string;
  brand?: string;
  description?: string;
  barcode?: string;
  price: number; // Selling price
  cost: number;  // Purchase price
  stock: number; // Current Stock
  unit: string;
  
  // New Stock Details
  openingStock?: number;
  reorderLevel?: number; // Minimum stock before alert
  batchNumber?: string;
  expiryDate?: string;   // ISO date string
  
  // Pricing
  discount?: number; // Default flat discount
}

export interface Party {
  id: string;
  name: string;
  phone: string;
  email?: string;       // New: Contact Email
  address?: string;     // New: Physical Address
  referenceCode?: string; // New: Supplier Code / Customer ID
  type: 'CUSTOMER' | 'SUPPLIER';
  balance: number; // Positive = Receivable, Negative = Payable
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number; // New field for product-wise discount
  total: number;
}

export interface InvoicePayment {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

export interface Invoice {
  id: string;
  date: string;
  partyId: string;
  partyName: string; // Denormalized for ease
  type: TransactionType;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  receivedAmount: number;
  dueAmount: number;
  status: PaymentStatus;
  payments?: InvoicePayment[]; // History of payments
}

export interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  invoiceFooter?: string; // Custom footer text for invoice
}

export interface DashboardStats {
  totalSales: number;
  totalPurchases: number;
  totalReceivable: number;
  totalPayable: number;
  netProfit: number;
}

export interface CashTransaction {
  id: string;
  date: string; // ISO
  type: 'IN' | 'OUT';
  amount: number;
  category: string; // e.g., 'Expense', 'Salary', 'Sales', 'Purchase'
  description?: string;
  partyId?: string; // Optional link to party
  partyName?: string;
  linkedInvoiceId?: string; // New: ID of the invoice if auto-generated
}