const request = require('supertest'); //Para fazer requisições HTTP para nossa API
const app = require('../app'); //Importa o app que configura o Express
const jwt = require('jsonwebtoken'); //Para gerar e verificar tokens JWT
const { dbConfig } = require('../db'); //Importa a configuração do banco de dados

describe('Testes de API para usuários', () => {

    let adminToken = ''; //Variável para armazenar o token do admin
    let userToken = ''; //Variável para armazenar o token do usuário comum

    //Teste para registrar um novo usuário admin
    test('Deve registrar um novo usuário admin com sucesso', async () => {
        const response = await request(app)
            .post('/users/register')
            .send({
                name: "Admin Usuário Teste 6",
                cpf: "12345678933",
                registration: "2030", 
                email: "adminTeste6@example.com",
                address: "Rua Admin, 123",
                phone: "1234567890",
                role: "admin", //Usuário admin
                password: "adminPassword123Teste6"
            });

        expect(response.status).toBe(200); //Verifica o status da resposta
        expect(response.body.message).toBe('Usuário registrado com sucesso'); //Confirma que o registro foi bem-sucedido
    });

    //Teste para registrar um usuário comum
    test('Deve registrar um novo usuário comum com sucesso', async () => {
        const response = await request(app)
            .post('/users/register')
            .send({
                name: "Usuário Teste 1",
                cpf: "12345678922",
                registration: "2026", 
                email: "usuarioTeste1@example.com",
                address: "Rua Teste, 123",
                phone: "1234567891",
                role: "user", //Usuário comum
                password: "userPassword123Teste1"
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Usuário registrado com sucesso'); //Confirma que o registro foi bem-sucedido
    });

    //Teste para login de admin e deleção de usuário
    test('Deve realizar login de admin e deletar um usuário com sucesso', async () => {
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

        // 2. Deletar o usuário (usando o token admin gerado - Apenas admin podem deletar usuários)
        const deleteResponse = await request(app)
            .delete('/users/2026') //Deletando o usuário com registration 2026
            .set('Authorization', `Bearer ${adminToken}`); //Usando o token gerado para o admin

        expect(deleteResponse.status).toBe(200); //Verifica se a deleção foi bem-sucedida
        expect(deleteResponse.body.message).toBe('Usuário deletado com sucesso'); //Confirma que a deleção ocorreu corretamente
    });

    //Teste para login de admin e registro de empréstimo
    test('Deve registrar um empréstimo de livro com sucesso', async () => {
        // 1. Realizar login de admin e obter o token JWT
        const loginResponse = await request(app)
            .post('/users/login')
            .send({
                email: "adminTeste3@example.com", 
                password: "adminPassword123Teste3"
            });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body).toHaveProperty('access_token'); //Verifica que o token foi retornado

        adminToken = loginResponse.body.access_token; //Atribui o token gerado ao usuário
        
        // 2. Registrar o empréstimo de um livro para o usuário comum (apenas admin registram empréstimos)
        const loanResponse = await request(app)
            .post('/loans') //Rota de empréstimos
            .send({
                isbn: '9781234567890', //ISBN do livro
                registration: '2027',  //Registration do usuário comum para teste
                loan_date: "2025-09-02", //Data do empréstimo
                due_date: "2025-09-09"   //Data de devolução
            })
            .set('Authorization', `Bearer ${adminToken}`); //Usando o token do usuário

        expect(loanResponse.status).toBe(200); //Verifica se o empréstimo foi registrado com sucesso
        expect(loanResponse.body.message).toBe('Empréstimo registrado'); //Confirma que o empréstimo foi realizado
    });

    //Teste para login de admin e deleção de usuário com empréstimo ativo resultando em erro
    test('Deve realizar login de admin e deletar um usuário com falha devido a empréstimo ativo', async () => {
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

        //2. Deletar o usuário com falha (usando o token admin gerado - Apenas admin podem deletar usuários)
        const deleteResponse = await request(app)
            .delete('/users/2027') //Deletando o usuário com registration 2027 que esta com empréstimo ativo
            .set('Authorization', `Bearer ${adminToken}`); //Usando o token gerado para o admin

        //Espera-se que a deleção falhe, pois o usuário tem empréstimos ativos
        expect(deleteResponse.status).toBe(400); //Espera erro 400 (não pode deletar com empréstimos ativos)
        expect(deleteResponse.body.message).toBe('Usuário não pode ser deletado enquanto tiver empréstimos não devolvidos'); //Confirma a mensagem de erro
    });
});

// Teste mock para exclusão de usuário
describe('Teste de mock para deletar usuários', () => {
    beforeEach(() => {
        jest.resetModules()
    })

    /**
     * Testa o DELETE /users/:registration quando o usuário existe
     * e não tem empréstimos ativos
     * Simula o MySQL com jest.doMock e libera os middlewares
     * Usa o Supertest para enviar a requisição DELETE e espera status 200
     * junto com a mensagem "Usuário deletado com sucesso"
     */
    test('Deve deletar um usuário existente sem empréstimos ativos', async () => {
        jest.doMock('mysql2/promise', () => ({
            createConnection: jest.fn().mockResolvedValue({
                query: jest
                    .fn()
                    // 1) SELECT * FROM users WHERE registration = ?
                    .mockResolvedValueOnce([[{ registration: '12345', name: 'Fulano' }], undefined])
                    // 2) SELECT * FROM loans WHERE user_registration = ? AND status = "emprestado"
                    .mockResolvedValueOnce([[], undefined]) // sem empréstimos ativos
                    // 3) DELETE FROM loans WHERE user_registration = ?
                    .mockResolvedValueOnce([undefined, undefined])
                    // 4) DELETE FROM users WHERE registration = ?
                    .mockResolvedValueOnce([undefined, undefined]),
                end: jest.fn().mockResolvedValue()
            })
        }))

        // Middlewares de autenticação e autorização liberados
        jest.doMock('../middlewares/auth', () => ({
            authenticateToken: (req, res, next) => next(),
            isAdmin: (req, res, next) => next()
        }))

        const express = require('express')
        const usersRouter = require('../routes/users') // ajustar caminho se precisar
        const miniApp = express()
        miniApp.use(express.json())
        miniApp.use('/users', usersRouter)

        const res = await require('supertest')(miniApp).delete('/users/12345')
        expect(res.status).toBe(200)
        expect(res.body).toMatchObject({ message: 'Usuário deletado com sucesso' })
    })

    /**
     * Testa o DELETE /users/:registration quando o usuário não existe
     * Simula o MySQL sem retornar dados e libera os middlewares
     * Cria uma app Express pequena com o usersRouter e envia a requisição com Supertest
     * Espera status 404 e a mensagem "Usuário não encontrado"
     */
    test('Deve retornar 404 se o usuário não existir', async () => {
        jest.doMock('mysql2/promise', () => ({
            createConnection: jest.fn().mockResolvedValue({
                query: jest
                    .fn()
                    // 1) SELECT * FROM users WHERE registration = ?
                    .mockResolvedValueOnce([[], undefined]), // usuário não encontrado
                end: jest.fn().mockResolvedValue()
            })
        }))

        jest.doMock('../middlewares/auth', () => ({
            authenticateToken: (req, res, next) => next(),
            isAdmin: (req, res, next) => next()
        }))

        const express = require('express')
        const usersRouter = require('../routes/users')
        const miniApp = express()
        miniApp.use(express.json())
        miniApp.use('/users', usersRouter)

        const res = await require('supertest')(miniApp).delete('/users/99999')
        expect(res.status).toBe(404)
        expect(res.body).toMatchObject({ message: 'Usuário não encontrado' })
    })

    /**
     * Testa o DELETE /users/:registration quando o usuário tem
     * empréstimos com status "emprestado"
     * Espera status 400 e a mensagem correspondente
     */
    test('Deve retornar 400 se o usuário tiver empréstimos não devolvidos', async () => {
        jest.doMock('mysql2/promise', () => ({
            createConnection: jest.fn().mockResolvedValue({
                query: jest
                    .fn()
                    // 1) SELECT * FROM users WHERE registration = ?
                    .mockResolvedValueOnce([[{ registration: '777', name: 'Ciclano' }], undefined])
                    // 2) SELECT * FROM loans WHERE user_registration = ? AND status = "emprestado"
                    .mockResolvedValueOnce([[{ id: 1, status: 'emprestado' }], undefined]), // empréstimo ativo
                end: jest.fn().mockResolvedValue()
            })
        }))

        jest.doMock('../middlewares/auth', () => ({
            authenticateToken: (req, res, next) => next(),
            isAdmin: (req, res, next) => next()
        }))

        const express = require('express')
        const usersRouter = require('../routes/users')
        const miniApp = express()
        miniApp.use(express.json())
        miniApp.use('/users', usersRouter)

        const res = await require('supertest')(miniApp).delete('/users/777')
        expect(res.status).toBe(400)
        expect(res.body).toMatchObject({
            message: 'Usuário não pode ser deletado enquanto tiver empréstimos não devolvidos'
        })
    })
})


// Teste mock para login de usuário
describe('Teste de mock para login de usuários', () => {
    beforeEach(() => {
        jest.resetModules()
    })

    /**
     * Testa o POST /users/login quando o usuário existe
     * e a senha está correta
     * Simula o MySQL com jest.doMock (retorna um usuário) e o bcrypt.compare = true
     * Espera status 200 e retorno com access_token
     */
    test('Deve realizar login com sucesso (usuário existente e senha correta)', async () => {
        // Mock do MySQL retornando usuário
        jest.doMock('mysql2/promise', () => ({
            createConnection: jest.fn().mockResolvedValue({
                query: jest
                    .fn()
                    // SELECT * FROM users WHERE email = ?
                    .mockResolvedValueOnce([[{
                        email: 'user@example.com',
                        password: 'hash_bcrypt_fake',
                        registration: '123',
                        role: 'user'
                    }], undefined]),
                end: jest.fn().mockResolvedValue()
            })
        }))

        // Mock do bcrypt.compare -> true
        jest.doMock('bcrypt', () => ({
            compare: jest.fn().mockResolvedValue(true),
            hash: jest.fn()
        }))

        const express = require('express')
        const usersRouter = require('../routes/users')
        const miniApp = express()
        miniApp.use(express.json())
        miniApp.use('/users', usersRouter)

        const res = await require('supertest')(miniApp)
            .post('/users/login')
            .send({ email: 'user@example.com', password: 'senhaCorreta123' })

        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('access_token')
        expect(res.body).toMatchObject({ token_type: 'bearer' })
    })

    /**
     * Testa o POST /users/login quando a senha está incorreta
     * Simula o MySQL com usuário existente e bcrypt.compare = false
     * Espera status 401 e mensagem "Senha incorreta"
     */
    test('Deve retornar 401 quando a senha estiver incorreta', async () => {
        // Mock do MySQL retornando usuário
        jest.doMock('mysql2/promise', () => ({
            createConnection: jest.fn().mockResolvedValue({
                query: jest
                    .fn()
                    .mockResolvedValueOnce([[{
                        email: 'user@example.com',
                        password: 'hash_bcrypt_fake',
                        registration: '123',
                        role: 'user'
                    }], undefined]),
                end: jest.fn().mockResolvedValue()
            })
        }))

        // Mock do bcrypt.compare -> false
        jest.doMock('bcrypt', () => ({
            compare: jest.fn().mockResolvedValue(false),
            hash: jest.fn()
        }))

        const express = require('express')
        const usersRouter = require('../routes/users')
        const miniApp = express()
        miniApp.use(express.json())
        miniApp.use('/users', usersRouter)

        const res = await require('supertest')(miniApp)
            .post('/users/login')
            .send({ email: 'user@example.com', password: 'senhaErrada' })

        expect(res.status).toBe(401)
        expect(res.body).toMatchObject({ message: 'Senha incorreta' })
    })
})


// Teste mock: login com usuário inexistente
describe('Mock de login de usuário - usuário inexistente', () => {
    beforeEach(() => {
        jest.resetModules()
    })

    /**
     * Garante que a API responde certo quando o e-mail não existe
     * Simula SELECT vazio no MySQL
     * Espera HTTP 400 + mensagem "Usuário não encontrado"
     */
    test('Deve retornar 400 ao tentar login com e-mail inexistente', async () => {
        jest.doMock('mysql2/promise', () => ({
            createConnection: jest.fn().mockResolvedValue({
                query: jest
                    .fn()
                    .mockResolvedValueOnce([[], undefined]), // nenhum registro
                end: jest.fn().mockResolvedValue()
            })
        }))

        const express = require('express')
        const usersRouter = require('../routes/users')
        const miniApp = express()
        miniApp.use(express.json())
        miniApp.use('/users', usersRouter)

        const res = await require('supertest')(miniApp)
            .post('/users/login')
            .send({ email: 'naoexiste@example.com', password: 'senha123' })

        expect(res.status).toBe(400)
        expect(res.body).toMatchObject({
            message: 'Usuário não encontrado'
        })
    })
})


// Teste mock: registro de usuário com role inválida
describe('Mock de registro de usuário - validação de role', () => {
    beforeEach(() => {
        jest.resetModules()
    })

    /**
     * Garante que a API rejeita cadastro com role inválida
     * A checagem acontece antes de acessar o banco
     * Espera HTTP 400 + mensagem orientando usar "admin" ou "user"
     */
    test('Deve retornar 400 ao registrar com função/perfil (role) inválido', async () => {
        // Não precisa mockar MySQL, a rota responde antes
        const express = require('express')
        const usersRouter = require('../routes/users')
        const miniApp = express()
        miniApp.use(express.json())
        miniApp.use('/users', usersRouter)

        const res = await require('supertest')(miniApp)
            .post('/users/register')
            .send({
                name: 'Teste Role Inválido',
                cpf: '99988877766',
                registration: '9999',
                email: 'testeRoleInvalido@example.com',
                address: 'Rua X',
                phone: '123456789',
                role: 'invalidRole', // role fora do permitido
                password: 'senha123'
            })

        expect(res.status).toBe(400)
        expect(res.body).toMatchObject({
            message: 'Papel inválido. Use "admin" ou "user".'
        })
    })
})
