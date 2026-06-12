import crypto from 'crypto';

interface ChargeRequest {
  amount: number;
  phone: string;
  customerName: string;
  orderId: string;
  network: 'MTN' | 'AIRTEL';
}

interface PaymentLog {
  step: string;
  status: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  message: string;
  logs: PaymentLog[];
  mode: 'production' | 'sandbox' | 'live_simulation';
}

/**
 * Normalizes Ugandan phone numbers to international standard format for direct telecom processing.
 * e.g., 0771234567 -> 256771234567
 */
export function normalizeUgPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\s+/g, '').replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '256' + cleaned.substring(1);
  } else if (!cleaned.startsWith('256') && cleaned.length === 9) {
    cleaned = '256' + cleaned;
  }
  return cleaned;
}

/**
 * 1. UNIFIED MOBILEY MONEY INTEGRATION via FLUTTERWAVE GATEWAY (Highly Recommended for Uganda)
 * Flutterwave processes both MTN Mobile Money and Airtel Money Uganda under a single unified node.
 */
async function processFlutterwaveCharge(req: ChargeRequest, logs: PaymentLog[]): Promise<PaymentResult> {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing FLUTTERWAVE_SECRET_KEY");
  }

  logs.push({
    step: 'FLUTTERWAVE_INIT',
    status: 'info',
    message: `Attempting unified Flutterwave charge for ${req.network} to ${req.phone} (UGX ${req.amount.toLocaleString()})`,
    timestamp: new Date().toISOString()
  });

  const url = 'https://api.flutterwave.com/v3/charges?type=mobile_money_uganda';
  const internationalPhone = normalizeUgPhoneNumber(req.phone);
  const txRef = `SOLO-FLW-${req.orderId}-${Date.now().toString().slice(-6)}`;

  const payload = {
    amount: req.amount,
    currency: 'UGX',
    phone_number: internationalPhone,
    email: 'checkout@soloelectronics.com',
    tx_ref: txRef,
    fullname: req.customerName,
    // Specify target telecom operator
    network: req.network === 'MTN' ? 'MTN' : 'AIRTEL'
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secretKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json() as any;

    if (res.status !== 200 || !data || data.status === 'error') {
      logs.push({
        step: 'FLUTTERWAVE_ERROR',
        status: 'error',
        message: data?.message || `Gateway returned status code ${res.status}`,
        timestamp: new Date().toISOString()
      });
      return {
        success: false,
        message: data?.message || "Flutterwave transaction initialization failed.",
        logs,
        mode: 'production'
      };
    }

    logs.push({
      step: 'FLUTTERWAVE_RESPONSE',
      status: 'success',
      message: `USSD push triggered successfully. Reference: ${data.data?.id || txRef}. Info: ${data.meta?.authorization?.instruction || 'Input your PIN to confirm.'}`,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      transactionId: String(data.data?.id || txRef),
      message: data.message || "USSD checkout push initiated.",
      logs,
      mode: 'production'
    };
  } catch (err: any) {
    logs.push({
      step: 'FLUTTERWAVE_CRITICAL',
      status: 'error',
      message: err.message || 'Network connectivity error contacting Flutterwave.',
      timestamp: new Date().toISOString()
    });
    return {
      success: false,
      message: "Gateway connectivity timeout.",
      logs,
      mode: 'production'
    };
  }
}

/**
 * 2. DIRECT TELECOM GATEWAY: MTN MOBILE MONEY (MoMo direct Developer Portal)
 * Integrates directly with MTN's Collection OpenAPI.
 */
