import { Product } from './types';

export const PRODUCT_CATEGORIES = [
  'Phones & Tablets',
  'Computers & Laptops',
  'Gaming & Consoles',
  'TVs & Audio',
  'Accessories',
  'Networking',
  'Home Appliances',
  'Smart Devices',
  'Cameras & Security',
  'Deals & Offers'
] as const;

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Samsung Galaxy S24 Ultra',
    description: 'AI-infused 6.8" Dynamic AMOLED display with 200MP pro-grade camera.',
    price: 4500000,
    category: 'Phones & Tablets',
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=75&w=800&auto=format&fit=crop',
    stock: 50,
    featured: true
  },
  {
    id: 'p2',
    name: 'Apple MacBook Pro M3',
    description: 'The ultimate workstation for software engineers. Unmatched power and efficiency.',
    price: 9800000,
    category: 'Computers & Laptops',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=75&w=800&auto=format&fit=crop',
    stock: 12,
    featured: true
  },
  {
    id: 'p3',
    name: 'Apple AirPods Max',
    description: 'High-fidelity audio with industry-leading Active Noise Cancellation.',
    price: 2200000,
    category: 'TVs & Audio',
    image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=75&w=800&auto=format&fit=crop',
    stock: 100,
    featured: true
  },
  {
    id: 'p4',
    name: 'HP Spectre x360',
    description: 'Premium convertible laptop with 4K OLED touch display and slim profile.',
    price: 5400000,
    category: 'Computers & Laptops',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=75&w=800&auto=format&fit=crop',
    stock: 30,
    featured: true
  },
  {
    id: 'p5',
    name: 'Dell XPS 15',
    description: 'Stunning InfinityEdge display and high-performance internals for creators.',
    price: 6800000,
    category: 'Computers & Laptops',
    image: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?q=75&w=800&auto=format&fit=crop',
    stock: 25
  },
  {
    id: 'p6',
    name: 'Sony WH-1000XM5',
    description: 'The definitive wireless noise-cancelling headphones for travel and focus.',
    price: 1650000,
    category: 'TVs & Audio',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=75&w=800&auto=format&fit=crop',
    stock: 40
  }
];
