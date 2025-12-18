import { MessageSendParams, SendMessageResponse } from "@a2a-js/sdk";
import { A2AClient } from "@a2a-js/sdk/client";
import { v4 } from "uuid";

const SUMMARIZER_URL = process.env.SUMMARIZER_URL || "http://localhost:8080/";
const IDEATOR_URL = process.env.IDEATOR_URL || "http://localhost:8081/";

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
  if ("error" in response) {
    throw new Error(response.error?.message ?? "A2A error");
  }

  const result = response.result as { parts?: { kind: string; text?: string }[] } | undefined;
  const textPart = result?.parts?.find((part) => part.kind === "text");
  return textPart?.text ?? "";
}

async function main() {
  const source = await fetch("https://thesimpsonsapi.com/api/episodes")
    .then((res) => res.json())
    .then((data) => data[Math.floor(Math.random() * data.length)]);

  console.log("Episode source:", source);

  const sourceText = `Title: ${source.title}\nSeason: ${source.season}\nEpisode: ${source.episode}\nAirdate: ${source.airdate}\nDescription: ${source.description}`;
  const summary = await sendText(SUMMARIZER_URL, sourceText);
  console.log("\nGenerated summary\n", summary);

  const ideas = await sendText(IDEATOR_URL, summary);
  console.log("\nGenerated ideas\n", ideas);
}

main().catch((err) => {
  console.error("Error in main:", err);
  process.exit(1);
});
