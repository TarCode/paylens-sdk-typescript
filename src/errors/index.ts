export abstract class PayLensError extends Error {
    abstract readonly code: string;
    public readonly timestamp: Date;

    constructor(message: string, public readonly cause?: Error) {
        super(message);
        this.name = this.constructor.name;
        this.timestamp = new Date();

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export class ValidationError extends PayLensError {
    readonly code = 'VALIDATION_ERROR';

    constructor(message: string, public readonly field?: string, cause?: Error) {
        super(message, cause);
    }
}

export class AuthenticationError extends PayLensError {
    readonly code = 'AUTHENTICATION_ERROR';

    constructor(message: string = 'Authentication failed', cause?: Error) {
        super(message, cause);
    }
}

export class PaymentError extends PayLensError {
    readonly code = 'PAYMENT_ERROR';

    constructor(
        message: string,
        public readonly paymentId?: string,
        public readonly gatewayCode?: string,
        cause?: Error
    ) {
        super(message, cause);
    }
}

export class NetworkError extends PayLensError {
    readonly code = 'NETWORK_ERROR';

    constructor(
        message: string,
        public readonly statusCode?: number,
        public readonly response?: unknown,
        cause?: Error
    ) {
        super(message, cause);
    }
}

export class ConfigurationError extends PayLensError {
    readonly code = 'CONFIGURATION_ERROR';

    constructor(message: string, public readonly parameter?: string, cause?: Error) {
        super(message, cause);
    }
}

export class GatewayError extends PayLensError {
    readonly code = 'GATEWAY_ERROR';

    constructor(
        message: string,
        public readonly gateway: string,
        public readonly gatewayCode?: string,
        public readonly statusCode?: number,
        cause?: Error
    ) {
        super(message, cause);
    }
}

export class RefundError extends PayLensError {
    readonly code = 'REFUND_ERROR';

    constructor(
        message: string,
        public readonly paymentId?: string,
        public readonly refundId?: string,
        public readonly gatewayCode?: string,
        cause?: Error
    ) {
        super(message, cause);
    }
}

// Error factory functions
export const createValidationError = (message: string, field?: string): ValidationError => {
    return new ValidationError(message, field);
};

export const createPaymentError = (
    message: string,
    paymentId?: string,
    gatewayCode?: string
): PaymentError => {
    return new PaymentError(message, paymentId, gatewayCode);
};

export const createNetworkError = (
    message: string,
    statusCode?: number,
    response?: unknown
): NetworkError => {
    return new NetworkError(message, statusCode, response);
};

export const createGatewayError = (
    message: string,
    gateway: string,
    gatewayCode?: string,
    statusCode?: number
): GatewayError => {
    return new GatewayError(message, gateway, gatewayCode, statusCode);
};
