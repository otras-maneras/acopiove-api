# Fuentes de Información y APIs de Datos Integradas

Este documento detalla el catálogo de APIs de datos y plataformas externas que se integran y agregan en tiempo real dentro del ecosistema de AcopioVE. 

La unificación de estas fuentes permite ofrecer un buscador consolidado para tareas de reunificación de personas, localización de refugios y detección de daños estructurales en zonas afectadas.

---

## 1. APIs de Datos Integradas en Tiempo Real

Estas fuentes externas se consultan directamente desde el servidor, se normalizan a un esquema común y se presentan a través del mapa de búsquedas de la aplicación:

### SOS Venezuela
* **URL base de API:** `https://sosvenezuela2026.com/api`
* **Datos consumidos:** Listado de personas desaparecidas y localizadas (`GET /persons/list?offset=&limit=`).
* **Otros endpoints disponibles:** 
  * `GET /persons/stats` (estadísticas globales de personas)
  * `GET /reports?limit=` (reporte consolidado de daños y recursos solicitados)
  * `GET /balance` (tablero de control de situación)
  * `GET /news` (noticias de última hora verificadas)
* **Formato:** JSON

### Localizados Venezuela
* **URL de API:** `https://localizadosvenezuela.com/api/v1/localizados`
* **Datos consumidos:** Directorio de personas que han sido localizadas con vida y reubicadas en albergues o centros de atención médica.
* **Formato:** JSON

### CIVIS Venezuela
* **URL de API:** `https://civisvenezuela.com/api/puntos`
* **Datos consumidos:** Directorio de puntos de salud activos, hospitales habilitados y números de contacto de cuerpos de emergencia como Protección Civil y Bomberos.
* **Formato:** JSON

### Mapa de Daños (terremotovenezuela.com)
* **URL de API:** `https://jckifxsdlnsvbztxydes.supabase.co/rest/v1/buildings` (acceso vía PostgREST de Supabase)
* **Datos consumidos:** Edificios con reporte de daño estructural severo, parcial o total, incluyendo registros multimedia y confirmación de personas atrapadas o desaparecidas en el sitio.
* **Formato:** JSON

### Reporte VE
* **URL de API:** Variable de entorno local (`$REPORTE_VE_API_URL/api/reports`)
* **Datos consumidos:** Reportes ciudadanos en vivo sobre el estado y cortes de servicios públicos esenciales (electricidad, agua potable, escasez de combustibles y medicinas).
* **Formato:** JSON

### Centros de Insumos VE
* **URL de API:** Variable de entorno local (`$INSU_CENTROS_API_URL/centros`)
* **Datos consumidos:** Directorio de centros logísticos de distribución con inventarios y requerimientos detallados de insumos médicos y humanitarios.
* **Formato:** JSON

### Hub Venezuela Ayuda
* **URL de API:** `https://terremoto.hazlohoy.org/api/v1/reports`
* **Datos consumidos:** Agregador central que integra reportes de diversas plataformas en categorías como desaparecidos, check-ins a salvo, ofertas de voluntariado y solicitudes de ayuda urgente.
* **Formato:** JSON

### ResponseGrid
* **URL de API:** `https://api.responsegrid.app/emergencies`
* **Datos consumidos:** Necesidades críticas y solicitudes validadas directamente en el terreno por equipos de primera respuesta de la emergencia activa.
* **Formato:** JSON

---

## 2. Bases de Datos de Referencia Estática

Adicionalmente, se importan y actualizan periódicamente datos de soporte técnico de las siguientes organizaciones:

* **USGS (U.S. Geological Survey):** Integración de la API de sismicidad en tiempo real para graficar epicentros, intensidades instrumentales (ShakeMaps) y réplicas.
* **Interp-Aid:** Directorio de traductores e intérpretes voluntarios para soporte telefónico e internacional multilingüe.
* **acopiovzla.com, RefugioVE e infoayudavenezuela.site:** Consolidación de inventarios históricos iniciales de centros de acopio y capacidades de refugios temporales antes del despliegue del mapa unificado.
