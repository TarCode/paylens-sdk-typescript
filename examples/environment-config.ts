/**
 * Environment Configuration Example
 * 
 * This example demonstrates the new environment-based configuration
 * and shows backward compatibility with the legacy format.
 */

import { PayLens, Currency, PaymentMethod, PeachEnvironment } from '../src';

async function environmentConfigExample(): Promise<void> {
    console.log('=== Environment-Based Configuration ===');

    // ✅ NEW: Environment-based configuration (Recommended)
    const payLensSandbox = new PayLens({
        peachPayments: {
            entityId: 'your-entity-id',
            username: 'your-username',
            password: 'your-password',
            environment: PeachEnvironment.SANDBOX,
            timeout: 30000,
            retries: 3,
        },
    });

    const payLensProduction = new PayLens({
        peachPayments: {
            entityId: 'your-entity-id',
            username: 'your-username',
            password: 'your-password',
            environment: PeachEnvironment.PRODUCTION,
            timeout: 30000,
            retries: 3,
        },
    });

    console.log('✅ Sandbox SDK initialized');
    console.log('Available gateways:', payLensSandbox.getAvailableGateways());

    console.log('✅ Production SDK initialized');
    console.log('Available gateways:', payLensProduction.getAvailableGateways());

    console.log('\n=== Legacy Configuration Support ===');

    // 🔄 LEGACY: Still supported but will show deprecation warning
    const payLensLegacy = new PayLens({
        peachPayments: {
            entityId: 'your-entity-id',
            username: 'your-username',
            password: 'your-password',
            apiUrl: 'https://testapi-v2.peachpayments.com',
            sandbox: true,
            timeout: 30000,
            retries: 3,
        },
    });

    console.log('✅ Legacy SDK initialized (with deprecation warning)');
    console.log('Available gateways:', payLensLegacy.getAvailableGateways());

    console.log('\n=== Environment URLs Mapping ===');
    console.log('PeachEnvironment.SANDBOX     → https://testapi-v2.peachpayments.com');
    console.log('PeachEnvironment.PRODUCTION  → https://api-v2.peachpayments.com');

    console.log('\n=== Configuration Benefits ===');
    console.log('✅ No need to remember or hardcode URLs');
    console.log('✅ Automatic URL selection based on environment');
    console.log('✅ Type-safe environment selection');
    console.log('✅ Easier to switch between sandbox and production');
    console.log('✅ Reduces configuration errors');
    console.log('✅ Future-proof for additional environments');

    // Example payment processing with environment-based config
    try {
        console.log('\n=== Processing Test Payment ===');

        const result = await payLensSandbox.processPayment({
            amount: {
                value: 10.00,
                currency: Currency.ZAR,
            },
            customer: {
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
            },
            paymentMethod: PaymentMethod.CARD,
            cardDetails: {
                number: '4111111111111111', // Test card
                expiryMonth: '12',
                expiryYear: '25',
                cvv: '123',
                holderName: 'Test User',
            },
            reference: `ENV-TEST-${Date.now()}`,
            description: 'Environment configuration test payment',
        });

        console.log('Payment processed successfully:', {
            id: result.id,
            status: result.status,
            environment: 'sandbox',
        });

    } catch (error) {
        console.log('Payment processing demo (expected to fail with test credentials):', error instanceof Error ? error.message : error);
    }
}

// Environment configuration validation example
function validateEnvironmentConfig(): void {
    console.log('\n=== Configuration Validation ===');

    try {
        // This will work
        new PayLens({
            peachPayments: {
                entityId: 'test-entity',
                username: 'test-user',
                password: 'test-pass',
                environment: PeachEnvironment.SANDBOX,
            },
        });
        console.log('✅ Valid configuration accepted');
    } catch (error) {
        console.log('❌ Configuration error:', error);
    }

    try {
        // This will fail validation
        new PayLens({
            peachPayments: {
                entityId: '', // Invalid: empty string
                username: 'test-user',
                password: 'test-pass',
                environment: 'invalid' as any, // Invalid: not a valid environment
            },
        });
    } catch (error) {
        console.log('✅ Invalid configuration rejected:', error instanceof Error ? error.message : error);
    }
}

// Migration guide
function migrationGuide(): void {
    console.log('\n=== Migration Guide ===');
    console.log('');
    console.log('OLD FORMAT:');
    console.log('```typescript');
    console.log('const payLens = new PayLens({');
    console.log('  peachPayments: {');
    console.log('    entityId: "your-entity-id",');
    console.log('    username: "your-username",');
    console.log('    password: "your-password",');
    console.log('    apiUrl: "https://testapi-v2.peachpayments.com",');
    console.log('    sandbox: true,');
    console.log('  },');
    console.log('});');
    console.log('```');
    console.log('');
    console.log('NEW FORMAT:');
    console.log('```typescript');
    console.log('import { PeachEnvironment } from "@paylens/sdk";');
    console.log('');
    console.log('const payLens = new PayLens({');
    console.log('  peachPayments: {');
    console.log('    entityId: "your-entity-id",');
    console.log('    username: "your-username",');
    console.log('    password: "your-password",');
    console.log('    environment: PeachEnvironment.SANDBOX,');
    console.log('  },');
    console.log('});');
    console.log('```');
}

// Run the example
if (require.main === module) {
    environmentConfigExample()
        .then(() => validateEnvironmentConfig())
        .then(() => migrationGuide())
        .catch(console.error);
}

export { environmentConfigExample, validateEnvironmentConfig, migrationGuide };
