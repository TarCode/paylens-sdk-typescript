import { z } from 'zod';

// Peach Payments environment types
export enum PeachEnvironment {
    SANDBOX = 'sandbox',
    PRODUCTION = 'production',
}

// Peach Payments specific configuration
export interface PeachPaymentsConfig {
    entityId: string;
    username: string;
    password: string;
    environment: PeachEnvironment;
    timeout?: number;
    retries?: number;
    // Legacy support - will be deprecated
    apiUrl?: string;
    sandbox?: boolean;
}

export const PeachPaymentsConfigSchema = z.object({
    entityId: z.string().min(1),
    username: z.string().min(1),
    password: z.string().min(1),
    environment: z.nativeEnum(PeachEnvironment),
    timeout: z.number().positive().optional(),
    retries: z.number().positive().optional(),
    // Legacy support
    apiUrl: z.string().url().optional(),
    sandbox: z.boolean().optional(),
});

// Peach Payments API URLs by environment
export const PEACH_API_URLS = {
    [PeachEnvironment.SANDBOX]: 'https://testapi-v2.peachpayments.com',
    [PeachEnvironment.PRODUCTION]: 'https://api-v2.peachpayments.com',
} as const;

// Peach Payments API request/response types
export interface PeachPaymentRequest {
    entityId: string;
    amount: string;
    currency: string;
    paymentType: string;
    testMode?: string;
    merchantTransactionId?: string;
    customer?: {
        merchantCustomerId?: string;
        givenName?: string;
        surname?: string;
        email?: string;
        phone?: string;
    };
    billing?: {
        street1: string;
        city: string;
        state?: string;
        postcode: string;
        country: string;
    };
    card?: {
        number: string;
        holder: string;
        expiryMonth: string;
        expiryYear: string;
        cvv: string;
    };
    shopperResultUrl?: string;
    notificationUrl?: string;
}

export interface PeachPaymentResponse {
    id: string;
    paymentType: string;
    paymentBrand?: string;
    amount: string;
    currency: string;
    descriptor?: string;
    result: {
        code: string;
        description: string;
    };
    resultDetails?: {
        ExtendedDescription?: string;
        AcquirerResponse?: string;
    };
    card?: {
        bin: string;
        last4Digits: string;
        holder: string;
        expiryMonth: string;
        expiryYear: string;
    };
    risk?: {
        score: string;
    };
    buildNumber: string;
    timestamp: string;
    ndc: string;
    redirectUrl?: string;
}

export interface PeachRefundRequest {
    entityId: string;
    amount: string;
    currency: string;
    paymentType: 'RF'; // Refund
    testMode?: string;
}

export interface PeachRefundResponse {
    id: string;
    paymentType: string;
    amount: string;
    currency: string;
    result: {
        code: string;
        description: string;
    };
    buildNumber: string;
    timestamp: string;
    ndc: string;
}

export interface PeachStatusResponse {
    id: string;
    paymentType: string;
    paymentBrand?: string;
    amount: string;
    currency: string;
    descriptor?: string;
    result: {
        code: string;
        description: string;
    };
    resultDetails?: {
        ExtendedDescription?: string;
        AcquirerResponse?: string;
    };
    buildNumber: string;
    timestamp: string;
    ndc: string;
}

// Peach Payments status codes mapping
export const PEACH_STATUS_CODES = {
    // Successful transactions
    SUCCESS_CODES: [
        '000.000.000', // Transaction succeeded
        '000.000.100', // Successfully created checkout
        '000.100.110', // Request successfully processed
        '000.100.111', // Request successfully processed
        '000.100.112', // Request successfully processed
    ],

    // Pending transactions
    PENDING_CODES: [
        '000.200.000', // Transaction pending
        '800.400.500', // Direct Debit transaction pending
        '900.100.300', // Transaction in progress
    ],

    // Rejected transactions
    REJECTED_CODES: [
        '000.400.000', // Transaction declined
        '000.400.010', // Invalid card number
        '000.400.020', // Invalid expiry date
        '000.400.030', // Invalid CVV
        '000.400.040', // Invalid card holder
        '000.400.050', // Transaction declined by issuing bank
        '000.400.060', // Transaction declined due to risk
        '000.400.070', // Transaction declined due to fraud
        '000.400.080', // Transaction declined due to velocity
        '000.400.090', // Transaction declined due to amount limit
        '000.400.100', // Transaction declined due to invalid request
    ],

    // Error codes
    ERROR_CODES: [
        '200.300.404', // Invalid or missing parameter
        '800.300.401', // Invalid authentication
        '900.400.500', // System error
    ],
} as const;

export type PeachStatusCode = string;
