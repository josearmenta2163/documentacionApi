const { zonaHoraria } = require('../config');

/**
 * Devuelve la fecha calendario (AAAA-MM-DD) en la zona horaria configurada.
 * Por qué: el cierre de caja se agrupa por día local de Bogotá, no por día UTC;
 * de lo contrario las ventas de la noche caerían en el día siguiente.
 * @traceability HU-008 (Resumen y cierre de caja)
 * @param {Date|string|number} [fecha=new Date()] Fecha a convertir.
 * @returns {string} Fecha en formato AAAA-MM-DD.
 */
const fechaLocal = (fecha = new Date()) =>
  new Date(fecha).toLocaleDateString('en-CA', { timeZone: zonaHoraria });

/**
 * Calcula los minutos transcurridos entre dos momentos.
 * Por qué: es la base de las reglas por tiempo (ventana de anulación y cierre de ventas).
 * @traceability HU-004 (Bloqueo de ventas en sorteo cerrado), HU-005 (Anulación de tiquetes)
 * @param {Date|string|number} desde Momento inicial.
 * @param {Date|string|number} [hasta=new Date()] Momento final.
 * @returns {number} Minutos (puede ser decimal o negativo si hasta es anterior a desde).
 */
const minutosEntre = (desde, hasta = new Date()) =>
  (new Date(hasta).getTime() - new Date(desde).getTime()) / 60000;

/**
 * Calcula los días transcurridos entre dos momentos.
 * Por qué: se usa para decidir si un premio ya caducó.
 * @traceability HU-006 (Resultado y pago de premios)
 * @param {Date|string|number} desde Momento inicial.
 * @param {Date|string|number} [hasta=new Date()] Momento final.
 * @returns {number} Días (decimal).
 */
const diasEntre = (desde, hasta = new Date()) => minutosEntre(desde, hasta) / 1440;

module.exports = { fechaLocal, minutosEntre, diasEntre };
