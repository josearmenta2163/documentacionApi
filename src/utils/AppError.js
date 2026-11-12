/**
 * Error de negocio con código de estado HTTP.
 * Por qué: permite que los servicios lancen errores con su status (400, 401, 403,
 * 404, 409...) y que el manejador central los traduzca a una respuesta JSON.
 * @traceability RNF-001 (Manejo uniforme de errores)
 * @extends Error
 */
class AppError extends Error {
  /**
   * @param {string} mensaje Mensaje que verá el cliente de la API.
   * @param {number} [status=400] Código de estado HTTP.
   */
  constructor(mensaje, status = 400) {
    super(mensaje);
    this.status = status;
  }
}

module.exports = AppError;
