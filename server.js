require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios'); // ✅ Substitui o SDK do Mercado Pago

const app = express();
app.use(cors());

// Usar o raw body para validar assinatura do Stripe
app.use('/webhook', express.raw({ type: 'application/json' }));

// Para outras rotas
app.use(express.json());

// Firebase Admin
const serviceAccount = {
  type: process.env.FB_TYPE,
  project_id: process.env.FB_PROJECT_ID,
  private_key_id: process.env.FB_PRIVATE_KEY_ID,
  private_key: process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FB_CLIENT_EMAIL,
  client_id: process.env.FB_CLIENT_ID,
  auth_uri: process.env.FB_AUTH_URI,
  token_uri: process.env.FB_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FB_AUTH_PROVIDER_CERT,
  client_x509_cert_url: process.env.FB_CLIENT_CERT,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FB_DATABASE_URL,
});

const db = admin.database();

// Rota para salvar novos usuários
app.post('/usuarios', async (req, res) => {
  try {
    const { nome, email } = req.body;
    if (!nome || !email) {
      return res.status(400).json({ erro: 'Nome e email são obrigatórios' });
    }

    const ref = db.ref('usuarios');
    const novoUsuarioRef = ref.push();
    await novoUsuarioRef.set({ nome, email, criadoEm: Date.now() });

    res.status(201).json({ mensagem: 'Usuário criado com sucesso', id: novoUsuarioRef.key });
  } catch (error) {
    console.error('Erro ao salvar usuário:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
});

// Webhook do Stripe
app.post('/webhook_stp', (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'invoice.paid') {
    const email = event.data.object.customer_email;
    console.log('Pagamento confirmado. Email:', email);

    const ref = db.ref('usuarios');
    ref.once('value', (snapshot) => {
      const usuarios = snapshot.val();
      for (const id in usuarios) {
        if (usuarios[id].email === email) {
          console.log(`🔄 Atualizando plano do usuário ${id}`);
          ref.child(id).update({ plano: 'premium' });
          break;
        }
      }
    });
  }

  res.status(200).send('Evento recebido com sucesso');
});

// Webhook do Mercado Pago (sem SDK)
app.post('/webhook_mp', async (req, res) => {
  try {
    const body = req.body;
    if (body.type === 'payment' && body.data?.id) {
      const paymentId = body.data.id;

      const tokenValid = "APP_USR-4128571484840245-051411-4e2440590f5e3a407cc718aecec17f6e-1361831608";

      const response = await axios.get(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${tokenValid}`
          }
        }
      );

      const payment = response.data;

      if (payment.status === 'approved' && payment.payment_type_id === 'pix') {
        const email = payment.payer?.email;
        console.log('✅ PIX aprovado pelo Mercado Pago. Email:', email);

        if (email) {
          const ref = db.ref('usuarios');
          ref.once('value', (snapshot) => {
            const usuarios = snapshot.val();
            for (const id in usuarios) {
              if (usuarios[id].email === email) {
                console.log(`🔄 Atualizando plano do usuário ${id}`);
                ref.child(id).update({ plano: 'premium' });
                break;
              }
            }
          });
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Erro no webhook do Mercado Pago:', error?.response?.data || error.message);
    res.sendStatus(500);
  }
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
