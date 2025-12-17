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

const executor: AgentExecutor = 
