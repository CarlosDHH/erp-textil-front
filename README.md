# PantSys · Frontend

**PantSys** es un sistema ERP integral para la gestión de un taller textil, desarrollado como
proyecto para la **Universidad Tecnológica de la Sierra Hidalguense (UTSH)**.

Cubre el ciclo completo del almacén de un taller de confección: catálogo de insumos, control de
lotes por temporada y tono, entradas y salidas de inventario, proveedores, órdenes de compra y
administración de usuarios con permisos por módulo.

Este repositorio contiene la **aplicación cliente en Angular**. La API vive en
[`erp-textil-back`](../erp-textil-back).

---

## Stack

| Pieza | Versión | Para qué |
|---|---|---|
| Angular | 20.3 | Componentes standalone, Signals, control flow `@if` / `@for` |
| PrimeNG + `@primeng/themes` | 20.4 | Biblioteca de componentes (tema Aura) |
| Tailwind CSS | 3.4 | Utilidades de maquetación |
| NgRx (`store`, `effects`, `entity`) | 20.1 | Estado global de autenticación |
| RxJS | 7.8 | Composición de las llamadas HTTP |
| ngx-charts | 24.0 | Gráficas del dashboard |
| jsPDF + jspdf-autotable | 4.2 / 5.0 | Exportación de reportes a PDF |
| SweetAlert2 | 11.26 | Confirmaciones y avisos |
| `@simplewebauthn/browser` | 13.3 | Autenticación biométrica (WebAuthn) |
| `@angular/service-worker` | 20.3 | PWA / caché de la aplicación |
| TypeScript | 5.9 | Lenguaje (modo estricto) |

---

## Requisitos previos

- Node.js 20 o superior
- npm 10 o superior
- El backend corriendo en `http://localhost:3000`

---

## Puesta en marcha

```bash
npm install
npm start          # http://localhost:4200
```

La URL de la API se configura en `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
}
```

### Comandos

```bash
npm start          # servidor de desarrollo
npm run build      # build de producción → dist/erp-textil-front/browser/
npm run watch      # build en modo watch (configuración de desarrollo)
npm test           # pruebas unitarias (Karma + Jasmine)
```

Para probar el service worker hace falta servir el build, no `ng serve`:

```bash
npm run build
npx http-server dist/erp-textil-front/browser -p 8080
```

---

## Arquitectura

Componentes **standalone** (sin NgModules) y features cargadas de forma diferida.

```
src/app/
├── core/                     transversal a toda la app
│   ├── directives/           *appHasPermission
│   ├── guards/               authGuard · roleGuard · permissionGuard
│   ├── interceptors/         authInterceptor (Bearer + refresh en 401)
│   ├── services/             alert · pdf-report · permissions · inventory-movement · storage
│   ├── utils/                inventory-labels (normalización es/en)
│   └── validators/           email
├── features/                 un módulo de negocio por carpeta
│   ├── auth/                 login, biometría, recuperación de contraseña, store NgRx
│   ├── dashboard/            KPIs y gráficas
│   ├── users/                CRUD + perfil con actividad reciente
│   ├── roles/                CRUD de roles, módulos y permisos
│   ├── supplies/             catálogo de insumos
│   ├── batches/              lotes
│   └── supplier/             proveedores
└── shared/components/layout/ shell con sidebar y header
```

### Rutas

| Ruta | Guard |
|---|---|
| `/auth/login` | — |
| `/auth/reset-password?token=…` | — |
| `/admin/dashboard` | `authGuard` |
| `/admin/users` · `/admin/roles` | `authGuard` + permisos |
| `/admin/supplies` · `/admin/batches` · `/admin/suppliers` | `authGuard` + permisos |

Todo lo que cuelga de `/admin` se renderiza dentro de `LayoutComponent`.

### Estado

**NgRx cubre únicamente la autenticación** (`features/auth/store/`): `user`, `accessToken`,
`refreshToken`, `loading` y `error`. Al arrancar, un effect rehidrata la sesión desde
`localStorage`; en login y logout los tokens se persisten y se limpian ahí.

El resto de las pantallas usa **Signals** (`signal()`, `computed()`) para su estado local, sin
pasar por el store.

### RxJS

Los servicios devuelven `Observable` y las pantallas componen con operadores en lugar de encadenar
suscripciones:

