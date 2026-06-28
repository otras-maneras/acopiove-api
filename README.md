# AcopioVE API y Directorio Abierto de Datos

Este repositorio contiene la especificación de la API pública, la documentación de integración y el directorio de datos abiertos del ecosistema AcopioVE (acopiove.org), una plataforma de emergencia destinada a mapear centros de acopio, refugios de alojamiento, puntos de salud y teléfonos de emergencia en respuesta al terremoto de Venezuela de 2026.

Este repositorio es independiente del backend de la aplicación principal para garantizar la seguridad de la infraestructura y el panel de administración, permitiendo a la comunidad colaborar libremente en el modelado y consumo de la información.

---

## Documentación en la Web
Para acceder a la documentación interactiva en vivo, puedes visitar los siguientes recursos oficiales:
* **Página de Documentación de la API:** [https://acopiove.org/docs/api](https://acopiove.org/docs/api)
* **Consola Interactiva (Scalar):** [https://api.acopiove.org/v1/docs](https://api.acopiove.org/v1/docs)
* **Especificación OpenAPI 3.1 en Vivo:** [https://api.acopiove.org/v1/openapi.json](https://api.acopiove.org/v1/openapi.json)

La copia local estática de la especificación técnica se encuentra en [openapi.json](openapi.json).

---

## Snapshots de Datos Offline (data/)
Para garantizar la máxima resiliencia en situaciones donde la red móvil sea precaria o el servidor principal no responda, ofrecemos snapshots estáticos de los datos actualizados periódicamente en la carpeta data/:
* **JSON:** [data/puntos.json](data/puntos.json) - Formato crudo y estructurado con todos los puntos y sus atributos.
* **GeoJSON:** [data/puntos.geojson](data/puntos.geojson) - Formato georreferenciado listo para ser importado directamente en mapas web (Mapbox, Leaflet, Google Maps, QGIS, etc.).
* **CSV:** [data/puntos.csv](data/puntos.csv) - Formato tabular compatible con Excel y bases de datos.

Nota: Estos snapshots no contienen ningún dato privado (PII) de personas desaparecidas o localizadas por motivos de privacidad.

---

## API Pública en Vivo (https://api.acopiove.org/v1)
Si deseas integrar los datos en tiempo real en tu aplicación, plataforma o chatbot, puedes consumir la API pública oficial (CORS habilitado "*" y caché CDN activo).

### Resumen de Endpoints

#### 1. Directorio unificado
* **GET /puntos** - Directorio de ayuda unificado en una sola llamada.
  * Uso: Recomendado para chatbots y visores de mapas. Combina centros de acopio, refugios y teléfonos propios de AcopioVE con puntos de salud/hospitales provistos por CIVIS.
  * Parámetros:
    * `tipo` (CSV, ej: `acopio,refugio,salud`)
    * `ciudad` / `pais` (filtro de texto unaccent)
    * `near=lat,lng` (ordena por distancia a un punto GPS)
    * `radius` (en km, requiere near)
    * `format` (`json`, `geojson`, `csv`)

#### 2. Registros específicos
* **GET /centros** - Lista detallada de centros de acopio y refugios de AcopioVE.
* **GET /centros/{id}** - Detalle individual de un centro por su UUID.
* **GET /telefonos** - Directorio de líneas telefónicas de emergencia y primera respuesta.
* **GET /meta** - Metadatos (conteo, fecha de última actualización, licencias).

#### 3. Búsqueda de personas (Reunificación)
* **GET /personas** - Búsqueda PII-segura de personas reportadas como desaparecidas o localizadas.
  * Requisito: Requiere obligatoriamente un término de búsqueda en `q` (nombre) o `cedula`.
  * Privacidad: Las cédulas se devuelven enmascaradas (`***123`), se omiten teléfonos y GPS, y se oculta la ubicación de menores de edad (`edad < 18`). Agrega registros de SOS Venezuela, Localizados y Venezuela Ayuda.

#### 4. Contribuir Datos (Submissions)
* **POST /submissions** - Envía una sugerencia de centro de acopio o refugio.
  * Uso: Abierto (sin llave). Las sugerencias entran como pendientes en la base de datos y un administrador las revisa antes de publicarlas. El endpoint devuelve si se detectaron duplicados cercanos (`possible_duplicate: true`).
* **GET /submissions/{id}** - Consulta el estado de tu sugerencia (`pending` o `approved`).

---

## Integraciones y Documentación Adicional
Hemos preparado guías y ejemplos específicos para expandir el uso de la API:
* **Manual del Chatbot de WhatsApp:** [docs/chatbot-whatsapp.md](docs/chatbot-whatsapp.md) - Guía completa de cómo estructurar un asistente conversacional de WhatsApp usando Kapso y esta API.
* **Catálogo de APIs de Datos Externas:** [docs/fuentes-datos.md](docs/fuentes-datos.md) - Listado de las APIs de terceros (SOS Venezuela, CIVIS, etc.) que se unifican y consolidan en este ecosistema.

---

## Ejemplos de Integración (examples/)
1. **Mapa Interactivo con Leaflet (HTML/JS):** [examples/leaflet_example.html](examples/leaflet_example.html) - Muestra cómo pintar los marcadores en un mapa web y personalizarlos por color según el tipo de punto de ayuda.
2. **Cliente en Python:** [examples/python_example.py](examples/python_example.py) - Consulta la API en vivo, filtra los puntos por cercanía radial y los muestra en la consola.
3. **Webhook de WhatsApp (NodeJS):** [examples/whatsapp_webhook.js](examples/whatsapp_webhook.js) - Manejador completo para un bot de WhatsApp conectado con Kapso.
4. **Cliente en NodeJS (Fetch API):** [examples/nodejs_example.js](examples/nodejs_example.js) - Consulta geolocalizada e impresión formateada de puntos de ayuda en consola.
5. **Comandos cURL (Bash):** [examples/curl_examples.sh](examples/curl_examples.sh) - Scripts y peticiones rápidas documentadas de consola.

---

## Comandos Rápidos del Proyecto
Este repositorio cuenta con un archivo `package.json` configurado. Si tienes NodeJS instalado, puedes ejecutar las siguientes tareas desde la raíz del proyecto:
* **npm run snapshots:** Genera localmente los archivos JSON/CSV de la carpeta `data/` a partir del backend activo.
* **npm run example:node:** Ejecuta el ejemplo en NodeJS que consulta y formatea la API en vivo.
* **npm run example:curl:** Ejecuta los ejemplos básicos de cURL en la consola.

---

## Contacto y Canales Oficiales
Para consultas adicionales, soporte técnico de integración o reportar inconsistencias en los datos:
* **Sitio Web Oficial:** [https://acopiove.org](https://acopiove.org)
* **Correo de Contacto:** [info@acopiove.org](mailto:info@acopiove.org)

---

## Licencia y Atribución
* **Código:** El código de integración y herramientas de este repositorio está licenciado bajo la Licencia MIT.
* **Datos:** Los datos del directorio son de carácter libre y abierto bajo la licencia internacional Creative Commons Attribution 4.0 (CC-BY-4.0).
  * Atribución: Los datos consolidados pertenecen a la comunidad de AcopioVE.org, recopilados en cooperación con plataformas como CIVIS Venezuela, SOS Venezuela y Venezuela Ayuda.
