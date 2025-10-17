// Mock CommonJS do mysql2/promise para uso nos testes
function makeQuery() {
  if (typeof jest !== 'undefined' && typeof jest.fn === 'function') {
    return jest.fn(async () => [[{ id: 1, nome: 'Livro Fake' }], []]);
  }
  return async () => [[{ id: 1, nome: 'Livro Fake' }], []];
}

module.exports = {
  createConnection: async () => ({
    query: makeQuery(),
    end: async () => {}
  }),
  createPool: async () => ({
    query: makeQuery(),
    end: async () => {}
  })
};
