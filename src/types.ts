export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number; // in LKR
  size?: string; // S, M, L, XL, etc.
  color?: string; // Red, Black, etc.
}

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  district: string;
  province: string;
}

export interface CustomerDetails {
  name: string;
  phone1: string;
  phone2?: string;
  address: ShippingAddress;
}

export interface RtoRisk {
  score: number; // 10% to 100%
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  warningSinhala: string;
  warningEnglish: string;
  reasons: string[];
}

export interface CourierRecommendation {
  recommended: string; // Koombiyo, Domex, Pronto, Fardar, etc.
  fee: number; // Sri Lankan delivery guidelines
  reason: string;
  ratesSummary: string;
}

export interface InvoiceData {
  subtotal: number;
  deliveryFee: number;
  total: number;
  thermalLayout58: string;
  thermalLayout80: string;
}

export interface ScrapedOrder {
  id: string;
  customer: CustomerDetails;
  items: OrderItem[];
  rtoRisk: RtoRisk;
  courier: CourierRecommendation;
  invoice: InvoiceData;
  createdAt: string;
  rawInput: string;
  status: "Pending Check" | "Approved" | "High Risk Hold" | "Dispatched" | "Delivered" | "Returned";
}

export interface AdCampaignData {
  date: string;
  salesCount: number;
  revenue: number; // in LKR
  adSpend: number; // in LKR (Facebook/TikTok ads)
  productCost: number; // Cost of Goods Sold in LKR
  otherExpenses: number; // overhead in LKR
}

export interface FinancialSummary {
  totalRevenue: number;
  totalSpend: number;
  totalProductCost: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number; // percentage
  roas: number; // Return on Ad Spend
  cac: number; // Customer Acquisition Cost
}

export interface InventoryItem {
  id: string;
  name: string;
  cost: number;
  price: number;
  stock: number;
  sku?: string;
  category?: string;
  description?: string;
  productType?: "Simple" | "Variable";
  status?: "Active" | "Draft";
  lowStockAlert?: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}
