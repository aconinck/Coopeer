// Anthropic SDK integration for the in-app sports assistant.
// Used for: team description writing, game scheduling suggestions, rules Q&A.
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are a helpful sports assistant inside the Coopeer app.
You help users find games, understand sports rules, and help managers
run their amateur sports teams. Keep responses concise and friendly.
You know about soccer, pickleball, basketball, tennis, and running.
When helping managers write team descriptions, make them sound welcoming and
highlight the social/community aspect alongside the competitive one.`;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendMessage(
  messages: AssistantMessage[],
  onChunk?: (delta: string) => void
): Promise<string> {
  const anthropic = getClient();

  if (onChunk) {
    // Streaming mode
    let fullText = '';
    const stream = await anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        fullText += event.delta.text;
        onChunk(event.delta.text);
      }
    }
    return fullText;
  }

  // Non-streaming mode
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  });

  const block = response.content[0];
  if (block.type !== 'text') return '';
  return block.text;
}

// Convenience helper for one-shot prompts (e.g., description generation)
export async function generateTeamDescription(
  sport: string,
  level: string,
  schedule: string,
  venueName: string
): Promise<string> {
  const prompt = `Write a 2–3 sentence team description for an amateur ${sport} team.
Level: ${level}
Schedule: ${schedule}
Venue: ${venueName}

Make it welcoming, mention the social aspect, and sound fun. No hashtags.`;

  return sendMessage([{ role: 'user', content: prompt }]);
}
