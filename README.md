# Trabajo práctico 06

## Proyecto de partida y cambios
Este proyecto toma como punto de partida la aplicación funcional desarrollada en el TP 05 (Reservas de Salas con Middleware). El cambio principal consiste en la refactorización de un único archivo `index.js` hacia una arquitectura modular, separando las responsabilidades de configuración, aplicación, rutas, controladores, servicios y middleware, manteniendo exactamente el mismo comportamiento funcional y contrato de rutas.

## Instalación y ejecución
1. Clonar el repositorio.
2. Ejecutar el comando `npm install` para instalar todas las dependencias.
3. Para iniciar la aplicación con los valores por defecto, ejecutar: `npm start`.
4. Para iniciar la aplicación utilizando variables de entorno locales, crear un archivo `.env` basándose en `.env.example` y ejecutar: `npm run start:local`.
El servidor se iniciará por defecto en `http://localhost:3000`.

## Configuración del entorno
La configuración centralizada en `src/configuracion.js` se encarga de leer `process.env`. Valida estrictamente que la variable `PORT` sea un número entero válido (entre 1 y 65535) y establece el formato de registro de Morgan (`dev` o `combined`) dependiendo si `NODE_ENV` está en producción o no. Las credenciales o variables de entorno reales no se suben al repositorio gracias a que `.env` está incluido en el archivo `.gitignore`.

## Mapa de módulos y dependencias
- **`src/index.js`**: Punto de entrada principal. Se encarga exclusivamente de inyectar los datos iniciales, crear las dependencias (servicio, aplicación) y arrancar el servidor con `app.listen()`.
- **`src/app.js`**: Configura la aplicación de Express, estableciendo el motor de vistas, el orden estricto del pipeline de middleware y el montaje de los routers.
- **`src/configuracion.js`**: Procesa, valida y exporta las variables del entorno.
- **`src/servicios/reservas.js`**: Contiene la lógica de negocio. **Aquí vive el único arreglo temporal de reservas**. Este módulo no utiliza objetos HTTP como `res` ni `req` porque su única responsabilidad es operar sobre los datos (buscar, agregar, contar) de forma agnóstica, permitiendo que la lógica sea reutilizable incluso fuera de un contexto web.
- **`src/controladores/reservas.js`**: Es el adaptador HTTP. Se encarga de recibir la solicitud (`req`), llamar al servicio correspondiente, y enviar la respuesta (`res`) ya sea renderizando una vista de EJS, enviando JSON o realizando una redirección 302.
- **`src/rutas/reservas.js`**: Actúa como el mapa del área. Relaciona el método HTTP y el camino con su respectivo middleware y método del controlador. **Declara caminos relativos** (como `/` o `/nueva`) porque el prefijo base `/reservas` se asigna dinámicamente en `app.js` al momento de montar el router.
- **`src/middleware/`**: Aloja las funciones intermedias extraídas (identificador, medición y validación de reservas).

## Pipeline y contrato de rutas
El pipeline de middleware respeta el siguiente orden de ejecución:
`Morgan -> identificarSolicitud -> medirDuracion -> expressLayouts -> express.static -> express.urlencoded -> express.json -> router /reservas -> 404 (Final)`

**Contrato de rutas conservado:**
- `GET /` -> 200, inicio
- `GET /estado` -> 200, JSON con cantidad e ID de solicitud
- `GET /reservas` -> 200, listado de reservas
- `GET /reservas/nueva` -> 200, formulario de creación
- `GET /reservas/:id` -> 200 (si existe) o 404 (HTML si no existe)
- `POST /reservas` -> 302 (válido) o 400 (inválido)
- `GET /css/estilos.css` -> 200

## Matriz antes/después
El comportamiento funcional se mantiene idéntico tras la refactorización:

| Caso | Esperado | Antes (TP05) | Después (TP06) |
| :--- | :--- | :--- | :--- |
| **Inicio y CSS** | 200 | Navegación funcional, CSS cargado, ID visible. | Navegación funcional, CSS cargado, ID visible. |
| **Estado inicial** | 200 | JSON con cantidad (4) e ID dinámico. | JSON con cantidad (4) e ID dinámico. |
| **Listado y detalle** | 200 | 4 tarjetas iniciales. Detalle muestra datos completos. | 4 tarjetas iniciales. Detalle muestra datos completos. |
| **Detalle inexistente** | 404 | Vista HTML personalizada 404. | Vista HTML personalizada 404. |
| **Formulario** | 200 | Carga EJS con selects y campos vacíos. | Carga EJS con selects y campos vacíos. |
| **POST inválido (vacío/errores)** | 400 | No crea. Retorna 400 con mensaje "alert" y valores. | No crea. Retorna 400 con mensaje "alert" y valores conservados. |
| **POST válido** | 302 -> 200 | Redirige y muestra la nueva sala reservada. | Redirige y muestra la nueva sala reservada. |
| **URL inexistente** | 404 | Vista HTML de "Página no encontrada". | Vista HTML de "Página no encontrada". |
| **Puerto inválido** | Falla | N/A (Estaba harcodeado). | Falla con mensaje explícito antes de iniciar. |

## Formato y análisis estático
El proyecto incluye herramientas de calidad de código:
- `npm run format`: Utiliza **Prettier** para unificar el formato, espacios y sangrías de manera automática en la carpeta `src/`.
- `npm run lint`: Utiliza **ESLint** para realizar un análisis estático en busca de errores sintácticos, variables sin uso y patrones problemáticos (configurado para CommonJS).
- `npm run check`: Ejecuta ambas herramientas de verificación en cadena.

## Persistencia temporal y límites
Los datos ingresados no se guardan de forma permanente. El sistema utiliza un arreglo en memoria que vive dentro del scope protegido de `src/servicios/reservas.js`. Al detener el proceso de Node.js, la memoria se libera y los datos se pierden. Al reiniciar, la aplicación inyecta nuevamente la semilla quemada en `index.js`, restaurando el sistema a su estado inicial.