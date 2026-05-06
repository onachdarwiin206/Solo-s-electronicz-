import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'X-Phone Ultra',
    description: 'Neural core powered 6.9" display with 200MP adaptive sensor.',
    price: 4500000,
    category: 'Phones',
    image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=75&w=800&auto=format&fit=crop',
    stock: 50,
    featured: true
  },
  {
    id: 'p2',
    name: 'Quantum Laptop Pro',
    description: 'The ultimate workstation for software engineers. M4 Performance architecture.',
    price: 9800000,
    category: 'Computers',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=75&w=800&auto=format&fit=crop',
    stock: 12,
    featured: true
  },
  {
    id: 'p3',
    name: 'Solo Buds Max',
    description: 'Lossless audio with active software-defined noise cancellation.',
    price: 1200000,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=75&w=800&auto=format&fit=crop',
    stock: 100
  },
  {
    id: 'p4',
    name: 'Fusion Tablet X',
    description: 'Desktop class performance in a razor thin 5mm chassis.',
    price: 3400000,
    category: 'Computers',
    image: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?q=75&w=800&auto=format&fit=crop',
    stock: 30
  },
  {
    id: 'p5',
    name: 'Pulse Smartphone',
    description: 'Minimalist design, maximum privacy. The secure choice.',
    price: 2800000,
    category: 'Phones',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=75&w=800&auto=format&fit=crop',
    stock: 45
  },
  {
    id: 'p6',
    name: 'Aero Watch',
    description: 'Lighter than air titanium casing with holistic health tracking.',
    price: 1650000,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=75&w=800&auto=format&fit=crop',
    stock: 60
  }
];
