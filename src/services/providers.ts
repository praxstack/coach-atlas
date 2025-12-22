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
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Multimodal flagship' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and cost-effective' },
      { id: 'o1-preview', name: 'O1 Preview', description: 'Advanced reasoning' },
      { id: 'o1-mini', name: 'O1 Mini', description: 'Efficient reasoning' },
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
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Most intelligent & efficient' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most capable (Legacy)' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Fastest' },
    ],
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'sk-ant-...', type: 'password' },
    ],
  },
  {
    id: 'bedrock',
    name: 'AWS Bedrock',
    description: 'Amazon Bedrock with inference profiles',
    models: [
      // Claude 3.5 (Latest)
      { id: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0', name: 'Claude 3.5 Sonnet v2', description: 'Latest & Most Capable' },
      { id: 'us.anthropic.claude-3-5-haiku-20241022-v1:0', name: 'Claude 3.5 Haiku', description: 'Fast & Efficient' },
      // Claude 3
      { id: 'us.anthropic.claude-3-opus-20240229-v1:0', name: 'Claude 3 Opus', description: 'Highly capable (Legacy)' },
      { id: 'us.anthropic.claude-3-sonnet-20240229-v1:0', name: 'Claude 3 Sonnet', description: 'Balanced (Legacy)' },
      { id: 'us.anthropic.claude-3-haiku-20240307-v1:0', name: 'Claude 3 Haiku', description: 'Fast (Legacy)' },
      // Amazon
      { id: 'amazon.titan-text-express-v1', name: 'Titan Text Express', description: 'General purpose' },
      { id: 'amazon.titan-text-premier-v1:0', name: 'Titan Text Premier', description: 'Amazon flagship' },
      // Meta
      { id: 'meta.llama3-2-90b-instruct-v1:0', name: 'Llama 3.2 90B', description: 'Meta large model' },
      { id: 'meta.llama3-1-405b-instruct-v1:0', name: 'Llama 3.1 405B', description: 'Meta largest model' },
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
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Most capable Gemini' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast and efficient' },
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
