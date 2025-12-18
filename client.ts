import { MessageSendParams, SendMessageResponse } from "@a2a-js/sdk";
import { A2AClient } from "@a2a-js/sdk/client";
import { v4 } from "uuid";

async function sendText(url: string, text: string) { 
    const client = new A2AClient(url);
    const params: MessageSendParams = {
        message: { 
            kind: "message",
            role: "user",
            messageId: v4(),
            parts: [{ kind: "text", text }]
        },
        configuration: {
            blocking: true,
            acceptedOutputModes: ["text/plain"],
        }
    }

    const response: SendMessageResponse = await client.sendMessage(params);
    const msg = response.result;
    return msg?.parts?.[0] ?? "";
}