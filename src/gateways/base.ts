import {
    PaymentRequest,
    PaymentResponse,
    RefundRequest,
    RefundResponse,
    PaymentGatewayConfig,
    PaymentStatus,
} from '../types/common';

export interface PaymentGateway {
    readonly name: string;
    readonly supportedMethods: string[];

    /**
     * Process a payment
     */
    processPayment(request: PaymentRequest): Promise<PaymentResponse>;

    /**
     * Get payment status by ID
     */
    getPaymentStatus(paymentId: string): Promise<PaymentResponse>;

    /**
     * Process a refund
     */
    processRefund(request: RefundRequest): Promise<RefundResponse>;

    /**
     * Get refund status by ID
     */
    getRefundStatus(refundId: string): Promise<RefundResponse>;

    /**
     * Validate gateway configuration
     */
    validateConfig(): boolean;

    /**
     * Check if gateway supports a specific payment method
     */
    supportsPaymentMethod(method: string): boolean;
}

export abstract class BasePaymentGateway implements PaymentGateway {
    abstract readonly name: string;
    abstract readonly supportedMethods: string[];

    protected config: PaymentGatewayConfig;

    constructor(config: PaymentGatewayConfig) {
        this.config = config;
    }

    abstract processPayment(request: PaymentRequest): Promise<PaymentResponse>;
    abstract getPaymentStatus(paymentId: string): Promise<PaymentResponse>;
    abstract processRefund(request: RefundRequest): Promise<RefundResponse>;
    abstract getRefundStatus(refundId: string): Promise<RefundResponse>;
    abstract validateConfig(): boolean;

    public supportsPaymentMethod(method: string): boolean {
        return this.supportedMethods.includes(method);
    }

    protected getApiUrl(): string {
        return this.config.apiUrl;
    }

    protected isSandbox(): boolean {
        return this.config.sandbox;
    }

    protected getTimeout(): number {
        return this.config.timeout || 30000; // 30 seconds default
    }

    protected getRetries(): number {
        return this.config.retries || 3;
    }

    /**
     * Helper method to map gateway-specific status to our standard status
     */
    protected abstract mapPaymentStatus(gatewayStatus: string): PaymentStatus;

    /**
     * Helper method to generate a unique reference if not provided
     */
    protected generateReference(): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `${this.name.toLowerCase()}-${timestamp}-${random}`;
    }
}
