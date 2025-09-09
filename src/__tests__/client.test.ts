import { PayLens } from '../client';
import { PeachPaymentsGateway } from '../gateways/peach/client';
import { PeachEnvironment } from '../gateways/peach/types';
import { PaymentMethod, Currency, PaymentStatus } from '../types/common';
import { ValidationError, ConfigurationError } from '../errors';

// Mock the PeachPaymentsGateway
jest.mock('../gateways/peach/client');

describe('PayLens Client', () => {
    const mockPeachConfig = {
        entityId: 'test-entity',
        username: 'test-user',
        password: 'test-pass',
        environment: PeachEnvironment.SANDBOX,
    };

    let payLens: PayLens;

    beforeEach(() => {
        jest.clearAllMocks();
        payLens = new PayLens({
            peachPayments: mockPeachConfig,
        });
    });

    describe('initialization', () => {
        it('should initialize with Peach Payments gateway', () => {
            expect(payLens.isGatewayAvailable('peach')).toBe(true);
            expect(payLens.getAvailableGateways()).toContain('peach');
        });

        it('should set Peach as default gateway', () => {
            // Mock the gateway info since we're mocking the constructor
            const mockGateway = {
                name: 'PeachPayments',
                supportedMethods: [PaymentMethod.CARD, PaymentMethod.EFT, PaymentMethod.MOBILE_WALLET],
            };

            (PeachPaymentsGateway as unknown as jest.Mock).mockImplementation(() => mockGateway);

            const testPayLens = new PayLens({ peachPayments: mockPeachConfig });
            const gatewayInfo = testPayLens.getGatewayInfo('peach');
            expect(gatewayInfo.name).toBe('PeachPayments');
        });

        it('should throw error when no gateways configured', () => {
            expect(() => new PayLens({})).toThrow(ConfigurationError);
        });
    });

    describe('payment processing', () => {
        const validPaymentRequest = {
            amount: { value: 100.00, currency: Currency.ZAR },
            customer: { email: 'test@example.com' },
            paymentMethod: PaymentMethod.CARD,
            cardDetails: {
                number: '4111111111111111',
                expiryMonth: '12',
                expiryYear: '25',
                cvv: '123',
            },
        };

        it('should validate payment request', async () => {
            const invalidRequest = {
                amount: { value: -100, currency: Currency.ZAR },
                customer: { email: 'invalid-email' },
                paymentMethod: PaymentMethod.CARD,
            };

            await expect(payLens.processPayment(invalidRequest)).rejects.toThrow(ValidationError);
        });

        it('should check payment method support', async () => {
            const mockGateway = {
                supportsPaymentMethod: jest.fn().mockReturnValue(false),
            };

            (PeachPaymentsGateway as unknown as jest.Mock).mockImplementation(() => mockGateway);

            const payLensWithMock = new PayLens({ peachPayments: mockPeachConfig });

            await expect(payLensWithMock.processPayment(validPaymentRequest)).rejects.toThrow(ValidationError);
            expect(mockGateway.supportsPaymentMethod).toHaveBeenCalledWith(PaymentMethod.CARD);
        });

        it('should process payment successfully', async () => {
            const mockResponse = {
                id: 'payment-123',
                status: PaymentStatus.COMPLETED,
                amount: { value: 100.00, currency: Currency.ZAR },
                paymentMethod: PaymentMethod.CARD,
                createdAt: new Date(),
            };

            const mockGateway = {
                supportsPaymentMethod: jest.fn().mockReturnValue(true),
                processPayment: jest.fn().mockResolvedValue(mockResponse),
            };

            (PeachPaymentsGateway as unknown as jest.Mock).mockImplementation(() => mockGateway);

            const payLensWithMock = new PayLens({ peachPayments: mockPeachConfig });
            const result = await payLensWithMock.processPayment(validPaymentRequest);

            expect(result).toEqual(mockResponse);
            expect(mockGateway.processPayment).toHaveBeenCalledWith(validPaymentRequest);
        });
    });

    describe('refund processing', () => {
        const validRefundRequest = {
            paymentId: 'payment-123',
            amount: { value: 50.00, currency: Currency.ZAR },
            reason: 'Customer request',
        };

        it('should validate refund request', async () => {
            const invalidRequest = {
                paymentId: '',
                amount: { value: -50, currency: Currency.ZAR },
            };

            await expect(payLens.processRefund(invalidRequest)).rejects.toThrow(ValidationError);
        });

        it('should process refund successfully', async () => {
            const mockResponse = {
                id: 'refund-123',
                paymentId: 'payment-123',
                status: PaymentStatus.COMPLETED,
                amount: { value: 50.00, currency: Currency.ZAR },
                createdAt: new Date(),
            };

            const mockGateway = {
                processRefund: jest.fn().mockResolvedValue(mockResponse),
            };

            (PeachPaymentsGateway as unknown as jest.Mock).mockImplementation(() => mockGateway);

            const payLensWithMock = new PayLens({ peachPayments: mockPeachConfig });
            const result = await payLensWithMock.processRefund(validRefundRequest);

            expect(result).toEqual(mockResponse);
            expect(mockGateway.processRefund).toHaveBeenCalledWith(validRefundRequest);
        });
    });

    describe('gateway management', () => {
        it('should get gateway info', () => {
            const info = payLens.getGatewayInfo('peach');
            expect(info).toHaveProperty('name');
            expect(info).toHaveProperty('supportedMethods');
        });

        it('should throw error for non-existent gateway', () => {
            expect(() => payLens.getGatewayInfo('nonexistent')).toThrow(ConfigurationError);
        });

        it('should set default gateway', () => {
            expect(() => payLens.setDefaultGateway('peach')).not.toThrow();
            expect(() => payLens.setDefaultGateway('nonexistent')).toThrow(ConfigurationError);
        });
    });
});