async function processDirectMtnMomo(req: ChargeRequest, logs: PaymentLog[]): Promise<PaymentResult> {
  const primaryKey = process.env.MTN_MOMO_PRIMARY_KEY;
  const apiUser = process.env.MTN_MOMO_API_USER;
  const apiKey = process.env.MTN_MOMO_API_KEY;
  const targetEnv = process.env.MTN_MOMO_TARGET_ENV || 'sandbox';

  if (!primaryKey || !apiUser || !apiKey) {
    throw new Error("Missing direct MTN MoMo credentials");
  }

  logs.push({
    step: 'MTN_CONNECT_INIT',
    status: 'info',
    message: `Attempting direct dial to MTN Collections Portal in [${targetEnv}] mode...`,
    timestamp: new Date().toISOString()
  });

  const baseUrl = targetEnv === 'sandbox' 
    ? 'https://sandbox.momodeveloper.mtn.com'
    : 'https://proxy.momoapi.mtn.com';

  // Step 2A: Generate OAuth 2.0 access token
  const authHeader = Buffer.from(`${apiUser}:${apiKey}`).toString('base64');
  let accessToken = '';

  try {
    logs.push({
      step: 'MTN_TOKEN_REQUEST',
      status: 'info',
      message: 'Aquiring active session OAuth 2 authentication ticket...',
      timestamp: new Date().toISOString()
    });

    const tokenRes = await fetch(`${baseUrl}/collection/token/`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': primaryKey,
        'Authorization': `Basic ${authHeader}`
      }
    });

    if (tokenRes.status !== 200) {
      const errTxt = await tokenRes.text();
      logs.push({
        step: 'MTN_TOKEN_FAILURE',
        status: 'error',
        message: `Failed fetching MoMo Token (HTTP ${tokenRes.status}): ${errTxt}`,
        timestamp: new Date().toISOString()
      });
      return {
        success: false,
        message: "STN Auth denied. Subscriber credential verification failed.",
        logs,
        mode: targetEnv === 'sandbox' ? 'sandbox' : 'production'
      };
    }

    const tokenData = await tokenRes.json() as { access_token: string };
    accessToken = tokenData.access_token;

    logs.push({
      step: 'MTN_TOKEN_ACQUIRED',
      status: 'success',
      message: 'Active session cryptographically authorized.',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    logs.push({
      step: 'MTN_TOKEN_EXCEPTION',
      status: 'error',
      message: `Token acquisition exception: ${err.message}`,
      timestamp: new Date().toISOString()
    });
    return {
      success: false,
      message: "Gateway authorization connection refused reset.",
      logs,
      mode: targetEnv === 'sandbox' ? 'sandbox' : 'production'
    };
  }

  // Step 2B: Call MTN requesttopay Collection endpoint
  const referenceId = crypto.randomUUID(); // Requires separate random UUID as payment reference
  const cleanPhone = normalizeUgPhoneNumber(req.phone);

  const requestToPayPayload = {
    amount: String(req.amount),
    currency: 'UGX',
    externalId: req.orderId,
    payer: {
      partyIdType: 'MSISDN',
      // Direct MTN expects format without '+' (e.g., 256771234567)
      partyId: cleanPhone
    },
    payerMessage: `Secure Purchase Node: Order #${req.orderId}`,
    payeeNote: 'Solo Electronics UG'
  };

  try {
    logs.push({
      step: 'MTN_PUSH_INITIATED',
      status: 'info',
      message: `Dispatching requesttopay request. ReferenceId: ${referenceId}`,
      timestamp: new Date().toISOString()
    });

    const payRes = await fetch(`${baseUrl}/collection/v1_0/requesttopay`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Reference-Id': referenceId,
        'X-Target-Environment': targetEnv,
        'Ocp-Apim-Subscription-Key': primaryKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestToPayPayload)
    });

    // MTN direct collection creation returns '202 Accepted' on successful queue dispatch
    if (payRes.status !== 202) {
      const payErr = await payRes.text();
      logs.push({
        step: 'MTN_PUSH_REJECTED',
        status: 'error',
        message: `MTN collection prompt rejected (HTTP ${payRes.status}): ${payErr}`,
        timestamp: new Date().toISOString()
      });
      return {
        success: false,
        message: `MTN MoMo Gateway rejected request topay. Details: ${payErr}`,
        logs,
        mode: targetEnv === 'sandbox' ? 'sandbox' : 'production'
      };
    }

    logs.push({
      step: 'MTN_PUSH_ACKNOWLEDGED',
      status: 'success',
      message: 'MTN Telecom acknowledged USSD prompt. Awaiting customer confirmation PIN loop.',
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      transactionId: referenceId,
      message: "MTN Request to Pay dispatched and accepted inside telecom nodes.",
      logs,
      mode: targetEnv === 'sandbox' ? 'sandbox' : 'production'
    };
  } catch (err: any) {
    logs.push({
      step: 'MTN_PUSH_EXCEPTION',
      status: 'error',
      message: `Direct MoMo terminal exception: ${err.message}`,
      timestamp: new Date().toISOString()
    });
    return {
      success: false,
      message: "MTN collection pipeline connection timeout.",
      logs,
      mode: targetEnv === 'sandbox' ? 'sandbox' : 'production'
    };
  }
}

