import { CartItem, PaymentMethod } from "../types";

export interface CreateOrderParams {
  items: CartItem[];
  customerName: string;
  phone: string;
  address: string;
  district: string;
  deliveryFee: number;
  paymentMethod: PaymentMethod;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  verificationToken: string;
  paymentDeadline: string;
  total: number;
  error?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  status: string;
  paymentVerifiedAt: string;
  error?: string;
}

/**
 * Creates a new pending order on the backend.
 * Validates inventory pricing and reserves stock atomically.
 */
export async function createOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
  const response = await fetch("/api/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to initialize and secure order routing.");
  }
  return data;
}

/**
 * Admin action to verify a payment token for a pending order.
 */
export async function verifyOrderPayment(
  orderId: string,
  verificationToken: string,
  verificationNotes?: string
): Promise<VerifyPaymentResponse> {
  const adminToken = sessionStorage.getItem("admin_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (adminToken) {
    headers["Authorization"] = `Bearer ${adminToken}`;
  }

  const response = await fetch(`/api/v1/orders/${orderId}/verify-payment`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      verificationToken,
      verificationNotes,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to reconcile order payment verification.");
  }
  return data;
}
