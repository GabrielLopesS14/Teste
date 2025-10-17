// A vantagem em se trabalhar com o Morgan é que ele vai padronizar o retorno de algum possivel erro
// E vai facilitar e muito o debug do FrontEnd, que sempre agora ira receber o JSON


// Aqui a funcao é chamada quando nenhuma URL requisitada corresponde a URL do sistema
// Retorna um JSON claro e organizado
function notFound(req, res, next) {
    console.log('[404] notFound atingido para', req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.originalUrl
  });
}

// Aqui, interceptamos quaisquer erro que possa ocorrer nas rotas e exbindo no console um log organizado
// Aqui ira permitir que o servidor nao quebre com erros nao tratados
function errorHandler(err, req, res, next) {
  // Exibe o erro no console (log padronizado)
  console.error('[ERROR]', {
    method: req.method,
    path: req.originalUrl,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });

  const status = err.status || err.statusCode || 500;

  res.status(status).json({
    success: false,
    message: status === 500 ? 'Erro interno do servidor' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}

module.exports = { notFound, errorHandler };
