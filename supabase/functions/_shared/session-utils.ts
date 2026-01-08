// Shared session utilities for client portal authentication

const SESSION_EXPIRY_HOURS = 24;

// HMAC-SHA256 signing for session tokens
export async function createHmacSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export async function verifyHmacSignature(data: string, signature: string, secret: string): Promise<boolean> {
  const expectedSignature = await createHmacSignature(data, secret);
  // Constant-time comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) return false;
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return result === 0;
}

// Helper function to convert Uint8Array to base64
function uint8ArrayToBase64(arr: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < arr.byteLength; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary);
}

export interface SessionPayload {
  lid: string; // lead id
  exp: number; // expiry timestamp
  rnd: string; // random component
}

export async function generateSecureSessionToken(
  leadId: string, 
  secret: string
): Promise<{ token: string; expiresAt: number }> {
  // Generate cryptographically secure random component
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const randomPart = uint8ArrayToBase64(randomBytes);
  
  // Create expiry timestamp
  const expiresAt = Date.now() + (SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
  
  // Create token payload
  const payload: SessionPayload = {
    lid: leadId,
    exp: expiresAt,
    rnd: randomPart,
  };
  
  // Encode payload as base64
  const payloadBase64 = btoa(JSON.stringify(payload));
  
  // Create HMAC signature
  const signature = await createHmacSignature(payloadBase64, secret);
  
  // Combine payload and signature
  const token = `${payloadBase64}.${signature}`;
  
  return { token, expiresAt };
}

export interface TokenValidationResult {
  valid: boolean;
  leadId?: string;
  error?: string;
}

export async function validateSessionToken(
  token: string,
  secret: string
): Promise<TokenValidationResult> {
  try {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Missing or invalid token' };
    }
    
    const parts = token.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Invalid token format' };
    }
    
    const [payloadBase64, signature] = parts;
    
    // Verify signature
    const isValidSignature = await verifyHmacSignature(payloadBase64, signature, secret);
    if (!isValidSignature) {
      return { valid: false, error: 'Invalid token signature' };
    }
    
    // Decode and parse payload
    let payload: SessionPayload;
    try {
      payload = JSON.parse(atob(payloadBase64));
    } catch {
      return { valid: false, error: 'Invalid token payload' };
    }
    
    // Validate payload structure
    if (!payload.lid || !payload.exp || !payload.rnd) {
      return { valid: false, error: 'Incomplete token payload' };
    }
    
    // Check expiry
    if (Date.now() > payload.exp) {
      return { valid: false, error: 'Token has expired' };
    }
    
    return { valid: true, leadId: payload.lid };
  } catch (error) {
    return { valid: false, error: 'Token validation failed' };
  }
}

export function getSessionSecret(): string {
  const secret = Deno.env.get('CLIENT_SESSION_SECRET');
  if (!secret) {
    throw new Error('CLIENT_SESSION_SECRET is not configured');
  }
  return secret;
}
