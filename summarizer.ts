import express from 'express';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { InMemoryTaskStore, DefaultRequestHandler, ExecutionEventBus, AgentExecutor } from '@a2a-js/sdk/server';
import { RequestContext } from '@a2a-js/sdk/server';
import { AGENT_CARD_PATH, AgentCard, Message } from '@a2a-js/sdk';
import { agentCardHandler, jsonRpcHandler, restHandler, UserBuilder } from '@a2a-js/sdk/server/express';

// Puerto del servidor; permite override por variable de entorno.
const PORT = process.env.PORT || 4000;

// Agent Card A2A: describe al agente, capacidades y skills disponibles.
const sumarizeCard: AgentCard = {
    name: 'summarize',
    description: 'Summarizes the content of a card',
    url: `http://localhost:${PORT}/`,
    protocolVersion: '0.3.0',
    version: '1.0.0',
    capabilities: { streaming: false },
    defaultInputModes: ["text/plain"],
    defaultOutputModes: ["text/plain"],
    skills: [
        {
            id: 'summarize',
            name: 'summarize',
            description: 'Summarizes the given text input',
            tags: ['summarization', 'text'],
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
        // Extrae el primer "part" del mensaje del usuario (aca se usa "kind").
        const text = reqCtx.userMessage?.parts?.[0]?.kind || '';
        const prompt = `Summarize the following text in a concise manner:\n\n${text}\n\nSummary:`;

        // Llama a un modelo local (Ollama/compatible) para generar el resumen.
        const resp = await fetch("http://localhost:5000/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                model: "llama3.1",
                prompt: prompt,
                stream: false
            })
        })
        .then((x) => x.json() as Promise<{ response: string }>)
        .catch(() => ({ response: "Error generating summary." }));

        // Construye el mensaje A2A de respuesta para el bus de eventos.
        const message: Message = {
            kind: 'message',
            role: "agent",
            messageId: uuidv4(),
            parts: [{ kind: 'text', text: resp?.response ?? 'No response' }],
        }

        // Publica el resultado y marca la tarea como finalizada.
        eventBus.publish(message);
        eventBus.finished();
    }
};

// Store en memoria para tareas A2A y handler base del SDK.
const store = new InMemoryTaskStore();
const requestHandler = new DefaultRequestHandler(sumarizeCard, store, executor);

// Servidor Express con rutas A2A (agent card, JSON-RPC y REST).
const app = express();

app.use(`/${AGENT_CARD_PATH}`, agentCardHandler({ agentCardProvider: requestHandler }));
app.use('/a2a/jsonrpc', jsonRpcHandler({ requestHandler, userBuilder: UserBuilder.noAuthentication }))
app.use('/a2a/rest', restHandler({ requestHandler, userBuilder: UserBuilder.noAuthentication}))

// Arranque del servidor y URLs utiles.
app.listen(PORT, () => {
    console.log(`Summarizer card is running at http://localhost:${PORT}`);
    console.log(`Agent Card: http://localhost:${PORT}/.well-known/agent-card.json`)
});
