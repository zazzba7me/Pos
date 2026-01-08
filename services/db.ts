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
  let isFreshInstall = false;

  // 1. Default Customer & Supplier
  const parties = get<Party[]>(KEYS.PARTIES, []);
  if (parties.length === 0) {
    const defaultParty: Party = {
      id: 'WALK_IN',
      name: 'Walk-in Customer',
      phone: '',
      type: 'CUSTOMER',
      balance: 0
    };
    
    const demoSupplier: Party = {
      id: 'SUP-001',
      name: 'Bengal Wholesalers',
      phone: '01711223344',
      email: 'orders@bengal.com',
      address: '123 Kawran Bazar, Dhaka',
      referenceCode: 'VEND-99',
      type: 'SUPPLIER',
      balance: -5000 // We owe them money
    };

    parties.push(defaultParty, demoSupplier);
    set(KEYS.PARTIES, parties);
    isFreshInstall = true;
  }

  // 2. Demo Products
  const products = get<Product[]>(KEYS.PRODUCTS, []);
  if (products.length === 0) {
    const demos: Product[] = [
      { 
        id: 'PROD-001', 
        name: 'Premium Rice (5kg)', 
        sku: 'RICE-001',
        category: 'Grocery',
        brand: 'Chashi',
        description: 'Premium quality miniket rice',
        barcode: '8901234567890',
        price: 450, 
        cost: 380, 
        stock: 50, 
        unit: 'bag',
        reorderLevel: 10,
        batchNumber: 'BATCH-2023-A',
        openingStock: 50,
        discount: 0
      },
      { 
        id: 'PROD-002', 
        name: 'Soybean Oil (1L)', 
        sku: 'OIL-1L',
        category: 'Grocery',
        brand: 'Rupchanda',
        description: 'Fresh soybean oil',
        barcode: '8901234567891',
        price: 190, 
        cost: 170, 
        stock: 100, 
        unit: 'bottle',
        reorderLevel: 20,
        expiryDate: new Date(Date.now() + 15552000000).toISOString(), // ~6 months from now
        discount: 5
      },
      { 
        id: 'PROD-003', 
        name: 'Detergent Powder (500g)', 
        sku: 'DET-500',
        category: 'Cleaning',
        brand: 'Wheel',
        description: 'Lemon fresh detergent',
        barcode: '8901234567892',
        price: 85, 
        cost: 70, 
        stock: 8, // Low stock demo
        unit: 'pack',
        reorderLevel: 15,
        discount: 0
      },
      { 
        id: 'PROD-004', 
        name: 'Mineral Water (500ml)', 
        sku: 'H2O-500',
        category: 'Beverage',
        brand: 'Mum',
        description: 'Purified drinking water',
        barcode: '8901234567893',
        price: 20, 
        cost: 12, 
        stock: 500, 
        unit: 'bottle',
        reorderLevel: 50,
        discount: 0
      },
      { 
        id: 'PROD-005', 
        name: 'Milk (1L)', 
        sku: 'MILK-1L',
        category: 'Dairy',
        brand: 'Milk Vita',
        description: 'Full cream liquid milk',
        barcode: '8901234567894',
        price: 90, 
        cost: 80, 
        stock: 30, 
        unit: 'pack',
        expiryDate: new Date(Date.now() + 259200000).toISOString(), // ~3 days from now
        reorderLevel: 10,
        discount: 2
      }
    ];
    set(KEYS.PRODUCTS, demos);
    
    // Add Opening Stock History for Demos
    const history: StockTransaction[] = demos.map(p => ({
      id: `HIST-${Date.now()}-${p.id}`,
      productId: p.id,
      date: new Date().toISOString(),
      type: StockMovementType.OPENING,
      quantity: p.stock,
      previousStock: 0,
      newStock: p.stock,
      note: 'Initial Demo Stock'
    }));
    set(KEYS.STOCK_HISTORY, history);
    
    isFreshInstall = true;
  }

  // 3. Demo Invoices
  const invoices = get<Invoice[]>(KEYS.INVOICES, []);
  if (invoices.length === 0 && isFreshInstall) {
    // ... demo invoices logic could be here, but skipping for brevity
  }
};

