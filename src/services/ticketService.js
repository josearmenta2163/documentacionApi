const crypto = require('crypto');
const { getDb, nextId } = require('../data/store');
const AppError = require('../utils/AppError');
const chance = require('./chanceService');
const baloto = require('./balotoService');
const sorteos = require('./sorteoService');
const { valorBaloto, minutosAnulacion, diasCaducidadPremio } = require('../config');
const { minutosEntre, diasEntre } = require('../utils/fechas');

/**
 * Genera el código único e impredecible de un tiquete.
 * Por qué: se usa crypto.randomBytes y no un consecutivo para que nadie pueda
 * adivinar el código de otro tiquete y cobrar su premio.
 * @traceability HU-002 (Venta de chance), HU-003 (Venta de Baloto)
 * @param {'CHANCE'|'BALOTO'} tipo Tipo de tiquete; define el prefijo (CH- o BL-).
 * @returns {string} Código como "CH-1A2B3C4D".
 */
function generarCodigo(tipo) {
  const prefijo = tipo === 'CHANCE' ? 'CH' : 'BL';
  return `${prefijo}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

/**
 * Persiste un tiquete en el almacén de datos.
 * @traceability HU-002 (Venta de chance), HU-003 (Venta de Baloto)
 * @param {Object} ticket Tiquete ya validado y completo.
 * @returns {Object} El mismo tiquete guardado.
 */
function guardar(ticket) {
  getDb().tickets.push(ticket);
  return ticket;
}

/**
 * Vende un tiquete de chance con una a cinco apuestas.
 * Por qué: primero se valida que el sorteo admita ventas y luego cada apuesta,
 * para no guardar nunca un tiquete a medias.
 * @traceability HU-002 (Venta de chance), HU-004 (Bloqueo de ventas en sorteo cerrado)
 * @param {{id: number}} vendedor Vendedor autenticado que realiza la venta.
 * @param {Object} datos Cuerpo de la petición.
 * @param {number} datos.sorteoId Identificador del sorteo de chance.
 * @param {Array<{numero: string, modalidad?: string, valor: number}>} datos.apuestas Entre 1 y 5 apuestas.
 * @param {string} [datos.cliente] Nombre del cliente (opcional).
 * @returns {Object} Tiquete creado con su código y el total a cobrar.
 * @throws {AppError} 400 si las apuestas son inválidas; 404 si el sorteo no existe;
 * 409 si el sorteo no admite ventas.
 */
function venderChance(vendedor, { sorteoId, apuestas, cliente }) {
  const sorteo = sorteos.obtener(sorteoId);
  sorteos.verificarVentaPermitida(sorteo, 'CHANCE');

  if (!Array.isArray(apuestas) || apuestas.length === 0 || apuestas.length > 5) {
    throw new AppError('Un tiquete de chance debe tener entre 1 y 5 apuestas');
  }
  const validas = apuestas.map(chance.validarApuesta);

  return guardar({
    id: nextId('tickets'),
    codigo: generarCodigo('CHANCE'),
    tipo: 'CHANCE',
    sorteoId: sorteo.id,
    vendedorId: vendedor.id,
    cliente: cliente || null,
    apuestas: validas,
    total: validas.reduce((s, a) => s + a.valor, 0),
    estado: 'ACTIVO',
    premio: null,
    creadoEn: new Date().toISOString(),
  });
}

/**
 * Vende un tiquete de Baloto con una a diez jugadas.
 * Por qué: el total se calcula en el servidor (jugadas x valorBaloto) y nunca se
 * toma del cliente, para evitar manipulación del precio.
 * @traceability HU-003 (Venta de Baloto), HU-004 (Bloqueo de ventas en sorteo cerrado)
 * @param {{id: number}} vendedor Vendedor autenticado que realiza la venta.
 * @param {Object} datos Cuerpo de la petición.
 * @param {number} datos.sorteoId Identificador del sorteo de Baloto.
 * @param {Array<Object>} datos.jugadas Entre 1 y 10 jugadas (manuales o aleatorias).
 * @param {string} [datos.cliente] Nombre del cliente (opcional).
 * @returns {Object} Tiquete creado con su código y el total a cobrar.
 * @throws {AppError} 400 si las jugadas son inválidas; 404 si el sorteo no existe;
 * 409 si el sorteo no admite ventas.
 */
function venderBaloto(vendedor, { sorteoId, jugadas, cliente }) {
  const sorteo = sorteos.obtener(sorteoId);
  sorteos.verificarVentaPermitida(sorteo, 'BALOTO');

  if (!Array.isArray(jugadas) || jugadas.length === 0 || jugadas.length > 10) {
    throw new AppError('Un tiquete de Baloto debe tener entre 1 y 10 jugadas');
  }
  const validas = jugadas.map(baloto.validarJugada);

  return guardar({
    id: nextId('tickets'),
    codigo: generarCodigo('BALOTO'),
    tipo: 'BALOTO',
    sorteoId: sorteo.id,
    vendedorId: vendedor.id,
    cliente: cliente || null,
    jugadas: validas,
    total: validas.length * valorBaloto,
    estado: 'ACTIVO',
    premio: null,
    creadoEn: new Date().toISOString(),
  });
}

/**
 * Busca un tiquete por su código.
 * @traceability HU-005 (Anulación de tiquetes), HU-006 (Resultado y pago de premios)
 * @param {string} codigo Código del tiquete.
 * @returns {Object} Tiquete encontrado.
 * @throws {AppError} 404 si no existe.
 */
function buscar(codigo) {
  const ticket = getDb().tickets.find((t) => t.codigo === codigo);
  if (!ticket) throw new AppError('Tiquete no encontrado', 404);
  return ticket;
}

/**
 * Lista tiquetes con filtros opcionales.
 * Por qué: un VENDEDOR solo ve sus propios tiquetes; el ADMIN ve todos.
 * @traceability HU-009 (Control de acceso por rol)
 * @param {{id: number, rol: string}} usuario Usuario autenticado.
 * @param {Object} [filtros] Filtros de consulta.
 * @param {string} [filtros.fecha] Prefijo de fecha ISO (ej. "2026-11-12").
 * @param {string} [filtros.estado] Estado del tiquete (ACTIVO, ANULADO, PAGADO, CADUCADO).
 * @returns {Array<Object>} Tiquetes que cumplen los filtros y que el usuario puede ver.
 */
function listar(usuario, { fecha, estado } = {}) {
  return getDb().tickets.filter((t) =>
    (usuario.rol === 'ADMIN' || t.vendedorId === usuario.id) &&
    (!estado || t.estado === estado) &&
    (!fecha || t.creadoEn.startsWith(fecha)));
}

/**
 * Consulta un tiquete junto con los datos de su sorteo.
 * Por qué: el campo "ganador" es null mientras el sorteo no se haya jugado, para
 * no afirmar nada antes de que exista un resultado.
 * @traceability HU-006 (Resultado y pago de premios)
 * @param {string} codigo Código del tiquete.
 * @returns {Object} Tiquete con el resumen del sorteo y si es ganador.
 * @throws {AppError} 404 si el tiquete o su sorteo no existen.
 */
function consultar(codigo) {
  const ticket = buscar(codigo);
  const sorteo = sorteos.obtener(ticket.sorteoId);
  return {
    ...ticket,
    sorteo: { id: sorteo.id, nombre: sorteo.nombre, fecha: sorteo.fecha, estado: sorteo.estado, resultado: sorteo.resultado },
    ganador: sorteo.estado === 'JUGADO' ? ticket.premio > 0 : null,
  };
}

/**
 * Anula un tiquete activo.
 * Por qué: el vendedor solo puede anular dentro de una ventana corta
 * (MINUTOS_ANULACION) y en tiquetes propios, para evitar fraude; el ADMIN no
 * tiene esa restricción. Siempre se exige el motivo para dejar auditoría.
 * @traceability HU-005 (Anulación de tiquetes)
 * @param {string} codigo Código del tiquete.
 * @param {{id: number, rol: string}} usuario Usuario autenticado.
 * @param {string} motivo Motivo obligatorio de la anulación.
 * @returns {Object} Tiquete con estado ANULADO y los datos de la anulación.
 * @throws {AppError} 403 si es de otro vendedor; 404 si no existe; 409 si no está
 * activo, el sorteo ya se jugó o venció la ventana de anulación; 400 si falta el motivo.
 */
function anular(codigo, usuario, motivo) {
  const ticket = buscar(codigo);

  if (usuario.rol !== 'ADMIN' && ticket.vendedorId !== usuario.id) {
    throw new AppError('No puede anular tiquetes de otro vendedor', 403);
  }
  if (ticket.estado !== 'ACTIVO') throw new AppError(`El tiquete está ${ticket.estado}`, 409);
  if (sorteos.obtener(ticket.sorteoId).estado === 'JUGADO') {
    throw new AppError('No se puede anular un tiquete de un sorteo jugado', 409);
  }
  if (usuario.rol !== 'ADMIN' && minutosEntre(ticket.creadoEn) > minutosAnulacion) {
    throw new AppError(`Solo se puede anular dentro de los ${minutosAnulacion} minutos siguientes a la venta`, 409);
  }
  if (!motivo) throw new AppError('Debe indicar el motivo de anulación');

  ticket.estado = 'ANULADO';
  ticket.anulacion = { usuarioId: usuario.id, motivo, fecha: new Date().toISOString() };
  return ticket;
}

/**
 * Paga el premio de un tiquete ganador.
 * Por qué: las validaciones van en orden (sorteo jugado, no pagado, activo, con
 * premio, no caducado) y el estado pasa a PAGADO para que el mismo premio no se
 * cobre dos veces. Si el premio caducó, el tiquete se marca CADUCADO.
 * @traceability HU-006 (Resultado y pago de premios)
 * @param {string} codigo Código del tiquete.
 * @param {{id: number}} usuario Vendedor que entrega el dinero.
 * @returns {{id: number, ticketId: number, codigo: string, usuarioId: number, valor: number, fecha: string}}
 * Registro del pago realizado.
 * @throws {AppError} 404 si no existe; 409 si el sorteo no se ha jugado, ya fue
 * pagado, no está activo o no tiene premio; 410 si el premio caducó.
 */
function pagarPremio(codigo, usuario) {
  const ticket = buscar(codigo);
  const sorteo = sorteos.obtener(ticket.sorteoId);

  if (sorteo.estado !== 'JUGADO') throw new AppError('El sorteo aún no se ha jugado', 409);
  if (ticket.estado === 'PAGADO') throw new AppError('El premio ya fue pagado', 409);
  if (ticket.estado !== 'ACTIVO') throw new AppError(`El tiquete está ${ticket.estado}`, 409);
  if (!ticket.premio) throw new AppError('El tiquete no tiene premio', 409);
  if (diasEntre(sorteo.jugadoEn) > diasCaducidadPremio) {
    ticket.estado = 'CADUCADO';
    throw new AppError('El premio está caducado', 410);
  }

  const pago = {
    id: nextId('pagos'),
    ticketId: ticket.id,
    codigo: ticket.codigo,
    usuarioId: usuario.id,
    valor: ticket.premio,
    fecha: new Date().toISOString(),
  };
  getDb().pagos.push(pago);
  ticket.estado = 'PAGADO';
  return pago;
}

module.exports = { venderChance, venderBaloto, consultar, listar, anular, pagarPremio };
