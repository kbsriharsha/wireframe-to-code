export const LLM_PROVIDERS = {
 gemini: {label: 'Gemini', envKey: 'GEMINI_API_KEY'},
 openai: {label: 'OpenAI', envKey: 'OPENAI_API_KEY'},
} as const;

export type LlmProvider = keyof typeof LLM_PROVIDERS;

export const MODEL_OPTIONS = {
 gemini: [
  {id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite'},
  {id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite'},
  {id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash'},
  {id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash'},
 ],
 openai: [
  {id: 'gpt-6-luna', label: 'GPT-6 Luna'},
  {id: 'gpt-6.1-sol', label: 'GPT-6.1 Sol'},
  {id: 'gpt-6-astra', label: 'GPT-6 Astra'},
 ],
} as const;

export const DEFAULT_MODELS: Record<LlmProvider, string> = {
 gemini: 'gemini-3.5-flash-lite',
 openai: 'gpt-6.1-sol',
};

export function isLlmProvider(value: unknown): value is LlmProvider {
 return value === 'gemini' || value === 'openai';
}

export function validModel(provider: LlmProvider, value: string): boolean {
 if (provider === 'gemini') return /^gemini-[a-z0-9.-]+$/.test(value);
 return MODEL_OPTIONS.openai.some(option => option.id === value);
}