// Business Info
export const getBusinessInfo = (): BusinessInfo => get(KEYS.BUSINESS_INFO, {
  name: 'Zazzba POS',
  address: 'Dhaka, Bangladesh',
  phone: '01700000000',
  email: 'info@zazzba.com',
  invoiceFooter: 'Thank you for your business. Payment is expected upon receipt.\nGoods sold are not returnable after 7 days.'
});

export const saveBusinessInfo = (info: BusinessInfo) => set(KEYS.BUSINESS_INFO, info);

// Products
export const getProducts = (): Product[] => get(KEYS.PRODUCTS, []);

export const saveProduct = (product: Product) => {
  const products = getProducts();
  const index = products.findIndex(p => p.id === product.id);
  
  // If new product with stock, log opening stock
  if (index === -1 && product.stock > 0) {
      logStockTransaction({
        id: `HIST-${Date.now()}`,
        productId: product.id,
        date: new Date().toISOString(),
        type: StockMovementType.OPENING,
        quantity: product.stock,
        previousStock: 0,
        newStock: product.stock,
        note: 'Opening Stock'
      });
  }
  
  if (index >= 0) {
    products[index] = product;
  } else {
    products.push(product);
  }
  set(KEYS.PRODUCTS, products);
};

export const deleteProduct = (id: string) => {
  const products = getProducts().filter(p => p.id !== id);
  set(KEYS.PRODUCTS, products);
};

