export interface Product {
  id: number;
  name: string;
  category_id: number;
  category_name?: string;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock_level: number;
  supplier_id?: number;
  supplier_name?: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact?: string;
  email?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  total_spent?: number;
  total_orders?: number;
}

export interface Sale {
  id: number;
  customer_id?: number;
  customer_name?: string;
  total_amount: number;
  sale_date: string;
}

export interface SaleItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  name?: string;
}

export interface DashboardStats {
  dailyRevenue: number;
  monthlyRevenue: number;
  monthlyProfit: number;
  lowStockCount: number;
  topProducts: { name: string; total_sold: number }[];
  recentSales: Sale[];
  dailyHistory: { date: string; total: number }[];
  weeklyHistory: { week: string; total: number }[];
  monthlyHistory: { month: string; total: number }[];
  lowRotationProducts: { name: string; stock_quantity: number; total_sold: number }[];
  weightedProjection: number;
}
