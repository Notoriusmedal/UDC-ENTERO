# UDC — Backend (Spring Boot)

API REST para **Unión Deporte Canaria**. Pensado para que el equipo de **frontend** integre contra `http://localhost:8080` (puerto por defecto de Spring Boot).

## Stack

- Java **21**, Spring Boot **3.5**, Spring Security + **JWT**, JPA (**Hibernate**).
- BD por defecto: **MariaDB** (perfil `mariadb`, datos persistentes). Alternativa rápida: **H2 en memoria** (perfil `dev`).
- El esquema de tablas se genera desde las entidades JPA (`ddl-auto`; ver perfiles).

## Arranque con MariaDB (por defecto; datos persistentes)

1. Tener MariaDB/MySQL escuchando (en tu equipo suele ser el puerto **3306**).
2. En **DBeaver**, con usuario con privilegios (p. ej. `root`): abrir y ejecutar el script **`database/dbeaver-init-udc-mariadb.sql`**.  
   Eso crea la base **`udc`**, el usuario **`udc`@localhost`** y la contraseña por defecto del script (**`cambiar`**) debe ser la misma que `spring.datasource.password` en `application-mariadb.properties`.
3. Levantar la app: Hibernate crea/actualiza **las tablas** la primera vez (`ddl-auto=update`).
4. Con `udc.bootstrap.dev-users=true` se crean usuarios demo si no existen: `admin`, `coordinador`, `organizador` y varios árbitros.

### Si no quieres MariaDB (solo desarrollo rápido)

En `application.properties`:

```properties
spring.profiles.active=dev
```

Así usarás H2 en memoria (los datos **no persisten** al cerrar la app).

## Cómo arrancar la aplicación

En la carpeta del proyecto (`udc/`):

```bash
./mvnw spring-boot:run
```

Comprobar: `GET http://localhost:8080/api/public/demo` (público).

Tests:

```bash
./mvnw test
```

## Perfiles

| Perfil       | Archivo principal                    | BD / DDL |
|-------------|----------------------------------------|----------|
| `mariadb` (**activo por defecto** en `application.properties`) | `application-mariadb.properties` | MariaDB local persistente; `ddl-auto=update`. Crear antes BD + usuario con `database/dbeaver-init-udc-mariadb.sql`. Opcional: `udc.bootstrap.dev-users=true` inserta ADMIN si tabla vacía. |
| `dev` | `application-dev.properties`   | H2 memoria; `ddl-auto=create-drop`. Datos efímeros. Consola H2: `/h2-console`. |

Para usar otro perfil sin tocar archivos:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

## Usuario inicial (solo desarrollo)

Con **`dev`** (H2 memoria), o **`mariadb`** con `udc.bootstrap.dev-users=true` y tabla **`usuario`** vacía, puede crearse el **ADMIN** demo al arrancar:

| Campo      | Valor (ejemplo por defecto) |
|-----------|------------------------------|
| `username`| `admin`                      |
| `password`| `admin`                      |

Tambien se crean usuarios demo: `coordinador` / `1234`, `organizador` / `1234` y `arbitro` / `1234`.

## CORS

Origen permitido configurable: `cors.allowed-origin` y `cors.extra-allowed-origins`. Por defecto se permite Angular en `http://localhost:4200` y el frontend estatico en `http://localhost:8000`.

## Autenticación (JWT)

1. **Login** (público): `POST /api/auth/login`
2. Guardar `accessToken` de la respuesta.
3. En el resto de peticiones: cabecera  
   `Authorization: Bearer <accessToken>`

### `POST /api/auth/login`

**Body (JSON):**

```json
{
  "username": "admin",
  "password": "admin"
}
```

**Respuesta 200** (`LoginResponse`):

```json
{
  "tokenType": "Bearer",
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "expiresInMinutes": 480,
  "username": "admin",
  "rol": "ADMIN"
}
```

- `rol`: uno de `ADMIN`, `ORGANIZADOR`, `COORDINADOR_ARBITROS`, `ARBITRO`.

### `GET /api/auth/me`

Requiere JWT. Respuesta (`UsuarioActualResponse`): `username`, `rol`, `nombre`, `apellidos`, `correo`.

### Errores habituales

| Código HTTP | Ejemplo |
|-------------|---------|
| 401 sin token válido | Cuerpo mínimo: `{"codigo":"NO_AUTENTICADO","mensaje":"Requiere autenticacion"}` |
| 401 JWT inválido/expirado (filtro) | `TOKEN_INVALIDO` |
| 401 login malo | `CREDENCIALES_INVALIDAS` |
| 403 permiso método/rol | `PROHIBIDO` o `OPERACION_PROHIBIDA` |
| 400 validación Jakarta | `VALIDACION` + detalle campo |
| 400 regla de negocio | `REGLA_NEGOCIO` |
| 404 recurso | `NO_ENCONTRADO` |

