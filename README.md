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

## Despliegue Recomendado Gratis

### Frontend En Vercel

Importa este repo y configura:

```text
Framework Preset: Angular
Root Directory: angular-udc
Install Command: npm install
Build Command: npm run build
Output Directory: dist/angular-udc/browser
```

El repo tambien incluye `vercel.json` en la raiz y en `angular-udc/` para evitar el error `404: NOT_FOUND` de Vercel cuando se despliega un monorepo o cuando Angular genera el `index.html` dentro de `dist/angular-udc/browser`.

### Backend En Render

Crea un Web Service desde este mismo repo y configura:

```text
Root Directory: backend
Build Command: ./mvnw clean package -DskipTests
Start Command: java -jar target/*.jar --spring.profiles.active=dev --server.port=$PORT
```

Cuando tengas la URL del backend de Render, el frontend debe apuntar a:

```text
https://TU-BACKEND.onrender.com/api
```

Y en Render debes permitir CORS para la URL del frontend:

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
