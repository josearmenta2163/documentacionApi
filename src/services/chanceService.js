const AppError = require('../utils/AppError');
const { apuestaMinChance, apuestaMaxChance } = require('../config');

/** Multiplicador de pago por cantidad de cifras acertadas (4, 3, 2 o 1). */
const TABLA_PAGOS = { 4: 4500, 3: 400, 2: 50, 1: 5 };

/** Modalidades de apuesta: DIRECTO (orden exacto) o COMBINADO (cualquier orden). */
const MODALIDADES = ['DIRECTO', 'COMBINADO'];

/**
 * Genera todas las permutaciones distintas de las cifras de un número.
 * Por qué: se usa un Set para descartar repetidas (ej. "112" tiene 3, no 6),
 * porque el premio combinado se divide entre combinaciones distintas.
 * @traceability HU-002 (Venta de chance)
 * @param {string} numero Cifras a permutar (ej. "123").
 * @returns {Set<string>} Permutaciones únicas.
 */
function permutaciones(numero) {
  if (numero.length <= 1) return new Set([numero]);
  const resultado = new Set();
  [...numero].forEach((digito, i) => {
    const resto = numero.slice(0, i) + numero.slice(i + 1);
    permutaciones(resto).forEach((p) => resultado.add(digito + p));
  });
  return resultado;
}

/**
 * Valida una apuesta de chance y la devuelve normalizada.
 * Por qué: el valor debe estar entre el mínimo y el máximo configurados y ser
 * múltiplo de 100; COMBINADO solo aplica a 3 o 4 cifras que se puedan reordenar.
 * @traceability HU-002 (Venta de chance)
 * @param {{numero: string, modalidad?: string, valor: number}} apuesta Apuesta recibida.
 * @returns {{numero: string, cifras: number, modalidad: string, valor: number}} Apuesta válida.
 * @throws {AppError} 400 si el número, la modalidad o el valor no cumplen las reglas.
 */
function validarApuesta(apuesta) {
  const { numero, modalidad = 'DIRECTO', valor } = apuesta || {};

  if (typeof numero !== 'string' || !/^\d{1,4}$/.test(numero)) {
    throw new AppError('El número debe tener entre 1 y 4 dígitos');
  }
  if (!MODALIDADES.includes(modalidad)) {
    throw new AppError(`Modalidad inválida: ${modalidad}`);
  }
  if (modalidad === 'COMBINADO' && numero.length < 3) {
    throw new AppError('La modalidad COMBINADO solo aplica para 3 o 4 cifras');
  }
  if (modalidad === 'COMBINADO' && permutaciones(numero).size === 1) {
    throw new AppError('Un número con todas las cifras iguales no se puede combinar');
  }
  if (!Number.isInteger(valor) || valor < apuestaMinChance || valor > apuestaMaxChance) {
    throw new AppError(`El valor debe estar entre ${apuestaMinChance} y ${apuestaMaxChance}`);
  }
  if (valor % 100 !== 0) {
    throw new AppError('El valor debe ser múltiplo de 100');
  }

  return { numero, cifras: numero.length, modalidad, valor };
}

/**
 * Calcula el premio de una apuesta frente al resultado del sorteo.
 * Por qué: se compara con las últimas N cifras del resultado (N = cifras de la
 * apuesta); en COMBINADO el premio se divide entre las combinaciones posibles y
 * se redondea hacia abajo, para no pagar más de lo previsto.
 * @traceability HU-006 (Resultado y pago de premios)
 * @param {{numero: string, cifras: number, modalidad: string, valor: number}} apuesta Apuesta validada.
 * @param {string} resultado Resultado del sorteo (4 dígitos).
 * @returns {number} Premio en pesos; 0 si no acertó.
 */
function calcularPremio(apuesta, resultado) {
  const ganador = resultado.slice(-apuesta.cifras);
  const factor = TABLA_PAGOS[apuesta.cifras];

  if (apuesta.modalidad === 'DIRECTO') {
    return apuesta.numero === ganador ? apuesta.valor * factor : 0;
  }

  const combinaciones = permutaciones(apuesta.numero);
  if (!combinaciones.has(ganador)) return 0;
  return Math.floor((apuesta.valor * factor) / combinaciones.size);
}

/**
 * Valida el resultado de un sorteo de chance.
 * @traceability HU-006 (Resultado y pago de premios)
 * @param {string} resultado Resultado recibido.
 * @returns {string} El mismo resultado, si es válido.
 * @throws {AppError} 400 si no es un texto de exactamente 4 dígitos.
 */
function validarResultado(resultado) {
  if (typeof resultado !== 'string' || !/^\d{4}$/.test(resultado)) {
    throw new AppError('El resultado de chance debe ser un número de 4 dígitos');
  }
  return resultado;
}

module.exports = { validarApuesta, calcularPremio, validarResultado, permutaciones, TABLA_PAGOS };
