const AppError = require('../utils/AppError');

/** Número más alto permitido entre las 5 balotas principales. */
const MAX_NUMERO = 43;
/** Número más alto permitido en la superbalota. */
const MAX_SUPERBALOTA = 16;

/**
 * Tabla de premios por aciertos, con la clave "balotas+superbalota".
 * "ACUMULADO" significa que el premio es el acumulado vigente del sorteo.
 */
const PREMIOS = {
  '5+1': 'ACUMULADO',
  '5+0': 50000000,
  '4+1': 2000000,
  '4+0': 150000,
  '3+1': 40000,
  '3+0': 12000,
  '2+1': 9000,
  '1+1': 5700,
  '0+1': 5700,
};

/**
 * Genera un entero aleatorio dentro de un rango inclusivo.
 * @traceability HU-003 (Venta de Baloto)
 * @param {number} min Valor mínimo (incluido).
 * @param {number} max Valor máximo (incluido).
 * @returns {number} Entero entre min y max.
 */
function aleatorioEntre(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Genera una jugada aleatoria ("Revancha" / "al azar").
 * Por qué: se usa un Set para garantizar 5 números distintos y se ordenan para
 * que la jugada quede siempre en el mismo formato.
 * @traceability HU-003 (Venta de Baloto)
 * @returns {{numeros: number[], superbalota: number}} Jugada con 5 números y una superbalota.
 */
function generarAleatoria() {
  const numeros = new Set();
  while (numeros.size < 5) numeros.add(aleatorioEntre(1, MAX_NUMERO));
  return {
    numeros: [...numeros].sort((a, b) => a - b),
    superbalota: aleatorioEntre(1, MAX_SUPERBALOTA),
  };
}

/**
 * Valida una jugada de Baloto (o genera una aleatoria si se pide).
 * Por qué: la misma función valida las jugadas de venta y el resultado del
 * sorteo, porque ambos tienen la misma forma (5 números + superbalota).
 * @traceability HU-003 (Venta de Baloto), HU-006 (Resultado y pago de premios)
 * @param {{aleatoria?: boolean, numeros?: number[], superbalota?: number}} jugada Jugada recibida.
 * @returns {{numeros: number[], superbalota: number}} Jugada válida con números ordenados.
 * @throws {AppError} 400 si no hay 5 números, están fuera de rango, se repiten o la superbalota es inválida.
 */
function validarJugada(jugada) {
  if (jugada && jugada.aleatoria === true) return generarAleatoria();

  const { numeros, superbalota } = jugada || {};
  if (!Array.isArray(numeros) || numeros.length !== 5) {
    throw new AppError('Cada jugada debe tener exactamente 5 números');
  }
  if (!numeros.every((n) => Number.isInteger(n) && n >= 1 && n <= MAX_NUMERO)) {
    throw new AppError(`Los números deben estar entre 1 y ${MAX_NUMERO}`);
  }
  if (new Set(numeros).size !== 5) {
    throw new AppError('Los números de una jugada no se pueden repetir');
  }
  if (!Number.isInteger(superbalota) || superbalota < 1 || superbalota > MAX_SUPERBALOTA) {
    throw new AppError(`La superbalota debe estar entre 1 y ${MAX_SUPERBALOTA}`);
  }
  return { numeros: [...numeros].sort((a, b) => a - b), superbalota };
}

/**
 * Calcula el premio de una jugada frente al resultado del sorteo.
 * Por qué: se cuentan los aciertos de balotas y de superbalota por separado y se
 * busca la combinación en PREMIOS; con 5+1 el premio es el acumulado del sorteo.
 * @traceability HU-006 (Resultado y pago de premios)
 * @param {{numeros: number[], superbalota: number}} jugada Jugada validada.
 * @param {{numeros: number[], superbalota: number}} resultado Resultado del sorteo.
 * @param {number} [acumulado=0] Acumulado vigente del sorteo.
 * @returns {number} Premio en pesos; 0 si la combinación no gana.
 */
function calcularPremio(jugada, resultado, acumulado = 0) {
  const aciertos = jugada.numeros.filter((n) => resultado.numeros.includes(n)).length;
  const sb = jugada.superbalota === resultado.superbalota ? 1 : 0;
  const premio = PREMIOS[`${aciertos}+${sb}`];
  if (!premio) return 0;
  return premio === 'ACUMULADO' ? acumulado : premio;
}

module.exports = { validarJugada, calcularPremio, generarAleatoria, PREMIOS };
