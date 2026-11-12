const request = require('supertest');
const app = require('../src/app');
const { resetDb, obtenerTokenVendedor } = require('./helpers');

beforeEach(() => resetDb());

/**
 * Pruebas para el manejo de caja y arqueo diario (HU-008).
 * Por qué: asegura que el resumen financiero y los cierres de caja operen correctamente.
 * @traceability HU-008 (Resumen y cierre de caja)
 */
describe('Caja API', () => {
  it('debe consultar el resumen de caja diario con éxito', async () => {
    const token = await obtenerTokenVendedor(app);
    const res = await request(app)
      .get('/api/v1/caja/resumen')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.datos).toHaveProperty('totalVentas');
  });
});
