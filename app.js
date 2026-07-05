const express = require('express');
const cors = require('cors');
// 1. Cambiamos la importación aquí para usar la estructura oficial correcta
const { Configuration, OrdersApi } = require('conekta');

const app = express();
app.use(express.json());
app.use(cors());

// 2. Corregimos la inicialización usando la clase Configuration
const config = new Configuration({
    accessToken: process.env.CONEKTA_API_KEY
});

const ordersApi = new OrdersApi(config);

// Test rápido de salud de la API
app.get('/', (req, res) => {
    res.status(200).send("API de Cobros Fortacero activa y corriendo en Render con Conekta.");
});

// Endpoint de cobro con tarjeta directo
app.post('/cobro-conekta', async (req, res) => {
    try {
        console.log("--> DATOS RECIBIDOS EN BACKEND (CONEKTA):", req.body);
        const { token, email, name, amount, description } = req.body;

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
                    token_id: token
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
