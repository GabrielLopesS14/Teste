const request = require('supertest'); //Para fazer requisições HTTP para nossa API
const app = require('../app'); //Importa o app que configura o Express
const jwt = require('jsonwebtoken'); //Para gerar e verificar tokens JWT

describe('Testes de API para empréstimos', () => {

    let userToken = ''; //Variável para armazenar o token do usuário

    //Teste para listar empréstimos (qualquer usuário logado)
    test('Deve listar todos os empréstimos ativos com sucesso', async () => {
        //1. Realizar login de usuário e obter o token JWT
        const loginResponse = await request(app)
            .post('/users/login')
            .send({
                email: "adminTeste3@example.com", 
                password: "adminPassword123Teste3"
            });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body).toHaveProperty('access_token'); //Verifica que o token foi retornado

        userToken = loginResponse.body.access_token; //Atribui o token gerado ao token

        //2. Listar todos os empréstimos (qualquer usuário autenticado pode fazer isso)
        const loanListResponse = await request(app)
            .get('/loans') //Rota de empréstimos
            .set('Authorization', `Bearer ${userToken}`); //Usando o token do usuário

        expect(loanListResponse.status).toBe(200); //Verifica se a requisição foi bem-sucedida
        expect(Array.isArray(loanListResponse.body)).toBe(true); //Verifica se o retorno é um array de empréstimos
        expect(loanListResponse.body.length).toBeGreaterThan(0); //Verifica se existem empréstimos ativos na resposta
    });
});

// Teste Mock para registrar empréstimos
describe('Teste de mock para registrar empréstimos', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    /**
     * Teste para verificar o comportamento do POST /loans quando o livro e o usuário existem e há disponibilidade.
     * Simula respostas do banco MySQL com jest.doMock e middlewares liberados.
     * Usa Supertest para enviar requisição POST e espera status 200 com a mensagem “Empréstimo registrado”.
     */
    test('Deve registrar um empréstimo com sucesso', async () => {
        jest.doMock('mysql2/promise', () => ({
            createConnection: jest.fn().mockResolvedValue({
                query: jest.fn()
                    .mockResolvedValueOnce([[{ isbn: '9781234567890', available: 3 }], undefined]) // Livro encontrado com cópias
                    .mockResolvedValueOnce([[{ registration: '2025001' }], undefined]) // Usuário encontrado
                    .mockResolvedValueOnce([{ insertId: 1 }, undefined]) // Inserção do empréstimo
                    .mockResolvedValueOnce([undefined, undefined]), // Atualização do available
                end: jest.fn().mockResolvedValue()
            })
        }));

        jest.doMock('../middlewares/auth', () => ({
            authenticateToken: (req, res, next) => next(),
            isAdmin: (req, res, next) => next()
        }));

        const express = require('express');
        const loansRouter = require('../routes/loans');
        const miniApp = express();
        miniApp.use(express.json());
        miniApp.use('/loans', loansRouter);

        const res = await require('supertest')(miniApp)
            .post('/loans')
            .send({
                isbn: '9781234567890',
                registration: '2025001',
                loan_date: '2025-09-21',
                due_date: '2025-09-28'
            });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ message: 'Empréstimo registrado', id: 1 });
    });

    /**
     * Teste para verificar o comportamento do POST /loans quando o livro não existe.
     * Usa jest.doMock para simular que a query retorna vazio.
     * Espera status 404 e mensagem “Livro não encontrado”.
     */
    test('Deve retornar 404 se o livro não existir', async () => {
        jest.doMock('mysql2/promise', () => ({
            createConnection: jest.fn().mockResolvedValue({
                query: jest.fn()
                    .mockResolvedValueOnce([[], undefined]), // Nenhum livro encontrado
                end: jest.fn().mockResolvedValue()
            })
        }));

        jest.doMock('../middlewares/auth', () => ({
            authenticateToken: (req, res, next) => next(),
            isAdmin: (req, res, next) => next()
        }));

        const express = require('express');
        const loansRouter = require('../routes/loans');
        const miniApp = express();
        miniApp.use(express.json());
        miniApp.use('/loans', loansRouter);

        const res = await require('supertest')(miniApp)
            .post('/loans')
            .send({
                isbn: '0000000000000',
                registration: '2025001',
                loan_date: '2025-09-21',
                due_date: '2025-09-28'
            });

        expect(res.status).toBe(404);
        expect(res.body).toMatchObject({ message: 'Livro não encontrado' });
    });
});

