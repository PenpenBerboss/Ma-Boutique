import { DashboardStats, Product, Category, Customer, Sale, Supplier } from "../types";

const API_BASE = "/api";

export const api = {
  // Stats
  getStats: (): Promise<DashboardStats> => fetch(`${API_BASE}/stats`).then(res => res.json()),

  // Products
  getProducts: (): Promise<Product[]> => fetch(`${API_BASE}/products`).then(res => res.json()),
  createProduct: (product: Partial<Product>) => fetch(`${API_BASE}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product)
  }).then(res => res.json()),
  updateProduct: (id: number, product: Partial<Product>) => fetch(`${API_BASE}/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product)
  }).then(res => res.json()),
  deleteProduct: (id: number) => fetch(`${API_BASE}/products/${id}`, { method: "DELETE" }).then(res => res.json()),

  // Categories
  getCategories: (): Promise<Category[]> => fetch(`${API_BASE}/categories`).then(res => res.json()),

  // Suppliers
  getSuppliers: (): Promise<Supplier[]> => fetch(`${API_BASE}/suppliers`).then(res => res.json()),

  // Customers
  getCustomers: (): Promise<Customer[]> => fetch(`${API_BASE}/customers`).then(res => res.json()),
  getCustomerHistory: (id: number): Promise<any[]> => fetch(`${API_BASE}/customers/${id}/history`).then(res => res.json()),
  createCustomer: (customer: Partial<Customer>) => fetch(`${API_BASE}/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(customer)
  }).then(res => res.json()),

  // Caisse
  getDailyCaisse: (): Promise<any> => fetch(`${API_BASE}/caisse/daily`).then(res => res.json()),

  // Sales
  getSales: (): Promise<Sale[]> => fetch(`${API_BASE}/sales`).then(res => res.json()),
  createSale: (sale: { customer_id?: number; items: any[]; total_amount: number }) => fetch(`${API_BASE}/sales`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sale)
  }).then(res => res.json()),

  // Utils
  simulateSale: () => fetch(`${API_BASE}/utils/simulate-sale`, { method: "POST" }).then(res => res.json()),
  resetDatabase: () => fetch(`${API_BASE}/utils/reset`, { method: "POST" }).then(res => res.json()),
};
