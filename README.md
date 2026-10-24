# Trabajo práctico 07 - Persistencia inicial de reservas de salas

## 1. Punto de partida y proyecto
Este proyecto es una continuación directa (copia denominada `tp-07-salas-mongodb`) del TP 06. Conserva la arquitectura modular basada en Express, los recursos estáticos y las vistas EJS, pero introduce un laboratorio de persistencia interactuando con MongoDB Atlas.

## 2. Entorno y Versiones
- **Node.js**: >= 22.13.0
- **Base de Datos**: MongoDB Atlas, clúster gratuito Free (M0).
- **Mongoose**: Versión 9.10.3 instalada de manera exacta.

## 3. Preparación, Instalación y Ejecución
1. Clonar el repositorio.
2. Ejecutar `npm install` para descargar las dependencias.
3. **Configuración de Atlas:** En MongoDB Atlas, crear un clúster Free (M0). Generar un usuario de base de datos con permisos de lectura y escritura, y autorizar la dirección IP local en el apartado de Network Access.
4. **Entorno local:** Copiar el archivo `.env.example` y renombrarlo a `.env`. Sustituir los marcadores de `MONGODB_URI` (`USUARIO`, `CLAVE` y `HOST`) por los datos reales provistos por Atlas apuntando a la base `reservas_salas_u7`.
5. Ejecutar la aplicación web en memoria: `npm start`.

## 4. Laboratorio: Comandos y Diagnóstico DNS
Para sortear posibles bloqueos en la resolución de los registros SRV/TXT por parte de los proveedores de internet locales, se ha configurado explícitamente a Node.js para utilizar resolutores DNS públicos (`8.8.8.8` y `1.1.1.1`) en `src/config/base-datos.js`.

**Comandos del laboratorio (ejecutar en terminal):**
- Comprobar conexión: `node --env-file .env scripts/comprobar-conexion.js`
- Crear reserva de prueba: `node --env-file .env scripts/crear-reserva.js`
- Listar reservas persistentes: `node --env-file .env scripts/listar-reservas.js`

## 5. Mapa de archivos, Esquema, Modelo y Colección
- **`src/config/entorno.js`**: Centraliza la lectura de `PORT` y `MONGODB_URI`.
- **`src/config/base-datos.js`**: Exporta las funciones para conectar y desconectar de MongoDB mediante Mongoose.
- **`src/modelos/reserva.js`**: Contiene la definición del esquema y el modelo.
- **`scripts/`**: Programas de consola aislados para probar la conexión, creación y lectura en la base de datos sin levantar Express.

**Conceptos clave:**
- **Esquema (Schema):** Define el contrato de los datos a nivel de aplicación (campos, tipos y validaciones).
- **Modelo (Model):** Es la clase constructora provista por Mongoose que envuelve el esquema y nos otorga los métodos (`create`, `find`) para interactuar con la base.
- **Colección:** Es el contenedor físico en MongoDB (llamado explícitamente `reservas`) donde se almacenan los documentos BSON generados por el modelo.

## 6. Campos y Reglas del Dominio
- `estudiante`: Texto, obligatorio, con limpieza de espacios (`trim`).
- `email`: Texto, obligatorio, limpieza de espacios y validado mínimamente para contener un arroba (`match: /@/`).
- `sala`: Texto, obligatorio. Restringido a enumerador (`enum`): "Sala Norte", "Sala Sur", "Sala Multimedia".
- `fecha`: Texto, obligatorio, con limpieza de espacios.
- `turno`: Texto, obligatorio. Restringido a enumerador (`enum`): "Mañana", "Tarde", "Noche".
- `personas`: Numérico, obligatorio. Limitado a valores entre 1 (`min`) y 6 (`max`). Implementa una validación personalizada (`validate`) usando `Number.isInteger` para rechazar números fraccionarios.
*(Límites actuales: Aún no se controlan lógicas complejas de negocio como superposición de horarios, fechas pasadas o disponibilidad de cupos).*

## 7. Matriz de Pruebas y Evidencia de Persistencia

**Nota sobre Morgan:** Como `app.use(morgan(...))` está registrado al principio del pipeline en `app.js`, intercepta y registra en la terminal absolutamente todas las solicitudes, incluyendo los recursos estáticos cargados exitosamente por `express.static` (`/css/estilos.css`) y las peticiones a URLs inexistentes que terminan en el middleware 404 final.