// Stock Transactions
export const getStockTransactions = (productId?: string): StockTransaction[] => {
  const all = get<StockTransaction[]>(KEYS.STOCK_HISTORY, []);
  if (productId) {
    return all.filter(t => t.productId === productId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const logStockTransaction = (transaction: StockTransaction) => {
  const history = get<StockTransaction[]>(KEYS.STOCK_HISTORY, []);
  history.push(transaction);
  set(KEYS.STOCK_HISTORY, history);
};

export const adjustStock = (productId: string, type: StockMovementType, quantity: number, note: string) => {
  const products = getProducts();
  const productIndex = products.findIndex(p => p.id === productId);
  if (productIndex === -1) return;

  const product = products[productIndex];
  const oldStock = product.stock;
  let newStock = oldStock;

  // Logic for adding or removing
  if (type === StockMovementType.PURCHASE || type === StockMovementType.RETURN_IN || type === StockMovementType.ADJUSTMENT) {
    newStock = oldStock + quantity;
  } else {
    newStock = oldStock - quantity;
  }

  product.stock = newStock;
  products[productIndex] = product;
  set(KEYS.PRODUCTS, products);

  logStockTransaction({
    id: `HIST-${Date.now()}`,
    productId: productId,
    date: new Date().toISOString(),
    type: type,
    quantity: type === StockMovementType.SALE || type === StockMovementType.DAMAGE || type === StockMovementType.RETURN_OUT || type === StockMovementType.TRANSFER ? -quantity : quantity,
    previousStock: oldStock,
    newStock: newStock,
    note: note
  });
};

// Parties
export const getParties = (): Party[] => get(KEYS.PARTIES, []);
export const saveParty = (party: Party) => {
  const parties = getParties();
  const index = parties.findIndex(p => p.id === party.id);
  if (index >= 0) {
    parties[index] = party;
  } else {
    parties.push(party);
  }
  set(KEYS.PARTIES, parties);
};

export const deleteParty = (id: string) => {
  const parties = getParties().filter(p => p.id !== id);
  set(KEYS.PARTIES, parties);
};

// Cashbook
export const getCashTransactions = (): CashTransaction[] => get(KEYS.CASHBOOK, []);

export const saveCashTransaction = (trx: CashTransaction) => {
  const transactions = getCashTransactions();
  // Check if updating existing
  const existingIndex = transactions.findIndex(t => t.id === trx.id);
  
  if (existingIndex >= 0) {
    // We are updating, so we need to revert previous balance effect first
    const oldTrx = transactions[existingIndex];
    if (oldTrx.partyId) {
        // Revert OLD effect
        const parties = getParties();
        const pIndex = parties.findIndex(p => p.id === oldTrx.partyId);
        if (pIndex !== -1) {
            if (oldTrx.type === 'IN') parties[pIndex].balance += oldTrx.amount;
            else parties[pIndex].balance -= oldTrx.amount;
            set(KEYS.PARTIES, parties);
        }
    }
    transactions[existingIndex] = trx;
  } else {
    transactions.unshift(trx);
  }
  
  set(KEYS.CASHBOOK, transactions);

  // Apply NEW Party Balance effect
  if (trx.partyId) {
    const parties = getParties();
    const pIndex = parties.findIndex(p => p.id === trx.partyId);
    if (pIndex !== -1) {
      const party = parties[pIndex];
      // Logic: Cash IN reduces the debt (Receivable), Cash OUT increases Receivable (or reduces Payable)
      if (trx.type === 'IN') {
        party.balance -= trx.amount;
      } else {
        party.balance += trx.amount;
      }
      parties[pIndex] = party;
      set(KEYS.PARTIES, parties);
    }
  }
};

export const deleteCashTransaction = (id: string) => {
  const transactions = getCashTransactions();
  const trx = transactions.find(t => t.id === id);
  if (!trx) return;

  // Revert Party Balance
  if (trx.partyId) {
    const parties = getParties();
    const pIndex = parties.findIndex(p => p.id === trx.partyId);
    if (pIndex !== -1) {
      const party = parties[pIndex];
      if (trx.type === 'IN') {
        party.balance += trx.amount; // Revert IN (Add back to balance)
      } else {
        party.balance -= trx.amount; // Revert OUT (Subtract from balance)
      }
      parties[pIndex] = party;
      set(KEYS.PARTIES, parties);
    }
  }

  const newTransactions = transactions.filter(t => t.id !== id);
  set(KEYS.CASHBOOK, newTransactions);
};

// Invoices
export const getInvoices = (): Invoice[] => get(KEYS.INVOICES, []);

export const saveInvoice = (invoice: Invoice) => {
  const invoices = getInvoices();
  invoices.unshift(invoice); // Add to top
  
  const products = getProducts();
  const parties = getParties();

  // Initialize Payment History if not present but amount received
  if (invoice.receivedAmount > 0 && (!invoice.payments || invoice.payments.length === 0)) {
     invoice.payments = [{
         id: `PAY-INIT-${invoice.id}`,
         date: invoice.date,
         amount: invoice.receivedAmount,
         note: 'Initial Payment'
     }];
  } else if (!invoice.payments) {
     invoice.payments = [];
  }

  set(KEYS.INVOICES, invoices);

  // Apply Effects & Log History
  applyInvoiceEffects(invoice, products, parties);

  // Auto-create Cashbook Entry for initial payment/refund
  if (invoice.receivedAmount > 0) {
    let cashType: 'IN' | 'OUT' = 'IN';
    let category = 'Sales';
    let desc = `Invoice #${invoice.id.split('-')[1]} Payment`;

    if (invoice.type === TransactionType.SALE) {
       cashType = 'IN';
       category = 'Sales';
    } else if (invoice.type === TransactionType.PURCHASE) {
       cashType = 'OUT';
       category = 'Purchase';
    } else if (invoice.type === TransactionType.SALE_RETURN) {
       cashType = 'OUT'; // We pay customer back
       category = 'Refund';
       desc = `Refund: Inv #${invoice.id.split('-')[1]}`;
    } else if (invoice.type === TransactionType.PURCHASE_RETURN) {
       cashType = 'IN'; // Supplier pays us back
       category = 'Refund';
       desc = `Refund: Inv #${invoice.id.split('-')[1]}`;
    }

    // Save with linkedInvoiceId
    // Note: Use a specific ID for the *initial* payment to allow multiple payments later
    saveCashTransaction({
      id: `CASH-INV-${invoice.id}`, 
      date: invoice.date,
      type: cashType,
      amount: invoice.receivedAmount,
      category: category,
      description: desc,
      partyId: invoice.partyId,
      partyName: invoice.partyName,
      linkedInvoiceId: invoice.id 
    });
  }

  set(KEYS.PRODUCTS, products);
  set(KEYS.PARTIES, parties);
};

// New: Add a partial payment to an invoice
export const addInvoicePayment = (invoiceId: string, amount: number, date: string, note: string) => {
    const invoices = getInvoices();
    const invoiceIndex = invoices.findIndex(i => i.id === invoiceId);
    if (invoiceIndex === -1) return;

    const invoice = invoices[invoiceIndex];
    
    // Create new payment record
    const paymentId = `PAY-${Date.now()}`;
    const newPayment: InvoicePayment = {
        id: paymentId,
        date: date,
        amount: amount,
        note: note
    };

    if (!invoice.payments) invoice.payments = [];
    invoice.payments.push(newPayment);

    // Update Totals
    invoice.receivedAmount += amount;
    invoice.dueAmount = Math.max(0, invoice.totalAmount - invoice.receivedAmount);
    if (invoice.dueAmount === 0) invoice.status = PaymentStatus.PAID;
    else invoice.status = PaymentStatus.PARTIAL;

    invoices[invoiceIndex] = invoice;
    set(KEYS.INVOICES, invoices);

    // Create Cash Transaction for this specific payment
    let cashType: 'IN' | 'OUT' = 'IN';
    let category = 'Sales';
    
    if (invoice.type === TransactionType.SALE) { cashType = 'IN'; category = 'Sales'; }
    else if (invoice.type === TransactionType.PURCHASE) { cashType = 'OUT'; category = 'Purchase'; }
    else if (invoice.type === TransactionType.SALE_RETURN) { cashType = 'OUT'; category = 'Refund'; }
    else if (invoice.type === TransactionType.PURCHASE_RETURN) { cashType = 'IN'; category = 'Refund'; }

    saveCashTransaction({
        id: `CASH-${paymentId}`, // Unique ID for this partial payment
        date: date,
        type: cashType,
        amount: amount,
        category: category,
        description: `Inv #${invoice.id.split('-')[1]} - ${note || 'Partial Payment'}`,
        partyId: invoice.partyId,
        partyName: invoice.partyName,
        linkedInvoiceId: invoice.id
    });
};

export const updateInvoice = (updatedInvoice: Invoice) => {
  const invoices = getInvoices();
  const index = invoices.findIndex(i => i.id === updatedInvoice.id);
  if (index === -1) return;

  const oldInvoice = invoices[index];
  const products = getProducts();
  const parties = getParties();

  // Revert Old Effects
  revertInvoiceEffects(oldInvoice, products, parties);

  // Apply New Effects
  applyInvoiceEffects(updatedInvoice, products, parties);
  
  // Sync Cashbook: 
  // If the invoice has multiple payments history, we DO NOT flatten it into one. 
  // We assume the Edit form only modified the invoice details or the initial payment.
  // For simplicity in this offline app, if payments array > 1, we warn user or just don't sync cash automatically to avoid destroying history.
  // However, `saveInvoice` logic (which this mimics) creates `CASH-INV-${id}`.
  
  // Logic: 
  // 1. If only 1 payment exists (initial), update `CASH-INV-${id}`.
  // 2. If multiple payments exist, do NOT update cashbook here automatically unless we implement full reconciliation.
  //    We will rely on `addInvoicePayment` for new payments.
  
  const hasMultiplePayments = updatedInvoice.payments && updatedInvoice.payments.length > 1;
  const cashTrxId = `CASH-INV-${updatedInvoice.id}`;
  const cashTransactions = getCashTransactions();
  const existingCashTrx = cashTransactions.find(t => t.id === cashTrxId);

  if (!hasMultiplePayments) {
      if (updatedInvoice.receivedAmount > 0) {
          // Logic for cash type
          let cashType: 'IN' | 'OUT' = 'IN';
          let category = 'Sales';
          let desc = `Invoice #${updatedInvoice.id.split('-')[1]} Payment`;

          if (updatedInvoice.type === TransactionType.SALE) { cashType = 'IN'; category = 'Sales'; }
          else if (updatedInvoice.type === TransactionType.PURCHASE) { cashType = 'OUT'; category = 'Purchase'; }
          else if (updatedInvoice.type === TransactionType.SALE_RETURN) { cashType = 'OUT'; category = 'Refund'; }
          else if (updatedInvoice.type === TransactionType.PURCHASE_RETURN) { cashType = 'IN'; category = 'Refund'; }

          saveCashTransaction({
              id: existingCashTrx ? existingCashTrx.id : cashTrxId,
              date: updatedInvoice.date,
              type: cashType,
              amount: updatedInvoice.receivedAmount,
              category: category,
              description: desc,
              partyId: updatedInvoice.partyId,
              partyName: updatedInvoice.partyName,
              linkedInvoiceId: updatedInvoice.id
          });
      } else if (existingCashTrx) {
          deleteCashTransaction(existingCashTrx.id);
      }
  }

  // Save
  invoices[index] = updatedInvoice;
  set(KEYS.INVOICES, invoices);
  set(KEYS.PRODUCTS, products);
  set(KEYS.PARTIES, parties);
};

export const deleteInvoice = (id: string) => {
  const invoices = getInvoices();
  const invoice = invoices.find(i => i.id === id);
  if (!invoice) return;

  const products = getProducts();
  const parties = getParties();

  // Revert Effects
  revertInvoiceEffects(invoice, products, parties);

  // Remove linked Cash Transactions
  const cashTransactions = getCashTransactions();
  
  // 1. Remove Initial Payment
  const initialTrx = cashTransactions.find(t => t.id === `CASH-INV-${id}`);
  if (initialTrx) deleteCashTransaction(initialTrx.id);
  
  // 2. Remove any subsequent payments linked via ID pattern or linkedInvoiceId
  // Since we use CASH-PAY-{timestamp}, we filter by linkedInvoiceId
  const linkedTrxs = getCashTransactions().filter(t => t.linkedInvoiceId === id);
  linkedTrxs.forEach(t => deleteCashTransaction(t.id));

  set(KEYS.PRODUCTS, products);
  set(KEYS.PARTIES, parties);

  // Remove Invoice
  const newInvoices = invoices.filter(i => i.id !== id);
  set(KEYS.INVOICES, newInvoices);
};

// Helpers for Stock/Ledger Logic
const applyInvoiceEffects = (invoice: Invoice, products: Product[], parties: Party[]) => {
  // Update Product Stock and Log History
  invoice.items.forEach(item => {
    const prodIndex = products.findIndex(p => p.id === item.productId);
    if (prodIndex >= 0) {
      const p = products[prodIndex];
      const oldStock = p.stock;
      let newStock = oldStock;
      let movementType: StockMovementType = StockMovementType.SALE;
      let qtyChange = 0;

      switch(invoice.type) {
        case TransactionType.SALE:
           movementType = StockMovementType.SALE;
           qtyChange = -item.quantity;
           newStock = oldStock - item.quantity;
           break;
        case TransactionType.PURCHASE:
           movementType = StockMovementType.PURCHASE;
           qtyChange = item.quantity;
           newStock = oldStock + item.quantity;
           break;
        case TransactionType.SALE_RETURN:
           movementType = StockMovementType.RETURN_IN;
           qtyChange = item.quantity; // Stock comes back
           newStock = oldStock + item.quantity;
           break;
        case TransactionType.PURCHASE_RETURN:
           movementType = StockMovementType.RETURN_OUT;
           qtyChange = -item.quantity; // Stock leaves
           newStock = oldStock - item.quantity;
           break;
      }
      
      p.stock = newStock;
      
      logStockTransaction({
          id: `HIST-${Date.now()}-${p.id}`,
          productId: p.id,
          date: invoice.date,
          type: movementType,
          quantity: qtyChange,
          previousStock: oldStock,
          newStock: p.stock,
          referenceId: invoice.id,
          note: `${invoice.type} - #${invoice.id.split('-')[1]}`
      });
    }
  });

  // Update Party Balance
  const partyIndex = parties.findIndex(p => p.id === invoice.partyId);
  if (partyIndex >= 0) {
    const total = invoice.totalAmount;
    
    if (invoice.type === TransactionType.SALE) {
      parties[partyIndex].balance += total; // Receivable increases by Total Value
    } else if (invoice.type === TransactionType.PURCHASE) {
      parties[partyIndex].balance -= total; // Payable increases (Negative balance)
    } else if (invoice.type === TransactionType.SALE_RETURN) {
      parties[partyIndex].balance -= total; // We owe them (or reduce their debt)
    } else if (invoice.type === TransactionType.PURCHASE_RETURN) {
      parties[partyIndex].balance += total; // They owe us (or reduce our debt)
    }
  }
};

const revertInvoiceEffects = (invoice: Invoice, products: Product[], parties: Party[]) => {
  // Revert Product Stock (Logs 'Void' history)
  invoice.items.forEach(item => {
    const prodIndex = products.findIndex(p => p.id === item.productId);
    if (prodIndex >= 0) {
      const p = products[prodIndex];
      const oldStock = p.stock;
      let qtyChange = 0;
      let notePrefix = '';

      // Reversal Logic: Do opposite of apply
      if (invoice.type === TransactionType.SALE || invoice.type === TransactionType.PURCHASE_RETURN) {
        // Was OUT, now IN
        p.stock += item.quantity;
        qtyChange = item.quantity;
        notePrefix = 'Void Out';
      } else {
        // Was IN, now OUT
        p.stock -= item.quantity;
        qtyChange = -item.quantity;
        notePrefix = 'Void In';
      }

      logStockTransaction({
        id: `HIST-REV-${Date.now()}-${p.id}`,
        productId: p.id,
        date: new Date().toISOString(),
        type: StockMovementType.ADJUSTMENT,
        quantity: qtyChange,
        previousStock: oldStock,
        newStock: p.stock,
        referenceId: invoice.id,
        note: `${notePrefix} ${invoice.id}`
      });
    }
  });

  // Revert Party Balance
  // IMPORTANT: Revert the TOTAL amount effect.
  const partyIndex = parties.findIndex(p => p.id === invoice.partyId);
  if (partyIndex >= 0) {
    const total = invoice.totalAmount;
    if (invoice.type === TransactionType.SALE) {
      parties[partyIndex].balance -= total;
    } else if (invoice.type === TransactionType.PURCHASE) {
      parties[partyIndex].balance += total;
    } else if (invoice.type === TransactionType.SALE_RETURN) {
      parties[partyIndex].balance += total;
    } else if (invoice.type === TransactionType.PURCHASE_RETURN) {
      parties[partyIndex].balance -= total;
    }
  }
};

// Backup / Restore
export const exportData = () => {
  const data = {
    products: getProducts(),
    parties: getParties(),
    invoices: getInvoices(),
    businessInfo: getBusinessInfo(),
    stockHistory: get<StockTransaction[]>(KEYS.STOCK_HISTORY, []),
    cashbook: getCashTransactions(),
    timestamp: new Date().toISOString()
  };
  return JSON.stringify(data);
};

export const importData = (jsonString: string) => {
  try {
    const data = JSON.parse(jsonString);
    if (data.products) set(KEYS.PRODUCTS, data.products);
    if (data.parties) set(KEYS.PARTIES, data.parties);
    if (data.invoices) set(KEYS.INVOICES, data.invoices);
    if (data.businessInfo) set(KEYS.BUSINESS_INFO, data.businessInfo);
    if (data.stockHistory) set(KEYS.STOCK_HISTORY, data.stockHistory);
    if (data.cashbook) set(KEYS.CASHBOOK, data.cashbook);
    return true;
  } catch (e) {
    return false;
  }
};