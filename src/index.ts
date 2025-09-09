// Main SDK exports
export { PayLens, PayLensConfig } from './client';

// Gateway exports
export { PaymentGateway, BasePaymentGateway } from './gateways/base';
export { PeachPaymentsGateway } from './gateways/peach/client';
export { PeachPaymentsConfig, PeachEnvironment } from './gateways/peach/types';

// Type exports
export {
    PaymentRequest,
    PaymentResponse,
    RefundRequest,
    RefundResponse,
    Amount,
    Customer,
    BillingAddress,
    CardDetails,
    PaymentStatus,
    PaymentMethod,
    Currency,
    PaymentGatewayConfig,
} from './types/common';

// Error exports
export {
    PayLensError,
    ValidationError,
    AuthenticationError,
    PaymentError,
    NetworkError,
    ConfigurationError,
    GatewayError,
    RefundError,
    createValidationError,
    createPaymentError,
    createNetworkError,
    createGatewayError,
} from './errors';

// Utility exports
export { HttpClient } from './utils/http';

// Re-export schemas for validation
export {
    PaymentRequestSchema,
    RefundRequestSchema,
    CustomerSchema,
    BillingAddressSchema,
    CardDetailsSchema,
    AmountObjectSchema,
} from './types/common';
