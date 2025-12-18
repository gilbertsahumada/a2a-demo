import express from 'express';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { InMemoryTaskStore, DefaultRequestHandler, ExecutionEventBus, AgentExecutor } from '@a2a-js/sdk/server';
import { RequestContext } from '@a2a-js/sdk/server';
import { AGENT_CARD_PATH, AgentCard, Message } from '@a2a-js/sdk';
import { agentCardHandler, jsonRpcHandler, restHandler, UserBuilder } from '@a2a-js/sdk/server/express';

// Puerto del servidor; permite override por variable de entorno.
const PORT = process.env.PORT || 5000;
const MODEL_URL = process.env.MODEL_URL || 'http://localhost:11434/api/generate';
const MODEL_NAME = process.env.MODEL_NAME || 'llama3.1';

// Agent Card A2A: describe al agente, capacidades y skills disponibles.
const ideatorCard: AgentCard = {
    name: 'ideator',
    description: 'Generates ideas based on the provided input',
    url: `http://localhost:${PORT}/`,
    protocolVersion: '0.3.0',
    version: '0.1.0',
    capabilities: { streaming: false },
    defaultInputModes: ["text/plain"],
    defaultOutputModes: ["text/plain"],
    skills: [
        {
            id: 'generate-ideas',
            name: 'generate-ideas',
            description: 'Generates creative ideas based on the given text input',
            tags: ['ideation', 'creativity'],
            inputModes: ['text/plain'],
            outputModes: ['text/plain'],
        }
    ],
    supportsAuthenticatedExtendedCard: false,
};

// Executor A2A: implementa la ejecucion de tareas y publica eventos.
const executor: AgentExecutor = {
    cancelTask: async () => {},
    execute: async (reqCtx: RequestContext, eventBus: ExecutionEventBus): Promise<void> => {
        // Extrae el texto de los "parts" del mensaje del usuario.
        const text = (reqCtx.userMessage?.parts ?? [])
            .filter((part) => part.kind === 'text')
            .map((part) => part.text)
            .join('\n')
            .trim();
        const prompt = `Generate creative ideas based on the following input:\n\n${text}\n\nIdeas:`;

        // Llama a un modelo local (Ollama/compatible) para generar ideas.
        let responseText = 'Error generating ideas.';
        try {
            const resp = await fetch(MODEL_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: MODEL_NAME,
                    prompt,
                    stream: false,
                }),
            });

            if (resp.ok) {
                const data = (await resp.json()) as { response?: string };
                responseText = data?.response ?? responseText;
            }
        } catch {
            // Mantiene el mensaje de error por defecto.
        }

        // Construye el mensaje A2A de respuesta para el bus de eventos.
        const message: Message = {
            kind: 'message',
            role: "agent",
            messageId: uuidv4(),
            parts: [{ kind: 'text', text: responseText }]
        };

        // Publica el resultado y marca la tarea como finalizada.
        eventBus.publish(message);
        eventBus.finished();
    }
};

// Store en memoria para tareas A2A y handler base del SDK.
const store = new InMemoryTaskStore();
const requestHandler = new DefaultRequestHandler(ideatorCard, store ,executor);

// Servidor Express con rutas A2A (agent card, JSON-RPC y REST).
const app = express();

app.use(`/${AGENT_CARD_PATH}`, agentCardHandler({ agentCardProvider: requestHandler }));
app.use('/a2a/jsonrpc', jsonRpcHandler({ requestHandler, userBuilder: UserBuilder.noAuthentication }));
app.use('/a2a/rest', restHandler({ requestHandler, userBuilder: UserBuilder.noAuthentication }));

// Arranque del servidor y URLs utiles.
app.listen(PORT, () => {
    console.log(`Ideator agent listening at http://localhost:${PORT}`);
    console.log(`Agent Card: http://localhost:${PORT}/${AGENT_CARD_PATH}`);
});
