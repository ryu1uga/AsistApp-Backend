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

## Documentación interactiva (Swagger)

La raíz del proyecto (`/`) sirve la documentación interactiva con Swagger UI, generada a partir de anotaciones JSDoc en los controladores (`src/config/swagger.ts`).

- En desarrollo: `http://localhost:<PORT>/`
- En producción (Render): `https://asistapp-backend.onrender.com/`

Desde ahí se pueden probar todos los endpoints (GET, POST, PUT, DELETE) directamente desde el navegador.

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

## Despliegue en producción (Render + Supabase)

En producción, la base de datos PostgreSQL se aloja en **Supabase** y el backend se despliega en **Render** usando el `Dockerfile` incluido en el proyecto.

### 1. Crear la base de datos en Supabase

1. Crea una cuenta/proyecto en [supabase.com](https://supabase.com) → **New Project**.
2. Define el nombre, la contraseña de la base de datos (guárdala) y la región (elige una cercana a la región de Render).
3. Ve a **Project Settings → Database → Connection string** y copia:
   - **Connection pooling** (puerto `6543`): se usará como `DATABASE_URL`, para las consultas de la app.
   - **Connection directa** (puerto `5432`): se usará como `DIRECT_URL`, para correr migraciones.

   Ejemplo:
   ```env
   DATABASE_URL="postgres://postgres.xxxx:TU_PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgres://postgres.xxxx:TU_PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres"
   ```

4. Si se usa `DIRECT_URL`, el `datasource` de `prisma/schema.prisma` y el `prisma.config.ts` deben incluir `directUrl`:

   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
   ```

### 2. Dockerfile

El proyecto incluye un `Dockerfile` multi-stage que:

1. Instala dependencias y ejecuta `npx prisma generate`.
2. Compila TypeScript con `npm run build`.
3. En la imagen final, copia el `dist/` compilado e instala solo dependencias de producción.
4. Al iniciar el contenedor ejecuta `npx prisma migrate deploy` (aplica migraciones pendientes contra Supabase) y luego `node dist/index.js`.

No requiere configuración adicional: Render lo detecta automáticamente al elegir entorno **Docker**.

### 3. Crear el servicio en Render

1. Sube los cambios (`Dockerfile`, `.dockerignore`, migraciones) a GitHub:
   ```bash
   git add Dockerfile .dockerignore prisma
   git commit -m "Add Dockerfile for Render deployment"
   git push
   ```
2. En [render.com](https://render.com) → **New → Web Service**.
3. Conecta el repositorio `AsistApp-Backend`.
4. En **Environment**, selecciona **Docker** (Render usará el `Dockerfile` del repo).
5. Configura la región (idealmente la misma que Supabase) y el plan de instancia.
6. En **Environment Variables**, agrega:

   | Variable       | Valor                                          |
   |----------------|--------------------------------------------------|
   | `DATABASE_URL` | Connection pooling de Supabase                    |
   | `DIRECT_URL`   | Connection directa de Supabase (si se usa)        |
   | `TOKEN`        | Token de autenticación de la API                  |

   > No es necesario definir `PORT`: Render lo asigna automáticamente y la app ya lo lee de `process.env.PORT`.

7. Click en **Create Web Service**. Render construye la imagen, ejecuta `prisma migrate deploy` contra Supabase y arranca el servidor.

### 4. Verificar el despliegue

- Revisa los **logs** del deploy en Render: deben mostrar la aplicación de migraciones y luego `Se inicio servidor en http://localhost:.../`.
- Visita la URL pública (ej. `https://asistapp-backend.onrender.com/`) — debe responder "Endpoint raiz de Backend".

### 5. Flujo de actualizaciones

Cada `git push` a la rama configurada dispara un nuevo deploy en Render: reconstruye la imagen Docker, aplica nuevas migraciones (`prisma/migrations`) y reinicia el servidor automáticamente. Asegúrate de generar y commitear las migraciones (`npx prisma migrate dev --name ...`) antes de hacer push.

### Notas

- **Plan free de Render**: el servicio se "duerme" tras inactividad; el primer request tras inactividad tarda más en responder.
- **Conexiones a Supabase**: por defecto Supabase acepta conexiones externas con las credenciales correctas; no se requiere whitelisting de IP adicional.
- **Variables sensibles**: nunca subas el `.env` con credenciales reales al repositorio; configúralas directamente en el panel de Render.
