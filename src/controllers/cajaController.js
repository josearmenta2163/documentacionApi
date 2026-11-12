const cajaService = require('../services/cajaService');

/**
 * @api {get} /api/v1/caja/resumen Resumen de caja del día
 * @apiDescription Devuelve ventas, premios pagados y saldo esperado de un día.
 * Por qué: solo el ADMIN puede consultar la caja de otro vendedor (vendedorId);
 * un VENDEDOR siempre ve la suya, aunque envíe ese parámetro.
 * @apiPermission Cualquier usuario autenticado
 * @traceability HU-008 (Resumen y cierre de caja)
 * @param {import('express').Request} req Query opcional: fecha (AAAA-MM-DD) y vendedorId (solo ADMIN).
 * @param {import('express').Response} res 200 con el resumen de caja.
 * @returns {void}
 */
exports.resumen = (req, res) => {
  const vendedorId = req.usuario.rol === 'ADMIN' && req.query.vendedorId
    ? Number(req.query.vendedorId)
    : req.usuario.id;
  res.json(cajaService.resumen(vendedorId, req.query.fecha));
};

/**
 * @api {post} /api/v1/caja/cierre Cerrar caja
 * @apiDescription Registra el cierre de caja del vendedor comparando el efectivo
 * reportado con el saldo esperado.
 * @apiPermission VENDEDOR
 * @traceability HU-008 (Resumen y cierre de caja)
 * @param {import('express').Request} req Body: {efectivoReportado: number, fecha?: string}.
 * @param {import('express').Response} res 201 con el cierre (diferencia y estado).
 * @returns {void}
 */
exports.cerrar = (req, res) => res.status(201).json(cajaService.cerrar(req.usuario.id, req.body));
