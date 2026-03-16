import { ConfigService } from '@nestjs/config';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGroq } from '@langchain/groq';

export interface LlmPair {
  /** Standard model — used for categorization and weekly challenges. */
  model: BaseChatModel;
  /**
   * Model with extended thinking when the provider supports it (Anthropic).
   * Falls back to the standard model for all other providers.
   */
  thinkingModel: BaseChatModel;
}

/**
 * Creates the appropriate LangChain chat model instances based on AI_PROVIDER.
 * Supported values: "anthropic" | "openai" | "groq"
 */
export function createLlmPair(config: ConfigService): LlmPair {
  const provider = config.getOrThrow<string>('AI_PROVIDER');
  const modelName = config.getOrThrow<string>('AI_MODEL');

  switch (provider) {
    case 'anthropic': {
      const apiKey = config.getOrThrow<string>('ANTHROPIC_API_KEY');
      const budgetTokens = config.getOrThrow<number>(
        'AI_THINKING_BUDGET_TOKENS',
      );
      return {
        model: new ChatAnthropic({ apiKey, model: modelName }),
        thinkingModel: new ChatAnthropic({
          apiKey,
          model: modelName,
          thinking: { type: 'enabled', budget_tokens: budgetTokens },
        }),
      };
    }

    case 'openai': {
      const apiKey = config.getOrThrow<string>('OPENAI_API_KEY');
      const m = new ChatOpenAI({ apiKey, model: modelName });
      return { model: m, thinkingModel: m };
    }

    case 'groq': {
      const apiKey = config.getOrThrow<string>('GROQ_API_KEY');
      const m = new ChatGroq({ apiKey, model: modelName });
      return { model: m, thinkingModel: m };
    }

    default:
      throw new Error(
        `Unsupported AI_PROVIDER: "${provider}". Valid values: anthropic, openai, groq`,
      );
  }
}
