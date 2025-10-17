const express = require('express'); //Importando o Express para criar e gerenciar as rotas
const router = express.Router(); //Criando um Router para trabalhar com as rotas relacionadas aos livros
const { dbConfig } = require('../db'); //Importando a função de configuração para conexão com o MySQL
const mysql = require('mysql2/promise'); //Importando o MySQL com Promises
const { authenticateToken, isAdmin } = require('../middlewares/auth'); //Importando os middlewares de autenticação

//Função utilitária para buscar um livro por ISBN (útil para a rota e para testes com mock)
//Retorna um objeto de livro (quando encontrado) ou null (quando não encontrado)
async function getBookByIsbn(isbn) {
    const connection = await mysql.createConnection(dbConfig); //Criando a conexão com o banco
    try {
        const [rows] = await connection.query('SELECT * FROM books WHERE isbn = ?', [isbn]); //Consulta segura por ISBN
        return rows.length ? rows[0] : null; //Se encontrou, retorna o primeiro registro; senão, null
    } finally {
        await connection.end(); //Fechando a conexão com o banco
    }
}

//Listar livros (apenas pesquisa, disponível para todos os usuários)
//GET: Define uma rota que recupera livros (consulta de dados)
//AuthenticateToken: é o middleware que verifica se o usuário está autenticado. A rota exige essa autenticação
router.get('/', authenticateToken, async (req, res) => {
    const { title, author, category, available, isbn, q} = req.query; //req.query contém os parâmetros passados na query string da URL. Esses parâmetros são extraídos e usados para filtros e busca

    try {
        const connection = await mysql.createConnection(dbConfig); //Criando a conexão assíncrona com o banco de dados e aguardando ela ser concluída (await)

        let query = 'SELECT * FROM books WHERE 1=1'; //Inicializando a query SQL. Utilizamos WHERE 1=1 para facilitar a adição dinâmica das condições.
        const params = []; //params é um array que irá armazenar os valores dos parâmetros que serão inseridos na query evitando SQL Injection

        //Construção dinâmica da query com base nos parâmetros fornecidos pelo usuário
        if (title) {
            query += ' AND title LIKE ?';
            params.push(`%${title}%`);
        }
        if (author) {
            query += ' AND authors LIKE ?';
            params.push(`%${author}%`);
        }
        if (category) {
            query += ' AND category LIKE ?';
            params.push(`%${category}%`);
        }
        if (available !== undefined) {
            if (available === 'true') {
                query += ' AND available > 0';
            } else if (available === 'false') {
                query += ' AND available = 0';
            }
        }
        if (isbn) {
            query += ' AND isbn = ?'; 
            params.push(isbn);
        }

        if(q){
            query += ' AND (title LIKE ? OR authors LIKE ? OR category LIKE ? OR isbn LIKE ?)';
            const like = `%${q}%`;
            params.push(like, like, like, like)
        }

        //Executando a consulta com os parâmetros definidos
        const [rows] = await connection.query(query, params);
        await connection.end(); //Fechando a conexão com o banco de dados

        //Enviando a resposta com os resultados encontrados
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message }); //Tratamento de erros
    }
});

//Obter um livro específico por ISBN (disponível para usuários autenticados)
//GET: Define uma rota que recupera um único livro com base no ISBN informado na URL
//AuthenticateToken: garante que somente usuários autenticados acessem a rota
router.get('/:isbn', authenticateToken, async (req, res) => {
    try {
        const { isbn } = req.params; //Obtendo o ISBN do livro que será buscado
        const book = await getBookByIsbn(isbn); //Reutilizando a função utilitária
        if (!book) {
            return res.status(404).json({ message: 'Livro não encontrado' }); //Retorna 404 quando não encontrado
        }
        return res.json(book); //Retorna o livro encontrado
    } catch (err) {
        return res.status(500).json({ error: err.message }); //Tratamento de erros
    }
});

//Adicionar livro (apenas para bibliotecários/admin)
//POST: Define a rota para adicionar livros
//AuthenticateToken e isAdmin: Com esses middlewares, somente um usuário autenticado e admin pode adicionar livros
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    const { title, authors, year, category, publisher, isbn, total_copies } = req.body; //req.body: contém os dados do corpo da requisição, os quais são extraídos e usados para "criar" um novo livro no sistema

    try {
        const params = [title, authors, year, category, publisher, isbn, total_copies, total_copies]; //Armazenando os parâmetros em um array para consulta segura

        const connection = await mysql.createConnection(dbConfig); //Criando a conexão com o banco e aguardando a conclusão

        //Inserir o livro
        const [result] = await connection.query(
            'INSERT INTO books (title, authors, year, category, publisher, isbn, total_copies, available) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            params //Passando os valores do livro para os placeholders `?`
        );

        await connection.end(); //Fechando a conexão com o banco

        //Retornando a resposta de sucesso com o ID do livro inserido
        res.json({ message: 'Livro adicionado com sucesso', isbn: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message }); //Tratamento de erros
    }
});

//Deletar livro (apenas para bibliotecários/admin)
//DELETE: Define uma rota para deletar um livro específico baseado no ISBN
//AuthenticateToken e isAdmin: Com esses middlewares, somente um usuário autenticado e admin pode modificar os livros
router.delete('/:isbn', authenticateToken, isAdmin, async (req, res) => {
    const isbn = req.params.isbn; //Obtendo o ISBN do livro a ser deletado

    try {
        const connection = await mysql.createConnection(dbConfig); //Criando a conexão com o banco de dados

        //Verificar se o livro existe
        const [book] = await connection.query('SELECT * FROM books WHERE isbn = ?', [isbn]);
        if (book.length === 0) {
            return res.status(404).json({ message: 'Livro não encontrado' });
        }

        //Verificar se o livro tem empréstimos não devolvidos
        const [loans] = await connection.query('SELECT * FROM loans WHERE book_isbn = ? AND status = "emprestado"', [isbn]);
        if (loans.length > 0) {
            return res.status(400).json({ message: 'Livro não pode ser deletado enquanto tiver empréstimos não devolvidos' });
        }

        //Deletar todos os empréstimos associados ao livro
        await connection.query('DELETE FROM loans WHERE book_isbn = ?', [isbn]);

        //Deletar o livro
        await connection.query('DELETE FROM books WHERE isbn = ?', [isbn]);

        await connection.end(); //Fechando a conexão com o banco

        //Enviando a resposta de sucesso
        res.json({ message: 'Livro deletado com sucesso' });
    } catch (err) {
        res.status(500).json({ error: err.message }); //Tratamento de erros
    }
});

module.exports = router; //Exportando o router para os demais arquivos
