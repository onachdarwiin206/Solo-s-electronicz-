export type OrderStatus = 'pending' | 'confirmed' | 'delivering' | 'delivered';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  videoUrl?: string;
  videoDuration?: number;
  stock: number;
  featured?: boolean;
  isVerified?: boolean;
  rating?: number;
  likesCount?: number;
}

export type Category = 'Phones' | 'Computers' | 'Electronics' | 'Accessories';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  wishlist?: string[];
  likes?: string[];
  district?: string;
  address?: string;
  createdAt: any;
  lastLogin?: any;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  deliveryAddress: string;
  district?: string;
  createdAt: any;
  receiptId?: string;
}

export type PaymentMethod = 'cod' | 'mobile_money';
