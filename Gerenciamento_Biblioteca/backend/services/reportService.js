const { dbConfig } = require('../db');
const mysql = require('mysql2/promise');

/**
 * Módulo de Serviço para Relatórios (Reports).
 * Esta camada é responsável exclusivamente pela lógica de acesso ao banco de dados (SQL).
 * Isso adere ao Princípio da Responsabilidade Única (SRP).
 */

// Função auxiliar para gerenciar a conexão e a execução da query
async function executeReportQuery(query, params = []) {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.query(query, params);
        return rows;
    } finally {
        // Garante que a conexão é sempre encerrada, mesmo em caso de erro
        await connection.end();
    }
}

async function getMostLoanedBooks() {
    const query = `
        SELECT b.isbn, b.title, b.authors, COUNT(l.id) as loan_count
        FROM books b
        LEFT JOIN loans l ON b.isbn = l.book_isbn
        GROUP BY b.isbn
        ORDER BY loan_count DESC
        LIMIT 10
    `;
    return executeReportQuery(query);
}

async function getMostLoanedUsers() {
    const query = `
        SELECT u.registration, u.name, COUNT(l.id) as loan_count
        FROM users u
        LEFT JOIN loans l ON u.registration = l.user_registration
        GROUP BY u.registration
        ORDER BY loan_count DESC
        LIMIT 10
    `;
    return executeReportQuery(query);
}

async function getOverdueBooks() {
    const today = new Date().toISOString().split('T')[0];
    const query = `
        SELECT l.id, b.isbn, b.title, u.name, l.due_date
        FROM loans l
        JOIN books b ON l.book_isbn = b.isbn
        JOIN users u ON l.user_registration = u.registration
        WHERE l.status = 'emprestado' AND l.due_date < ?
    `;
    // Passa a data atual como parâmetro seguro para a query
    return executeReportQuery(query, [today]);
}

async function getLoansHistory(start, end) {
    const query = `
        SELECT l.id, b.isbn, b.title, u.registration, u.name, l.loan_date, l.due_date, l.return_date, l.status, l.fine
        FROM loans l
        JOIN books b ON l.book_isbn = b.isbn
        JOIN users u ON l.user_registration = u.registration
        WHERE l.loan_date BETWEEN ? AND ?
    `;
    // Passa o intervalo de datas como parâmetros
    return executeReportQuery(query, [start, end]);
}

module.exports = {
    getMostLoanedBooks,
    getMostLoanedUsers,
    getOverdueBooks,
    getLoansHistory
};
