const express = require('express'); //Importando o Express para criar e gerenciar as rotas
const router = express.Router(); //Criando um Router para trabalhar com as rotas relacionadas aos empréstimos
const { dbConfig } = require('../db'); //Importando a função de configuração para conexão com o MySQL
const mysql = require('mysql2/promise'); //Importando o MySQL com Promises
const { authenticateToken, isAdmin } = require('../middlewares/auth');  //Importando os middlewares de autenticação

//Registrar empréstimo de livro (apenas para bibliotecários)
//POST: Define a rota para adicionar empréstimos
//AuthenticateToken e isAdmin: Com esses middlewares, somente um usuário autenticado e admin pode adicionar empréstimos
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    const { isbn, registration, loan_date, due_date } = req.body; //req.body: contém os dados do corpo da requisição

    try {
        const connection = await mysql.createConnection(dbConfig); //Criando a conexão assíncrona com o banco de dados e aguardando ela ser concluída (await)

        //Verificar se o livro está disponível para empréstimo usando o isbn
        const [books] = await connection.query('SELECT isbn, available FROM books WHERE isbn = ?', [isbn]);

        //Livro não encontrado
        if (books.length === 0) {
            await connection.end();
            return res.status(404).json({ message: 'Livro não encontrado' });
        }

        //Livro não possui cópias disponíveis para empréstimo
        if (books[0].available <= 0) {
            await connection.end();
            return res.status(400).json({ message: 'Livro não disponível para empréstimo' });
        }

        //Verificar se o usuário existe utilizando o registration
        const [users] = await connection.query('SELECT registration FROM users WHERE registration = ?', [registration]);
        if (users.length === 0) {
            await connection.end();
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        //Registrando o empréstimo 
        const [result] = await connection.query(
            'INSERT INTO loans (book_isbn, user_registration, loan_date, due_date) VALUES (?, ?, ?, ?)',
            [isbn, registration, loan_date, due_date]
        );

        //Atualizar a quantidade de livros disponíveis
        await connection.query('UPDATE books SET available = available - 1 WHERE isbn = ?', [isbn]);

        await connection.end();

        //Retornar o id do empréstimo recém-inserido
        res.json({ message: 'Empréstimo registrado', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Registrar devolução de livro (apenas para bibliotecários)
//POST: Define a rota para adicionar a devolução
//AuthenticateToken e isAdmin: Com esses middlewares, somente um usuário autenticado e admin podem alterar o status de empréstimos
router.post('/:id/return', authenticateToken, isAdmin, async (req, res) => {
    const loanId = req.params.id; //Extraindo o ID da requisição
    const return_date = new Date().toISOString().split('T')[0];  //Data atual no formato YYYY-MM-DD

    try {
        const connection = await mysql.createConnection(dbConfig); //Criando a conexão assíncrona com o banco de dados e aguardando ela ser concluída (await)

        //Buscar empréstimo pelo ID
        const [loans] = await connection.query('SELECT * FROM loans WHERE id = ?', [loanId]);
        if (loans.length === 0) {
            return res.status(404).json({ message: 'Empréstimo não encontrado' });
        }

        const loan = loans[0];

        //Verificar se já foi devolvido
        if (loan.status === 'devolvido') {
            return res.status(400).json({ message: 'Empréstimo já devolvido' });
        }

        //Função padrão para calcular multa, se houver atraso
        const due = new Date(loan.due_date);
        const returned = new Date(return_date);
        let fine = 0;
        if (returned > due) {
            const diffDays = Math.ceil((returned - due) / (1000 * 60 * 60 * 24));  //Diferença em dias
            fine = diffDays * 2; //Exemplo de multa: R$2 por dia de atraso
        }

        //Atualizar o empréstimo
        await connection.query('UPDATE loans SET return_date = ?, status = ?, fine = ? WHERE id = ?',
            [return_date, 'devolvido', fine, loanId]);

        //Atualizar a quantidade de livros disponíveis
        await connection.query('UPDATE books SET available = available + 1 WHERE isbn = ?', [loan.book_isbn]);

        await connection.end();

        res.json({ message: 'Devolução registrada', fine });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Listar empréstimos (disponível para qualquer usuário autenticado)
//GET: Define uma rota que recupera os empréstimos (consulta de dados)
//AuthenticateToken: é o middleware que verifica se o usuário está autenticado. A rota exige essa autenticação
router.get('/', authenticateToken, async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig); //Criando a conexão assíncrona com o banco de dados e aguardando ela ser concluída (await)
        const [rows] = await connection.query('SELECT * FROM loans'); //Consulta simples de todos os empréstimos ativos no momento
        await connection.end();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Listar empréstimos de um usuário específico por registration
//GET: Define uma rota que recupera os empréstimos de um usuário
//authenticateToken: A rota exige autenticação do usuário
router.get('/:user_registration', authenticateToken, async (req, res) => {
    //Extraindo o parâmetro user_registration da URL da requisição
    const {user_registration} = req.params;

    try {
        //Cria a conexão com o banco de dados
        const connection = await mysql.createConnection(dbConfig);

        //Busca todos os empréstimos vinculados ao registration indicado na requisição
        const [rows] = await connection.query('SELECT * FROM loans WHERE user_registration = ?', [user_registration]);

        //Encerra a conexão
        await connection.end();

        //Se nenhum empréstimo for encontrado, retorna uma mensagem de erro 404
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Nenhum empréstimo encontrado para este usuário' });
        }
        
        //Retorna a lista de empréstimos encontrada
        res.json(rows);
    } catch (err) {
        //Em caso de erro, retorna um status 500 com a mensagem de erro
        res.status(500).json({ error: err.message });
    }
});

module.exports = router; //Exportando o router para ser usado pelos demais arquivos
