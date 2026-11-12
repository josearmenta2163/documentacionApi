const { Router } = require('express');
const { autenticar, permitir } = require('../middlewares/auth');
const auth = require('../controllers/authController');
const sorteos = require('../controllers/sorteoController');
const tickets = require('../controllers/ticketController');
const caja = require('../controllers/cajaController');

/**
 * Router principal de la API (se monta en /api/v1).
 * Por qué: todas las rutas pasan por autenticar() salvo el login, y las acciones
 * sensibles agregan permitir(rol) para limitar quién puede ejecutarlas.
 * @traceability HU-001 (Inicio de sesión seguro), HU-009 (Control de acceso por rol)
 */
const router = Router();

// --- Autenticación (HU-001) ---
router.post('/auth/login', auth.login);
router.get('/auth/perfil', autenticar, auth.perfil);

// --- Sorteos (HU-006, HU-007): crear y registrar resultado solo ADMIN ---
router.get('/sorteos', autenticar, sorteos.listar);
router.get('/sorteos/:id', autenticar, sorteos.obtener);
router.post('/sorteos', autenticar, permitir('ADMIN'), sorteos.crear);
router.post('/sorteos/:id/resultado', autenticar, permitir('ADMIN'), sorteos.registrarResultado);

// --- Tiquetes (HU-002, HU-003, HU-005, HU-006): vender y pagar solo VENDEDOR ---
router.post('/tickets/chance', autenticar, permitir('VENDEDOR'), tickets.venderChance);
router.post('/tickets/baloto', autenticar, permitir('VENDEDOR'), tickets.venderBaloto);
router.get('/tickets', autenticar, tickets.listar);
router.get('/tickets/:codigo', autenticar, tickets.consultar);
router.post('/tickets/:codigo/anular', autenticar, tickets.anular);
router.post('/tickets/:codigo/pagar', autenticar, permitir('VENDEDOR'), tickets.pagar);

// --- Caja (HU-008): el cierre es solo del VENDEDOR ---
router.get('/caja/resumen', autenticar, caja.resumen);
router.post('/caja/cierre', autenticar, permitir('VENDEDOR'), caja.cerrar);

module.exports = router;
