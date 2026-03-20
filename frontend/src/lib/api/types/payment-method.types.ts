/**
 * Payment Method Types
 * Types for managing saved payment methods (cards, UPI, bank accounts)
 */

export type PaymentMethodType = 'CARD' | 'UPI' | 'BANK_ACCOUNT';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  // Card-specific fields
  cardBrand?: string; // visa, mastercard, rupay, amex, etc.
  cardLast4?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  // UPI-specific fields
  upiId?: string;
  // Bank account-specific fields
  bankName?: string;
  bankLast4?: string;
  // Common fields
  isDefault: boolean;
  createdAt: string;
}

export interface AddPaymentMethodDto {
  type: PaymentMethodType;
  // Token from Razorpay checkout for card tokenization
  razorpayToken?: string;
  // For UPI payments
  upiId?: string;
  // For bank account
  bankAccountNumber?: string;
  bankIfscCode?: string;
}

export interface SetDefaultPaymentMethodDto {
  paymentMethodId: string;
}

// API response types
export interface PaymentMethodsResponse {
  paymentMethods: PaymentMethod[];
}

export interface AddPaymentMethodResponse {
  paymentMethod: PaymentMethod;
  message?: string;
}

export interface SetDefaultPaymentMethodResponse {
  success: boolean;
  message?: string;
}

export interface RemovePaymentMethodResponse {
  success: boolean;
  message?: string;
}

// Card brand display information
export const CARD_BRAND_INFO: Record<string, { name: string; color: string }> = {
  visa: { name: 'Visa', color: '#1A1F71' },
  mastercard: { name: 'Mastercard', color: '#EB001B' },
  rupay: { name: 'RuPay', color: '#097A44' },
  amex: { name: 'American Express', color: '#006FCF' },
  discover: { name: 'Discover', color: '#FF6000' },
  diners: { name: 'Diners Club', color: '#004A97' },
  jcb: { name: 'JCB', color: '#0E4C96' },
  maestro: { name: 'Maestro', color: '#CC0000' },
};

// Helper function to get display name for card brand
export function getCardBrandDisplayName(brand?: string): string {
  if (!brand) return 'Card';
  const normalizedBrand = brand.toLowerCase();
  return CARD_BRAND_INFO[normalizedBrand]?.name || brand.charAt(0).toUpperCase() + brand.slice(1);
}

// Helper function to format card expiry
export function formatCardExpiry(month?: number, year?: number): string {
  if (!month || !year) return '';
  const monthStr = month.toString().padStart(2, '0');
  const yearStr = year.toString().slice(-2);
  return `${monthStr}/${yearStr}`;
}

// Helper function to mask UPI ID
export function maskUpiId(upiId?: string): string {
  if (!upiId) return '';
  const [handle, provider] = upiId.split('@');
  if (!provider) return upiId;
  if (handle.length <= 4) return `${handle}@${provider}`;
  return `${handle.slice(0, 2)}****${handle.slice(-2)}@${provider}`;
}
