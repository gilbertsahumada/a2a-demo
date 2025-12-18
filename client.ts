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
      parts: [{ kind: "text", text }],
    },
    configuration: {
      blocking: true,
      acceptedOutputModes: ["text/plain"],
    },
  };

  const response: SendMessageResponse = await client.sendMessage(params);
  const msg = response.result;
  return msg?.parts?.[0] ?? "";
}

async function main() {
  const source = await fetch("https://thesimpsonsapi.com/api/episodes")
    .then((res) => res.json())
    .then((data) => data[Math.floor(Math.random() * data.length)]);

  console.log("Episode source:", source);

  const sourceText = `Title: ${source.title}\nSeason: ${source.season}\nEpisode: ${source.episode}\nAirdate: ${source.airdate}\nDescription: ${source.description}`;
  const summary = await sendText("http://localhost:8080/", sourceText);
  console.log("\nGenerated summary\n", summary);

  const ideas = await sendText("http://localhost:8081/", summary.text);
  console.log("\nGenerated ideas\n", ideas);
}
