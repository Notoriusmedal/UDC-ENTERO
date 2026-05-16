# Proyecto Frontend UDC

Frontend web para Union Deporte Canaria. La version final del proyecto esta en `angular-udc`, hecha con Angular y conectada al backend Spring Boot del repo `pi-25-26-backend-udc`.

La version antigua en HTML, CSS y JavaScript vanilla se ha retirado del flujo del proyecto. Para desarrollo, demo y entrega usa siempre la app Angular.

## Tecnologias

- Angular 21.
- Bootstrap 5 y Bootstrap Icons.
- API REST en `http://localhost:8080/api`.

## Arranque local con backend

1. Arrancar el backend desde `pi-25-26-backend-udc`:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

2. Arrancar el frontend Angular:

```bash
cd angular-udc
npx -y node@24 node_modules/@angular/cli/bin/ng serve --host 127.0.0.1 --port 4200
```

3. Abrir:

```text
http://localhost:4200
```

Nota: Angular 21 no soporta Node 25 oficialmente. Por eso se usa Node 24 con `npx node@24` para compilar y servir.

## Credenciales demo

- `admin` / `admin`
- `coordinador` / `1234`
- `organizador` / `1234`
- `arbitro` / `1234`
