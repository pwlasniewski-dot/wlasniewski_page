// Native fetch in Node 18+

async function triggerWebhook() {
    try {
        const orderId = '9'; // User's order ID from URL

        console.log(`Triggering Webhook for Order ${orderId}...`);

        const payload = {
            order: {
                orderId: `MANUAL_SIMULATION_${Date.now()}`,
                extOrderId: orderId, // This matches our DB ID
                status: 'COMPLETED',
                totalAmount: 1000, // 10.00 PLN dummy
                products: [{ name: 'Simulation', unitPrice: 1000, quantity: 1 }],
                description: 'Manual Trigger'
            }
        };

        const response = await fetch('http://localhost:3000/api/payu/notify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Server returned ${response.status}: ${text}`);
        }

        const data = await response.json();
        console.log("Success! Server Response:", data);
        console.log("Email should be sent now.");

    } catch (error) {
        console.error("Failed to trigger webhook:", error);
    }
}

triggerWebhook();
