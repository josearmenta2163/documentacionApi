const authService = require('../services/authService');

/**
 * @api {post} /api/v1/auth/login Autenticar usuario
 * @apiDescription Valida las credenciales y devuelve un token JWT con el perfil básico.
 * @apiPermission Público
 * @traceability HU-001 (Inicio de sesión seguro)
 * @param {import('express').Request} req Body: {usuario: string, password: string}.
 * @param {import('express').Response} res 200 con {token, usuario}.
 * @returns {void}
 */
exports.login = (req, res) => {
  res.json(authService.login(req.body.usuario, req.body.password));
};

/**
 * @api {get} /api/v1/auth/perfil Consultar perfil
 * @apiDescription Devuelve los datos públicos del usuario autenticado.
 * @apiPermission Cualquier usuario autenticado
 * @traceability HU-001 (Inicio de sesión seguro)
 * @param {import('express').Request} req Debe traer req.usuario (lo deja el middleware autenticar).
 * @param {import('express').Response} res 200 con {id, usuario, nombre, rol}.
 * @returns {void}
 */
exports.perfil = (req, res) => {
  res.json(authService.perfil(req.usuario));
};
