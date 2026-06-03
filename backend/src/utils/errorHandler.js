// backend/src/utils/errorHandler.js

/**
 * Função global para padronizar as respostas de erro
 * @param {Object} res - O objeto de resposta (response) do Express
 * @param {Error} error - O objeto de erro capturado no catch
 * @param {String} defaultMessage - A mensagem amigável para o utilizador
 * @param {String} context - O nome do controlador para o log (ex: 'AppointmentController')
 * @param {Number} defaultStatusCode - O status HTTP padrão se não houver outro (ex: 500)
 */
const handleError = (res, error, defaultMessage, context = 'Server', defaultStatusCode = 500) => {
  // Imprime o erro no terminal para o programador ver
    console.error(`[${context}] ${defaultMessage}:`, error);

  // Verifica se a resposta já foi enviada ao cliente.
    if (res.headersSent) {
    return console.error(`[${context}] Aviso crítico: Tentativa de enviar erro após a resposta já ter sido enviada.`);
    }

  // 2. Tenta obter o status do próprio objeto de erro (error.status).
    const finalStatus = error.statusCode || error.status || defaultStatusCode;

  // 3. Envia a resposta limpa para o cliente
    return res.status(finalStatus).json({
    success: false,
    message: defaultMessage,
    error: error.message
    });
};

module.exports = { handleError };