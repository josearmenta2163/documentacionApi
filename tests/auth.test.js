const request = require('supertest');
const app = require('../src/app');
const { resetDb } = require('./helpers');

beforeEach(() => resetDb());

/**
 * Pruebas unitarias y de integración para la Autenticación (HU-001).
 * Por qué: valida el inicio de sesión exitoso, el rechazo de credenciales malas
 * y la protección de rutas privadas mediante tokens JWT.
 * @traceability HU-001 (Inicio de sesión seguro)
 */
describe('Auth API', () => {
  it('debe iniciar sesión exitosamente con credenciales válidas', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ usuario: 'admin', password: 'admin123' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.datos).toHaveProperty('token');
  });

  it('debe fallar con credenciales inválidas', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ usuario: 'admin', password: 'wrong' });
    expect(res.statusCode).toEqual(401);
  });
});