//Teste Mock para filtrar empréstimos pelo registration do usuário
describe('Teste de mock para filtrar empréstimos por registro de usuário', () => {
    beforeEach(() => {
        jest.resetModules();
    });

     //Teste para verificar o comportamento da resposta da requisição quando há empréstimos registrados para o usuário
     //Simula a resposta do banco com uma lista de empréstimos
     //O resultado esperado é um array não vazio contendo os empréstimos registrados para esse usuário (200 é o status da resposta da requisição para esse caso)
    test('Deve retornar 200 e a lista de empréstimos do usuário quando existirem', async () => {
        //Criando os empréstimo mockados
        const mockLoans = [
            { id: 10, book_isbn: '123', user_registration: '999', status: 'emprestado' },
            { id: 11, book_isbn: '456', user_registration: '999', status: 'emprestado' }
        ];

        jest.doMock('mysql2/promise', () => ({
            createConnection: jest.fn().mockResolvedValue({
                query: jest.fn()
                    .mockResolvedValueOnce([mockLoans, undefined]), //Empréstimos encontrados
                end: jest.fn().mockResolvedValue()
            })
        }));

        //Mock do middleware de autenticação passando direto
        jest.doMock('../middlewares/auth', () => ({
            authenticateToken: (req, res, next) => next(),
            isAdmin: (req, res, next) => next()
        }));

        //Criando o miniApp
        const express = require('express');
        const loansRouter = require('../routes/loans');
        const miniApp = express();
        miniApp.use(express.json());
        miniApp.use('/loans', loansRouter);

        //Determinando o registration que será filtrado
        const USER_REGISTRATION_TEST = '999';

        const res = await require('supertest')(miniApp)
            .get(`/loans/${USER_REGISTRATION_TEST}`); //Usando a nova rota de filtro

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(mockLoans.length);
        expect(res.body[0].user_registration).toBe(USER_REGISTRATION_TEST);
    });

    
     //Teste para verificar o comportamento da resposta da requisição quando não há empréstimos
     //Simula a resposta do banco com um array vazio
     //Espera a mensagem de "não encontrado" (404 é o status de resposta vazia para a requisição)
    test('Deve retornar 404 se nenhum empréstimo for encontrado para o usuário', async () => {
        jest.doMock('mysql2/promise', () => ({
            createConnection: jest.fn().mockResolvedValue({
                query: jest.fn()
                    .mockResolvedValueOnce([[], undefined]), //Nenhum empréstimo encontrado
                end: jest.fn().mockResolvedValue()
            })
        }));

        //Mock do middleware de autenticação passando direto
        jest.doMock('../middlewares/auth', () => ({
            authenticateToken: (req, res, next) => next(),
            isAdmin: (req, res, next) => next()
        }));

        //Criando o miniApp
        const express = require('express');
        const loansRouter = require('../routes/loans');
        const miniApp = express();
        miniApp.use(express.json());
        miniApp.use('/loans', loansRouter);

        const USER_REGISTRATION_TEST = '888'; //Usuário sem empréstimos

        const res = await require('supertest')(miniApp)
            .get(`/loans/${USER_REGISTRATION_TEST}`);

        expect(res.status).toBe(404);
        expect(res.body).toMatchObject({ message: 'Nenhum empréstimo encontrado para este usuário' });
    });
});
