const { getDb, nextId } = require('../data/store');
const AppError = require('../utils/AppError');
const chance = require('./chanceService');
const baloto = require('./balotoService');
const { minutosCierreVentas } = require('../config');
const { minutosEntre } = require('../utils/fechas');

/** Tipos de sorteo que maneja el sistema. */
const TIPOS = ['CHANCE', 'BALOTO'];

/**
 * Lista sorteos con filtros opcionales.
 * @traceability HU-007 (Gestión de sorteos)
 * @param {Object} [filtros] Filtros de consulta.
 * @param {'CHANCE'|'BALOTO'} [filtros.tipo] Tipo de sorteo.
 * @param {'ABIERTO'|'JUGADO'} [filtros.estado] Estado del sorteo.
 * @returns {Array<Object>} Sorteos que cumplen los filtros.
 */
function listar({ tipo, estado } = {}) {
  return getDb().sorteos.filter((s) => (!tipo || s.tipo === tipo) && (!estado || s.estado === estado));
}

/**
 * Obtiene un sorteo por su identificador.
 * Por qué: el id llega como texto desde la URL, por eso se convierte con Number().
 * @traceability HU-007 (Gestión de sorteos)
 * @param {number|string} id Identificador del sorteo.
 * @returns {Object} Sorteo encontrado.
 * @throws {AppError} 404 si no existe.
 */
function obtener(id) {
  const sorteo = getDb().sorteos.find((s) => s.id === Number(id));
  if (!sorteo) throw new AppError('Sorteo no encontrado', 404);
  return sorteo;
}

/**
 * Crea un sorteo nuevo en estado ABIERTO.
 * Por qué: la fecha debe ser futura para que no se creen sorteos que ya
 * deberían estar cerrados; el acumulado solo aplica a Baloto.
 * @traceability HU-007 (Gestión de sorteos)
 * @param {Object} datos Cuerpo de la petición.
 * @param {'CHANCE'|'BALOTO'} datos.tipo Tipo de sorteo.
 * @param {string} datos.nombre Nombre del sorteo.
 * @param {string} datos.fecha Fecha y hora del sorteo (ISO), posterior a la actual.
 * @param {number} [datos.acumulado=0] Acumulado inicial (solo Baloto).
 * @returns {Object} Sorteo creado.
 * @throws {AppError} 400 si el tipo, el nombre o la fecha no son válidos.
 */
function crear({ tipo, nombre, fecha, acumulado = 0 }) {
  if (!TIPOS.includes(tipo)) throw new AppError('Tipo de sorteo inválido');
  if (!nombre) throw new AppError('El nombre es obligatorio');
  if (!fecha || Number.isNaN(Date.parse(fecha))) throw new AppError('Fecha inválida');
  if (new Date(fecha) <= new Date()) throw new AppError('La fecha del sorteo debe ser futura');

  const sorteo = {
    id: nextId('sorteos'),
    tipo,
    nombre,
    fecha: new Date(fecha).toISOString(),
    estado: 'ABIERTO',
    resultado: null,
    acumulado: tipo === 'BALOTO' ? acumulado : 0,
  };
  getDb().sorteos.push(sorteo);
  return sorteo;
}

/**
 * Verifica que un sorteo admita ventas del tipo indicado.
 * Por qué: las ventas se cierran MINUTOS_CIERRE_VENTAS antes del sorteo para
 * que nadie compre tiquetes con información de última hora.
 * @traceability HU-004 (Bloqueo de ventas en sorteo cerrado)
 * @param {Object} sorteo Sorteo a verificar.
 * @param {'CHANCE'|'BALOTO'} tipoEsperado Tipo de tiquete que se quiere vender.
 * @returns {void}
 * @throws {AppError} 400 si el tipo no coincide; 409 si el sorteo no está abierto
 * o ya cerraron las ventas.
 */
function verificarVentaPermitida(sorteo, tipoEsperado) {
  if (sorteo.tipo !== tipoEsperado) throw new AppError(`El sorteo no es de tipo ${tipoEsperado}`);
  if (sorteo.estado !== 'ABIERTO') throw new AppError('El sorteo no está abierto para ventas', 409);
  if (minutosEntre(new Date(), sorteo.fecha) < minutosCierreVentas) {
    throw new AppError('Las ventas para este sorteo ya cerraron', 409);
  }
}

/**
 * Registra el resultado de un sorteo y liquida sus tiquetes.
 * Por qué: al cambiar el estado a JUGADO se calcula de una vez el premio de cada
 * tiquete activo, de modo que el pago posterior solo consulta el valor ya liquidado.
 * @traceability HU-006 (Resultado y pago de premios), HU-007 (Gestión de sorteos)
 * @param {number|string} id Identificador del sorteo.
 * @param {string|Object} resultado Chance: texto de 4 dígitos. Baloto: {numeros, superbalota}.
 * @returns {Object} Sorteo actualizado con estado JUGADO.
 * @throws {AppError} 404 si no existe; 409 si ya tiene resultado; 400 si el resultado es inválido.
 */
function registrarResultado(id, resultado) {
  const sorteo = obtener(id);
  if (sorteo.estado === 'JUGADO') throw new AppError('El sorteo ya tiene resultado', 409);

  sorteo.resultado = sorteo.tipo === 'CHANCE'
    ? chance.validarResultado(resultado)
    : baloto.validarJugada(resultado);
  sorteo.estado = 'JUGADO';
  sorteo.jugadoEn = new Date().toISOString();

  getDb().tickets
    .filter((t) => t.sorteoId === sorteo.id && t.estado === 'ACTIVO')
    .forEach((t) => liquidarTicket(t, sorteo));

  return sorteo;
}

/**
 * Calcula y guarda el premio de un tiquete según el resultado del sorteo.
 * Por qué: cada apuesta o jugada guarda su propio premio y el tiquete guarda la
 * suma, lo que permite explicar de dónde salió el valor total.
 * @traceability HU-006 (Resultado y pago de premios)
 * @param {Object} ticket Tiquete activo del sorteo (se modifica).
 * @param {Object} sorteo Sorteo ya jugado, con su resultado.
 * @returns {void}
 */
function liquidarTicket(ticket, sorteo) {
  if (sorteo.tipo === 'CHANCE') {
    ticket.apuestas.forEach((a) => { a.premio = chance.calcularPremio(a, sorteo.resultado); });
    ticket.premio = ticket.apuestas.reduce((s, a) => s + a.premio, 0);
  } else {
    ticket.jugadas.forEach((j) => { j.premio = baloto.calcularPremio(j, sorteo.resultado, sorteo.acumulado); });
    ticket.premio = ticket.jugadas.reduce((s, j) => s + j.premio, 0);
  }
}

module.exports = { listar, obtener, crear, registrarResultado, verificarVentaPermitida };
