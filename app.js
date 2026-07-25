const express = require('express');
const cors = require('cors');
const { Configuration, OrdersApi } = require('conekta');

const app = express();
app.use(express.json());
app.use(cors());

const PRIVATE_KEY = process.env.CONEKTA_PRIVATE_KEY || "key_9beUzWRaiGRL2oz0iIc7StX";

const config = new Configuration({
    accessToken: PRIVATE_KEY,
    apiKey: PRIVATE_KEY,
    middleware: [
        {
            pre: async (context) => {
                context.init.headers = {
                    ...context.init.headers,
                    "Authorization": `Bearer ${PRIVATE_KEY}`,
                    "Accept": "application/vnd.conekta-v2.0.0+json"
                };
            }
        }
    ]
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
                body { font-family: -apple-system, sans-serif; background-color: #f4f7f6; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .api-container { background-color: #ffffff; max-width: 450px; width: 90%; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); padding: 35px; text-align: center; border-top: 5px solid #321fdb; }
                h1 { color: #333333; font-size: 22px; margin-bottom: 10px; }
                p { color: #666666; font-size: 14px; }
                .status-badge { display: inline-flex; align-items: center; gap: 8px; background-color: #e6f7ed; color: #1e7e34; padding: 8px 18px; border-radius: 20px; font-size: 13px; font-weight: 600; }
                .status-dot { width: 8px; height: 8px; background-color: #28a745; border-radius: 50%; }
            </style>
        </head>
        <body>
        <div class="api-container">
            <h1>API de Cobros Fortacero</h1>
            <p>El entorno de producción se encuentra activo y enlazado correctamente al gateway seguro.</p>
            <div class="status-badge"><div class="status-dot"></div><span>Servicios Activos</span></div>
        </div>
        </body>
        </html>
    `);
});

app.post('/cobro-conekta', async (req, res) => {
    try {
        console.log("--> DATOS RECIBIDOS EN BACKEND (CONEKTA):", req.body);
        
        const { token, token_id, email, name, phone, amount, description } = req.body;
        const activeToken = token_id || token;

        if (!activeToken) {
            return res.status(400).json({ success: false, error: "Falta el token de la tarjeta generado por el frontend." });
        }

        const amountInCents = Math.round(parseFloat(amount) * 100);

        // FORMATEO DE TELÉFONO: Si el cliente escribe sus 10 dígitos (ej: 3312345678), le anteponemos el '+52' requerido por Conekta.
        let formattedPhone = phone ? phone.trim().replace(/\s+/g, '') : '';
        if (formattedPhone && !formattedPhone.startsWith('+')) {
            if (formattedPhone.startsWith('52') && formattedPhone.length === 12) {
                formattedPhone = '+' + formattedPhone;
            } else {
                formattedPhone = '+52' + formattedPhone;
            }
        }
        // Si no mandaron teléfono, dejamos uno de respaldo válido para que no rompa la estructura
        if (!formattedPhone) {
            formattedPhone = "+523300000000";
        }

        const orderRequest = {
            currency: "MXN",
            customer_info: {
                name: name || "Cliente Fortacero",
                email: email || "correo_vacio@fortacero.com",
                phone: formattedPhone // <-- Aquí se inyecta el teléfono real formateado
            },
            line_items: [{
                name: description || "Compra Web Fortacero",
                unit_price: amountInCents,
                quantity: 1
            }],
            charges: [{
                payment_method: {
                    type: "card",
                    token_id: activeToken
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
        
        if (error.response?.data?.details) {
            console.log("--> DETALLES DE VALIDACIÓN DE PARÁMETROS:");
            error.response.data.details.forEach((det, index) => {
                console.log(`[Error ${index}]: ${det.message} en el campo ${det.param}`);
            });
        }
        
        const errorDetails = error.response?.data?.details?.[0]?.message || error.message;
        return res.status(500).json({ success: false, error: errorDetails });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de Conekta activo en puerto ${PORT}`);
});
