const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Payment } = require('mercadopago');

const app = express();
app.use(express.json());
app.use(cors());

// Se inicializa usando variables de entorno globales
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN 
});

const payment = new Payment(client);

// Test rápido para verificar salud de la API
app.get('/', (req, res) => {
    res.status(200).send("API de Cobros Fortacero activa y corriendo en Render.");
});

// Endpoint principal de cobro
app.post('/cobro-2d', async (req, res) => {
    try {
        const { token, paymentMethodId, issuerId, email, amount, description } = req.body;

        const paymentData = {
            body: {
                transaction_amount: parseFloat(amount),
                token: token,
                description: description || 'Compra Web Fortacero', 
                installments: 1,
                payment_method_id: paymentMethodId,
                issuer_id: issuerId !== "default" && issuerId ? Number(issuerId) : undefined,
                payer: {
                    email: email
                },
                three_d_secure_mode: 'not_supported' // Forzar 2D directo
            }
        };

        const result = await payment.create(paymentData);

        if (result.status === 'approved') {
            return res.status(200).json({ success: true, status: result.status });
        } else {
            return res.status(400).json({ success: false, status: result.status, error: result.status_detail });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor activo en puerto ${PORT}`);
});