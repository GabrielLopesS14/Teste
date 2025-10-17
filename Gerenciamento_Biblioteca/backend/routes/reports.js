const express = require('express'); 
const router = express.Router(); 
const { authenticateToken } = require('../middlewares/auth'); 
// A única importação do DB é substituída pela importação do Serviço
const ReportService = require('../services/reportService'); 

/**
 * Rotas de Relatórios.
 * Esta camada agora é responsável apenas por coordenar (chamar o serviço) e responder (HTTP).
 */

// GET /reports/books-most-loaned - Livros mais emprestados
router.get('/books-most-loaned', authenticateToken, async (req, res) => {
    try {
        const rows = await ReportService.getMostLoanedBooks();
        res.json(rows); 
    } catch (err) {
        console.error('Erro ao gerar relatório de livros mais emprestados:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao gerar relatório.', error: err.message });
    }
});

// GET /reports/users-most-loaned - Usuários que mais pegaram livros
router.get('/users-most-loaned', authenticateToken, async (req, res) => {
    try {
        const rows = await ReportService.getMostLoanedUsers();
        res.json(rows); 
    } catch (err) {
        console.error('Erro ao gerar relatório de usuários mais emprestados:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao gerar relatório.', error: err.message });
    }
});

// GET /reports/overdue-books - Livros atrasados
router.get('/overdue-books', authenticateToken, async (req, res) => {
    try {
        const rows = await ReportService.getOverdueBooks();
        res.json(rows); 
    } catch (err) {
        console.error('Erro ao gerar relatório de livros atrasados:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao gerar relatório.', error: err.message });
    }
});

// GET /reports/loans-history - Histórico de empréstimos por período
router.get('/loans-history', authenticateToken, async (req, res) => {
    const { start, end } = req.query; 
    
    // Validação de entrada na rota
    if (!start || !end) {
        return res.status(400).json({ message: 'Parâmetros de consulta (start e end) são obrigatórios.' }); 
    }

    try {
        const rows = await ReportService.getLoansHistory(start, end);
        res.json(rows);
    } catch (err) {
        console.error('Erro ao gerar histórico de empréstimos:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao gerar relatório.', error: err.message });
    }
});

module.exports = router;
