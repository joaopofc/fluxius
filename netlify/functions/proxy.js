const axios = require('axios');

exports.handler = async function (event, context) {
  // Define os cabeçalhos CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Responde à requisição de verificação 'OPTIONS'
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  // Valida o corpo da requisição do chat
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
    // Faz a requisição para a API externa
    const response = await axios({
      url: targetUrl,
      method: method || 'GET',
      data: requestBody,
      headers: customHeaders,
      timeout: 15000 
    });

    // --- INÍCIO DA CORREÇÃO ---
    let responseData = response.data;
    
    // Se a resposta da API for uma string, tentamos convertê-la para um objeto JSON.
    if (typeof responseData === 'string') {
      try {
        responseData = JSON.parse(responseData);
      } catch (e) {
        // Se não for um JSON válido, não há problema. Deixamos como está.
        // Isso pode ser útil se a API retornar apenas um texto simples.
      }
    }
    // --- FIM DA CORREÇÃO ---

    // Retorna a resposta (agora como um objeto, se possível) para o chat
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(responseData)
    };
  } catch (error) {
    console.error('Erro no proxy da Netlify:', error.message);
    return {
      statusCode: error.response?.status || 500,
      headers: corsHeaders, 
      body: JSON.stringify({ error: `Falha na requisição proxy: ${error.message}` })
    };
  }
};