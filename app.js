const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Payment } = require('mercadopago');

const app = express();
app.use(express.json());
app.use(cors());

// Inicialización con tu variable de entorno de producción (APP_USR-...)
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN 
});

const payment = new Payment(client);

// Test rápido de salud
app.get('/', (req, res) => {
    res.status(200).send("API de Cobros Fortacero activa y corriendo en Render.");
});

// Endpoint principal corregido para producción
app.post('/cobro-2d', async (req, res) => {
    try {
        console.log("--> DATOS RECIBIDOS EN BACKEND:", req.body);

        const { token, paymentMethodId, email, amount, description } = req.body;

        // Estructura oficial requerida por el SDK v2 de Mercado Pago
        const paymentData = {
            body: {
                transaction_amount: Number(amount),
                token: token,
                description: description || 'Compra Web Fortacero', 
                installments: 1,
                payment_method_id: String(paymentMethodId).toLowerCase(), // Asegura minúsculas puras
                payer: {
                    email: email
                }
            },
            // Forzar en los headers de la petición el entorno limpio
            requestOptions: {
                idempotencyKey: 'key_' + token // Evita duplicidad de cobros
            }
        };

        const result = await payment.create(paymentData);

        if (result.status === 'approved') {
            return res.status(200).json({ success: true, status: result.status });
        } else {
            // Si es rechazado por fondos, fraude, etc., nos dará el detalle real de la tarjeta
            return res.status(400).json({ success: false, status: result.status, error: result.status_detail });
        }

    } catch (error) {
        console.error("Error completo de Mercado Pago:", error);
        // Si la API responde con un array de errores internos, lo pintamos en Render
        const errorMsg = error.cause && error.cause[0] ? error.cause[0].description : error.message;
        return res.status(500).json({ success: false, error: errorMsg });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor activo en puerto ${PORT}`);
});
