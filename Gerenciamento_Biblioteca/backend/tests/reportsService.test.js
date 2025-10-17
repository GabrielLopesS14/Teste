
// Mock do módulo mysql2/promise: Intercepta a criação da conexão e as queries.
const mockExecute = jest.fn();
const mockConnection = {
    query: mockExecute,
    end: jest.fn().mockResolvedValue(),
};
const mockCreateConnection = jest.fn().mockResolvedValue(mockConnection);

jest.mock('mysql2/promise', () => ({
    createConnection: mockCreateConnection,
}));

// Mock do db.js para evitar dependência real de configuração
jest.mock('../../db', () => ({
    dbConfig: {},
}));

const ReportService = require('../../services/reportService');

describe('ReportService - Testes Unitários (Validação de SQL)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('getMostLoanedBooks deve usar a query correta sem parâmetros', async () => {
        mockExecute.mockResolvedValue([[], undefined]); // Simula retorno vazio

        await ReportService.getMostLoanedBooks();

        // Verifica se a conexão foi criada e encerrada
        expect(mockCreateConnection).toHaveBeenCalledTimes(1);
        expect(mockConnection.end).toHaveBeenCalledTimes(1);

        // Verifica a estrutura da query principal (JOIN e LIMIT 10)
        expect(mockExecute).toHaveBeenCalledWith(
            expect.stringContaining('FROM books b LEFT JOIN loans l ON b.isbn = l.book_isbn GROUP BY b.isbn ORDER BY loan_count DESC LIMIT 10'),
            [] // Espera array vazio, pois não há parâmetros dinâmicos
        );
    });

    test('getOverdueBooks deve usar a data atual como parâmetro de segurança', async () => {
        // Mocking da data para fixar o valor do teste (Técnica importante!)
        jest.spyOn(global, 'Date').mockImplementation(() => ({
            toISOString: () => `2025-10-10T00:00:00.000Z`,
            split: (separator) => separator === 'T' ? ['2025-10-10', '00:00:00.000Z'] : []
        }));

        mockExecute.mockResolvedValue([[], undefined]);

        await ReportService.getOverdueBooks();

        // Verifica a cláusula WHERE e o uso do placeholder (?)
        expect(mockExecute).toHaveBeenCalledWith(
            expect.stringContaining("WHERE l.status = 'emprestado' AND l.due_date < ?"),
            // Verifica se a data atual (mockada) foi passada como parâmetro
            ['2025-10-10'] 
        );

        global.Date.mockRestore();
    });

    test('getLoansHistory deve usar start e end como parâmetros seguros', async () => {
        const startDate = '2024-01-01';
        const endDate = '2024-12-31';
        mockExecute.mockResolvedValue([[], undefined]);

        await ReportService.getLoansHistory(startDate, endDate);

        // Verifica a cláusula WHERE e a passagem dos parâmetros
        expect(mockExecute).toHaveBeenCalledWith(
            expect.stringContaining('WHERE l.loan_date BETWEEN ? AND ?'),
            [startDate, endDate]
        );
    });
    
    test('A função auxiliar executeReportQuery deve fechar a conexão mesmo em caso de erro', async () => {
        // Simula um erro na query
        mockExecute.mockRejectedValueOnce(new Error('Erro de permissão no banco')); 

        await expect(ReportService.getMostLoanedUsers()).rejects.toThrow('Erro de permissão no banco');
        
        // Garante que a conexão foi encerrada (pelo bloco 'finally')
        expect(mockConnection.end).toHaveBeenCalledTimes(1); 
    });
});
