const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const rutas = require('./routes');
const { noEncontrado, manejarErrores } = require('./middlewares/errorHandler');

const app = express();
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

const swaggerDocument = YAML.load(path.join(__dirname, '../docs/openapi.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/health', (req, res) => res.json({ estado: 'ok', hora: new Date().toISOString() }));
app.use('/api/v1', rutas);
app.use(noEncontrado);
app.use(manejarErrores);

module.exports = app;
