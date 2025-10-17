const mysql = require('mysql2/promise'); //Importação mysql2/promise

//Configuração do banco de dados 
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'library_db'
};
async function initDB() {
    try {
        const connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password
        });

        //Criando banco se não existir
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        await connection.query(`USE ${dbConfig.database}`);

        //Usuários 
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                registration VARCHAR(50) PRIMARY KEY,  
                name VARCHAR(255) NOT NULL,
                cpf VARCHAR(20) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                address VARCHAR(255),
                phone VARCHAR(20),
                role VARCHAR(10) DEFAULT 'user',
                password VARCHAR(255) NOT NULL
            )
        `);

        //Livros
        await connection.query(`
            CREATE TABLE IF NOT EXISTS books (
                isbn VARCHAR(20) PRIMARY KEY,  
                title VARCHAR(255) NOT NULL,
                authors VARCHAR(255),
                year INT,
                category VARCHAR(100),
                publisher VARCHAR(100),
                total_copies INT DEFAULT 1,
                available INT DEFAULT 1
            )
        `);

        //Empréstimos
        await connection.query(`
            CREATE TABLE IF NOT EXISTS loans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                book_isbn VARCHAR(20) NOT NULL,  
                user_registration VARCHAR(50) NOT NULL,  
                loan_date DATE NOT NULL,
                due_date DATE NOT NULL,
                return_date DATE,
                status VARCHAR(20) DEFAULT 'emprestado',
                fine DECIMAL(10,2) DEFAULT 0,
                FOREIGN KEY (book_isbn) REFERENCES books(isbn),
                FOREIGN KEY (user_registration) REFERENCES users(registration)
            )
        `);

        console.log("Banco e tabelas criadas com sucesso!");
        await connection.end();
    } catch (error) {
        console.error("Erro ao inicializar o banco de dados:", error);
    }
}

//Exportando as funções que serão utilizadas em outras partes do código
module.exports = { dbConfig, initDB };