- `forkJoin` — el dashboard pide usuarios, roles e insumos en paralelo y arma los KPIs con el
  resultado combinado.
- `map` — transforma la respuesta de la API en el modelo que consume la vista.
- `catchError` — convierte el error HTTP en un mensaje para el usuario.
- `toSignal` — puentea el store de NgRx hacia Signals en `PermissionsService`.

### Interceptor HTTP

`core/interceptors/auth.interceptor.ts` (función `HttpInterceptorFn`):

1. Añade `Authorization: Bearer <accessToken>` a cada petición.
2. Ante un `401`, despacha la acción `refreshToken` (o `logout` si ya no hay refresh token).

---

## Módulos implementados

### Autenticación biométrica (WebAuthn)

Login sin contraseña con la huella o el rostro del dispositivo, sobre `@simplewebauthn/browser`.

- **Vinculación** — desde el perfil, y sólo tras confirmar la contraseña actual. El navegador
  genera un par de claves; la privada nunca sale del dispositivo. El backend guarda la pública en
  la tabla `passkeys`.
- **Acceso** — el usuario escribe su correo, el backend devuelve el reto y el dispositivo lo firma.
- El bloqueo por intentos fallidos aplica igual que en el login con contraseña.

### RBAC (permisos por módulo)

Cada rol tiene, para cada módulo, cuatro flags: `canView`, `canCreate`, `canEdit`, `canDelete`.
`PermissionsService` es la fuente única de verdad y alimenta tres consumidores:

```html
<!-- el botón ni siquiera se renderiza sin permiso -->
<button *appHasPermission="{ module: 'insumos', action: 'canCreate' }">Nuevo insumo</button>
```

```ts
// y la ruta se protege del acceso directo por URL
{ path: 'supplies', canActivate: [authGuard, permissionGuard('insumos', 'canView')] }
```

Ocultar el control es sólo comodidad visual: **la autorización real la impone el backend** en
`requireModulePermission`. El rol `admin` pasa siempre.

### Exportación a PDF (jsPDF)

`core/services/pdf-report.service.ts` genera los reportes de insumos, lotes y proveedores con
jsPDF y `jspdf-autotable`: encabezado con título y fecha, tabla paginada y pie con numeración.

### Alertas (SweetAlert2)

`core/services/alert.service.ts` centraliza los diálogos para que confirmar un borrado se vea
igual en toda la app: `confirmDelete()`, `confirm()`, `success()`, `error()`, `toast()` y
`insufficientStock()`, esta última para el aviso de material insuficiente al despachar un lote.

### Dashboard

KPIs (total de insumos, stock crítico, usuarios y roles activos) y gráficas con ngx-charts:
insumos registrados por mes, distribución por categoría, usuarios por rol y resumen de
descontación del día o de la semana.

> Para que la gráfica *"Insumos Registrados por Mes"* muestre varios meses, la base necesita
> insumos con fechas de alta repartidas: es justo lo que genera el seed del backend
> (`npm run seed`).

### Perfil y Actividad Reciente

El perfil muestra la bitácora del usuario: entradas, salidas, ajustes, mermas y **modificaciones**
(al editar un insumo, un lote o un usuario), con el detalle de qué campos cambiaron. Se alimenta
de `GET /api/inventoryMovement?userId=…`.

### PWA

Service worker activo sólo en producción (`ngsw-config.json`): precarga JS/CSS/HTML del grupo
`app` y cachea bajo demanda imágenes y fuentes del grupo `assets`.

> **Nota:** la aplicación **no** tiene modo offline con cola de operaciones. El service worker
> cachea recursos estáticos; las operaciones sobre datos requieren conexión con la API.

---

## Convenciones

- Componentes `standalone: true` con imports explícitos.
- Signals para estado local; NgRx sólo para auth.
- Prettier: 100 columnas, comillas simples, parser `angular` para HTML.
- Modo oscuro mediante la clase `.dark-mode`.
- El `preflight` de Tailwind está desactivado para no chocar con el reset de PrimeNG.

---

## Contrato de la API

Todas las respuestas comparten la misma forma:

```json
{ "statusCode": 200, "success": true, "message": "...", "data": {}, "errors": "" }
```

Los listados paginados devuelven dentro de `data`:

```json
{ "data": [], "meta": { "total": 50, "page": 1, "limit": 20, "pages": 3 } }
```

Detalle de los endpoints en [`API.md`](./API.md).
