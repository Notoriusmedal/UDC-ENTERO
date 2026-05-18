# UDC-ENTERO

Proyecto completo de **UDC / Deporte Canarias** para entrega final.

Incluye:

- `angular-udc/`: frontend Angular 21 + Bootstrap.
- `backend/`: API Spring Boot + JWT + JPA.
- `backend/database/`: script SQL para crear la base MariaDB local.

La version antigua HTML/JS ya no forma parte del proyecto final. La app buena es Angular.

## Arranque Local

### 1. Backend

Para demo rapida con H2 en memoria:

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

API local:

```text
http://localhost:8080/api
```

### 2. Frontend

Angular 21 no soporta Node 25 oficialmente. Si tu equipo tiene Node 25, usa Node 24 con `npx`:

```bash
cd angular-udc
npm install
npx -y node@24 node_modules/@angular/cli/bin/ng serve --host 127.0.0.1 --port 4200
```

Frontend local:

```text
http://localhost:4200
```

## Credenciales Demo

- `admin` / `admin`
- `coordinador` / `1234`
- `organizador` / `1234`
- `arbitro` / `1234`

## Base De Datos Local

Para usar MariaDB en local:

1. Ejecuta el script:

```text
backend/database/dbeaver-init-udc-mariadb.sql
```

2. Arranca el backend con el perfil por defecto `mariadb`:

```bash
cd backend
./mvnw spring-boot:run
```

Para entrega/demo en la nube se puede usar el perfil `dev` con H2 en memoria. Los datos se regeneran al arrancar.

## Docker

### Backend Con Docker

El backend incluye `backend/Dockerfile`.

Para construir y arrancar solo el backend con H2 en memoria:

```bash
docker build -t udc-backend ./backend
docker run --rm -p 8080:8080 -e SPRING_PROFILES_ACTIVE=dev udc-backend
```

API:

```text
http://localhost:8080/api
```

### Backend + MariaDB En Local

Desde la raiz del repo:

```bash
docker compose up --build
```

Esto levanta:

- `mariadb`: base de datos MariaDB local.
- `backend`: API Spring Boot en `http://localhost:8080/api`.

El frontend Angular se puede seguir arrancando fuera de Docker:

```bash
cd angular-udc
npx -y node@24 node_modules/@angular/cli/bin/ng serve --host 127.0.0.1 --port 4200
```

## Despliegue Recomendado Gratis

### Frontend En Vercel

Importa este repo y configura:

```text
Framework Preset: Angular
Root Directory: ./
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

El repo incluye `package.json` y `vercel.json` en la raiz para evitar el error `404: NOT_FOUND` de Vercel. El build instala el frontend Angular, compila la app y copia el resultado final a una carpeta `dist/` simple, que es la que Vercel debe publicar. La configuracion de rutas respeta primero los archivos y funciones `/api`, y despues envia el resto a `index.html` para Angular.

En produccion el frontend llama a `/api`. Vercel reenvia esas llamadas al backend usando la variable de entorno:

```text
UDC_API_URL=https://TU-BACKEND.onrender.com/api
```

Si esta variable no existe, el login no podra conectar con el backend.

### Backend En Render

Crea un Web Service desde este mismo repo. Puedes desplegarlo con Docker:

```text
Root Directory: backend
Environment: Docker
Dockerfile Path: Dockerfile
```

Variables recomendadas para demo con H2:

```text
SPRING_PROFILES_ACTIVE=dev
```

Tambien puedes desplegarlo sin Docker con:

```text
Root Directory: backend
Build Command: ./mvnw clean package -DskipTests
Start Command: java -jar target/*.jar --spring.profiles.active=dev --server.port=$PORT
```

Cuando tengas la URL del backend de Render, configura en Vercel:

```text
UDC_API_URL=https://TU-BACKEND.onrender.com/api
```

Como el frontend usa el proxy `/api` de Vercel, normalmente no hace falta tocar CORS del navegador. Si decides llamar al backend directamente desde Angular, entonces en Render debes permitir CORS para la URL del frontend:

```text
CORS_ALLOWED_ORIGIN=https://TU-FRONTEND.vercel.app
```

## Builds

Frontend:

```bash
cd angular-udc
npx -y node@24 node_modules/@angular/cli/bin/ng build --progress=false
```

Backend:

```bash
cd backend
./mvnw test
```
