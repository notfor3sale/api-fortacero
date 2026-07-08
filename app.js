const express = require('express');
const cors = require('cors');

const { Configuration, OrdersApi } = require('conekta');

const app = express();
app.use(express.json());
app.use(cors());

const config = new Configuration({
    accessToken: "key_7BV1gdyCTZrKsxRxZNy2dhz"
});

const ordersApi = new OrdersApi(config);

app.get('/', (req, res) => {
    res.status(200).send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>API Gateway | Fortacero</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    background-color: #f4f7f6;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                }
                .api-container {
                    background-color: #ffffff;
                    max-width: 450px;
                    width: 90%;
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
                    padding: 35px;
                    text-align: center;
                    box-sizing: border-box;
                    border-top: 5px solid #321fdb;
                }
                .icon-container {
                    width: 60px;
                    height: 60px;
                    background-color: #e1e8ff;
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin: 0 auto 20px auto;
                }
                .icon-container svg {
                    width: 30px;
                    height: 30px;
                    fill: #321fdb;
                }
                h1 {
                    color: #333333;
                    font-size: 22px;
                    font-weight: 600;
                    margin: 0 0 10px 0;
                }
                p {
                    color: #666666;
                    font-size: 14px;
                    line-height: 1.5;
                    margin: 0 0 25px 0;
                }
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background-color: #e6f7ed;
                    color: #1e7e34;
                    padding: 8px 18px;
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 600;
                    border: 1px solid #c3e6cb;
                }
                .status-dot {
                    width: 8px;
                    height: 8px;
                    background-color: #28a745;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }
                .footer-text {
                    margin-top: 25px;
                    font-size: 11px;
                    color: #999999;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .dev-credits {
                    margin-top: 8px;
                    font-size: 12px;
                    color: #777777;
                }
                .dev-credits a {
                    color: #321fdb;
                    text-decoration: none;
                    font-weight: 500;
                }
                .dev-credits a:hover {
                    text-decoration: underline;
                }
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(40, 167, 69, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
                }
            </style>
        </head>
        <body>

        <div class="api-container">
            <div class="icon-container">
                <svg viewBox="0 0 24 24">
                    <path d="M20 13c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h16zm-11-5c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm3 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm8 11c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h16zm-11-5c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm3 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
                </svg>
            </div>
            <h1>API de Cobros Fortacero</h1>
            <p>El entorno de producción se encuentra activo, escuchando peticiones y enlazado correctamente al gateway seguro de Conekta.</p>
            
            <div class="status-badge">
                <div class="status-dot"></div>
                <span>Servicios Activos</span>
            </div>
            
            <div class="footer-text">Fortacero © 2026</div>
            <div class="dev-credits">Desarrollado por <a href="https://frontdigit.net" target="_blank">frontdigit.net</a></div>
        </div>

        </body>
        </html>
    `);
});

// Endpoint de cobro con tarjeta directo
app.post('/cobro-conekta', async (req, res) => {
    try {
        console.log("--> DATOS RECIBIDOS EN BACKEND (CONEKTA):", req.body);
        const { token, email, name, amount, description } = req.body;

        // Conekta maneja los montos en CENTAVOS (Ej: $3.00 MXN = 300 centavos)
        const amountInCents = Math.round(parseFloat(amount) * 100);

        const orderRequest = {
            currency: "MXN",
            customer_info: {
                name: name || "Cliente Fortacero",
                email: email
            },
            line_items: [{
                name: description || "Compra Web Fortacero",
                unit_price: amountInCents,
                quantity: 1
            }],
            charges: [{
                payment_method: {
                    type: "card",
                    token_id: token // Token seguro generado por el frontend en cPanel
                }
            }]
        };

        const response = await ordersApi.createOrder(orderRequest);
        const order = response.data;

        if (order.payment_status === 'paid') {
            return res.status(200).json({ success: true, status: order.payment_status, order_id: order.id });
        } else {
            return res.status(400).json({ success: false, status: order.payment_status, error: "El pago no pudo ser procesado." });
        }

    } catch (error) {
        console.error("Error completo en Conekta:", error);
        const errorDetails = error.response?.data?.details?.[0]?.message || error.message;
        return res.status(500).json({ success: false, error: errorDetails });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de Conekta activo en puerto ${PORT}`);
});
