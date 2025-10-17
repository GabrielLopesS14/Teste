const request = require('supertest'); //Para fazer requisições HTTP para nossa API
const app = require('../app'); //Importa o app que configura o Express
const jwt = require('jsonwebtoken'); //Para gerar e verificar tokens JWT
const { dbConfig } = require('../db'); //Importa a configuração do banco de dados

describe('Testes de API para livros', () => {

    let token = ''; //Variável para armazenar o token 

    //Teste para login de admin e registro de livro
    test('Deve registrar um livro com sucesso', async () => {
        // 1. Login para obter o token
        const loginResponse = await request(app)
            .post('/users/login')
            .send({
                email: "adminTeste3@example.com", 
                password: "adminPassword123Teste3"
            });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body).toHaveProperty('access_token'); //Verifica que o token foi retornado

        token = loginResponse.body.access_token; //Atribui o token gerado ao token

        // 2. Registrar um livro (usando o token admin gerado - Apenas admins podem registrar novos livros)
        const bookResponse = await request(app)
            .post('/books') //Rota para registrar livros
            .send({
                title: "Livro Teste4",
                authors: "Autor Teste4",
                year: 2025,
                category: "Ficção",
                publisher: "Editora Teste",
                isbn: "2", 
                total_copies: 20
            })
            .set('Authorization', `Bearer ${token}`); //Usando o token do admin

        expect(bookResponse.status).toBe(200); //Verifica se o livro foi registrado com sucesso
        expect(bookResponse.body.message).toBe('Livro adicionado com sucesso'); //Confirma que o livro foi registrado
    });

    //Teste para deletar um livro
    test('Deve deletar um livro com sucesso', async () => {
        // 1. Login de admin para obter o token
        const loginResponse = await request(app)
            .post('/users/login')
            .send({
                email: "adminTeste3@example.com",
                password: "adminPassword123Teste3"
            });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body).toHaveProperty('access_token');

        token = loginResponse.body.access_token;

        // 2. Deletar um livro (usando o token admin gerado - Apenas admins podem deletar livros)
        const deleteResponse = await request(app)
            .delete('/books/2') 
            .set('Authorization', `Bearer ${token}`);

        expect(deleteResponse.status).toBe(200); //Verifica se o livro foi deletado com sucesso
        expect(deleteResponse.body.message).toBe('Livro deletado com sucesso'); //Confirma que a deleção ocorreu
    });

    //Teste para buscar livros
    test('Deve retornar a lista de livros com sucesso', async () => {
        // 1. Login para obter o token
        const loginResponse = await request(app)
            .post('/users/login')
            .send({
                email: "adminTeste3@example.com",
                password: "adminPassword123Teste3"
            });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body).toHaveProperty('access_token');

        token = loginResponse.body.access_token;

        // 2. Buscar livros (usando o token gerado - Qualquer usuáruio pode buscar a lista de livros)
        const searchResponse = await request(app)
            .get('/books') //Rota para listar livros
            .set('Authorization', `Bearer ${token}`);

        expect(searchResponse.status).toBe(200); //Verifica se a busca foi bem-sucedida
        expect(Array.isArray(searchResponse.body)).toBe(true); //Verifica se o retorno é um array
        expect(searchResponse.body.length).toBeGreaterThan(0); //Verifica se existem livros cadastrados
    });

    //Teste para login de admin e deleção de livro com empréstimo ativo resultando em erro
    test('Deve realizar login de admin e deletar um livro com falha devido a empréstimo ativo', async () => {
        // 1. Realizar login de admin e obter o token JWT
        const loginResponse = await request(app)
            .post('/users/login')
            .send({
                email: "adminTeste3@example.com", 
                password: "adminPassword123Teste3"
            });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body).toHaveProperty('access_token'); //Verifica que o token foi retornado

        adminToken = loginResponse.body.access_token; //Atribui o token gerado ao adminToken

        //2. Deletar o livro com falha (usando o token admin gerado - Apenas admin podem deletar usuários)
        const deleteResponse = await request(app)
            .delete('/books/9781234567890') //Deletando o usuário com isbn 9781234567890 que esta com empréstimo ativo
            .set('Authorization', `Bearer ${adminToken}`); //Usando o token gerado para o admin

        //Espera-se que a deleção falhe, pois o livro está emprestado
        expect(deleteResponse.status).toBe(400); //Espera erro 400 (não pode deletar com empréstimos ativos)
        expect(deleteResponse.body.message).toBe('Livro não pode ser deletado enquanto tiver empréstimos não devolvidos'); //Confirma a mensagem de erro
    });
});

