# Fuentes de Informacion y APIs de Datos Integradas

Este documento detalla el catalogo de APIs de datos y plataformas externas que se integran y agregan en tiempo real dentro del ecosistema de AcopioVE. 

La unificacion de estas fuentes permite ofrecer un buscador consolidado para tareas de reunificacion de personas, localizacion de refugios y deteccion de danos estructurales en zonas afectadas.

---

## 1. APIs de Datos Integradas en Tiempo Real

Estas fuentes externas se consultan directamente desde el servidor, se normalizan a un esquema comun y se presentan a traves del mapa de busquedas de la aplicacion. A continuacion, se documentan sus especificaciones de acceso directo:

### SOS Venezuela
* **Proposito:** Registro de personas desaparecidas y localizadas.
* **URL base de API:** `https://sosvenezuela2026.com/api`
* **Ejemplo de peticion directa (cURL):**
  ```bash
  # Obtener listado paginado de personas
  curl -s "https://sosvenezuela2026.com/api/persons/list?offset=0&limit=100"
  
  # Obtener estadisticas globales
  curl -s "https://sosvenezuela2026.com/api/persons/stats"
  ```
* **Formato:** JSON

### Localizados Venezuela
* **Proposito:** Directorio de personas ubicadas con vida en albergues y hospitales.
* **URL de API:** `https://localizadosvenezuela.com/api/v1/localizados`
* **Ejemplo de peticion directa (cURL):**
  ```bash
  # Obtener personas localizadas con limite de resultados
  curl -s "https://localizadosvenezuela.com/api/v1/localizados?page=1&limit=100"
  ```
* **Formato:** JSON

### CIVIS Venezuela
* **Proposito:** Directorio de puntos de salud activos y telefonos de cuerpos de emergencia.
* **URL de API:** `https://civisvenezuela.com/api/puntos`
* **Ejemplo de peticion directa (cURL):**
  ```bash
  # Consultar la totalidad de puntos de salud indexados
  curl -s "https://civisvenezuela.com/api/puntos"
  ```
* **Formato:** JSON

### Mapa de Danos (terremotovenezuela.com)
* **Proposito:** Registro de edificios con dano estructural severo, parcial o total.
* **URL de API:** `https://jckifxsdlnsvbztxydes.supabase.co/rest/v1/buildings`
* **Header de Autenticacion:** `apikey: sb_publishable_i7iEDrCVZcSt0k3RGFrY4g_WrtZBB4w`
* **Ejemplo de peticion directa (cURL):**
  ```bash
  # Obtener listado de edificios danados ordenados por actualizacion
  curl -s -H "apikey: sb_publishable_i7iEDrCVZcSt0k3RGFrY4g_WrtZBB4w" \
    "https://jckifxsdlnsvbztxydes.supabase.co/rest/v1/buildings?select=id,name,address,city,zone,lat,lng,damage_level,status,last_updated_at&order=last_updated_at.desc"
  ```
* **Formato:** JSON (PostgREST de Supabase)

### Hub Venezuela Ayuda
* **Proposito:** Agregador central que integra reportes de diversas plataformas en categorias de desaparecidos, check-ins a salvo, voluntariados y solicitudes de ayuda.
* **URL de API:** `https://terremoto.hazlohoy.org/api/v1/reports`
* **Ejemplo de peticion directa (cURL):**
  ```bash
  # Buscar reportes de personas desaparecidas (missing_person)
  curl -s "https://terremoto.hazlohoy.org/api/v1/reports?type=missing_person&limit=100"

  # Buscar reportes de check-ins a salvo (checkin)
  curl -s "https://terremoto.hazlohoy.org/api/v1/reports?type=checkin&limit=100"
  ```
* **Formato:** JSON

### ResponseGrid
* **Proposito:** Necesidades criticas y solicitudes validadas directamente en el terreno.
* **URL de API:** `https://api.responsegrid.app/emergencies`
* **Ejemplo de peticion directa (cURL):**
  ```bash
  # 1. Obtener la lista de emergencias activas para identificar el ID
  curl -s "https://api.responsegrid.app/emergencies"
  
  # 2. Consultar las necesidades validadas de una emergencia especifica (reemplazar {id})
  curl -s "https://api.responsegrid.app/emergencies/{id}/public/needs"
  ```
* **Formato:** JSON

---

## 2. Bases de Datos de Referencia Estatica

Adicionalmente, se importan y actualizan periodicamente datos de soporte tecnico de las siguientes organizaciones:

* **USGS (U.S. Geological Survey):** Integracion de la API de sismicidad en tiempo real para graficar epicentros, intensidades instrumentales (ShakeMaps) y replicas.
* **Interp-Aid:** Directorio de traductores e interpretes voluntarios para soporte telefonico e internacional multilingue.
* **acopiovzla.com, RefugioVE e infoayudavenezuela.site:** Consolidacion de inventarios historicos iniciales de centros de acopio y capacidades de refugios temporales antes del despliegue del mapa unificado.
