const express = require('express'); //Importação do Express
const router = express.Router(); //Criando um novo Router que é responsável por gerenciar a rota de usuários
const mysql = require('mysql2/promise'); //Importando o mySQL com Promisses
const { dbConfig } = require('../db'); //Importando as configurações para conexão com o banco. Usuários são armazenados no banco
const bcrypt = require('bcrypt'); //Importando bcrypt: é usada para criptografar e comparar senhas de forma segura.
const jwt = require('jsonwebtoken'); //Importando o JSON WEB TOKEN: O token JWT será usado para garantir que o usuário está autenticado.
const { authenticateToken, isAdmin } = require('../middlewares/auth'); // Importando os middlewares de autenticação e autorização

//Registrar usuário (bibliotecário/admin ou usuário comum)
router.post('/register', async (req, res) => {
    const { name, cpf, registration, email, address, phone, role, password } = req.body;

    try {
        //Verificar se o papel é válido - Fazemos isso para não gerar problemas de cadastros futuros, pois o código só trabalha com admin ou user
        if (!['admin', 'user'].includes(role)) {
            return res.status(400).json({ message: 'Papel inválido. Use "admin" ou "user".' });
        }

        //Criptografar a senha
        const hashedPassword = await bcrypt.hash(password, 10); //10 indica o número de saltos feitos no bcrypt (aumenta a segurança)

        //Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        //Inserir o novo usuário no banco de dados
        const [result] = await connection.query(
            'INSERT INTO users (name, cpf, registration, email, address, phone, role, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [name, cpf, registration, email, address, phone, role, hashedPassword]
        );

        //Fechar a conexão
        await connection.end();

        //Resposta de sucesso
        res.json({ message: 'Usuário registrado com sucesso', registration: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message }); //Tratamento de erro
    }
});

//Login para obter JWT
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        //Conectar ao banco de dados
        const connection = await mysql.createConnection(dbConfig);

        //Buscar o usuário pelo e-mail
        const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);

        //Fechar a conexão
        await connection.end();

        if (rows.length === 0) {
            return res.status(400).json({ message: 'Usuário não encontrado' });
        }

        const user = rows[0];

        //Comparar a senha fornecida com a senha criptografada
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Senha incorreta' });
        }

        //Gerar o token JWT
        const token = jwt.sign({ email: user.email, registration: user.registration, role: user.role }, 'chave_secreta_biblioteca', { expiresIn: '1h' });

        //Retornar o token JWT
        res.json({ access_token: token, token_type: 'bearer' });
    } catch (err) {
        res.status(500).json({ error: err.message }); //Tratamento de errp
    }
});

//Deletar usuário (apenas para admin)
//DELETE: Define uma rota para deletar um usuário específico baseado no registration
//AuthenticateToken e isAdmin: Somente um usuário autenticado e admin pode deletar usuários
router.delete('/:registration', authenticateToken, isAdmin, async (req, res) => {
    const userRegistration = req.params.registration; //Obtendo o registration do usuário a ser deletado

    try {
        const connection = await mysql.createConnection(dbConfig); //Criando a conexão com o banco de dados

        //Verificar se o usuário existe
        const [user] = await connection.query('SELECT * FROM users WHERE registration = ?', [userRegistration]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        //Verificar se o usuário tem empréstimos não devolvidos
        const [loans] = await connection.query('SELECT * FROM loans WHERE user_registration = ? AND status = "emprestado"', [userRegistration]);
        if (loans.length > 0) {
            return res.status(400).json({ message: 'Usuário não pode ser deletado enquanto tiver empréstimos não devolvidos' });
        }

        //Deletar todos os empréstimos associados ao usuário
        await connection.query('DELETE FROM loans WHERE user_registration = ?', [userRegistration]);

        //Deletar o usuário
        await connection.query('DELETE FROM users WHERE registration = ?', [userRegistration]);

        await connection.end(); //Fechando a conexão com o banco

        //Enviando a resposta de sucesso
        res.json({ message: 'Usuário deletado com sucesso' });
    } catch (err) {
        res.status(500).json({ error: err.message }); //Tratamento de erros
    }
});

module.exports = router; //Exportando o router para os demais arquivos
