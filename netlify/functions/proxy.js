const axios = require('axios');

exports.handler = async function (event, context) {
  // Define os cabeçalhos CORS para permitir que seu chat acesse esta função
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Responde à requisição de verificação 'OPTIONS' do navegador
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  // Extrai os dados da requisição que vem do seu chat
  let requestData;
  try {
    requestData = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Corpo da requisição inválido. Esperado um JSON.' })
    };
  }
  
  const { targetUrl, method, headers: customHeaders, body: requestBody } = requestData;

  if (!targetUrl) {
    return { 
      statusCode: 400, 
      headers: corsHeaders, 
      body: JSON.stringify({ error: 'Parâmetro "targetUrl" ausente.' }) 
    };
  }

  try {
    // A função faz a requisição para a API externa
    const response = await axios({
      url: targetUrl,
      method: method || 'GET',
      data: requestBody,
      headers: customHeaders,
      timeout: 15000 
    });

    // Retorna a resposta da API externa para o seu chat (em caso de SUCESSO)
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Erro no proxy da Netlify:', error.message);
    
    // --- PONTO DA CORREÇÃO ---
    // Retorna uma resposta de erro, mas AGORA INCLUINDO OS CABEÇALHOS CORS
    return {
      statusCode: error.response?.status || 500,
      headers: corsHeaders, // <--- ESTA LINHA FOI ADICIONADA AQUI
      body: JSON.stringify({ error: `Falha na requisição proxy: ${error.message}` })
    };
  }
};