//TESTES DE MOCK 
//Esses testes não usam o banco real. O MySQL é mockado para checar o retorno da rota.
describe('Testes de mock para livros', () => {
    beforeEach(() => {
        jest.resetModules(); //Reseta módulos para que o mock seja aplicado corretamente
    });

    test('Deve retornar um livro completo quando buscar por ISBN', async () => {
        //Simula o retorno do banco com todos os campos do livro
        jest.doMock('mysql2/promise', () => ({ //mockando o MySQL
            createConnection: jest.fn().mockResolvedValue({ //mockando o comando de conexão com o banco (CreateConnection)
                query: jest.fn().mockResolvedValueOnce([ //mockando a query que iria retornar o livro por meio do isbn
                    [{
                        isbn: '9781234567890',
                        title: 'Livro de Teste 1',
                        authors: 'Autor Teste 1',
                        year: 2025,
                        category: 'Ficção',
                        publisher: 'Editora Teste 1',
                        total_copies: 10,
                        available: 7
                    }],
                    undefined
                ]),
                end: jest.fn().mockResolvedValue() //mockando o encerramento da conexão
            })
        }));

        //Ignora autenticação nos testes de mock
        //next: avança as etapas sem o recebimento do token
        jest.doMock('../middlewares/auth', () => ({
            authenticateToken: (req, res, next) => next(),
            isAdmin: (req, res, next) => next()
        }));

        const express = require('express');
        const booksRouter = require('../routes/books');
        const miniApp = express();
        miniApp.use(express.json());
        miniApp.use('/books', booksRouter);

        //Busca pelo ISBN mockado
        const res = await require('supertest')(miniApp).get('/books?isbn=9781234567890');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0]).toMatchObject({
            isbn: '9781234567890',
            title: 'Livro de Teste 1',
            authors: 'Autor Teste 1',
            year: 2025,
            category: 'Ficção',
            publisher: 'Editora Teste 1',
            total_copies: 10,
            available: 7
        });
    });

    test('Deve retornar array vazio quando o ISBN não existir', async () => {
        //Simula retorno vazio do banco
        //Mesmos comandos do anterior, porém agora mockando um retorno vazio
        jest.doMock('mysql2/promise', () => ({
            createConnection: jest.fn().mockResolvedValue({
                query: jest.fn().mockResolvedValueOnce([[], undefined]),
                end: jest.fn().mockResolvedValue()
            })
        }));

        jest.doMock('../middlewares/auth', () => ({
            authenticateToken: (req, res, next) => next(),
            isAdmin: (req, res, next) => next()
        }));

        const express = require('express');
        const booksRouter = require('../routes/books');
        const miniApp = express();
        miniApp.use(express.json());
        miniApp.use('/books', booksRouter);

        const res = await require('supertest')(miniApp).get('/books?isbn=0000000000000');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(0); //Nenhum livro encontrado
    });


});

// Teste Mock para deletar um livro
describe('Teste de mock para deletar livros', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    /**
     * Teste para verificar o comportamento do DELETE /books/:isbn quando o livro existe.
     * Simula respostas do banco MySQL com jest.doMock e middlewares liberados.
     * Usa Supertest para enviar requisição DELETE e espera status 200 e mensagem “Livro deletado com sucesso”.
     */
    test('Deve deletar um livro existente com sucesso', async () => { 
        jest.doMock('mysql2/promise', () => ({ 
            createConnection: jest.fn().mockResolvedValue({ 
                query: jest.fn()
                    .mockResolvedValueOnce([[{ isbn: '9781234567890' }], undefined]) // Achou um livro no banco
                    .mockResolvedValueOnce([[], undefined]) // Simula que nao ha emprestimos ativos para o livro
                    .mockResolvedValueOnce([undefined, undefined]) // Simula a exclusao de registros de emprestimos relacionados ao livro
                    .mockResolvedValueOnce([undefined, undefined]), // Simula a exclusao do livro
                end: jest.fn().mockResolvedValue() 
            })
        }));

        jest.doMock('../middlewares/auth', () => ({
            authenticateToken: (req, res, next) => next(),
            isAdmin: (req, res, next) => next()
        }));

        const express = require('express');
        const booksRouter = require('../routes/books'); 
        const miniApp = express(); 
        miniApp.use(express.json());
        miniApp.use('/books', booksRouter);

        const res = await require('supertest')(miniApp).delete('/books/9781234567890');
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ message: 'Livro deletado com sucesso' }); 
    });

    /**
    * Teste para verificar o comportamento do DELETE /books/:isbn quando o livro não existe.
    * Usa jest.doMock para simular um banco MySQL sem dados e middlewares de autenticação liberados.
    * Cria uma mini aplicação Express com o booksRouter e envia a requisição via Supertest.
    * Espera status 404 e mensagem “Livro não encontrado”, garantindo que a API trate corretamente
    * tentativas de deletar registros inexistentes.
    */
    test('Deve retornar 404 se o livro não existir', async () => {
        jest.doMock('mysql2/promise', () => ({
            createConnection: jest.fn().mockResolvedValue({
                query: jest.fn().mockResolvedValue([[], undefined]),
                end: jest.fn().mockResolvedValue()
            })
        }));

        jest.doMock('../middlewares/auth', () => ({
            authenticateToken: (req, res, next) => next(),
            isAdmin: (req, res, next) => next()
        }));

        const express = require('express');
        const booksRouter = require('../routes/books');
        const miniApp = express();
        miniApp.use(express.json());
        miniApp.use('/books', booksRouter);

        const res = await require('supertest')(miniApp).delete('/books/0000000000000');
        expect(res.status).toBe(404);
        expect(res.body).toMatchObject({ message: 'Livro não encontrado' });
    });
});

