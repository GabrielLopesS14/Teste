// Força o Jest a usar o mock local em _MOCKS/promise.js quando alguém importar 'mysql2/promise'
jest.mock('mysql2/promise', () => require('../_MOCKS/promise'));
jest.setTimeout(30000);