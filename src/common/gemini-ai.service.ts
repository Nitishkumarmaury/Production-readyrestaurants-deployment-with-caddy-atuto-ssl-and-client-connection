import { Injectable, ServiceUnavailableException } from '@nestjs/common';

type GeminiMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

@Injectable()
export class GeminiAiService {
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim() === '') return [];

    const model = this.embeddingModel();
    const response = await this.post(model, 'embedContent', {
      model: `models/${model}`,
      content: {
        parts: [{ text }],
      },
      output_dimensionality: this.embeddingDimensions(),
    });

    const values = response?.embedding?.values ?? response?.embeddings?.[0]?.values;
    if (!Array.isArray(values)) {
      throw new ServiceUnavailableException('Gemini embedding response did not include vector values.');
    }

    return values;
  }

  async generateChatReply(messages: GeminiMessage[]): Promise<string> {
    const systemInstruction = messages
      .filter((message) => message.role === 'system')
      .map((message) => message.content)
      .join('\n\n');

    const contents = messages
      .filter((message) => message.role !== 'system')
      .map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      }));

    const body: Record<string, any> = {
      contents,
      generationConfig: {
        temperature: 0.4,
      },
    };

    if (systemInstruction) {
      body.system_instruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const response = await this.post(this.chatModel(), 'generateContent', body);
    const text = response?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join('')
      .trim();

    if (!text) {
      throw new ServiceUnavailableException('Gemini response did not include text.');
    }

    return text;
  }

  private async post(model: string, action: string, body: Record<string, any>) {
    const apiKey = this.apiKey();
    const cleanModel = model.replace(/^models\//, '');
    const response = await fetch(`${this.baseUrl}/models/${cleanModel}:${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message = payload?.error?.message || response.statusText || 'Gemini API request failed.';
      throw new ServiceUnavailableException(`Gemini API request failed (${response.status}): ${message}`);
    }

    return payload;
  }

  private apiKey() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException('GEMINI_API_KEY is required for AI features.');
    }

    return apiKey;
  }

  private chatModel() {
    return process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash';
  }

  private embeddingModel() {
    return process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2';
  }

  private embeddingDimensions() {
    const dimensions = Number(process.env.GEMINI_EMBEDDING_DIMENSIONS || 1536);
    return Number.isFinite(dimensions) && dimensions > 0 ? dimensions : 1536;
  }
}