// Fazendo mais um teste Mock, dessa vez ele vai:
// !Retornar um livro especifico pelo seu ISBN e retornar 404 quando o livro  nao existir 
// Segui a mesma estrutura do teste mock de cima, porem para uma rota difernted da rota de livros
// a rota e de book usado foi a de get/books e passei o isbn como parametro -> ai foi a descricao que usei para o meu teste

describe('Testes de mock para rota GET /books/:isbn', () => {
    beforeEach(() => {
        jest.resetModules(); // garante que os mocks sejam reaplicados corretamente
    });

    test('Deve retornar um livro específico por ISBN (200)', async () => {
        // Mock do mysql2/promise para retornar um livro quando a query for feita
        jest.doMock('mysql2/promise', () => ({
            createConnection: jest.fn().mockResolvedValue({
                query: jest.fn().mockResolvedValueOnce([[{
                    isbn: '9781234567890',
                    title: 'Livro de Teste Específico',
                    authors: 'Autor Exemplo',
                    year: 2025,
                    category: 'Ficção',
                    publisher: 'Editora Exemplo',
                    total_copies: 5,
                    available: 3
                }], undefined]),
                end: jest.fn().mockResolvedValue()
            })
        }));

        // Ignora autenticação nos testes de mock
        jest.doMock('../middlewares/auth', () => ({
            authenticateToken: (req, res, next) => next(),
            isAdmin: (req, res, next) => next()
        }));

        const express = require('express');
        const booksRouter = require('../routes/books');
        const miniApp = express();
        miniApp.use(express.json());
        miniApp.use('/books', booksRouter);

        const res = await require('supertest')(miniApp).get('/books/9781234567890');

        expect(res.status).toBe(200);
        // A rota GET /:isbn retorna um objeto (não um array), conforme sua implementação
        expect(res.body).toMatchObject({
            isbn: '9781234567890',
            title: 'Livro de Teste Específico',
            authors: 'Autor Exemplo',
            year: 2025,
            category: 'Ficção',
            publisher: 'Editora Exemplo',
            total_copies: 5,
            available: 3
        });
    });

    test('Deve retornar 404 quando o livro não existir (GET /books/:isbn)', async () => {
        // Mock do mysql2/promise retornando array vazio — livro não encontrado
        jest.doMock('mysql2/promise', () => ({
            createConnection: jest.fn().mockResolvedValue({
                query: jest.fn().mockResolvedValueOnce([[], undefined]),
                end: jest.fn().mockResolvedValue()
            })
        }));

        // Ignora autenticação
        jest.doMock('../middlewares/auth', () => ({
            authenticateToken: (req, res, next) => next(),
            isAdmin: (req, res, next) => next()
        }));

        const express = require('express');
        const booksRouter = require('../routes/books');
        const miniApp = express(); 
        miniApp.use(express.json());
        miniApp.use('/books', booksRouter);

        const res = await require('supertest')(miniApp).get('/books/0000000000000');

        expect(res.status).toBe(404);
        expect(res.body).toMatchObject({ message: 'Livro não encontrado' });
    });
});
