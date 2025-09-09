/**
 * Basic Payment Processing Example
 * 
 * This example demonstrates how to process a simple card payment
 * using the PayLens SDK with Peach Payments.
 */

import { PayLens, Currency, PaymentMethod, PaymentStatus, PeachEnvironment } from '../src';

async function basicPaymentExample(): Promise<void> {
    // Initialize the SDK
    const payLens = new PayLens({
        peachPayments: {
            entityId: process.env.PEACH_ENTITY_ID || 'your-entity-id',
            username: process.env.PEACH_USERNAME || 'your-username',
            password: process.env.PEACH_PASSWORD || 'your-password',
            environment: PeachEnvironment.SANDBOX, // or PeachEnvironment.PRODUCTION for live
            timeout: 30000,
            retries: 3,
        },
    });

    try {
        console.log('Processing payment...');

        // Process a card payment
        const paymentResult = await payLens.processPayment({
            amount: {
                value: 149.99,
                currency: Currency.ZAR,
            },
            customer: {
                email: 'john.doe@example.com',
                firstName: 'John',
                lastName: 'Doe',
                phone: '+27123456789',
            },
            paymentMethod: PaymentMethod.CARD,
            cardDetails: {
                number: '4111111111111111', // Test card number
                expiryMonth: '12',
                expiryYear: '25',
                cvv: '123',
                holderName: 'John Doe',
            },
            billingAddress: {
                line1: '123 Long Street',
                line2: 'Apartment 4B',
                city: 'Cape Town',
                state: 'Western Cape',
                postalCode: '8001',
                country: 'ZA',
            },
            reference: `ORDER-${Date.now()}`,
            description: 'Online store purchase',
            returnUrl: 'https://yourstore.com/payment/return',
            webhookUrl: 'https://yourstore.com/webhooks/payment',
            metadata: {
                orderId: '12345',
                customerId: 'CUST-789',
                source: 'web',
            },
        });

        console.log('Payment Result:', {
            id: paymentResult.id,
            status: paymentResult.status,
            amount: paymentResult.amount,
            reference: paymentResult.reference,
            createdAt: paymentResult.createdAt,
        });

        // Check if payment was successful
        if (paymentResult.status === PaymentStatus.COMPLETED) {
            console.log('✅ Payment completed successfully!');

            // You might want to update your database, send confirmation email, etc.
            await handleSuccessfulPayment(paymentResult);

        } else if (paymentResult.status === PaymentStatus.PROCESSING) {
            console.log('⏳ Payment is being processed...');

            // Poll for status updates or wait for webhook
            await pollPaymentStatus(payLens, paymentResult.id);

        } else if (paymentResult.status === PaymentStatus.FAILED) {
            console.log('❌ Payment failed:', paymentResult.failureReason);

            // Handle failed payment
            await handleFailedPayment(paymentResult);
        }

    } catch (error) {
        console.error('Payment processing failed:', error);

        // Handle different error types
        if (error instanceof Error) {
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                // Add any additional error properties
            });
        }
    }
}

async function handleSuccessfulPayment(payment: any): Promise<void> {
    console.log('Handling successful payment...');

    // Example: Update order status in database
    // await updateOrderStatus(payment.reference, 'paid');

    // Example: Send confirmation email
    // await sendPaymentConfirmation(payment.customer.email, payment);

    // Example: Trigger fulfillment process
    // await triggerFulfillment(payment.reference);
}

async function handleFailedPayment(payment: any): Promise<void> {
    console.log('Handling failed payment...');

    // Example: Log failure for analysis
    // await logPaymentFailure(payment);

    // Example: Send failure notification
    // await sendPaymentFailureNotification(payment.customer.email, payment);
}

async function pollPaymentStatus(payLens: PayLens, paymentId: string): Promise<void> {
    console.log('Polling payment status...');

    let attempts = 0;
    const maxAttempts = 10;
    const pollInterval = 5000; // 5 seconds

    while (attempts < maxAttempts) {
        try {
            await new Promise(resolve => setTimeout(resolve, pollInterval));

            const status = await payLens.getPaymentStatus(paymentId);
            console.log(`Status check ${attempts + 1}:`, status.status);

            if (status.status === PaymentStatus.COMPLETED) {
                console.log('✅ Payment completed!');
                await handleSuccessfulPayment(status);
                break;
            } else if (status.status === PaymentStatus.FAILED) {
                console.log('❌ Payment failed!');
                await handleFailedPayment(status);
                break;
            }

            attempts++;
        } catch (error) {
            console.error('Error polling payment status:', error);
            attempts++;
        }
    }

    if (attempts >= maxAttempts) {
        console.log('⚠️ Payment status polling timed out');
    }
}

// Run the example
if (require.main === module) {
    basicPaymentExample().catch(console.error);
}

export { basicPaymentExample };
