// Mensagem para ver se o server.js está funcionando corretamente
console.log('[APP] app.js carregado');

const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const requestId = require('./middlewares/requestId');

const userRoutes = require('./routes/users');   // Rota de usuários
const bookRoutes = require('./routes/books');   // Rota de livros
const loanRoutes = require('./routes/loans');   // Rota de empréstimos
const reportRoutes = require('./routes/reports'); // Rota de relatórios

const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

// --- MIDDLEWARES GLOBAIS ---
app.use(bodyParser.json());

// Primeiro, gerar o ID único
app.use(requestId);

// Criando pasta de logs (se não existir)
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

// Criando stream para o arquivo access.log
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' } // 'a' = append (não sobrescreve o arquivo)
);

// Registrar o token :id pro Morgan (pra ele imprimir o req.id)
morgan.token('id', (req) => req.id);

// Log bonito no console com o requestId
app.use(morgan(':method :url :status :response-time ms - :res[content-length] reqId=:id'));

// Log completo no arquivo (formato padrão “combined”)
app.use(morgan('combined', { stream: accessLogStream }));

// --- ROTAS PRINCIPAIS ---
app.use('/users', userRoutes);
app.use('/books', bookRoutes);
app.use('/loans', loanRoutes);
app.use('/reports', reportRoutes);

// --- TRATAMENTO DE ERROS ---
app.use(notFound);
app.use(errorHandler);

module.exports = app; // Exportando o app para uso no server.js

