export type Provider = 'openai' | 'anthropic' | 'bedrock' | 'google';

export interface ProviderConfig {
  id: Provider;
  name: string;
  description: string;
  models: { id: string; name: string; description: string }[];
  fields: { key: string; label: string; placeholder: string; type: string }[];
}

export const providers: ProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-5, and other OpenAI models',
    models: [
      { id: 'gpt-5', name: 'GPT-5', description: 'Most capable reasoning model' },
      { id: 'gpt-5-mini', name: 'GPT-5 Mini', description: 'Fast and efficient' },
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Multimodal model' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast multimodal' },
    ],
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'sk-...', type: 'password' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models for advanced reasoning',
    models: [
      { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', description: 'Most intelligent model' },
      { id: 'claude-opus-4-1-20250805', name: 'Claude Opus 4.1', description: 'Highly capable' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Fast responses' },
    ],
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'sk-ant-...', type: 'password' },
    ],
  },
  {
    id: 'bedrock',
    name: 'AWS Bedrock',
    description: 'Amazon Bedrock with Bearer token auth',
    models: [
      // Claude 3.5 - These work with direct model IDs (most reliable)
      { id: 'anthropic.claude-3-5-sonnet-20241022-v2:0', name: 'Claude 3.5 Sonnet v2', description: '⭐ Recommended (Oct 2024)' },
      { id: 'anthropic.claude-3-5-haiku-20241022-v1:0', name: 'Claude 3.5 Haiku', description: 'Fast (Oct 2024)' },
      // Claude 3 - Legacy direct model IDs (stable)
      { id: 'anthropic.claude-3-opus-20240229-v1:0', name: 'Claude 3 Opus', description: 'Most capable 3.x' },
      { id: 'anthropic.claude-3-sonnet-20240229-v1:0', name: 'Claude 3 Sonnet', description: 'Balanced' },
      { id: 'anthropic.claude-3-haiku-20240307-v1:0', name: 'Claude 3 Haiku', description: 'Fast' },
      // Claude 4.5+ (Require inference profiles - experimental)
      { id: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0', name: 'Claude Sonnet 4.5 (US Profile)', description: 'Newest - requires profile access' },
      { id: 'us.anthropic.claude-opus-4-1-20250805-v1:0', name: 'Claude Opus 4.1 (US Profile)', description: 'Requires profile access' },
      { id: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0', name: 'Claude 3.7 Sonnet (US Profile)', description: 'Requires profile access' },
      // Other providers
      { id: 'amazon.titan-text-premier-v1:0', name: 'Amazon Titan Premier', description: 'Amazon flagship' },
      { id: 'meta.llama3-2-90b-instruct-v1:0', name: 'Llama 3.2 90B', description: 'Meta large model' },
      { id: 'mistral.mistral-large-2407-v1:0', name: 'Mistral Large', description: 'Mistral flagship' },
    ],
    fields: [
      { key: 'apiKey', label: 'Bedrock API Key', placeholder: 'Your Bedrock API key', type: 'password' },
      { key: 'region', label: 'AWS Region', placeholder: 'us-east-1', type: 'text' },
    ],
  },
  {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini models from Google',
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Most capable Gemini' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fast and efficient' },
      { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', description: 'Fastest option' },
    ],
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'AI...', type: 'password' },
    ],
  },
];

export interface StoredConfig {
  provider: Provider;
  model: string;
  credentials: Record<string, string>;
}

export const saveConfig = (config: StoredConfig) => {
  localStorage.setItem('coach-atlas-config', JSON.stringify(config));
};

export const loadConfig = (): StoredConfig | null => {
  const stored = localStorage.getItem('coach-atlas-config');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
};

export const clearConfig = () => {
  localStorage.removeItem('coach-atlas-config');
};
