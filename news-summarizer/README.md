# News Summarizer

API que consume fuentes RSS, filtra noticias relacionadas con Venezuela y genera un resumen informativo en Markdown usando Google Gemini.

## Tecnologías

- **Runtime:** Node.js + TypeScript
- **Framework:** Express 5
- **IA:** Google Gemini 2.5 Flash (`@google/genai`)
- **Ejecución:** `tsx` (TypeScript directo, sin build)

## Requisitos

- Node.js 18+
- Una API Key de Google Gemini ([https://aistudio.google.com/apikey](https://aistudio.google.com/apikey))

## Setup

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu GEMINI_API_KEY
```

### Variables de entorno (`.env`)

| Variable         | Obligatoria | Default | Descripción              |
| ---------------- | ----------- | ------- | ------------------------ |
| `GEMINI_API_KEY` | Sí          | —       | API Key de Google Gemini |
| `PORT`           | No          | `3000`  | Puerto del servidor      |

## Ejecutar

```bash
npm run dev
```

## API

### `GET /health`

Health check del servidor.

```json
{
  "status": "available",
  "timestamp": "2026-06-28T23:00:00.000Z",
  "uptime": 123.45,
  "environment": "development"
}
```

### `POST /api/news/summary`

Genera un resumen de noticias sobre Venezuela a partir de las fuentes seleccionadas.

**Body:**

```json
{
  "sources": ["elpais", "dw", "nytimes"],
  "accountId": "user-abc-123"
}
```

- `sources` — Array con IDs de fuentes RSS. Usar `["all"]` para todas.
- `accountId` — Identificador para logging.

**Respuesta exitosa:**

```json
{
  "ok": true,
  "summary": "# Boletín de Noticias de Venezuela\n\n## Política\n..."
}
```

**IDs de fuentes disponibles:**

| ID         | Fuente                 |
| ---------- | ---------------------- |
| `elpais`   | El País (América)      |
| `rt`       | RT (Russia Today)      |
| `aporrea`  | Aporrea                |
| `dw`       | Deutsche Welle         |
| `lanacion` | La Nación              |
| `nytimes`  | New York Times (World) |

### `GET /api/news/stats`

Estadísticas de uso del servicio (persiste en `stats.json`).

```json
{
  "ok": true,
  "stats": {
    "totalRequests": 42,
    "geminiCalls": 10,
    "rssCacheHits": 15,
    "summaryCacheHits": 8,
    "requestsByEndpoint": {
      "GET /health": 10,
      "POST /api/news/summary": 32
    },
    "since": "2026-06-28T23:00:00.000Z",
    "uptime": 3600
  }
}
```

## Arquitectura

```
src/
├── index.ts                  # Entry point (Express)
├── routes/
│   ├── health.routes.ts      # GET /health
│   └── news.routes.ts        # POST /summary, GET /stats
├── controllers/
│   ├── health.controller.ts  # Lógica de health check
│   └── news.controller.ts    # Validación + orquestación
├── services/
│   ├── news.service.ts       # Core: RSS fetch, parse, filtrado, prompt assembly
│   └── llm.service.ts        # Wrapper de Google Gemini
└── utils/
    ├── cache.ts              # SimpleCache en memoria (RSS 15min, resumen 1h)
    ├── stats.ts              # StatsTracker persistente en stats.json
    └── logger.ts             # Logger con timestamp
```

### Flujo de datos

```
Cliente → POST /api/news/summary
  → news.controller valida body
  → NewsService.generateSummary(sources)
    → Por cada fuente:
        ¿Cache RSS hit? → usa datos cacheados
        ¿Miss? → fetch → parse XML → filtra keywords Venezuela → cachea
    → Une resultados
    ¿Cache resumen hit? → devuelve resumen (0 llamadas Gemini)
    ¿Miss? → llama a Gemini → cachea → devuelve
  → Respuesta al cliente
```

## Caché

| Nivel          | TTL    | Key                          | Ahorra            |
| -------------- | ------ | ---------------------------- | ----------------- |
| RSS feed       | 15 min | `rss:{sourceId}`             | Fetches repetidos |
| Resumen Gemini | 1 hora | `summary:{sourcesOrdenados}` | Llamadas a Gemini |

La caché es en memoria (se pierde al reiniciar el servidor).

## Filtro de contenido

Solo se procesan artículos que contengan alguna de estas palabras clave (case-insensitive):
`venezuela`, `caracas`, `maduro`, `chavismo`, `maracaibo`, `delcy`

El keyword matching se aplica sobre título + descripción de cada ítem RSS.

## Notas

- El proyecto se ejecuta con `tsx` (sin compilación TypeScript). No hay script `build`.
- El archivo `stats.json` se genera automáticamente en la raíz del proyecto.
- Los mensajes de error y logs están en español.
