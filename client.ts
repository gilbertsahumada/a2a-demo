import { MessageSendParams } from "@a2a-js/sdk";
import { A2AClient } from "@a2a-js/sdk/client";
import { v4 } from "uuid";

async function sendText(url: string, text: string) { 
    const client = new A2AClient(url);
    const params: MessageSendParams = {
        message: { 
            
        },
        configuration: {
            blocking: true,
            acceptedOutputModes: ["text/plain"],
        }
    }

    const response = await client.sendMessage(params);
}