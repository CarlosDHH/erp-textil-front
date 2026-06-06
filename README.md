# ERP Textil — Frontend

Frontend del sistema ERP para la gestión de la industria textil. Construido con Angular 20, NgRx, PrimeNG y Tailwind CSS.

---

## Stack tecnológico

| Tecnología | Versión | Rol |
|---|---|---|
| Angular | 20.3 | Framework principal |
| NgRx | 20.1 | Manejo de estado (auth) |
| PrimeNG | 20.4 | Biblioteca de componentes UI |
| Tailwind CSS | 3.4 | Utilidades de estilos |
| SCSS | — | Estilos por componente |
| TypeScript | 5.9 | Lenguaje |
| Angular Service Worker | 20.3 | Soporte PWA |

---

## Requisitos previos

- Node.js 20+
- npm 10+
- Backend corriendo en `http://localhost:3000` (ver [erp-textil-back](https://github.com/CarlosDHH/erp-textil-back))

---

## Instalación y arranque

```bash
# Clonar el repositorio
git clone https://github.com/CarlosDHH/erp-textil-front.git
cd erp-textil-front

# Instalar dependencias
npm install

# Servidor de desarrollo (http://localhost:4200)
npm start
```

---

## Comandos

```bash
npm start          # Servidor de desarrollo en http://localhost:4200
npm run build      # Build de producción → dist/erp-textil-front/browser/
npm run watch      # Build en modo watch (desarrollo)
npm test           # Pruebas unitarias con Karma + Jasmine
```

### Probar PWA en local

```bash
npm run build
npx http-server dist/erp-textil-front/browser -p 8080
```

---

## Variables de entorno

| Archivo | Uso |
|---|---|
| `src/environments/environment.ts` | Desarrollo — apunta a `http://localhost:3000/api` |
| `src/environments/environment.prod.ts` | Producción — actualizar con la URL del backend en producción |

---

## Arquitectura

### Módulos y rutas

```
/auth/login              → Inicio de sesión (público)
/admin/dashboard         → Bienvenida con datos del usuario autenticado
/admin/users             → CRUD de usuarios (solo rol admin)
/admin/roles             → CRUD de roles (solo rol admin)
```

Todas las rutas `/admin/*` se renderizan dentro de `LayoutComponent` (sidebar + topbar).

### Estructura de carpetas

```
src/app/
├── core/
│   ├── guards/
│   │   ├── auth.guard.ts          # Verifica que haya sesión activa
│   │   └── role.guard.ts          # Verifica que el rol tenga acceso
│   ├── interceptors/
│   │   └── auth.interceptor.ts    # Inyecta Bearer token; maneja 401 con refresh
│   └── services/
│       └── storage.service.ts     # Wrapper de localStorage para tokens y usuario
│
├── features/
│   ├── auth/                      # Login + NgRx store de autenticación
│   │   ├── pages/login/
│   │   ├── services/auth.service.ts
│   │   └── store/                 # actions, reducer, effects, selectors, state
│   ├── dashboard/                 # Pantalla de bienvenida
│   ├── users/                     # CRUD de usuarios
│   │   ├── pages/list/
│   │   ├── pages/form/
│   │   └── services/user.service.ts
│   └── roles/                     # CRUD de roles
│       ├── pages/list/
│       ├── pages/form/
│       └── services/role.service.ts
│
├── shared/
│   └── components/layout/         # Shell: sidebar desktop + drawer mobile
│
└── store/
    └── app.state.ts               # Estado raíz (contiene AuthState)
```

---

## Manejo de estado — NgRx

El store de NgRx cubre únicamente la autenticación.

**Estado (`AuthState`):**
```ts
{
  user: { id, name, lastName, email, role } | null
  accessToken: string | null
  refreshToken: string | null
  loading: boolean
  error: string | null
}
```

**Flujo de login:**
1. El componente despacha `login({ email, password })`
2. El effect llama a `POST /auth/login`
3. En éxito → `loginSuccess` → guarda tokens en `localStorage` y navega a `/admin/dashboard`
4. En error (incluyendo 403 por cuenta bloqueada) → `loginFailure` → muestra el mensaje del backend

**Rehydratación:** Al iniciar la app, el effect `@ngrx/effects/init` lee tokens del `localStorage` y restaura la sesión automáticamente.

**Refresh:** El interceptor detecta respuestas 401 y despacha `refreshToken`. Si no hay refresh token disponible, despacha `logout`.

---

## Autenticación

- **Access token:** duración 15 min → se envía en el header `Authorization: Bearer <token>`
- **Refresh token:** duración 7 días → se envía en el body a `POST /auth/refresh`
- **Cuenta bloqueada:** 5 intentos fallidos bloquean la cuenta 15 min; el backend retorna 403 con el mensaje indicando los minutos restantes, y el frontend lo muestra directamente en el formulario

---

## Guards

### `authGuard`
Protege todas las rutas `/admin/*`. Si no hay `accessToken` en el store, redirige a `/auth/login`.

### `roleGuard`
Protege rutas específicas por rol. Lee el array `data.roles` de la ruta y lo compara contra el rol del usuario autenticado (comparación case-insensitive). Si el rol no está permitido, redirige a `/admin/dashboard`.

```ts
// Ejemplo de uso en rutas
{
  path: 'users',
  canActivate: [roleGuard],
  data: { roles: ['admin'] }
}
```

---

## Interceptor HTTP

`src/app/core/interceptors/auth.interceptor.ts`

- Inyecta `Authorization: Bearer <token>` en todas las peticiones salientes
- Ante un 401, despacha `refreshToken` (si existe) o `logout` (si no hay refresh token)

---

## API

Base URL configurada en `environment.ts`: `http://localhost:3000/api`

Todas las respuestas siguen el formato:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Descripción",
  "data": {},
  "errors": ""
}
```

Las listas paginadas retornan en `data`:
```json
{
  "data": [...],
  "meta": { "total": 50, "page": 1, "limit": 20, "pages": 3 }
}
```

Ver [`API.md`](./API.md) para la referencia completa de endpoints.

---

## PWA

Configurado con Angular Service Worker (`ngsw-config.json`):
- **Grupo `app`** — pre-cachea JS/CSS/HTML de forma eager
- **Grupo `assets`** — cachea imágenes y fuentes de forma lazy

El Service Worker solo se activa en build de producción (`isDevMode() === false`).

---

## UI

- **PrimeNG** con tema Aura. Dark mode disponible añadiendo la clase `.dark-mode` al elemento raíz.
- **Tailwind CSS** con `preflight` deshabilitado para evitar conflictos con el reset de PrimeNG.
- **SCSS** por componente + variables/mixins globales en `src/styles/`.

---

## Convenciones de código

- Todos los componentes son `standalone: true` con imports explícitos (sin NgModules)
- Estado local reactivo con Angular Signals (`signal()`, `computed()`)
- Estado global compartido con NgRx (solo auth)
- Prettier configurado: 100 caracteres por línea, comillas simples, parser Angular para HTML
- Sin comentarios descriptivos en el código; los nombres de variables y funciones son autoexplicativos
