const { getDb, nextId } = require('../data/store');
const AppError = require('../utils/AppError');
const { fechaLocal } = require('../utils/fechas');

/**
 * Calcula el resumen de caja de un vendedor para un día.
 * Por qué: los tiquetes anulados no cuentan como venta, y el saldo esperado es
 * lo vendido menos lo pagado en premios, que es el efectivo que debería haber.
 * @traceability HU-008 (Resumen y cierre de caja)
 * @param {number} vendedorId Identificador del vendedor.
 * @param {string} [fecha=fechaLocal()] Día a consultar (AAAA-MM-DD), en zona horaria local.
 * @returns {Object} Totales vendidos, premios pagados, saldo esperado y si la caja está cerrada.
 */
function resumen(vendedorId, fecha = fechaLocal()) {
  const db = getDb();
  const delDia = (iso) => fechaLocal(iso) === fecha;

  const tickets = db.tickets.filter((t) => t.vendedorId === vendedorId && delDia(t.creadoEn));
  const validos = tickets.filter((t) => t.estado !== 'ANULADO');
  const pagos = db.pagos.filter((p) => p.usuarioId === vendedorId && delDia(p.fecha));

  const totalVendido = validos.reduce((s, t) => s + t.total, 0);
  const totalPagado = pagos.reduce((s, p) => s + p.valor, 0);

  return {
    vendedorId,
    fecha,
    tiquetesVendidos: validos.length,
    tiquetesAnulados: tickets.length - validos.length,
    ventasChance: validos.filter((t) => t.tipo === 'CHANCE').reduce((s, t) => s + t.total, 0),
    ventasBaloto: validos.filter((t) => t.tipo === 'BALOTO').reduce((s, t) => s + t.total, 0),
    totalVendido,
    premiosPagados: pagos.length,
    totalPagado,
    saldoEsperado: totalVendido - totalPagado,
    cerrada: db.cierres.some((c) => c.vendedorId === vendedorId && c.fecha === fecha),
  };
}

/**
 * Cierra la caja de un vendedor comparando el efectivo reportado con el esperado.
 * Por qué: queda registrada la diferencia y su clasificación (CUADRADA, SOBRANTE o
 * FALTANTE) para detectar descuadres; una caja ya cerrada no se puede cerrar de nuevo.
 * @traceability HU-008 (Resumen y cierre de caja)
 * @param {number} vendedorId Identificador del vendedor.
 * @param {Object} datos Cuerpo de la petición.
 * @param {number} datos.efectivoReportado Efectivo contado por el vendedor (entero, no negativo).
 * @param {string} [datos.fecha=fechaLocal()] Día a cerrar (AAAA-MM-DD).
 * @returns {Object} Cierre creado, con diferencia y estado.
 * @throws {AppError} 400 si el efectivo no es un entero válido; 409 si el día ya fue cerrado.
 */
function cerrar(vendedorId, { efectivoReportado, fecha = fechaLocal() }) {
  if (!Number.isInteger(efectivoReportado) || efectivoReportado < 0) {
    throw new AppError('El efectivo reportado debe ser un entero positivo');
  }
  const r = resumen(vendedorId, fecha);
  if (r.cerrada) throw new AppError('La caja de ese día ya fue cerrada', 409);

  const diferencia = efectivoReportado - r.saldoEsperado;
  const cierre = {
    id: nextId('cierres'),
    ...r,
    cerrada: true,
    efectivoReportado,
    diferencia,
    estado: diferencia === 0 ? 'CUADRADA' : diferencia > 0 ? 'SOBRANTE' : 'FALTANTE',
    creadoEn: new Date().toISOString(),
  };
  getDb().cierres.push(cierre);
  return cierre;
}

module.exports = { resumen, cerrar };
