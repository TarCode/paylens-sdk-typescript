import { z } from 'zod';

// Common enums
export enum PaymentStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
    REFUNDED = 'refunded',
    PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentMethod {
    CARD = 'card',
    EFT = 'eft',
    MOBILE_WALLET = 'mobile_wallet',
    BANK_TRANSFER = 'bank_transfer',
    CRYPTOCURRENCY = 'cryptocurrency',
}

export enum Currency {
    ZAR = 'ZAR',
    USD = 'USD',
    EUR = 'EUR',
    GBP = 'GBP',
}

// Zod schemas for validation
export const AmountSchema = z.number().positive().multipleOf(0.01);
export const CurrencySchema = z.nativeEnum(Currency);
export const PaymentMethodSchema = z.nativeEnum(PaymentMethod);
export const PaymentStatusSchema = z.nativeEnum(PaymentStatus);

// Base types
export interface Amount {
    value: number;
    currency: Currency;
}

export const AmountObjectSchema = z.object({
    value: AmountSchema,
    currency: CurrencySchema,
});

export interface Customer {
    id?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
}

export const CustomerSchema = z.object({
    id: z.string().optional(),
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
});

export interface BillingAddress {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
}

export const BillingAddressSchema = z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().optional(),
    postalCode: z.string().min(1),
    country: z.string().length(2), // ISO 3166-1 alpha-2
});

export interface CardDetails {
    number: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    holderName?: string;
}

export const CardDetailsSchema = z.object({
    number: z.string().regex(/^\d{13,19}$/),
    expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/),
    expiryYear: z.string().regex(/^\d{2}$/),
    cvv: z.string().regex(/^\d{3,4}$/),
    holderName: z.string().optional(),
});

export interface PaymentRequest {
    amount: Amount;
    customer: Customer;
    paymentMethod: PaymentMethod;
    reference?: string;
    description?: string;
    metadata?: Record<string, unknown>;
    billingAddress?: BillingAddress;
    cardDetails?: CardDetails;
    returnUrl?: string;
    webhookUrl?: string;
}

export const PaymentRequestSchema = z.object({
    amount: AmountObjectSchema,
    customer: CustomerSchema,
    paymentMethod: PaymentMethodSchema,
    reference: z.string().optional(),
    description: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
    billingAddress: BillingAddressSchema.optional(),
    cardDetails: CardDetailsSchema.optional(),
    returnUrl: z.string().url().optional(),
    webhookUrl: z.string().url().optional(),
});

export interface PaymentResponse {
    id: string;
    status: PaymentStatus;
    amount: Amount;
    paymentMethod: PaymentMethod;
    reference?: string;
    gatewayReference?: string;
    createdAt: Date;
    updatedAt?: Date;
    metadata?: Record<string, unknown>;
    redirectUrl?: string;
    failureReason?: string;
}

export interface RefundRequest {
    paymentId: string;
    amount?: Amount; // If not provided, full refund
    reason?: string;
    reference?: string;
}

export const RefundRequestSchema = z.object({
    paymentId: z.string().min(1),
    amount: AmountObjectSchema.optional(),
    reason: z.string().optional(),
    reference: z.string().optional(),
});

export interface RefundResponse {
    id: string;
    paymentId: string;
    status: PaymentStatus;
    amount: Amount;
    reason?: string;
    reference?: string;
    gatewayReference?: string;
    createdAt: Date;
    metadata?: Record<string, unknown>;
}

export interface PaymentGatewayConfig {
    apiUrl: string;
    sandbox: boolean;
    timeout?: number;
    retries?: number;
}
