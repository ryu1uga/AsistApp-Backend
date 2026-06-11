# AsistApp Backend

API REST para AsistApp, construida con **Express**, **TypeScript** y **Prisma ORM** sobre **PostgreSQL**.

## Requisitos previos

- [Node.js](https://nodejs.org/) (v18 o superior recomendado)
- [Docker](https://www.docker.com/) (para levantar la base de datos PostgreSQL)
- npm

## 1. Clonar el repositorio

```bash
git clone https://github.com/ryu1uga/AsistApp-Backend.git
cd AsistApp-Backend
```

## 2. Instalar dependencias

```bash
npm install
```

## 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido (ajusta los valores según necesites):

```env
PORT=8080
DATABASE_URL="postgres://asistapp:asistapp@localhost:5434/asistapp_db"
TOKEN=PROGRAMOVIL
```

| Variable       | Descripción                                                  |
|----------------|---------------------------------------------------------------|
| `PORT`         | Puerto en el que se levanta el servidor Express               |
| `DATABASE_URL` | Cadena de conexión a la base de datos PostgreSQL               |
| `TOKEN`        | Token usado para autenticación/autorización de la API          |

> El archivo `.env` no se sube al repositorio (está en `.gitignore`). Cada equipo debe crear el suyo.

## 4. Levantar la base de datos con Docker

Crea un contenedor de PostgreSQL con los datos definidos en `DATABASE_URL`:

```bash
docker run -d --name asistapp-db -e POSTGRES_DB=asistapp_db -e POSTGRES_USER=asistapp -e POSTGRES_PASSWORD=asistapp -p 5434:5432 -v asistapp_pgdata:/var/lib/postgresql/data postgres:16
```

Esto:
- Crea un contenedor llamado `asistapp-db`.
- Crea la base de datos `asistapp_db` con el usuario `asistapp` y contraseña `asistapp`.
- Expone el puerto `5434` del host hacia el `5432` del contenedor (ajusta el puerto si ya tienes otro Postgres corriendo en `5434`/`5432`).
- Persiste los datos en el volumen `asistapp_pgdata`, para que no se pierdan al reiniciar el contenedor.

Si el `DATABASE_URL` de tu `.env` usa otro puerto (por ejemplo `5432`), cambia el `-p` del comando para que coincida (`-p 5432:5432`).

### Comandos útiles del contenedor

```bash
# Ver si está corriendo
docker ps

# Detener el contenedor
docker stop asistapp-db

# Volver a iniciarlo (sin perder datos)
docker start asistapp-db

# Eliminar el contenedor (los datos persisten en el volumen)
docker rm -f asistapp-db

# Eliminar también los datos
docker volume rm asistapp_pgdata
```

## 5. Generar el cliente de Prisma

```bash
npx prisma generate
```

Esto genera el cliente en `src/generated/prisma`, usado por `src/config/db.ts`.

## 6. Crear y migrar la base de datos

Con el contenedor de Docker corriendo y el `.env` configurado, aplica las migraciones existentes (definidas en `prisma/migrations`):

```bash
npx prisma migrate deploy
```

Si estás en desarrollo y necesitas crear nuevas migraciones a partir de cambios en `prisma/schema.prisma`:

```bash
npx prisma migrate dev --name nombre_de_la_migracion
```

> `prisma/migrations` se versiona en git: contiene el historial de cambios del esquema y permite reconstruir la base de datos en cualquier equipo.

## 7. Ejecutar el proyecto

### Modo desarrollo (con recarga automática)

```bash
npm run start:dev
```

### Compilar y ejecutar en producción

```bash
npm run build
npm start
```

El servidor quedará disponible en `http://localhost:<PORT>/`.

## Estructura del proyecto

```
src/
├── config/              # Configuración (conexión a base de datos, etc.)
├── controllers/         # Controladores / rutas de la API
├── generated/prisma/    # Cliente Prisma generado (no versionado)
└── index.ts             # Punto de entrada de la aplicación
prisma/
├── schema.prisma        # Definición del esquema de base de datos
└── migrations/          # Historial de migraciones
```

## Endpoints principales

| Recurso                     | Ruta base                     |
|------------------------------|--------------------------------|
| Organizaciones                | `/organizations`               |
| Usuarios                       | `/users`                        |
| Horarios                        | `/schedules`                    |
| Días de horario                 | `/schedule-days`                |
| Solicitudes de cambio de horario| `/schedule-change-requests`     |
| Registros de asistencia          | `/attendance-records`           |
| Solicitudes de asistencia         | `/attendance-requests`          |
| Logs de actividad                  | `/activity-logs`                |

## Reiniciar el entorno desde cero

Si necesitas eliminar los archivos generados (build y cliente Prisma) para reinicializar:

```bash
rm -rf dist src/generated
npx prisma generate
npm run build
```

Para reiniciar la base de datos por completo (perdiendo los datos):

```bash
docker rm -f asistapp-db
docker volume rm asistapp_pgdata
docker run -d --name asistapp-db -e POSTGRES_DB=asistapp_db -e POSTGRES_USER=asistapp -e POSTGRES_PASSWORD=asistapp -p 5434:5432 -v asistapp_pgdata:/var/lib/postgresql/data postgres:16
npx prisma migrate deploy
```
