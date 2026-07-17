const express = require('express');
const cors = require('cors');
const { Conekta, OrdersApi } = require('conekta');

const conektaClient = new Conekta();
conektaClient.setApiKey(process.env.CONEKTA_PRIVATE_KEY); // La llave que guardaste en el Environment

const app = express();
app.use(cors());
app.use(express.json());

// Tu ruta principal (opcional, para cambiar el texto que ves en pantalla)
app.get('/', (req, res) => {
    res.send("API de Microservicios | Frontdigit - Conectado correctamente a Conekta.");
});

// El endpoint que procesará los cobros 2D
app.post('/cobro-2d', async (req, res) => {
    try {
        const { amount, description, token_id } = req.body;
        const ordersApi = new OrdersApi(conektaClient);

        const orderResponse = await ordersApi.createOrder({
            currency: 'MXN',
            customer_info: {
                name: 'Cliente Frontdigit',
                email: 'cliente@frontdigit.net',
                phone: '+523300000000'
            },
            line_items: [{
                name: description || 'Servicio Web',
                unit_price: Math.round(amount * 100), // En centavos (ej: $100 pesos = 10000)
                quantity: 1
            }],
            charges: [{
                payment_method: {
                    type: 'card',
                    token_id: token_id // Token de tarjeta generado en tu HTML
                }
            }]
        });

        res.json({ success: true, order_id: orderResponse.data.id });

    } catch (error) {
        console.error('Error en cobro 2D:', error.response?.data || error.message);
        res.status(400).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor Conekta listo en puerto ${PORT}`));
