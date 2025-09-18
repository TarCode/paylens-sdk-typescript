# PayLens TypeScript SDK

A unified TypeScript SDK for integrating multiple South African payment gateways. Currently supports Peach Payments with plans to add PayFast, Ozow, Yoco, and other major South African payment providers.

## Features

- 🔧 **Unified Interface**: Single API for multiple payment gateways
- 🛡️ **Type Safety**: Full TypeScript support with runtime validation
- 🚀 **Modern Architecture**: Built with async/await and ES modules
- 🧪 **Well Tested**: Comprehensive test suite with Jest
- 📦 **Modular**: Use only the gateways you need
- 🔒 **Secure**: Built-in security best practices
- 🌍 **South African Focus**: Optimized for South African payment methods

## Supported Payment Gateways

- ✅ **Peach Payments** - Cards, EFT, Mobile Wallets
- 🔜 **PayFast** (Coming Soon)
- 🔜 **Ozow** (Coming Soon)
- 🔜 **Yoco** (Coming Soon)


## Quick Start

### Basic Setup

```typescript
import { PayLens, Currency, PaymentMethod, PeachEnvironment } from '@paylens/sdk';

const payLens = new PayLens({
  peachPayments: {
    entityId: 'your-entity-id',
    username: 'your-username',
    password: 'your-password',
    environment: PeachEnvironment.SANDBOX, // or PeachEnvironment.PRODUCTION
  },
});
```

### Process a Card Payment

```typescript
try {
  const paymentResult = await payLens.processPayment({
    amount: {
      value: 100.00,
      currency: Currency.ZAR,
    },
    customer: {
      email: 'customer@example.com',
      firstName: 'John',
      lastName: 'Doe',
    },
    paymentMethod: PaymentMethod.CARD,
    cardDetails: {
      number: '4111111111111111',
      expiryMonth: '12',
      expiryYear: '25',
      cvv: '123',
      holderName: 'John Doe',
    },
    billingAddress: {
      line1: '123 Main Street',
      city: 'Cape Town',
      postalCode: '8001',
      country: 'ZA',
    },
    reference: 'ORDER-123',
    description: 'Test payment',
  });

  console.log('Payment processed:', paymentResult);
} catch (error) {
  console.error('Payment failed:', error);
}
```

### Check Payment Status

```typescript
try {
  const paymentStatus = await payLens.getPaymentStatus('payment-id');
  console.log('Payment status:', paymentStatus.status);
} catch (error) {
  console.error('Failed to get payment status:', error);
}
```

### Process a Refund

```typescript
try {
  const refundResult = await payLens.processRefund({
    paymentId: 'payment-id',
    amount: {
      value: 50.00, // Partial refund
      currency: Currency.ZAR,
    },
    reason: 'Customer request',
    reference: 'REFUND-123',
  });

  console.log('Refund processed:', refundResult);
} catch (error) {
  console.error('Refund failed:', error);
}
```

## Gateway-Specific Usage

### Using a Specific Gateway

```typescript
// Process payment with a specific gateway
const result = await payLens.processPayment(paymentRequest, 'peach');

// Set default gateway
payLens.setDefaultGateway('peach');
```

### Gateway Information

```typescript
// Check available gateways
const gateways = payLens.getAvailableGateways();
console.log('Available gateways:', gateways);

// Get gateway capabilities
const gatewayInfo = payLens.getGatewayInfo('peach');
console.log('Supported methods:', gatewayInfo.supportedMethods);

// Check if gateway is available
if (payLens.isGatewayAvailable('peach')) {
  // Process payment
}
```

## Configuration

### Peach Payments Configuration

```typescript
import { PeachEnvironment } from '@paylens/sdk';

interface PeachPaymentsConfig {
  entityId: string;                    // Your Peach Payments entity ID
  username: string;                    // API username
  password: string;                    // API password
  environment: PeachEnvironment;       // SANDBOX or PRODUCTION
  timeout?: number;                    // Request timeout in ms (default: 30000)
  retries?: number;                    // Number of retries (default: 3)
}
```

### Environment Configuration

Simply specify the environment and the SDK will automatically use the correct URLs:

```typescript
// For testing
environment: PeachEnvironment.SANDBOX    // Uses: https://testapi-v2.peachpayments.com

// For production
environment: PeachEnvironment.PRODUCTION // Uses: https://api-v2.peachpayments.com
```

### Legacy Configuration Support

The SDK still supports the old format for backward compatibility:

```typescript
// Legacy format (still works but deprecated)
const payLens = new PayLens({
  peachPayments: {
    entityId: 'your-entity-id',
    username: 'your-username',
    password: 'your-password',
    apiUrl: 'https://testapi-v2.peachpayments.com',
    sandbox: true,
  },
});
```

## Error Handling

The SDK provides comprehensive error handling with specific error types:

```typescript
import { 
  ValidationError, 
  PaymentError, 
  NetworkError, 
  AuthenticationError 
} from '@paylens/sdk';

try {
  const result = await payLens.processPayment(paymentRequest);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation error:', error.message, error.field);
  } else if (error instanceof PaymentError) {
    console.error('Payment error:', error.message, error.gatewayCode);
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message, error.statusCode);
  } else if (error instanceof AuthenticationError) {
    console.error('Authentication error:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

## TypeScript Support

The SDK is built with TypeScript and provides full type safety:

```typescript
import { 
  PaymentRequest, 
  PaymentResponse, 
  PaymentStatus, 
  Currency 
} from '@paylens/sdk';

const request: PaymentRequest = {
  // TypeScript will validate this object
};
```

## Testing

The SDK includes comprehensive test coverage. To run tests:

```bash
npm test
# or
yarn test
```

## Examples

Check out the [examples directory](./examples) for more detailed usage examples:

- [Basic Payment Processing](./examples/basic-payment.ts)
- [Error Handling](./examples/error-handling.ts)
- [Multiple Gateways](./examples/multiple-gateways.ts)
- [Webhooks](./examples/webhooks.ts)

## Roadmap

- [ ] PayFast integration
- [ ] Ozow integration
- [ ] Yoco integration
- [ ] Stitch Money integration
- [ ] Webhook verification utilities
- [ ] Payment method tokenization
- [ ] Subscription/recurring payments
- [ ] Enhanced fraud detection

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: tarcode33@gmail.com
- 📚 Documentation: coming soon

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed list of changes.
