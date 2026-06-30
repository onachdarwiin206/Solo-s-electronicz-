import { OrderStatus, Product } from '../../types';

export interface InventoryMovement {
  id: string;
  product_id: string;
  productName: string;
  type: 'Purchase' | 'Sale' | 'Return' | 'Damaged' | 'Adjustment';
  quantity: number;
  before: number;
  after: number;
  reason: string;
  operator: string;
  timestamp: string;
}

export interface PromoCoupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface StoreSettings {
  lowStockThreshold: number;
  storePhone: string;
  storeHours: string;
  enableAlerts: boolean;
}
