# Tutorial: levantar la demo A2A de extremo a extremo

## 1) Requisitos previos
- Node.js 18+ y npm.
- Un modelo LLM local compatible con la API de Ollama. Por defecto se asume `llama3.1` expuesto en `http://localhost:11434/api/generate`. Si usas otro modelo/puerto, actualiza `MODEL_NAME` y `MODEL_URL`.
- Acceso a Internet para instalar dependencias NPM la primera vez.

## 2) Instalar dependencias
En la raíz del repo:
```bash
npm install
```

## 3) Configurar variables de entorno (opcional)
Puedes sobrescribir estos valores al ejecutar cada servicio:
- `PORT`: puerto del servicio que arranca (8080 para summarizer, 8081 para ideator).
- `MODEL_URL`: URL del endpoint del LLM (por defecto `http://localhost:11434/api/generate`).
- `MODEL_NAME`: nombre del modelo a usar (por defecto `llama3.1`).
- `SUMMARIZER_URL` y `IDEATOR_URL`: URLs que usará el cliente para llamar a cada agente (por defecto `http://localhost:8080/` y `http://localhost:8081/`).

Ejemplo para cambiar puertos/modelo:
```bash
PORT=8082 MODEL_URL=http://localhost:8000/api/generate MODEL_NAME=llama3.2 npm run dev:summarizer
PORT=8083 MODEL_URL=http://localhost:8000/api/generate MODEL_NAME=llama3.2 npm run dev:ideator
SUMMARIZER_URL=http://localhost:8082/ IDEATOR_URL=http://localhost:8083/ npm run dev:client
```

## 4) Arrancar los agentes A2A
En dos terminales separados (o usando `dev:all`):
```bash
npm run dev:summarizer   # levanta el agente de resumen en http://localhost:8080
npm run dev:ideator      # levanta el agente de ideas en http://localhost:8081
```

Rutas útiles:
- Card del summarizer: `http://localhost:8080/.well-known/agent-card.json`
- Card del ideator: `http://localhost:8081/.well-known/agent-card.json`
- JSON-RPC: `http://localhost:8080/a2a/jsonrpc` y `http://localhost:8081/a2a/jsonrpc`
- REST: `http://localhost:8080/a2a/rest` y `http://localhost:8081/a2a/rest`

## 5) Ejecutar el cliente de ejemplo
Con ambos agentes arriba:
```bash
npm run dev:client
```
El cliente:
1. Pide un episodio random de la API pública de Simpsons.
2. Envía los datos al summarizer (8080) y muestra el resumen.
3. Envía el resumen al ideator (8081) y muestra ideas generadas.

## 6) Troubleshooting rápido
- Si no responde el modelo: confirma que `MODEL_URL` y `MODEL_NAME` apuntan a un endpoint vivo (p. ej. `curl http://localhost:11434/api/generate`).
- Conflicto de puertos: usa `PORT` para mover cada servicio y recuerda actualizar `SUMMARIZER_URL` y `IDEATOR_URL` en el cliente.
- Tipos TS: si ves errores de tipos, valida que `npm install` haya completado y que estés en Node 18+.
