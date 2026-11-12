const sorteoService = require('../services/sorteoService');

/**
 * @api {get} /api/v1/sorteos Listar sorteos
 * @apiDescription Devuelve los sorteos, con filtros opcionales por tipo y estado.
 * @apiPermission Cualquier usuario autenticado
 * @traceability HU-007 (Gestión de sorteos)
 * @param {import('express').Request} req Query opcional: tipo (CHANCE|BALOTO), estado (ABIERTO|JUGADO).
 * @param {import('express').Response} res 200 con la lista de sorteos.
 * @returns {void}
 */
exports.listar = (req, res) => res.json(sorteoService.listar(req.query));

/**
 * @api {get} /api/v1/sorteos/:id Consultar sorteo
 * @apiDescription Devuelve un sorteo por su identificador.
 * @apiPermission Cualquier usuario autenticado
 * @traceability HU-007 (Gestión de sorteos)
 * @param {import('express').Request} req Parámetro de ruta: id.
 * @param {import('express').Response} res 200 con el sorteo; 404 si no existe.
 * @returns {void}
 */
exports.obtener = (req, res) => res.json(sorteoService.obtener(req.params.id));

/**
 * @api {post} /api/v1/sorteos Crear sorteo
 * @apiDescription Crea un sorteo nuevo en estado ABIERTO con fecha futura.
 * @apiPermission ADMIN
 * @traceability HU-007 (Gestión de sorteos)
 * @param {import('express').Request} req Body: {tipo, nombre, fecha, acumulado?}.
 * @param {import('express').Response} res 201 con el sorteo creado.
 * @returns {void}
 */
exports.crear = (req, res) => res.status(201).json(sorteoService.crear(req.body));

/**
 * @api {post} /api/v1/sorteos/:id/resultado Registrar resultado
 * @apiDescription Registra el resultado del sorteo y liquida los premios de sus tiquetes.
 * @apiPermission ADMIN
 * @traceability HU-006 (Resultado y pago de premios)
 * @param {import('express').Request} req Parámetro de ruta: id. Body: {resultado}.
 * @param {import('express').Response} res 200 con el sorteo en estado JUGADO.
 * @returns {void}
 */
exports.registrarResultado = (req, res) =>
  res.json(sorteoService.registrarResultado(req.params.id, req.body.resultado));
