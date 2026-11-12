const { reset } = require('../src/data/store');

/**
 * Utilidades y funciones auxiliares para el entorno de pruebas de Jest.
 * Por qué: permite limpiar la base de datos en memoria y autenticar usuarios rápidamente en los tests.
 */
async function resetDb() {
  reset();
}

async function obtenerTokenAdmin(app) {
  // Lógica auxiliar de login para pruebas
  const request = require('supertest');
  const res = await request(app).post('/api/v1/auth/login').send({ usuario: 'admin', password: 'admin123' });
  return res.body.datos.token;
}

async function obtenerTokenVendedor(app) {
  const request = require('supertest');
  const res = await request(app).post('/api/v1/auth/login').send({ usuario: 'vendedor1', password: 'vende123' });
  return res.body.datos.token;
}

module.exports = { resetDb, obtenerTokenAdmin, obtenerTokenVendedor };
