const axios = require('axios');

exports.handler = async function (event, context) {
  // Define os cabeçalhos CORS para permitir que seu chat acesse esta função
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  // O navegador envia uma requisição 'OPTIONS' antes de um POST/PUT para verificar as regras de CORS.
  // Aqui nós respondemos que ele pode prosseguir.
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  // O corpo da requisição que seu chat vai enviar para este proxy
  const { targetUrl, method, headers: customHeaders, body: requestBody } = JSON.parse(event.body);

  if (!targetUrl) {
    return { statusCode: 400, body: 'Parâmetro "targetUrl" ausente.' };
  }

  try {
    // A função faz a requisição para a API externa com os dados recebidos
    const response = await axios({
      url: targetUrl,
      method: method || 'GET',
      data: requestBody,
      headers: customHeaders,
      timeout: 10000 // Tempo limite de 10 segundos
    });

    // Retorna a resposta da API externa de volta para o seu chat
    return {
      statusCode: 200,
      headers, // Adiciona os cabeçalhos CORS na resposta final
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Erro no proxy da Netlify:', error.message);
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({ error: `Falha na requisição proxy: ${error.message}` })
    };
  }
};