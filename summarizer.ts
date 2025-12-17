import express, { request } from 'express';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { InMemoryTaskStore, DefaultRequestHandler, ExecutionEventBus } from '@a2a-js/sdk/server';
import { RequestContext } from '@a2a-js/sdk/server';
import { AGENT_CARD_PATH, AgentCard, Message } from '@a2a-js/sdk';
import { A2AExpressApp, agentCardHandler, jsonRpcHandler, restHandler, UserBuilder } from '@a2a-js/sdk/server/express';

const PORT = process.env.PORT || 4000;

const sumarizeCard: AgentCard = {
    name: 'summarize-card',
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

const executor = {
    cancelTask: async () => {},
    execute: async (reqCtx: RequestContext, eventBus: ExecutionEventBus): Promise<void> => { 
        const text = reqCtx.userMessage?.parts?.[0]?.kind || '';
        const prompt = `Summarize the following text in a concise manner:\n\n${text}\n\nSummary:`;

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

        const message: Message = {
            kind: 'message',
            role: "agent",
            messageId: uuidv4(),
            parts: [{ kind: 'text', text: resp?.response ?? 'No response' }],
        }

        eventBus.publish(message);
        eventBus.finished();
    }
};

const store = new InMemoryTaskStore();
const requestHandler = new DefaultRequestHandler(sumarizeCard, store, executor);

const app = express();

app.use(`/${AGENT_CARD_PATH}`, agentCardHandler({ agentCardProvider: requestHandler }));
app.use('/a2a/jsonrpc', jsonRpcHandler({ requestHandler, userBuilder: UserBuilder.noAuthentication }))
app.use('/a2a/rest', restHandler({ requestHandler, userBuilder: UserBuilder.noAuthentication}))

app.listen(PORT, () => {
    console.log(`Summarizer card is running at http://localhost:${PORT}`);
    console.log(`Agent Card: http://localhost:${PORT}/.well-known/agent-card.json`)
});

