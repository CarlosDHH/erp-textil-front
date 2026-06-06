# API Reference

Base URL: `http://localhost:3000/api`

---

## Formato de respuesta estándar

```json
{ "statusCode": 200, "success": true, "message": "Descripción", "data": {}, "errors": "" }
```

Listas paginadas retornan esto en `data`:

```json
{ "data": [...], "meta": { "total": 50, "page": 1, "limit": 20, "pages": 3 } }
```

---

## Auth

| Método | Endpoint | Body |
|--------|----------|------|
| POST | `/auth/login` | `{ email, password }` |
| POST | `/auth/refresh` | `{ refreshToken }` |

**Login response `data`:**
```json
{ "user": { "id", "name", "lastName", "email", "role" }, "accessToken", "refreshToken" }
```

- `accessToken`: 15 min → header `Authorization: Bearer <token>`
- `refreshToken`: 7 días → body al llamar `/auth/refresh`
- 5 intentos fallidos bloquean la cuenta 15 min (403 con minutos restantes en el mensaje)

---

## Users — requiere Bearer + rol admin

| Método | Endpoint | Body / Params |
|--------|----------|---------------|
| GET | `/users` | `?page&limit&search` |
| POST | `/users` | `{ name, lastName, email, password, roleId, phone? }` |
| GET | `/users/:id` | — |
| PUT | `/users/:id` | `{ name?, lastName?, phone?, roleId?, active? }` |
| DELETE | `/users/:id` | soft delete |

**User response:**
```json
{ "id", "name", "lastName", "email", "phone", "role", "active", "createdAt" }
```
> `role` es el nombre del rol como string (ej. `"admin"`)

---

## Roles — requiere Bearer + rol admin

| Método | Endpoint | Body / Params |
|--------|----------|---------------|
| GET | `/roles` | `?page&limit&search` |
| POST | `/roles` | `{ name, description? }` |
| GET | `/roles/:id` | — |
| PUT | `/roles/:id` | `{ name?, description?, isActive? }` |
| DELETE | `/roles/:id` | falla con 409 si el rol tiene usuarios asignados |

**Role response:**
```json
{ "id", "name", "description", "isActive", "createdAt" }
```