Formato típico: `{"codigo":"...","mensaje":"..."}` (`ErrorResponse`).

## Roles y seguridad en endpoints

Los controladores combinan:

- rutas públicas configuradas en `SecurityConfig`;
- método seguro JWT para el resto;
- donde aplica, `@PreAuthorize("hasRole('...')")` (Spring espera autoridades `ROLE_ADMIN`, etc.).

Si el usuario no tiene rol adecuado, obtendrá **403**.

---

## Referencia rápida de API

Base: `/api`  
Content-Type recomendado: `application/json`  
Fechas/horas en JSON como **ISO-8601 local** donde el DTO es `LocalDateTime`, por ejemplo `"2026-06-01T18:30:00"`.

### Público

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/public/demo` | Comprobación de API |
| POST | `/api/auth/login` | Login |

### Catálogo (autenticado)

| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/catalogo/equipos` | cualquiera autenticado | Lista equipos |
| POST | `/api/catalogo/equipos` | **ADMIN** | Alta equipo |
| PUT | `/api/catalogo/equipos/{id}` | **ADMIN** | Actualizar |
| GET | `/api/catalogo/instalaciones` | cualquiera autenticado | Lista instalaciones |
| POST | `/api/catalogo/instalaciones` | **ADMIN** | Alta instalación (`nombre`, `ubicacionTexto`, `latitud`, `longitud` opcionales) |
| PUT | `/api/catalogo/instalaciones/{id}` | **ADMIN** | Actualizar |

**Equipo crear** (`EquipoRequest`): `nombre`, `escudoEtiqueta` (opcional).

### Administración de usuarios

| Método | Ruta | Rol |
|--------|------|-----|
| GET | `/api/admin/usuarios` | **ADMIN** |
| POST | `/api/admin/usuarios` | **ADMIN** |
| PUT | `/api/admin/usuarios/{id}` | **ADMIN** |

**Alta** (`UsuarioAltaAdminRequest`):

```json
{
  "username": "org1",
  "passwordClaro": "claveSegura1",
  "nombre": "Ana",
  "apellidos": "Pérez",
  "correo": "ana@example.com",
  "documentoIdentidad": "12345678Z",
  "telefono": "600000000",
  "rol": "ORGANIZADOR",
  "convocableParaSeleccionArbitral": false
}
```

- `convocableParaSeleccionArbitral`: solo tiene efecto real si `rol` es **`ARBITRO`** (en otros roles se fuerza coherencia en servidor).

**Actualizar** (`UsuarioActualizarAdminRequest`): todos opcionales; `passwordClaroOpcional`, `nombre`, `apellidos`, `correo`, `telefono`, `rol`, `enabled`, `convocableParaSeleccionArbitral`.

### Coordinación: bandera “convocable” del árbitro

| Método | Ruta | Rol |
|--------|------|-----|
| PATCH | `/api/coordinacion/arbitros/{id}/convocable` | **ADMIN** o **COORDINADOR_ARBITROS** |

**Body** (`ConvocablePatchRequest`): `{ "convocable": true }`

### Partidos

| Método | Ruta | Rol |
|--------|------|-----|
| GET | `/api/partidos` | Lista filtrada según rol del usuario |
| GET | `/api/partidos/{id}` | Detalle si el rol puede verlo |
| POST | `/api/partidos` | **ADMIN** o **ORGANIZADOR** |
| PATCH | `/api/partidos/{id}` | **ADMIN** o **ORGANIZADOR** dueño |

**Crear partido** (`PartidoCrearRequest`):

- `equipoLocalId`, `equipoVisitanteId`, `instalacionId`, `fechaInicio` obligatorios.
- `fechaFin` opcional (sin solape con mismo `fechaInicio`; si falta duración efectiva para reglas usa +2 h en servidor).
- `plazasArbitralesSolicitadas` opcional (1–12); por defecto 3 en entidad si no envías valor en creación específico del servicio.
- **`organizadorIdOpcionalCuandoLlamaAdministrador`**: obligatorio cuando quien crea es **ADMIN** (debe ser el `id` de un usuario con rol **`ORGANIZADOR`**). Para **ORGANIZADOR** se ignora y el organizador es él mismo.

**Actualizar** (`PartidoActualizarRequest`): campos opcionales; puede incluir `estado`.

**Estados partido** (`EstadoPartido`):  
`PROGRAMADO`, `CANCHA_ACTIVA`, `CANCHA_INACTIVA`, `EN_CURSO`, `FINALIZADO`, `CANCELADO`.

