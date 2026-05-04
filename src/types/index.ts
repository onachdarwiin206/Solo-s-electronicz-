export type Category = 'Phones' | 'Computers' | 'Electronics';

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

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
  isVerified?: boolean; // Trust Badge
  rating?: number;
  likesCount?: number;
  reviews?: Review[];
}

export interface CartItem extends Product {
  quantity: number;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Paid' | 'Packing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
export type PaymentMethod = 'Card' | 'Airtel Money' | 'MTN Mobile Money' | 'Cash on Delivery';

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  district: string;
  deliveryAddress: string;
  receiptId: string;
  createdAt: any;
  notes?: string;
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
  phone?: string;
  district?: string;
  address?: string;
  role: 'customer' | 'staff' | 'admin';
  wishlist?: string[];
  likes?: string[];
  createdAt: any;
}
