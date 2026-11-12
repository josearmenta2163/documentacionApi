require('dotenv').config();

/**
 * Convierte una variable de entorno a entero, con valor por defecto.
 * Por qué: las variables de entorno siempre llegan como texto; si falta o no es
 * un número, se usa el valor por defecto en lugar de dejar pasar un NaN.
 * @traceability RNF-003 (Configuración por variables de entorno)
 * @param {string|undefined} valor Valor leído de process.env.
 * @param {number} porDefecto Valor a usar si no se puede convertir.
 * @returns {number} Entero resultante.
 */
const entero = (valor, porDefecto) => {
  const n = parseInt(valor, 10);
  return Number.isNaN(n) ? porDefecto : n;
};

/**
 * Configuración central de la aplicación.
 * Por qué: todas las reglas de negocio ajustables (tiempos, límites y valores)
 * viven aquí y se leen del archivo .env, así se cambian sin tocar el código.
 * Los nombres de las variables están documentados en .env.example y en el README.
 * @traceability RNF-003 (Configuración por variables de entorno)
 * @type {{
 *   port: number,
 *   jwtSecret: string,
 *   jwtExpiresIn: string,
 *   zonaHoraria: string,
 *   minutosAnulacion: number,
 *   minutosCierreVentas: number,
 *   apuestaMinChance: number,
 *   apuestaMaxChance: number,
 *   valorBaloto: number,
 *   diasCaducidadPremio: number
 * }}
 */
module.exports = {
  // Puerto donde escucha el servidor.
  port: entero(process.env.PORT, 3000),
  // Secreto para firmar los JWT. El valor por defecto es solo de desarrollo: en producción debe cambiarse.
  jwtSecret: process.env.JWT_SECRET || 'cambiar-este-secreto',
  // Duración del token de sesión.
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  // Zona horaria usada para agrupar la caja por día.
  zonaHoraria: process.env.ZONA_HORARIA || 'America/Bogota',
  // Minutos que tiene un vendedor para anular un tiquete después de venderlo.
  minutosAnulacion: entero(process.env.MINUTOS_ANULACION, 10),
  // Minutos antes del sorteo en que se cierran las ventas.
  minutosCierreVentas: entero(process.env.MINUTOS_CIERRE_VENTAS, 15),
  // Valor mínimo de una apuesta de chance, en pesos.
  apuestaMinChance: entero(process.env.APUESTA_MIN_CHANCE, 500),
  // Valor máximo de una apuesta de chance, en pesos.
  apuestaMaxChance: entero(process.env.APUESTA_MAX_CHANCE, 50000),
  // Precio de una jugada de Baloto, en pesos.
  valorBaloto: entero(process.env.VALOR_BALOTO, 5700),
  // Días que tiene un ganador para cobrar su premio.
  diasCaducidadPremio: entero(process.env.DIAS_CADUCIDAD_PREMIO, 365),
};
