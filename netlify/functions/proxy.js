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

    let responseData = response.data;
    
    if (typeof responseData === 'string') {
      try {
        // --- INÍCIO DA CORREÇÃO FINAL ---
        // Limpa a string de JSON para remover "trailing commas" inválidas
        const cleanedJsonString = responseData.replace(/,(\s*[}\]])/g, '$1');
        
        // Tenta fazer o parse da string JÁ CORRIGIDA
        responseData = JSON.parse(cleanedJsonString);
        // --- FIM DA CORREÇÃO FINAL ---
      } catch (e) {
        console.error("Mesmo após a limpeza, não foi possível fazer o parse do JSON.", e);
      }
    }

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