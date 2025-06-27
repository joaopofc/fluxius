const axios = require('axios');

exports.handler = async function (event, context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

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
    const response = await axios({
      url: targetUrl,
      method: method || 'GET',
      data: requestBody,
      headers: customHeaders,
      timeout: 15000 
    });

    // --- INÍCIO DA ETAPA DE DEBUG ---
    console.log("--- DEBUG INICIADO ---");
    console.log("1. TIPO da resposta recebida da API externa:", typeof response.data);
    console.log("2. CONTEÚDO BRUTO recebido da API externa:", response.data);

    let responseData = response.data;
    if (typeof responseData === 'string') {
      try {
        responseData = JSON.parse(responseData);
        console.log("3. CONTEÚDO APÓS JSON.parse:", responseData);
      } catch (e) {
        console.log("3. FALHOU ao tentar fazer JSON.parse. A resposta não é um JSON válido.");
      }
    }

    const bodyToReturn = JSON.stringify(responseData);
    console.log("4. CORPO FINAL sendo enviado de volta para o chat:", bodyToReturn);
    console.log("--- DEBUG FINALIZADO ---");
    // --- FIM DA ETAPA DE DEBUG ---

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: bodyToReturn
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