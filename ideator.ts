import express from 'express';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { InMemoryTaskStore, DefaultRequestHandler, ExecutionEventBus, AgentExecutor } from '@a2a-js/sdk/server';
import { RequestContext } from '@a2a-js/sdk/server';
import { AGENT_CARD_PATH, AgentCard, Message } from '@a2a-js/sdk';
import { agentCardHandler, jsonRpcHandler, restHandler, UserBuilder } from '@a2a-js/sdk/server/express';

const PORT = process.env.PORT || 5000;

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

const executor: AgentExecutor = {
    cancelTask: async () => {},
    execute: async (reqCtx: RequestContext, eventBus: ExecutionEventBus): Promise<void> => { 
        const text = reqCtx.userMessage?.parts?.[0]?.kind || '';
        const prompt = `Generate creative ideas based on the following input:\n\n${text}\n\nIdeas:`;

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
        .catch(() => ({ response: "Error generating ideas." }));

        const message: Message = {
            kind: 'message',
            role: "agent",
            messageId: uuidv4(),
            parts: [{ kind: 'text', text: resp.response }]
        };

        eventBus.publish(message);
        eventBus.finished();
    }
};

const store = new InMemoryTaskStore();
const requestHandler = new DefaultRequestHandler(ideatorCard, store ,executor);

const app = express();

app.use(`/${AGENT_CARD_PATH}`, agentCardHandler({ agentCardProvider: requestHandler }));
app.use('/a2a/jsonrpc', jsonRpcHandler({ requestHandler, userBuilder: UserBuilder.noAuthentication }));
app.use('/a2a/rest', restHandler({ requestHandler, userBuilder: UserBuilder.noAuthentication }));

app.listen(PORT, () => {
    console.log(`Ideator agent listening at http://localhost:${PORT}`);
});

app.listen(PORT, () => {
    console.log(`Ideator agent listening at http://localhost:${PORT}`);
    console.log(`Agent Card: http://localhost:${PORT}/${AGENT_CARD_PATH}`);
});
