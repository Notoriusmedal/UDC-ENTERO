# Proyecto Frontend UDC

Frontend web para Union Deporte Canaria. La version historica esta hecha con HTML, CSS y JavaScript vanilla. A partir de ahora hay una nueva app Angular en `angular-udc`, conectada al mismo backend Spring Boot del repo `pi-25-26-backend-udc`.

## Tecnologias

- HTML5, CSS3 y JavaScript.
- Bootstrap 5 y Bootstrap Icons.
- API REST en `http://localhost:8080/api`.
- Angular 21 en `angular-udc`.

## Arranque local con backend

1. Arrancar el backend desde `pi-25-26-backend-udc`:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

2. Arrancar este frontend:

```bash
python3 -m http.server 8000
```

3. Abrir:

```text
http://localhost:8000
```

## Nueva app Angular

La app Angular esta en:

```text
angular-udc
```

Para arrancarla:

```bash
cd angular-udc
npx -y node@24 node_modules/@angular/cli/bin/ng serve --host 127.0.0.1 --port 4200
```

Abrir:

```text
http://localhost:4200
```

Nota: Angular 21 no soporta Node 25 oficialmente. Por eso se usa Node 24 con `npx node@24` para compilar y servir.

## Credenciales demo

- `admin` / `admin`
- `coordinador` / `1234`
- `organizador` / `1234`
- `arbitro` / `1234`
