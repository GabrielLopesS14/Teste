const jwt = require('jsonwebtoken'); //Importando a biblioteca jsonwebtoken que verifica e decodifica tokens JSON Web Token usados pra autenticar o usuário em rotas protegidas
const { dbConfig } = require('../db'); //Importando as configurações para conexão com o banco. Usuários são armazenados no banco
const mysql = require('mysql2/promise'); //Importando o MySQL com Promisses(retorno da operação assíncrona)

const SECRET_KEY = 'chave_secreta_biblioteca';  //A chave secreta para assinar o JWT

//Middleware para autenticar o token JWT
async function authenticateToken(req, res, next) {
    //Pegando o token da requisição no cabeçalho Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];  //Pega o token após "Bearer "

    if (!token) return res.status(401).json({ message: 'Token não fornecido' }); //Erro pra quando não encontra o token

    try {
        //Verificando o token usando a chave secreta
        const payload = jwt.verify(token, SECRET_KEY);

        //Conecta ao banco de dados e verifica se o usuário existe por meio do e-mail
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', [payload.email]);

        await connection.end();

        if (rows.length === 0) return res.status(401).json({ message: 'Usuário não encontrado' }); //Erro pra quando não encontra o usuário (não cadastrado)

        //Passa os dados do usuário para a próxima função
        req.user = rows[0]; //Adiciona os dados do usuário na requisição
        next();  //Chama a próxima função na sequência
    } catch (err) {
        //Se o token for inválido, retorna um erro
        return res.status(403).json({ message: 'Token inválido' });
    }
}

//Middleware para verificar se o usuário é um bibliotecário (admin)
//Análisa o role do usuário para verificar se ele é um admin
function isAdmin(req, res, next) {
    //Verifica se o usuário autenticado tem o papel 'admin'
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso restrito a bibliotecários' });
    }

    next();  //Se for admin, prossegue para a próxima função
}

module.exports = { authenticateToken, isAdmin, SECRET_KEY }; //Exportando os middlewares e a secret key para ser usado nas próximas funções
