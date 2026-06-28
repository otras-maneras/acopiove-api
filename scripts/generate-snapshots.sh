#!/usr/bin/env bash
# Script para generar snapshots estáticos de los datos de AcopioVE
# consumiendo los endpoints de la API pública local.
# Esto garantiza que los snapshots estén normalizados y siempre al día.

set -euo pipefail

# Directorio base (raíz de acopiove-api)
BASE_DIR="$(dirname "$0")/.."
cd "$BASE_DIR"

PORT=4100
API_URL="${API_URL:-http://localhost:$PORT/v1}"

echo "▶ Iniciando generación de snapshots $(date '+%F %T') usando la API: $API_URL"

# Verificar si el servidor responde
if ! curl -s -o /dev/null -w "%{http_code}\n" "$API_URL/meta" | grep -q "200"; then
  echo "Error: La API en $API_URL no responde."
  exit 1
fi

# 1. Exportar Puntos en formato JSON
echo "Generando data/puntos.json..."
curl -s "$API_URL/puntos" | jq . > data/puntos.json

# 2. Exportar Puntos en formato GeoJSON
echo "Generando data/puntos.geojson..."
curl -s "$API_URL/puntos?format=geojson" | jq . > data/puntos.geojson

# 3. Exportar Puntos en formato CSV
echo "Generando data/puntos.csv..."
curl -s "$API_URL/puntos?format=csv" > data/puntos.csv

# 4. Exportar Metadata general
echo "Generando data/meta.json..."
curl -s "$API_URL/meta" | jq . > data/meta.json


echo "Snapshots generados con éxito en la carpeta data/"
ls -la data/
