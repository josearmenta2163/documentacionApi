const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const { buscarPorId } = require('../services/authService');
const AppError = require('../utils/AppError');

/**
 * Middleware que exige un token JWT válido en la cabecera Authorization.
 * Por qué: se vuelve a consultar al usuario en cada petición para rechazar
 * tokens de usuarios eliminados o desactivados antes de que el token expire.
 * @traceability HU-001 (Inicio de sesión seguro)
 * @param {import('express').Request} req Debe traer "Authorization: Bearer <token>".
 * @param {import('express').Response} res Respuesta HTTP (no se usa directamente).
 * @param {import('express').NextFunction} next Continúa la cadena o pasa un AppError 401.
 * @returns {void} Si es válido, deja el usuario en req.usuario.
 */
function autenticar(req, res, next) {
  const [esquema, token] = (req.headers.authorization || '').split(' ');
  if (esquema !== 'Bearer' || !token) return next(new AppError('Token requerido', 401));

  try {
    const payload = jwt.verify(token, jwtSecret);
    const usuario = buscarPorId(payload.id);
    if (!usuario || !usuario.activo) return next(new AppError('Usuario no válido', 401));
    req.usuario = usuario;
    next();
  } catch (e) {
    next(new AppError('Token inválido o expirado', 401));
  }
}

/**
 * Fábrica de middlewares que restringe una ruta a ciertos roles.
 * Por qué: separa la autorización (qué puede hacer) de la autenticación
 * (quién es), y debe usarse siempre después de autenticar().
 * @traceability HU-009 (Control de acceso por rol)
 * @param {...string} roles Roles permitidos (ej. "ADMIN", "VENDEDOR").
 * @returns {import('express').RequestHandler} Middleware que responde 403 si el rol no está permitido.
 */
const permitir = (...roles) => (req, res, next) =>
  roles.includes(req.usuario.rol) ? next() : next(new AppError('No tiene permisos para esta acción', 403));

module.exports = { autenticar, permitir };
