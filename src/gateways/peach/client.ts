import { BasePaymentGateway } from '../base';
import { HttpClient } from '../../utils/http';
import {
    PaymentRequest,
    PaymentResponse,
    RefundRequest,
    RefundResponse,
    PaymentStatus,
    PaymentMethod,
    PaymentGatewayConfig,
} from '../../types/common';
import {
    PeachPaymentsConfig,
    PeachPaymentsConfigSchema,
    PeachEnvironment,
    PEACH_API_URLS,
    PeachPaymentRequest,
    PeachPaymentResponse,
    PeachRefundRequest,
    PeachRefundResponse,
    PeachStatusResponse,
    PEACH_STATUS_CODES,
} from './types';
import {
    ValidationError,
    PaymentError,
    RefundError,
} from '../../errors';

export class PeachPaymentsGateway extends BasePaymentGateway {
    readonly name = 'PeachPayments';
    readonly supportedMethods = [
        PaymentMethod.CARD,
        PaymentMethod.EFT,
        PaymentMethod.MOBILE_WALLET,
    ];

    private httpClient: HttpClient;
    private peachConfig: PeachPaymentsConfig;

    constructor(config: PeachPaymentsConfig) {
        // Handle legacy configuration format and validation before calling super
        const normalizedConfig = PeachPaymentsGateway.normalizeConfig(config);

        // Validate normalized config
        const validationResult = PeachPaymentsConfigSchema.safeParse(normalizedConfig);
        if (!validationResult.success) {
            throw new ValidationError(
                `Invalid Peach Payments configuration: ${validationResult.error.message}`
            );
        }

        // Determine API URL based on environment
        const apiUrl = PeachPaymentsGateway.getApiUrlForConfig(normalizedConfig);
        const isSandbox = normalizedConfig.environment === PeachEnvironment.SANDBOX;

        // Convert Peach config to base config format
        const baseConfig: PaymentGatewayConfig = {
            apiUrl,
            sandbox: isSandbox,
            timeout: normalizedConfig.timeout,
            retries: normalizedConfig.retries,
        };

        super(baseConfig);

        this.peachConfig = normalizedConfig;
        this.httpClient = new HttpClient({
            baseURL: apiUrl,
            timeout: normalizedConfig.timeout,
            retries: normalizedConfig.retries,
            headers: {
                'Authorization': `Basic ${PeachPaymentsGateway.createAuthHeader(normalizedConfig)}`,
            },
        });
    }

    validateConfig(): boolean {
        try {
            PeachPaymentsConfigSchema.parse(this.peachConfig);
            return true;
        } catch {
            return false;
        }
    }

    async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
        try {
            const peachRequest = this.mapToPaymentRequest(request);

            const response = await this.httpClient.post<PeachPaymentResponse>(
                '/payments',
                peachRequest
            );

            return this.mapToPaymentResponse(response, request);
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }

