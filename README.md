# Almacén General · Gestión de cargas

Aplicación web interna y privada para sustituir progresivamente el Excel de registro de cargas de materiales del Almacén General.

## Tecnologías

- Next.js App Router, TypeScript y Tailwind CSS.
- PostgreSQL con Prisma ORM.
- NextAuth con credenciales privadas, sin registro público.
- Zod para validaciones de servidor.
- Exportación `.xlsx`.
- Docker preparado para despliegue en Seenode.

## Instalación local

1. Copia las variables:

```bash
cp .env.example .env
```

2. Arranca PostgreSQL local:

```bash
docker compose up -d postgres
```

3. Instala dependencias y genera Prisma Client:

```bash
npm install
npm run prisma:generate
```

4. Ejecuta migraciones y seed:

```bash
npm run prisma:deploy
npm run prisma:seed
```

5. Arranca desarrollo:

```bash
npm run dev
```

La aplicación quedará disponible en `http://localhost:3000`.

## Usuarios de desarrollo

Estas credenciales son únicamente para desarrollo y deben cambiarse en producción.

| Rol | Usuario | Contraseña |
| --- | --- | --- |
| Administrador | `admin` | `Admin1234!` |
| Administrativo | `pablo` | `Pablo1234!` |
| Lectura | `consulta` | `Consulta1234!` |

## Funcionalidad MVP

- Login privado en `/login`, sin registro público.
- Dashboard con KPIs y últimos movimientos.
- Listado `/cargas` con búsqueda, filtros combinables, paginación server-side, ordenación, exportación Excel y acciones por fila.
- Alta rápida `/cargas/nueva` con datos comunes, tabla editable, navegación con teclado y pegado de filas copiadas desde Excel.
- Detalle `/cargas/[id]` con edición, cambio de estado, anulación, eliminación lógica para administradores y auditoría reciente.
- Administración `/usuarios` para crear, activar, desactivar, cambiar rol y cambiar contraseña.
- Configuración básica en `/configuracion`.
- Endpoint de salud en `/api/health`.

## Prisma

Modelos principales:

- `User`
- `Carga`
- `AuditLog`
- `AppSetting`

Enums:

- `Role`: `ADMINISTRADOR`, `ADMINISTRATIVO`, `LECTURA`
- `LoadStatus`: `PENDIENTE`, `REALIZADA`, `PARCIAL`, `INCIDENCIA`, `PENDIENTE_CALIDAD`, `FALTA_STOCK`, `ANULADA`
- `MovementType`: `CARGA_OF`, `TRASIEGO`, `MOVIMIENTO_STOCK`, `DEVOLUCION`

Comandos útiles:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
npm run prisma:seed
```

## Build y verificación

```bash
npm run lint
npm run typecheck
npm run build
```

## Despliegue en Seenode

Configura en Seenode las variables:

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

El despliegue debe ejecutar:

```bash
npm run prisma:deploy
npm run start
```

El `Dockerfile` genera una build standalone de Next.js y expone el puerto `3000`. Toda la persistencia vive en PostgreSQL; no se usa almacenamiento local persistente.
