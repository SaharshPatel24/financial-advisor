import { ConfigService } from '@nestjs/config';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGroq } from '@langchain/groq';
import { createLlmPair } from './llm.factory';

jest.mock('@langchain/anthropic', () => ({
  ChatAnthropic: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('@langchain/groq', () => ({
  ChatGroq: jest.fn().mockImplementation(() => ({})),
}));

function makeConfig(values: Record<string, string | number>): ConfigService {
  return {
    getOrThrow: jest.fn().mockImplementation((key: string) => {
      if (!(key in values)) throw new Error(`Missing: ${key}`);
      return values[key];
    }),
  } as unknown as ConfigService;
}

describe('createLlmPair', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('anthropic', () => {
    const config = () =>
      makeConfig({
        AI_PROVIDER: 'anthropic',
        AI_MODEL: 'claude-opus-4-6',
        ANTHROPIC_API_KEY: 'ant-key',
        AI_THINKING_BUDGET_TOKENS: 8000,
      });

    it('should create a standard ChatAnthropic model', () => {
      createLlmPair(config());
      expect(ChatAnthropic).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'ant-key',
          model: 'claude-opus-4-6',
        }),
      );
    });

    it('should create a thinking ChatAnthropic model with budget from env', () => {
      createLlmPair(config());
      expect(ChatAnthropic).toHaveBeenCalledWith(
        expect.objectContaining({
          thinking: { type: 'enabled', budget_tokens: 8000 },
        }),
      );
    });

    it('should return distinct model and thinkingModel instances', () => {
      const { model, thinkingModel } = createLlmPair(config());
      expect(model).not.toBe(thinkingModel);
    });
  });

  describe('openai', () => {
    const config = () =>
      makeConfig({
        AI_PROVIDER: 'openai',
        AI_MODEL: 'gpt-4o',
        OPENAI_API_KEY: 'oai-key',
      });

    it('should create a ChatOpenAI model', () => {
      createLlmPair(config());
      expect(ChatOpenAI).toHaveBeenCalledWith(
        expect.objectContaining({ apiKey: 'oai-key', model: 'gpt-4o' }),
      );
    });

    it('should return the same instance for model and thinkingModel', () => {
      const { model, thinkingModel } = createLlmPair(config());
      expect(model).toBe(thinkingModel);
    });
  });

  describe('groq', () => {
    const config = () =>
      makeConfig({
        AI_PROVIDER: 'groq',
        AI_MODEL: 'llama-3.3-70b-versatile',
        GROQ_API_KEY: 'groq-key',
      });

    it('should create a ChatGroq model', () => {
      createLlmPair(config());
      expect(ChatGroq).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'groq-key',
          model: 'llama-3.3-70b-versatile',
        }),
      );
    });

    it('should return the same instance for model and thinkingModel', () => {
      const { model, thinkingModel } = createLlmPair(config());
      expect(model).toBe(thinkingModel);
    });
  });

  describe('unknown provider', () => {
    it('should throw for an unsupported provider', () => {
      const config = makeConfig({ AI_PROVIDER: 'mistral', AI_MODEL: 'any' });
      expect(() => createLlmPair(config)).toThrow(
        /Unsupported AI_PROVIDER.*mistral/,
      );
    });
  });
});
