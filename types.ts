
export type PaymentMethod = 'TRANSFER' | 'CASH' | 'FIAO';
export type UnitType = 'UND' | 'LB';
export type CurrencyType = 'CUP' | 'USD';

export interface Product {
  id: string;
  name: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  currency: CurrencyType;
  stock: number;
  initialStock: number;
  soldCount: number;
  unit: UnitType;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: UnitType;
  unitPrice: number;
  totalAmount: number;
  currency: CurrencyType;
  paymentMethod: PaymentMethod;
  customerInfo?: string; // Used for "Fiao" (debt)
  isPaid?: boolean;      // True for CASH/TRANSFER, False initially for FIAO
  timestamp: string;     // ISO string
}

export type ViewType = 'dashboard' | 'inventory' | 'pos' | 'reports' | 'currency' | 'settings';

export interface DashboardStats {
  totalStock: number;
  totalSold: number;
  remainingToSell: number;
  totalProfit: number;
  totalRevenue: number;
}
