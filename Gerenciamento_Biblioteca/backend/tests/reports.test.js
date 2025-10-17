const request = require('supertest');
const app = require('../app'); 

// Mocks de dados
const mockBooks = [{ title: 'Livro A', loan_count: 5 }];
const mockHistory = [{ id: 101, title: 'Livro História X', loan_date: '2025-05-01' }];

// MOCK DO SERVIÇO: Substitui o módulo services/reportService, isolando a rota do banco.
jest.mock('../services/reportService', () => ({
    getMostLoanedBooks: jest.fn().mockResolvedValue(mockBooks),
    getMostLoanedUsers: jest.fn().mockResolvedValue([{ name: 'User A', loan_count: 8 }]), 
    getOverdueBooks: jest.fn().mockResolvedValue([{ title: 'Atrasado 1', due_date: '2024-01-01' }]),
    getLoansHistory: jest.fn().mockResolvedValue(mockHistory),
}));

// MOCK DO MIDDLEWARE AUTH: Assume que a autenticação está funcionando e permite acesso.
const auth = require('../middlewares/auth'); // Importa o módulo real para fazer spy ou mock
const ReportService = require('../services/reportService'); 

describe('Testes de Rotas de Relatórios (GET /reports)', () => {

    beforeEach(() => {
        // Limpa o estado de uso dos mocks para cada teste
        jest.clearAllMocks(); 
    });

    // Mock para simular um token válido (se o auth real não for mockado)
    // Se o seu middleware auth já estiver mockado no arquivo 'auth.js' para testes, você pode pular esta parte.
    // Usaremos um mock simples aqui para que o Supertest passe
    auth.authenticateToken = (req, res, next) => {
        req.user = { registration: 'mock_reg', role: 'admin' };
        next();
    };

    // --- Teste Principal: Chamada de Serviço (Mock Testing) ---
    test('GET /books-most-loaned deve retornar 200 e chamar o serviço correto', async () => {
        const response = await request(app)
            .get('/reports/books-most-loaned'); 

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(mockBooks);
        // Verifica que a rota chamou o serviço correto
        expect(ReportService.getMostLoanedBooks).toHaveBeenCalledTimes(1); 
    });
    
    // --- Teste de Validação de Parâmetros (Lógica da Rota) ---
    test('GET /loans-history deve retornar 400 se o parâmetro "start" estiver faltando', async () => {
        const response = await request(app)
            .get('/reports/loans-history?end=2025-01-31');

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('Parâmetros de consulta (start e end) são obrigatórios.');
        // Garante que o serviço NÃO foi chamado (a rota validou antes)
        expect(ReportService.getLoansHistory).not.toHaveBeenCalled(); 
    });

    // --- Teste de Falha (Simulação de Erro Interno) ---
    test('GET /overdue-books deve retornar 500 se o serviço falhar', async () => {
        // Simula uma falha de conexão/query APENAS para este teste
        ReportService.getOverdueBooks.mockRejectedValueOnce(new Error("Falha no MySQL")); 

        const response = await request(app)
            .get('/reports/overdue-books');

        expect(response.statusCode).toBe(500);
        expect(response.body.message).toContain('Erro interno do servidor');
    });

});
