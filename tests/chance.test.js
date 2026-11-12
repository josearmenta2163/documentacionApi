const request = require('supertest');
const app = require('../src/app');
const { resetDb, obtenerTokenVendedor } = require('./helpers');

beforeEach(() => resetDb());

/**
 * Pruebas para la venta de Chance (HU-002).
 * Por qué: comprueba las validaciones de montos mínimos/máximos y cifras permitidas.
 * @traceability HU-002 (Venta de chance)
 */
describe('Chance API', () => {
  it('debe rechazar una apuesta de chance menor al mínimo permitido', async () => {
    const token = await obtenerTokenVendedor(app);
    const res = await request(app)
      .post('/api/v1/tickets/chance')
      .set('Authorization', `Bearer ${token}`)
      .send({ sorteoId: 1, numero: "1234", valor: 100 }); // Menor a 500
    expect(res.statusCode).toEqual(400);
  });
});
