export type UserRole =
  | "ADMIN"
  | "SALES"
  | "WAREHOUSE"
  | "ACCOUNTS";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface Customer {
  id: number;
  name: string;
  mobile: string;
  email?: string;
  business_name?: string;
  gst_number?: string;
  customer_type: string;
  address?: string;
  status: "LEAD" | "ACTIVE" | "INACTIVE";
  follow_up_date?: string;
  notes?: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category?: string;
  unit_price: string;
  current_stock: number;
  minimum_stock: number;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface Challan {
  id: number;
  challan_number: string;
  customer_id: number;
  customer_name: string;
  business_name?: string;
  total_quantity: number;
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
  created_by: number;
  created_at: string;
}

export interface ChallanItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  unit_price: string;
  quantity: number;
}