| Caso | Estado HTTP | Vista / Contenido | Reservas (Memoria) | Evidencia / Observaciones |
| :--- | :--- | :--- | :--- | :--- |
| **Inicio** | 200 | Vista `inicio.ejs` | 4 | Navegación funcional, ID de solicitud (`BIB-XXXX`) visible en el pie de página. |
| **Estado inicial** | 200 | JSON | 4 | Devuelve estructura JSON validando `servicio: activo` y cantidad de reservas en memoria. |
| **Listado de reservas** | 200 | Vista `lista.ejs` | 4 | Renderiza la grilla con las tarjetas generadas desde la semilla inicial. |
| **Formulario (GET)** | 200 | Vista `nueva.ejs` | 4 | Carga el formulario vacío con los selects instanciados. |
| **Detalle existente** | 200 | Vista `detalle.ejs` | 4 | Muestra los atributos completos de una reserva solicitada. |
| **Detalle inexistente** | 404 | Vista `no-encontrado.ejs`| 4 | Presenta vista HTML de error. El servidor continúa en ejecución. |
| **POST inválido: Vacío** | 400 | Vista `nueva.ejs` | 4 | Renderiza alerta (`role="alert"`), conserva valores. No ejecuta alta. |
| **POST inválido: Sala errónea**| 400 | Vista `nueva.ejs` | 4 | Validador rechaza manipulación HTML del select. Retorna alerta. No ejecuta alta. |
| **POST inválido: Email sin @**| 400 | Vista `nueva.ejs` | 4 | Falla validación de regex. Retorna alerta. No ejecuta alta. |
| **POST inválido: Personas 0** | 400 | Vista `nueva.ejs` | 4 | Falla validación `min`. Retorna alerta. No ejecuta alta. |
| **POST inválido: Personas 7** | 400 | Vista `nueva.ejs` | 4 | Falla validación `max`. Retorna alerta. No ejecuta alta. |
| **POST inválido: Personas Float**| 400 | Vista `nueva.ejs` | 4 | Falla validación `isInteger` (ej: 2.5). Retorna alerta. No ejecuta alta. |
| **POST válido** | 302 -> 200| Vista `lista.ejs` | 5 | Redirige al catálogo (`/reservas`). Se observa la nueva tarjeta agregada. |
| **CSS estático** | 200 | Archivo `.css` | N/A | Hoja de estilos vinculada y aplicada correctamente en el layout global. |
| **URL inexistente** | 404 | Vista `no-encontrado.ejs`| N/A | El middleware de cierre captura la URL y entrega la vista de error. |

**Pruebas del laboratorio MongoDB (Terminal):**
- **Conexión válida:** El script `comprobar-conexion.js` imprimió "Conexión con MongoDB establecida." y finalizó con código 0.
- **Variable vacía:** Forzando `MONGODB_URI` vacío en `.env`, el script detuvo la ejecución advirtiendo configuración faltante.
- **Fallo de autenticación:** Al manipular la clave temporalmente, arrojó `MongoServerError: bad auth` rechazando la operación sin colgar el hilo.
- **Evidencia de persistencia (Procesos separados):**
  1. Se ejecutó `listar-reservas.js` (Devolvió: 0 reservas persistentes).
  2. Se ejecutó `crear-reserva.js` en un proceso nuevo (Devolvió: "Reserva guardada. _id: 6734abc...").
  3. Se ejecutó `listar-reservas.js` en un tercer proceso nuevo (Devolvió tabla con el registro exacto, el mismo `_id`, y "Total de reservas persistentes: 1"). 
  *Nota: La ejecución reiterada del script de creación genera múltiples documentos iguales pero con `_id` distintos, comportamiento documentado y esperado al no haber forzado unicidad.*

## 8. Persistencia Dual: ¿Por qué el sitio continúa en memoria?
Actualmente, existe una separación transitoria documentada: la aplicación web (Express) sigue consumiendo la lógica y los arreglos en memoria de `src/servicios/reservas.js`, por lo que las reservas web desaparecen al reiniciar Node.js. Por otro lado, los scripts del laboratorio (`scripts/`) operan con Mongoose y Atlas, logrando persistencia real.
La integración total se abordará en la **Unidad 8**, donde los controladores HTTP y el servicio se refactorizarán para consumir operaciones asíncronas basadas en promesas, conectando las vistas EJS definitivamente con la base de datos de MongoDB.

## 9. Seguridad y Análisis Estático
- **Seguridad:** Se confirma que el archivo `.env` se encuentra excluido mediante `.gitignore`. No existen credenciales, URIs privadas ni contraseñas expuestas en ningún commit de este repositorio.
- **Ejecución de herramientas de calidad:**
  - `npm run format`: Ejecutado. Prettier formateó exitosamente las carpetas `src/` y `scripts/`.
  - `npm run lint`: Ejecutado. ESLint validó la sintaxis y variables según las normas impuestas para CommonJS sin reportar incidencias.
  - `npm run check`: Ejecutó ambas comprobaciones en pipeline con salida satisfactoria.