import { Message, MessageSendParams } from "@a2a-js/sdk";
import { ClientFactory } from "@a2a-js/sdk/client";
import { v4 } from "uuid";

const SUMMARIZER_URL = process.env.SUMMARIZER_URL || "http://localhost:8080";
const IDEATOR_URL = process.env.IDEATOR_URL || "http://localhost:8081";

async function sendText(url: string, text: string) {
  const factory = new ClientFactory();
  const client = await factory.createFromUrl(url);
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

  const response = await client.sendMessage(params);
  console.log("Raw response:", response);
  const result = response as Message;
  const responseText = (result.parts ?? [])
    .filter((part) => part.kind === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();

  return responseText;
}

async function main() {
  const source = await fetch("https://thesimpsonsapi.com/api/episodes")
    .then(async(res) => {
      return res.json();
    })
    .then((data) => data.results[0])
    .catch((err) => {
      console.error("Error fetching episode data:", err);
      throw err;
    });
    
  const sourceText = `Name: ${source.name}\nSeason: ${source.season}\nEpisode: ${source.episode_numer}\nSynopsis: ${source.synopsis}`;
  console.log("Source text:\n", sourceText);
  const summary = await sendText(SUMMARIZER_URL, sourceText);
  console.log("\nGenerated summary\n", summary);

  const ideas = await sendText(IDEATOR_URL, summary);
  console.log("\nGenerated ideas\n", ideas);
}

main().catch((err) => {
  console.error("Error in main:", err);
  process.exit(1);
});
