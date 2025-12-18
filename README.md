# A2A Video Demo

Demo en TypeScript que conecta dos agentes A2A: un `summarizer` y un `ideator`. El cliente pide un episodio aleatorio de la API pública de Los Simpsons, lo resume y luego genera ideas a partir del resumen usando un modelo local (Ollama/compatible).

## Requisitos
- Node.js 18+ y npm.
- Endpoint de LLM accesible (por defecto `http://localhost:11434/api/generate`) con el modelo `llama3.1` descargado o equivalente.

## Instalación
```bash
npm install
```

## Scripts principales
- `npm run dev:summarizer`: arranca el agente de resumen (puerto por defecto 8080).
- `npm run dev:ideator`: arranca el agente de ideas (puerto por defecto 8081).
- `npm run dev:client`: ejecuta el cliente de ejemplo contra los dos agentes.
- `npm run dev:all`: levanta agentes y cliente en paralelo (requiere `npm-run-all` ya incluido).

## Variables de entorno
- `PORT`: puerto del servicio que arrancas (se aplica a cada agente).
- `MODEL_URL`: URL del endpoint del LLM (default `http://localhost:11434/api/generate`).
- `MODEL_NAME`: nombre del modelo a usar (default `llama3.1`).
- `SUMMARIZER_URL`: URL que usará el cliente para el resumidor (default `http://localhost:8080/`).
- `IDEATOR_URL`: URL que usará el cliente para el generador de ideas (default `http://localhost:8081/`).

## Uso rápido
1. Inicia los agentes en dos terminales:
   ```bash
   npm run dev:summarizer
   npm run dev:ideator
   ```
2. En otra terminal corre el cliente:
   ```bash
   npm run dev:client
   ```
3. Observa en consola el episodio elegido, el resumen producido y las ideas generadas.

## Estructura
- `summarizer.ts`: agente A2A que resume texto usando el LLM.
- `ideator.ts`: agente A2A que genera ideas usando el LLM.
- `client.ts`: cliente simple que orquesta las llamadas a ambos agentes.
- `tsconfig.json`: configuración TS con ESM (`NodeNext`) y `esModuleInterop`.
- `TUTORIAL.md`: guía paso a paso para levantar el entorno.

## Notas
- Las rutas del Agent Card están en `/.well-known/agent-card.json`; también hay endpoints JSON-RPC y REST bajo `/a2a/`.
- Si cambias puertos, actualiza las variables de entorno del cliente (`SUMMARIZER_URL`, `IDEATOR_URL`).
- Requiere un LLM en marcha; si el endpoint no responde, revisa `MODEL_URL` y `MODEL_NAME`.
