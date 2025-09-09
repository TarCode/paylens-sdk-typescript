import { PaymentGateway } from './gateways/base';
import { PeachPaymentsGateway } from './gateways/peach/client';
import { PeachPaymentsConfig } from './gateways/peach/types';
import {
    PaymentRequest,
    PaymentResponse,
    RefundRequest,
    RefundResponse,
    PaymentRequestSchema,
    RefundRequestSchema,
} from './types/common';
import { ValidationError, ConfigurationError } from './errors';

export interface PayLensConfig {
    peachPayments?: PeachPaymentsConfig;
    // Future gateways will be added here
    // payfast?: PayFastConfig;
    // ozow?: OzowConfig;
    // yoco?: YocoConfig;
}

export class PayLens {
    private gateways: Map<string, PaymentGateway> = new Map();
    private defaultGateway?: string;

    constructor(config: PayLensConfig) {
        this.initializeGateways(config);
    }

    /**
     * Process a payment using the specified gateway or default gateway
     */
    async processPayment(
        request: PaymentRequest,
        gatewayName?: string
    ): Promise<PaymentResponse> {
        // Validate request
        const validationResult = PaymentRequestSchema.safeParse(request);
        if (!validationResult.success) {
            throw new ValidationError(
                `Invalid payment request: ${validationResult.error.message}`
            );
        }

        const gateway = this.getGateway(gatewayName);

        // Check if gateway supports the payment method
        if (!gateway.supportsPaymentMethod(request.paymentMethod)) {
            throw new ValidationError(
                `Gateway ${gateway.name} does not support payment method ${request.paymentMethod}`
            );
        }

        return gateway.processPayment(request);
    }

    /**
     * Get payment status from the specified gateway or default gateway
     */
    async getPaymentStatus(
        paymentId: string,
        gatewayName?: string
    ): Promise<PaymentResponse> {
        if (!paymentId?.trim()) {
            throw new ValidationError('Payment ID is required');
        }

        const gateway = this.getGateway(gatewayName);
        return gateway.getPaymentStatus(paymentId);
    }

    /**
     * Process a refund using the specified gateway or default gateway
     */
    async processRefund(
        request: RefundRequest,
        gatewayName?: string
    ): Promise<RefundResponse> {
        // Validate request
        const validationResult = RefundRequestSchema.safeParse(request);
        if (!validationResult.success) {
            throw new ValidationError(
                `Invalid refund request: ${validationResult.error.message}`
            );
        }

        const gateway = this.getGateway(gatewayName);
        return gateway.processRefund(request);
    }

    /**
     * Get refund status from the specified gateway or default gateway
     */
    async getRefundStatus(
        refundId: string,
        gatewayName?: string
    ): Promise<RefundResponse> {
        if (!refundId?.trim()) {
            throw new ValidationError('Refund ID is required');
        }

        const gateway = this.getGateway(gatewayName);
        return gateway.getRefundStatus(refundId);
    }

    /**
     * Get list of available gateways
     */
    getAvailableGateways(): string[] {
        return Array.from(this.gateways.keys());
    }

    /**
     * Get gateway information including supported payment methods
     */
    getGatewayInfo(gatewayName: string): { name: string; supportedMethods: string[] } {
        const gateway = this.gateways.get(gatewayName);
        if (!gateway) {
            throw new ConfigurationError(`Gateway ${gatewayName} not found`);
        }

        return {
            name: gateway.name,
            supportedMethods: gateway.supportedMethods,
        };
    }

    /**
     * Set the default gateway to use when no specific gateway is specified
     */
    setDefaultGateway(gatewayName: string): void {
        if (!this.gateways.has(gatewayName)) {
            throw new ConfigurationError(`Gateway ${gatewayName} not found`);
        }
        this.defaultGateway = gatewayName;
    }

    /**
     * Check if a specific gateway is available and configured
     */
    isGatewayAvailable(gatewayName: string): boolean {
        return this.gateways.has(gatewayName);
    }

    private initializeGateways(config: PayLensConfig): void {
        // Initialize Peach Payments if configured
        if (config.peachPayments) {
            try {
                const peachGateway = new PeachPaymentsGateway(config.peachPayments);
                this.gateways.set('peach', peachGateway);

                // Set as default if it's the first gateway
                if (!this.defaultGateway) {
                    this.defaultGateway = 'peach';
                }
            } catch (error) {
                throw new ConfigurationError(
                    `Failed to initialize Peach Payments gateway: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    'peachPayments',
                    error instanceof Error ? error : undefined
                );
            }
        }

        // Future gateways will be initialized here
        // if (config.payfast) { ... }
        // if (config.ozow) { ... }
        // if (config.yoco) { ... }

        if (this.gateways.size === 0) {
            throw new ConfigurationError(
                'No payment gateways configured. Please provide at least one gateway configuration.'
            );
        }
    }

    private getGateway(gatewayName?: string): PaymentGateway {
        const targetGateway = gatewayName || this.defaultGateway;

        if (!targetGateway) {
            throw new ConfigurationError(
                'No gateway specified and no default gateway set'
            );
        }

        const gateway = this.gateways.get(targetGateway);
        if (!gateway) {
            throw new ConfigurationError(
                `Gateway ${targetGateway} not found. Available gateways: ${this.getAvailableGateways().join(', ')}`
            );
        }

        return gateway;
    }
}
