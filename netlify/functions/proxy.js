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
  
  // Usamos 'let' para que a targetUrl possa ser modificada
  let { targetUrl, method, headers: customHeaders, body: requestBody } = requestData;

  if (!targetUrl) {
    return { 
      statusCode: 400, 
      headers: corsHeaders, 
      body: JSON.stringify({ error: 'Parâmetro "targetUrl" ausente.' }) 
    };
  }

  // --- INÍCIO DA SOLUÇÃO GENÉRICA ---
  
  // A Netlify nos fornece o IP real do usuário neste cabeçalho
  const userIp = event.headers['x-nf-client-connection-ip'];

  // Se a URL contiver o placeholder {{CLIENT_IP}} e nós tivermos o IP do usuário,
  // substituímos o placeholder pelo IP real do cliente.
  if (userIp && targetUrl.includes('{{CLIENT_IP}}')) {
    console.log(`Placeholder de IP detectado. Substituindo {{CLIENT_IP}} por ${userIp}`);
    targetUrl = targetUrl.replace('{{CLIENT_IP}}', userIp);
  }
  
  // --- FIM DA SOLUÇÃO GENÉRICA ---

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
        const cleanedJsonString = responseData.replace(/,(\s*[}\]])/g, '$1');
        responseData = JSON.parse(cleanedJsonString);
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