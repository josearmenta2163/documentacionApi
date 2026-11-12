# Puesto de Chance API

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express)
![Jest](https://img.shields.io/badge/Tests-Jest-C21325?logo=jest&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens)

API REST para la gestión de un puesto de chance y Baloto: autenticación por
roles, venta y anulación de tiquetes, registro de resultados de sorteos,
pago de premios y cierre de caja.

## Arquitectura

```
src/
├── routes/        Definición de endpoints
├── controllers/   Reciben la petición y devuelven la respuesta
├── services/      Reglas de negocio
├── middlewares/   Autenticación, permisos y manejo de errores
├── data/          Almacén de datos en memoria
├── config/        Variables de entorno
└── utils/         Utilidades (errores, fechas)
tests/             Pruebas automatizadas con Jest y Supertest
```

## Prerrequisitos

- Node.js 18 o superior
- npm
- Git

## Instalación

```bash
git clone https://github.com/josearmenta2163/documentacionApi.git
cd documentacionApi
npm install
cp .env.example .env      # en Windows: copy .env.example .env
npm start
```

El servidor queda en `http://localhost:3000`. Verifica con `GET /health`.

## Variables de entorno

| Variable | Descripción | Valor por defecto |
|---|---|---|
| PORT | Puerto del servidor | 3000 |
| JWT_SECRET | Secreto para firmar los tokens | cambiar-este-secreto |
| JWT_EXPIRES_IN | Duración del token | 8h |
| ZONA_HORARIA | Zona horaria | America/Bogota |
| MINUTOS_ANULACION | Minutos que tiene el vendedor para anular | 10 |
| MINUTOS_CIERRE_VENTAS | Minutos antes del sorteo en que se cierran ventas | 15 |
| APUESTA_MIN_CHANCE | Apuesta mínima de chance | 500 |
| APUESTA_MAX_CHANCE | Apuesta máxima de chance | 50000 |
| VALOR_BALOTO | Valor de una jugada de Baloto | 5700 |
| DIAS_CADUCIDAD_PREMIO | Días para cobrar un premio | 365 |

## Usuarios de prueba

| Usuario | Contraseña | Rol |
|---|---|---|
| admin | admin123 | ADMIN |
| vendedor1 | vende123 | VENDEDOR |
| vendedor2 | vende456 | VENDEDOR |

## Uso

Base de la API: `/api/v1`. Primero inicia sesión y usa el token como
`Authorization: Bearer <token>`.

| Método | Ruta | Rol |
|---|---|---|
| POST | /auth/login | Público |
| GET | /auth/perfil | Autenticado |
| GET | /sorteos, /sorteos/:id | Autenticado |
| POST | /sorteos | ADMIN |
| POST | /sorteos/:id/resultado | ADMIN |
| POST | /tickets/chance, /tickets/baloto | VENDEDOR |
| GET | /tickets, /tickets/:codigo | Autenticado |
| POST | /tickets/:codigo/anular | Autenticado |
| POST | /tickets/:codigo/pagar | VENDEDOR |
| GET | /caja/resumen | Autenticado |
| POST | /caja/cierre | VENDEDOR |

Documentación interactiva: `http://localhost:3000/api-docs`

## Pruebas

```bash
npm test
```

## Trazabilidad

Ver [docs/MATRIZ_TRAZABILIDAD.md](docs/MATRIZ_TRAZABILIDAD.md).

## Autor

José Andrés Armenta Farías, SENA, tecnólogo en Análisis y Desarrollo de Software.

## Licencia

Uso académico.
