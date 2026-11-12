const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../data/store');
const { jwtSecret, jwtExpiresIn } = require('../config');
const AppError = require('../utils/AppError');

/**
 * Autentica a un usuario y entrega un token JWT.
 * Por qué: el mismo mensaje "Credenciales inválidas" se usa para usuario
 * inexistente y contraseña errónea, así no se revela qué usuarios existen.
 * @traceability HU-001 (Inicio de sesión seguro)
 * @param {string} usuario Nombre de usuario (ej. "vendedor1").
 * @param {string} password Contraseña en texto plano; se compara contra el hash bcrypt.
 * @returns {{token: string, usuario: Object}} Token JWT y perfil básico del usuario.
 * @throws {AppError} 400 si faltan datos, 401 si las credenciales son inválidas,
 * 403 si el usuario está inactivo.
 */
function login(usuario, password) {
  if (!usuario || !password) throw new AppError('Usuario y contraseña son obligatorios');

  const encontrado = getDb().usuarios.find((u) => u.usuario === usuario);
  if (!encontrado || !bcrypt.compareSync(password, encontrado.password)) {
    throw new AppError('Credenciales inválidas', 401);
  }
  if (!encontrado.activo) throw new AppError('Usuario inactivo', 403);

  const token = jwt.sign({ id: encontrado.id, rol: encontrado.rol }, jwtSecret, { expiresIn: jwtExpiresIn });
  return { token, usuario: perfil(encontrado) };
}

/**
 * Construye la vista pública de un usuario.
 * Por qué: se devuelven solo los campos necesarios para que el hash de la
 * contraseña nunca salga en una respuesta de la API.
 * @traceability HU-001 (Inicio de sesión seguro)
 * @param {Object} u Usuario completo del almacén de datos.
 * @returns {{id: number, usuario: string, nombre: string, rol: string}} Datos públicos.
 */
function perfil(u) {
  return { id: u.id, usuario: u.usuario, nombre: u.nombre, rol: u.rol };
}

/**
 * Busca un usuario por su identificador.
 * Por qué: el middleware de autenticación lo usa para confirmar en cada petición
 * que el usuario del token sigue existiendo y activo.
 * @traceability HU-001 (Inicio de sesión seguro)
 * @param {number} id Identificador del usuario (viene dentro del token).
 * @returns {Object|undefined} Usuario encontrado, o undefined si no existe.
 */
function buscarPorId(id) {
  return getDb().usuarios.find((u) => u.id === id);
}

module.exports = { login, perfil, buscarPorId };