            throw new PaymentError(
                `Payment processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                undefined,
                undefined,
                error instanceof Error ? error : undefined
            );
        }
    }

    async getPaymentStatus(paymentId: string): Promise<PaymentResponse> {
        try {
            const response = await this.httpClient.get<PeachStatusResponse>(
                `/payments/${paymentId}?entityId=${this.peachConfig.entityId}`
            );

            return this.mapStatusToPaymentResponse(response);
        } catch (error) {
            throw new PaymentError(
                `Failed to get payment status: ${error instanceof Error ? error.message : 'Unknown error'}`,
                paymentId,
                undefined,
                error instanceof Error ? error : undefined
            );
        }
    }

    async processRefund(request: RefundRequest): Promise<RefundResponse> {
        try {
            const peachRequest = this.mapToRefundRequest(request);

            const response = await this.httpClient.post<PeachRefundResponse>(
                `/payments/${request.paymentId}`,
                peachRequest
            );

            return this.mapToRefundResponse(response, request);
        } catch (error) {
            throw new RefundError(
                `Refund processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                request.paymentId,
                undefined,
                undefined,
                error instanceof Error ? error : undefined
            );
        }
    }

    async getRefundStatus(refundId: string): Promise<RefundResponse> {
        try {
            const response = await this.httpClient.get<PeachStatusResponse>(
                `/payments/${refundId}?entityId=${this.peachConfig.entityId}`
            );

            return this.mapStatusToRefundResponse(response);
        } catch (error) {
            throw new RefundError(
                `Failed to get refund status: ${error instanceof Error ? error.message : 'Unknown error'}`,
                undefined,
                refundId,
                undefined,
                error instanceof Error ? error : undefined
            );
        }
    }

    protected mapPaymentStatus(gatewayStatus: string): PaymentStatus {
        if (PEACH_STATUS_CODES.SUCCESS_CODES.includes(gatewayStatus as any)) {
            return PaymentStatus.COMPLETED;
        }

        if (PEACH_STATUS_CODES.PENDING_CODES.includes(gatewayStatus as any)) {
            return PaymentStatus.PROCESSING;
        }

        if (PEACH_STATUS_CODES.REJECTED_CODES.includes(gatewayStatus as any)) {
            return PaymentStatus.FAILED;
        }

        if (PEACH_STATUS_CODES.ERROR_CODES.includes(gatewayStatus as any)) {
            return PaymentStatus.FAILED;
        }

        // Default to pending for unknown codes
        return PaymentStatus.PENDING;
    }

    private static normalizeConfig(config: PeachPaymentsConfig): PeachPaymentsConfig {
        // Handle legacy configuration format
        if (config.apiUrl && config.sandbox !== undefined && !config.environment) {
            console.warn('[PayLens] Using legacy configuration format. Please migrate to environment-based configuration.');
            return {
                ...config,
                environment: config.sandbox ? PeachEnvironment.SANDBOX : PeachEnvironment.PRODUCTION,
            };
        }

        // Return config as-is if it's already using the new format
        return config;
    }

    private static getApiUrlForConfig(config: PeachPaymentsConfig): string {
        // If apiUrl is explicitly provided (legacy), use it
        if (config.apiUrl) {
            return config.apiUrl;
        }

        // Otherwise, determine URL based on environment
        return PEACH_API_URLS[config.environment];
    }

    private static createAuthHeader(config: PeachPaymentsConfig): string {
        const credentials = `${config.username}:${config.password}`;
        return Buffer.from(credentials).toString('base64');
    }


    private mapToPaymentRequest(request: PaymentRequest): PeachPaymentRequest {
        const peachRequest: PeachPaymentRequest = {
            entityId: this.peachConfig.entityId,
            amount: request.amount.value.toFixed(2),
            currency: request.amount.currency,
            paymentType: this.getPaymentType(request.paymentMethod),
            testMode: this.peachConfig.sandbox ? 'EXTERNAL' : undefined,
            merchantTransactionId: request.reference || this.generateReference(),
        };

        if (request.customer) {
            peachRequest.customer = {
                merchantCustomerId: request.customer.id,
                givenName: request.customer.firstName,
                surname: request.customer.lastName,
                email: request.customer.email,
                phone: request.customer.phone,
            };
        }

        if (request.billingAddress) {
            peachRequest.billing = {
                street1: request.billingAddress.line1,
                city: request.billingAddress.city,
                state: request.billingAddress.state,
                postcode: request.billingAddress.postalCode,
                country: request.billingAddress.country,
            };
        }

        if (request.cardDetails) {
            peachRequest.card = {
                number: request.cardDetails.number,
                holder: request.cardDetails.holderName || '',
                expiryMonth: request.cardDetails.expiryMonth,
                expiryYear: request.cardDetails.expiryYear,
                cvv: request.cardDetails.cvv,
            };
        }

        if (request.returnUrl) {
            peachRequest.shopperResultUrl = request.returnUrl;
        }

        if (request.webhookUrl) {
            peachRequest.notificationUrl = request.webhookUrl;
        }

        return peachRequest;
    }

    private mapToPaymentResponse(
        peachResponse: PeachPaymentResponse,
        originalRequest: PaymentRequest
    ): PaymentResponse {
        return {
            id: peachResponse.id,
            status: this.mapPaymentStatus(peachResponse.result.code),
            amount: originalRequest.amount,
            paymentMethod: originalRequest.paymentMethod,
            reference: originalRequest.reference,
            gatewayReference: peachResponse.id,
            createdAt: new Date(peachResponse.timestamp),
            metadata: {
                gatewayResponse: peachResponse,
                resultCode: peachResponse.result.code,
                resultDescription: peachResponse.result.description,
            },
            redirectUrl: peachResponse.redirectUrl,
            failureReason: this.mapPaymentStatus(peachResponse.result.code) === PaymentStatus.FAILED
                ? peachResponse.result.description
                : undefined,
        };
    }

    private mapStatusToPaymentResponse(peachResponse: PeachStatusResponse): PaymentResponse {
        return {
            id: peachResponse.id,
            status: this.mapPaymentStatus(peachResponse.result.code),
            amount: {
                value: parseFloat(peachResponse.amount),
                currency: peachResponse.currency as any, // TODO: Add proper currency validation
            },
            paymentMethod: this.mapPaymentBrandToMethod(peachResponse.paymentBrand),
            gatewayReference: peachResponse.id,
            createdAt: new Date(peachResponse.timestamp),
            metadata: {
                gatewayResponse: peachResponse,
                resultCode: peachResponse.result.code,
                resultDescription: peachResponse.result.description,
            },
            failureReason: this.mapPaymentStatus(peachResponse.result.code) === PaymentStatus.FAILED
                ? peachResponse.result.description
                : undefined,
        };
    }

    private mapToRefundRequest(request: RefundRequest): PeachRefundRequest {
        return {
            entityId: this.peachConfig.entityId,
            amount: request.amount?.value.toFixed(2) || '0.00', // Will be handled by Peach if amount not specified
            currency: request.amount?.currency || 'ZAR',
            paymentType: 'RF',
            testMode: this.peachConfig.sandbox ? 'EXTERNAL' : undefined,
        };
    }

    private mapToRefundResponse(
        peachResponse: PeachRefundResponse,
        originalRequest: RefundRequest
    ): RefundResponse {
        return {
            id: peachResponse.id,
            paymentId: originalRequest.paymentId,
            status: this.mapPaymentStatus(peachResponse.result.code),
            amount: {
                value: parseFloat(peachResponse.amount),
                currency: peachResponse.currency as any, // TODO: Add proper currency validation
            },
            reason: originalRequest.reason,
            reference: originalRequest.reference,
            gatewayReference: peachResponse.id,
            createdAt: new Date(peachResponse.timestamp),
            metadata: {
                gatewayResponse: peachResponse,
                resultCode: peachResponse.result.code,
                resultDescription: peachResponse.result.description,
            },
        };
    }

    private mapStatusToRefundResponse(peachResponse: PeachStatusResponse): RefundResponse {
        return {
            id: peachResponse.id,
            paymentId: '', // This would need to be tracked separately or retrieved from metadata
            status: this.mapPaymentStatus(peachResponse.result.code),
            amount: {
                value: parseFloat(peachResponse.amount),
                currency: peachResponse.currency as any, // TODO: Add proper currency validation
            },
            gatewayReference: peachResponse.id,
            createdAt: new Date(peachResponse.timestamp),
            metadata: {
                gatewayResponse: peachResponse,
                resultCode: peachResponse.result.code,
                resultDescription: peachResponse.result.description,
            },
        };
    }

    private getPaymentType(method: PaymentMethod): string {
        switch (method) {
            case PaymentMethod.CARD:
                return 'DB'; // Debit (immediate charge)
            case PaymentMethod.EFT:
                return 'DD'; // Direct Debit
            case PaymentMethod.MOBILE_WALLET:
                return 'DB'; // Treat as card payment for now
            default:
                return 'DB';
        }
    }

    private mapPaymentBrandToMethod(brand?: string): PaymentMethod {
        if (!brand) return PaymentMethod.CARD;

        const brandLower = brand.toLowerCase();
        if (brandLower.includes('visa') || brandLower.includes('mastercard') ||
            brandLower.includes('amex') || brandLower.includes('diners')) {
            return PaymentMethod.CARD;
        }

        if (brandLower.includes('eft') || brandLower.includes('bank')) {
            return PaymentMethod.EFT;
        }

        if (brandLower.includes('paypal') || brandLower.includes('wallet')) {
            return PaymentMethod.MOBILE_WALLET;
        }

        return PaymentMethod.CARD; // Default
    }
}
