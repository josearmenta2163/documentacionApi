const bcrypt = require('bcryptjs');

/** Base de datos en memoria: se pierde al reiniciar el servidor. */
let db;

/**
 * Calcula una fecha futura a partir de ahora.
 * @traceability RNF-004 (Datos de demostración en memoria)
 * @param {number} h Horas a sumar.
 * @returns {string} Fecha futura en formato ISO.
 */
const enHoras = (h) => new Date(Date.now() + h * 3600 * 1000).toISOString();

/**
 * Carga los datos iniciales de demostración.
 * Por qué: el proyecto no usa base de datos real; esta función deja usuarios,
 * sorteos abiertos y contadores de id listos para probar la API. Las contraseñas
 * se guardan con hash bcrypt, nunca en texto plano. Los usuarios y claves de
 * ejemplo son solo para desarrollo y pruebas.
 * @traceability RNF-004 (Datos de demostración en memoria)
 * @returns {void}
 */
function seed() {
  db = {
    usuarios: [
      { id: 1, usuario: 'admin', nombre: 'Administrador', rol: 'ADMIN', password: bcrypt.hashSync('admin123', 8), activo: true },
      { id: 2, usuario: 'vendedor1', nombre: 'Ana Pérez', rol: 'VENDEDOR', password: bcrypt.hashSync('vende123', 8), activo: true },
      { id: 3, usuario: 'vendedor2', nombre: 'Luis Gómez', rol: 'VENDEDOR', password: bcrypt.hashSync('vende456', 8), activo: true },
    ],
    sorteos: [
      { id: 1, tipo: 'CHANCE', nombre: 'Lotería de Bogotá', fecha: enHoras(24), estado: 'ABIERTO', resultado: null, acumulado: 0 },
      { id: 2, tipo: 'CHANCE', nombre: 'Lotería de Medellín', fecha: enHoras(30), estado: 'ABIERTO', resultado: null, acumulado: 0 },
      { id: 3, tipo: 'BALOTO', nombre: 'Baloto', fecha: enHoras(48), estado: 'ABIERTO', resultado: null, acumulado: 4500000000 },
    ],
    tickets: [],
    pagos: [],
    cierres: [],
    seq: { sorteos: 4, tickets: 1, pagos: 1, cierres: 1 },
  };
}

seed();

/**
 * Interfaz pública del almacén de datos.
 * @traceability RNF-004 (Datos de demostración en memoria)
 */
module.exports = {
  /** Devuelve la base de datos en memoria (usuarios, sorteos, tickets, pagos, cierres). */
  getDb: () => db,
  /**
   * Entrega el siguiente identificador de una tabla y avanza el contador.
   * Por qué: reemplaza el autoincremental de una base de datos real.
   * @param {'sorteos'|'tickets'|'pagos'|'cierres'} tabla Nombre de la tabla.
   * @returns {number} Identificador nuevo.
   */
  nextId: (tabla) => db.seq[tabla]++,
  /** Restaura los datos iniciales; lo usan las pruebas para empezar siempre limpias. */
  reset: seed,
};
