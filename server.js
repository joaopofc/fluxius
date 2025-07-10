require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Config Firebase Admin
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

const db = admin.database(); // para Realtime Database
// Se usar Firestore:
// const db = admin.firestore();

app.post('/usuarios', async (req, res) => {
  try {
    const { nome, email } = req.body;
    if (!nome || !email) {
      return res.status(400).json({ erro: 'Nome e email são obrigatórios' });
    }

    // Cria um novo usuário com push (id automático)
    const ref = db.ref('usuarios');
    const novoUsuarioRef = ref.push();
    await novoUsuarioRef.set({ nome, email, criadoEm: Date.now() });

    res.status(201).json({ mensagem: 'Usuário criado com sucesso', id: novoUsuarioRef.key });
  } catch (error) {
    console.error('Erro ao salvar usuário:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
