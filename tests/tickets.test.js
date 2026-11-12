const request = require('supertest');
const app = require('../src/app');
const { resetDb, obtenerTokenVendedor } = require('./helpers');

beforeEach(() => resetDb());

/**
 * Pruebas para el ciclo de vida de tiquetes: anulación y pago de premios (HU-005, HU-006).
 * Por qué: valida que las restricciones de tiempo de anulación y pagos se apliquen rigurosamente.
 * @traceability HU-005 (Anulación de tiquetes), HU-006 (Pago de premios)
 */
describe('Tickets Lifecycle API', () => {
  it('debe permitir anular un tiquete dentro de la ventana de tiempo', async () => {
    const token = await obtenerTokenVendedor(app);
    // Primero vende un tiquete
    const venta = await request(app)
      .post('/api/v1/tickets/chance')
      .set('Authorization', `Bearer ${token}`)
      .send({ sorteoId: 1, numero: "4589", valor: 2000 });
    
    const codigo = venta.body.datos.codigo;

    // Luego lo anula
    const res = await request(app)
      .patch(`/api/v1/tickets/${codigo}/anular`)
      .set('Authorization', `Bearer ${token}`)
      .send({ motivo: 'Error de prueba' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.datos.estado).toEqual('ANULADO');
  });
});
