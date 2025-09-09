import { PeachPaymentsGateway } from '../gateways/peach/client';
import { PeachEnvironment } from '../gateways/peach/types';
import { PaymentMethod, PaymentStatus } from '../types/common';
import { ValidationError } from '../errors';

// Mock axios
jest.mock('axios', () => ({
    create: jest.fn(() => ({
        interceptors: {
            request: { use: jest.fn() },
            response: { use: jest.fn() },
        },
        defaults: { headers: {} },
        post: jest.fn(),
        get: jest.fn(),
    })),
}));

describe('PeachPaymentsGateway', () => {
    const validConfig = {
        entityId: 'test-entity-123',
        username: 'test-user',
        password: 'test-password',
        environment: PeachEnvironment.SANDBOX,
    };

    describe('initialization', () => {
        it('should initialize with valid config', () => {
            expect(() => new PeachPaymentsGateway(validConfig)).not.toThrow();
        });

        it('should throw validation error with invalid config', () => {
            const invalidConfig = {
                entityId: '',
                username: 'test-user',
                password: 'test-password',
                environment: 'invalid' as any,
            };

            expect(() => new PeachPaymentsGateway(invalidConfig)).toThrow(ValidationError);
        });

        it('should have correct name and supported methods', () => {
            const gateway = new PeachPaymentsGateway(validConfig);
            expect(gateway.name).toBe('PeachPayments');
            expect(gateway.supportedMethods).toContain(PaymentMethod.CARD);
            expect(gateway.supportedMethods).toContain(PaymentMethod.EFT);
            expect(gateway.supportedMethods).toContain(PaymentMethod.MOBILE_WALLET);
        });
    });

    describe('payment method support', () => {
        let gateway: PeachPaymentsGateway;

        beforeEach(() => {
            gateway = new PeachPaymentsGateway(validConfig);
        });

        it('should support card payments', () => {
            expect(gateway.supportsPaymentMethod(PaymentMethod.CARD)).toBe(true);
        });

        it('should support EFT payments', () => {
            expect(gateway.supportsPaymentMethod(PaymentMethod.EFT)).toBe(true);
        });

        it('should support mobile wallet payments', () => {
            expect(gateway.supportsPaymentMethod(PaymentMethod.MOBILE_WALLET)).toBe(true);
        });

        it('should not support unsupported payment methods', () => {
            expect(gateway.supportsPaymentMethod('CRYPTO')).toBe(false);
        });
    });

    describe('configuration validation', () => {
        let gateway: PeachPaymentsGateway;

        beforeEach(() => {
            gateway = new PeachPaymentsGateway(validConfig);
        });

        it('should validate correct configuration', () => {
            expect(gateway.validateConfig()).toBe(true);
        });
    });

    describe('status mapping', () => {
        let gateway: PeachPaymentsGateway;

        beforeEach(() => {
            gateway = new PeachPaymentsGateway(validConfig);
        });

        it('should map success codes correctly', () => {
            // Access protected method for testing
            const mapStatus = (gateway as any).mapPaymentStatus.bind(gateway);

            expect(mapStatus('000.000.000')).toBe(PaymentStatus.COMPLETED);
            expect(mapStatus('000.000.100')).toBe(PaymentStatus.COMPLETED);
            expect(mapStatus('000.100.110')).toBe(PaymentStatus.COMPLETED);
        });

        it('should map pending codes correctly', () => {
            const mapStatus = (gateway as any).mapPaymentStatus.bind(gateway);

            expect(mapStatus('000.200.000')).toBe(PaymentStatus.PROCESSING);
            expect(mapStatus('800.400.500')).toBe(PaymentStatus.PROCESSING);
            expect(mapStatus('900.100.300')).toBe(PaymentStatus.PROCESSING);
        });

        it('should map failed codes correctly', () => {
            const mapStatus = (gateway as any).mapPaymentStatus.bind(gateway);

            expect(mapStatus('000.400.000')).toBe(PaymentStatus.FAILED);
            expect(mapStatus('000.400.010')).toBe(PaymentStatus.FAILED);
            expect(mapStatus('200.300.404')).toBe(PaymentStatus.FAILED);
        });

        it('should default to pending for unknown codes', () => {
            const mapStatus = (gateway as any).mapPaymentStatus.bind(gateway);

            expect(mapStatus('999.999.999')).toBe(PaymentStatus.PENDING);
        });
    });
});
