/**
 * Centralized API Client
 * Wraps all backend API calls with error handling, auth, and retry logic
 */

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:3000';

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private adminToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.adminToken = sessionStorage.getItem('admin_token');
    }
  }

  setAdminToken(token: string) {
    this.adminToken = token;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('admin_token', token);
    }
  }

  clearAdminToken() {
    this.adminToken = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('admin_token');
    }
  }

  private getHeaders(includeAuth = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.adminToken) {
      headers['Authorization'] = `Bearer ${this.adminToken}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error || data.message || 'An error occurred';
      
      // Handle 401 - redirect to login
      if (response.status === 401) {
        this.clearAdminToken();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth-error', { detail: { message: 'Session expired' } }));
        }
      }

      throw new Error(errorMessage);
    }

    return data;
  }

  // ============ ADMIN ROUTES ============

  async loginWithPin(pin: string, email?: string): Promise<ApiResponse<{ token: string; user: any; expiresIn: number }>> {
    const response = await fetch(`${API_BASE}/api/v1/admin/login-pin`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ pin, email }),
    });

    return this.handleResponse(response);
  }

  // ============ ORDERS ROUTES ============

  async getProducts(): Promise<any[]> {
    const response = await fetch(`${API_BASE}/api/v1/orders/products`);
    return this.handleResponse(response);
  }

  async createOrder(orderData: {
    items: any[];
    customerName: string;
    phone: string;
    address: string;
    district: string;
    deliveryFee: number;
    paymentMethod: 'cod' | 'momo';
  }): Promise<ApiResponse<{ orderId: string; verificationToken: string; paymentDeadline: string; total: number }>> {
    const response = await fetch(`${API_BASE}/api/v1/orders`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(orderData),
    });

    return this.handleResponse(response);
  }

  async verifyOrderPayment(
    orderId: string,
    verificationToken: string,
    verificationNotes?: string
  ): Promise<ApiResponse<{ status: string; paymentVerifiedAt: string }>> {
    const response = await fetch(`${API_BASE}/api/v1/orders/${orderId}/verify-payment`, {
      method: 'POST',
      headers: this.getHeaders(true), // Include auth token
      body: JSON.stringify({ verificationToken, verificationNotes }),
    });

    return this.handleResponse(response);
  }

  // ============ MARKETING ROUTES ============

  async generateCaption(productName: string, productDescription: string, tone: string, platform: string): Promise<ApiResponse<{ caption: string; generatedBy: string }>> {
    const response = await fetch(`${API_BASE}/api/marketing/generate-caption`, {
      method: 'POST',
      headers: this.getHeaders(true), // Admin only
      body: JSON.stringify({ productName, productDescription, tone, platform }),
    });

    return this.handleResponse(response);
  }

  // ============ PAYMENT VERIFICATION ROUTES ============

  async verifyPayment(amount: number, method: 'cod' | 'momo', phone: string, orderId: string): Promise<ApiResponse<{ verified: boolean; paymentToken: string }>> {
    const response = await fetch(`${API_BASE}/api/checkout/verify-payment`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ amount, method, phone, orderId }),
    });

    return this.handleResponse(response);
  }
}

// Export singleton instance
export const api = new ApiClient();

export default api;