/**
 * 3. HIGH-FIDELITY ACTIVE SANDBOX SIMULATOR & TELEMETRY LOGGER
 * Runs automatically if no live production keys exist, giving the user a gorgeous visual 
 * demonstration of the cryptographic transaction pipeline without billing.
 */
async function processLiveSimulation(req: ChargeRequest, logs: PaymentLog[]): Promise<PaymentResult> {
  const normPhone = normalizeUgPhoneNumber(req.phone);
  const isAirtel = req.network === 'AIRTEL';

  logs.push({
    step: 'SIM_INIT',
    status: 'info',
    message: `Payment initiated under [Solo Sandbox Simulation Mode] for ${req.network} Pay.`,
    timestamp: new Date().toISOString()
  });

  // Replicate standard telecom authentication handshake
  logs.push({
    step: 'SIM_AUTH_HANDSHAKE',
    status: 'info',
    message: `Handshaking with ${isAirtel ? 'Airtel API Gateway Node' : 'MTN MoMo API Service Developer portal'}...`,
    timestamp: new Date().toISOString()
  });

  await new Promise(resolve => setTimeout(resolve, 800));

  logs.push({
    step: 'SIM_AUTH_GRANTED',
    status: 'success',
    message: `Handshake complete. Granted temporary billing scope auth token for order #${req.orderId}`,
    timestamp: new Date().toISOString()
  });

  // Replicate payment request-to-pay USSD push initiation
  logs.push({
    step: 'SIM_USSD_PUSH',
    status: 'info',
    message: `Sending USSD request-to-pay trigger payload: amount ${req.amount} UGX to MSISDN +${normPhone}...`,
    timestamp: new Date().toISOString()
  });

  await new Promise(resolve => setTimeout(resolve, 900));

  logs.push({
    step: 'SIM_CUSTOMER_PROMPT',
    status: 'success',
    message: `[TELECOM PUSH ALERT] Over-the-air prompt delivered to client handset representing +${normPhone}. Awaiting secure client PIN clearance.`,
    timestamp: new Date().toISOString()
  });

  const txId = `SIM-TX-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  return {
    success: true,
    transactionId: txId,
    message: `[Sandbox] Simulating ${req.network} Pay request-to-pay successful execution.`,
    logs,
    mode: 'live_simulation'
  };
}

/**
 * Orchestrates Mobile Money checkout charges for MTN & Airtel Uganda based on the current system environment state.
 */
export async function handleMomoPayment(req: ChargeRequest): Promise<PaymentResult> {
  const logs: PaymentLog[] = [];

  try {
    // Priority 1: Unified Flutterwave Gateways (Best for real-world setups in Uganda)
    if (process.env.FLUTTERWAVE_SECRET_KEY) {
      return await processFlutterwaveCharge(req, logs);
    }

    // Priority 2: Direct MTN MoMo Collection API
    if (req.network === 'MTN' && process.env.MTN_MOMO_PRIMARY_KEY && process.env.MTN_MOMO_API_USER) {
      return await processDirectMtnMomo(req, logs);
    }

    // Default: High-fidelity Live Simulation for sandbox developer preview
    return await processLiveSimulation(req, logs);
  } catch (error: any) {
    logs.push({
      step: 'SERVER_ORCHESTRATION_ERROR',
      status: 'error',
      message: `Billing system error: ${error.message || error}`,
      timestamp: new Date().toISOString()
    });
    return {
      success: false,
      message: error.message || "An unexpected error occurred during billing orchestration.",
      logs,
      mode: 'live_simulation'
    };
  }
}
