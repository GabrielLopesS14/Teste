//Index.js - Utilizado para configurar o servidor Express e definir as rotas da aplicação
//Permite rodar o servidor na prática para receber requisições

const express = require('express'); //Importantando o Express(framework para criar APIs e servidores WEB) - Utilizada essa solução devida a simplicidade
const bodyParser = require('body-parser'); //Importando o body-parser (Middleware usado para interpretar os dados de requisições HTTP)
const { initDB } = require('./db'); //Importação da função de inicialização do banco de dados vinda do arquivo db.js
const app = express(); //inicialização do servidor Expressa que será configurado para responder as requisições
const PORT = 3000; //Servidor rodando na porta 3000

app.use(bodyParser.json()); //Middleware para processar JSON: permite que o servidor interprete requisições com o corpo em formato JSON

//Inicializa o banco de dados e cria as tabelas
initDB();

//Rotas
const usersRoutes = require('./routes/users');  //Rota de usuários (registro e login)
const booksRoutes = require('./routes/books');  //Rota de livros (somente admin)
const loansRoutes = require('./routes/loans');  //Rota de empréstimos (somente admin)
const reportsRoutes = require('./routes/reports');  //Rota de relatórios

//Registrando as rotas no Express
app.use('/users', usersRoutes);  //Rota para usuários
app.use('/books', booksRoutes);  //Rota para livros
app.use('/loans', loansRoutes);  //Rota para empréstimos
app.use('/reports', reportsRoutes);  //Rota para relatórios

//O método app.use() define que, para qualquer requisição que venha para os caminhos /users, /books, /loans e /reports, o Express deve direcioná-las para os arquivos responsáveis pelas respectivas rotas. 
//Esses arquivos contêm a lógica para lidar com as requisições.
//EX: Quando o servidor recebe uma requisição para um caminho como /users, ele procura pelo arquivo /routes/users.js e executa o código que está lá. O código define as operações específicas

//Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
