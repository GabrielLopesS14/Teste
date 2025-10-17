// middlewares/requestId.js
const { v4: uuidv4 } = require('uuid');  // importa a função v4 e dá o nome uuidv4

function requestId(req, res, next) {
  req.id = uuidv4();                     // gera um ID único (ex.: "a1b2c3-...")
  res.setHeader('X-Request-Id', req.id); // envia esse ID no cabeçalho da resposta
  next();                                 // entrega a requisição pro próximo middleware/rota
}

module.exports = requestId;               // exporta pra usar no app.js
