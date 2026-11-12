const app = require('./app');
const { port } = require('./config');

/**
 * Punto de entrada: inicia el servidor HTTP.
 * Por qué: está separado de app.js para poder probar la API sin abrir un puerto.
 * El puerto se toma de la variable PORT (por defecto 3000).
 * @traceability RNF-002 (Disponibilidad del servicio)
 */
app.listen(port, () => {
  console.log(`Puesto de chance API escuchando en http://localhost:${port}`);
});
