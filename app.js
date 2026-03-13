const express = require('express');
const app = express();

app.use(express.json());

// --- Cashfree Credentials will be read from environment variables ---

app.post('/create-order', async (req, res) => {
    try {
        console.log('--- Order Creation Started ---');
        console.log('APP_ID Present:', !!process.env.CASHFREE_APP_ID);
        console.log('SECRET_KEY Present:', !!process.env.CASHFREE_SECRET_KEY);

        if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
            console.error('❌ ERROR: Missing Cashfree credentials in environment variables.');
            return res.status(500).json({ 
                error: 'Missing API credentials. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in Vercel environment variables.',
                code: 'MISSING_CREDS'
            });
        }

        const response = await fetch('https://sandbox.cashfree.com/pg/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-version': '2023-08-01',
                'x-client-id': process.env.CASHFREE_APP_ID,
                'x-client-secret': process.env.CASHFREE_SECRET_KEY
            },
            body: JSON.stringify({
                order_amount: 10.00,
                order_currency: 'INR',
                order_id: 'order_test_' + Date.now(), 
                customer_details: {
                    customer_id: 'test_user_123',
                    customer_phone: '9999999999',
                    customer_name: 'Test User'
                },
                order_meta: {
                    return_url: req.headers.origin + '/?status=success' 
                }
            })
        });

        const data = await response.json();
        console.log('Cashfree Response:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error('❌ Cashfree API Error:', data.message || 'Unknown error');
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error('❌ Server Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cashfree Sandbox Test</title>
        <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
        <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f6f9fb; margin: 0; }
            .checkout-box { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: center; }
            button { background: #6200ea; color: white; border: none; padding: 12px 24px; font-size: 16px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s; }
            button:hover { background: #3700b3; }
            .success-msg { color: green; font-weight: bold; display: none; margin-bottom: 15px; }
        </style>
    </head>
    <body>
        <div class="checkout-box">
            <div id="success-msg" class="success-msg">Sandbox Payment Successful!</div>
            <h2>Test Payment (Sandbox)</h2>
            <p style="color: #555; margin-bottom: 25px;">Total Amount: <strong>₹10.00</strong></p>
            <button id="pay-btn">Pay Now</button>
        </div>

        <script>
            if (window.location.search.includes('status=success')) {
                document.getElementById('success-msg').style.display = 'block';
            }

            // Switched back to Sandbox mode!
            const cashfree = Cashfree({ mode: "sandbox" });

            document.getElementById('pay-btn').addEventListener('click', async () => {
                const payBtn = document.getElementById('pay-btn');
                payBtn.disabled = true;
                payBtn.innerText = 'Processing...';

                try {
                    const response = await fetch('/create-order', { method: 'POST' });
                    const orderData = await response.json();

                    if (orderData.payment_session_id) {
                        cashfree.checkout({ paymentSessionId: orderData.payment_session_id });
                    } else {
                        const errorMsg = orderData.message || orderData.error || "Unknown error";
                        alert("Error: " + errorMsg);
                        console.error("Order Creation Failed:", orderData);
                    }
                } catch (error) {
                    alert("Network Error: " + error.message);
                    console.error("Error:", error);
                } finally {
                    payBtn.disabled = false;
                    payBtn.innerText = 'Pay Now';
                }
            });
        </script>
    </body>
    </html>
    `;
    res.send(htmlContent);
});

app.listen(3000, () => {
    console.log('✅ Server running in SANDBOX TEST mode!');
});