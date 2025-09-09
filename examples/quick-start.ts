/**
 * Quick Start Example
 * 
 * This example shows the most basic usage of the PayLens SDK
 * to process a payment with Peach Payments.
 */

import { PayLens, Currency, PaymentMethod, PeachEnvironment } from '../src';

async function quickStart(): Promise<void> {
    // Initialize the SDK with your Peach Payments credentials
    const payLens = new PayLens({
        peachPayments: {
            entityId: 'your-entity-id',
            username: 'your-username',
            password: 'your-password',
            environment: PeachEnvironment.SANDBOX, // or PeachEnvironment.PRODUCTION
        },
    });

    try {
        // Process a simple card payment
        const result = await payLens.processPayment({
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
                number: '4111111111111111', // Test card
                expiryMonth: '12',
                expiryYear: '25',
                cvv: '123',
                holderName: 'John Doe',
            },
            reference: 'TEST-PAYMENT-001',
            description: 'Test payment',
        });

        console.log('Payment Result:', {
            id: result.id,
            status: result.status,
            amount: result.amount,
        });

        // Check payment status
        if (result.status === 'completed') {
            console.log('✅ Payment successful!');
        } else if (result.status === 'processing') {
            console.log('⏳ Payment is processing...');

            // You can poll for status updates
            const statusUpdate = await payLens.getPaymentStatus(result.id);
            console.log('Updated status:', statusUpdate.status);
        } else {
            console.log('❌ Payment failed:', result.failureReason);
        }

    } catch (error) {
        console.error('Payment failed:', error);
    }
}

// Run the example
if (require.main === module) {
    quickStart().catch(console.error);
}

export { quickStart };
