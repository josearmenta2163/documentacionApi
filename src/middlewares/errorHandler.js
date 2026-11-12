const AppError = require('../utils/AppError');

/**
 * Middleware para rutas inexistentes.
 * Por qué: convierte cualquier ruta no definida en un AppError 404, de modo que
 * el manejador central responda siempre con el mismo formato JSON.
 * @traceability RNF-001 (Manejo uniforme de errores)
 * @param {import('express').Request} req Petición que no coincidió con ninguna ruta.
 * @param {import('express').Response} res Respuesta HTTP (no se usa directamente).
 * @param {import('express').NextFunction} next Pasa el AppError 404 al manejador de errores.
 * @returns {void}
 */
function noEncontrado(req, res, next) {
  next(new AppError(`Ruta ${req.method} ${req.originalUrl} no existe`, 404));
}

/**
 * Manejador central de errores de la API.
 * Por qué: los errores 500 se registran en el servidor pero al cliente solo se le
 * devuelve un mensaje genérico, para no filtrar detalles internos.
 * @traceability RNF-001 (Manejo uniforme de errores)
 * @param {Error & {status?: number, type?: string}} err Error recibido.
 * @param {import('express').Request} req Petición original.
 * @param {import('express').Response} res Respuesta donde se envía {error: mensaje}.
 * @param {import('express').NextFunction} next Requerido por Express para reconocer un manejador de errores.
 * @returns {void}
 */
function manejarErrores(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON mal formado' });
  }
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Error interno del servidor' : err.message });
}

module.exports = { noEncontrado, manejarErrores };