Cuando el `estado` pasa a **`CANCHA_ACTIVA`**, el backend notifica a los **COORDINADOR_ARBITROS** (tipo `CANCHA_PARA_COORDINACION_ARBITRAL`).

**Respuesta lista/detalle** (`PartidoRespuesta`): incluye entre otros `fechaFinEfectiva` (fin declarado o inicio + 2 h).

### Asignaciones arbitrales (`partidoId` debe estar en **`CANCHA_ACTIVA`** para modificar)

| Método | Ruta | Rol |
|--------|------|-----|
| GET | `/api/partidos/{partidoId}/asignaciones` | **ADMIN** o **COORDINADOR_ARBITROS** *(debe tener permiso para “ver” el partido como en código)* |
| PUT | `/api/partidos/{partidoId}/asignaciones/manual-completo` | **ADMIN** o **COORDINADOR_ARBITROS** |
| POST | `/api/partidos/{partidoId}/asignaciones/auto` | **ADMIN** o **COORDINADOR_ARBITROS** |

**Manual completo** (`AsignacionesReemplazoRequest`): el número de líneas debe ser **exactamente** `plazasArbitralesSolicitadas` del partido.

```json
{
  "asignaciones": [
    { "arbitroId": 5, "posicionEnCampo": "Árbitro principal" },
    { "arbitroId": 6, "posicionEnCampo": "Primer asistente" }
  ]
}
```

- Revoca todas las activas previas del partido y crea estas.
- Respuesta **`AsignacionOperacionRespuesta`**: `asignaciones`, `advertencias` (lista de strings; puede avisar lejanía km mismo día si hay coordenadas en instalaciones).

**Auto** (`AutoAsignacionRespuesta`): `asignaciones`, `advertencias` (vacantes sin cubrir, lejanía, etc.).

### Portal árbitro (solo **`ARBITRO`**)

| Método | Ruta |
|--------|------|
| GET | `/api/arbitro/franjas` |
| PUT | `/api/arbitro/franjas` |
| GET | `/api/arbitro/asignaciones/historial` |

**Reemplazo de franjas** (`FranjasReemplazoRequest`): lista no vacía de franjas sin solapes entre sí.

```json
{
  "franjas": [
    { "inicio": "2026-06-01T08:00:00", "fin": "2026-06-01T23:00:00" }
  ]
}
```

### Notificaciones (cualquier usuario autenticado; cada uno solo las suyas)

| Método | Ruta |
|--------|------|
| GET | `/api/notificaciones` |
| PATCH | `/api/notificaciones/{id}/leida` |

Tipos (`TipoNotificacion`):  
`CANCHA_PARA_COORDINACION_ARBITRAL`, `ASIGNACION_ARBITRAL`, `AVISO_SISTEMA`.

---

## Propiedades útiles (`application.properties`)

| Propiedad | Uso |
|-----------|-----|
| `jwt.secret`, `jwt.expiration` | Firma y caducidad del JWT |
| `cors.allowed-origin` | Origen CORS frontend |
| `udc.business.kilometros-aviso-lejania-mismo-dia` | Umbral (km) para advertencias día mismo entre instalaciones con lat/lon |
| Perfil dev: `udc.bootstrap.*` | Credenciales del admin inicial |

---

## Flujo típico para probar desde el frontend

1. Levantar backend (`dev`): login con admin demo.
2. **ADMIN**: `POST /api/admin/usuarios` crear **ORGANIZADOR**, **COORDINADOR_ARBITROS**, **ARBITRO** (+ marcar convocable/franjas vía APIs).
3. **ADMIN**: catálogo equipos e instalaciones.
4. **ORGANIZADOR** (o **ADMIN** con `organizadorIdOpcional...`): crear partidos; cuando toque coordinación pasar estado a **`CANCHA_ACTIVA`**.
5. **COORDINADOR** (o **ADMIN**): `manual-completo` o **auto** asignaciones.
6. **Árbitro** (usuario con rol **ARBITRO**): franjas, historial, notificaciones.

---

## Notas para el equipo frontend

- Reutilizar **`rol`** devuelto en login para rutas guard y menús.
- Manejar `401`: borrar token y redirigir a login; si llega HTML en vez de JSON, revisar URL base o interceptor.
- **Partido (ADMIN creando)**: sin `organizadorIdOpcionalCuandoLlamaAdministrador` el backend responde error de negocio explícito.
- Insomnia/Postman: carpeta por rol acelera pruebas.

Si en el proyecto acordáis **OpenAPI/Swagger** generado desde código, se puede añadir en una segunda iteración sobre este mismo backend.
