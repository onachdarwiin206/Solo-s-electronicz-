export type OrderStatus = 'pending' | 'confirmed' | 'delivering' | 'delivered';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  images?: string[];
  video_url?: string;
  videos?: string[];
  video_duration?: number;
  stock: number;
  featured?: boolean;
  is_verified?: boolean;
  rating?: number;
  likes_count?: number;
  created_at?: string;
  updated_at?: string;
  client_created_at?: number;
  client_updated_at?: number;
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
  created_at: string;
  last_login?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  delivery_address: string;
  district?: string;
  created_at: string;
  receipt_id?: string;
  payment_method?: PaymentMethod;
}

export type PaymentMethod = 'cod' | 'mobile_money';

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}
