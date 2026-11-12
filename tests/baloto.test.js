const request = require('supertest');
const app = require('../src/app');
const { resetDb, obtenerTokenAdmin, obtenerTokenVendedor } = require('./helpers');

beforeEach(() => resetDb());

/**
 * Pruebas para la venta y reglas de negocio de Baloto (HU-003).
 * Por qué: valida que las apuestas de Baloto cumplan con los números correctos y rangos.
 * @traceability HU-003 (Venta de Baloto)
 */
describe('Baloto API', () => {
  it('debe permitir vender un tiquete de Baloto de forma válida', async () => {
    const token = await obtenerTokenVendedor(app);
    const res = await request(app)
      .post('/api/v1/tickets/baloto')
      .set('Authorization', `Bearer ${token}`)
      .send({ sorteoId: 3, numeros: [5, 12, 23, 34, 41], superbalota: 10, automatico: false });
    expect(res.statusCode).toEqual(201);
    expect(res.body.datos).toHaveProperty('codigo');
  });
});
