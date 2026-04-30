export type Category = 'Phones' | 'Computers' | 'Electronics';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
  videoUrl?: string; // Support for product videos
  stock: number;
  featured?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered';
export type PaymentMethod = 'Card' | 'Airtel Money' | 'MTN Mobile Money';

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  deliveryAddress: string;
  receiptId: string;
  createdAt: any;
}

export interface MarketingPost {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  staffId: string;
  staffName: string;
  createdAt: any;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'staff' | 'admin';
  createdAt: any;
}
