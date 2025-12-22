/**
 * Dynamic Model Discovery Service
 * Fetches available models from provider APIs after API key is entered
 */

export interface DiscoveredModel {
  id: string;
  name: string;
  description?: string;
  provider: string;
  contextWindow?: number;
  maxOutput?: number;
}

export interface ModelDiscoveryResult {
  success: boolean;
  models: DiscoveredModel[];
  error?: string;
}

/**
 * Fetch available models from AWS Bedrock
 */
export async function fetchBedrockModels(
  apiKey: string,
  region: string = 'us-east-1'
): Promise<ModelDiscoveryResult> {
  const url = `https://bedrock.${region}.amazonaws.com/foundation-models`;

  try {

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ModelDiscovery] Bedrock error:', response.status, errorText);

      if (response.status === 401 || response.status === 403) {
        return { success: false, models: [], error: 'Invalid API key or no access' };
      }
      return { success: false, models: [], error: `Bedrock API error: ${response.status}` };
    }

    const data = await response.json();

    // Parse Bedrock model summaries
    const models: DiscoveredModel[] = (data.modelSummaries || [])
      .filter((m: { modelId: string; responseStreamingSupported?: boolean }) =>
        m.responseStreamingSupported !== false && // Only streaming-capable models
        m.modelId.includes('anthropic') // Focus on Claude models for now
      )
      .map((m: { modelId: string; modelName: string; providerName: string }) => ({
        id: `us.${m.modelId}`, // Add inference profile prefix
        name: m.modelName || m.modelId,
        provider: m.providerName || 'Unknown',
        description: `${m.providerName} model`,
      }));

    return { success: true, models };
  } catch (error) {
    console.error('[ModelDiscovery] Bedrock fetch error:', error);
    return {
      success: false,
      models: [],
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Fetch available models from OpenAI
 */
export async function fetchOpenAIModels(apiKey: string): Promise<ModelDiscoveryResult> {
  const url = 'https://api.openai.com/v1/models';

  try {

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, models: [], error: 'Invalid API key' };
      }
      return { success: false, models: [], error: `OpenAI API error: ${response.status}` };
    }

    const data = await response.json();

    // Filter for chat models
    const chatModels = (data.data || [])
      .filter((m: { id: string }) =>
        m.id.includes('gpt-4') ||
        m.id.includes('gpt-3.5') ||
        m.id.includes('gpt-3.5') ||
        m.id.includes('o1')
      )
      .map((m: { id: string }) => ({
        id: m.id,
        name: formatModelName(m.id),
        provider: 'OpenAI',
        description: getOpenAIDescription(m.id),
      }))
      .sort((a: DiscoveredModel, b: DiscoveredModel) => {
        // Sort newest first
        const order = ['o1', 'gpt-4o', 'gpt-4', 'gpt-3.5'];
        const aIdx = order.findIndex(p => a.id.includes(p));
        const bIdx = order.findIndex(p => b.id.includes(p));
        return aIdx - bIdx;
      });

    return { success: true, models: chatModels };
  } catch (error) {
    console.error('[ModelDiscovery] OpenAI fetch error:', error);
    return {
      success: false,
      models: [],
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Fetch available models from Anthropic
 */
export async function fetchAnthropicModels(apiKey: string): Promise<ModelDiscoveryResult> {
  // Anthropic doesn't have a public models endpoint, so we use a known list
  // but validate the API key with a simple request
  const url = 'https://api.anthropic.com/v1/messages';

  try {

    // Make a minimal request to validate key
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }],
      }),
    });

    // Even 400 means the key is valid (just bad request params)
    if (response.status === 401 || response.status === 403) {
      return { success: false, models: [], error: 'Invalid API key' };
    }

    // Return known Anthropic models
    const models: DiscoveredModel[] = [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', description: 'Most intelligent & efficient' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'Anthropic', description: 'Most capable (Legacy)' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'Anthropic', description: 'Fastest' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'Anthropic', description: 'Balanced (Legacy)' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'Anthropic', description: 'Fast (Legacy)' },
    ];

    return { success: true, models };
  } catch (error) {
    console.error('[ModelDiscovery] Anthropic validation error:', error);
    return {
      success: false,
      models: [],
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Fetch available models from Google AI
 */
export async function fetchGoogleModels(apiKey: string): Promise<ModelDiscoveryResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 400 || response.status === 403) {
        return { success: false, models: [], error: 'Invalid API key' };
      }
      return { success: false, models: [], error: `Google API error: ${response.status}` };
    }

    const data = await response.json();

    const models: DiscoveredModel[] = (data.models || [])
      .filter((m: { name: string; supportedGenerationMethods?: string[] }) =>
        m.supportedGenerationMethods?.includes('generateContent') &&
        m.name.includes('gemini')
      )
      .map((m: { name: string; displayName?: string; description?: string }) => ({
        id: m.name.replace('models/', ''),
        name: m.displayName || m.name,
        provider: 'Google',
        description: m.description || '',
      }));

    return { success: true, models };
  } catch (error) {
    console.error('[ModelDiscovery] Google fetch error:', error);
    return {
      success: false,
      models: [],
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// Helper functions
function formatModelName(id: string): string {
  return id
    .replace('gpt-', 'GPT-')
    .replace('-turbo', ' Turbo')
    .replace('-preview', ' Preview')
    .replace('o1-', 'O1 ')
    .replace('o3-', 'O3 ');
}

function getOpenAIDescription(id: string): string {
  if (id.includes('o1')) return 'Advanced reasoning';
  if (id.includes('gpt-4o')) return 'Multimodal flagship';
  if (id.includes('gpt-4-turbo')) return 'Fast GPT-4';
  if (id.includes('gpt-4')) return 'GPT-4';
  if (id.includes('gpt-3.5')) return 'Fast and cheap';
  return '';
}
