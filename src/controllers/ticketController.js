const ticketService = require('../services/ticketService');

/**
 * @api {post} /api/v1/tickets/chance Vender tiquete de chance
 * @apiDescription Crea un tiquete de chance con 1 a 5 apuestas.
 * @apiPermission VENDEDOR
 * @traceability HU-002 (Venta de chance)
 * @param {import('express').Request} req Body: {sorteoId, apuestas: [{numero, modalidad?, valor}], cliente?}.
 * @param {import('express').Response} res 201 con el tiquete creado.
 * @returns {void}
 */
exports.venderChance = (req, res) => res.status(201).json(ticketService.venderChance(req.usuario, req.body));

/**
 * @api {post} /api/v1/tickets/baloto Vender tiquete de Baloto
 * @apiDescription Crea un tiquete de Baloto con 1 a 10 jugadas.
 * @apiPermission VENDEDOR
 * @traceability HU-003 (Venta de Baloto)
 * @param {import('express').Request} req Body: {sorteoId, jugadas: [{numeros, superbalota} | {aleatoria: true}], cliente?}.
 * @param {import('express').Response} res 201 con el tiquete creado.
 * @returns {void}
 */
exports.venderBaloto = (req, res) => res.status(201).json(ticketService.venderBaloto(req.usuario, req.body));

/**
 * @api {get} /api/v1/tickets Listar tiquetes
 * @apiDescription Lista tiquetes; un VENDEDOR solo ve los suyos y el ADMIN ve todos.
 * @apiPermission Cualquier usuario autenticado
 * @traceability HU-009 (Control de acceso por rol)
 * @param {import('express').Request} req Query opcional: fecha, estado.
 * @param {import('express').Response} res 200 con la lista de tiquetes.
 * @returns {void}
 */
exports.listar = (req, res) => res.json(ticketService.listar(req.usuario, req.query));

/**
 * @api {get} /api/v1/tickets/:codigo Consultar tiquete
 * @apiDescription Devuelve un tiquete con los datos de su sorteo y si es ganador.
 * @apiPermission Cualquier usuario autenticado
 * @traceability HU-006 (Resultado y pago de premios)
 * @param {import('express').Request} req Parámetro de ruta: codigo.
 * @param {import('express').Response} res 200 con el tiquete; 404 si no existe.
 * @returns {void}
 */
exports.consultar = (req, res) => res.json(ticketService.consultar(req.params.codigo));

/**
 * @api {post} /api/v1/tickets/:codigo/anular Anular tiquete
 * @apiDescription Anula un tiquete activo; exige motivo y respeta la ventana de anulación.
 * @apiPermission Cualquier usuario autenticado (el VENDEDOR solo sus tiquetes)
 * @traceability HU-005 (Anulación de tiquetes)
 * @param {import('express').Request} req Parámetro de ruta: codigo. Body: {motivo: string}.
 * @param {import('express').Response} res 200 con el tiquete anulado.
 * @returns {void}
 */
exports.anular = (req, res) =>
  res.json(ticketService.anular(req.params.codigo, req.usuario, req.body.motivo));

/**
 * @api {post} /api/v1/tickets/:codigo/pagar Pagar premio
 * @apiDescription Registra el pago del premio de un tiquete ganador.
 * @apiPermission VENDEDOR
 * @traceability HU-006 (Resultado y pago de premios)
 * @param {import('express').Request} req Parámetro de ruta: codigo.
 * @param {import('express').Response} res 200 con el registro del pago.
 * @returns {void}
 */
exports.pagar = (req, res) => res.json(ticketService.pagarPremio(req.params.codigo, req.usuario));
